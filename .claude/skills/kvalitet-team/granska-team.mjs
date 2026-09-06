// Grindar ett genererat team mot kvalitetschecklistan i CLAUDE.md.
//
//   node .claude/skills/kvalitet-team/granska-team.mjs portal/teams/salong.js
//   node .claude/skills/kvalitet-team/granska-team.mjs --json utkast.json
//   node .claude/skills/kvalitet-team/granska-team.mjs --alla
//
// Perspektiv-måttet hämtas ur builder/builder.js mellan ⟦DELAD-START⟧ och
// ⟦DELAD-SLUT⟧ — samma kod som körs vid generering hos kunden. En kopia här
// hade kunnat bli mildare än den som faktiskt fäller, vilket är precis den
// fälla KA4 handlade om.
//
// Två mått som INTE finns någon annanstans:
//
//   • LEVERANS-golvet. `kontrolleraSystemprompter` kräver att rubriken finns,
//     men bara DITT PERSPEKTIV har ett innehållsgolv (KA8). En LEVERANS-rubrik
//     med ingenting under passerar generering — och det är "Klart när"-punkterna
//     under den som gör leveranserna ja/nej-svarbara.
//
//   • Överlapp MELLAN team. test/teams.mjs jämför agentpar inom samma fil.
//     Ingenting jämför ett nytt team mot de team som redan finns, vilket är
//     precis den riktning projektets enda regel pekar: tre olika företag ska ge
//     tre meningsfullt olika team.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const C = { röd: "\x1b[31m", gul: "\x1b[33m", grön: "\x1b[32m", dim: "\x1b[2m", fet: "\x1b[1m", av: "\x1b[0m" };

// ── det delade måttet, ur källan ──────────────────────────────────────────
const MÅTTET = (() => {
  const src = readFileSync(join(ROT, "builder/builder.js"), "utf8");
  const i = src.indexOf("⟦DELAD-START⟧");
  const j = src.indexOf("⟦DELAD-SLUT⟧");
  if (i < 0 || j <= i) {
    console.error("Hittade inte det delade perspektiv-blocket i builder/builder.js — flyttades markörerna?");
    process.exit(2);
  }
  const kropp = src.slice(src.indexOf("\n", i) + 1, src.lastIndexOf("\n", j) + 1);
  return new Function(kropp + "; return { perspektivText, perspektivLikhet, perspektivBrister, PERSPEKTIV_TAK, PERSPEKTIV_GOLV };")();
})();

// Samma rubrikmönster som perspektivText, för valfri rubrik. Mätning, inte grind.
//
// Skillnaden mot det delade blocket: rubriken måste stå vid RADENS BÖRJAN.
// Det delade `perspektivText` använder indexOf, vilket duger för
// "DITT PERSPEKTIV" men inte för "LEVERANS" — ordet står i löpande text
// ("...leveranser och design systems-produkten...") i flera av de kurerade
// teamen, och en indexOf-sökning klipper då ut fel stycke och rapporterar en
// LEVERANS-sektion som inte finns. Uppmätt på studio.js 2026-09-06.
function sektionText(sys, rubrik) {
  const s = String(sys || "");
  const m0 = new RegExp("^[ \\t]*(?:\\d+\\.\\s*)?" + rubrik + "\\b", "mi").exec(s);
  if (!m0) return null;
  const i = m0.index + m0[0].length - rubrik.length;
  const efter = s.slice(i + rubrik.length);
  const m = efter.match(/\n\s*(?:\d+\.\s*)?[A-ZÅÄÖ][A-ZÅÄÖ\s]{3,}[:\n]/);
  return (m ? efter.slice(0, m.index) : efter).trim();
}

// ── inläsning ─────────────────────────────────────────────────────────────
function läsTeamfil(sökväg) {
  const src = readFileSync(sökväg, "utf8");
  const win = {};
  new Function("window", src)(win);
  if (!win.TEAM) throw new Error(`${sökväg} satte inget window.TEAM`);
  return win.TEAM;
}

function alla() {
  const dir = join(ROT, "portal/teams");
  return readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "index.js")
    .map((f) => ({ namn: basename(f, ".js"), team: läsTeamfil(join(dir, f)) }));
}

// ── referensfördelning ur repot (mätt, inte gissad) ───────────────────────
function referens() {
  const längder = { system: [], perspektiv: [], leverans: [] };
  for (const { team } of alla()) {
    for (const a of team.agents || []) {
      const sys = String(a.system || "");
      längder.system.push(sys.length);
      längder.perspektiv.push((MÅTTET.perspektivText(sys) || "").length);
      const lev = sektionText(sys, "LEVERANS");
      if (lev !== null) längder.leverans.push(lev.length);
    }
  }
  const stat = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    return { n: s.length, min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1],
             p10: s[Math.floor(s.length * 0.1)] };
  };
  return { system: stat(längder.system), perspektiv: stat(längder.perspektiv), leverans: stat(längder.leverans) };
}

// ── granskning av ett team ────────────────────────────────────────────────
function granska(namn, team, ref, övriga) {
  const brister = [], varningar = [], noteringar = [];
  const agenter = team.agents || [];

  // 1. struktur
  if (!agenter.length) brister.push("teamet har inga agenter alls");
  if (!team.company) varningar.push("company saknas");
  const ids = agenter.map((a) => a.id);
  if (team.entryAgent && !ids.includes(team.entryAgent)) {
    brister.push(`entryAgent "${team.entryAgent}" finns inte bland agenterna — portalen laddar utan ingång`);
  }
  if (!team.entryAgent) varningar.push("entryAgent saknas — portalen måste gissa vem som är arbetspartnern");
  if (!(team.rejected || []).length) {
    brister.push("inga avvisade förslag — checklistan kräver att minst en föreslagen agent får nej i en typisk körning");
  }
  if (!(team.routines || []).length) varningar.push("inga veckorutiner — arbetsytan blir en vanlig chatt");
  const utanTid = (team.routines || []).filter((r) => !r.timeEstimate);
  if (team.routines && utanTid.length === team.routines.length && team.routines.length) {
    varningar.push("ingen rutin har timeEstimate — sparad tid kan aldrig visas (OM5 räknar bara avbockade rutiners uppskattningar)");
  }

  // 2. per agent
  for (const a of agenter) {
    const namnA = a.name || a.id || "namnlös agent";
    const sys = String(a.system || "");
    if (!sys) { brister.push(`${namnA}: tom systemprompt`); continue; }

    for (const rubrik of ["DITT PERSPEKTIV", "LEVERANS"]) {
      if (!sys.toUpperCase().includes(rubrik)) brister.push(`${namnA}: saknar ${rubrik}`);
    }

    // LEVERANS-golvet (KA8) — mätt mot repots egen fördelning
    const lev = sektionText(sys, "LEVERANS");
    if (lev === null && sys.toUpperCase().includes("LEVERANS")) {
      brister.push(`${namnA}: LEVERANS förekommer bara i löpande text, inte som rubrik vid radbörjan — builderns närvarokontroll släpper igenom det, men det finns ingen sektion att leverera mot`);
    }
    if (lev !== null) {
      if (lev.length < MÅTTET.PERSPEKTIV_GOLV) {
        brister.push(`${namnA}: LEVERANS är tom eller nästan tom (${lev.length} tecken) — rubriken finns men säger ingenting`);
      } else if (lev.length < ref.leverans.p10) {
        varningar.push(`${namnA}: LEVERANS är ${lev.length} tecken, under repots tionde percentil (${ref.leverans.p10})`);
      }
      // Formuleringen varierar i repot: "är klar när" (43), "är klart när" (19),
      // "Klart när" (7). Mät kriteriet, inte stavningen.
      if (!/\bklar[t]?\s+när\b/i.test(lev)) {
        brister.push(`${namnA}: LEVERANS saknar "Klart när"-punkter — då går leveransen inte att svara ja/nej på`);
      }
    }

    const starters = a.starters || [];
    if (starters.length !== 3) {
      varningar.push(`${namnA}: ${starters.length} startförslag (schemat kräver exakt 3 — se KA6)`);
    }

    if (sys.length < ref.system.p10) {
      varningar.push(`${namnA}: systemprompten är ${sys.length} tecken, under repots tionde percentil (${ref.system.p10}; median ${ref.system.median})`);
    }
  }

  // 3. perspektiv inom teamet — det delade måttet, orört
  brister.push(...MÅTTET.perspektivBrister(agenter));

  // 4. fördelningen inom teamet, inte bara taket
  let värstInom = { l: 0, par: "" };
  for (let i = 0; i < agenter.length; i++) {
    for (let j = i + 1; j < agenter.length; j++) {
      const l = MÅTTET.perspektivLikhet(
        MÅTTET.perspektivText(agenter[i].system), MÅTTET.perspektivText(agenter[j].system));
      if (l > värstInom.l) värstInom = { l, par: `${agenter[i].id}~${agenter[j].id}` };
    }
  }
  // Bara varningsbandet: över taket är paret redan fällt av det delade måttet.
  if (värstInom.l >= 0.55 && värstInom.l < MÅTTET.PERSPEKTIV_TAK) {
    varningar.push(`${värstInom.par} ligger på ${värstInom.l.toFixed(2)} — under taket ${MÅTTET.PERSPEKTIV_TAK} men långt över allt annat i repot (max 0,42 när måttet mättes)`);
  }
  noteringar.push(`Största överlapp inom teamet: ${värstInom.l.toFixed(2)} (${värstInom.par || "—"})`);

  // 5. överlapp MOT andra team — kärnregelns egen riktning
  let värstMellan = { l: 0, var: "" };
  for (const { namn: annat, team: t } of övriga) {
    if (annat === namn) continue;
    for (const a of agenter) {
      for (const b of t.agents || []) {
        const l = MÅTTET.perspektivLikhet(MÅTTET.perspektivText(a.system), MÅTTET.perspektivText(b.system));
        if (l > värstMellan.l) värstMellan = { l, var: `${a.id} ~ ${annat}:${b.id}` };
      }
    }
  }
  if (värstMellan.l >= 0.55) {
    brister.push(`${värstMellan.var} har ${Math.round(värstMellan.l * 100)} % överlapp MELLAN team — två olika företag har fått samma agent, vilket är exakt det projektet finns för att inte göra`);
  } else if (värstMellan.l >= 0.42) {
    varningar.push(`${värstMellan.var} ligger på ${värstMellan.l.toFixed(2)} mot ett annat team — över allt som mätts inom team`);
  }
  noteringar.push(`Största överlapp mot andra team: ${värstMellan.l.toFixed(2)} (${värstMellan.var || "—"})`);

  // 6. ingångsagentens operativa jobb — bedöms av människa, mätvärdet ges
  const ingång = agenter.find((a) => a.id === team.entryAgent);
  if (ingång) {
    const lev = sektionText(ingång.system, "LEVERANS") || "";
    noteringar.push(`Ingångsagent: ${ingång.name || ingång.id} — LEVERANS ${lev.length} tecken` +
      (lev ? `\n      ${C.dim}${lev.split("\n")[0].slice(0, 120)}${C.av}` : ""));
    noteringar.push('Bedöm för hand: har VD/ingången ett OPERATIVT jobb, eller bara abstrakt strategi? För solo-team är det senare teater (CLAUDE.md, princip 3).');
  }

  return { brister, varningar, noteringar };
}

// ── utskrift ──────────────────────────────────────────────────────────────
function skriv(namn, r) {
  const status = r.brister.length ? `${C.röd}FÄLLER${C.av}` : r.varningar.length ? `${C.gul}passerar med varningar${C.av}` : `${C.grön}godkänt${C.av}`;
  console.log(`\n${C.fet}${namn}${C.av}  ${status}`);
  for (const b of r.brister) console.log(`  ${C.röd}✖${C.av} ${b}`);
  for (const v of r.varningar) console.log(`  ${C.gul}⚠${C.av} ${v}`);
  for (const n of r.noteringar) console.log(`  ${C.dim}·${C.av} ${n}`);
}

const args = process.argv.slice(2);
const ref = referens();
const övriga = alla();

console.log(`${C.dim}Referens ur repot (${ref.system.n} agenter i ${övriga.length} team): systemprompt ${ref.system.min}–${ref.system.max} tecken, median ${ref.system.median} · LEVERANS median ${ref.leverans.median}, p10 ${ref.leverans.p10}${C.av}`);

let fällda = 0;
if (args.includes("--alla")) {
  for (const { namn, team } of övriga) {
    const r = granska(namn, team, ref, övriga);
    if (r.brister.length) fällda++;
    skriv(namn, r);
  }
} else {
  const jsonIdx = args.indexOf("--json");
  let namn, team;
  if (jsonIdx >= 0) {
    namn = args[jsonIdx + 1];
    team = JSON.parse(readFileSync(namn, "utf8"));
  } else {
    namn = args[0];
    if (!namn) {
      console.error("Ange en teamfil: portal/teams/<slug>.js, eller --json <fil>, eller --alla");
      process.exit(2);
    }
    const p = existsSync(namn) ? namn : join(ROT, namn);
    team = läsTeamfil(p);
  }
  const r = granska(basename(String(namn)).replace(/\.js$|\.json$/, ""), team, ref, övriga);
  if (r.brister.length) fällda++;
  skriv(namn, r);
}

console.log("");
if (fällda) {
  console.log(`${C.röd}${C.fet}${fällda} team fäller.${C.av} Ett fällt team ska skrivas om — höj inte taket för att komma förbi.`);
  process.exit(1);
}
console.log(`${C.grön}Inga brister.${C.av} ${C.dim}Kvar att bedöma för hand: att VD har ett operativt jobb, att varje agent går att motivera med ett konkret fynd, och att skalningen stämmer med docs/scaling.md.${C.av}`);
