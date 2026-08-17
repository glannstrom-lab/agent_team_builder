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
// minst ett avvisat förslag, och startförslag att klicka på. Mängden nedan är
// tom sedan agency/studio/ikea fyllts ut (2026-08-05) — den står kvar som
// namngiven krok, så att ett framtida undantag måste skrivas ut i stället för
// att smyga in som ett team utan motiveringar.
const STRUCTURE_ONLY = new Set([]);

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

// Golvet på systemprompternas INNEHÅLL (C6). Schemat garanterar att `system`
// finns och är en sträng; det säger ingenting om vad som står i den. Uppmätt
// 2026-08-15: två av fjorton teamfiler saknade DITT PERSPEKTIV i samtliga
// agenter, och ingenting sa ifrån.
//
// De två sektionerna nedan är inte godtyckligt valda ur PORTAL_RULES tio:
//
//   DITT PERSPEKTIV är det som gör att två agenter med närliggande uppgifter
//   svarar olika. Utan den går kvalitetschecklistans "två agenter i samma team
//   delar inte perspektiv" inte att uppfylla ens i teorin.
//
//   LEVERANS bär "Klart när"-punkterna, alltså det kunden bedömer ett färdigt
//   svar mot.
//
// Samma golv kontrolleras i builder/builder.js (`kontrolleraSystemprompter`)
// vid generering. Här kontrolleras det som redan ligger i repot — nygenererat
// och handskrivet ska hålla samma ribba.
const SEKTIONSGOLV = ["DITT PERSPEKTIV", "LEVERANS"];

for (const file of files) {
  test(`${file} har perspektiv och leverans i varje systemprompt`, () => {
    const team = loadTeam(file);
    for (const agent of team.agents) {
      const sys = String(agent.system || "").toUpperCase();
      for (const sektion of SEKTIONSGOLV) {
        assert.ok(sys.includes(sektion),
          `agent ${agent.id} saknar ${sektion} i systemprompten`);
      }
    }
  });
}

// Produktens farligaste felläge: en agent som hittar på kunddata och lägger
// fram den som avläst fakta (namngivna personer, möten, "jag har gått igenom
// kalendern"). Orsaken var promptdesign — LEVERANS krävde en ifylld artefakt
// medan förbudet mot att gissa låg som en bisats. Varje agent ska nu bära
// regeln uttryckligen och tidigt i sin systemprompt.
for (const file of files) {
  test(`${file} förbjuder påhittade uppgifter i varje systemprompt`, () => {
    const team = loadTeam(file);
    for (const agent of team.agents) {
      assert.ok(/VIKTIGAST AV ALLT/.test(agent.system),
        `agent ${agent.id} saknar regeln mot påhittade uppgifter i systemprompten`);
    }
  });
}

// ── stripTeam måste bära vidare varje fält portalen läser (KA2) ────────────
//
// `stripTeam()` i builder/builder.js formar ALLT som lämnar Buildern: utkastet,
// delningslänken, konfigen som går till /api/checkout och nedladdningen. Ett
// fält som saknas i dess objektliteral kastas i tysthet, hur väl det än
// genererats — och prompten plus TEAM_SCHEMA fyller fältet, så kunden betalar
// för tokens som aldrig når henne. Så tappades `triggers` bort: krävt i
// schemat, renderat i builderns förhandsvisning, men borta i portalen.
//
// Testet läser fältlistan ur källan i stället för att köra funktionen, eftersom
// builder.js är ett webbläsarskript med DOM-beroenden i topp.
test("stripTeam bär vidare varje agentfält portalen läser", () => {
  const src = readFileSync("builder/builder.js", "utf8");
  const i = src.indexOf("function stripTeam");
  assert.ok(i >= 0, "hittade inte stripTeam i builder/builder.js");
  const kropp = src.slice(i, src.indexOf("\n}", i));

  // Fält som portalens agentkort och arbetsyta faktiskt läser. Läggs ett nytt
  // fält till i TEAM_SCHEMA och prompten måste det stå här också — annars är
  // det ett dödfält, precis som `language` och `defaultModel` blev.
  // Enkel nyckel-närvaro i stället för regex: fältnamnen är kända och
  // objektliteralen skriver dem alltid som `namn:`.
  const bär = (fält) => kropp.includes(fält + ":");
  for (const fält of ["id", "name", "icon", "role", "tagline", "always", "job", "capabilities", "starters", "triggers", "system"]) {
    assert.ok(bär(fält), `stripTeam utelämnar agents[].${fält} — fältet kastas ur allt som lämnar Buildern`);
  }
  // Teamnivån: fälten arbetsytan bygger sina paneler av.
  for (const fält of ["routines", "seasons", "firstProject", "rejected", "workstyle", "entryAgent"]) {
    assert.ok(bär(fält), `stripTeam utelämnar team.${fält}`);
  }
});

// Motprovet: fältet ska också LÄSAS någonstans i portalen. Ett fält som bärs
// vidare men aldrig visas är samma dödfält, bara ett steg längre fram.
test("triggers läses av portalen, inte bara av builderns förhandsvisning", () => {
  const portal = readFileSync("portal/app.js", "utf8");
  assert.ok(portal.includes("agent.triggers"), "portal/app.js läser inte agent.triggers");
  // Kräv också det KUNDSYNLIGA: en läsning utan utskrift är samma dödfält, ett
  // steg längre fram. Etiketten är beviset på att fältet når skärmen.
  assert.ok(portal.includes("Vänd dig hit när"),
    "portalen läser triggers men visar dem aldrig — ingen etikett på agentkortet");
  assert.ok(portal.includes("trigger-chip"), "chipsen renderas inte");
  const css = readFileSync("portal/portal.css", "utf8");
  assert.ok(css.includes(".trigger-chip"), "trigger-chip saknar stil — osynlig i praktiken");
});
