// Tester för atb-claude.js — SSE-parsern som båda ytorna delar.
//
// Varför de finns: klientkoden var 6 540 rader utan ett enda test, och det var
// precis där B1 låg. En städning tog bort variabeln `openrouter` men lämnade
// raden som läste den, så parsern kastade ReferenceError på första strömmade
// raden — varje AI-svar i både builder och portal dog innan ett tecken nådde
// skärmen, i tio dagar i produktion. Syntaxkontroll och 69 gröna tester på
// serversidan såg ingenting, för inget test rörde klienten.
//
// Filen är ett klassiskt skript som sätter window.ATBClaude. Här laddas den med
// en stubbad global window och en stubbad fetch, så parsern går att köra utan
// webbläsare och utan att något anrop lämnar maskinen.

import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

const KÄLLA = readFileSync("atb-claude.js", "utf8");

// Bygger ett svar som liknar det /api/ai skickar: SSE-rader i chunkar.
// `chunkar` är råa strängar — avsiktligt uppdelade mitt i JSON i ett av testen,
// eftersom det är så en riktig ström beter sig och där parsern kan gå sönder.
function svar(chunkar, { ok = true, status = 200 } = {}) {
  const enc = new TextEncoder();
  return {
    ok,
    status,
    headers: { get: () => "text/event-stream" },
    body: {
      getReader() {
        let i = 0;
        return {
          read: async () =>
            i < chunkar.length ? { done: false, value: enc.encode(chunkar[i++]) } : { done: true },
        };
      },
    },
  };
}

// Laddar klienten med en fetch som svarar med `svaret`. Ny instans per test så
// att modultillståndet (t.ex. setTeam) inte läcker mellan fallen.
function ladda(svaret) {
  const anrop = [];
  const win = {};
  const sandbox = {
    window: win,
    fetch: async (url, init) => { anrop.push({ url, init }); return svaret; },
    TextDecoder,
    TextEncoder,
    AbortController,
    setTimeout,
    clearTimeout,
  };
  const nycklar = Object.keys(sandbox);
  // Kör IIFE:n med stubbarna som lokala variabler i stället för globala.
  new Function(...nycklar, KÄLLA)(...nycklar.map((k) => sandbox[k]));
  return { atb: win.ATBClaude, anrop };
}

const rad = (o) => `data: ${JSON.stringify(o)}\n\n`;
const bit = (t) => rad({ choices: [{ delta: { content: t } }] });

test("strömmar text och rapporterar förbrukning", async () => {
  const { atb } = ladda(svar([
    bit("Hej"), bit(" på"), bit(" dig"),
    rad({ choices: [{ delta: {}, finish_reason: "stop" }] }),
    rad({ usage: { prompt_tokens: 120, completion_tokens: 34 } }),
    "data: [DONE]\n\n",
  ]));
  let ut = "";
  let förbrukning = null;
  const res = await atb.stream({
    system: "s", messages: [{ role: "user", content: "hej" }],
    onDelta: (d) => { ut += d; },
    onUsage: (u) => { förbrukning = u; },
  });
  assert.equal(ut, "Hej på dig");
  assert.deepEqual(förbrukning, { input: 120, output: 34 });
  assert.equal(res.finishReason, "stop");
});

test("avkapat svar (finish_reason: length) anropar onTruncated", async () => {
  // KL3: utan det här renderas och sparas ett halvt svar som om det vore
  // färdigt, och kunden läser den kapade sista meningen som avsiktlig.
  const { atb } = ladda(svar([
    bit("Första delen av ett långt utkast"),
    rad({ choices: [{ delta: {}, finish_reason: "length" }] }),
    "data: [DONE]\n\n",
  ]));
  let varnad = 0;
  const res = await atb.stream({
    system: "s", messages: [], onDelta: () => {}, onTruncated: () => { varnad++; },
  });
  assert.equal(varnad, 1, "onTruncated ska anropas exakt en gång");
  assert.equal(res.finishReason, "length");
});

test("ett normalt avslut varnar INTE", async () => {
  // Motprovet: en varning som alltid syns är ingen varning.
  const { atb } = ladda(svar([bit("klart"), rad({ choices: [{ delta: {}, finish_reason: "stop" }] })]));
  let varnad = 0;
  await atb.stream({ system: "s", messages: [], onDelta: () => {}, onTruncated: () => { varnad++; } });
  assert.equal(varnad, 0);
});

test("en chunk delad mitt i en JSON-rad tappar inga tecken", async () => {
  // Så beter sig en riktig ström. Parsern buffrar och får inte kasta på en
  // ofullständig rad — den ska vänta på nästa chunk.
  const hel = bit("sammanhängande");
  const mitt = Math.floor(hel.length / 2);
  const { atb } = ladda(svar([hel.slice(0, mitt), hel.slice(mitt), "data: [DONE]\n\n"]));
  let ut = "";
  await atb.stream({ system: "s", messages: [], onDelta: (d) => { ut += d; } });
  assert.equal(ut, "sammanhängande");
});

test("felram mitt i strömmen kastar med serverns eget meddelande", async () => {
  const { atb } = ladda(svar([
    bit("börjar bra"),
    rad({ error: { message: "månadstaket är nått" } }),
  ]));
  await assert.rejects(
    () => atb.stream({ system: "s", messages: [], onDelta: () => {} }),
    /månadstaket är nått/,
  );
});

test("anropet går till /api/ai med sessionen, aldrig till en leverantör", async () => {
  // Betalväggen och taken sitter i /api/ai. En klient som pratar direkt med en
  // leverantör kringgår köpgrinden, vilket var exakt vad den gamla
  // nyckelvägen gjorde.
  const { atb, anrop } = ladda(svar([bit("x")]));
  atb.setTeam("lerverk");
  await atb.stream({ system: "s", messages: [], onDelta: () => {} });
  assert.equal(anrop.length, 1);
  assert.equal(anrop[0].url, "/api/ai");
  assert.equal(anrop[0].init.credentials, "same-origin");
  const kropp = JSON.parse(anrop[0].init.body);
  assert.equal(kropp.team, "lerverk", "slugen bärs som modultillstånd, inte av anropsstället");
});

test("collect returnerar hela texten som en sträng", async () => {
  const { atb } = ladda(svar([bit("a"), bit("b"), bit("c")]));
  const ut = await atb.collect({ system: "s", messages: [] });
  assert.equal(ut, "abc");
});
