// Tester för gallringen (BF5) — integritetspolicyns lagringstider, verkställda.
//
// Gallringen RADERAR i den skarpa databasen varje timme. Testerna kör den mot
// en riktig SQLite i minnet (node:sqlite) med projektets egna migrationer, så
// att SQL:en, kaskaderna och ordningen prövas på riktigt — inte mot en stubb
// som säger ja till allt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { gallra, GALLRING } from "../functions/api/_gallring.js";

const DAG = 86400000;
const NU = Date.UTC(2026, 9, 1, 12);

// D1-lik yta ovanpå node:sqlite: prepare().bind().run/first/all och batch().
function d1() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys = ON;");
  for (const f of readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) {
    sql.exec(readFileSync("migrations/" + f, "utf8"));
  }
  const stmt = (q) => ({
    bind: (...args) => ({
      run: async () => { const r = sql.prepare(q).run(...args); return { meta: { changes: Number(r.changes) } }; },
      first: async () => sql.prepare(q).get(...args) || null,
      all: async () => ({ results: sql.prepare(q).all(...args) }),
    }),
  });
  return {
    prepare: stmt,
    batch: async (satser) => { const ut = []; for (const s of satser) ut.push(await s.run()); return ut; },
    _sql: sql,
  };
}
const antal = (db, tabell) => db._sql.prepare(`SELECT COUNT(*) AS n FROM ${tabell}`).get().n;
const lägg = (db, q, ...a) => db._sql.prepare(q).run(...a);

function scen() {
  const db = d1();
  const team = (slug, plan, skapad, ändrad) =>
    lägg(db, "INSERT INTO teams (slug, config, tier, plan, created_at, plan_changed_at) VALUES (?, '{}', 'self-serve', ?, ?, ?)", slug, plan, skapad, ändrad);
  const user = (id, skapad) => lägg(db, "INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", id, id + "@x.se", skapad);
  const access = (slug, id, inbjuden) => lägg(db, "INSERT INTO team_access (team_slug, user_id, role, created_at, invited_by) VALUES (?, ?, 'owner', ?, ?)", slug, id, NU - 200 * DAG, inbjuden || null);

  team("aktivt", "standard", NU - 400 * DAG, NU - 400 * DAG);         // betalande sedan länge — rörs aldrig
  team("nyss-uppsagt", "cancelled", NU - 300 * DAG, NU - 10 * DAG);   // inom 90 dagar — står kvar
  team("gammalt-uppsagt", "cancelled", NU - 300 * DAG, NU - 100 * DAG); // över 90 — raderas
  team("angrat", "refunded", NU - 200 * DAG, NU - 95 * DAG);          // över 90 — raderas
  team("gammal-prov", "trial", NU - 130 * DAG, null);                 // provmånad aldrig markerad expired — raderas
  team("ny-prov", "trial", NU - 20 * DAG, null);                      // pågående provmånad — står kvar
  user("u-aktiv", NU - 400 * DAG); access("aktivt", "u-aktiv");
  user("u-gammal", NU - 300 * DAG); access("gammalt-uppsagt", "u-gammal");
  user("u-kollega", NU - 250 * DAG); access("aktivt", "u-kollega", "u-gammal"); // inbjuden av ett konto som gallras
  user("u-ny", NU - 5 * DAG);                                          // nytt konto utan team än — står kvar
  lägg(db, "INSERT INTO login_codes (email, code_hash, attempts, expires_at, created_at) VALUES ('a@x.se', 'h', 0, ?, ?)", NU - 60000, NU - 700000);
  lägg(db, "INSERT INTO login_codes (email, code_hash, attempts, expires_at, created_at) VALUES ('b@x.se', 'h', 0, ?, ?)", NU + 500000, NU - 100000);
  lägg(db, "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES ('s1', 'u-aktiv', ?, ?)", NU - 1000, NU - 40 * DAG);
  lägg(db, "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES ('s2', 'u-aktiv', ?, ?)", NU + 20 * DAG, NU - DAG);
  lägg(db, "INSERT INTO ai_usage (subject, period, calls) VALUES ('ip:1.2.3.4', ?, 3)", new Date(NU - 40 * DAG).toISOString().slice(0, 10));
  lägg(db, "INSERT INTO ai_usage (subject, period, calls) VALUES ('ip:1.2.3.4', ?, 3)", new Date(NU - 2 * DAG).toISOString().slice(0, 10));
  lägg(db, "INSERT INTO ai_usage (subject, period, calls) VALUES ('team:aktivt', '2025-01', 9)");
  return db;
}

test("BF5: avslutade team över 90 dagar gallras — aktiva, nyss uppsagda och pågående provmånader står kvar", async () => {
  const db = scen();
  await gallra(db, NU);
  const kvar = db._sql.prepare("SELECT slug FROM teams ORDER BY slug").all().map((r) => r.slug);
  assert.deepEqual(kvar, ["aktivt", "ny-prov", "nyss-uppsagt"]);
});

test("BF5: kontot vars enda team gallrats raderas i samma körning; en kollega det bjudit in behålls", async () => {
  const db = scen();
  await gallra(db, NU);
  const users = db._sql.prepare("SELECT id FROM users ORDER BY id").all().map((r) => r.id);
  assert.deepEqual(users, ["u-aktiv", "u-kollega", "u-ny"]);
  const inbjuden = db._sql.prepare("SELECT invited_by FROM team_access WHERE user_id = 'u-kollega'").get();
  assert.equal(inbjuden.invited_by, null, "referensen till det gallrade kontot ska nollställas, inte blockera raderingen");
});

test("BF5: utgångna koder och sessioner gallras, giltiga står kvar", async () => {
  const db = scen();
  await gallra(db, NU);
  assert.equal(antal(db, "login_codes"), 1);
  assert.equal(antal(db, "sessions"), 1);
});

test("BF5: IP-rader äldre än 30 dagar gallras; teamens rader rörs inte", async () => {
  const db = scen();
  await gallra(db, NU);
  const rader = db._sql.prepare("SELECT subject, period FROM ai_usage ORDER BY subject, period").all();
  assert.equal(rader.filter((r) => r.subject.startsWith("ip:")).length, 1);
  assert.ok(rader.some((r) => r.subject === "team:aktivt"), "teamets förbrukning är inte personuppgift per IP och ska stå kvar");
});

test("BF5: gallringen är idempotent — en körning till raderar ingenting", async () => {
  const db = scen();
  await gallra(db, NU);
  const andra = await gallra(db, NU);
  assert.ok(Object.values(andra).every((n) => n === 0), JSON.stringify(andra));
});

test("BF5: tiderna matchar integritetspolicyn — 90 dagar efter uppsägning, ett dygn för utkast", () => {
  assert.equal(GALLRING.avslutadMs, 90 * DAG);
  assert.equal(GALLRING.kontoMs, 90 * DAG);
  assert.equal(GALLRING.utkastMs, DAG);
  const pol = readFileSync("integritet.html", "utf8");
  assert.match(pol, /raderas kontot inom 90 dagar/);
  assert.match(pol, /90 dagar innan\s+posten raderas/);
});
