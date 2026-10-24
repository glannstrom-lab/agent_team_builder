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
import vm from "node:vm";

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
    "; return { autoLoad, autoSave, autoDeliveredPush, autoMarkRead, AUTO_MAX_ÅLDER, ärTomtEllerVägran };"
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

// KA14 (2026-10-23): nya team i solo, mikro och personläget har ingen VD-agent
// — kunden är VD:n. Portalen får därför aldrig förutsätta att id "vd" finns.
// Befintliga team MED VD prövas av slingan ovan; här prövas ett team utan.
const utanVdTeam = () => ({
  company: "Salong Lina",
  agents: [
    { id: "vd-assistent", name: "VD-assistent", icon: "🧭", always: true, tagline: "förbereder veckans val", system: SYS },
    { id: "luckfyllaren", name: "Luckfyllaren", icon: "🗓️", tagline: "fyller avbokningar", system: SYS },
    { id: "instagram", name: "Instagram-avlastaren", icon: "📸", tagline: "tar kvällarna tillbaka", system: SYS },
  ],
  routines: [{ label: "Veckans val", agentId: "vd-assistent", prompt: "Lägg fram veckans val." }],
});

test("KA14: ett team utan VD-agent får VD-assistenten som ingång och klarar varje avslut", () => {
  const { applyTeamExt, extEntryEfter } = laddaExt();
  const t = applyTeamExt(utanVdTeam(), {});
  assert.equal(t.entryAgent, "vd-assistent");
  for (const a of utanVdTeam().agents) {
    const efter = applyTeamExt(utanVdTeam(), { retired: [a.id] });
    assert.ok(efter.agents.some((x) => x.id === efter.entryAgent), a.id + ": ingången pekar på någon som inte finns");
  }
  assert.equal(extEntryEfter(t, "luckfyllaren"), "vd-assistent");
});

test("KA14: portalen slår aldrig upp id vd — ett team utan VD-agent får inte tappa en funktion", () => {
  // Allt som behöver "den som håller ihop veckan" går via entryAgent eller
  // `always`. En hårdkodad "vd" hade tyst slutat fungera för alla nya små team.
  assert.doesNotMatch(KÄLLA, /id\s*===?\s*["']vd["']|["']vd["']\s*===?/, "portal/app.js letar efter id \"vd\"");
});

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
  assert.match(kropp, /förra veckans avklarade rutiner/,
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

test("KA12: mötet räknar inte ett tomt svar eller en vägran som ett perspektiv", () => {
  const { ärTomtEllerVägran } = laddaAuto();
  assert.equal(ärTomtEllerVägran(""), true);
  assert.equal(ärTomtEllerVägran("   "), true);
  assert.equal(ärTomtEllerVägran("Jag kan inte hjälpa till med den begäran."), true);
  assert.equal(ärTomtEllerVägran("Viktigast nu är att få ÄTA-bekräftelsen skriftlig innan vi kaklar, annars står vi utan underlag vid slutfakturan."), false);
  // Ett riktigt svar som börjar likt en vägran men fortsätter är inte en vägran.
  assert.equal(ärTomtEllerVägran("Jag kan inte hjälpa till med själva betygssättningen, men här är tre sätt att korta rättningen: " + "x".repeat(200)), false);
  // Anropet finns i mötet — annars är funktionen en skenkontroll.
  const kod = KÄLLA.slice(KÄLLA.indexOf("async function runMeeting"));
  assert.ok(kod.slice(0, 6000).includes("if (ärTomtEllerVägran(p))"), "runMeeting anropar inte ärTomtEllerVägran");
});

// ── Kontrollera mot källan + ta med till ChatGPT/Claude (2026-09-26) ───────
test("svarsknapparna: kontrollen skickar webb och sakfrågan, exporten bär agentens instruktion", () => {
  const i = KÄLLA.indexOf("function addActions(");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\nfunction ", i + 10));
  assert.ok(kropp.includes("{ webb: true }"), "Kontrollera mot källan skickar inte webb-flaggan");
  assert.ok(kropp.includes("kontrollText(fråga, getText())") && kropp.includes("await sökfrågaFör(getText())"), "kontrollen ska använda en formulerad sökfråga (KA21)");
  assert.ok(kropp.includes("https://chatgpt.com/?q=") && kropp.includes("https://claude.ai/new?q="), "exportlänkarna saknas");
  const p = KÄLLA.slice(KÄLLA.indexOf("function externtPaket("), KÄLLA.indexOf("function addActions("));
  assert.ok(p.includes("agent.system") && p.includes("loadMemory()"), "paketet ska bära instruktionen och företagsminnet");
  assert.ok(!p.includes("systemFor("), "paketet ska inte baka in alla underlag via systemFor()");
});

test("BF6: portalen ber om beständig lagring för ett köpt team", () => {
  const i = KÄLLA.indexOf("navigator.storage.persist()");
  assert.ok(i > 0, "ingen persist()-begäran i portalen");
  const före = KÄLLA.slice(Math.max(0, i - 200), i);
  assert.ok(före.includes("!state.demo"), "demoteam ska inte be om lagring");
});

// ── RE2: "Blev det fel?" ───────────────────────────────────────────────────
test("RE2: rättelsen blir en daterad rad i företagsminnet, och knappen finns under svaren", () => {
  const i = KÄLLA.indexOf("function rättelseRad(");
  const src = KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i) + 2);
  const rättelseRad = new Function(src + "; return rättelseRad;")();
  assert.equal(rättelseRad("Offertstödet", "  Timpriset är 595 kr\n ex moms  ", "2026-09-28"),
    "- Rättelse 2026-09-28 (Offertstödet): Timpriset är 595 kr ex moms");
  assert.equal(rättelseRad("A", "   ", "x"), "", "en tom rättelse ska inte skrivas till minnet");
  assert.ok(rättelseRad("A", "x".repeat(900), "d").length < 460, "en rättelse får inte svälla minnet");
  const acts = KÄLLA.slice(KÄLLA.indexOf("function addActions("));
  assert.ok(acts.slice(0, 8000).includes("openFelRuta(agentById(state.activeAgentId), getText())"), "knappen saknas under svaren");
  const ruta = KÄLLA.slice(KÄLLA.indexOf("function openFelRuta("), KÄLLA.indexOf("function addActions("));
  assert.ok(ruta.includes("saveMemory(") && ruta.includes("openAgentEdit(agent)"), "rutan ska spara i minnet och leda till agentens instruktion");
});

test("svarsknapparna ritas UNDER det sparade svaret, inte ovanför", () => {
  const i = KÄLLA.indexOf("function bubble(role, text, msg)");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i));
  const bubblan = kropp.indexOf("row.appendChild(b);");
  const knappar = kropp.indexOf("addActions(row");
  assert.ok(bubblan > 0 && knappar > 0 && bubblan < knappar, "bubblan måste läggas i raden före knapparna");
});

test("RE3: veckobrevet erbjuds i kom igång-listan och bockas av när kunden valt", () => {
  const lista = KÄLLA.slice(KÄLLA.indexOf("function renderIntroCard("), KÄLLA.indexOf("function renderIntroCard(") + 2500);
  assert.ok(lista.includes('label: "Få veckostarten som mejl", act: openDigest'), "steget saknas i kom igång-listan");
  const spara = KÄLLA.slice(KÄLLA.indexOf("function openDigest("));
  assert.ok(spara.slice(0, 6000).includes('introMark("digest")'), "steget bockas aldrig av");
});

test("ett tomt svar sparas aldrig — det går felvägen och frågan kan skickas igen", () => {
  const i = KÄLLA.indexOf("async function submitMessage(");
  const kropp = KÄLLA.slice(i, i + 6000);
  const vakt = kropp.indexOf('if (!acc.trim()) throw new Error(');
  // Svaret byggs som `svar` sedan SP19 (det bär rutinens namn), sedan sparas det.
  const spara = kropp.indexOf('const svar = { role: "assistant", content: acc');
  assert.ok(vakt > 0 && spara > vakt, "vakten måste ligga före sparandet");
  assert.ok(kropp.indexOf("pushHistory(agentId, svar)") > spara, "svaret sparas inte efter vakten");
});

// ── RE8: teamloggen — agenterna ser vad de andra levererat ──────────────────
function laddaSystemFor({ history, agents, memory = "" }) {
  const i = KÄLLA.indexOf("const DOC_BUDGET"), j = KÄLLA.indexOf("// ---------- helpers ----------");
  return new Function("loadMemory", "loadDocs", "state", "team", KÄLLA.slice(i, j) + "\nreturn { systemFor, teamLogg };")(
    () => memory, () => [], { history }, { agents });
}

test("RE8: agentens instruktion får de ANDRAS senaste leveranser, nyast först — inte sina egna", () => {
  const agents = [{ id: "vd-assistent", name: "Assistenten", system: "Du är assistenten." },
                  { id: "skribent", name: "Skribenten", system: "Du skriver." },
                  { id: "offert", name: "Offertmakaren", system: "Du gör offerter." }];
  const history = {
    skribent: [{ role: "user", content: "Skriv nyhetsbrevet" }, { role: "assistant", content: "## Nyhetsbrev Q4\nText…", at: Date.UTC(2026, 9, 6) }],
    offert: [{ role: "assistant", content: "Offert till Karlsson: badrum 5 m²…", at: Date.UTC(2026, 9, 8) }],
    "vd-assistent": [{ role: "assistant", content: "## Min egen veckostart", at: Date.UTC(2026, 9, 9) }],
  };
  const { systemFor } = laddaSystemFor({ history, agents });
  const sys = systemFor(agents[0]);
  assert.match(sys, /TEAMLOGG/);
  assert.match(sys, /2026-10-06 Skribenten: Nyhetsbrev Q4/, "rubriken ska användas när den finns");
  assert.match(sys, /2026-10-08 Offertmakaren: Offert till Karlsson/);
  assert.ok(sys.indexOf("Offertmakaren") < sys.indexOf("Skribenten: Nyhetsbrev"), "nyast först");
  assert.doesNotMatch(sys, /Min egen veckostart/, "agentens egna svar finns redan i dess samtal");
});

test("RE8: utan andras leveranser blir instruktionen oförändrad, och loggen håller sin budget", () => {
  const agents = [{ id: "a", name: "A", system: "Bas." }, { id: "b", name: "B", system: "Bas." }];
  const { systemFor, teamLogg } = laddaSystemFor({ history: {}, agents });
  assert.equal(systemFor(agents[0]), "Bas.");
  const många = { b: Array.from({ length: 50 }, (_, i) => ({ role: "assistant", content: "x".repeat(300), at: i })) };
  assert.ok(laddaSystemFor({ history: många, agents }).teamLogg("a").length <= 1500);
});

test("KA21: kontrollmeddelandet börjar med sökfrågan och förbjuder att bekräfta mot fel källa", () => {
  const i = KÄLLA.indexOf("function kontrollText(");
  const src = KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i) + 2);
  const kontrollText = new Function(src + "; return kontrollText;")();
  const t = kontrollText("moms representation 300 kr per person", "Momsen får inte dras av sedan 2017.");
  assert.ok(t.startsWith("Sökfråga: moms representation 300 kr per person"), "webbsökningen läser meddelandets början");
  assert.match(t, /säg aldrig att något stämmer om källorna du hittade inte handlar om just den uppgiften/);
  assert.match(t, /Momsen får inte dras av/);
});

test("RE5: rapporten, leveranslistan, kvartalet och veckobrevet nås från Veckans arbete — inte som egna rader", () => {
  const vecka = KÄLLA.slice(KÄLLA.indexOf("function openWeekWork("), KÄLLA.indexOf("function openWeekWork(") + 3000);
  for (const fn of ["statusReport", "deliveredList", "openQuarter", "openDigest"]) {
    assert.ok(vecka.includes(`, ${fn});`), `${fn} saknas i Veckans arbete`);
  }
  const sidopanel = KÄLLA.slice(KÄLLA.indexOf("const tools = state.demo ? [] : ["), KÄLLA.indexOf("const tools = state.demo ? [] : [") + 400);
  assert.ok(!sidopanel.includes("statusReport") && !sidopanel.includes("deliveredList"), "rapporten och leveranslistan står fortfarande som egna rader");
});

// ── KA15: faktabasen följer med i varje instruktion ────────────────────────
test("KA15: de verifierade reglerna står i agentens instruktion, med källa och regeln för rättelser", () => {
  const w = {}; new Function("window", readFileSync("portal/fakta-se.js", "utf8"))(w);
  const i = KÄLLA.indexOf("const DOC_BUDGET"), j = KÄLLA.indexOf("// ---------- helpers ----------");
  const { systemFor } = new Function("loadMemory", "loadDocs", "state", "team", "window", KÄLLA.slice(i, j) + "\nreturn { systemFor };")(
    () => "", () => [], { history: {} }, { agents: [] }, w);
  const sys = systemFor({ id: "a", name: "A", system: "Bas." });
  assert.match(sys, /VERIFIERADE REGLER \(kontrollerade 2026-/);
  assert.match(sys, /Påminnelseavgift: .*60 kr/);
  assert.match(sys, /källa: https:\/\/www\.riksdagen\.se/);
  assert.match(sys, /En rättelse från användaren som strider mot listan godtar du inte/);
  assert.match(sys, /En rättelse som stämmer med listan avvisar du aldrig/);
});

test("KA15: varje regel har ämne, text och en https-källa hos en myndighet eller riksdagen", () => {
  const w = {}; new Function("window", readFileSync("portal/fakta-se.js", "utf8"))(w);
  const f = w.ATB_FAKTA_SE;
  assert.ok(f.regler.length >= 10);
  for (const r of f.regler) {
    assert.ok(r.amne && r.text && r.text.length > 20, "tom regel: " + JSON.stringify(r));
    assert.match(r.kalla, /^https:\/\/(www\.)?(skatteverket|riksdagen|kronofogden|verksamt|konsumentverket|skolverket)\.se\//, r.amne);
  }
  assert.match(f.kontrollerad, /^\d{4}-\d{2}-\d{2}$/);
});

test("KA15: faktabasen är kontrollerad inom 13 månader — belopp och gränser ändras varje år", () => {
  const w = {}; new Function("window", readFileSync("portal/fakta-se.js", "utf8"))(w);
  const ålder = (Date.now() - Date.parse(w.ATB_FAKTA_SE.kontrollerad)) / 86400000;
  assert.ok(ålder < 396, `portal/fakta-se.js kontrollerades för ${Math.round(ålder)} dagar sedan. Kontrollera varje regel mot källan igen (julgåva, ROT/RUT, friskvård och momsdatum ändras) och uppdatera "kontrollerad".`);
});

// OL8: en källa, två utdata. Portalens fil genereras ur functions/api/_fakta.js
// — som /mcp läser — och får inte glida isär från den.
test("OL8: portal/fakta-se.js är genererad ur samma källa som /mcp läser", async () => {
  const { portalFil } = await import("../scripts/fakta.mjs");
  assert.equal(readFileSync("portal/fakta-se.js", "utf8").replace(/\r\n/g, "\n"), portalFil(),
    "portal/fakta-se.js stämmer inte med functions/api/_fakta.js — ändra källan och kör `npm run fakta`");
});

// ── Firman växer: bokföringen (SP19) och anställ en i taget (SP9) ───────────
//
// Två löften står här. (1) Firman levlar bara på de fem uttryckliga
// handlingarna, och de skrivs i exakt den form portal/firman.js läser — en
// annan form hade gett en trappa som aldrig rör sig, utan att något kastade.
// (2) Ett team UTAN `hiringPlan` — alla i portal/teams/ och alla köpta team —
// har alla anställda och ser ut som förut. Det är kontraktet med byggsidan.

function laddaFirmanPortal({ demo = false, slug = "kund" } = {}) {
  const i = KÄLLA.indexOf("⟦FIRMAN-START⟧");
  const j = KÄLLA.indexOf("⟦FIRMAN-SLUT⟧");
  assert.ok(i >= 0 && j > i, "hittade inte firman-blocket i portal/app.js");
  const kropp = KÄLLA.slice(KÄLLA.indexOf("\n", i) + 1, KÄLLA.lastIndexOf("\n", j) + 1);
  const lager = new Map();
  const localStorage = {
    getItem: (k) => (lager.has(k) ? lager.get(k) : null),
    setItem: (k, v) => lager.set(k, String(v)),
    removeItem: (k) => lager.delete(k),
  };
  const api = new Function("state", "localStorage", kropp +
    "; return { firmanLogg, firmanBoka, firmanStarta, FIRMAN_HANDELSER };")({ demo, slug }, localStorage);
  return { ...api, lager, localStorage };
}
const firmanJs = () => {
  const ctx = vm.createContext({});
  vm.runInContext(readFileSync("portal/firman.js", "utf8"), ctx, { filename: "portal/firman.js" });
  return ctx.ATBFirman;
};
const PLANTEAM = { entryAgent: "vd-assistent", routines: [{ label: "Offerterna", agentId: "offert", day: 1 }] };

test("SP19: portalen bokför samma fem handlingar som firman.js räknar på", () => {
  const F = firmanJs();
  const p = laddaFirmanPortal();
  assert.deepEqual([...p.FIRMAN_HANDELSER].sort(), [...F.HANDELSER].sort(),
    "listorna har glidit isär — en handling som bara finns på ena sidan bokförs men räknas aldrig, eller tvärtom");
});

test("SP19: en bokad händelse hamnar i atb_firman_<slug> och flyttar nivån", () => {
  const F = firmanJs();
  const p = laddaFirmanPortal();
  const nivå = () => F.nivaFor(F.historikUr(p.localStorage, "kund", PLANTEAM), Date.now() + 1000).niva;
  p.firmanStarta(Date.now() - 86400000);
  assert.equal(nivå(), 1, "en tom logg är nivå 1");
  assert.ok(p.firmanBoka("projekt_paborjat", "vd-assistent"));
  assert.equal(nivå(), 2, "första projektet påbörjat ska ge nivå 2");
  assert.ok(p.firmanBoka("leverans_godkand", "vd-assistent"));
  assert.equal(nivå(), 2, "VD-assistentens godkända leverans är inte specialistens");
  assert.ok(p.firmanBoka("leverans_godkand", "offert"));
  assert.equal(nivå(), 3, "en godkänd leverans från en specialist ska ge nivå 3");
  const logg = JSON.parse(p.lager.get("atb_firman_kund"));
  assert.equal(logg.v, 1);
  assert.ok(logg.start > 0, "loggen saknar start — då har dag 21-golvet inget att räkna från");
  assert.deepEqual(logg.handelser.map((e) => e.typ), ["projekt_paborjat", "leverans_godkand", "leverans_godkand"]);
  assert.equal(logg.handelser[2].agentId, "offert");
});

test("SP19: rutin klar räknas i rutinveckor, och möte → beslut → rutin avslutar nivå 4", () => {
  const F = firmanJs();
  const p = laddaFirmanPortal();
  const DAG = 86400000, nu = Date.now();
  p.firmanBoka("projekt_paborjat", "vd-assistent", nu - 30 * DAG);
  p.firmanBoka("rutin_klar", "offert", nu - 21 * DAG);
  p.firmanBoka("rutin_klar", "offert", nu - 14 * DAG);
  p.firmanBoka("rutin_klar", "offert", nu - 7 * DAG);
  const h = () => F.historikUr(p.localStorage, "kund", PLANTEAM);
  assert.equal(F.nivaFor(h(), nu).niva, 4, "tre bekräftade rutinveckor från en specialist ska ge nivå 4");
  p.firmanBoka("mote_beslut", "vd-assistent", nu - 60000);
  assert.equal(F.nivaFor(h(), nu).niva, 4);
  p.firmanBoka("rutin_ur_beslut", "offert", nu - 30000);
  assert.equal(F.nivaFor(h(), nu).niva, 5);
});

test("SP19: okända handlingar och demoläget skriver ingenting", () => {
  const p = laddaFirmanPortal();
  assert.equal(p.firmanBoka("chatt", "vd-assistent"), null);
  assert.equal(p.firmanBoka("veckostart", "vd-assistent"), null);
  assert.equal(p.lager.size, 0);
  const d = laddaFirmanPortal({ demo: true });
  assert.equal(d.firmanBoka("leverans_godkand", "offert"), null);
  assert.equal(d.firmanStarta(), null);
  assert.equal(d.lager.size, 0, "demoläget skrev till lagret");
});

test("SP19: en trasig logg kastar inte, och firmanStarta skriver inte över en befintlig", () => {
  const p = laddaFirmanPortal();
  p.lager.set("atb_firman_kund", "{trasig");
  assert.equal(p.firmanLogg(), null);
  const e = p.firmanBoka("projekt_paborjat", "vd-assistent");
  assert.ok(e, "en trasig post ska ersättas, inte blockera bokningen");
  const före = p.lager.get("atb_firman_kund");
  p.firmanStarta(1);
  assert.equal(p.lager.get("atb_firman_kund"), före);
});

test("SP19: att skicka en rutin, få ett svar eller hålla ett möte bokför ingenting", () => {
  // Det var hela felet SP19 beskriver: en "avbockad rutin" var en skickad
  // fråga. Bokningen får bara ske i de uttryckliga knapparna.
  const kropp = (namn) => { const i = KÄLLA.indexOf(namn); assert.ok(i > 0, namn); return KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i)); };
  for (const f of ["function routineMarkDone(", "async function submitMessage(", "async function runMeeting(",
    "async function runAutoRoutines(", "function startWeek(", "function touchStreak("]) {
    assert.doesNotMatch(kropp(f), /firmanBoka/, `${f} bokför en händelse — det är chatt eller automatik, inte något kunden bekräftat`);
  }
  // …och de fem knapparna finns.
  for (const typ of ["projekt_paborjat", "leverans_godkand", "rutin_klar", "mote_beslut", "rutin_ur_beslut"]) {
    assert.match(KÄLLA, new RegExp(`firmanBokaOchRita\\("${typ}"`), `ingen knapp bokför ${typ}`);
  }
});

test("SP19: händelseloggen speglas till teamstatus.json och slås ihop med kollegornas", () => {
  const i = KÄLLA.indexOf("async function syncStatusNow");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i));
  assert.match(kropp, /slaIhopHandelser\(/, "loggen slås inte ihop — två kollegor skriver över varandras nivå");
  assert.match(kropp, /status\.firman = firman/);
  assert.match(kropp, /firmanSpara\(firman\)/, "det sammanslagna läget sparas inte tillbaka lokalt");
});

test("firman.js laddas före app.js och ligger i service workerns SHELL", () => {
  const html = readFileSync("portal/index.html", "utf8");
  const f = html.indexOf('<script src="firman.js">'), a = html.indexOf('<script src="app.js">');
  assert.ok(f > 0 && a > f, "firman.js måste laddas före app.js");
  const sw = readFileSync("portal/sw.js", "utf8");
  assert.match(sw.match(/^const SHELL = \[(.*)\];$/m)[1], /"\.\/firman\.js"/,
    "utan firman.js i SHELL öppnas en offline-PWA utan window.ATBFirman");
});

// ── SP9: anställ en i taget ─────────────────────────────────────────────────
const SYS2 = "DITT PERSPEKTIV\nDu ser till att det blir gjort.\n\nLEVERANS\nEtt utkast.";
const planteam = () => ({
  company: "Salong Lina",
  entryAgent: "vd-assistent",
  agents: [
    { id: "vd-assistent", name: "Vera", icon: "🧭", always: true, tagline: "håller ihop veckan", system: SYS2 },
    { id: "luckor", name: "Luckfyllaren", icon: "🗓️", tagline: "fyller avbokningar", system: SYS2 },
    { id: "insta", name: "Instagram-avlastaren", icon: "📸", tagline: "tar kvällarna tillbaka", system: SYS2 },
    { id: "offert", name: "Offertskrivaren", icon: "🧾", tagline: "skriver offerter", system: SYS2 },
  ],
  hiringPlan: [
    { agentId: "offert", order: 1, reason: "Ni lägger sex timmar i veckan på offerter" },
    { agentId: "luckor", order: 2, reason: "Avbokningarna kostar en dag i månaden" },
    { agentId: "insta", order: 3, reason: "Instagram tar kvällarna" },
  ],
});

test("SP9: ett team utan hiringPlan har alla anställda och får inget nytt fält", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(grundteam(), {});
  assert.equal(t.agents.length, 3);
  assert.equal(t.pending, undefined, "ett team utan plan fick ett pending-fält");
  assert.equal(t.baseOrder, undefined);
  // Ett hired-fält i tillägget (t.ex. synkat från en annan dator) ändrar inget.
  assert.equal(applyTeamExt(grundteam(), { hired: {} }).agents.length, 3);
});

for (const fil of teamfiler) {
  test(`SP9: ${fil} (utan rekryteringsplan) — alla anställda, ingen väntar`, () => {
    const { applyTeamExt } = laddaExt();
    const original = riktigtTeam(fil);
    assert.ok(!Array.isArray(original.hiringPlan) || !original.hiringPlan.length,
      `${fil} har fått en hiringPlan — då är det inte längre ett team från före planen, och testet ska skrivas om`);
    const t = applyTeamExt(riktigtTeam(fil), { hired: {} });
    assert.deepEqual(t.agents.map((a) => a.id), original.agents.map((a) => a.id));
    assert.ok(!t.pending || !t.pending.length);
  });
}

test("SP9: ett nytt team med plan börjar med bara VD-assistenten, de andra väntar i planens ordning", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(planteam(), {});
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent"]);
  assert.deepEqual(t.pending.map((a) => a.id), ["offert", "luckor", "insta"], "planens order, inte konfigens");
  assert.equal(t.entryAgent, "vd-assistent");
});

test("SP9: en anställd kommer in på sin plats i laget, och omkörningen är idempotent", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(planteam(), {});
  applyTeamExt(t, { hired: { insta: 1 } });
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent", "insta"]);
  assert.deepEqual(t.pending.map((a) => a.id), ["offert", "luckor"]);
  applyTeamExt(t, { hired: { insta: 1, offert: 2 } });
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent", "insta", "offert"], "byggets ordning i laget");
  applyTeamExt(t, { hired: { insta: 1, offert: 2 } });
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent", "insta", "offert"], "andra körningen ändrade laget");
  assert.deepEqual(t.pending.map((a) => a.id), ["luckor"]);
});

test("SP9: ingångsagenten väntar aldrig, inte ens om planen råkar nämna henne", () => {
  const { applyTeamExt } = laddaExt();
  const team = planteam();
  team.hiringPlan.unshift({ agentId: "vd-assistent", order: 0, reason: "x" });
  const t = applyTeamExt(team, {});
  assert.deepEqual(t.agents.map((a) => a.id), ["vd-assistent"]);
  assert.ok(!t.pending.some((a) => a.id === "vd-assistent"));
});

test("SP9: demoläget visar hela teamet, och en avslutad agent väntar inte", () => {
  const { applyTeamExt } = laddaExt();
  assert.equal(applyTeamExt(planteam(), {}, { allaAnstallda: true }).agents.length, 4);
  const t = applyTeamExt(planteam(), { retired: ["luckor"] });
  assert.deepEqual(t.pending.map((a) => a.id), ["offert", "insta"]);
});

test("SP9: hired synkas via mappen — och följer med när filen skrivs", () => {
  const i = KÄLLA.indexOf("async function mergeTeamExtFromFolder");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i));
  assert.match(kropp, /fromFile\.hired/, "en anställning på en annan dator kommer aldrig hem");
  const j = KÄLLA.indexOf("async function syncTeamExtWithFolder");
  assert.match(KÄLLA.slice(j, KÄLLA.indexOf("\n}\n", j)), /cur\.hired/);
});

test("SP9: ingångsagenten får veta vem som väntar — och inget ändras när alla är anställda", () => {
  const { applyTeamExt } = laddaExt();
  const t = applyTeamExt(planteam(), { hired: { offert: 1 } });
  const i = KÄLLA.indexOf("const DOC_BUDGET"), j = KÄLLA.indexOf("// ---------- helpers ----------");
  const ladda = (tm) => new Function("loadMemory", "loadDocs", "state", "team", KÄLLA.slice(i, j) + "\nreturn { systemFor };")(
    () => "", () => [], { history: {} }, tm).systemFor;
  const systemFor = ladda(t);
  const vd = systemFor(t.agents.find((a) => a.id === "vd-assistent"));
  assert.match(vd, /TEAMET JUST NU/);
  assert.match(vd, /Offertskrivaren/, "den anställda saknas");
  assert.match(vd, /Luckfyllaren \(fyller avbokningar\) — Avbokningarna kostar en dag i månaden/, "den väntande och skälet saknas");
  assert.match(vd, /Hänvisa aldrig kunden till någon som inte är anställd/);
  assert.ok(vd.indexOf("Luckfyllaren") < vd.indexOf("Instagram-avlastaren"), "turordningen ska följa planen");
  const spec = systemFor(t.agents.find((a) => a.id === "offert"));
  assert.match(spec, /KOLLEGOR SOM INTE ÄR ANSTÄLLDA ÄN: Luckfyllaren, Instagram-avlastaren/);
  const alla = applyTeamExt(planteam(), { hired: { offert: 1, luckor: 1, insta: 1 } });
  assert.equal(ladda(alla)(alla.agents[0]), SYS2, "ett fullt anställt team ska ha samma instruktion som förut");
});

test("SP3/SP1: upplåsning och nästa steg ritas bara för team med plan, aldrig i demoläget", () => {
  // `lage` är null för alla andra, och då är varje gren i renderSidebar() den gamla.
  const i = KÄLLA.indexOf("function renderSidebar(");
  const kropp = KÄLLA.slice(i, KÄLLA.indexOf("\n}\n", i));
  assert.match(kropp, /const lage = firmanAktiv\(\) \? firmanLage\(\) : null;/);
  assert.match(kropp, /const intro = lage \? null : renderIntroCard\(\);/);
  assert.match(kropp, /const hideExtras = lage \? false : wsCollapsed\(\);/);
  const fa = KÄLLA.slice(KÄLLA.indexOf("function firmanAktiv("), KÄLLA.indexOf("function firmanAktiv(") + 300);
  assert.match(fa, /!state\.demo/, "demoläget ska aldrig visa trappan");
  assert.match(fa, /hiringPlan/);
});
