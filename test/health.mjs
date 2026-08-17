// Tester för GET /api/health — larmrutten (D3).
//
// Varför de finns: hälsokontrollens hela värde ligger i att den blir RÖD när
// tjänsten inte kan svara kunder. En hälsokontroll som alltid svarar 200 är
// värre än ingen — den ser ut som ett skyddsnät och tystar frågan "fungerar
// det?". Därför prövas varje felläge var för sig, och det friska läget som
// motprov.
//
// Rutten körs på riktigt med stubbad databas och stubbad env; ingenting går
// uppströms (den gör med flit inget AI-anrop — se kommentaren i health.js).

import { test } from "node:test";
import assert from "node:assert";
import { onRequestGet } from "../functions/api/health.js";

const NU = Date.now();
const dag = (ms) => new Date(ms).toISOString().slice(0, 10);

// `rader` avgör vad SELECT-frågorna svarar. null = ingen rad.
function dbStub({ svarar = true, senasteKreditfel = null, tabellSaknas = false } = {}) {
  return {
    prepare: (sql) => ({
      first: async () => {
        if (!svarar) throw new Error("D1 nere");
        if (/SELECT 1/.test(sql)) return { ok: 1 };
        return null;
      },
      bind: () => ({
        first: async () => {
          if (!svarar) throw new Error("D1 nere");
          if (/ai_errors/.test(sql)) {
            if (tabellSaknas) throw new Error("no such table: ai_errors");
            return senasteKreditfel ? { last_at: senasteKreditfel } : null;
          }
          return null;
        },
      }),
    }),
  };
}

const kör = async (env) => {
  const res = await onRequestGet({ env });
  return { status: res.status, kropp: await res.json() };
};

test("friskt läge svarar 200", async () => {
  const { status, kropp } = await kör({ DB: dbStub(), OPENROUTER_KEY: "sk-or-test" });
  assert.equal(status, 200);
  assert.equal(kropp.ok, true);
  assert.equal(kropp.checks.ai_nyckel, true);
  assert.equal(kropp.checks.databas, true);
  assert.equal(kropp.checks.ai_kredit, true);
  assert.deepEqual(kropp.problem, []);
});

test("saknad OPENROUTER_KEY ger 503 — /api/ai svarar 503 på allt då", async () => {
  const { status, kropp } = await kör({ DB: dbStub() });
  assert.equal(status, 503);
  assert.equal(kropp.ok, false);
  assert.equal(kropp.checks.ai_nyckel, false);
  assert.match(kropp.problem.join(" "), /OPENROUTER_KEY/);
});

test("databas som inte svarar ger 503", async () => {
  const { status, kropp } = await kör({ DB: dbStub({ svarar: false }), OPENROUTER_KEY: "sk-or-test" });
  assert.equal(status, 503);
  assert.equal(kropp.checks.databas, false);
  assert.match(kropp.problem.join(" "), /D1 svarar inte/);
});

test("färskt kreditfel ger 503 — det löser sig inte av sig självt", async () => {
  const nyss = NU - 2 * 60 * 1000;
  const { status, kropp } = await kör({ DB: dbStub({ senasteKreditfel: nyss }), OPENROUTER_KEY: "sk-or-test" });
  assert.equal(status, 503);
  assert.equal(kropp.checks.ai_kredit, false);
  assert.match(kropp.problem.join(" "), /402|krediten/i);
});

test("gammalt kreditfel ger 200 — påfylld kredit ska synas snabbt", async () => {
  // Motprovet mot testet ovan: en rutt som stannar röd efter att felet är löst
  // gör att larmet ignoreras nästa gång.
  const igår = NU - 3 * 60 * 60 * 1000;
  const { status, kropp } = await kör({ DB: dbStub({ senasteKreditfel: igår }), OPENROUTER_KEY: "sk-or-test" });
  assert.equal(status, 200);
  assert.equal(kropp.checks.ai_kredit, true);
});

test("saknad ai_errors-tabell gör inte rutten röd, men syns", async () => {
  // Migration 0006 kanske inte är körd. Att gå röd då hade larmat om ett
  // driftläge som inte drabbar en enda kund.
  const { status, kropp } = await kör({ DB: dbStub({ tabellSaknas: true }), OPENROUTER_KEY: "sk-or-test" });
  assert.equal(status, 200);
  assert.equal(kropp.checks.ai_kredit, null, "okänt, inte friskt");
});

test("svaret läcker inga siffror och ingen kunddata", async () => {
  // Rutten är öppen — en uptime-vakt kan inte logga in. Antal anrop per dygn är
  // affärsinformation, och kroppen får inte bli en publik mätare.
  const { kropp } = await kör({ DB: dbStub(), OPENROUTER_KEY: "sk-or-test" });
  const text = JSON.stringify(kropp);
  assert.ok(!/sk-or-test/.test(text), "nyckeln får aldrig med i svaret");
  for (const fält of ["calls", "input_tok", "output_tok", "subject", "email", "slug"]) {
    assert.ok(!new RegExp(fält).test(text), `svaret innehåller ${fält}`);
  }
  // Bara de tre kontrollerna, inget mer.
  assert.deepEqual(Object.keys(kropp).sort(), ["at", "checks", "ok", "problem", "status"]);
});

test("felkoden är 503 och inte 500 — det är ett driftläge, inte en krasch", async () => {
  const { status } = await kör({ DB: dbStub({ svarar: false }) });
  assert.equal(status, 503, "en uptime-vakt skiljer på 5xx-koder i sina rapporter");
});
