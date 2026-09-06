// Kopplade ändringar — vilka filer måste följa med den jag just rörde?
//
//   node .claude/skills/kopplad-andring/kontrollera.mjs              # mot git-diffen
//   node .claude/skills/kopplad-andring/kontrollera.mjs --fil portal/app.js
//   node .claude/skills/kopplad-andring/kontrollera.mjs --alla       # hela registret
//   node .claude/skills/kopplad-andring/kontrollera.mjs --revidera   # ruttnade ankare
//
// Varför skriptet finns: registret bodde i prosa, spritt över ett dussin
// stycken i CLAUDE.md, och det räckte inte. KA6 är en koppling som gled isär
// INUTI den fil som skapades för att göra det omöjligt. Prosa läses av den som
// redan misstänker att den behövs.
//
// --revidera är den viktigare halvan. Ett register med ett ankare som inte
// längre finns är sämre än inget register: det säger "kontrollerad" och pekar
// på en rad som är borta. Kör den innan du litar på utdatan.

import { readFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HÄR = dirname(fileURLToPath(import.meta.url));
const ROT = join(HÄR, "..", "..", "..");
const REGISTER = JSON.parse(readFileSync(join(HÄR, "kopplingar.json"), "utf8"));

const args = process.argv.slice(2);
const flagga = (n) => args.includes("--" + n);
const värde = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : null; };

const F = {
  röd: (s) => `\x1b[31m${s}\x1b[0m`,
  gul: (s) => `\x1b[33m${s}\x1b[0m`,
  grön: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  fet: (s) => `\x1b[1m${s}\x1b[0m`,
};

const norm = (p) => String(p).replace(/\\/g, "/").replace(/^\.\//, "");

// En del matchar en ändrad fil om sökvägarna är lika, eller om delen är en
// katalog som filen ligger i (registret pekar ibland på "portal/teams").
function delRör(del, fil) {
  const d = norm(del.fil), f = norm(fil);
  return f === d || f.startsWith(d + "/");
}

function ändradeFiler() {
  try {
    const ut = execSync("git status --porcelain=v1", { cwd: ROT, encoding: "utf8" });
    return ut.split("\n").map((r) => r.slice(3).trim()).filter(Boolean)
      .map((r) => (r.includes(" -> ") ? r.split(" -> ")[1] : r))
      .map((r) => r.replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

function finnsAnkare(del) {
  const p = join(ROT, del.fil);
  if (!existsSync(p)) return { ok: false, varför: "filen finns inte" };
  if (statSync(p).isDirectory()) return { ok: true };
  if (!del.ankare) return { ok: true };
  const text = readFileSync(p, "utf8");
  return text.includes(del.ankare) ? { ok: true } : { ok: false, varför: `ankaret "${del.ankare}" hittades inte` };
}

function skrivKoppling(k, rörda = []) {
  const vaktad = k.vaktas_av && k.vaktas_av.length;
  console.log(`\n${F.fet(k.rubrik)}  ${F.dim("[" + k.id + "]")}`);
  console.log(`  ${k.varfor}`);
  for (const d of k.delar) {
    const rörd = rörda.some((f) => delRör(d, f));
    const märke = rörd ? F.grön("✓ ändrad") : F.gul("· följer inte med");
    console.log(`    ${rörda.length ? märke + "  " : ""}${d.fil}${d.ankare ? F.dim("  → " + d.ankare) : ""}`);
    console.log(`      ${F.dim(d.roll)}`);
  }
  if (vaktad) {
    console.log(`  ${F.grön("Vaktad av:")} ${k.vaktas_av.join("; ")}`);
  } else {
    console.log(`  ${F.röd("OVAKTAD")} — inget test fäller om halvorna glider isär.`);
    if (k.foreslagen_vakt) console.log(`  ${F.dim("Föreslagen vakt: " + k.foreslagen_vakt)}`);
  }
}

// ── --revidera ────────────────────────────────────────────────────────────
if (flagga("revidera")) {
  let fel = 0, kontrollerade = 0;
  for (const k of REGISTER.kopplingar) {
    for (const d of k.delar) {
      kontrollerade++;
      const r = finnsAnkare(d);
      if (!r.ok) { fel++; console.log(F.röd(`✖  ${k.id}: ${d.fil} — ${r.varför}`)); }
    }
  }
  // Vakterna ska också finnas. Testnamnen kontrolleras som text i testfilen:
  // ett omdöpt test är en vakt som tyst slutade vakta det registret tror.
  for (const k of REGISTER.kopplingar) {
    for (const v of k.vaktas_av || []) {
      // Formen är "<sökväg> — <exakt testnamn>" för ett test, eller bara
      // "<sökväg> (förklaring)" för en vakt som inte är ett namngivet test
      // (check-dist, ett bygge som avbryter). Sökvägen kontrolleras alltid,
      // testnamnet bara när em-dashen finns.
      const m = /^([\w./\\-]+)\s*(?:\([^)]*\))?\s*(?:—\s*(.+))?$/.exec(v.trim());
      if (!m) { fel++; console.log(F.röd(`✖  ${k.id}: vakten "${v}" har okänd form`)); continue; }
      const [, fil, namn] = m;
      const p = join(ROT, fil.trim());
      if (!existsSync(p)) { fel++; console.log(F.röd(`✖  ${k.id}: vakten ${fil} finns inte`)); continue; }
      if (!namn || statSync(p).isDirectory()) continue;
      kontrollerade++;
      if (!readFileSync(p, "utf8").includes(namn.trim())) {
        fel++;
        console.log(F.röd(`✖  ${k.id}: ${fil} har inget test som heter "${namn.trim()}" — omdöpt eller borttaget?`));
      }
    }
  }
  console.log(`\n${kontrollerade} ankare och vakter kontrollerade, ${fel ? F.röd(fel + " ruttna") : F.grön("0 ruttna")}.`);
  if (fel) console.log(F.dim("Laga registret innan du litar på det. Ett ruttet ankare vaktar ingenting men ser ut att göra det."));
  else console.log(F.dim(`Registret stämde senast ${REGISTER.kontrollerad}. Uppdatera datumet i kopplingar.json.`));
  process.exit(fel ? 1 : 0);
}

// ── --alla ────────────────────────────────────────────────────────────────
if (flagga("alla")) {
  console.log(F.fet(`\n${REGISTER.kopplingar.length} kopplingar i registret (kontrollerat ${REGISTER.kontrollerad}):`));
  for (const k of REGISTER.kopplingar) skrivKoppling(k);
  const ovaktade = REGISTER.kopplingar.filter((k) => !(k.vaktas_av || []).length);
  console.log(`\n${F.röd(ovaktade.length + " av " + REGISTER.kopplingar.length + " är ovaktade:")} ${ovaktade.map((k) => k.id).join(", ")}`);
  process.exit(0);
}

// ── mot en fil eller mot git-diffen ───────────────────────────────────────
const enFil = värde("fil");
const rörda = enFil ? [enFil] : ändradeFiler();

if (!rörda.length) {
  console.log("Inga ändrade filer i arbetsträdet. Kör med --fil <sökväg> eller --alla.");
  process.exit(0);
}

console.log(F.dim(`Ändrat: ${rörda.join(", ")}`));

const träffar = REGISTER.kopplingar.filter((k) => k.delar.some((d) => rörda.some((f) => delRör(d, f))));

if (!träffar.length) {
  console.log(F.grön("\nIngen av de ändrade filerna står i kopplingsregistret."));
  console.log(F.dim("Det betyder inte att det är ofarligt — det betyder att ingen har skrivit ner en koppling än."));
  process.exit(0);
}

console.log(F.fet(`\n${träffar.length} koppling(ar) rör de här filerna:`));
for (const k of träffar) skrivKoppling(k, rörda);

const oföljda = träffar.filter((k) => k.delar.some((d) => !rörda.some((f) => delRör(d, f))));
if (oföljda.length) {
  console.log(`\n${F.gul("Halvor som INTE följt med:")} ${oföljda.map((k) => k.id).join(", ")}`);
  console.log(F.dim("Det är ofta rätt — inte varje ändring i en fil rör kopplingen. Men avgör det medvetet, en gång, i stället för att upptäcka det när en kund betalar."));
}
