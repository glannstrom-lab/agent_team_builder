// Skapar ett konto och kopplar det till ett team — för hand, utan mejlutskick.
//
// Det här är leveransverktyget tills köpflödet finns: när ett team är sålt och
// byggt kör du det här en gång, och kunden kan logga in med sin e-postadress.
//
//   node scripts/provision.mjs --email kund@foretag.se --team <slug> [--local]
//   node scripts/provision.mjs --email kund@foretag.se --team <slug> --config team.json
//
// --config pekar på en JSON-fil med teamkonfigen (samma form som window.TEAM
// i portal/teams/*.js). Utan den måste teamet redan finnas i databasen.
// --local kör mot den lokala D1-kopian i stället för den skarpa.
//
// Skriptet skriver INTE till databasen självt. Det skriver ut den SQL som ska
// köras och kommandot som kör den — så att man ser exakt vad som händer med
// produktionsdatan innan det händer. Klistra in kommandot för att verkställa.

import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : null;
}

const email = (arg("email") || "").trim().toLowerCase();
const slug = (arg("team") || "").trim();
const configPath = arg("config");
const local = args.includes("--local");

if (!email || !slug) {
  console.error(`
Användning:
  node scripts/provision.mjs --email <adress> --team <slug> [--config <fil.json>] [--local]

Exempel:
  node scripts/provision.mjs --email mikael@glannstrom.se --team kallaren-nord --local
`);
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email)) {
  console.error(`Ser inte ut som en e-postadress: ${email}`);
  process.exit(1);
}

// Slumpade id:n, aldrig löpnummer — ett löpnummer röjer hur många kunder
// som finns för den som ser ett enda id.
const userId = "usr_" + randomBytes(12).toString("hex");
const now = Date.now();
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const statements = [];

if (configPath) {
  const config = readFileSync(configPath, "utf8");
  try { JSON.parse(config); } catch (e) {
    console.error(`--config är inte giltig JSON: ${e.message}`);
    process.exit(1);
  }
  statements.push(
    `INSERT INTO teams (slug, config, tier, created_at) VALUES (${q(slug)}, ${q(config)}, 'self-serve', ${now}) ` +
    `ON CONFLICT(slug) DO UPDATE SET config = excluded.config;`
  );
}

statements.push(
  `INSERT INTO users (id, email, created_at) VALUES (${q(userId)}, ${q(email)}, ${now}) ` +
  `ON CONFLICT(email) DO NOTHING;`,
  // Rollen sätts till owner: den första personen på ett team ska kunna
  // bjuda in och stänga av. Ytterligare platser läggs till som 'member'.
  `INSERT INTO team_access (team_slug, user_id, role, created_at) ` +
  `SELECT ${q(slug)}, id, 'owner', ${now} FROM users WHERE email = ${q(email)} ` +
  `ON CONFLICT(team_slug, user_id) DO NOTHING;`
);

const sql = statements.join("\n");
const flag = local ? "--local" : "--remote";

console.log("\n─── SQL som körs ───────────────────────────────────────────\n");
console.log(sql);
console.log("\n─── Kör så här ─────────────────────────────────────────────\n");
// SQL:en skrivs till fil i stället för att skickas som --command. En hel
// teamkonfiguration är tiotusentals tecken, och Windows kommandorad tar slut
// vid drygt åtta tusen — med --command fungerar bara de allra minsta teamen,
// och felet ("The command line is too long") pekar inte på orsaken.
const outFile = "scripts/.provision.sql";
writeFileSync(outFile, sql + "\n", "utf8");

console.log(`\nSQL:en är skriven till ${outFile} (${sql.length} tecken).`);
console.log("\n─── Kör så här ─────────────────────────────────────────────\n");
console.log(`npx wrangler d1 execute agent-team-builder ${flag} --file ${outFile}`);
console.log(`
─── Efteråt ────────────────────────────────────────────────

Kunden loggar in på https://mittaiteam.se/portal/ med ${email}.
Koden kommer per mejl, vilket kräver att MAIL_API_KEY och MAIL_FROM är
satta. Innan avsändaren är uppsatt: sätt MAIL_PROVIDER=console, begär en
kod, och läs den ur loggen med  npx wrangler pages deployment tail
`);
