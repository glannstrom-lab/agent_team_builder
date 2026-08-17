// Exporterar D1 till en SQL-fil i backup/.
//
//   npm run db:backup            # skarpa databasen (--remote)
//   npm run db:backup -- --local # den lokala emulatorns kopia
//
// Varför den finns: D1 är den ENDA datakällan i hela systemet som inte går att
// återskapa. Koden, prompterna, facit och besluten ligger i git; databasen bär
// konton, `team_access` (vem som betalat för vad), `teams.plan` (livscykeln) och
// all förbrukningsbokföring. Tappas den, eller går en `ALTER TABLE` fel mitt i,
// finns ingenting att gå tillbaka till — och till skillnad från koden märks det
// först när en betalande kund inte kommer in.
//
// Det här skriptet ersätter ingen driftrutin hos Cloudflare. Det gör en sak:
// gör det billigt nog att ta en kopia att det faktiskt blir gjort, och tydligt
// nog att man ser om kopian är tom.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, readFileSync, readdirSync } from "node:fs";

const WRANGLER = "wrangler@4.123.0"; // samma pinning som resten av npm-scripten
const DB = "agent-team-builder";
const MAPP = "backup";

const lokal = process.argv.includes("--local");
// Filnamnet måste sorteras kronologiskt i en filbläddrare: ISO-datum först.
const nu = new Date();
const tid = nu.toISOString().replace(/[:.]/g, "-").slice(0, 19);
const fil = `${MAPP}/d1-${lokal ? "local" : "remote"}-${tid}.sql`;

if (!existsSync(MAPP)) mkdirSync(MAPP);

console.log(`Exporterar ${DB} (${lokal ? "lokal" : "SKARP"}) → ${fil}`);
// shell: true krävs på Windows — npx är en .cmd och spawnSync startar den inte
// utan skal. Utan flaggan misslyckades skriptet med "inte inloggad" trots att
// samma kommando kört för hand fungerade, alltså ett felmeddelande som pekade
// helt fel håll.
// Ett enda kommandosträng, inte skal + argumentlista: node varnar (DEP0190) för
// att argument inte escapas när shell:true kombineras med en args-array. Här är
// varje del en konstant i den här filen — ingen indata utifrån — men varningen
// hade skrivits ut vid varje körning, och en backup-rutin ska inte se orolig ut.
const kommando = ["npx", "--yes", WRANGLER, "d1", "export", DB,
  lokal ? "--local" : "--remote", "--output", `"${fil}"`].join(" ");
const res = spawnSync(kommando, { stdio: "inherit", shell: true });

if (res.error || res.status !== 0) {
  console.error(
    "\n✖  Exporten gick inte igenom" + (res.error ? ` (${res.error.message})` : ` (avslutskod ${res.status})`) +
    "\n   Vanligaste orsaken vid --remote: inte inloggad. Kör `npx wrangler login` först." +
    "\n   Skarp export kräver också att database_id i wrangler.toml är rätt.\n",
  );
  process.exit(1);
}

// En export som "lyckades" men är tom är värre än ingen: den ser ut som ett
// skyddsnät. Kontrollera att filen finns, har storlek och faktiskt innehåller
// de tabeller som bär kunddata.
if (!existsSync(fil)) {
  console.error("\n✖  Wrangler rapporterade inget fel men filen finns inte.\n");
  process.exit(1);
}
const storlek = statSync(fil).size;
const sql = readFileSync(fil, "utf8");
const VÄNTADE = ["users", "teams", "team_access"];
const saknas = VÄNTADE.filter((t) => !new RegExp(`CREATE TABLE[^;]*\\b${t}\\b`, "i").test(sql));

console.log(`\n✓  ${(storlek / 1024).toFixed(1)} kB skrivet`);
if (saknas.length) {
  console.error(
    `✖  Men exporten saknar tabell(er): ${saknas.join(", ")}.` +
    "\n   Antingen pekar den på en tom/fel databas, eller har migrationerna inte körts." +
    "\n   Kör `npm run db:migrate` mot rätt databas och exportera om.\n",
  );
  process.exit(1);
}
console.log(`✓  innehåller ${VÄNTADE.join(", ")} — exporten ser ut som en riktig databas`);

// Visa vad som ligger i mappen, så det syns om senaste kopian är gammal.
const tidigare = readdirSync(MAPP).filter((f) => f.endsWith(".sql")).sort();
if (tidigare.length > 1) {
  console.log(`\n   ${tidigare.length} kopior i ${MAPP}/. Äldsta: ${tidigare[0]}`);
  console.log("   Mappen är git-ignorerad — flytta kopiorna någon annanstans än den här datorn,");
  console.log("   annars skyddar de mot en trasig migration men inte mot en trasig disk.");
}
