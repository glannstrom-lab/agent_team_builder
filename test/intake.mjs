// Tester för builderns intake-bygge — enkätvägen (KA1/KA3).
//
// Varför de finns: förvalsenkäten är byggd för att kunna ersätta fritexten helt,
// och det är också den vägen som mest hotar projektets kärnregel. Uppmätt
// 2026-08-17: två salonger med samma kryss och tom fritext gav ett intake-block
// som var identiskt byte för byte utom raden `företagsnamn:` — 798 tecken, en
// rad skiljer. Ingen test rörde vägen, så ingenting sa ifrån.
//
// Testerna nedan mäter TVÅ saker, och skillnaden mellan dem är hela poängen:
//   1. att rent enkätintag fortfarande är oskiljbart (det är en egenskap hos
//      fasta listval, inte en bugg att koda bort), och
//   2. att koden VET det, så att den tvingande följdfrågan slår till.
// Punkt 2 är skyddet. Faller det, kan två kunder få samma team igen.

import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

const KÄLLA = readFileSync("builder/builder.js", "utf8");

// builder.js är ett klassiskt skript för webbläsaren (DOM, window, fetch). Här
// plockas de två rena funktionerna ut ur källan och körs isolerat — samma
// grepp som i test/klient.mjs, och det som gör att vägen går att testa alls
// utan att bygga om buildern till moduler.
function plocka(namn) {
  const i = KÄLLA.indexOf(`function ${namn}`);
  assert.ok(i >= 0, `hittade inte function ${namn} i builder/builder.js`);
  let djup = 0, k = KÄLLA.indexOf("{", i);
  for (; k < KÄLLA.length; k++) {
    if (KÄLLA[k] === "{") djup++;
    else if (KÄLLA[k] === "}") { djup--; if (djup === 0) break; }
  }
  // eslint-disable-next-line no-eval
  return eval("(" + KÄLLA.slice(i, k + 1) + ")");
}

const buildIntakeBlock = plocka("buildIntakeBlock");
const enkatBaradIntake = plocka("enkatBaradIntake");

// Ett rent enkätintag: allt kommer ur fasta listor, ingen fritext.
const baraKryss = (företag) => ({
  company: företag, mode: "team-builder", size: "solo", audience: "verksamhet",
  what: "", moments: "", pains: "", tools: "", goals: "", nogo: "",
  survey: {
    industry: "Frisör / salong", customers: ["Privatpersoner"], sales: ["Bokning på plats"],
    moments: ["Boka och omboka kunder", "Svara på meddelanden"],
    tidstjuvar: ["Svara på meddelanden"], tools: ["Instagram"],
    goals: ["Frigöra tid"], nogo: ["Inget särskilt"],
  },
});

test("rent enkätintag ger identiskt underlag för två olika företag", () => {
  // Dokumenterar fyndet, så att ingen tror att problemet är löst i intaget.
  const a = buildIntakeBlock(baraKryss("Salong Ada"));
  const b = buildIntakeBlock(baraKryss("Klipp & Co"));
  const normA = a.replace(/Salong Ada/g, "X");
  const normB = b.replace(/Klipp & Co/g, "X");
  assert.equal(normA, normB,
    "om det här börjar skilja sig har enkäten fått något särskiljande — uppdatera testet");
  const olikaRader = a.split("\n").filter((r, i) => r !== b.split("\n")[i]);
  assert.equal(olikaRader.length, 1, "exakt en rad ska skilja: företagsnamnet");
  assert.match(olikaRader[0], /företagsnamn:/);
});

test("koden känner igen ett rent enkätintag — det är skyddet", () => {
  // Faller det här testet är den tvingande följdfrågan borta, och två kunder
  // kan få samma team igen utan att något säger ifrån.
  assert.equal(enkatBaradIntake(baraKryss("Salong Ada")), true);
});

test("en mening i valfritt fritextfält räknas som eget underlag", () => {
  const fält = ["what", "moments", "pains", "goals", "nogo"];
  for (const f of fält) {
    const i = Object.assign(baraKryss("Salong Ada"), { [f]: "Vi klipper mest barn och pensionärer på förmiddagarna." });
    assert.equal(enkatBaradIntake(i), false, `${f} med en mening ska räknas som fritext`);
  }
});

test("för korta svar räknas inte som beskrivning", () => {
  for (const svar of ["nej", "vet ej", "-", "   ", "inget"]) {
    const i = Object.assign(baraKryss("Salong Ada"), { what: svar });
    assert.equal(enkatBaradIntake(i), true, `"${svar}" ska inte passera som underlag`);
  }
});

test("fritext gör underlagen olika — det är hela poängen", () => {
  const a = Object.assign(baraKryss("Salong Ada"), { pains: "Vi tappar tider när folk avbokar sent på söndagar." });
  const b = Object.assign(baraKryss("Klipp & Co"), { pains: "Färgningar tar dubbelt så lång tid som vi bokar in dem på." });
  const normA = buildIntakeBlock(a).replace(/Salong Ada/g, "X");
  const normB = buildIntakeBlock(b).replace(/Klipp & Co/g, "X");
  assert.notEqual(normA, normB);
});

test("personläget mäts på personens egna fält, inte verksamhetens", () => {
  // I personläget bär role/workplace/expectations specificiteten. Mättes de på
  // verksamhetsfälten skulle en ifylld roll inte räknas, och en anställd hade
  // tvingats till följdfrågan i onödan.
  const bas = {
    company: "Anna", mode: "team-builder", size: "solo", audience: "person",
    role: "", workplace: "", moments: "", pains: "", expectations: "",
    survey: { industry: "Redovisning", prole: "", who: ["Kollegor"], moments: ["Bokslut"], tidstjuvar: [] },
  };
  assert.equal(enkatBaradIntake(bas), true);
  assert.equal(enkatBaradIntake(Object.assign({}, bas, { role: "Jag sköter lönerna för nio bolag." })), false);
  // Verksamhetsfältet `what` finns inte i personläget och ska inte räknas.
  assert.equal(enkatBaradIntake(Object.assign({}, bas, { what: "En helt annan beskrivning här." })), true);
});
