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

// ── U6: formulärets text överlever omladdning ──────────────────────────────

function lagring() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _m: m,
  };
}
const utkast = (ls) => new Function("localStorage",
  src.match(/^const FORM_UTKAST = [^;]*;/m)[0] + "\n" +
  fn("läsFormUtkast") + fn("sparaFormUtkast") + fn("glömFormUtkast") +
  "return { läsFormUtkast, sparaFormUtkast, glömFormUtkast };")(ls);

test("U6: utkastet sparas i localStorage och kommer tillbaka efter omladdning", () => {
  const ls = lagring();
  const före = utkast(ls);
  före.sparaFormUtkast("verksamhet", { company: "Salong Ada", moments: "Bokar om kunder hela måndagen.", what: "", size: "solo" });
  // "Omladdningen": samma lagring, nya funktioner — inget i minnet följer med.
  const efter = utkast(ls).läsFormUtkast();
  assert.equal(efter.audience, "verksamhet");
  assert.deepEqual(efter.fält, { company: "Salong Ada", moments: "Bokar om kunder hela måndagen.", size: "solo" },
    "tomma fält ska inte sparas, allt annat ska komma tillbaka");
  före.glömFormUtkast();
  assert.equal(utkast(ls).läsFormUtkast(), null);
  // Ett helt tömt formulär lämnar inget utkast efter sig.
  före.sparaFormUtkast("person", { company: "x" });
  före.sparaFormUtkast("person", { company: "  " });
  assert.equal(ls._m.size, 0);
  // Trasig lagring kastar inte.
  ls.setItem("atb_formutkast", "{inte json");
  assert.equal(utkast(ls).läsFormUtkast(), null);
});

test("U6: formuläret läser utkastet, skriver det vid inmatning och rensar det när teamet är klart", () => {
  const form = kropp("renderForm");
  const läs = form.indexOf("läsFormUtkast()"), fyll = form.indexOf("applyDraft(form);");
  assert.ok(läs >= 0 && läs < fyll, "utkastet ska läsas innan fälten fylls i");
  assert.match(form.slice(fyll), /addEventListener\("input"/, "utkastet ska skrivas när kunden skriver");
  assert.match(fn("teametÄrKlart"), /glömFormUtkast\(\)/, "utkastet ska rensas när teamet är klart");
});

// ── U7: "Bygg ett till" frågar innan ett obetalt team kastas ───────────────

test("U7: utan köp kommer en bekräftelsefråga som säger att teamet inte är sparat hos oss", () => {
  const byggEttTillFråga = new Function(fn("byggEttTillFråga") + "return byggEttTillFråga;")();
  const f = byggEttTillFråga(false, null);
  assert.ok(f, "ett obetalt team ska inte kastas utan fråga");
  assert.match(f, /inte sparat hos oss/);
  assert.equal(byggEttTillFråga(false, "salong-ada"), null, "ett köpt team ligger i molnet — ingen fråga");
  assert.equal(byggEttTillFråga(true, null), null, "demoteamet är inte kundens");
});

test("U7: knappen frågar innan formuläret ritas", () => {
  const r = kropp("renderResult");
  const i = r.indexOf('"↺ Bygg ett till"');
  assert.ok(i > 0);
  const klick = r.slice(i, r.indexOf("actions.append(", i));
  assert.match(klick, /byggEttTillFråga\(state\.demo, köptSlug\(\)\)/);
  assert.ok(klick.indexOf("confirm(") < klick.indexOf("renderForm()"), "frågan ska komma före formuläret");
});
