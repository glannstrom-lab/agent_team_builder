// Det kunden skrivit eller sagt i Buildern ska överleva fel, avbrott och F5
// (U4–U7, speltestet 2026-11-12).
//
// Funktionerna hämtas ur builder/builder.js och körs som de står där — samma
// grepp som test/intake.mjs och test/mote.mjs: en kopia här hade kunnat vara
// snällare än koden kunden kör. Där beteendet sitter i DOM-kod som inte går att
// köra utan webbläsare läses källan i stället, så att ordningen som bär
// rättelsen inte kan glida tillbaka utan att något säger ifrån.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("builder/builder.js", "utf8");

// Från "function namn(" till den klammer som stänger kroppen.
function fn(namn) {
  const i = src.indexOf(`function ${namn}(`);
  assert.ok(i >= 0, `hittade inte function ${namn} i builder/builder.js`);
  let djup = 0, k = src.indexOf("{", src.indexOf(")", i));
  for (; k < src.length; k++) {
    if (src[k] === "{") djup++;
    else if (src[k] === "}") { djup--; if (djup === 0) break; }
  }
  return src.slice(i, k + 1) + "\n";
}
// Kroppen av en funktion, för läsning av ordningen i den.
const kropp = (namn) => fn(namn);

// ── U5: intervjun raderas inte innan något steg sparats ────────────────────

const { körningsLäge } = new Function(fn("körningsLäge") + "return { körningsLäge };")();

test("U5: en körning som startat utan klart steg känns igen som påbörjad", () => {
  const intake = { company: "Byggfirman", intakeText: "företagsnamn: Byggfirman" };
  assert.equal(körningsLäge({ intake, r: {}, team: null }, false), "påbörjad",
    "en körning som föll i research ska gå att återuppta");
  assert.equal(körningsLäge({ intake, r: { research: "x" }, team: null }, false), "steg");
  assert.equal(körningsLäge({ intake, r: {}, team: { agents: [] } }, false), "klar");
  assert.equal(körningsLäge({ intake, r: {}, team: { agents: [] } }, true), "köpt");
  assert.equal(körningsLäge(null, false), null);
  assert.equal(körningsLäge({ r: { research: "x" } }, false), null, "utan intag finns inget att återuppta");
});

test("U5: körningen sparas innan första steget, och mötet raderas först när teamet finns", () => {
  const bygg = kropp("runBuild");
  const sparas = bygg.indexOf("saveRun();");
  assert.ok(sparas >= 0 && sparas < bygg.indexOf("renderProgress("),
    "körningen ska sparas innan första steget körs — annars finns inget kvar efter F5 i research");
  assert.ok(!/glömMöte\(\)/.test(bygg.slice(0, bygg.indexOf("for (const stg of stages)"))),
    "mötet får inte raderas när bygget startar");
  // Teamet klart → då, och bara då, är intervjun förbrukad. Båda vägarna dit.
  const klart = bygg.indexOf("saveRun(teamObj);");
  assert.ok(klart > 0 && bygg.indexOf("teametÄrKlart(intake);", klart) > klart);
  assert.match(kropp("retryStructure"), /saveRun\(teamObj\);\s*teametÄrKlart\(/);
  assert.match(fn("teametÄrKlart"), /glömMöte\(\)/);
});

test("U5: en påbörjad körning ur mötet öppnar mötet igen, en ur formuläret öppnar formuläret", () => {
  // mötetFörst körs med låtsade lagringar: körningen påbörjad, mötet kvar eller inte.
  const bygg = (saved, möte, scen) => new Function(
    "state", "loadRun", "köptSlug", "läsMöte", "läsScen",
    fn("körningsLäge") + fn("mötetFörst") + "return mötetFörst;",
  )({ demo: false }, () => saved, () => null, () => möte, () => scen);
  const påbörjad = { intake: { company: "X" }, r: {}, team: null };
  assert.equal(bygg(påbörjad, { turer: [], klart: { intag: "x" } }, {})(), true,
    "intervjun ska visas igen med sina svar — inte ett nytt möte");
  assert.equal(bygg(påbörjad, null, { mandag: "x" })(), false,
    "kom körningen ur formuläret ska formulärets återupptagning visas, inte en ny intervju");
  assert.equal(bygg({ intake: { company: "X" }, r: { research: "x" } }, { turer: [] }, {})(), false);
  assert.equal(bygg(null, null, { mandag: "x" })(), true);
});
