// Förkontroll inför driftsättning. Läser bara — ändrar ingenting, deployar
// ingenting, når inte nätet.
//
//   node .claude/skills/driftsatt/forkontroll.mjs
//
// Nio kontroller, alla på fel som faktiskt inträffat i det här projektet:
//
//   1. Arbetsträdet är rent            — annars deployas något som inte är committat
//   2. main och origin/main            — 2026-09-01 låg main SJU commits före origin,
//                                        alltså hade CI aldrig kört på koden i produktion
//   3. Vad som ändrats sedan taggen    — underlaget till ROADMAP-posten
//   4. Rör passet migrations/          — backup + skarp migration + rollback-regeln
//   5. Rör passet functions/           — deployas från roten, inte via dist/
//   6. Nya secrets                     — listan finns BARA i CLAUDE.md-tabellen
//   7. Kopplade ändringar              — halvor som inte följt med
//   8. Testgrinden i package.json      — `npm run deploy` måste börja med `npm test`
//   9. ROADMAP-posten                  — skrivs efteråt, men påminns om nu

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (cmd) => { try { return execSync("git " + cmd, { cwd: ROT, encoding: "utf8" }).trim(); } catch { return ""; } };
const läs = (p) => { try { return readFileSync(join(ROT, p), "utf8"); } catch { return ""; } };

const C = { röd: "\x1b[31m", gul: "\x1b[33m", grön: "\x1b[32m", dim: "\x1b[2m", fet: "\x1b[1m", av: "\x1b[0m" };
let stopp = 0, varning = 0;
const ok = (s) => console.log(`${C.grön}✔${C.av}  ${s}`);
const varna = (s, d) => { varning++; console.log(`${C.gul}⚠${C.av}  ${s}`); if (d) console.log(`   ${C.dim}${d}${C.av}`); };
const fel = (s, d) => { stopp++; console.log(`${C.röd}✖${C.av}  ${s}`); if (d) console.log(`   ${C.dim}${d}${C.av}`); };

console.log(`${C.fet}\nFörkontroll inför driftsättning${C.av}  ${C.dim}(läser bara)${C.av}\n`);

// ── 1. rent arbetsträd ────────────────────────────────────────────────────
const smutsigt = git("status --porcelain=v1").split("\n").filter(Boolean);
if (smutsigt.length) {
  fel(`${smutsigt.length} oincheckade ändringar i arbetsträdet.`,
      "wrangler deployar filerna som de ligger på disk — det som inte är committat hamnar i produktion utan att finnas i git.\n   " +
      smutsigt.slice(0, 8).join("\n   ") + (smutsigt.length > 8 ? `\n   … och ${smutsigt.length - 8} till` : ""));
} else ok("Arbetsträdet är rent.");

// ── 2. main mot origin/main ───────────────────────────────────────────────
const gren = git("rev-parse --abbrev-ref HEAD");
if (gren !== "main") varna(`Du står på ${gren}, inte main.`, "Deployen tar det som ligger på disk oavsett gren.");

const före = git("rev-list --count origin/main..HEAD");
const efter = git("rev-list --count HEAD..origin/main");
if (!före && !efter) {
  varna("Kunde inte jämföra med origin/main.", "Kör `git fetch origin` — utan den vet vi inte om CI kört på koden.");
} else if (Number(före) > 0) {
  fel(`${före} commit(s) är opushade.`,
      "`npm run deploy` pushar inte. Ligger main före origin har CI aldrig kört på koden i produktion — det inträffade 2026-09-01 och stod oupptäckt i två veckor.\n   Kör `git push` FÖRE deployen, inte efter.");
} else {
  ok("main och origin/main är i fas — CI har sett koden.");
  if (Number(efter) > 0) varna(`origin/main ligger ${efter} commit(s) före dig.`, "Hämta hem först.");
}

// ── 3. sedan senaste deploy-taggen ────────────────────────────────────────
const taggar = git("tag --list deploy-* --sort=-creatordate").split("\n").filter(Boolean);
const sistaTagg = taggar[0] || "";
let sedan = [];
if (sistaTagg) {
  sedan = git(`log --oneline ${sistaTagg}..HEAD`).split("\n").filter(Boolean);
  if (!sedan.length) varna(`Ingenting nytt sedan ${sistaTagg}.`, "Är det verkligen något att driftsätta?");
  else {
    ok(`${sedan.length} commit(s) sedan ${sistaTagg} — underlaget till ROADMAP-posten:`);
    for (const r of sedan.slice(0, 12)) console.log(`   ${C.dim}${r}${C.av}`);
    if (sedan.length > 12) console.log(`   ${C.dim}… och ${sedan.length - 12} till${C.av}`);
  }
} else varna("Ingen deploy-tagg hittad.", "Taggarna heter deploy-ÅÅÅÅ-MM-DD och är det enda som säger vad som faktiskt ligger ute.");

const ändradeSedanTagg = sistaTagg ? git(`diff --name-only ${sistaTagg}..HEAD`).split("\n").filter(Boolean) : [];

// ── 4. migrationer ────────────────────────────────────────────────────────
const migr = ändradeSedanTagg.filter((f) => f.startsWith("migrations/"));
if (migr.length) {
  varna(`${migr.length} migration(er) ändrade sedan ${sistaTagg}: ${migr.join(", ")}`,
        "Ordningen är: `npm run db:backup` FÖRST (skriptet avbryter om exporten saknar users/teams/team_access),\n" +
        "   sedan `npm run db:migrate` mot skarpa D1, sedan deployen.\n" +
        "   Migrationerna är enkelriktade — inga down-skript, och ADD COLUMN i 0003/0005 är inte idempotenta.\n" +
        "   Tar migrationen BORT något koden läser går kod och schema inte att rulla tillbaka var för sig.");
} else if (sistaTagg) ok("Inga migrationer i det här passet — kodrollback är ofarlig.");

// ── 5. functions/ ─────────────────────────────────────────────────────────
const fn = ändradeSedanTagg.filter((f) => f.startsWith("functions/"));
if (fn.length) {
  varna(`${fn.length} fil(er) under functions/ ändrade.`,
        "Pages Functions hämtas från repo-ROTEN (cwd vid `wrangler pages deploy`), inte ur dist/.\n" +
        "   Kör alltså deployen från repo-roten. Kopieras functions/ in i dist/ publiceras API-källkoden som statiska filer.");
}
if (existsSync(join(ROT, "dist", "functions"))) {
  fel("dist/functions/ finns — API-källkoden skulle publiceras som statiska filer.", "Bygg om: `npm run build`.");
}

// ── 6. nya secrets ────────────────────────────────────────────────────────
function allaFiler(dir) {
  const p = join(ROT, dir);
  if (!existsSync(p)) return [];
  return readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allaFiler(join(dir, e.name)) : [join(dir, e.name)]);
}
const envNamn = new Set();
for (const f of allaFiler("functions")) {
  const t = readFileSync(join(ROT, f), "utf8");
  for (const m of t.matchAll(/\benv\.([A-Z][A-Z0-9_]{2,})\b/g)) envNamn.add(m[1]);
  // TIERS[...].env — prisnycklarna läses dynamiskt och syns inte i mönstret ovan.
  for (const m of t.matchAll(/env:\s*"([A-Z][A-Z0-9_]{2,})"/g)) envNamn.add(m[1]);
}
const claude = läs("CLAUDE.md");
const osaknade = [...envNamn].filter((n) => n !== "DB" && n !== "ASSETS" && !claude.includes(n)).sort();
if (osaknade.length) {
  fel(`${osaknade.length} värde(n) läses ur env men står inte i CLAUDE.md-tabellen: ${osaknade.join(", ")}`,
      "Tabellen är återställningsplanen — den finns ingen annanstans. Ett värde som inte står där är ett värde ingen vet ska sättas.");
} else ok(`Alla ${envNamn.size} env-värden i functions/ står i CLAUDE.md-tabellen.`);

// ── 7. kopplade ändringar ─────────────────────────────────────────────────
if (ändradeSedanTagg.length) {
  try {
    const reg = JSON.parse(readFileSync(join(ROT, ".claude/skills/kopplad-andring/kopplingar.json"), "utf8"));
    const rör = (d, f) => f === d.fil || f.startsWith(d.fil + "/");
    const halva = reg.kopplingar.filter((k) =>
      k.delar.some((d) => ändradeSedanTagg.some((f) => rör(d, f))) &&
      k.delar.some((d) => !ändradeSedanTagg.some((f) => rör(d, f))));
    if (halva.length) {
      varna(`${halva.length} koppling(ar) där bara en halva ändrats: ${halva.map((k) => k.id).join(", ")}`,
            "Kör `node .claude/skills/kopplad-andring/kontrollera.mjs` för detaljerna. Ofta rätt — men avgör det medvetet.");
    } else ok("Inga kopplingar med bara en halva ändrad.");
  } catch { varna("Kunde inte läsa kopplingsregistret."); }
}

// ── 8. testgrinden ────────────────────────────────────────────────────────
try {
  const pkg = JSON.parse(läs("package.json"));
  if (!/^npm test\b/.test(pkg.scripts.deploy || "")) {
    fel("`npm run deploy` börjar inte längre med `npm test`.",
        "Raden lades dit 2026-08-17: CI kör vid push, deploy kräver ingen push — utan den är de två skyddsnäten frånkopplade från det enda stället som betyder något.");
  } else ok("`npm run deploy` kör testsviten först.");
  if (!/check-dist/.test(pkg.scripts.deploy || "")) {
    varna("check-dist saknas i deploy-kedjan.", "Versionsstämplingen är det enda som når en återvändande besökare.");
  }
} catch { varna("Kunde inte läsa package.json."); }

// ── 9. ROADMAP-posten ─────────────────────────────────────────────────────
const idag = new Date().toISOString().slice(0, 10);
const roadmap = läs("ROADMAP.md");
if (roadmap.includes(`## Driftsatt ${idag}`)) ok(`ROADMAP.md har en post för ${idag}.`);
else varna(`ROADMAP.md har ingen "## Driftsatt ${idag}"-post än.`,
           "Den skrivs EFTER verifieringen i drift, med Pages-id, tagg och vad som faktiskt kontrollerades skarpt.");

// ── sammanfattning ────────────────────────────────────────────────────────
console.log("");
if (stopp) {
  console.log(`${C.röd}${C.fet}${stopp} sak(er) stoppar driftsättningen.${C.av} ${varning} varning(ar).`);
  process.exit(1);
}
console.log(`${C.grön}${C.fet}Inget stoppar.${C.av} ${varning} varning(ar) att läsa igenom först.`);
console.log(`${C.dim}Nästa steg: git push  →  npm run deploy  →  verifiera i drift  →  tagga  →  skriv ROADMAP-posten.${C.av}`);
