// Våningen (SP16/SP20). portal/vaningen.js är ett klassiskt skript som läser
// app.js:s toppnivå — state, team, selectAgent, firmanLage, jobbApi … — utan
// import. Byter en av dem namn i app.js går ingenting sönder vid bygget, men
// portalen kastar ReferenceError i drift så fort kunden klickar på ett rum.
// Samma fälla som B1 (tio dagar stum produkt). Testerna här gör namnen till
// ett kontrakt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
  "openJobs", "refreshSidebar", "firmaSpeglaKunder",
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
