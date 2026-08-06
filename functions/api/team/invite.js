// POST /api/team/invite  { slug, email }  → lägger till en kollega på teamet
//
// Hålet den täpper till: `team_access` har haft roller sedan M3, men enda vägen
// att lägga till en rad har varit scripts/provision.mjs. Nio anställda betydde
// nio manuella körningar, och frågan "hur lägger jag till mina kollegor?" hade
// inget svar på sajten.
//
// Två saker gör rutten känsligare än den ser ut:
//
//  1. Den skickar mejl till en adress som anroparen skriver in. Det är samma
//     risk som kodrutten — mejlbomb mot tredje part, och bränt avsändarrykte —
//     och den behöver samma spärr. Inloggningskravet hjälper mindre än man tror:
//     ett konto räcker för att komma hit.
//  2. Den skriver till users-tabellen. Svaret får därför inte avslöja om
//     adressen fanns sedan tidigare, annars kan en ägare med ett betalt konto
//     prova sig fram till vilka som är kunder hos oss.

import {
  json, readJson, normalizeEmail, looksLikeEmail, nowMs, randomHex,
  allowAttempt, clientIp, sendTeamInvite,
} from "../auth/_lib.js";
import { requireOwner } from "./_lib.js";

// Egna hinkar, inte kodruttens. Delade de hink skulle en inbjudan till en
// kollega äta upp hens kodförfrågningar — och en kollega som precis blivit
// inbjuden är exakt den som strax därefter försöker logga in.
const MAX_INVITES_PER_EMAIL = 3;   // per kvart, mot den inbjudna adressen
const MAX_INVITES_PER_IP = 10;     // per kvart, mot bred utskicksmissbruk

// Tak per team. Ingen affärsregel — prissteget för många platser är en offert
// och hanteras av en människa — utan ett stopp så att rutten inte går att
// använda som utskickstjänst med ett enda betalt konto som inträdesbiljett.
const MAX_MEMBERS = 50;

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const body = await readJson(request);

  const guard = await requireOwner(db, request, body.slug);
  if (guard.error) return guard.error;
  const { user, team } = guard;

  const email = normalizeEmail(body.email);
  if (!looksLikeEmail(email)) {
    return json({ error: "Det där ser inte ut som en e-postadress." }, 400);
  }

  // Egen adress: säg det i stället för att skicka ett mejl till sig själv om
  // ett team man redan äger. Ingen läcka — ägaren skrev sin egen adress.
  if (email === user.email) {
    return json({ error: "Du har redan åtkomst till teamet — det är ditt." }, 400);
  }

  // Spärren räknas efter ägarkontrollen men före allt arbete: en angripare
  // utan konto ska inte kunna fylla throttle-tabellen genom att skjuta
  // adresser mot rutten.
  const byEmail = await allowAttempt(db, "email:inv:" + email, MAX_INVITES_PER_EMAIL);
  const byIp = await allowAttempt(db, "ip:inv:" + (clientIp(request) || "okänd"), MAX_INVITES_PER_IP);
  if (!byEmail || !byIp) {
    return json({ error: "För många inbjudningar just nu. Vänta en kvart och försök igen." }, 429);
  }

  const seats = await db.prepare("SELECT COUNT(*) AS n FROM team_access WHERE team_slug = ?")
    .bind(team.slug).first();
  if (seats && seats.n >= MAX_MEMBERS) {
    return json({ error: "Teamet har nått taket för antal platser. Hör av dig så löser vi det." }, 409);
  }

  const t = nowMs();
  const userId = "usr_" + randomHex(12);

  // Två skrivningar i en batch, som D1 kör som en transaktion. Halvvägs vore
  // ett konto utan team — en rad som ingen någonsin kommer åt.
  //
  // Båda är idempotenta med flit. Att bjuda in samma person två gånger ska
  // vara ofarligt (en ägare vet inte alltid vem hen redan lagt till), och
  // DO NOTHING på access-raden är dessutom det som skyddar rollen: hade den
  // varit DO UPDATE hade en ägare som bjöd in sig själv degraderat sig till
  // member, och teamet blivit ägarlöst.
  try {
    await db.batch([
      db.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING")
        .bind(userId, email, t),
      db.prepare(
        "INSERT INTO team_access (team_slug, user_id, role, invited_by, created_at) " +
        "SELECT ?, id, 'member', ?, ? FROM users WHERE email = ? " +
        "ON CONFLICT(team_slug, user_id) DO NOTHING"
      ).bind(team.slug, user.id, t, email),
    ]);
  } catch (e) {
    console.error("[team] kunde inte lägga till medlem", team.slug, String(e));
    return json({ error: "Kunde inte lägga till platsen. Försök igen." }, 500);
  }

  // Åtkomsten skrivs före mejlet, aldrig tvärtom. Går mejlet fram men
  // databasen inte, står kollegan utanför en dörr hen fått nyckeln till. Går
  // databasen fram men inte mejlet, har hen åtkomst och behöver bara få veta
  // det — och den som får veta det är ägaren, i svaret nedan.
  let mailed = true;
  try {
    await sendTeamInvite(env, email, { company: team.company, invitedBy: user.email });
  } catch (_) {
    mailed = false;
    console.error("[team] inbjudningsmejl misslyckades", team.slug);
  }

  // Samma svar oavsett om adressen redan hade konto, redan var medlem, eller
  // är helt ny. Ägaren skrev själv adressen och lär sig ingenting om vår
  // kundlista av svaret.
  return json({
    ok: true,
    mailed,
    message: mailed
      ? `${email} är tillagd och har fått ett mejl om hur hen loggar in.`
      : `${email} är tillagd, men mejlet gick inte fram. Säg till hen att logga in på mittaiteam.se/portal/ med sin adress.`,
  });
}
