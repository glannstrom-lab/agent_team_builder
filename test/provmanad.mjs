// Tester för provmånadens påminnelse (P3) — mot riktig SQLite med projektets
// egna migrationer, som gallringen: SQL:en, joinen mot ägaren och markeringen
// som gör att mejlet går en gång prövas på riktigt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { provmånadsPåminnelser } from "../functions/api/_provmanad.js";

const DAG = 86400000;
const NU = Date.UTC(2026, 9, 1, 9);

function d1() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys = ON;");
  for (const f of readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) sql.exec(readFileSync("migrations/" + f, "utf8"));
  const stmt = (q) => ({ bind: (...a) => ({
    run: async () => ({ meta: { changes: Number(sql.prepare(q).run(...a).changes) } }),
    first: async () => sql.prepare(q).get(...a) || null,
    all: async () => ({ results: sql.prepare(q).all(...a) }),
  }) });
  return { prepare: stmt, _sql: sql };
}
function scen() {
  const db = d1();
  const lägg = (q, ...a) => db._sql.prepare(q).run(...a);
  const team = (slug, plan, dagarSedan, email) => {
    lägg("INSERT INTO teams (slug, config, tier, plan, created_at) VALUES (?, ?, 'self-serve', ?, ?)", slug, JSON.stringify({ company: slug + " AB" }), plan, NU - dagarSedan * DAG);
    lägg("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", "u-" + slug, email, NU - dagarSedan * DAG);
    lägg("INSERT INTO team_access (team_slug, user_id, role, created_at) VALUES (?, ?, 'owner', ?)", slug, "u-" + slug, NU - dagarSedan * DAG);
  };
  team("dag25", "trial", 25.5, "a@x.se");   // ska påminnas
  team("dag10", "trial", 10, "b@x.se");     // för tidigt
  team("dag28", "trial", 28, "c@x.se");     // fönstret passerat (en körning per timme hinner dag 25)
  team("betalar", "standard", 25.5, "d@x.se"); // inte provmånad
  return db;
}

test("P3: ägaren till en provmånad på dag 25 får en påminnelse — ingen annan", async () => {
  const db = scen(); const skickat = [];
  const n = await provmånadsPåminnelser(db, {}, NU, async (env, email, d) => { skickat.push({ email, ...d }); });
  assert.equal(n, 1);
  assert.equal(skickat[0].email, "a@x.se");
  assert.equal(skickat[0].company, "dag25 AB");
  assert.equal(skickat[0].dagar, 5);
});

test("P3: påminnelsen går en gång — nästa timmes körning skickar inget", async () => {
  const db = scen(); let n2 = 0;
  await provmånadsPåminnelser(db, {}, NU, async () => {});
  await provmånadsPåminnelser(db, {}, NU + 3600000, async () => { n2++; });
  assert.equal(n2, 0);
});

test("P3: ett misslyckat utskick bokförs inte — nästa körning försöker igen", async () => {
  const db = scen(); let försök = 0;
  await provmånadsPåminnelser(db, {}, NU, async () => { försök++; throw new Error("mejlen nere"); });
  const n = await provmånadsPåminnelser(db, {}, NU + 3600000, async () => { försök++; });
  assert.equal(försök, 2);
  assert.equal(n, 1);
});

test("P3: påminnelsen skickas efter timgolvet, aldrig på natten", () => {
  const src = readFileSync("functions/api/digest/run.js", "utf8");
  const golv = src.indexOf('orsak: "för tidigt på dygnet"');
  const påminn = src.indexOf("await provmånadsPåminnelser(");
  assert.ok(golv > 0 && påminn > golv, "påminnelsen måste ligga efter timgolvet");
});
