// Tester för spärren (`allowAttempt`) mot en RIKTIG SQLite-databas.
//
// Varför riktig databas och inte en stubb: hela poängen med ändringen
// 2026-08-16 är att räkningen och beslutet sker i ETT SQL-uttryck. En stubb
// hade bara bekräftat att JavaScript-raderna körs i rätt ordning — den kan
// inte visa att `ON CONFLICT DO UPDATE ... RETURNING` faktiskt räknar upp,
// nollställer fönstret vid rätt tidpunkt och lämnar tillbaka det nya värdet.
// Det är just den semantiken som bär taken, och den bor i databasen.
//
// D1 är SQLite, så beteendet här är det som gäller skarpt. `node:sqlite` är
// märkt experimentellt i Node — används bara av testerna, aldrig i drift.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { allowAttempt } from "../functions/api/auth/_lib.js";

const FÖNSTER_MS = 15 * 60 * 1000;

// Minimal D1-fasad ovanpå node:sqlite: prepare().bind().first()/run().
// `nu` är utbytbar så att tidsberoende kan testas utan att vänta.
function skapaDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`CREATE TABLE auth_throttle (
    bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, window_at INTEGER NOT NULL
  )`);
  return {
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () => sqlite.prepare(sql).get(...args) ?? null,
        run: async () => { sqlite.prepare(sql).run(...args); return {}; },
      }),
    }),
    _rå: sqlite,
  };
}

// allowAttempt läser tiden via nowMs(); här styrs den med Date.now.
function medTid(ms, fn) {
  const original = Date.now;
  Date.now = () => ms;
  try { return fn(); } finally { Date.now = original; }
}

test("släpper igenom upp till taket och stoppar därefter", async () => {
  const db = skapaDb();
  const t = 1_700_000_000_000;
  const svar = [];
  for (let i = 0; i < 5; i++) svar.push(await medTid(t, () => allowAttempt(db, "b", 3)));
  assert.deepEqual(svar, [true, true, true, false, false], "exakt 3 släpps igenom");
});

test("taket är inkluderande: max=1 släpper igenom precis ett anrop", async () => {
  const db = skapaDb();
  const t = 1_700_000_000_000;
  assert.equal(await medTid(t, () => allowAttempt(db, "b", 1)), true);
  assert.equal(await medTid(t, () => allowAttempt(db, "b", 1)), false);
});

test("fönstret nollställs när det löpt ut", async () => {
  const db = skapaDb();
  const t = 1_700_000_000_000;
  for (let i = 0; i < 3; i++) await medTid(t, () => allowAttempt(db, "b", 3));
  assert.equal(await medTid(t, () => allowAttempt(db, "b", 3)), false, "taket nått");

  // Precis innan fönstret gått ut: fortfarande spärrad.
  assert.equal(await medTid(t + FÖNSTER_MS, () => allowAttempt(db, "b", 3)), false);
  // Strax efter: räkningen börjar om.
  assert.equal(await medTid(t + FÖNSTER_MS + 1, () => allowAttempt(db, "b", 3)), true);
});

test("fortsatta försök förlänger INTE spärren", async () => {
  // Det vore lätt att skriva window_at = nu vid varje träff. Då kunde den som
  // knackar på varje minut hålla sitt eget fönster öppet i evighet och aldrig
  // släppas in igen — spärren skulle bli permanent i stället för tillfällig.
  const db = skapaDb();
  const t = 1_700_000_000_000;
  for (let i = 0; i < 3; i++) await medTid(t, () => allowAttempt(db, "b", 3));
  // Knacka på under hela fönstret.
  for (let m = 1; m <= 14; m++) await medTid(t + m * 60_000, () => allowAttempt(db, "b", 3));
  // Fönstret ska ändå löpa ut på ursprunglig tid.
  assert.equal(await medTid(t + FÖNSTER_MS + 1, () => allowAttempt(db, "b", 3)), true,
    "fönstret ska räknas från första försöket, inte från det senaste");
});

test("hinkarna är oberoende av varandra", async () => {
  const db = skapaDb();
  const t = 1_700_000_000_000;
  for (let i = 0; i < 3; i++) await medTid(t, () => allowAttempt(db, "a", 3));
  assert.equal(await medTid(t, () => allowAttempt(db, "a", 3)), false);
  assert.equal(await medTid(t, () => allowAttempt(db, "b", 3)), true, "annan hink ska vara orörd");
});

test("tio anrop ger exakt så många ja som taket tillåter", async () => {
  // ÄRLIGHET OM VAD DET HÄR TESTAR: `node:sqlite` är synkron, så anropen
  // nedan serialiseras trots Promise.all. Testet bevisar alltså INTE att
  // kapplöpningen är borta — det är en egenskap hos databasen, inte hos
  // JavaScript-raderna, och den kommer av att räkning och beslut nu ligger i
  // EN sats (INSERT ... ON CONFLICT DO UPDATE ... RETURNING) i stället för i
  // ett SELECT följt av ett UPDATE.
  //
  // Vad det däremot gör: låser fast räknesemantiken, så att en framtida
  // "förenkling" tillbaka till läs-sedan-skriv fälls här om den råkar räkna
  // fel — och dokumenterar var atomiciteten faktiskt bor.
  const db = skapaDb();
  const t = 1_700_000_000_000;
  const svar = await medTid(t, () => Promise.all(
    Array.from({ length: 10 }, () => allowAttempt(db, "b", 4))
  ));
  assert.equal(svar.filter(Boolean).length, 4, "exakt fyra ska släppas igenom, inte fler");
});

test("RETURNING ger tillbaka det nya värdet — annars vore beslutet blint", async () => {
  const db = skapaDb();
  const t = 1_700_000_000_000;
  await medTid(t, () => allowAttempt(db, "b", 3));
  await medTid(t, () => allowAttempt(db, "b", 3));
  const rad = db._rå.prepare("SELECT count, window_at FROM auth_throttle WHERE bucket = 'b'").get();
  assert.equal(rad.count, 2, "räkningen ska ha skrivits till tabellen");
  assert.equal(rad.window_at, t);
});

test("stänger hellre än öppnar om databasen inte svarar", async () => {
  // Fail-closed: en databasstörning får inte bli en öppen dörr förbi taket.
  const trasig = { prepare: () => ({ bind: () => ({ first: async () => null }) }) };
  assert.equal(await allowAttempt(trasig, "b", 100), false);
});
