// POST /api/subscription/withdraw  { team }  → { ok, state, message }
//
// Ångerknappen. Villkoren har lovat ångerrätt sedan de skrevs, men vägen att
// utöva den var ett mejl — och `villkor.html` bar sin egen anteckning om att
// den dagen det byggs ett köpflöde med direktbetalning på webbplatsen måste
// ångerrätten också finnas som en tydlig, lättåtkomlig knapp i samma
// gränssnitt, tillgänglig under hela fristen. Kassan byggdes 2026-08-06.
// Villkoret inträffade alltså då, och knappen fanns inte förrän nu (ROADMAP
// BL2).
//
// Skillnaden mot /api/subscription/cancel är inte kosmetisk:
//
//   uppsägning  = jag vill sluta framöver → gäller vid periodens slut, betald
//                 tid är betald tid
//   ångerrätt   = köpet ska göras ogjort → åtkomsten upphör nu och pengarna
//                 går tillbaka
//
// Att lägga dem i samma rutt hade tvingat fram en flagga som avgör vilket av
// två helt olika löften kunden får, och den flaggan hade förr eller senare
// pekat fel.
//
// VAD RUTTEN INTE GÖR: den betalar inte tillbaka automatiskt. Att flytta
// pengar utan att en människa tittat är ett större beslut än att stänga en
// dörr, och Stripes återbetalning går inte att ångra. Rutten avslutar
// abonnemanget, spärrar teamet och mejlar både kunden och oss — inom den frist
// villkoren utlovar (14 dagar) hinner en människa göra själva utbetalningen.

import { json, readJson, sessionUser, allowAttempt, clientIp, sendWithdrawalNotice } from "../auth/_lib.js";
import { stripeCall } from "../_stripe.js";
import { planUpdateSql, PLANS_WITHOUT_PORTAL } from "../_plan.js";

// 14 dagar från att avtalet ingicks (villkor.html §15, distansavtalslagen).
export const WITHDRAWAL_DAYS = 14;
const DAY_MS = 86_400_000;

/**
 * När ingicks det avtal kunden kan ångra?
 *
 * `teams.created_at` räcker inte: en kund som börjar med provmånaden och efter
 * 30 dagar uppgraderar till standard har ingått ETT NYTT avtal, och fristen för
 * det räknas från uppgraderingen — inte från den dag hon byggde teamet. Vid en
 * uppgradering skriver webhooken en ny plan, och `plan_changed_at` med den.
 *
 * Skrivningar som *stänger* ett team (expired, cancelled, past_due, refunded)
 * sätter samma kolumn, men de filtreras bort av anroparen: ett spärrat team har
 * inget löpande köp att ångra. Kvar blir alltså bara de skrivningar som är köp.
 *
 * Ren funktion, ingen databas och inget Date.now() — samma skäl som i _plan.js,
 * så att den går att testa utan att något av Cloudflare startas.
 */
export function purchasedAt(row) {
  const skapad = Number(row && row.created_at) || 0;
  const ändrad = Number(row && row.plan_changed_at) || 0;
  return Math.max(skapad, ändrad);
}

/** Är fristen kvar? `null` i startpunkt betyder "vet inte" och ger nej. */
export function withinWithdrawalWindow(row, now) {
  const köpt = purchasedAt(row);
  if (!köpt) return { open: false, endsAt: null, purchasedAt: 0 };
  const endsAt = köpt + WITHDRAWAL_DAYS * DAY_MS;
  return { open: now < endsAt, endsAt, purchasedAt: köpt };
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  // Rutten skickar mejl och rör Stripe. Samma spärr som uppsägningen.
  if (!(await allowAttempt(db, "ip:withdraw:" + clientIp(request), 20))) {
    return json({ error: "För många försök. Vänta en kvart och försök igen." }, 429);
  }

  const user = await sessionUser(db, request).catch(() => null);
  if (!user) return json({ error: "Logga in först.", code: "login_required" }, 401);

  const body = await readJson(request);
  const slug = typeof body.team === "string" ? body.team.trim() : "";
  if (!slug) return json({ error: "saknar team" }, 400);

  // Ägaren, inte vem som helst med åtkomst — det är ägaren som är avtalspart.
  const row = await db.prepare(
    "SELECT t.slug, t.plan, t.created_at, t.plan_changed_at, t.stripe_subscription, t.config " +
    "FROM teams t JOIN team_access a ON a.team_slug = t.slug " +
    "WHERE t.slug = ?1 AND a.user_id = ?2 AND a.role = 'owner'"
  ).bind(slug, user.id).first().catch(() => null);

  if (!row) return json({ error: "hittade inget team" }, 404);

  let company = slug;
  try { company = JSON.parse(row.config).company || slug; } catch (_) { /* trasig konfig */ }

  // Redan spärrat: det finns inget löpande köp att ångra. Svaret är 200 och
  // inte ett fel — kunden gjorde inget tokigt, hon är bara redan ute.
  if (PLANS_WITHOUT_PORTAL.has(String(row.plan || ""))) {
    return json({
      ok: true,
      state: "nothing_to_withdraw",
      message: "Det här teamet har redan avslutats. Har du betalat för något du inte fått, mejla info@mittaiteam.se "
        + "så reder vi ut det.",
    });
  }

  const fönster = withinWithdrawalWindow(row, Date.now());
  if (!fönster.open) {
    // Utanför fristen svarar vi inte "nej" och stänger dörren. Fristen kan ha
    // börjat löpa vid en annan tidpunkt än vår tidsstämpel säger, och den
    // bedömningen ska en människa göra — inte en jämförelse mellan två tal.
    return json({
      ok: false,
      state: "window_closed",
      message: "De 14 dagarna har passerat enligt vår notering. Menar du att fristen fortfarande löper — hör av dig till "
        + "info@mittaiteam.se, så tittar vi på det. Vill du i stället avsluta framåt använder du \"Säg upp\".",
    });
  }

  // Abonnemanget avslutas direkt, inte vid periodens slut. Ett ångrat köp ska
  // inte fortsätta löpa. Går det inte igenom avbryter vi HELA anmälan i stället
  // för att spärra teamet och lämna abonnemanget rullande — den ordningen ger
  // en kund utan tjänst som ändå debiteras, vilket är det värsta av utfallen.
  if (row.stripe_subscription) {
    try {
      await stripeCall(env, "/subscriptions/" + encodeURIComponent(row.stripe_subscription), null, null, "DELETE");
    } catch (e) {
      console.error("[ångerrätt] Stripe avslutade inte abonnemanget", slug, String(e));
      return json({
        error: "Anmälan gick inte igenom just nu. Försök igen, eller mejla info@mittaiteam.se — "
          + "har du mejlat räknas ångerrätten från det mejlet.",
      }, 502);
    }
  }

  const nu = Date.now();
  try {
    await db.prepare(planUpdateSql()).bind("refunded", nu, slug).run();
  } catch (e) {
    console.error("[ångerrätt] kunde inte skriva planen", slug, String(e));
    return json({
      error: "Anmälan är mottagen men kunde inte registreras. Mejla info@mittaiteam.se så bekräftar vi för hand.",
    }, 500);
  }

  // Mejlet sist, och dess utfall får inte kasta: anmälan ÄR registrerad i det
  // ögonblick raden skrivits. Går kvittot inte fram står det i svaret nedan,
  // så att kunden vet att hon inte behöver vänta på ett mejl som aldrig kommer.
  let mailed = true;
  try {
    await sendWithdrawalNotice(env, user.email, { company, slug, plan: row.plan, when: nu });
  } catch (_) {
    mailed = false;
    console.error("[ångerrätt] kvittot gick inte fram", slug);
  }

  return json({
    ok: true,
    state: "withdrawn",
    mailed,
    message: mailed
      ? "Anmälan är mottagen. Åtkomsten är avslutad och pengarna betalas tillbaka inom 14 dagar. Ett kvitto ligger i din inkorg."
      : "Anmälan är mottagen och registrerad. Åtkomsten är avslutad och pengarna betalas tillbaka inom 14 dagar — "
        + "kvittomejlet gick dock inte fram, så hör av dig till info@mittaiteam.se om du vill ha det skriftligt.",
  });
}
