// Mötesrummet (SP7) och kandidaten in i teamet (SP9/SP17 punkt 3–4).
//
// Funktionerna hämtas ur builder/builder.js och körs som de står där — samma
// grepp som DELAD-blocket i test/teams.mjs: en kopia här hade kunnat vara
// snällare än koden kunden kör.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INTERVJU_MAX_TURER, INTERVJU_MAX_SVAR } from "../functions/api/_build.js";

const src = readFileSync("builder/builder.js", "utf8");

// Från "function namn(" till första rad som bara är "}".
function fn(namn) {
  const i = src.indexOf(`function ${namn}(`);
  assert.ok(i >= 0, `hittade inte ${namn} i builder.js`);
  const j = src.indexOf("\n}\n", i);
  return src.slice(i, j + 3);
}
const konst = (namn) => {
  const m = src.match(new RegExp(`^const ${namn} = [^;]*;`, "m"));
  assert.ok(m, `hittade inte ${namn} i builder.js`);
  return m[0] + "\n";
};
const delad = (() => {
  const i = src.indexOf("⟦DELAD-START⟧"), j = src.indexOf("⟦DELAD-SLUT⟧");
  return src.slice(src.indexOf("\n", i) + 1, src.lastIndexOf("\n", j) + 1);
})();

// avatars.js är ett klassiskt skript som sätter window.ATBAvatars.
function avatarer() {
  const win = {};
  new Function("window", "location", readFileSync("avatars.js", "utf8"))(win, { hostname: "localhost" });
  return win.ATBAvatars;
}

const ATBAvatars = avatarer();
const window_assign = (t) => ATBAvatars.assign(t);

const B = new Function("window",
  delad + konst("STORLEKAR") + konst("MOTE_MAX_TURER") + konst("MOTE_MAX_SVAR") +
  fn("kandidatRader") + fn("buildIntakeBlock") + fn("intagTillIntake") + fn("sättKandidat") +
  "; return { kandidatRader, buildIntakeBlock, intagTillIntake, sättKandidat, MOTE_MAX_TURER, MOTE_MAX_SVAR };"
)({ ATBAvatars });

const INTAG = `företagsnamn:       okänt
bransch:            bygg
storlek:            litet
antal_personer:     4
källa:              intervju

## Vad företaget gör
Vi bygger om badrum.

## Återkommande moment
Offerter, tre timmar i veckan.

## Avgränsningar
Inga uttryckliga avgränsningar.`;

test("klientens tak är serverns tak", () => {
  assert.equal(B.MOTE_MAX_TURER, INTERVJU_MAX_TURER, "räknaren i mötesrummet säger fel antal frågor");
  assert.equal(B.MOTE_MAX_SVAR, INTERVJU_MAX_SVAR, "svarsfältet släpper igenom svar servern avvisar");
});

test("intaget ur intervjun blir ett intake som pipelinen känner", () => {
  const k = { namn: "Robin", avatarN: 7, chef: "Mikael", firma: "Glänne & Söner" };
  const i = B.intagTillIntake(INTAG, k);
  assert.equal(i.audience, "verksamhet");
  assert.equal(i.size, "litet");
  assert.equal(i.mode, "team-builder");
  // "okänt" i intaget ersätts av firman ur scenen — både i rubriken och i texten.
  assert.equal(i.company, "Glänne & Söner");
  assert.match(i.intakeText, /^företagsnamn:\s+Glänne & Söner$/m);
  assert.equal(i.kandidat, k);

  const p = B.intagTillIntake("teamet_för: en enskild person i sitt jobb\nroll: ekonomiassistent\nstorlek: solo\n\n## Vem teamet byggs för\nJag.", null);
  assert.equal(p.audience, "person");
  assert.equal(p.size, "solo");
  assert.equal(p.company, "ekonomiassistent");

  // En storlek modellen hittat på faller tillbaka på ett giltigt värde.
  assert.equal(B.intagTillIntake("storlek: jättestort\n", null).size, "litet");
});

test("intervjuns intag går vidare som det är, med kandidatens rader i huvudet", () => {
  const i = B.intagTillIntake(INTAG, { namn: "Robin", avatarN: 7, chef: "Mikael", firma: "Glänne & Söner" });
  const block = B.buildIntakeBlock(i);
  assert.ok(block.startsWith("```\n") && block.endsWith("\n```"), "blocket ska stå i kodstaket som formulärets");
  assert.match(block, /vd_assistentens_namn: Robin/);
  assert.match(block, /kundens_namn:\s+Mikael/);
  // Raderna hör till huvudet — före första rubriken, där research läser fälten.
  assert.ok(block.indexOf("vd_assistentens_namn") < block.indexOf("## Vad företaget gör"));
  for (const del of ["## Återkommande moment", "Offerter, tre timmar i veckan.", "## Avgränsningar"]) {
    assert.ok(block.includes(del), `${del} föll bort på vägen`);
  }
  // Utan kandidat: inga rader om namn — proposal.md skriver då rollnamnet.
  assert.doesNotMatch(B.buildIntakeBlock(B.intagTillIntake(INTAG, null)), /vd_assistentens_namn/);
});

const lag = () => ({
  company: "Glänne & Söner",
  agents: [
    { id: "vd-assistent", name: "VD-assistent", system: "Du förbereder valen." },
    { id: "offert", name: "Offertskrivaren", system: "x" },
    { id: "ekonomi", name: "Ekonomiavstämning", system: "y" },
  ],
});

test("kandidaten blir VD-assistenten: namnet, ansiktet och vetskapen om namnet", () => {
  const t = B.sättKandidat(lag(), { namn: "Robin", avatarN: 7, chef: "Mikael" });
  const vd = t.agents[0];
  assert.equal(vd.name, "Robin");
  assert.equal(vd.avatarN, 7);
  assert.match(vd.system, /^Du heter Robin\./, "hon ska veta vad hon heter, annars presenterar hon sig som rollen");
  // Ingen kollega får hennes ansikte, och alla har ett.
  const n = t.agents.map((a) => a.avatarN);
  assert.equal(new Set(n).size, n.length, `två agenter delar porträtt: ${n}`);
  assert.ok(n.every((x) => Number.isInteger(x) && x >= 1 && x <= 25));
  // Det svåra fallet: kunden väljer just det porträtt som avatars.js annars
  // hade gett första specialisten. Då måste specialisten flyttas.
  const fri = B.sättKandidat(lag(), null);
  window_assign(fri);
  const krock = fri.agents[1].avatarN;
  const k2 = B.sättKandidat(lag(), { namn: "Robin", avatarN: krock });
  const n2 = k2.agents.map((a) => a.avatarN);
  assert.equal(k2.agents[0].avatarN, krock);
  assert.equal(new Set(n2).size, n2.length, `specialisten behöll VD-assistentens porträtt: ${n2}`);
  // Står namnet redan i prompten läggs raden inte till en gång till.
  const igen = B.sättKandidat({ agents: [{ id: "vd-assistent", name: "x", system: "Jag är Robin." }] }, { namn: "Robin" });
  assert.equal(igen.agents[0].system, "Jag är Robin.");
});

test("ett namn som krockar med kundens eget sätts inte (proposal.md, Namnen)", () => {
  const t = B.sättKandidat(lag(), { namn: "Mikael", avatarN: 3, chef: "Mikael Glännström" });
  assert.equal(t.agents[0].name, "VD-assistent");
  assert.doesNotMatch(t.agents[0].system, /Du heter/);
  assert.equal(t.agents[0].avatarN, 3, "ansiktet är fortfarande kundens val");
});

test("utan kandidat, eller med ett ogiltigt porträtt, rörs teamet inte", () => {
  const t = B.sättKandidat(lag(), null);
  assert.equal(t.agents[0].name, "VD-assistent");
  const u = B.sättKandidat(lag(), { namn: null, avatarN: 99 });
  assert.equal(u.agents[0].avatarN, undefined);
});

test("Buildern anropar intervjusteget och sätter kandidaten i sammanställningen", () => {
  assert.match(src, /step: "intervju"/);
  assert.match(src, /sättKandidat\(team, intake\.kandidat\)/,
    "structureTeam ska bära kandidaten in i teamet — annars stannar valet i scenen");
  // Kandidaten följer bara med ur scenen när kunden inte redan valt i mötet.
  assert.match(src, /if \(!prevR && !intake\.kandidat && !state\.demo\)/);
});
