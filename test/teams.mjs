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

// Samma fällatyp en nivå upp: platsrutterna (invite/members/remove) skrevs i M3
// och stod därefter oanropade i månader. Backend fungerade, testerna var gröna,
// och kundens fråga "hur får min kollega tillgång?" hade ändå bara ett mejl som
// svar — medan den knapp som låg närmast till hands, delningslänken, gav en
// låst vy. En rutt utan anropare är inte halvfärdig, den är osynlig.
//
// Testet är skrivet från katalogen och inte från en lista, så att NÄSTA rutt
// någon lägger under functions/api/team/ omfattas utan att någon minns det.
test("varje platsrutt har ett gränssnitt som anropar den", () => {
  const portal = readFileSync("portal/app.js", "utf8");
  const rutter = readdirSync("functions/api/team")
    .filter((f) => f.endsWith(".js") && !f.startsWith("_"))
    .map((f) => f.replace(/\.js$/, ""));

  assert.ok(rutter.length >= 3, "platsrutterna saknas — invite/members/remove förväntas");
  for (const r of rutter) {
    assert.ok(portal.includes("/api/team/" + r),
      `functions/api/team/${r}.js anropas inte av portalen — rutten finns men ingen kund kan nå den`);
  }

  // Och det kundsynliga: ett anrop utan knapp är samma osynlighet, ett steg
  // längre fram.
  assert.ok(portal.includes("Bjud in en kollega"), "ingen rubrik för att bjuda in — rutan syns inte");
  assert.ok(portal.includes("Kollegor med tillgång"), "medlemslistan har ingen etikett");
});

// ── KA4: perspektiven ska faktiskt SKILJA SIG, inte bara finnas ────────────
//
// Golvet ovan (SEKTIONSGOLV) kontrollerar att rubriken `DITT PERSPEKTIV` står
// där. Det är närvaro, inte innehåll: två agenter kunde bära exakt samma text
// under rubriken och passera. Kvalitetschecklistans "två agenter i samma team
// delar inte perspektiv" var alltså formulerad som mätbar och mättes inte —
// och det är den regel som bär projektets existensberättigande.
//
// Testet kör builderns EGNA funktioner, hämtade ur källan mellan markörerna
// ⟦DELAD-START⟧ och ⟦DELAD-SLUT⟧. En kopia här hade kunnat vara mildare än den
// som faktiskt körs vid generering, vilket är samma fälla som prompten och
// schemat gick i två gånger.
const MÅTTET = (() => {
  const src = readFileSync("builder/builder.js", "utf8");
  const i = src.indexOf("⟦DELAD-START⟧");
  const j = src.indexOf("⟦DELAD-SLUT⟧");
  assert.ok(i >= 0 && j > i, "hittade inte det delade perspektiv-blocket i builder/builder.js");
  // Markörerna står i kommentarrader. Klipp från raden EFTER startmarkören och
  // fram till radbörjan för slutmarkören, annars börjar biten mitt i ett `//`.
  const kropp = src.slice(src.indexOf("\n", i) + 1, src.lastIndexOf("\n", j) + 1);
  assert.ok(kropp.includes("function perspektivBrister"),
    "det delade blocket ser inte ut som väntat — flyttades markörerna?");
  return new Function(
    kropp + "; return { perspektivText, perspektivLikhet, perspektivBrister, PERSPEKTIV_TAK, PERSPEKTIV_GOLV };"
  )();
})();

// Ett mått som ingen anropar är samma sorts skenkontroll som KA4 handlade om,
// bara ett steg längre bak. Grinden är en rad, och den raden ska finnas.
test("builderns generering kör faktiskt perspektiv-måttet", () => {
  const src = readFileSync("builder/builder.js", "utf8");
  const i = src.indexOf("function kontrolleraSystemprompter");
  assert.ok(i >= 0, "hittade inte kontrolleraSystemprompter");
  const kropp = src.slice(i, src.indexOf("\n}", i));
  assert.ok(kropp.includes("perspektivBrister("),
    "kontrolleraSystemprompter anropar inte perspektivBrister — måttet finns men körs aldrig");
});

// Motprov FÖRST: ett mått som alltid svarar "olika" hade gjort varje test
// nedan grönt utan att mäta något. Det är exakt felet KA4 handlar om.
test("perspektiv-måttet känner igen en dubblett", () => {
  const a = "Du ser verksamheten ur kundens ögon och letar alltid efter var löftet " +
    "spricker mellan offert och leverans. Du varnar för sådant som ser prydligt ut i " +
    "kalkylen men skaver i kundmötet.";
  const b = a.replace("kundens ögon", "kundens perspektiv");

  assert.equal(MÅTTET.perspektivLikhet(a, a), 1, "identisk text ska ge 1");
  assert.ok(MÅTTET.perspektivLikhet(a, b) >= MÅTTET.PERSPEKTIV_TAK,
    "ett omskrivet ord ska inte räcka för att komma undan");

  const brister = MÅTTET.perspektivBrister([
    { name: "Ett", system: "DITT PERSPEKTIV\n" + a + "\n\nLEVERANS\n..." },
    { name: "Två", system: "DITT PERSPEKTIV\n" + b + "\n\nLEVERANS\n..." },
  ]);
  assert.equal(brister.length, 1, "dubbletten skulle ha fällts");
  assert.match(brister[0], /samma perspektiv/);
});

test("perspektiv-måttet släpper igenom två riktiga, olika perspektiv", () => {
  const brister = MÅTTET.perspektivBrister([
    { name: "Offert", system: "DITT PERSPEKTIV\nDu räknar hem varje jobb innan det " +
      "börjar och letar efter timmar som ingen fakturerar. Du varnar när ett fastpris " +
      "vilar på antaganden ingen kontrollerat.\n\nLEVERANS\n..." },
    { name: "Text", system: "DITT PERSPEKTIV\nDu skriver som verkstaden låter och " +
      "vaktar tonen mot kund. Du varnar när en formulering lovar mer än hantverket " +
      "faktiskt hinner med.\n\nLEVERANS\n..." },
  ]);
  assert.deepEqual(brister, []);
});

test("en tom rubrik är inte ett perspektiv", () => {
  const brister = MÅTTET.perspektivBrister([
    { name: "Tom", system: "DITT PERSPEKTIV\n\nLEVERANS\nNågot annat." },
  ]);
  assert.equal(brister.length, 1);
  assert.match(brister[0], /tom eller nästan tom/);
});

// Och så själva poängen: varje team som ligger i repot måste hålla ribban.
for (const file of files) {
  test(`${file} har agenter med olika perspektiv`, () => {
    const team = loadTeam(file);
    const brister = MÅTTET.perspektivBrister(team.agents);
    assert.deepEqual(brister, [], brister.join("\n"));
  });
}

// Fördelningen, inte bara taket. Uppmätt 2026-08-29 över 108 agentpar:
// median 0,12 · p90 0,23 · p99 0,36 · max 0,42. Taket 0,70 har alltså god
// marginal — men om marginalen försvinner ska det märkas HÄR, medan den som
// lade till teamet fortfarande minns varför, och inte som ett fällt bygge hos
// en kund. 0,55 är varningsnivån: fortfarande under taket, men långt över allt
// vi sett.
test("inget agentpar i repot närmar sig taket", () => {
  let värst = { l: 0, var: "" };
  for (const file of files) {
    const agenter = loadTeam(file).agents;
    for (let i = 0; i < agenter.length; i++) {
      for (let j = i + 1; j < agenter.length; j++) {
        const l = MÅTTET.perspektivLikhet(
          MÅTTET.perspektivText(agenter[i].system),
          MÅTTET.perspektivText(agenter[j].system)
        );
        if (l > värst.l) värst = { l, var: `${file}: ${agenter[i].id}~${agenter[j].id}` };
      }
    }
  }
  assert.ok(värst.l < 0.55,
    `${värst.var} ligger på ${värst.l.toFixed(2)} — under taket ${MÅTTET.PERSPEKTIV_TAK} ` +
    `men långt över allt annat i repot (max var 0,42 när måttet skrevs). Skriv om det ena ` +
    `perspektivet, eller mät om fördelningen och flytta gränsen medvetet.`);
});
