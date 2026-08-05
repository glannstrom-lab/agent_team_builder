// Schema-test för portal/teams/*.js — kör med `npm test`.
//
// Varför det finns: helhetsgranskningen 2026-08-05 hittade att alla fem
// inbyggda team saknade halva schemat (why/starters/rejected/routines), vilket
// gjorde att portalens förtroendeargument "Därför detta team" aldrig visades i
// någon demo. Ingen märkte det, för ingenting kontrollerade det. Det här testet
// hade fångat det direkt.
//
// Noll beroenden, kör på node --test. Lägg till fält i REQUIRED när portalen
// börjar läsa dem — det är billigare än att upptäcka luckan hos en kund.

import { test } from "node:test";
import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";

const DIR = "portal/teams";
const REQUIRED_TEAM = ["company", "tagline", "entryAgent", "agents"];
const REQUIRED_AGENT = ["id", "name", "icon", "role", "system"];

// Teamfilerna är klassiska skript som sätter window.TEAM. Kör dem i en
// funktion med ett fejkat window i stället för att dra in en DOM.
function loadTeam(file) {
  const win = {};
  new Function("window", readFileSync(`${DIR}/${file}`, "utf8"))(win);
  return win.TEAM;
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".js") && f !== "index.js");

test("det finns teamfiler att testa", () => {
  assert.ok(files.length > 0, `inga teamfiler i ${DIR}`);
});

for (const file of files) {
  test(`${file} håller schemat portalen läser`, () => {
    const team = loadTeam(file);
    assert.ok(team, "filen satte aldrig window.TEAM");

    for (const key of REQUIRED_TEAM) {
      assert.ok(team[key], `saknar ${key}`);
    }
    assert.ok(Array.isArray(team.agents) && team.agents.length > 0, "agents är tom");

    const ids = new Set();
    for (const agent of team.agents) {
      for (const key of REQUIRED_AGENT) {
        assert.ok(agent[key], `agent ${agent.id || "(utan id)"} saknar ${key}`);
      }
      assert.ok(!ids.has(agent.id), `dubblerat agent-id: ${agent.id}`);
      ids.add(agent.id);
    }

    assert.ok(ids.has(team.entryAgent), `entryAgent "${team.entryAgent}" finns inte bland agenterna`);

    // Rutiner och avvisade förslag pekar in i teamet — en trasig referens
    // yttrar sig annars som en knapp som inte gör någonting.
    for (const r of team.routines || []) {
      assert.ok(ids.has(r.agentId), `rutin "${r.label}" pekar på okänd agent ${r.agentId}`);
    }
  });
}

// Ett team som säljs ska bära produktens argument: varje agent motiverad,
// minst ett avvisat förslag, och startförslag att klicka på. Demoteamen som
// bara finns som strukturexempel undantas medvetet och namnges här, så att
// undantaget syns i stället för att glömmas bort.
const STRUCTURE_ONLY = new Set(["ikea.js", "agency.js", "studio.js"]);

for (const file of files.filter((f) => !STRUCTURE_ONLY.has(f))) {
  test(`${file} bär produktens argument`, () => {
    const team = loadTeam(file);
    assert.ok(Array.isArray(team.rejected) && team.rejected.length > 0,
      'saknar "rejected" — minst ett avvisat förslag är hela poängen med personalliggaren');
    assert.ok(team.divergence, 'saknar "divergence" — resonemanget om varför just det här teamet');
    assert.ok(team.agents.every((a) => a.why),
      "varje agent ska ha en why som knyter den till kundens egna ord");
    assert.ok(team.agents.some((a) => Array.isArray(a.starters) && a.starters.length),
      "inget agentkort har startförslag att klicka på");
  });
}
