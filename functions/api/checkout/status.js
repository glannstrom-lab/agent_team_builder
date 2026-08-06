// GET /api/checkout/status?session_id=cs_...
//
// Aktiveringssidan pollar den här medan webhooken hinner ikapp. Betalningen är
// klar i kundens webbläsare innan Stripe hunnit tala om det för oss — utan den
// här rutten möts kunden av "hittade inget team" i några sekunder efter att ha
// betalat, vilket är exakt fel ögonblick att se ut som ett fel.

import { json } from "../auth/_lib.js";

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  // Stripes sessions-id är oguessbart och fungerar därför som nyckel här. Att
  // ändå kräva rätt form gör att slarv (tom sträng, en slug, ett mejl) inte
  // blir en databasfråga.
  if (!/^cs_[A-Za-z0-9_]{10,120}$/.test(sessionId)) return json({ error: "ogiltigt session_id" }, 400);

  const team = await db.prepare("SELECT slug FROM teams WHERE stripe_session = ?")
    .bind(sessionId).first();

  if (team) {
    // Mejladressen skickas tillbaka så att inloggningsrutan kan förifyllas.
    // Den är kundens egen, och den som har sessions-id:t har just betalat.
    const owner = await db.prepare(
      "SELECT u.email AS email FROM team_access a JOIN users u ON u.id = a.user_id " +
      "WHERE a.team_slug = ? AND a.role = 'owner' LIMIT 1"
    ).bind(team.slug).first();

    return json({ ready: true, slug: team.slug, email: (owner && owner.email) || null });
  }

  // Skilj "vänta lite" från "det här blev fel". Finns utkastet kvar är
  // betalningen på väg; finns det inte alls är sessionen inte vår.
  const pending = await db.prepare("SELECT id FROM pending WHERE stripe_session = ?")
    .bind(sessionId).first();

  return json({ ready: false, known: !!pending });
}
