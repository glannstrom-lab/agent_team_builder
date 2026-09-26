// Simulering 2026-09: fyra kunder bygger ett team och använder det en månad —
// mot PRODUKTIONEN (mittaiteam.se), med samma byggsteg, samma systemprompter
// och samma kontextfönster som Buildern och portalen skickar.
//
// Kommandon (kund = katalognamn under testoutput/sim-2026-09/):
//   node sim.mjs clarify   <kund>                 följdfrågorna (steget "clarify")
//   node sim.mjs build     <kund>                 research → scale → proposal → (firstproject) → structure
//   node sim.mjs provision <kund>                 lägger upp teamet som betalt i skarpa D1 + sessionsrad
//   node sim.mjs team      <kund>                 visar agenter, startförslag och rutiner
//   node sim.mjs datum     <kund> <ÅÅÅÅ-MM-DD>    sätter simulerat datum (används av veckostart)
//   node sim.mjs chat      <kund> <agentId> <fil|-> fråga till en agent (fil med texten, eller - för stdin)
//   node sim.mjs veckostart <kund>
//   node sim.mjs mote      <kund> <typ> <id,id,..> <fil|->   typ: whats-next | review | improve
//   node sim.mjs minne     <kund> <fil|->          ERSÄTTER företagsminnet
//   node sim.mjs underlag  <kund> <titel> <fil>    lägger till ett underlag (påslaget)
//
// Sessionstoken och cookie ligger i SCRATCH (utanför repot), aldrig här.

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const HÄR = dirname(fileURLToPath(import.meta.url));
const ROT = join(HÄR, "..", "..");
const BAS = process.env.SIM_BAS || "https://mittaiteam.se";
const SCRATCH = process.env.SIM_SCRATCH ||
  "C:/Users/Mikael/AppData/Local/Temp/claude/C--Users-Mikael-Desktop-AI-PROJEKT-agent-team-builder/889a957f-1871-47a2-b699-0a89b2b6a5a0/scratchpad/sim";

const [cmd, kund, ...rest] = process.argv.slice(2);
if (!cmd || !kund) { console.error("se kommentaren överst i sim.mjs"); process.exit(1); }
const KDIR = join(HÄR, kund);
if (!existsSync(KDIR)) { console.error("ingen kund: " + KDIR); process.exit(1); }
mkdirSync(SCRATCH, { recursive: true });

const läs = (p) => readFileSync(p, "utf8");
const läsJson = (p, d) => (existsSync(p) ? JSON.parse(läs(p)) : d);
const skrivJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2), "utf8");
const textArg = (a) => (a === "-" ? readFileSync(0, "utf8") : existsSync(a) ? läs(a) : a);

// ── byggarens egna funktioner, ur källan (samma grepp som test/teams.mjs) ──
const BUILDER = läs(join(ROT, "builder/builder.js"));
function klipp(start, slut) {
  const i = BUILDER.indexOf(start), j = BUILDER.indexOf(slut, i);
  if (i < 0 || j < 0) throw new Error("hittade inte " + start);
  return BUILDER.slice(i, j);
}
const DELAD = (() => {
  const i = BUILDER.indexOf("⟦DELAD-START⟧"), j = BUILDER.indexOf("⟦DELAD-SLUT⟧");
  return BUILDER.slice(BUILDER.indexOf("\n", i) + 1, BUILDER.lastIndexOf("\n", j) + 1);
})();
const B = new Function(
  DELAD + "\n" +
  klipp("const OBLIGATORISKA_SEKTIONER", "// TEAM_SCHEMA bor i") + "\n" +
  klipp("function parseTeamJson", "async function retryStructure") + "\n" +
  klipp("function rensaSkalning", "\n}\n") + "\n}\n" +
  klipp("function skalningsTak", "// Sammanställningssteget är långt") +
  "return { kontrolleraSystemprompter, parseTeamJson, rensaSkalning, skalningsTak, hållSkalningsTak, stegBrister, teamBrister, skalningsAntal, trimmaTeam };"
)();

// ── portalens egna funktioner (systemFor + contextFor), ur källan ──────────
const APP = läs(join(ROT, "portal/app.js"));
function klippApp(start, slut) {
  const i = APP.indexOf(start), j = APP.indexOf(slut, i);
  if (i < 0 || j < 0) throw new Error("hittade inte " + start + " i app.js");
  return APP.slice(i, j);
}
const P = (st) => new Function("loadMemory", "loadDocs", "state", "team",
  klippApp("const DOC_BUDGET", "// ---------- helpers ----------") +
  "\nreturn { systemFor, contextFor };"
)(() => st.memory || "", () => st.docs || [], { history: st.history }, team);

// ── transport ────────────────────────────────────────────────────────────
const sessionFil = join(SCRATCH, kund + ".session.json");
async function anropa(body, { cookie } = {}) {
  for (let försök = 0; ; försök++) {
    const res = await fetch(BAS + "/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie: "atb_session=" + cookie } : {}) },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const txt = await res.text();
      let ut = "", finish = null, usage = null;
      for (const rad of txt.split("\n")) {
        const t = rad.trim();
        if (!t.startsWith("data:")) continue;
        const d = t.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const e = JSON.parse(d);
          const c = e.choices && e.choices[0];
          if (c && c.delta && typeof c.delta.content === "string") ut += c.delta.content;
          if (c && c.finish_reason) finish = c.finish_reason;
          if (e.usage) usage = e.usage;
          if (e.error) throw new Error(e.error.message || "strömningsfel");
        } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
      }
      if (!ut && txt.trim().startsWith("{")) {
        // icke-strömmat svar
        try { const j = JSON.parse(txt); ut = j.choices?.[0]?.message?.content || ""; usage = j.usage || usage; } catch {}
      }
      return { text: ut, finish, usage };
    }
    const fel = await res.text();
    if ((res.status === 429 || res.status >= 500) && försök < 25) {
      const v = res.status === 429 ? 60000 : 5000 * (försök + 1);
      console.error(`  … ${res.status}, väntar ${v / 1000} s (${fel.slice(0, 120)})`);
      await new Promise((r) => setTimeout(r, v));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${fel.slice(0, 400)}`);
  }
}

// ── byggsteg ─────────────────────────────────────────────────────────────
const meta = läsJson(join(KDIR, "meta.json"), {});
function intakeBlock() {
  let b = läs(join(KDIR, "intake.md")).trim();
  const svar = join(KDIR, "clarify-svar.md");
  if (existsSync(svar)) b = b.replace(/```\s*$/, "\n## Kompletterande svar (följdfrågor)\n" + läs(svar).trim() + "\n```");
  return b;
}
// Samma fält som Builderns intake-objekt, för skalningstaket (KA10).
const skalIntake = () => {
  const ii = läs(join(KDIR, "intake.md"));
  return { audience: meta.person ? "person" : "business", mode: meta.mode,
    size: (ii.match(/^storlek:\s*(\S+)/m) || [])[1], maturity: (ii.match(/^ai_mognad:\s*(\S+)/m) || [])[1] };
};
const stepOpts = () => ({ mode: meta.mode || "team-builder", workstyle: meta.workstyle || "classic", person: !!meta.person, survey: false });
async function steg(step, user) {
  const t0 = Date.now();
  const r = await anropa({ step, ...stepOpts(), messages: [{ role: "user", content: user }] });
  console.error(`  ${step}: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${r.text.length} tecken, finish=${r.finish}`);
  return r;
}

// Samma stegkontroll som Buildern (stegBrister ur DELAD-blocket, kravSlut ur
// atb-claude.js): ett avbrutet svar eller ett svar med brister görs om, högst
// tre gånger. Simuleringen ska bygga som kunden bygger.
async function stegMedKontroll(step, user, n) {
  for (let f = 1; f <= 3; f++) {
    let r;
    // En felram i strömmen (tidsgräns, avbrott) går att försöka om, som i
    // Buildern (atb-claude.js sätter försökIgen på den).
    try { r = await steg(step, user); } catch (e) { console.error(`  ${step} bröts (försök ${f}): ${e.message}`); continue; }
    const brister = r.finish !== "stop" ? ["svaret bröts (finish=" + r.finish + ")"] : B.stegBrister(step, r.text, n);
    if (!brister.length) return r.text;
    console.error(`  ${step} underkänt (försök ${f}): ${brister.join("; ")}`);
  }
  throw new Error(step + " blev inte komplett efter tre försök");
}

async function clarify() {
  const ut = (await steg("clarify", intakeBlock())).text;
  writeFileSync(join(KDIR, "clarify-fragor.md"), ut, "utf8");
  console.log(ut);
}

async function build() {
  const rFil = join(KDIR, "bygge.json");
  const r = läsJson(rFil, {});
  const ib = intakeBlock();
  const spara = () => skrivJson(rFil, r);
  if (!r.research) { r.research = await stegMedKontroll("research", ib); spara(); }
  if (!r.scaling) {
    const s = await stegMedKontroll("scale", `INTAKE:\n${ib}\n\nRESEARCH-DOKUMENT:\n${r.research}`);
    r.scaling_raw = s; r.scaling = B.hållSkalningsTak(B.rensaSkalning(s) || s, B.skalningsTak(skalIntake())); spara();
  }
  const n = B.skalningsAntal(r.scaling);
  if (!r.proposal) { r.proposal = await stegMedKontroll("proposal", `INTAKE:\n${ib}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}`, n); spara(); }
  if (meta.mode === "ai-consultant" && !r.firstproject) {
    r.firstproject = await stegMedKontroll("firstproject", `INTAKE:\n${ib}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nFÖRSLAG:\n${r.proposal}`); spara();
  }
  const fp = r.firstproject ? `\n\nFÖRSTA PROJEKTET:\n${r.firstproject}` : "";
  // Samma meddelande som structureTeam() i builder.js sedan KA19.
  const user = `RESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}\n\nFÖRSLAG (agenterna):\n${r.proposal}${fp}\n\n` +
    (n ? `ANTAL: teamet ska ha exakt ${n} agenter, VD och VD-assistent inräknade. Har förslaget fler: slå ihop de minst distinkta eller flytta dem till rejected med skäl.\n\n` : "") +
    `Sammanställ som JSON.`;
  r.structureForsok = r.structureForsok || [];
  const TILLÅT = process.argv.includes("--tillat");
  for (let i = 0; i < (TILLÅT ? 1 : 3); i++) {
    const svar = await steg("structure", user);
    const raw = svar.text;
    let team, fel = null;
    try {
      if (svar.finish !== "stop") throw new Error("svaret bröts (finish=" + svar.finish + ")");
      team = B.parseTeamJson(raw);
      if (!team || !Array.isArray(team.agents) || !team.agents.length) throw new Error("saknar agenter");
      const flyttade = B.trimmaTeam(team, n);
      if (flyttade.length) console.error("  trimmat till skalningsbeslutet: " + flyttade.join(", "));
      const tb = B.teamBrister(team, n);
      if (tb.length) throw new Error(tb.join("; "));
      B.kontrolleraSystemprompter(team);
    } catch (e) { fel = e.message; }
    r.structureForsok.push({ ok: !fel, fel, tecken: raw.length, raw });
    spara();
    if (fel) { console.error("  sammanställningen föll: " + fel.slice(0, 300)); if (!TILLÅT) continue; }
    if (fel && !team) throw new Error("ogiltig JSON: " + fel);
    if (fel) { team._kontrollFel = fel; console.error("  --tillat: sparar teamet trots kontrollen"); }
    team.workstyle = meta.workstyle === "coach" ? "coach" : null;
    team.entryAgent = (team.agents.find((a) => a.id === "vd-assistent") || team.agents[0]).id;
    skrivJson(join(KDIR, "team.json"), team);
    console.log(`team klart på försök ${i + 1}: ${team.agents.map((a) => a.id).join(", ")}`);
    return;
  }
  throw new Error("sammanställningen föll tre gånger");
}

// ── provisionering i skarpa D1 ───────────────────────────────────────────
function provision() {
  const team = läsJson(join(KDIR, "team.json"));
  if (!team) throw new Error("bygg först");
  const ALF = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const slug = "sim" + Array.from(randomBytes(24)).map((b) => ALF[b % 62]).join("");
  const email = `sim-${kund}@simulering.invalid`;
  const nu = Date.now();
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  const uid = "usr_" + randomBytes(12).toString("hex");
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = [
    `INSERT INTO teams (slug, config, tier, plan, created_at, plan_changed_at) VALUES (${q(slug)}, ${q(JSON.stringify(team))}, 'self-serve', 'standard', ${nu}, ${nu});`,
    `INSERT INTO users (id, email, created_at) VALUES (${q(uid)}, ${q(email)}, ${nu}) ON CONFLICT(email) DO NOTHING;`,
    `INSERT INTO team_access (team_slug, user_id, role, created_at) SELECT ${q(slug)}, id, 'owner', ${nu} FROM users WHERE email = ${q(email)};`,
    `INSERT INTO sessions (token_hash, user_id, expires_at, created_at, user_agent) SELECT ${q(hash)}, id, ${nu + 30 * 86400000}, ${nu}, 'simulering-2026-09' FROM users WHERE email = ${q(email)};`,
  ].join("\n");
  const fil = join(SCRATCH, kund + ".provision.sql");
  writeFileSync(fil, sql + "\n", "utf8");
  const out = execFileSync("npx", ["wrangler@4.123.0", "d1", "execute", "agent-team-builder", "--remote", "--file", fil, "-y"],
    { cwd: ROT, encoding: "utf8", shell: true });
  console.error(out.split("\n").slice(-6).join("\n"));
  skrivJson(sessionFil, { slug, token, email });
  const st = läsJson(join(KDIR, "state.json"), {});
  st.slug = slug; skrivJson(join(KDIR, "state.json"), st);
  console.log("upplagd: " + slug);
}

// ── portalen ─────────────────────────────────────────────────────────────
const stFil = join(KDIR, "state.json");
const st = läsJson(stFil, {});
st.history = st.history || {}; st.memory = st.memory || ""; st.docs = st.docs || [];
const team = läsJson(join(KDIR, "team.json"), null);
const agentById = (id) => team && team.agents.find((a) => a.id === id);
const logg = (rubrik, text) => appendFileSync(join(KDIR, "transkript.md"), `\n\n## ${rubrik}\n\n${text}\n`, "utf8");

async function portal(system, messages, maxTokens, webb = false) {
  const s = läsJson(sessionFil);
  if (!s) throw new Error("provisionera först");
  const t0 = Date.now();
  const r = await anropa({ system, messages, maxTokens, json: false, schema: null, team: s.slug, ...(webb ? { webb: true } : {}) }, { cookie: s.token });
  const sek = (Date.now() - t0) / 1000;
  st.calls = (st.calls || []);
  st.calls.push({ at: st.datum || null, sek, finish: r.finish, in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens, tecken: r.text.length });
  appendFileSync(join(KDIR, "anrop.jsonl"), JSON.stringify({ datum: st.datum || null, system, messages, maxTokens, svar: r.text, finish: r.finish, usage: r.usage, sek }) + "\n", "utf8");
  return r;
}

async function chat(agentId, text, rubrik, webb = false) {
  const a = agentById(agentId);
  if (!a) throw new Error("okänd agent " + agentId + " — finns: " + team.agents.map((x) => x.id).join(", "));
  const { systemFor, contextFor } = P(st);
  const hist = st.history[agentId] = st.history[agentId] || [];
  hist.push({ role: "user", content: text, at: Date.now(), datum: st.datum });
  const r = await portal(systemFor(a), contextFor(hist), 4096, webb);
  hist.push({ role: "assistant", content: r.text, datum: st.datum });
  skrivJson(stFil, st);
  logg(`${st.datum || ""} · ${rubrik || "Fråga"} → ${a.name} (${agentId})`, `**Kunden:**\n\n${text}\n\n**${a.name}:**\n\n${r.text}${r.finish === "length" ? "\n\n[AVKLIPPT — maxTokens]" : ""}`);
  console.log(r.text);
  if (r.finish === "length") console.log("\n[AVKLIPPT — svaret slog i maxTokens]");
}

const DAGAR = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const dayName = (d) => DAGAR[d % 7];
// Speglar startWeek() i portal/app.js sedan RE7 (2026-09-26): förra veckans
// veckostart och årshjulets datum de närmaste tre veckorna följer med.
// (Myndighetsdatumen tas inte med — ingen simulerad kund har slagit på dem.)
function veckostartFörra() {
  const h = st.history[team.entryAgent] || [];
  for (let i = h.length - 2; i >= 0; i--) {
    const q = h[i], a = h[i + 1];
    if (q && q.role === "user" && /^Veckostart!/.test(q.content || "") && a && a.role === "assistant" && a.content) {
      return { när: a.datum || "förra gången", text: a.content.replace(/\s+/g, " ").slice(0, 700) + (a.content.length > 700 ? "…" : "") };
    }
  }
  return null;
}
function kommandeDatum(now, dagar) {
  const ut = [];
  (team.seasons || []).forEach((s) => {
    if (!s || !s.label || !s.month) return;
    let when = new Date(now.getFullYear(), s.month - 1, s.day || 1);
    if (when < now && (now - when) / 86400000 > 1) when = new Date(now.getFullYear() + 1, s.month - 1, s.day || 1);
    const d = Math.ceil((when - now) / 86400000);
    if (d >= 0 && d <= dagar) ut.push({ d, t: `${s.label} (${when.toLocaleDateString("sv-SE")}, om ${d} dagar)` });
  });
  return ut.sort((a, b) => a.d - b.d).map((x) => x.t);
}
async function veckostart() {
  const now = st.datum ? new Date(st.datum + "T08:00:00") : new Date();
  const rlist = (team.routines || []).map((r) => `- ${r.label}${r.day ? ` (${dayName(r.day)})` : ""}`).join("\n");
  const förra = veckostartFörra();
  const datum = kommandeDatum(now, 21);
  const text = `Veckostart! Det är ${DAGAR[now.getDay()]} den ${now.toLocaleDateString("sv-SE")}.` +
    (rlist ? `\nVåra stående rutiner:\n${rlist}` : "") +
    (datum.length ? `\nDatum som närmar sig (nästa tre veckor):\n${datum.map((d) => `- ${d}`).join("\n")}` : "") +
    (förra ? `\n\nFörra veckostarten (${förra.när}) sa i korthet:\n${förra.text}` : "") +
    `\n\nGe mig en kort veckostart: 1) de tre viktigaste sakerna att fokusera på den här veckan, med motivering, 2) vilken agent i teamet som hjälper mig med varje, 3) vad du behöver veta från mig. ` +
    `Utgå från företagsminnet och datumen ovan.` +
    (förra ? ` Upprepa inte förra veckans lista: säg kort vad som borde ha hänt sedan dess och vad som är nytt den här veckan.` : "") +
    ` Kort och konkret.`;
  await chat(team.entryAgent, text, "⭐ Veckostart");
}

// Knappen "🔎 Kontrollera mot källan" — samma text som portal/app.js skickar.
async function kontroll(agentId) {
  const h = st.history[agentId] || [];
  const sista = [...h].reverse().find((m) => m.role === "assistant");
  if (!sista) throw new Error("inget svar att kontrollera hos " + agentId);
  // Samma två steg som knappen i portal/app.js sedan KA21: sökfrågan
  // formuleras först (instruktionen läses ur källan), sedan kontrollText().
  const src = (namn) => { const i = APP.indexOf(`function ${namn}(`); return APP.slice(i, APP.indexOf("\n}\n", i) + 2); };
  const kontrollText = new Function(src("kontrollText") + "; return kontrollText;")();
  const sökSystem = (APP.slice(APP.indexOf("async function sökfrågaFör(")).match(/system: ("[^"]+" \+\s*"[^"]+")/) || [])[1];
  let fråga = sista.content.replace(/\s+/g, " ").slice(0, 160);
  try {
    const r = await portal(new Function("return " + sökSystem)(), [{ role: "user", content: sista.content.slice(0, 3000) }], 60);
    const rad = (r.text || "").split("\n").map((s) => s.trim()).find(Boolean) || "";
    if (rad.length >= 8) fråga = rad.replace(/^["'”]+|["'”]+$/g, "").slice(0, 160);
  } catch (_) { /* reserv: svarets början, som i portalen */ }
  console.error("  sökfråga: " + fråga);
  await chat(agentId, kontrollText(fråga, sista.content), "🔎 Kontrollera mot källan", true);
}

// Knappen "✗ Blev det fel?" — rättelsen blir en rad i företagsminnet och ett nytt svar begärs.
async function rättelse(agentId, fel) {
  const a = agentById(agentId);
  const t = String(fel || "").replace(/\s+/g, " ").trim().slice(0, 400);
  if (!t) throw new Error("tom rättelse");
  st.memory = (st.memory.trim() ? st.memory.trim() + "\n" : "") + `- Rättelse ${st.datum || ""} (${a ? a.name : agentId}): ${t}`;
  skrivJson(stFil, st);
  logg(`${st.datum || ""} · ✗ Rättelse sparad i minnet (${agentId})`, t);
  await chat(agentId, `Ditt förra svar blev fel. Rättelse: ${String(fel).trim()}\n\nGör om svaret med rättelsen. Rättelsen står nu också i företagsminnet.`, "✗ Rättat — nytt svar");
}

const MÖTEN = {
  "whats-next": { label: "Vad gör vi härnäst?", output: "En rangordnad lista med MAX TRE prioriteringar. För varje: vad, varför just nu, första konkreta steg och vilken agent som äger det. Avsluta med vad som medvetet får vänta." },
  review: { label: "Projektgranskning", output: "En rangordnad lista över de viktigaste fynden (max fem), vart och ett med konsekvens och rekommenderad åtgärd. Avsluta med en samlad rekommendation i 2–3 meningar." },
  improve: { label: "Förbättra något specifikt", output: "Numrerade, handlingsbara förbättringsförslag (max fem). Varje förslag ska kunna påbörjas idag och ange första steget. Ingen filosofi, inga abstraktioner." },
};
async function möte(typId, ids, focus) {
  const type = MÖTEN[typId]; if (!type) throw new Error("mötestyp: " + Object.keys(MÖTEN).join(" | "));
  const { systemFor } = P(st);
  const persp = [];
  for (const id of ids) {
    const a = agentById(id); if (!a) throw new Error("okänd agent " + id);
    const r = await portal(systemFor(a), [{ role: "user", content: `MÖTE — ${type.label}.\nFråga/fokus: ${focus}\n\nGe DITT perspektiv utifrån din roll. Max 120 ord. Var konkret och våga ha en åsikt — vad är viktigast och varför, och vad kan vänta? Ingen artighetsprosa.` }], 600);
    persp.push({ name: a.name, tagline: a.tagline || "", text: r.text });
  }
  const block = persp.map((p) => `### ${p.name}${p.tagline ? ` (${p.tagline})` : ""}\n${p.text}`).join("\n\n");
  const entry = agentById(team.entryAgent);
  const r = await portal(systemFor(entry), [{ role: "user", content: `Du leder ett möte av typen "${type.label}".\nFråga/fokus: ${focus}\n\nDeltagarnas oberoende perspektiv:\n\n${block}\n\nSAMMANSTÄLL TILL EN MÖTESANTECKNING. Börja med raden "## 🤝 Mötesanteckning — ${type.label}". Format därefter:\n${type.output}\n\nOm perspektiven krockar: lyft krocken öppet och ta ställning. Om frågan egentligen inte behövde ett möte, säg det ärligt.` }], 2000);
  const hist = st.history[team.entryAgent] = st.history[team.entryAgent] || [];
  hist.push({ role: "assistant", content: r.text });
  skrivJson(stFil, st);
  logg(`${st.datum || ""} · 🤝 Möte (${type.label}) — ${ids.join(", ")}`, `**Fokus:** ${focus}\n\n${block}\n\n---\n\n${r.text}`);
  console.log(block + "\n\n---\n\n" + r.text);
}

function visaTeam() {
  console.log(`${team.name || ""} — ingång: ${team.entryAgent}\n`);
  for (const a of team.agents) {
    console.log(`■ ${a.id} — ${a.name}${a.tagline ? " · " + a.tagline : ""}`);
    if (a.helps) console.log("  kan: " + a.helps);
    for (const s of a.starters || []) console.log("  • " + (s.label || s.text || s));
  }
  console.log("\nRutiner:");
  (team.routines || []).forEach((r, i) => console.log(`  [${i}] ${r.label} (${r.agentId}, dag ${r.day}, ${r.timeEstimate} min)\n      ${r.prompt}`));
  if (team.seasons?.length) { console.log("\nÅrshjul:"); team.seasons.forEach((s) => console.log(`  ${s.month}/${s.day ?? "–"} ${s.label} (${s.agentId})`)); }
  if (team.rejected?.length) { console.log("\nAvvisade:"); team.rejected.forEach((r) => console.log("  ✗ " + (r.name || r.role || JSON.stringify(r)).slice(0, 140))); }
  if (team.firstProject) console.log("\nFörsta projektet: " + JSON.stringify(team.firstProject).slice(0, 600));
}

try {
  if (cmd === "clarify") await clarify();
  else if (cmd === "build") await build();
  else if (cmd === "provision") provision();
  else if (cmd === "team") visaTeam();
  else if (cmd === "datum") { st.datum = rest[0]; skrivJson(stFil, st); console.log("datum: " + st.datum); }
  else if (cmd === "chat") await chat(rest[0], textArg(rest[1]));
  else if (cmd === "veckostart") await veckostart();
  else if (cmd === "kontroll") await kontroll(rest[0]);
  else if (cmd === "rattelse") await rättelse(rest[0], textArg(rest[1]));
  else if (cmd === "mote") await möte(rest[0], rest[1].split(","), textArg(rest[2]));
  else if (cmd === "minne") { st.memory = textArg(rest[0]); skrivJson(stFil, st); logg(`${st.datum || ""} · 🧠 Företagsminnet uppdaterat`, st.memory); console.log("minnet sparat (" + st.memory.length + " tecken)"); }
  else if (cmd === "underlag") { st.docs.push({ title: rest[0], text: textArg(rest[1]), on: true }); skrivJson(stFil, st); logg(`${st.datum || ""} · 📎 Underlag: ${rest[0]}`, "(" + st.docs.at(-1).text.length + " tecken)"); console.log("underlag tillagt"); }
  else { console.error("okänt kommando " + cmd); process.exit(1); }
} catch (e) {
  console.error("FEL: " + e.message);
  process.exit(2);
}
