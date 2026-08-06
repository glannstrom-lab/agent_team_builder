// GET /api/team/members?slug=...  → vilka når teamet
//
// Läsningen som gör inbjudningarna begripliga: utan en lista vet ägaren inte
// vem hen redan lagt till, och den enda vägen att ta reda på det är att bjuda
// in samma person igen och se vad som händer.
//
// Bara ägaren ser listan. En medlem som fick se den skulle få ut kollegornas
// adresser ur ett system de anslutit till för att chatta med sitt team — det
// är mer än vad de gick med på.

import { json } from "../auth/_lib.js";
import { requireOwner } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const slug = new URL(request.url).searchParams.get("slug");
  const guard = await requireOwner(db, request, slug);
  if (guard.error) return guard.error;
  const { user, team } = guard;

  const { results } = await db.prepare(
    "SELECT u.email, a.role, a.created_at FROM team_access a " +
    "JOIN users u ON u.id = a.user_id WHERE a.team_slug = ? ORDER BY a.created_at"
  ).bind(team.slug).all();

  // `self` finns för att gränssnittet ska kunna gråa ut sin egen bort-knapp i
  // stället för att först låta ägaren klicka och sedan förklara varför det inte
  // gick. Regeln bor ändå i /api/team/remove — det här är bara artighet.
  const members = (results || []).map((r) => ({
    email: r.email,
    role: r.role,
    addedAt: r.created_at,
    self: r.email === user.email,
  }));

  return json({ slug: team.slug, company: team.company, members });
}
