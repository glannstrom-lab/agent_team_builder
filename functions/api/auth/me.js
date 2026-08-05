// GET /api/auth/me → vem är inloggad, och vilka team når hen
//
// Portalen anropar den här först. Svarar den 401 visas inloggningen; svarar
// den med team laddas rätt team utan att någon slug behöver stå i URL:en.
// Det är hela vinsten mot capability-länken: åtkomsten följer kontot, inte
// adressfältet, och går att ta tillbaka.

import { json, sessionUser } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const user = await sessionUser(db, request);
  if (!user) return json({ error: "inte inloggad" }, 401);

  const { results } = await db.prepare(
    "SELECT a.team_slug, a.role, t.config FROM team_access a " +
    "JOIN teams t ON t.slug = a.team_slug WHERE a.user_id = ? ORDER BY a.created_at"
  ).bind(user.id).all();

  // Bara namn och roll här — hela teamkonfigurationen hämtas när kunden
  // valt team. Annars skickar vi varje agents systemprompt vid varje
  // sidladdning, och de kan vara långa.
  const teams = (results || []).map((r) => {
    let company = r.team_slug;
    try { company = JSON.parse(r.config).company || company; } catch (_) { /* trasig konfig */ }
    return { slug: r.team_slug, company, role: r.role };
  });

  return json({ email: user.email, teams });
}
