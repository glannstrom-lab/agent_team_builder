// GET /api/auth/me → vem är inloggad, och vilka team når hen
//
// Portalen anropar den här först. Svarar den 401 visas inloggningen; svarar
// den med team laddas rätt team utan att någon slug behöver stå i URL:en.
// Det är hela vinsten mot capability-länken: åtkomsten följer kontot, inte
// adressfältet, och går att ta tillbaka.

import { json, sessionUser, refreshSession } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const user = await sessionUser(db, request);
  if (!user) return json({ error: "inte inloggad" }, 401);

  // Portalen anropar den här vid varje sidladdning, vilket gör den till rätt
  // ställe att förlänga sessionen. Den som använder tjänsten hålls inloggad.
  const rolled = await refreshSession(db, user).catch(() => null);

  const { results } = await db.prepare(
    "SELECT a.team_slug, a.role, t.config, t.plan, t.created_at FROM team_access a " +
    "JOIN teams t ON t.slug = a.team_slug WHERE a.user_id = ? ORDER BY a.created_at"
  ).bind(user.id).all();

  // Bara namn och roll här — hela teamkonfigurationen hämtas när kunden
  // valt team. Annars skickar vi varje agents systemprompt vid varje
  // sidladdning, och de kan vara långa.
  //
  // plan och createdAt är undantaget: de är två tal, och utan dem kan portalen
  // inte veta att en provmånad håller på att ta slut. Att kunden får veta det
  // av oss i stället för av sitt kontoutdrag är skillnaden mellan en
  // förnyelse och ett supportärende. Fälten kan vara null — teams.plan fanns
  // inte före 0003_commerce.sql, och team som lagts upp för hand med
  // scripts/provision.mjs saknar den.
  const teams = (results || []).map((r) => {
    let company = r.team_slug;
    try { company = JSON.parse(r.config).company || company; } catch (_) { /* trasig konfig */ }
    return {
      slug: r.team_slug,
      company,
      role: r.role,
      plan: r.plan || null,
      createdAt: r.created_at || null,
    };
  });

  return json({ email: user.email, teams }, 200, rolled ? { "set-cookie": rolled } : {});
}
