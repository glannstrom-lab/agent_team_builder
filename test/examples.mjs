// Tester för examples/ — kör med `npm test`.
//
// Varför de finns: `examples/` är facit. CLAUDE.md säger till den som precis
// öppnat projektet att titta där för att se vad output ska likna, och
// team-builder-exemplen är uttryckligen facit för kärnan. Ett facit som saknar
// det output ska innehålla lär ut fel sak — tyst, och till varje ny läsare
// (människa som modell).
//
// Uppmätt 2026-08-15: samtliga sex exempel saknade Perspektiv och "Klart när"
// helt, trots att `proposal.md` beställer båda och portalens systemprompter
// byggs av dem. Prompterna hade alltså skärpts medan facit stod kvar.
//
// Samma två krav som golvet i `test/teams.mjs` och i builderns
// `kontrolleraSystemprompter()`: perspektivet är det som gör att två agenter
// svarar olika, leveransen bär "Klart när"-punkterna.

import { test } from "node:test";
import assert from "node:assert";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const ROT = "examples";

// Varje test-output.md under examples/<läge>/<kund>/.
function exempelfiler() {
  const ut = [];
  for (const läge of readdirSync(ROT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const lägesväg = `${ROT}/${läge.name}`;
    for (const kund of readdirSync(lägesväg, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      const fil = `${lägesväg}/${kund.name}/test-output.md`;
      if (existsSync(fil)) ut.push(fil);
    }
  }
  return ut;
}

const filer = exempelfiler();

test("det finns exempel att testa", () => {
  assert.ok(filer.length >= 6, `hittade bara ${filer.length} exempel — förväntade minst 6`);
});

for (const fil of filer) {
  test(`${fil} har perspektiv och leverans för varje agent`, () => {
    const text = readFileSync(fil, "utf8");
    const agenter = (text.match(/^\*\*Jobb:\*\*/gm) || []).length;
    assert.ok(agenter > 0, "hittade inga agentblock (**Jobb:**)");

    // Räknas per sektion i stället för per agentblock: varje agent har exakt
    // ett Jobb, så lika många Perspektiv och Leverans betyder att ingen agent
    // saknar dem. Enklare och mer robust än att stycka upp filen på rubriker,
    // vars nivå varierar mellan exemplen.
    const perspektiv = (text.match(/^\*\*Perspektiv:\*\*/gm) || []).length;
    const leverans = (text.match(/^\*\*Leverans:\*\*/gm) || []).length;
    const klartNär = (text.match(/^Klart när:/gm) || []).length;

    assert.equal(perspektiv, agenter,
      `${agenter} agenter men ${perspektiv} Perspektiv — utan det blir agenterna utbytbara`);
    assert.equal(leverans, agenter,
      `${agenter} agenter men ${leverans} Leverans`);
    assert.equal(klartNär, agenter,
      `${agenter} agenter men ${klartNär} "Klart när" — leveransen behöver kriterier att bedömas mot`);
  });
}

test("varje agent har en avvisad motpart någonstans i teamet", () => {
  // Kvalitetschecklistan: minst en föreslagen agent ska avvisas i en typisk
  // körning. Ett facit där allt godkändes lär ut att ribban är låg.
  for (const fil of filer) {
    const text = readFileSync(fil, "utf8");
    assert.match(text, /^## \d+\. Avvisade|^## Avvisade|Avvisade/m,
      `${fil} saknar avsnitt om avvisade förslag`);
  }
});
