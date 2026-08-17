// Tester för veckobrevet — POST /api/digest/run och avregistreringen.
//
// Varför de finns: rutten är den enda i projektet som både SKICKAR MEJL och
// SPENDERAR PENGAR utan att en människa tryckt på något. Går den fel finns två
// felmoder som båda är dyra på sitt sätt: den skickar två brev samma dag (eller
// till en kund vars plan tagit slut), eller så kostar den utan att räknas.
//
// Testerna kör den riktiga onRequestPost med stubbad databas, stubbad uppström
// och stubbad mejlsändare. Ingenting lämnar maskinen.

import { test } from "node:test";
import assert from "node:assert";
import { onRequestPost } from "../functions/api/digest/run.js";
import { onRequestGet as unsubscribe } from "../functions/avregistrera.js";

const HEMLIGHET = "test-hemlighet-1234";

// En måndag klockan 08 UTC — efter timgolvet, så breven ska gå ut.
const MÅNDAG_08 = Date.UTC(2026, 7, 17, 8, 0, 0); // 2026-08-17 är en måndag
const MÅNDAG_03 = Date.UTC(2026, 7, 17, 3, 0, 0); // före timgolvet

const KONFIG = JSON.stringify({
  company: "Lerverk",
  entryAgent: "veckopiloten",
  agents: [
    { id: "veckopiloten", name: "Veckopiloten", job: "Håller ihop veckan", system: "Du är Veckopiloten." },
    { id: "butiksskribenten", name: "Butiksskribenten", job: "Skriver produkttexter" },
  ],
  routines: [{ label: "Nyhetsbrev", day: "fre" }],
});

// En mottagare som ska ha brev.
const rad = (extra = {}) => Object.assign({
  user_id: "u1", team_slug: "a".repeat(22), token: "t".repeat(32),
  email: "anna@example.se", config: KONFIG, plan: "standard", created_at: MÅNDAG_08 - 86400000,
}, extra);

function dbStub({ rader = [rad()], globalt = 0, digest = 0 } = {}) {
  const skrivna = [];
  return {
    _skrivna: skrivna,
    prepare: (sql) => ({
      bind: (...args) => ({
        all: async () => ({ results: rader }),
        first: async () => {
          if (/FROM ai_budget/.test(sql)) return { calls: globalt };
          if (/FROM ai_usage/.test(sql)) return { calls: args[0] === "digest:global" ? digest : 0 };
          return null;
        },
        run: async () => { skrivna.push({ sql, args }); return { meta: { changes: 1 } }; },
        _sql: sql, _args: args,
      }),
    }),
    batch: async (satser) => { satser.forEach((s) => skrivna.push({ sql: s._sql, args: s._args })); return []; },
  };
}

const env = (db, extra = {}) => Object.assign({
  DB: db, DIGEST_SECRET: HEMLIGHET, OPENROUTER_KEY: "sk-or-test",
  // console-läget i sendMail skriver till loggen i stället för att mejla.
  MAIL_PROVIDER: "console",
}, extra);

const req = (auth = "Bearer " + HEMLIGHET) =>
  new Request("https://mittaiteam.se/api/digest/run", { method: "POST", headers: auth ? { authorization: auth } : {} });

// Stubbar uppström och klockan runt ett anrop.
async function kör(db, e, { tid = MÅNDAG_08, svar } = {}) {
  const origFetch = globalThis.fetch;
  const origNow = Date.now;
  Date.now = () => tid;
  globalThis.fetch = async () => svar || new Response(JSON.stringify({
    choices: [{ message: { content: "Hej! Tre saker den här veckan: ..." } }],
    usage: { prompt_tokens: 300, completion_tokens: 120 },
  }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const res = await onRequestPost({ env: e, request: req() });
    return { status: res.status, kropp: await res.json() };
  } finally {
    globalThis.fetch = origFetch;
    Date.now = origNow;
  }
}

test("utan rätt hemlighet svarar rutten 401", async () => {
  const db = dbStub();
  for (const auth of ["", "Bearer fel", "Bearer " + HEMLIGHET.slice(0, -1)]) {
    const res = await onRequestPost({ env: env(db), request: req(auth) });
    assert.equal(res.status, 401, `auth "${auth}" borde ge 401`);
  }
  assert.equal(db._skrivna.length, 0, "inget får skrivas innan hemligheten stämmer");
});

test("saknad DIGEST_SECRET stänger rutten helt", async () => {
  const res = await onRequestPost({ env: { DB: dbStub(), OPENROUTER_KEY: "x" }, request: req() });
  assert.equal(res.status, 503, "en rutt utan hemlighet får inte vara öppen");
});

test("ett brev skickas, och anropet bokförs", async () => {
  const db = dbStub();
  const { kropp } = await kör(db, env(db));
  assert.equal(kropp.skickade, 1);
  assert.equal(kropp.fel, 0);
  const allt = JSON.stringify(db._skrivna);
  assert.match(allt, /ai_budget/, "det globala dygnstaket ska räknas upp");
  assert.match(allt, /team:/, "teamets månadsrad ska räknas upp — brevet går mot samma fair use som chatten");
  assert.match(allt, /digest:global/, "veckobrevets egen dygnsrad ska räknas upp, annars är dess tak en siffra som aldrig växer");
  assert.match(allt, /last_sent_day/, "dygnet ska märkas som avklarat");
});

test("före timgolvet skickas ingenting", async () => {
  // Workern knackar varje timme för att en misslyckad körning ska tas igen. Utan
  // golvet hade första knacken efter midnatt UTC väckt kunden klockan ett.
  const db = dbStub();
  const { kropp } = await kör(db, env(db), { tid: MÅNDAG_03 });
  assert.equal(kropp.skickade, 0);
  assert.match(String(kropp.orsak), /tidigt/);
  assert.equal(db._skrivna.length, 0, "inget anrop, ingen bokföring");
});

test("en kund vars plan tagit slut får inget veckobrev", async () => {
  // Det brevet ska handla om något annat. Ett veckobrev till en spärrad kund är
  // att sälja på fel sätt.
  for (const plan of ["expired", "cancelled", "past_due", "refunded"]) {
    const db = dbStub({ rader: [rad({ plan })] });
    const { kropp } = await kör(db, env(db));
    assert.equal(kropp.skickade, 0, `plan "${plan}" borde hoppas över`);
    assert.equal(kropp.hoppade, 1);
  }
});

test("det globala dygnstaket stoppar alla brev", async () => {
  const db = dbStub({ globalt: 4000 });
  const { kropp } = await kör(db, env(db));
  assert.equal(kropp.skickade, 0);
  assert.equal(kropp.code, "service_busy");
});

test("veckobrevets eget dygnstak stoppar bara veckobrev", async () => {
  // Samma resonemang som byggets tak (K3): en post som delar hink med portalen
  // kan svälta betalande kunders chatt.
  const db = dbStub({ digest: 200 });
  const { kropp } = await kör(db, env(db));
  assert.equal(kropp.skickade, 0);
  assert.equal(kropp.hoppade, 1);
});

test("uppströmsfel bokförs och räknas som fel, inte som skickat", async () => {
  const db = dbStub();
  const { kropp } = await kör(db, env(db), {
    svar: new Response("insufficient credits", { status: 402 }),
  });
  assert.equal(kropp.skickade, 0);
  assert.equal(kropp.fel, 1);
  assert.match(JSON.stringify(db._skrivna), /ai_errors/, "felet ska lämna ett spår som /api/health kan läsa");
  assert.ok(!JSON.stringify(db._skrivna).includes("last_sent_day"),
    "dygnet får INTE märkas som avklarat när brevet inte gick — nästa körning ska försöka igen");
});

test("saknad modellnyckel ger 503 utan att röra databasen", async () => {
  const db = dbStub();
  const res = await onRequestPost({ env: { DB: db, DIGEST_SECRET: HEMLIGHET }, request: req() });
  assert.equal(res.status, 503);
  assert.equal(db._skrivna.length, 0);
});

// ── avregistrering ─────────────────────────────────────────────────────────

const unsubReq = (t) => new Request(`https://mittaiteam.se/avregistrera?t=${t}`);

test("avregistrering med giltig token slår av brevet", async () => {
  const db = dbStub();
  const res = await unsubscribe({ env: { DB: db }, request: unsubReq("t".repeat(32)) });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /avslaget/i);
  assert.match(html, /noindex/, "avregistreringssidan ska inte indexeras");
  assert.match(JSON.stringify(db._skrivna), /active = 0/);
});

test("avregistrering kräver INGEN inloggning", async () => {
  // Att kräva inloggning för att slippa ett mejl är att inte låta kunden slippa
  // det. Ingen cookie skickas här, och det ska ändå fungera.
  const res = await unsubscribe({ env: { DB: dbStub() }, request: unsubReq("t".repeat(32)) });
  assert.equal(res.status, 200);
});

test("en token av fel form avvisas före databasen", async () => {
  const db = dbStub();
  for (const t of ["", "kort", "a".repeat(200), "har mellanslag"] ) {
    const res = await unsubscribe({ env: { DB: db }, request: unsubReq(encodeURIComponent(t)) });
    assert.equal(res.status, 400, `token "${t.slice(0, 12)}" borde avvisas`);
  }
  assert.equal(db._skrivna.length, 0, "ingen databasskrivning på en trasig token");
});

// ── idempotensen ligger i SQL:en, inte i koden ─────────────────────────────
//
// Stubben ovan svarar med rader oavsett WHERE-sats, så inget av testerna kan
// visa att en andra körning samma dygn hoppar över dem som redan fått brev.
// Det är en verklig begränsning i stubben, inte något som är bevisat. Det här
// testet är därför strukturellt: det läser frågan ur källan och kräver att
// villkoren finns. Det fångar att någon tar bort dem — inte att de fungerar.
// Det som fungerar i praktiken behöver en riktig databas (som `allowAttempt`
// fick 2026-08-16).
test("urvalsfrågan filtrerar på veckodag, aktiv OCH senast skickad", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("functions/api/digest/run.js", "utf8");
  const fråga = src.slice(src.indexOf("FROM weekly_digest"), src.indexOf("LIMIT ?"));
  assert.match(fråga, /d\.active = 1/, "inaktiva ska inte få brev");
  assert.match(fråga, /d\.weekday = \?/, "bara den valda dagens mottagare");
  assert.match(fråga, /last_sent_day IS NULL OR d\.last_sent_day != \?/,
    "utan det här villkoret skickar en cron som fyrar två gånger två brev");
  assert.match(fråga, /JOIN teams/, "planen måste med, annars går brev till spärrade kunder");
});
