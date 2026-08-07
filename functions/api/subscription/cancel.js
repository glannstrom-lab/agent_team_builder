// POST /api/subscription/cancel  { team, resume? }  → { ok, endsAt?, state }
//
// Säljsidan säger "uppsägningsbart när som helst — ingen bindningstid"
// (index.html). Villkoren sa fram till i dag att uppsägning görs "skriftligt
// till info@mittaiteam.se", och portalens knapp öppnade ett förifyllt mejl.
// Det är inte "när som helst", det är "när vi läser mejlen" — och för en kund
// som vill ut är väntan på svar precis det som gör en avslutad affär till ett
// dåligt minne.
//
// En enkel väg ut är ett säljargument, inte en förlust: den som vet att hon
// kan gå när som helst vågar börja. Därför sitter uppsägningen i portalen, i
// samma spalt som allt annat, och tar effekt utan att någon människa behöver
// vara vaken.
//
// Uppsägningen tar INTE bort åtkomsten på en gång. Stripe sätter
// `cancel_at_period_end`, kunden använder teamet perioden ut, och först när
// abonnemanget faktiskt löper ut skickar Stripe customer.subscription.deleted
// — som stripe-webhook.js översätter till plan = 'cancelled'. Betald tid är
// betald tid, och vi vill inte vara den leverantör som tar tillbaka något man
// redan gett pengar för.

import { json, readJson, sessionUser, allowAttempt, clientIp } from "../auth/_lib.js";
import { stripeCall } from "../_stripe.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  // Rutten anropar Stripe, så den ska inte gå att köra i loop — även om den
  // kräver inloggning och bara kan träffa kundens eget abonnemang.
  if (!(await allowAttempt(db, "ip:cancel:" + clientIp(request), 20))) {
    return json({ error: "För många försök. Vänta en kvart och försök igen." }, 429);
  }

  const user = await sessionUser(db, request).catch(() => null);
  if (!user) return json({ error: "Logga in först.", code: "login_required" }, 401);

  const body = await readJson(request);
  const slug = typeof body.team === "string" ? body.team.trim() : "";
  if (!slug) return json({ error: "saknar team" }, 400);
  const resume = body.resume === true;

  // Ägaren, inte vem som helst med åtkomst: en inbjuden kollega ska inte kunna
  // säga upp firmans abonnemang.
  const row = await db.prepare(
    "SELECT t.slug, t.plan, t.stripe_subscription FROM teams t JOIN team_access a ON a.team_slug = t.slug " +
    "WHERE t.slug = ?1 AND a.user_id = ?2 AND a.role = 'owner'"
  ).bind(slug, user.id).first().catch(() => null);

  if (!row) return json({ error: "hittade inget team" }, 404);

  // Ingen prenumeration att säga upp. Provmånaden är ett engångsbelopp som
  // slutar av sig själv — att låtsas säga upp den vore att uppfinna ett
  // åtagande kunden inte har.
  if (!row.stripe_subscription) {
    return json({
      ok: true,
      state: "nothing_to_cancel",
      message: "Det finns inget abonnemang att säga upp — det här teamet är ett engångsköp som slutar av sig själv. "
        + "Ni behöver inte göra någonting, och ingenting dras.",
    });
  }

  let sub;
  try {
    sub = await stripeCall(
      env,
      "/subscriptions/" + encodeURIComponent(row.stripe_subscription),
      { cancel_at_period_end: resume ? "false" : "true" }
    );
  } catch (e) {
    console.error("[cancel] Stripe svarade inte", slug, String(e));
    return json({
      error: "Uppsägningen gick inte igenom just nu. Försök igen, eller mejla info@mittaiteam.se — "
        + "har ni mejlat räknas uppsägningen från det mejlet.",
    }, 502);
  }

  // Slutdatumet kommer från Stripe, inte från oss: det är deras räkning på när
  // perioden går ut som gäller, och att räkna ut ett eget datum vore ett
  // andra svar på samma fråga.
  const endsAt = Number(sub.current_period_end || (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end) || 0) * 1000 || null;

  return json({
    ok: true,
    state: resume ? "resumed" : "cancelling",
    endsAt,
  });
}
