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
import { readFileSync } from "node:fs";

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
