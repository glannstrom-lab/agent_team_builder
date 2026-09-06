// Sätter upp en INLOGGAD kund i den lokala D1-kopian, så att portalen går att
// öppna i sitt riktiga läge — inte i demoläge.
//
//   node .claude/skills/portal-med-ogon/satt-upp-lokalt.mjs --team coachonline
//   node .claude/skills/portal-med-ogon/satt-upp-lokalt.mjs --team coachonline --plan trial
//   node .claude/skills/portal-med-ogon/satt-upp-lokalt.mjs --config utkast.json --slug provteam
//
// Varför: demoläget stänger av precis de ytor som byggts blint — rutinernas
// avbockning (P6), Utveckla teamet (P4), sparad tid (OM5), provmånadskortet
// (KR3) och veckopulsen (RE1). De går bara att se som inloggad kund med en rad
// i team_access.
//
// Den vanliga vägen dit är en engångskod per mejl. Den fungerar lokalt med
// MAIL_PROVIDER=console, men koden måste då fiskas ur wranglers logg. Det här
// skriptet hoppar över mejlsteget genom att skriva sessionsraden direkt —
// sessions bär bara en SHA-256 av token, så token kan väljas här och kakan
// sättas i webbläsaren.
//
// SKRIVER INTE SJÄLVT. Som provision.mjs skriver det ut SQL:en och kommandot,
// så att man ser vad som händer innan det händer. --local är default och
// --remote finns inte: det här är en testfixtur, inte ett leveransverktyg.
// Ska en riktig kund läggas upp är det scripts/provision.mjs som gäller.

import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const args = process.argv.slice(2);
const värde = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : d; };

const teamNamn = värde("team", null);
const configFil = värde("config", null);

// Slugen får INTE vara ett showcase-slug. `isShowcaseSlug()` i portal/app.js
// tvingar demoläge för allt som står i window.TEAMS (portal/teams/index.js) —
// öppnar man "coachonline" som inloggad kund får man ändå demoläget, och då är
// hela poängen med den här fixturen borta. Uppmätt 2026-09-06.
//
// Dessutom kräver /api/teams/:slug mönstret ^[A-Za-z0-9_-]{22,64}$ (slugen är
// ~128 bitar slump i drift), så ett kort namn ger 400 innan det ens slås upp.
const ALFABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nySlug = () => Array.from(randomBytes(22)).map((b) => ALFABET[b % 62]).join("");
const slug = värde("slug", null) || nySlug();

if (!/^[A-Za-z0-9_-]{22,64}$/.test(slug)) {
  console.error(`Slugen "${slug}" matchar inte ^[A-Za-z0-9_-]{22,64}$ — /api/teams/:slug svarar 400 på den.`);
  process.exit(1);
}
try {
  const reg = {};
  new Function("window", readFileSync(join(ROT, "portal/teams/index.js"), "utf8"))(reg);
  if ((reg.TEAMS || []).some((t) => t.slug === slug)) {
    console.error(`"${slug}" står i portal/teams/index.js och öppnas därför ALLTID i demoläge. Välj ett annat.`);
    process.exit(1);
  }
} catch { /* registret går inte att läsa — fortsätt, mönsterkontrollen räcker */ }
const email = värde("email", "prov@lokalt.test");
const plan = värde("plan", "standard");   // standard | trial | expired | cancelled | past_due
const dagarSedanKöp = Number(värde("dagar", 0)); // flytta created_at bakåt: prova provmånadens slut

if (!teamNamn && !configFil) {
  console.error(`
Ange ett team att kopiera konfigen från, eller en egen JSON:

  --team <slug ur portal/teams/>     t.ex. coachonline, salong, restaurang
  --config <fil.json>  --slug <namn>

Valfritt:
  --plan standard|trial|expired|cancelled|past_due   (default standard)
  --dagar <n>     flytta created_at n dagar bakåt — så här provas dag 25, 29, 31
  --email <adress>
`);
  process.exit(1);
}

// ── konfigen ──────────────────────────────────────────────────────────────
let config;
if (configFil) {
  config = readFileSync(configFil, "utf8");
  JSON.parse(config); // kastar om den inte är giltig
} else {
  const src = readFileSync(join(ROT, "portal/teams", teamNamn + ".js"), "utf8");
  const win = {};
  new Function("window", src)(win);
  if (!win.TEAM) { console.error(`portal/teams/${teamNamn}.js satte inget window.TEAM`); process.exit(1); }
  config = JSON.stringify(win.TEAM);
}

// ── raderna ───────────────────────────────────────────────────────────────
const nu = Date.now();
const skapad = nu - dagarSedanKöp * 86400000;
const token = randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(token).digest("hex");
const userId = "usr_" + randomBytes(12).toString("hex");
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const sql = [
  `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ${q(email)});`,
  `INSERT INTO teams (slug, config, tier, plan, created_at, plan_changed_at) ` +
  `VALUES (${q(slug)}, ${q(config)}, 'self-serve', ${q(plan)}, ${skapad}, ${skapad}) ` +
  `ON CONFLICT(slug) DO UPDATE SET config = excluded.config, plan = excluded.plan, ` +
  `created_at = excluded.created_at, plan_changed_at = excluded.plan_changed_at;`,
  `INSERT INTO users (id, email, created_at) VALUES (${q(userId)}, ${q(email)}, ${nu}) ` +
  `ON CONFLICT(email) DO NOTHING;`,
  `INSERT INTO team_access (team_slug, user_id, role, created_at) ` +
  `SELECT ${q(slug)}, id, 'owner', ${nu} FROM users WHERE email = ${q(email)} ` +
  `ON CONFLICT(team_slug, user_id) DO NOTHING;`,
  // Sessionen: bara hashen lagras, precis som createSession() gör.
  `INSERT INTO sessions (token_hash, user_id, expires_at, created_at, user_agent) ` +
  `SELECT ${q(tokenHash)}, id, ${nu + 30 * 86400000}, ${nu}, 'portal-med-ogon' FROM users WHERE email = ${q(email)};`,
].join("\n");

const utFil = join(tmpdir(), "portal-lokal.sql");
writeFileSync(utFil, sql + "\n", "utf8");

console.log("\n─── SQL (skriven till fil, inte körd) ──────────────────────────\n");
console.log(sql.slice(0, 600) + (sql.length > 600 ? `\n… ${sql.length} tecken totalt` : ""));
console.log(`\nFilen: ${utFil}`);

console.log(`
─── Kör i tur och ordning ──────────────────────────────────────

1) Migrera den lokala kopian (en gång):
   npm run db:migrate:local

2) Lägg in raderna:
   npx wrangler@4.123.0 d1 execute agent-team-builder --local --file "${utFil}"

3) Starta emulatorn i ett eget fönster:
   npm run dev:cf

4) Gå igenom portalen som inloggad kund:
   node .claude/skills/portal-med-ogon/genomgang.mjs \\
     --url http://localhost:8788 --team ${slug} --cookie ${token} --synlig

Sessionstoken (kakan atb_session): ${token}
Plan: ${plan} · created_at ${dagarSedanKöp} dagar bakåt · konto ${email}

Chatten kräver en giltig OPENROUTER_KEY i .dev.vars — utan den svarar /api/ai
503 och allt annat i portalen fungerar ändå. Provmånadskortet, rutinerna,
sparad tid och Utveckla teamet behöver ingen nyckel.
`);
