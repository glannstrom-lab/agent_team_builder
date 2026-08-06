// Delade byggstenar för teamadministrationen (invite / members / remove).
// Inledande understreck: filen routas inte av Pages Functions, den är ett
// bibliotek.
//
// Allt tre rutterna har gemensamt bor här, för de har samma vaktpost och
// samma sätt att inte röja något. Skulle en av dem svara annorlunda än de
// andra på ett team som inte finns, blir just den rutten kartläggningsverktyget.

import { json, sessionUser } from "../auth/_lib.js";

// Slug:ar är antingen 22 slumpade tecken från köpflödet (_stripe.js newSlug)
// eller handskrivna med bindestreck från scripts/provision.mjs. Filtret finns
// inte för SQL:ens skull — allt binds som parameter — utan för att en slug
// hamnar i loggar och felsvar, och det som aldrig når dit behöver ingen
// eftertanke.
export function looksLikeSlug(slug) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(slug);
}

// Samma svar på "teamet finns inte" som på "du äger det inte". Skiljer de sig
// blir rutten ett sätt att prova sig fram till vilka slugs som finns — och en
// slug är fortfarande en capability: /api/teams/:slug lämnar ut hela
// teamkonfigurationen till den som har den, utan inloggning.
const NO_ACCESS = { error: "Teamet finns inte, eller så är du inte ägare till det." };

// Vaktpost för alla tre rutterna. Returnerar antingen { error: Response } som
// anroparen ska returnera rakt av, eller { user, team } när allt stämmer.
//
// Sessionen förlängs INTE här. Det görs i /api/auth/me, som portalen ändå
// ringer vid varje sidladdning; att skriva till sessions-tabellen från fler
// ställen ger fler skrivningar utan att kunden hålls inloggad en minut längre.
export async function requireOwner(db, request, rawSlug) {
  const slug = String(rawSlug || "").trim();
  if (!looksLikeSlug(slug)) return { error: json({ error: "okänt team" }, 400) };

  const user = await sessionUser(db, request);
  if (!user) return { error: json({ error: "inte inloggad" }, 401) };

  // En fråga, inte två: rollen och teamets namn hämtas i samma svep eftersom
  // både inbjudningsmejlet och medlemslistan behöver namnet.
  const row = await db.prepare(
    "SELECT a.role, t.config FROM team_access a " +
    "JOIN teams t ON t.slug = a.team_slug " +
    "WHERE a.team_slug = ? AND a.user_id = ?"
  ).bind(slug, user.id).first();

  // 404 och inte 403: ett 403 bekräftar att teamet finns.
  if (!row || row.role !== "owner") return { error: json(NO_ACCESS, 404) };

  let company = slug;
  try { company = JSON.parse(row.config).company || slug; } catch (_) { /* trasig konfig */ }

  return { user, team: { slug, company } };
}
