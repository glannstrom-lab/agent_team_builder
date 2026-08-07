// GET /api/teams/:slug
// Returnerar ett moln-sparat team (JSON) som portalen laddar efter inloggning.
//
// KRÄVER INLOGGNING sedan 2026-08-06. Tidigare var slugen en capability: 22
// slumpade tecken räckte för att läsa hela teamet, utan konto. Det var ett
// medvetet val när team såldes utan konton — men sedan M3 finns konton, och då
// är den öppna vägen bara en glugg:
//
//  - En länk går inte att återkalla. Den som en gång fått den har den kvar.
//  - Den läcker via webbhistorik, delade skärmar och vidarebefordrade mejl.
//  - En kollega som tas bort ur team_access behöll åtkomsten ändå, vilket
//    gjorde hela borttagningsfunktionen till en illusion.
//
// Inbyggda exempelteam ("coachonline" m.fl.) serveras statiskt från
// portal/teams/<slug>.js och når aldrig hit, så demoläget påverkas inte.

import { json, nowMs, sessionUser } from "../auth/_lib.js";
import { planState, planUpdateSql, wasEverPaid } from "../_plan.js";

export async function onRequestGet(context) {
  const { params, env, request, waitUntil } = context;
  const slug = (params.slug || "").trim();

  if (!slug) return json({ error: "saknar slug" }, 400);
  // Moln-team får slugs på ≥128 bitar slump (~22 base62-tecken, se spec §5).
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(slug)) return json({ error: "ogiltig slug" }, 400);
  if (!env || !env.DB) return json({ error: "ingen databas konfigurerad" }, 500);

  const user = await sessionUser(env.DB, request);
  if (!user) return json({ error: "Logga in för att öppna teamet." }, 401);

  let row;
  try {
    // Åtkomsten avgörs av team_access, inte av att slugen är känd. En rad som
    // tas bort ska stänga dörren i samma sekund — det är hela skillnaden mot
    // den gamla länken.
    row = await env.DB.prepare(
      "SELECT t.config, t.plan, t.created_at FROM teams t JOIN team_access a ON a.team_slug = t.slug " +
      "WHERE t.slug = ?1 AND a.user_id = ?2"
    ).bind(slug, user.id).first();
  } catch (e) {
    return json({ error: "databasfel" }, 500);
  }

  // Samma svar på "finns inte" som på "du når det inte". Skillnaden vore ett
  // sätt att prova sig fram till vilka slugs som existerar.
  if (!row || !row.config) return json({ error: "hittade inget team" }, 404);

  // Planen avgör här, inte bara i /api/ai. Tidigare levererades hela teamet
  // till en kund vars provmånad tagit slut, och spärren visade sig först när
  // hon skrivit ett meddelande — som en felbubbla, i ett läge där hon trodde
  // att allt fungerade. Nu ser hon den låsta vyn direkt, med vägen vidare.
  const now = nowMs();
  const plan = planState(row, now);
  if (!plan.ok) {
    if (plan.expire) {
      waitUntil(env.DB.prepare(planUpdateSql()).bind("expired", now, slug).run().catch(() => {}));
    }
    // Företagsnamnet följer med: den låsta vyn ska kunna säga "Lerverks team
    // är byggt men inte igång" i stället för "ert team". Namnet är kundens
    // eget och hon är inloggad med åtkomst till raden — inget läcker.
    let company = null;
    try { company = JSON.parse(row.config).company || null; } catch (_) { /* trasig konfig */ }
    return json({
      error: "Teamets plan har tagit slut.",
      code: "plan_ended",
      plan: plan.reason,
      company,
      canResume: wasEverPaid(plan.plan),
    }, 402);
  }

  // config är redan en JSON-sträng (window.TEAM-formatet) — skicka rakt igenom.
  return new Response(row.config, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
