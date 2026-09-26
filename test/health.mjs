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

// Alla driftsecrets satta — utan dem är tjänsten inte frisk (DR6).
const ALLA = { MAIL_API_KEY: "x", MAIL_FROM: "x", STRIPE_SECRET_KEY: "x", STRIPE_WEBHOOK_SECRET: "x",
  STRIPE_PRICE_TRIAL: "x", STRIPE_PRICE_STANDARD: "x", DIGEST_SECRET: "x" };

const kör = async (env) => {
  const res = await onRequestGet({ env });
  return { status: res.status, kropp: await res.json() };
};

test("friskt läge svarar 200", async () => {
  const { status, kropp } = await kör({ DB: dbStub(), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 200);
  assert.equal(kropp.ok, true);
  assert.equal(kropp.checks.ai_nyckel, true);
  assert.equal(kropp.checks.databas, true);
  assert.equal(kropp.checks.ai_kredit, true);
  assert.deepEqual(kropp.problem, []);
});

test("saknad OPENROUTER_KEY ger 503 — /api/ai svarar 503 på allt då", async () => {
  const { status, kropp } = await kör({ DB: dbStub(), ...ALLA });
  assert.equal(status, 503);
  assert.equal(kropp.ok, false);
  assert.equal(kropp.checks.ai_nyckel, false);
  assert.match(kropp.problem.join(" "), /OPENROUTER_KEY/);
});

test("databas som inte svarar ger 503", async () => {
  const { status, kropp } = await kör({ DB: dbStub({ svarar: false }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 503);
  assert.equal(kropp.checks.databas, false);
  assert.match(kropp.problem.join(" "), /D1 svarar inte/);
});

test("färskt kreditfel ger 503 — det löser sig inte av sig självt", async () => {
  const nyss = NU - 2 * 60 * 1000;
  const { status, kropp } = await kör({ DB: dbStub({ senasteKreditfel: nyss }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 503);
  assert.equal(kropp.checks.ai_kredit, false);
  assert.match(kropp.problem.join(" "), /402|krediten/i);
});

test("gammalt kreditfel ger 200 — påfylld kredit ska synas snabbt", async () => {
  // Motprovet mot testet ovan: en rutt som stannar röd efter att felet är löst
  // gör att larmet ignoreras nästa gång.
  const igår = NU - 3 * 60 * 60 * 1000;
  const { status, kropp } = await kör({ DB: dbStub({ senasteKreditfel: igår }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 200);
  assert.equal(kropp.checks.ai_kredit, true);
});

test("saknad ai_errors-tabell gör inte rutten röd, men syns", async () => {
  // Migration 0006 kanske inte är körd. Att gå röd då hade larmat om ett
  // driftläge som inte drabbar en enda kund.
  const { status, kropp } = await kör({ DB: dbStub({ tabellSaknas: true }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 200);
  assert.equal(kropp.checks.ai_kredit, null, "okänt, inte friskt");
});

test("svaret läcker inga siffror och ingen kunddata", async () => {
  // Rutten är öppen — en uptime-vakt kan inte logga in. Antal anrop per dygn är
  // affärsinformation, och kroppen får inte bli en publik mätare.
  const { kropp } = await kör({ DB: dbStub(), OPENROUTER_KEY: "sk-or-test", ...ALLA });
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

// ── DR6 och DR9 (2026-09-26) ───────────────────────────────────────────────
function dbMed({ mejlfel = null, budget = null } = {}) {
  return {
    prepare: (sql) => ({
      first: async () => (/SELECT 1/.test(sql) ? { ok: 1 } : null),
      bind: () => ({
        first: async () => {
          if (/code = 'mail'/.test(sql)) return mejlfel ? { last_at: mejlfel } : null;
          if (/ai_errors/.test(sql)) return null;
          if (/FROM ai_budget/.test(sql)) return budget;
          return null;
        },
      }),
    }),
  };
}

test("DR6: en saknad driftsecret gör tjänsten ofrisk och nämns vid namn — aldrig värdet", async () => {
  const env = { DB: dbMed(), OPENROUTER_KEY: "sk-or-test", ...ALLA };
  delete env.MAIL_API_KEY;
  const { status, kropp } = await kör(env);
  assert.equal(status, 503);
  assert.equal(kropp.checks.hemligheter, false);
  assert.match(kropp.problem.join(" "), /MAIL_API_KEY saknas/);
  assert.ok(!JSON.stringify(kropp).includes("sk-or-test"), "ett värde läckte ut i svaret");
});

test("DR6: ett färskt mejlfel gör rutten röd — inloggningen är död även om allt annat lever", async () => {
  const { status, kropp } = await kör({ DB: dbMed({ mejlfel: NU - 60_000 }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 503);
  assert.equal(kropp.checks.mejl, false);
});

test("DR6: sendMail bokför ett misslyckat utskick som koden mail", async () => {
  const källa = (await import("node:fs")).readFileSync("functions/api/auth/_lib.js", "utf8");
  const i = källa.indexOf("async function sendMail(");
  const kropp = källa.slice(i, källa.indexOf("\n}\n", i));
  assert.equal((kropp.match(/await bokförMejlfel\(env\)/g) || []).length, 2, "båda felgrenarna ska bokföra");
});

test("DR9: dygnets AI-kostnad över larmnivån gör rutten röd", async () => {
  // 30 miljoner ut-tokens = $36 ≈ 378 kr, över 150.
  const { status, kropp } = await kör({ DB: dbMed({ budget: { input_tok: 0, output_tok: 30e6 } }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 503);
  assert.equal(kropp.checks.ai_kostnad, false);
});

test("DR9: en normal dag är grön", async () => {
  const { status, kropp } = await kör({ DB: dbMed({ budget: { input_tok: 500_000, output_tok: 200_000 } }), OPENROUTER_KEY: "sk-or-test", ...ALLA });
  assert.equal(status, 200);
  assert.equal(kropp.checks.ai_kostnad, true);
});
