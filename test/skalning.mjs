// Tester för skalningsstegets utdata-rensning (KA5) i builder/builder.js.
//
// Varför de finns: `prompts/shared/scale.md` beställer exakt två rader och
// skriver uttryckligen "Räkna tyst. Visa inte mellansteg eller resonemang i
// outputen", med skälet att Buildern visar steget LIVE för kunden. Kravet vilade
// ändå bara på att modellen lyder — koden visade vad som än kom. Ett steg som
// säljs som "vi kartlägger er vecka" och i stället visar en modell som tvekar
// högt är ett kundproblem, precis som prompten själv säger.
//
// Rensningen ska vara strikt mot brus och förlåtande mot format: hittas inget
// "Skalningsbeslut:" ska råtexten visas, eftersom ett beslut som inte når kunden
// är värre än ett beslut med brus omkring.

import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

const KÄLLA = readFileSync("builder/builder.js", "utf8");

function plocka(namn) {
  const i = KÄLLA.indexOf(`function ${namn}`);
  assert.ok(i >= 0, `hittade inte function ${namn}`);
  let djup = 0, k = KÄLLA.indexOf("{", i);
  for (; k < KÄLLA.length; k++) {
    if (KÄLLA[k] === "{") djup++;
    else if (KÄLLA[k] === "}") { djup--; if (djup === 0) break; }
  }
  // eslint-disable-next-line no-eval
  return eval("(" + KÄLLA.slice(i, k + 1) + ")");
}

const rensaSkalning = plocka("rensaSkalning");

const RENT = `Skalningsbeslut: 4 agenter (VD + VD-assistent + 2 specialister)
Motivering: Solo → intervall 2–4. Research hittade 3 kluster över ribban.
Valde 4 för att textproduktion och kundmejl är olika perspektiv.`;

test("ett rent svar går igenom oförändrat", () => {
  assert.equal(rensaSkalning(RENT), RENT);
});

test("resonemang FÖRE beslutet klipps bort", () => {
  const läckt = `Låt mig tänka. Storleken är solo, vilket ger 2–4 agenter.
Men research hittade 3 kluster, så egentligen kanske 5? Nej, taket är 4.
Hmm, vänta — VD räknas in. Okej.

${RENT}`;
  const ut = rensaSkalning(läckt);
  assert.equal(ut, RENT);
  assert.ok(!/Låt mig tänka|Hmm|kanske 5/.test(ut), "tankekedjan får inte nå kunden");
});

test("resonemang EFTER motiveringen klipps bort", () => {
  const ut = rensaSkalning(`${RENT}

Osäkerhet: jag är inte helt säker på om mässplaneringen borde vara egen agent.
Låt mig räkna om... nej, 4 står fast.`);
  assert.equal(ut, RENT);
});

test("kodstängsel ur promptens exempel följer inte med", () => {
  const ut = rensaSkalning("```\n" + RENT + "\n```");
  assert.equal(ut, RENT);
});

test("fetstil på etiketterna accepteras", () => {
  // Modellen lägger gärna på markdown även när formatet inte ber om det.
  const ut = rensaSkalning("**Skalningsbeslut:** 3 agenter\n**Motivering:** Solo, två kluster.");
  assert.match(ut, /Skalningsbeslut/);
  assert.match(ut, /Motivering/);
});

test("en tom rad MELLAN de två raderna bryter inte ut motiveringen", () => {
  const ut = rensaSkalning("Skalningsbeslut: 3 agenter\n\nMotivering: Solo, två kluster.");
  assert.match(ut, /Motivering: Solo/, "motiveringen är halva beslutet och får inte tappas");
});

test("saknas beslutet returneras null — då visas råtexten", () => {
  // Det förlåtande hållet. Ett beslut som inte når kunden är värre än brus:
  // skalningen styr hela resten av bygget.
  assert.equal(rensaSkalning("Jag kan inte avgöra antalet utan mer underlag."), null);
  assert.equal(rensaSkalning(""), null);
  assert.equal(rensaSkalning(null), null);
});
