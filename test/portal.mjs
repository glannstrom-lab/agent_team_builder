// Tester för portalens kvitto på auto-levererade rutiner (P6).
//
// Varför de finns: `portal/app.js` är 4 800 rader och hade noll tester — och
// den här delen är just den sort som inte syns när den går sönder. Listan över
// rutiner teamet kört automatiskt låg i en modulvariabel, alltså raderad vid
// varje sidladdning. Eftersom `routineMarkDone()` körs i samma andetag
// försvann kortet "✅ X ligger klar hos Y — läs" vid F5, OCH kortet
// "📌 Idag: X" kom inte tillbaka i stället. Arbetet var gjort och betalt, låg
// färdigt längst ner i en agents historik, och portalen sa ingenting.
//
// Reglerna nedan är hela beteendet, och de går inte att läsa ur koden i en
// webbläsare utan att sitta och trycka F5. Därför står de här i stället.
//
// Blocket körs ur källan (mellan ⟦AUTO-START⟧ och ⟦AUTO-SLUT⟧) i stället för
// att kopieras hit — en kopia kan bli mildare än den som faktiskt kör, vilket
// är den fälla projektet redan gått i två gånger med prompten och schemat.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const KÄLLA = readFileSync("portal/app.js", "utf8");

function laddaAuto({ demo = false, slug = "kund" } = {}) {
  const i = KÄLLA.indexOf("⟦AUTO-START⟧");
  const j = KÄLLA.indexOf("⟦AUTO-SLUT⟧");
  assert.ok(i >= 0 && j > i, "hittade inte auto-blocket i portal/app.js");
  const kropp = KÄLLA.slice(KÄLLA.indexOf("\n", i) + 1, KÄLLA.lastIndexOf("\n", j) + 1);
  assert.ok(kropp.includes("function autoMarkRead"), "auto-blocket ser inte ut som väntat");

  const lager = new Map();
  const localStorage = {
    getItem: (k) => (lager.has(k) ? lager.get(k) : null),
    setItem: (k, v) => lager.set(k, String(v)),
    removeItem: (k) => lager.delete(k),
  };
  const api = new Function("state", "localStorage", kropp +
    "; return { autoLoad, autoSave, autoDeliveredPush, autoMarkRead, AUTO_MAX_ÅLDER };"
  )({ demo, slug }, localStorage);
  return { ...api, lager };
}

test("kvittot överlever en omladdning — hela poängen med P6", () => {
  const a = laddaAuto();
  a.autoDeliveredPush("Måndagsbrief", "vd-assistent");
  // "Omladdning": ett nytt anrop läser samma lager, utan modultillstånd.
  const kvar = a.autoLoad();
  assert.equal(kvar.length, 1);
  assert.equal(kvar[0].label, "Måndagsbrief");
  assert.equal(kvar[0].agentId, "vd-assistent");
  assert.ok(kvar[0].at > 0, "kvittot saknar tidsstämpel — då går varken ålder eller ordning att avgöra");
});

test("att öppna agentens samtal kvitterar bort kortet", () => {
  const a = laddaAuto();
  a.autoDeliveredPush("Måndagsbrief", "vd-assistent");
  a.autoDeliveredPush("Veckans siffror", "ekonomi");

  assert.equal(a.autoMarkRead("vd-assistent"), true, "skulle ha tagit bort något");
  const kvar = a.autoLoad();
  assert.deepEqual(kvar.map((d) => d.label), ["Veckans siffror"],
    "bara den lästa agentens kvitto ska försvinna");

  assert.equal(a.autoMarkRead("vd-assistent"), false,
    "andra gången finns inget att kvittera — då ska pulsen inte ritas om i onödan");
});

test("samma rutin igen ersätter det gamla kvittot", () => {
  // Utan det växer pulsen med flera kort som säger samma sak, vecka för vecka.
  const a = laddaAuto();
  a.autoDeliveredPush("Måndagsbrief", "vd-assistent");
  a.autoDeliveredPush("Måndagsbrief", "vd-assistent");
  assert.equal(a.autoLoad().length, 1);
});

test("ett kvitto äldre än en vecka räknas inte längre", () => {
  // En auto-rutin är veckovis: efter sju dagar har nästa körning lagt ett nytt
  // svar under det gamla, och "ligger klar" pekar på fel text.
  const a = laddaAuto();
  const gammalt = Date.now() - a.AUTO_MAX_ÅLDER - 60000;
  a.autoSave([
    { label: "Förra veckans brief", agentId: "vd-assistent", at: gammalt },
    { label: "Den här veckans", agentId: "vd-assistent", at: Date.now() },
  ]);
  assert.deepEqual(a.autoLoad().map((d) => d.label), ["Den här veckans"]);
});

test("trasigt eller tomt lager ger inga kort, inte en krasch", () => {
  // Pulsen ritas vid varje sidladdning. Ett kastat undantag här hade tagit
  // hela arbetsytan med sig.
  const a = laddaAuto();
  assert.deepEqual(a.autoLoad(), []);
  a.lager.set("atb_auto_kund", "{inte json");
  assert.deepEqual(a.autoLoad(), []);
  a.lager.set("atb_auto_kund", JSON.stringify({ inte: "en lista" }));
  assert.deepEqual(a.autoLoad(), []);
  // Poster utan agent eller etikett är obrukbara som kort — de filtreras bort.
  a.lager.set("atb_auto_kund", JSON.stringify([{ label: "X" }, { agentId: "y", at: Date.now() }]));
  assert.deepEqual(a.autoLoad(), []);
});

test("demoläget skriver aldrig till lagret", () => {
  // Demot delar localStorage-nyckelrymd med riktiga team i samma webbläsare.
  const a = laddaAuto({ demo: true });
  a.autoDeliveredPush("Måndagsbrief", "vd-assistent");
  assert.equal(a.lager.size, 0);
  assert.deepEqual(a.autoLoad(), []);
});

// ── kopplingen, inte bara logiken ──────────────────────────────────────────
//
// Ett lager som ingen skriver till eller läser ur är samma bugg, bara tystare.

test("auto-rutinen skriver kvittot, och pulsen läser det", () => {
  assert.ok(/autoDeliveredPush\(rt\.label, agent\.id\)/.test(KÄLLA),
    "runAutoRoutines skriver inte kvittot — då finns inget att visa efter en omladdning");
  assert.ok(/autoLoad\(\)\.forEach/.test(KÄLLA),
    "renderPulse läser inte kvittot ur lagret");
  assert.ok(!/\bconst autoDelivered\b/.test(KÄLLA),
    "modulvariabeln autoDelivered är tillbaka — den var hela buggen");
});

test("sidladdningens egen agentväxling räknas inte som läst", () => {
  // Utan { boot: true } kvitteras ett svar hos ingångsagenten som läst innan
  // kunden hunnit se kortet — samma bugg som P6, bara flyttad ett steg.
  assert.ok(/selectAgent\(state\.activeAgentId, \{ boot: true \}\)/.test(KÄLLA),
    "renderApp markerar agenten som öppnad av kunden");
  assert.ok(/if \(!\(opts && opts\.boot\) && autoMarkRead\(id\)\)/.test(KÄLLA),
    "selectAgent tar inte hänsyn till boot-flaggan");
});

// ── P4: grundteamet går att ändra och avsluta ──────────────────────────────
//
// Tillägget var enkelriktat: kunden kunde lägga till agenter, aldrig ändra
// eller avsluta dem som kom med bygget. En agent som fått fel ton eller vars
// arbetsmoment försvunnit stod kvar för alltid, och enda utvägen var att bygga
// om hela teamet — vilket kostar ett nytt bygge och slänger historiken.
//
// `applyTeamExt` körs vid VARJE laddning och vid varje mappsynk. Går den fel
// får kunden ett team som inte är hennes, eller ingen portal alls. Därför
// testas den ur källan, inte som kopia.
function laddaExt() {
  const i = KÄLLA.indexOf("⟦EXT-START⟧");
  const j = KÄLLA.indexOf("⟦EXT-SLUT⟧");
  assert.ok(i >= 0 && j > i, "hittade inte ext-blocket i portal/app.js");
  const kropp = KÄLLA.slice(KÄLLA.indexOf("\n", i) + 1, KÄLLA.lastIndexOf("\n", j) + 1);
  assert.ok(kropp.includes("function applyTeamExt"), "ext-blocket ser inte ut som väntat");
  return new Function(kropp + "; return { applyTeamExt, extEntryEfter, EXT_SYSTEM_MIN };")();
}

const SYS = "DITT PERSPEKTIV\nDu ser verksamheten ur kundens ögon och letar efter var löftet spricker.\n\nLEVERANS\nEtt utkast.";
const grundteam = () => ({
  company: "Lerverk",
  entryAgent: "vd-assistent",
  agents: [
    { id: "vd-assistent", name: "Veckopiloten", icon: "🧭", always: true, tagline: "håller ihop veckan", system: SYS },
    { id: "vd", name: "Studiochefen", icon: "⚡", always: true, tagline: "prioriterar", system: SYS },
    { id: "text", name: "Butiksskribenten", icon: "✍️", tagline: "skriver produkttexter", system: SYS },
  ],
  routines: [{ label: "Veckobrief", agentId: "vd-assistent", prompt: "Sammanfatta veckan." }],
});

test("utan tillägg är teamet oförändrat", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), {});
  assert.equal(t.agents.length, 3);
  assert.equal(t.entryAgent, "vd-assistent");
});

test("en avslutad grundagent försvinner ur teamet", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), { retired: ["text"] });
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent", "vd"]);
});

test("avslutas ingångsagenten tar någon annan över — annars laddar portalen utan ingång", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), { retired: ["vd-assistent"] });
  assert.ok(!t.agents.some((a) => a.id === "vd-assistent"));
  assert.ok(t.agents.some((a) => a.id === t.entryAgent),
    "entryAgent pekar på någon som inte finns — veckostart, möten och veckobrev går sönder");
  // En `always`-agent går före en specialist: det är de som är formade för att
  // hålla ihop veckan.
  assert.equal(t.entryAgent, "vd");
});

test("kundens eget val av ingångsagent vinner", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), { entry: "text" });
  assert.equal(t.entryAgent, "text");
});

test("ett entry-val som pekar på någon avslutad ignoreras", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), { retired: ["text"], entry: "text" });
  assert.ok(t.agents.some((a) => a.id === t.entryAgent));
  assert.notEqual(t.entryAgent, "text");
});

test("allt kan inte avslutas — en tom portal är ingen portal", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), { retired: ["vd-assistent", "vd", "text"] });
  assert.ok(t.agents.length >= 1, "ett team utan agenter kastar vid varje render");
  assert.ok(t.agents.some((a) => a.id === t.entryAgent));
});

test("ändringar läggs ovanpå, fält för fält", () => {
  const { applyTeamExt } = laddaExt();
  const nySys = SYS + "\n\nSkriv alltid kortare än 200 ord.";
  const t = applyTeamExt(grundteam(), { edits: { text: { name: "Texten", system: nySys } } });
  const a = t.agents.find((x) => x.id === "text");
  assert.equal(a.name, "Texten");
  assert.equal(a.system, nySys);
  assert.equal(a.tagline, "skriver produkttexter", "fält som inte ändrats ska stå kvar");
  assert.equal(a.edited, true);
});

test("en tömd systemprompt skrivs inte in — då vore agenten en vanlig chatt", () => {
  const { applyTeamExt, EXT_SYSTEM_MIN } = laddaExt();
  const t = applyTeamExt(grundteam(), { edits: { text: { system: "x".repeat(EXT_SYSTEM_MIN - 1) } } });
  assert.equal(t.agents.find((x) => x.id === "text").system, SYS,
    "en för kort instruktion ska falla tillbaka på originalet, inte ersätta det");
});

test("ett tillägg som pekar på agenter som inte finns kvar tål laddningen", () => {
  // Grundkonfigen kan ha ändrats sedan tillägget skrevs (ny Builder-körning,
  // annan teamfil). Då pekar retired/edits på id:n som inte finns — det får
  // inte kasta, för koden körs vid varje laddning.
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), {
    retired: ["finns-inte"], edits: { "inte-heller": { name: "X" } }, entry: "borta",
  });
  assert.equal(t.agents.length, 3);
  assert.equal(t.entryAgent, "vd-assistent");
});

test("tillagda agenter och rutiner kommer med, utan dubbletter", () => {
  const { applyTeamExt } = laddaExt();
  const ext = {
    agents: [{ id: "stod", name: "Stödsökaren", system: SYS }, { id: "vd", name: "Dubblett", system: SYS }],
    routines: [{ label: "Ansökningar", agentId: "stod" }, { label: "Veckobrief", agentId: "vd" }],
  };
  const t = applyTeamExt(grundteam(), ext);
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent", "vd", "text", "stod"]);
  assert.equal(t.agents.find((a) => a.id === "vd").name, "Studiochefen", "en dubblett får inte skriva över grundagenten");
  assert.equal(t.agents.find((a) => a.id === "stod").added, true);
  assert.deepEqual(t.routines.map((r) => r.label), ["Veckobrief", "Ansökningar"]);
});

test("extEntryEfter säger samma sak som avslutandet gör", () => {
  // Bekräftelserutan visar namnet på den som tar över INNAN kunden klickar ja.
  // Räknar de två olika säger dialogen ett namn och portalen väljer ett annat.
  const { applyTeamExt, extEntryEfter } = laddaExt();
  const t = grundteam();
  const utlovad = extEntryEfter(t, "vd-assistent");
  const efter = applyTeamExt(grundteam(), { retired: ["vd-assistent"], entry: utlovad });
  assert.equal(efter.entryAgent, utlovad);

  // Och när någon annan än ingången avslutas ska ingången stå kvar.
  assert.equal(extEntryEfter(grundteam(), "text"), "vd-assistent");
});

test("laddning och mappsynk går genom samma funktion", () => {
  // Två vägar in i samma team. Gjorde de olika saker skulle en agent som kom
  // hem via mappen behandlas annorlunda än en som redan låg här.
  const träffar = KÄLLA.match(/applyTeamExt\(team, /g) || [];
  assert.ok(träffar.length >= 2,
    "applyTeamExt anropas inte från både laddningen och mappsynken");
  assert.ok(!/ext\.agents\.forEach\(\(a\) => \{ if \(a && a\.id && a\.system/.test(KÄLLA),
    "den gamla, egna sammanslagningen i laddningsvägen finns kvar — då är det två sanningar igen");
});

test("avslut och ändringar skrivs också till mappen", () => {
  // Utan dem skrivs team-tillagg.json utan avsluten, och nästa dator hämtar
  // hem ett team där den avslutade agenten står kvar.
  const i = KÄLLA.indexOf("async function syncTeamExtWithFolder");
  assert.ok(i > 0, "hittade inte syncTeamExtWithFolder");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}", i));
  assert.match(kropp, /cur\.retired/);
  assert.match(kropp, /cur\.edits/);
});

// Mot de RIKTIGA teamkonfigarna, inte bara ett hittepåteam. `applyTeamExt`
// körs vid varje laddning av var och en av dem, och toy-teamet ovan råkar ha
// två `always`-agenter — det har inte alla. Ett team där ingen är `always`
// hade fallit på `alltid || team.agents[0]` om den raden såg annorlunda ut.
const TEAMDIR = "portal/teams";
const teamfiler = readdirSync(TEAMDIR).filter((f) => f.endsWith(".js") && f !== "index.js");

function riktigtTeam(fil) {
  const win = {};
  new Function("window", readFileSync(`${TEAMDIR}/${fil}`, "utf8"))(win);
  return win.TEAM;
}

for (const fil of teamfiler) {
  test(`${fil} överlever att varje agent avslutas, en i taget`, () => {
    const { applyTeamExt } = laddaExt();
    const original = riktigtTeam(fil);
    for (const a of original.agents) {
      const t = applyTeamExt(riktigtTeam(fil), { retired: [a.id] });
      assert.ok(t.agents.length >= 1, `${a.id}: teamet blev tomt`);
      assert.ok(!t.agents.some((x) => x.id === a.id), `${a.id}: står kvar trots avslut`);
      assert.ok(t.agents.some((x) => x.id === t.entryAgent),
        `${a.id}: entryAgent "${t.entryAgent}" finns inte i teamet — veckostart och möten går sönder`);
    }
  });
}

test("även ett team utan `always`-agent får en ingång", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt({
    entryAgent: "a",
    agents: [{ id: "a", name: "A", system: "x" }, { id: "b", name: "B", system: "x" }],
  }, { retired: ["a"] });
  assert.equal(t.entryAgent, "b");
});

// ── OM5: sparad tid, och det som INTE räknas ───────────────────────────────
//
// Konkurrenterna säljer på sparad tid. Siffran fanns men låg längst ner i en
// panel kunden måste öppna själv — alltså osynlig för den som betalar, som är
// den som ska övertygas (churn-mekaniken i halvårssimuleringen).
//
// Testerna nedan handlar mest om vad siffran INTE innehåller. Det är där den
// spricker: en påhittad timme får frågan en gång, och sedan slutar kunden
// betala. `research.md` beställer `timeEstimate` som "minuter momentet brukar
// ta manuellt ENLIGT RESEARCHEN (null om researchen inte anger tid — hitta
// aldrig på)", och den regeln måste hålla hela vägen ut i gränssnittet.
function laddaTid({ demo = false, slug = "kund" } = {}) {
  const i = KÄLLA.indexOf("⟦TID-START⟧");
  const j = KÄLLA.indexOf("⟦TID-SLUT⟧");
  assert.ok(i >= 0 && j > i, "hittade inte tidsblocket i portal/app.js");
  const kropp = KÄLLA.slice(KÄLLA.indexOf("\n", i) + 1, KÄLLA.lastIndexOf("\n", j) + 1);
  assert.ok(kropp.includes("function sparadTid"), "tidsblocket ser inte ut som väntat");

  const lager = new Map();
  const localStorage = {
    getItem: (k) => (lager.has(k) ? lager.get(k) : null),
    setItem: (k, v) => lager.set(k, String(v)),
  };
  // isoWeek(when) tar numera ett datum (RE1). Stubben måste svara på samma
  // sätt som den riktiga: utan argument = den här veckan, med ett datum sju
  // dygn bakåt = föregående. En stubb som ignorerar argumentet hade gjort
  // varje test här till teater.
  const api = new Function("state", "localStorage", "isoWeek", kropp +
    "; return { sparadTid, tidFormat, tidLedger, tidBokför, tidSedan, tidForVecka, isoWeekFörra, routVeckanSomGick, TID_MAX_VECKOR };"
  )({ demo, slug }, localStorage, (when) => (when ? "2026-W34" : "2026-W35"));
  return { ...api, lager };
}

const RUTINER = [
  { label: "Veckobrief", timeEstimate: 45 },
  { label: "Fakturajakt", timeEstimate: 30 },
  { label: "Omvärld", timeEstimate: null },   // researchen gav ingen tid
];

test("sparad tid är summan av de avbockade rutinernas uppskattningar", () => {
  const { sparadTid } = laddaTid();
  const r = sparadTid(RUTINER, [{ label: "Veckobrief" }, { label: "Fakturajakt" }]);
  assert.equal(r.minuter, 75);
  assert.equal(r.räknade, 2);
  assert.equal(r.oräknade, 0);
});

test("en rutin utan tidsuppskattning räknas inte — och döljs inte", () => {
  // Att gissa här vore att uppfinna precis den siffra hela punkten går ut på
  // att kunna stå för. Antalet oräknade rapporteras i stället, och visas.
  const { sparadTid } = laddaTid();
  const r = sparadTid(RUTINER, [{ label: "Veckobrief" }, { label: "Omvärld" }]);
  assert.equal(r.minuter, 45, "Omvärld har timeEstimate null och får inte bidra");
  assert.equal(r.oräknade, 1);
});

test("inget uppskattas per svar, per möte eller per agent", () => {
  // Motprovet mot den frestande genvägen: "varje svar sparar tio minuter".
  // Utan avbockade rutiner är siffran noll, hur mycket kunden än chattat.
  const { sparadTid } = laddaTid();
  assert.equal(sparadTid(RUTINER, []).minuter, 0);
  assert.equal(sparadTid([], [{ label: "Veckobrief" }]).minuter, 0);
});

test("en avbockad rutin som inte längre finns i teamet räknas inte", () => {
  // Kan hända efter en avslutad agent (P4) eller en ny Builder-körning. Vi vet
  // inte vad den var värd, så den får inte bidra — men den ska synas som
  // oräknad i stället för att försvinna tyst.
  const { sparadTid } = laddaTid();
  const r = sparadTid(RUTINER, [{ label: "Finns inte längre" }]);
  assert.equal(r.minuter, 0);
  assert.equal(r.oräknade, 1);
});

test("trasiga uppskattningar bidrar inte", () => {
  const { sparadTid } = laddaTid();
  const konstiga = [
    { label: "a", timeEstimate: "45" },   // sträng: Number() ger 45, det är ok
    { label: "b", timeEstimate: -30 },    // negativ tid finns inte
    { label: "c", timeEstimate: NaN },
    { label: "d" },
  ];
  const r = sparadTid(konstiga, [{ label: "a" }, { label: "b" }, { label: "c" }, { label: "d" }]);
  assert.equal(r.minuter, 45);
  assert.equal(r.oräknade, 3);
});

test("formatet lovar bara den precision underlaget har", () => {
  const { tidFormat } = laddaTid();
  assert.equal(tidFormat(0), "");
  assert.equal(tidFormat(45), "≈ 45 minuter");
  assert.equal(tidFormat(90), "≈ 1,5 timmar");
  assert.equal(tidFormat(157), "≈ 2,5 timmar", "halvtimmar, inte 2 h 37 min");
  assert.match(tidFormat(120), /^≈ 2 timmar$/);
});

test("veckoliggaren räknar om veckan, den räknar inte upp den", () => {
  // Idempotens: körs bokföringen två gånger ska svaret vara detsamma. Annars
  // driftar kvartalssiffran uppåt varje gång kunden bockar av något.
  const { tidBokför, tidLedger } = laddaTid();
  tidBokför(75);
  tidBokför(75);
  assert.deepEqual(tidLedger().map((x) => x.m), [75]);
  tidBokför(120); // ännu en rutin avbockad samma vecka
  assert.deepEqual(tidLedger().map((x) => x.m), [120]);
});

test("liggaren summerar över veckor, men bara inom perioden", () => {
  const { tidLedger, tidSedan, lager } = laddaTid();
  const dag = 86400000;
  lager.set("atb_sparad_kund", JSON.stringify([
    { v: "2026-W20", m: 60, at: Date.now() - 100 * dag },  // förra kvartalet
    { v: "2026-W34", m: 90, at: Date.now() - 10 * dag },
    { v: "2026-W35", m: 45, at: Date.now() },
  ]));
  assert.equal(tidLedger().length, 3);
  assert.equal(tidSedan(Date.now() - 30 * dag), 135);
  assert.equal(tidSedan(0), 195);
});

test("liggaren växer inte i all oändlighet", () => {
  const { tidLedger, TID_MAX_VECKOR, lager } = laddaTid();
  lager.set("atb_sparad_kund", JSON.stringify(
    Array.from({ length: TID_MAX_VECKOR + 10 }, (_, i) => ({ v: "w" + i, m: 10, at: i }))
  ));
  // Skrivningen kapar; läsningen behöver inte göra det.
  const api = laddaTid();
  api.lager.set("atb_sparad_kund", lager.get("atb_sparad_kund"));
  api.tidBokför(5);
  assert.equal(api.tidLedger().length, TID_MAX_VECKOR);
});

test("demoläget bokför ingen tid", () => {
  const { tidBokför, tidLedger, lager } = laddaTid({ demo: true });
  tidBokför(75);
  assert.equal(lager.size, 0);
  assert.deepEqual(tidLedger(), []);
});

// ── kopplingen: siffran ska nå de ytor punkten handlar om ──────────────────

test("siffran syns där köparen faktiskt tittar", () => {
  // Poängen med OM5 var aldrig att räkna — det gjordes redan — utan att sluta
  // gömma resultatet i en panel man måste leta upp.
  assert.match(KÄLLA, /cards\.push\(\{ icon: "⏱"/, "puls-kortet saknas");
  // Sedan RE1 bär meningen även VILKEN vecka siffran gäller — en återblick som
  // säger "denna vecka" om förra veckans arbete är fel på ett sätt kunden
  // märker. Därför matchas `${när}` och inte bara ordföljden.
  assert.match(KÄLLA, /veckansTid \? `Avklarade rutiner \$\{när\} motsvarar/, '"Veckan som gick" får inte siffran som underlag');
  assert.match(KÄLLA, /const kvartalMin = tidSedan\(qStart\)/, "kvartalsvyn räknar inte över veckor");
  assert.match(KÄLLA, /parts\.push\(`• Avklarade rutiner motsvarar/, "den delbara texten saknar siffran");
});

test("avbockningen bokför veckan", () => {
  const i = KÄLLA.indexOf("function routineMarkDone");
  assert.ok(i > 0, "hittade inte routineMarkDone");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}", i));
  assert.match(kropp, /tidUppdateraVeckan\(\)/,
    "en avbockad rutin skrivs inte till veckoliggaren — kvartalsvyn blir då tom");
});

// ── RE1: "Veckan som gick" läste en logg som just nollställts ───────────────
//
// Pulskortet "Ny vecka" visas exakt när `lastVisit !== isoWeek()`, alltså vid
// veckans FÖRSTA öppning — och i samma ögonblick returnerar `routLoad()` en tom
// logg, eftersom den sparade posten bär förra veckans nummer. Återblicken fick
// därför alltid noll rutiner och noll sparad tid som underlag, för en kund som
// kanske gjort allt. Reproducerat 2026-09-01: tre rutiner värda 135 minuter
// blev 0 st och 0 minuter.
//
// Testerna nedan kör den riktiga koden ur källan. Stubben för isoWeek svarar
// "2026-W35" utan argument och "2026-W34" med — samma kontrakt som den
// riktiga funktionen efter att den fått en `when`-parameter.

const FÖRRA_VECKAN = { week: "2026-W34", done: [{ label: "Veckobrief" }, { label: "Fakturajakt" }] };

test("veckan som gick läses ur förra veckans post, inte ur den tomma nya", () => {
  const api = laddaTid();
  api.lager.set("atb_rout_kund", JSON.stringify(FÖRRA_VECKAN));

  const g = api.routVeckanSomGick();
  assert.equal(g.vecka, "förra", "posten bär förra veckans nyckel och ska läsas som förra veckan");
  assert.equal(g.done.length, 2);
  assert.equal(api.sparadTid(RUTINER, g.done).minuter, 75,
    "detta är hela felet: 75 minuter rapporterades som 0 för en kund som gjort jobbet");
});

test("har kunden redan bockat av i den nya veckan gäller den nya veckan", () => {
  // Då är förra veckans etiketter överskrivna och borta för alltid — men
  // svaret ska säga "denna vecka", inte påstå att det är förra.
  const api = laddaTid();
  api.lager.set("atb_rout_kund", JSON.stringify({ week: "2026-W35", done: [{ label: "Veckobrief" }] }));

  const g = api.routVeckanSomGick();
  assert.equal(g.vecka, "denna");
  assert.equal(g.done.length, 1);
});

test("en post från en äldre vecka än förra räknas inte som förra veckan", () => {
  // Kunden var borta i en månad. Att presentera fyra veckor gammalt arbete som
  // "veckan som gick" vore att hitta på — hellre tomt.
  const api = laddaTid();
  api.lager.set("atb_rout_kund", JSON.stringify({ week: "2026-W30", done: [{ label: "Veckobrief" }] }));

  const g = api.routVeckanSomGick();
  assert.equal(g.vecka, "denna");
  assert.deepEqual(g.done, []);
});

test("trasig eller saknad post ger tomt, inte en krasch", () => {
  const api = laddaTid();
  assert.deepEqual(api.routVeckanSomGick(), { vecka: "denna", done: [] });
  api.lager.set("atb_rout_kund", "{trasig json");
  assert.deepEqual(api.routVeckanSomGick(), { vecka: "denna", done: [] });
  api.lager.set("atb_rout_kund", JSON.stringify({ week: "2026-W34", done: "inte en lista" }));
  assert.deepEqual(api.routVeckanSomGick(), { vecka: "denna", done: [] });
});

test("demoläget läser ingen rutinlogg", () => {
  const api = laddaTid({ demo: true });
  api.lager.set("atb_rout_kund", JSON.stringify(FÖRRA_VECKAN));
  assert.deepEqual(api.routVeckanSomGick(), { vecka: "denna", done: [] });
});

test("liggaren bär minuterna även när etiketterna är överskrivna", () => {
  // Andra halvan av RE1: bockar kunden av något i den nya veckan INNAN hon
  // öppnar återblicken är rutinloggen borta. Veckoliggaren överlever
  // veckoskiftet och är då den enda källan som har kvar siffran.
  const api = laddaTid();
  api.lager.set("atb_sparad_kund", JSON.stringify([{ v: "2026-W34", m: 135, at: 1 }, { v: "2026-W35", m: 30, at: 2 }]));

  assert.equal(api.tidForVecka(api.isoWeekFörra()), 135, "förra veckans summa ska gå att hämta för sig");
  assert.equal(api.tidForVecka("2026-W35"), 30);
  assert.equal(api.tidForVecka("2026-W01"), 0, "en vecka utan rad är noll, inte odefinierad");
});

test("pulskortet möter kunden med förra veckans siffra, inte en tyst nolla", () => {
  // Källnivå: kortet byggs i renderPulse() och går inte att köra utan DOM.
  // Det som ska vaktas är att grenen finns och att den läser rätt källa.
  const i = KÄLLA.indexOf("if (pulseNewWeek) {");
  assert.ok(i > 0, "hittade inte grenen för veckans första öppning");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n  }", i));
  assert.match(kropp, /tidForVecka\(isoWeekFörra\(\)\)/,
    "kortet läser inte förra veckan — då är siffran tom precis när kunden tittar");
  assert.match(kropp, /förra veckan gjorde teamet/,
    "etiketten säger inte vilken vecka siffran gäller");
});

// ── KR3: provmånadskortet ritas om när sidopanelen ritas om ────────────────
//
// Kortet är portalens enda väg från 90 till 290 kr inifrån produkten.
// `checkTrialNotice()` ritar det in i `.ws`, som byggs inuti `renderSidebar()`
// — och `refreshSidebar()` byter ut hela `.sidebar`. Utan ett anrop där
// försvinner kortet vid första omritningen och kommer aldrig tillbaka.
//
// Uppmätt i webbläsare 2026-09-06: kortet var borta redan efter att
// presentationsrundan stängts, alltså innan kunden gjort någonting alls.

// Kommentarerna räknas INTE. Första versionen av det här testet passerade med
// anropet borttaget, eftersom kommentaren ovanför det nämner funktionen vid
// namn — en vakt som läser källtext måste läsa kod, annars vaktar den prosan.
const utanKommentarer = (s) => s.replace(/^\s*\/\/.*$/gm, "");

test("refreshSidebar ritar om provmånadskortet", () => {
  const i = KÄLLA.indexOf("function refreshSidebar");
  assert.ok(i > 0, "hittade inte refreshSidebar");
  const kropp = utanKommentarer(KÄLLA.slice(i, KÄLLA.indexOf("\n}", i)));
  assert.match(kropp, /checkTrialNotice\(\)/,
    "sidopanelen byts ut utan att kortet ritas om — KR3 är tillbaka");
});

test("kortet är idempotent, så omritningen inte kan ge två kort", () => {
  // Vakten sitter i renderTrialCard, inte i checkTrialNotice — den senare är
  // async och hinner anropas flera gånger medan meOnce() väntar.
  const i = KÄLLA.indexOf("function renderTrialCard");
  assert.ok(i > 0, "hittade inte renderTrialCard");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}", i));
  assert.match(kropp, /\$\("#trial-card"\)/,
    "utan vakten på #trial-card ritar varje refreshSidebar ett kort till");

  // Och anropet i checkTrialNotice måste faktiskt gå dit.
  const j = KÄLLA.indexOf("async function checkTrialNotice");
  assert.ok(j > 0, "hittade inte checkTrialNotice");
  assert.match(KÄLLA.slice(j, KÄLLA.indexOf("\n}", j)), /renderTrialCard\(info, today\)/);
});
