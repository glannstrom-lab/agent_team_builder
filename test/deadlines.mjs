// Årshjulets svenska myndighetsdatum (portal/deadlines-se.js) — körda ur
// källan med en fast klocka, inte ur en kopia.
//
// Varför filen finns (genomgången 2026-10-26): tre datumfel låg i årshjulet
// samtidigt. Kvartalsmomsen för Q2 stod på 12 aug fast faktabasen själv säger
// 17 aug (SR1), AGI saknade januari- och augustiundantaget (SR2), och på
// förfallodagen hoppade kortet fram ett år eftersom datumet jämfördes med
// klockslaget (SR3). Sakfel av den sorten är det kunderna säger upp på.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FAKTA_SE } from "../functions/api/_fakta.js";

const window = {};
new Function("window", readFileSync("portal/deadlines-se.js", "utf8"))(window);
const RADER = window.ATB_DEADLINES_SE;
const nästa = window.ATB_NASTA_DEADLINE;
const rad = (re) => RADER.find((r) => re.test(r.label));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

test("på förfallodagen är raden dag 0, även mitt på dagen (SR3)", () => {
  const q3 = rad(/kvartal 3/);
  for (const kl of [0, 9, 23]) {
    const r = nästa(q3, new Date(2026, 10, 12, kl, 30));
    assert.equal(iso(r.when), "2026-11-12");
    assert.equal(r.days, 0);
  }
  assert.equal(nästa(q3, new Date(2026, 10, 13, 8)).when.getFullYear(), 2027, "dagen efter är nästa år");
});

test("AGI är den 17:e i januari och augusti, annars den 12:e (SR2)", () => {
  const agi = rad(/AGI/);
  const r = nästa(agi, new Date(2026, 7, 14, 9));
  assert.equal(iso(r.when), "2026-08-17");
  assert.equal(r.days, 3);
  assert.match(r.label, /senast 17 aug/);
  assert.equal(iso(nästa(agi, new Date(2026, 8, 1)).when), "2026-09-12");
  assert.equal(iso(nästa(agi, new Date(2026, 11, 20)).when), "2027-01-17", "över årsskiftet");
  assert.equal(iso(nästa(agi, new Date(2026, 0, 13)).when), "2026-01-17");
});

test("kvartalsmomsen följer faktabasen: Q2 den 17 augusti (SR1)", () => {
  const q2 = rad(/kvartal 2/);
  assert.equal(q2.month, 8);
  assert.equal(q2.day, 17);
  assert.match(q2.label, /17 aug/);
  const moms = JSON.stringify(FAKTA_SE).match(/17:e i januari och augusti/);
  assert.ok(moms, "faktabasen säger inte längre 17:e i augusti — jämför då raden här igen");
});

test("etiketten säger samma dag som raden räknar med", () => {
  const MÅN = { jan: 1, feb: 2, maj: 5, jul: 7, aug: 8, nov: 11 };
  for (const r of RADER.filter((x) => !x.monthly)) {
    const m = /senast (\d+) (\w+)\)/.exec(r.label);
    assert.ok(m, "ingen datumtext i " + r.label);
    assert.equal(Number(m[1]), r.day, r.label);
    assert.equal(MÅN[m[2]], r.month, r.label);
  }
});

test("portalen räknar med hjälpfunktionen på båda ställena, inte egen datumaritmetik", () => {
  const app = readFileSync("portal/app.js", "utf8");
  assert.equal((app.match(/window\.ATB_NASTA_DEADLINE\(/g) || []).length, 2);
  assert.doesNotMatch(app, /if \(when < now\) when = new Date\(now\.getFullYear\(\), now\.getMonth\(\) \+ 1/);
});
