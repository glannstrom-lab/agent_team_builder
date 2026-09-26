// Modelljämförelse: samma byggsteg och samma portalanrop mot en annan modell,
// direkt via OpenRouter (produktionen tvingar gpt-oss, se functions/api/ai.js).
//
//   node jamfor.mjs bygg <kund> <modell>     hela bygget med produktionens prompter, tak och schema
//   node jamfor.mjs svar <kund> <modell>     spelar om varje rad i <kund>/anrop.jsonl mot modellen
//
// Nyckeln läses ur ../../.dev.vars (OPENROUTER_KEY) och skrivs aldrig ut.
// Utdata: <kund>/<modell-kortnamn>/

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HÄR = dirname(fileURLToPath(import.meta.url));
const ROT = join(HÄR, "..", "..");
const [cmd, kund, modell] = process.argv.slice(2);
if (!cmd || !kund || !modell) { console.error("node jamfor.mjs bygg|svar <kund> <modell>"); process.exit(1); }
const KDIR = join(HÄR, kund);
const UT = join(KDIR, modell.replace(/^.*\//, "").replace(/[^a-z0-9.-]/gi, "_"));
mkdirSync(UT, { recursive: true });

const NYCKEL = (process.env.SIM_KEY ||
  (readFileSync(join(ROT, ".dev.vars"), "utf8").match(/^OPENROUTER_KEY=(.*)$/m) || [])[1] || "").replace(/["\r\s]/g, "");
if (NYCKEL.length < 30) { console.error("ingen giltig OPENROUTER_KEY i .dev.vars"); process.exit(1); }

const läs = (p) => readFileSync(p, "utf8");
const läsJson = (p, d) => (existsSync(p) ? JSON.parse(läs(p)) : d);
const skrivJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2), "utf8");

// ── byggarens kontroller, ur källan (samma som sim.mjs) ────────────────────
const BUILDER = läs(join(ROT, "builder/builder.js"));
const klipp = (a, b) => { const i = BUILDER.indexOf(a), j = BUILDER.indexOf(b, i); return BUILDER.slice(i, j); };
const DELAD = (() => { const i = BUILDER.indexOf("⟦DELAD-START⟧"), j = BUILDER.indexOf("⟦DELAD-SLUT⟧");
  return BUILDER.slice(BUILDER.indexOf("\n", i) + 1, BUILDER.lastIndexOf("\n", j) + 1); })();
const B = new Function(DELAD + "\n" + klipp("const OBLIGATORISKA_SEKTIONER", "// TEAM_SCHEMA bor i") + "\n" +
  klipp("function parseTeamJson", "async function retryStructure") + "\n" + klipp("function rensaSkalning", "\n}\n") + "\n}\n" +
  klipp("function skalningsTak", "// Sammanställningssteget är långt") +
  "return { kontrolleraSystemprompter, parseTeamJson, rensaSkalning, skalningsTak, hållSkalningsTak };")();

// ── produktionens byggmodul, med prompterna från disk ─────────────────────
const build = await import(pathToFileURL(join(ROT, "functions/api/_build.js")).href);
const env = { ASSETS: { fetch: async (req) => {
  const p = join(ROT, decodeURIComponent(new URL(req.url).pathname));
  return existsSync(p) ? new Response(läs(p)) : new Response("", { status: 404 });
} } };
const request = new Request("https://mittaiteam.se/api/ai");

async function anropa({ system, messages, maxTokens, schema }) {
  const payload = {
    model: modell, max_tokens: maxTokens, stream: false,
    usage: { include: true },
    ...(schema ? { response_format: { type: "json_schema", json_schema: { name: "team", strict: true, schema } },
      provider: { require_parameters: true } } : {}),
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
  };
  for (let f = 0; ; f++) {
    const t0 = Date.now();
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { authorization: "Bearer " + NYCKEL, "content-type": "application/json",
        "http-referer": "https://mittaiteam.se", "x-title": "Mitt AI-team (simulering)" },
      body: JSON.stringify(payload),
    });
    const txt = await res.text();
    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && f < 5) { await new Promise((r) => setTimeout(r, 5000 * (f + 1))); continue; }
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
    }
    const j = JSON.parse(txt);
    const c = j.choices?.[0];
    return { text: c?.message?.content || "", finish: c?.finish_reason, usage: j.usage, sek: (Date.now() - t0) / 1000,
      provider: j.provider, kostnad: j.usage?.cost ?? null };
  }
}

// ── bygget ─────────────────────────────────────────────────────────────────
async function bygg() {
  const meta = läsJson(join(KDIR, "meta.json"), {});
  let ib = läs(join(KDIR, "intake.md")).trim();
  const svar = join(KDIR, "clarify-svar.md");
  if (existsSync(svar)) ib = ib.replace(/```\s*$/, "\n## Kompletterande svar (följdfrågor)\n" + läs(svar).trim() + "\n```");
  const body = { mode: meta.mode, workstyle: meta.workstyle, person: !!meta.person, survey: false };
  const r = { modell, steg: [] };
  async function steg(namn, user) {
    const s = await build.byggSteg(env, request, namn, body);
    const out = await anropa({ system: s.system, messages: [{ role: "user", content: user }], maxTokens: s.maxTokens, schema: s.schema });
    r.steg.push({ namn, sek: out.sek, tecken: out.text.length, finish: out.finish, kostnad: out.kostnad,
      in: out.usage?.prompt_tokens, ut: out.usage?.completion_tokens, resonemang: out.usage?.completion_tokens_details?.reasoning_tokens, provider: out.provider });
    console.error(`  ${namn}: ${out.sek.toFixed(1)} s, ${out.text.length} tecken, finish=${out.finish}, $${out.kostnad}`);
    return out.text;
  }
  r.clarify = await steg("clarify", ib);
  r.research = await steg("research", ib);
  const sk = await steg("scale", `INTAKE:\n${ib}\n\nRESEARCH-DOKUMENT:\n${r.research}`);
  const ii = läs(join(KDIR, "intake.md"));
  r.scaling = B.hållSkalningsTak(B.rensaSkalning(sk) || sk, B.skalningsTak({ audience: meta.person ? "person" : "business",
    mode: meta.mode, size: (ii.match(/^storlek:\s*(\S+)/m) || [])[1], maturity: (ii.match(/^ai_mognad:\s*(\S+)/m) || [])[1] }));
  r.proposal = await steg("proposal", `INTAKE:\n${ib}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}`);
  if (meta.mode === "ai-consultant") r.firstproject = await steg("firstproject", `INTAKE:\n${ib}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nFÖRSLAG:\n${r.proposal}`);
  const fp = r.firstproject ? `\n\nFÖRSTA PROJEKTET:\n${r.firstproject}` : "";
  const user = `RESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}\n\nFÖRSLAG (agenterna):\n${r.proposal}${fp}\n\nSammanställ som JSON.`;
  r.structure = [];
  for (let i = 0; i < 3; i++) {
    const raw = await steg("structure", user);
    let team = null, fel = null;
    try { team = B.parseTeamJson(raw); B.kontrolleraSystemprompter(team); } catch (e) { fel = e.message; }
    r.structure.push({ ok: !fel, fel });
    if (team) { team.entryAgent = (team.agents.find((a) => a.id === "vd-assistent") || team.agents[0]).id; skrivJson(join(UT, "team.json"), team); }
    if (!fel) break;
    console.error("  kontrollen föll: " + fel.split("\n").slice(2, 5).join(" | "));
  }
  r.totalKostnad = r.steg.reduce((n, s) => n + (s.kostnad || 0), 0);
  r.totalSek = r.steg.reduce((n, s) => n + s.sek, 0);
  skrivJson(join(UT, "bygge.json"), r);
  console.log(`${kund} / ${modell}: ${r.structure.filter((s) => s.ok).length ? "GODKÄNT" : "UNDERKÄNT"} efter ${r.structure.length} försök, ${r.totalSek.toFixed(0)} s, $${r.totalKostnad.toFixed(4)}`);
}

// ── portalanropen, omspelade ───────────────────────────────────────────────
async function svar() {
  const rader = läs(join(KDIR, "anrop.jsonl")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const utFil = join(UT, "svar.jsonl");
  const klara = new Set((existsSync(utFil) ? läs(utFil).split("\n").filter(Boolean) : []).map((l) => JSON.parse(l).i));
  let i = 0;
  async function arbetare() {
    while (i < rader.length) {
      const n = i++;
      if (klara.has(n)) continue;
      const a = rader[n];
      const out = await anropa({ system: a.system, messages: a.messages, maxTokens: a.maxTokens });
      appendFileSync(utFil, JSON.stringify({ i: n, svar: out.text, finish: out.finish, sek: out.sek, kostnad: out.kostnad,
        in: out.usage?.prompt_tokens, ut: out.usage?.completion_tokens }) + "\n", "utf8");
      console.error(`  [${n}] ${out.sek.toFixed(1)} s, ${out.text.length} tecken, $${out.kostnad}`);
    }
  }
  await Promise.all([arbetare(), arbetare(), arbetare()]);
  console.log(`${kund}: ${rader.length} anrop omspelade mot ${modell}`);
}

try {
  if (cmd === "bygg") await bygg();
  else if (cmd === "svar") await svar();
  else throw new Error("okänt kommando");
} catch (e) { console.error("FEL: " + e.message); process.exit(2); }
