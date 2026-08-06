// POST /api/team/remove  { slug, email }  → tar bort en plats på teamet
//
// POST och inte DELETE: rutten anropas från portalen med JSON-kropp, och
// DELETE med kropp är ett gränsland som proxyer och mellanlager hanterar
// olika. Metoden är låst i functions/_middleware.js oavsett.
//
// Det här är den halva av platshanteringen som faktiskt måste fungera dagen
// någon slutar. Ett team_access-rad som går att ta bort är hela skälet till
// att M3 lämnade capability-länken: en länk gick inte att ta tillbaka.

import { json, readJson, normalizeEmail, nowMs } from "../auth/_lib.js";
import { requireOwner } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const body = await readJson(request);

  const guard = await requireOwner(db, request, body.slug);
  if (guard.error) return guard.error;
  const { user, team } = guard;

  const email = normalizeEmail(body.email);
  if (!email) return json({ error: "Ingen adress angiven." }, 400);

  // Egen adress: eget svar. Regeln nedan (bara member-rader tas bort) täcker
  // fallet ändå, men "du kan inte ta bort dig själv" är det ägaren behöver
  // läsa, inte "personen är inte medlem".
  if (email === user.email) {
    return json({
      error: "Du kan inte ta bort dig själv — då står teamet utan ägare. Hör av dig om ägarskapet ska flyttas.",
    }, 400);
  }

  // Bara member-rader går att ta bort, aldrig owner-rader. Regeln är bredare
  // än självborttagningen med flit: skulle ett team någon gång få två ägare
  // kan de annars ta bort varandra, och den som hinner först äger teamet.
  // Ägarbyten är sällsynta nog att göra för hand.
  const target = await db.prepare(
    "SELECT a.user_id, a.role FROM team_access a JOIN users u ON u.id = a.user_id " +
    "WHERE a.team_slug = ? AND u.email = ?"
  ).bind(team.slug, email).first();

  if (target && target.role === "owner") {
    return json({ error: "Den här personen är ägare av teamet och kan inte tas bort här." }, 400);
  }

  // Ingen rad att ta bort är inget fel: begäran "den här personen ska inte ha
  // åtkomst" är uppfylld. Ett felsvar hade dessutom skilt "finns inte som
  // konto" från "är inte medlem hos dig", och det första är inte ägarens data.
  if (!target) return json({ ok: true, removed: false, message: `${email} har ingen plats på teamet.` });

  // Tre steg i en transaktion, och de två sista är städning:
  //
  //   1. platsen tas bort — det är själva åtgärden
  //   2. sessioner raderas OM personen inte har någon plats kvar någonstans,
  //      så att en öppen flik faller tillbaka till inloggningen i stället för
  //      att fortsätta se ett team hen inte längre når
  //   3. kontot raderas på samma villkor — en e-postadress utan team är en
  //      personuppgift vi inte har någon anledning att spara
  //
  // Villkoret upprepas i varje sats i stället för att räknas fram i förväg:
  // steg 1 ändrar svaret på frågan, och det är efter steg 1 den ska ställas.
  const t = nowMs();
  try {
    await db.batch([
      db.prepare("DELETE FROM team_access WHERE team_slug = ? AND user_id = ?").bind(team.slug, target.user_id),
      db.prepare("DELETE FROM sessions WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM team_access WHERE user_id = ?)")
        .bind(target.user_id, target.user_id),
      db.prepare("DELETE FROM users WHERE id = ? AND NOT EXISTS (SELECT 1 FROM team_access WHERE user_id = ?)")
        .bind(target.user_id, target.user_id),
    ]);
  } catch (e) {
    console.error("[team] kunde inte ta bort medlem", team.slug, t, String(e));
    return json({ error: "Kunde inte ta bort platsen. Försök igen." }, 500);
  }

  // Kvarstår efter borttagningen: den som hunnit spara teamets slug når
  // fortfarande /api/teams/:slug, som är en capability-URL utan inloggning,
  // och portalen har en kopia av konfigurationen i webbläsarens localStorage.
  // Åtkomsten till kontot är borta; en gammal kopia av teamet är det inte.
  // Att täppa till det kräver att capability-läsningen kräver session, vilket
  // skulle stänga av de team som säljs utan konto.
  return json({ ok: true, removed: true, message: `${email} har inte längre åtkomst till teamet.` });
}
