// Våningen (SP16/SP20). portal/vaningen.js är ett klassiskt skript som läser
// app.js:s toppnivå — state, team, selectAgent, firmanLage, jobbApi … — utan
// import. Byter en av dem namn i app.js går ingenting sönder vid bygget, men
// portalen kastar ReferenceError i drift så fort kunden klickar på ett rum.
// Samma fälla som B1 (tio dagar stum produkt). Testerna här gör namnen till
// ett kontrakt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const APP = readFileSync("portal/app.js", "utf8");
const VAN = readFileSync("portal/vaningen.js", "utf8");
const INDEX = readFileSync("portal/index.html", "utf8");
const SW = readFileSync("portal/sw.js", "utf8");

// Toppnivånamn i app.js: funktioner, const/let och async-funktioner.
const definierade = new Set();
for (const m of APP.matchAll(/^(?:async\s+)?function\s+([\wåäöÅÄÖ$]+)\s*\(/gm)) definierade.add(m[1]);
for (const m of APP.matchAll(/^(?:const|let|var)\s+([\wåäöÅÄÖ$]+)\s*=/gm)) definierade.add(m[1]);

// Allt Våningen lånar ur app.js. Står ett namn här som inte finns i app.js
// fäller testet; lånar vaningen.js ett namn som inte står här fäller nästa test.
const LÅNADE = [
  "state", "team", "el", "agentById", "avatarSrcFor", "selectAgent", "firmanAktiv", "firmanLage",
  "nastaStegFor", "nastaStegHandling", "panelOppen", "openHire", "hiringReason", "harJobb", "jobbApi",
  "renderMarkdown", "firmanBokaOchRita", "byggJobbForm", "kopplingsRuta", "openOverlay", "closeOverlay",
  "openMeeting", "runRoutine", "routineDone", "todayDayNo", "dayName", "startWeek", "openMemory",
  "openJobs", "refreshSidebar", "firmaSpeglaKunder", "sparaSomMall",
  // Huset (2026-11-12): bygg en våning, och det möblerna gör i rummet.
  "openGrow", "openDigest", "loadDocs", "inredningFor", "inredningSpara",
];

test("varje namn Våningen lånar finns på app.js toppnivå", () => {
  const saknas = LÅNADE.filter((n) => !definierade.has(n));
  assert.deepEqual(saknas, [], `app.js saknar: ${saknas.join(", ")} — Våningen kastar i drift`);
});

test("vaningen.js använder inga app.js-namn utanför listan", () => {
  // Fria anrop `namn(` i vaningen.js som är app.js-funktioner men inte står i LÅNADE.
  const egna = new Set();
  for (const m of VAN.matchAll(/function\s+([\wåäö$]+)\s*\(/g)) egna.add(m[1]);
  for (const m of VAN.matchAll(/(?:const|let)\s+([\wåäö$]+)\s*=/g)) egna.add(m[1]);
  const anrop = new Set();
  for (const m of VAN.matchAll(/(?<![.\w$])([\wåäö$]+)\s*\(/g)) anrop.add(m[1]);
  const olistade = [...anrop].filter((n) => definierade.has(n) && !egna.has(n) && !LÅNADE.includes(n));
  assert.deepEqual(olistade, [], `vaningen.js anropar ${olistade.join(", ")} ur app.js utan att det står i LÅNADE`);
});

test("portalen laddar Våningen efter app.js, och service workern cachar den", () => {
  const app = INDEX.indexOf('src="app.js"'), van = INDEX.indexOf('src="vaningen.js"');
  assert.ok(app > 0 && van > app, "vaningen.js måste laddas efter app.js — den läser app.js:s toppnivå");
  assert.ok(INDEX.indexOf('href="vaningen.css"') > INDEX.indexOf('href="portal.css"'), "vaningen.css ska ladda efter portal.css");
  for (const f of ["./vaningen.js", "./vaningen.css"]) assert.ok(SW.includes(`"${f}"`), `${f} saknas i SHELL i portal/sw.js`);
});

test("renderPortal startar Våningen, och omritningen når den", () => {
  assert.match(APP, /window\.ATBVaning\.start\(\)/, "renderPortal anropar inte ATBVaning.start()");
  const omr = APP.slice(APP.indexOf("function firmanOmritning"), APP.indexOf("function firmanBokaOchRita"));
  assert.match(omr, /ATBVaning\.omrita\(\)/, "firmanOmritning ritar inte om Våningen — nivån och rummen blir gamla");
});

test("demoläget får inte Våningen — exempelteamen har inga jobb och ingen trappa", () => {
  assert.match(VAN, /const aktiv = \(\) => !state\.demo/);
});

test("kundregistret delas: varje sparning går vidare till /api/firma (SP23)", () => {
  const spara = VAN.slice(VAN.indexOf("function sparaRegister"), VAN.indexOf("function organisationer"));
  assert.match(spara, /firmaSpeglaKunder\(r\)/, "en kund som sparas i portalen når annars aldrig Claude eller ChatGPT");
});

// ── Huset (2026-11-12): våningarna och rumsbilderna, körda ur källan ───────
function huset() {
  const i = VAN.indexOf("// ⟦HUSET-START⟧"), j = VAN.indexOf("// ⟦HUSET-SLUT⟧");
  assert.ok(i > 0 && j > i, "hittade inte ⟦HUSET⟧-blocket i vaningen.js");
  return new Function(VAN.slice(i, j) + "\nreturn { delaVaningar, tilldelaRumbilder, nyckelBild, RUM_PER_VANING, RUMBILDER };")();
}
const agent = (id, name, tagline = "", role = "Specialist") => ({ id, typ: "agent", agent: { id, name, tagline, role } });

test("Huset: sex rum per våning, våning 1 heter Kontoret och resten sitt nummer", () => {
  const { delaVaningar, RUM_PER_VANING } = huset();
  assert.equal(RUM_PER_VANING, 6);
  const rum = Array.from({ length: 14 }, (_, k) => ({ id: "r" + k }));
  const v = delaVaningar(rum);
  assert.deepEqual(v.map((x) => x.rum.length), [6, 6, 2]);
  assert.deepEqual(v.map((x) => x.namn), ["Våning 1 · Kontoret", "Våning 2", "Våning 3"]);
  assert.deepEqual(v[1].rum.map((r) => r.id), ["r6", "r7", "r8", "r9", "r10", "r11"], "ordningen ska vara rummens");
  assert.equal(delaVaningar(rum.slice(0, 6)).length, 1, "sex rum ryms på en våning");
});

test("Huset: de fasta rummen har fasta bilder, specialisterna får sin efter nyckelord", () => {
  const { tilldelaRumbilder, nyckelBild } = huset();
  const rum = tilldelaRumbilder([
    { id: "vd", typ: "du" }, { ...agent("vd-assistent", "VD-assistent"), entry: true },
    agent("bok", "Bokföraren", "Underlag och moms"), agent("tel", "Telefonpasset", "Kundtjänst och bokningar"),
    { id: "x", typ: "vakant", agent: { id: "x", name: "X" } }, { id: "__mote", typ: "mote" }, { id: "__pentry", typ: "pentry" },
  ]);
  assert.deepEqual(rum.map((r) => r.bild), ["reception", "assistent", "bokforing", "telefon", "ledigt", "mote", "pentry"]);
  assert.equal(nyckelBild({ name: "Kundposten", tagline: "Mejl och sms" }), "post");
  assert.equal(nyckelBild({ name: "Kundtjänsten" }), "telefon", "kundtjänst ska inte fastna på 'kund'");
  assert.equal(nyckelBild({ name: "Månadsrapportören", role: "Specialist — första projektet" }), "analys", "namnet väger tyngre än rollen");
  assert.equal(nyckelBild({ name: "Teknisk Dokumentör" }), "arkiv");
  assert.equal(nyckelBild({ name: "Menyplaneraren", tagline: "Sätter lunchmenyn" }), null);
});

test("Huset: säkrare träff vinner bilden, och två grannar får aldrig samma bild", () => {
  const { tilldelaRumbilder, RUMBILDER } = huset();
  // VD:ns tagline nämner offerten, men Offertskrivaren heter det.
  const rum = tilldelaRumbilder([{ id: "vd", typ: "du" }, agent("vd", "VD (Patrik)", "Säger var offerten är för tunn"),
    agent("offert", "Offertskrivaren"), agent("a", "Menyplaneraren"), agent("b", "Schemaläggaren"), agent("c", "Återkomstpåminnaren"), agent("d", "Sorteraren")]);
  assert.equal(rum.find((r) => r.id === "offert").bild, "offert");
  assert.notEqual(rum.find((r) => r.id === "vd" && r.typ === "agent").bild, "offert");
  rum.forEach((r, i) => { for (let k = Math.max(0, i - 3); k < i; k++) assert.notEqual(rum[k].bild, r.bild, `${rum[k].id} och ${r.id} har samma bild`); });
  rum.slice(1).forEach((r) => assert.ok(RUMBILDER.includes(r.bild), r.bild));
  // Stabil: samma team ger samma bilder.
  const igen = tilldelaRumbilder(rum.map((r) => ({ ...r })));
  assert.deepEqual(igen.map((r) => r.bild), rum.map((r) => r.bild));
});

test("Huset: SVG-planritningen är borta, rumskorten klickar som rummen gjorde, och bilderna finns", () => {
  assert.doesNotMatch(VAN, /function ritaSvg|<svg id="vn-svg"/);
  const vy = VAN.slice(VAN.indexOf("function visaVaning("), VAN.indexOf("// Ett nästa steg, inte en dashboard"));
  assert.match(vy, /\.vn-rr"\)\.forEach\(\(b\) => b\.onclick = \(\) => klickRum\(b\.dataset\.rum\)\)/);
  assert.match(vy, /ritaNasta\(/, "nästa steg-kortet ska stå kvar");
  for (const b of ["assistent", "offert", "post", "mote", "pentry", "ledigt", "bokforing", "telefon", "reception", "verkstad", "arkiv", "analys"]) {
    assert.ok(existsSync(`bild/huset/rum-${b}.webp`), `bild/huset/rum-${b}.webp saknas`);
  }
  for (const m of ["kalender", "arkiv", "telefon", "whiteboard", "brev", "lampa", "diplom", "vaxt"]) {
    assert.ok(existsSync(`bild/huset/mobel-${m}.webp`), `bild/huset/mobel-${m}.webp saknas`);
    assert.match(VAN, new RegExp(`id: "${m}"`), `möbeln ${m} saknas i MOBLER`);
  }
});

// U14 (2026-11-12): "Spara som mall". Logiken körs ur källan mot ett
// låtsaslager; knappen och rullistan kontrolleras i källan.
function laddaMallar() {
  const i = APP.indexOf("const MALL_PREFIX"), j = APP.indexOf("function byggJobbForm(");
  assert.ok(i > 0 && j > i, "hittade inte mallblocket i app.js");
  let docs = [{ id: "u1", title: "Prislista", text: "Målning 95 kr/m²", on: true }];
  const api = new Function("loadLocalDocs", "saveDocs", APP.slice(i, j) + "\nreturn { mallar, sparaSomMall, mallBrief, MALL_PREFIX, JOBB_BRIEF_MAX };")(
    () => JSON.parse(JSON.stringify(docs)), (d) => { docs = d; });
  return { ...api, docs: () => docs };
}

test("U14: en leverans sparas som avstängt underlag med titeln 'Mall: <rubrik>', och syns som mall", () => {
  const m = laddaMallar();
  const titel = m.sparaSomMall({ title: "Offert Brf Ekbacken", leverans: "Offert\nKund: Brf Ekbacken\nSumma: 48 000 kr" });
  assert.equal(titel, "Mall: Offert Brf Ekbacken");
  const sparad = m.docs().find((d) => d.title === titel);
  assert.ok(sparad, "mallen sparades inte som underlag");
  assert.equal(sparad.on, false, "en mall ska inte fylla varje agents kontext");
  assert.deepEqual(Object.keys(sparad).sort(), ["on", "text", "title"], "bara fälten rensa() i _firma.js släpper igenom");
  assert.deepEqual(m.mallar().map((d) => d.title), [titel], "vanliga underlag ska inte räknas som mallar");
  m.sparaSomMall({ title: "Offert Brf Ekbacken", leverans: "Ny version" });
  assert.equal(m.docs().filter((d) => d.title === titel).length, 1, "samma rubrik ska ersätta, inte dubblera");
  assert.equal(m.mallar()[0].text, "Ny version");
});

test("U14: briefen ur en mall bär mallens text och KA16-regeln om [fyll i: …], inom jobbens tak", () => {
  const m = laddaMallar();
  const b = m.mallBrief({ title: "Mall: Offert Brf Ekbacken", text: "Kund: Brf Ekbacken" });
  assert.match(b, /^Det nya uppdraget: /);
  assert.match(b, /\[fyll i: …\]/);
  assert.match(b, /--- MALL: Offert Brf Ekbacken ---\nKund: Brf Ekbacken$/);
  const lång = m.mallBrief({ title: "Mall: X", text: "y".repeat(20000) });
  assert.ok(lång.length <= m.JOBB_BRIEF_MAX - 400, "briefen ska rymmas under jobbens tak med plats kvar åt kunden");
  assert.match(lång, /mallen avkortad/);
});

test("U14: jobbkortet har 'Spara som mall' och jobbformuläret 'Utgå från mall'", () => {
  const yta = VAN.slice(VAN.indexOf("function jobbYta(j)"), VAN.indexOf("function egenLeverans(j)"));
  assert.match(yta, /knapp\("Spara som mall"/, "knappen saknas i Våningens jobbkort");
  assert.match(yta, /sparaSomMall\(j\)/);
  const form = APP.slice(APP.indexOf("function byggJobbForm("), APP.indexOf("// Hur kunden kopplar sin egen AI"));
  assert.match(form, /const mallLista = mallar\(\)/, "formuläret läser inga mallar");
  assert.match(form, /fält\("Utgå från mall/, "rullistan saknas");
  assert.match(form, /uppdrag\.value = mallBrief\(m\)/, "valet skriver inte briefen");
});
