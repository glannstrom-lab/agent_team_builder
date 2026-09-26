// Provmånadens påminnelse (P3, 2026-09-26).
//
// Portalens provmånadskort (TRIAL_LENGTH_DAYS i portal/app.js) syns bara för
// den som loggar in — och "vecka tre kommer hon inte ihåg att logga in"
// (digest/run.js). Här går ett mejl till teamets ägare när fem dagar återstår.
//
// Körs av /api/digest/run varje timme, samma klocka som veckobrevet och
// gallringen. Idempotent utan migration: att mejlet gått bokförs som en rad i
// ai_usage med subject "provpåminnelse:<slug>" — samma grepp som webbsökningarna
// och byggets dygnsrad. Mejlet skickas en gång per team, någon gång under dag 25.

import { TRIAL_DAYS, DAY_MS } from "./_plan.js";

export const PÅMINN_DAGAR_KVAR = 5;
const MAX_PER_KÖRNING = 50;

export async function provmånadsPåminnelser(db, env, nu, skicka) {
  const från = nu - (TRIAL_DAYS - PÅMINN_DAGAR_KVAR + 1) * DAY_MS; // skapat för högst 26 dagar sedan
  const till = nu - (TRIAL_DAYS - PÅMINN_DAGAR_KVAR) * DAY_MS;     // och minst 25
  const r = await db.prepare(
    "SELECT t.slug, t.config, t.created_at, u.email FROM teams t " +
    "JOIN team_access a ON a.team_slug = t.slug AND a.role = 'owner' " +
    "JOIN users u ON u.id = a.user_id " +
    "WHERE t.plan = 'trial' AND t.created_at > ? AND t.created_at <= ? " +
    "AND NOT EXISTS (SELECT 1 FROM ai_usage x WHERE x.subject = 'provpåminnelse:' || t.slug) LIMIT ?"
  ).bind(från, till, MAX_PER_KÖRNING).all();
  const rader = (r && r.results) || [];
  let skickade = 0;
  for (const rad of rader) {
    let company = "";
    try { company = (JSON.parse(rad.config || "{}").company) || ""; } catch (_) { /* trasig konfig — skicka ändå */ }
    const slut = new Date(rad.created_at + TRIAL_DAYS * DAY_MS);
    const slutdatum = `${slut.getUTCDate()}/${slut.getUTCMonth() + 1}`;
    const dagar = Math.max(1, Math.ceil((rad.created_at + TRIAL_DAYS * DAY_MS - nu) / DAY_MS));
    try {
      await skicka(env, rad.email, { company, dagar, slutdatum, slug: rad.slug });
      // Bokförs först när mejlet gått — misslyckas det försöker nästa timme igen.
      await db.prepare("INSERT INTO ai_usage (subject, period, calls) VALUES (?, ?, 1) ON CONFLICT(subject, period) DO NOTHING")
        .bind("provpåminnelse:" + rad.slug, new Date(nu).toISOString().slice(0, 7)).run();
      skickade++;
    } catch (e) {
      console.error("[provmånad] påminnelsen gick inte", rad.slug, String(e).slice(0, 200));
    }
  }
  return skickade;
}
