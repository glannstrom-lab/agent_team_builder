/* ============================================================
   Agent Team Builder — Builder-UI (djup körning)
   Kör den RIKTIGA pipelinen i webbläsaren mot kundens nyckel.
   Varje steg använder den faktiska prompt-filen som systemprompt:
   research.md → scale.md → proposal.md → (first-project.md) → sammanställning.
   ============================================================ */

const KEY_STORAGE = "atb_api_key";
const MODEL_STORAGE = "atb_model";
const DRAFT_STORAGE = "atb_draft_team";
const DEFAULT_MODEL = "claude-opus-4-8";
// API-URL, anthropic-version och strömningen ligger i ../atb-claude.js
// (window.ATBClaude) — delat med Portalen så de inte kan glida isär.

const MODELS = [
  { id: "claude-opus-4-8", label: "Opus 4.8 — mest kapabel (djupast analys)" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — snabbare & billigare" },
];

// Regler för hur en agent blir en portal-systemprompt (speglar templates/shared/portal-team.md).
const PORTAL_RULES = `Bygg varje agents "system" som en komplett systemprompt SKRIVEN FÖR AGENTEN (inte för användaren):
1. Kontext om företaget + agentens jobb (jobb-meningen ur proposalen).
2. DINA KAPACITETER — punktlista ur proposalen.
3. (Bara VD-assistenten) DITT TEAM — lista övriga agenter och vad de gör, så den kan hänvisa rätt.
4. ARBETSSÄTT — be om data agenten saknar istället för att gissa.
5. TON — kort; nybörjarkund → pedagogisk/klarspråk, van/byggare → rakare. Avsluta med "Svara på <språk>."
6. VIKTIGT — vad agenten INTE gör (proposalens "Rör inte"); slutbeslut/juridik ligger hos människan.`;

const PROMPTS = {}; // cache av hämtade prompt-filer
const state = {
  apiKey: localStorage.getItem(KEY_STORAGE) || "",
  model: localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL,
  // Demoläge: spela upp en inspelad körning utan nyckel (knapp eller ?demo=1).
  demo: new URLSearchParams(location.search).get("demo") === "1",
  busy: false, team: null, abort: null,
  lastRun: null, // { intake, intakeBlock, r } — för "sammanställ igen"
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const $ = (s) => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slugify = (s) => s.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "team";

async function fetchPrompt(path) {
  if (PROMPTS[path]) return PROMPTS[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Kunde inte läsa ${path} (${res.status}). Servera projektroten så att prompts/ är åtkomlig.`);
  const txt = await res.text();
  PROMPTS[path] = txt;
  return txt;
}

function hubLink() { const a = el("a", "hublink", "← Agent Team Builder"); a.href = "../"; return a; }

// PNG:erna ligger i portal/avatars/ — refereras härifrån med detta prefix.
const AVATAR_BASE = "../portal/avatars/";
function avatarSrcFor(a) {
  if (a.avatar) return a.avatar;
  if (a.avatarN && window.ATBAvatars) return window.ATBAvatars.src(a.avatarN, AVATAR_BASE);
  return null;
}
// Fyller en ikon-box med agentens porträtt (om ett finns) annars emoji.
function fillIcon(box, a) {
  const src = avatarSrcFor(a);
  if (src) {
    box.classList.add("has-img");
    const img = el("img", "ava-img");
    img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    img.onerror = () => { box.classList.remove("has-img"); box.textContent = a.icon || "•"; };
    box.appendChild(img);
  } else {
    box.textContent = a.icon || "•";
  }
  return box;
}

// ---------- boot ----------
function boot() { (state.apiKey || state.demo) ? renderForm() : renderKeySetup(); }

// Liten banner som visas i demoläget.
function demoBanner() {
  const b = el("div", "demo-banner");
  b.appendChild(el("span", "demo-dot"));
  b.appendChild(el("span", "demo-text", "Demoläge — en inspelad körning spelas upp. Koppla in din nyckel för att bygga mot ett riktigt företag."));
  const c = el("button", "demo-connect", "Koppla in din nyckel →");
  c.onclick = connectKey;
  b.appendChild(c);
  return b;
}

// Lämna demoläget och visa nyckel-skärmen.
function connectKey() {
  state.demo = false;
  const params = new URLSearchParams(location.search);
  if (params.get("demo")) {
    params.delete("demo");
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  }
  renderKeySetup();
}

function renderKeySetup() {
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "setup");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", "🔑 Engångsuppkoppling"));
  const h = el("h1"); h.innerHTML = `Bygg ett team med <span class="grad">Agent Team Builder</span>`;
  wrap.appendChild(h);
  wrap.appendChild(el("p", "setup-lead", "Klistra in din Anthropic API-nyckel. Den sparas bara här i den här webbläsaren och skickas direkt till Claude — aldrig till någon annan server. Tips: använd en nyckel med begränsad budget."));
  const field = el("div", "setup-field");
  const input = el("input"); input.type = "password"; input.id = "api-key-input"; input.placeholder = "sk-ant-..."; input.spellcheck = false;
  input.setAttribute("aria-label", "Anthropic API-nyckel");
  field.appendChild(input); wrap.appendChild(field);
  const err = el("div", "setup-err"); err.style.display = "none"; wrap.appendChild(err);
  const btn = el("button", "btn-primary", "Anslut");
  btn.onclick = () => {
    const v = input.value.trim();
    if (!v.startsWith("sk-ant-")) { err.textContent = "Det ser inte ut som en Anthropic-nyckel (sk-ant-...)."; err.style.display = "block"; return; }
    state.apiKey = v; localStorage.setItem(KEY_STORAGE, v); renderForm();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  wrap.appendChild(btn);
  const help = el("div", "setup-help");
  help.innerHTML = 'Skapa en nyckel på <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>.';
  wrap.appendChild(help);
  const demoBtn = el("button", "demo-link", "Eller utforska i demoläge utan nyckel →");
  demoBtn.onclick = () => {
    state.demo = true;
    // Spegla till URL:en så demoläget överlever F5 (samma symmetri som connectKey).
    const params = new URLSearchParams(location.search);
    if (params.get("demo") !== "1") { params.set("demo", "1"); history.replaceState(null, "", location.pathname + "?" + params.toString()); }
    renderForm();
  };
  wrap.appendChild(demoBtn);
  root.appendChild(wrap); setTimeout(() => input.focus(), 50);
}

// ---------- intake form ----------
function renderForm() {
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "form-wrap");
  wrap.appendChild(hubLink());
  if (state.demo) wrap.appendChild(demoBanner());
  const head = el("div", "form-head");
  head.appendChild(el("div", "eyebrow", "● Ny körning · djup pipeline"));
  const h = el("h1"); h.innerHTML = `Berätta om kunden — så bygger vi <span class="grad">teamet</span>`;
  head.appendChild(h);
  head.appendChild(el("p", "form-lead", "Fyll i, tryck Bygg, och se hela den riktiga analysen växa fram live. Det tar ett par minuter — och resultatet blir korrekt."));
  wrap.appendChild(head);

  const form = el("form", "intake");
  form.appendChild(fieldRow("Företag / projekt", inputEl("company", "company", "T.ex. CoachOnline")));
  const modeSel = selectEl("mode", "mode", [["team-builder", "Team-builder (för dig själv / tekniska)"], ["ai-consultant", "AI-konsult (för kunduppdrag)"]]);
  form.appendChild(fieldRow("Läge", modeSel));
  const sizeSel = selectEl("size", "size", [["solo", "Solo (1 person)"], ["mikro", "Mikro (2)"], ["litet", "Litet team (3–10)"], ["medelstort", "Medelstort (10–100)"], ["stort", "Stort (100+)"]]);
  form.appendChild(fieldRow("Storlek", sizeSel));
  const matRow = fieldRow("AI-mognad", selectEl("maturity", "maturity", [["nybörjare", "Nybörjare — har inte börjat"], ["van", "Van — provat ChatGPT osv."], ["byggare", "Byggare — bygger redan egna verktyg"]]));
  matRow.style.display = "none"; form.appendChild(matRow);
  modeSel.onchange = () => { matRow.style.display = modeSel.value === "ai-consultant" ? "" : "none"; };

  const modelSel = selectEl("model", "model", MODELS.map((m) => [m.id, m.label]));
  modelSel.value = state.model;
  modelSel.onchange = () => { state.model = modelSel.value; localStorage.setItem(MODEL_STORAGE, modelSel.value); };
  form.appendChild(fieldRow("Modell", modelSel));

  const ta = el("textarea", "intake-text"); ta.name = "brief"; ta.id = "f-brief"; ta.rows = 8;
  ta.placeholder = "Beskriv kunden fritt:\n• Vad gör företaget?\n• Vilka 3 moment återkommer mest i veckan och tar mest tid?\n• Var klämmer skon — vad är frustrerande?\n• Vilka verktyg/system används redan?";
  form.appendChild(fieldRow("Om kunden", ta));

  const err = el("div", "fin-err"); err.id = "form-err"; err.style.display = "none";
  form.appendChild(err);

  const btn = el("button", "btn-primary build-btn", "⚡ Bygg teamet"); btn.type = "submit";
  form.appendChild(btn);
  form.onsubmit = (e) => {
    e.preventDefault();
    const intake = collect(form);
    if (!intake.company || !intake.brief || intake.brief.trim().length < 20) {
      err.textContent = "Fyll i företag och en beskrivning på minst ett par meningar."; err.style.display = "block";
      return;
    }
    runBuild(intake);
  };
  wrap.appendChild(form);

  const foot = el("div", "form-foot");
  const reset = el("button", "link-btn", state.demo ? "Koppla in din nyckel" : "Byt API-nyckel");
  reset.onclick = state.demo ? connectKey : () => { if (confirm("Ta bort sparad nyckel?")) { localStorage.removeItem(KEY_STORAGE); state.apiKey = ""; renderKeySetup(); } };
  foot.appendChild(reset); wrap.appendChild(foot);
  root.appendChild(wrap);
  if (state.demo) prefillDemo();
}

function prefillDemo() {
  const d = (window.BUILDER_DEMO || {}).intake || {};
  const set = (id, v) => { const e = $("#f-" + id); if (e && v != null) e.value = v; };
  set("company", d.company); set("size", d.size); set("brief", d.brief);
  const mode = $("#f-mode");
  if (mode && d.mode) { mode.value = d.mode; mode.dispatchEvent(new Event("change")); }
  if (d.maturity) set("maturity", d.maturity);
}

function fieldRow(label, control) {
  const r = el("div", "frow");
  const lab = el("label", "flabel", label);
  if (control.id) lab.setAttribute("for", control.id);
  r.appendChild(lab); r.appendChild(control); return r;
}
function inputEl(name, id, ph) { const i = el("input", "fin"); i.name = name; i.id = "f-" + id; i.placeholder = ph || ""; return i; }
function selectEl(name, id, opts) { const s = el("select", "fin"); s.name = name; s.id = "f-" + id; opts.forEach(([v, l]) => { const o = el("option", null, l); o.value = v; s.appendChild(o); }); return s; }
function collect(form) { const d = Object.fromEntries(new FormData(form).entries()); if (d.mode !== "ai-consultant") delete d.maturity; return d; }

// ---------- intake block ----------
function buildIntakeBlock(intake) {
  return [
    "```",
    `företagsnamn:   ${intake.company}`,
    `bransch:        (härled ur beskrivningen)`,
    `storlek:        ${intake.size}`,
    `läge:           ${intake.mode}`,
    intake.maturity ? `ai_mognad:      ${intake.maturity}` : null,
    `källa:          intervju`,
    "",
    "## Beskrivning från intake",
    intake.brief.trim(),
    "```",
  ].filter((x) => x !== null).join("\n");
}

// ---------- pipeline ----------
async function runBuild(intake) {
  if (state.demo) return runDemoBuild(intake);
  if (state.busy) return;
  state.busy = true;
  state.abort = new AbortController();
  const intakeBlock = buildIntakeBlock(intake);
  const r = {};
  state.lastRun = { intake, intakeBlock, r };

  const stages = [
    { key: "research", label: "Research — analyserar arbetsmoment", file: "../prompts/shared/research.md", stream: true, max: 8192, user: () => intakeBlock, store: "research" },
    { key: "scale", label: "Skalning — väljer antal agenter", file: "../prompts/shared/scale.md", stream: false, max: 1024, user: () => `INTAKE:\n${intakeBlock}\n\nRESEARCH-DOKUMENT:\n${r.research}`, store: "scaling" },
    { key: "proposal", label: "Förslag — formar agenterna", file: "../prompts/shared/proposal.md", stream: true, max: 8192, user: () => `INTAKE:\n${intakeBlock}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}`, store: "proposal" },
  ];
  if (intake.mode === "ai-consultant") {
    stages.push({ key: "firstproject", label: "Första projektet — väljer en startpunkt", file: "../prompts/ai-consultant/first-project.md", stream: true, max: 4096, user: () => `INTAKE:\n${intakeBlock}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nFÖRSLAG:\n${r.proposal}`, store: "firstproject" });
  }
  stages.push({ key: "structure", label: "Sammanställer teamet", stream: false });

  renderProgress(intake, stages);

  try {
    for (const stg of stages) {
      setStage(stg.key);
      if (stg.key === "structure") {
        const teamObj = await structureTeam(intake, r);
        markDone(stg.key);
        state.team = teamObj;
        renderResult(teamObj);
        return;
      }
      const sys = await fetchPrompt(stg.file);
      const panel = $("#analysis-text"); panel.textContent = "";
      let acc = "";
      const onDelta = (d) => { acc += d; panel.textContent = acc; panel.scrollTop = panel.scrollHeight; };
      if (stg.stream) {
        await streamClaude(sys, [{ role: "user", content: stg.user() }], onDelta, stg.max);
      } else {
        panel.textContent = "Arbetar…";
        acc = await callClaude(sys, [{ role: "user", content: stg.user() }], stg.max);
        panel.textContent = acc;
      }
      r[stg.store] = acc;
      markDone(stg.key);
    }
  } catch (err) {
    if (err.name === "AbortError") { renderForm(); }
    else renderError(err.message, err.stage === "structure");
  } finally {
    state.busy = false;
  }
}

// Sista steget: omvandla research + proposal till render-struktur + portal-systemprompter.
async function structureTeam(intake, r) {
  const schema = `{
  "company": string,
  "slug": string,
  "tagline": string,
  "scaling": string,
  "firstProject": ${intake.mode === "ai-consultant" ? '{ "name": string, "problem": string, "week1": string, "owner": string }' : "null"},
  "rejected": [{ "name": string, "why": string }],
  "agents": [{
    "id": string, "name": string, "icon": string, "role": string, "tagline": string,
    "always": boolean, "job": string, "capabilities": [string], "triggers": [string], "system": string
  }]
}`;
  const sys = `Du sammanställer ett redan färdigt agent-team till strukturerad JSON för rendering och för en kundportal.

HÄMTA ALLT INNEHÅLL FRÅN FÖRSLAGET OCH RESEARCHEN NEDAN. Fabricera inget, lägg inte till eller ta bort agenter, ändra inte besluten. Du formaterar bara om — innehållet är redan bestämt.

${PORTAL_RULES}

VD-assistenten ska ha id "vd-assistent" och vara först i listan, sedan VD (id "vd"), sedan specialister i prioritetsordning. always=true för VD och VD-assistent. VD ⚡, VD-assistent 🧭, domän-emoji för specialister. Avvisade moment kommer från researchen/förslaget (minst ett).

Returnera ENBART giltig JSON enligt schemat (ingen text runt, inga markdown-staket):
${schema}`;
  const fpBlock = r.firstproject ? `\n\nFÖRSTA PROJEKTET:\n${r.firstproject}` : "";
  const user = `RESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}\n\nFÖRSLAG (agenterna):\n${r.proposal}${fpBlock}\n\nSammanställ som JSON.`;

  const raw = await callClaude(sys, [{ role: "user", content: user }], 16000);
  let team;
  try {
    team = JSON.parse(extractJson(raw));
  } catch (e) {
    const err = new Error("Modellen returnerade ogiltig JSON i sammanställningen. Research och förslag finns kvar — försök sammanställa igen.");
    err.stage = "structure";
    throw err;
  }
  if (!team || !Array.isArray(team.agents) || team.agents.length === 0) {
    const err = new Error("Sammanställningen saknar agenter. Försök sammanställa igen.");
    err.stage = "structure";
    throw err;
  }
  team.slug = slugify(team.slug || intake.company);
  team.language = "sv";
  team.defaultModel = state.model;
  team.entryAgent = (team.agents.find((a) => a.id === "vd-assistent") || team.agents[0]).id;
  return team;
}

// Balansera klamrar för att plocka exakt ett JSON-objekt även om modellen lägger till prosa.
function extractJson(s) {
  let t = s.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = t.indexOf("{");
  if (start === -1) throw new Error("ingen JSON");
  let depth = 0, inStr = false, escaped = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return t.slice(start, i + 1); }
  }
  throw new Error("ofullständig JSON");
}

async function retryStructure() {
  if (state.busy || !state.lastRun) return;
  state.busy = true;
  renderProgress(state.lastRun.intake, [{ key: "structure", label: "Sammanställer teamet" }]);
  setStage("structure");
  try {
    const teamObj = await structureTeam(state.lastRun.intake, state.lastRun.r);
    state.team = teamObj;
    renderResult(teamObj);
  } catch (err) {
    renderError(err.message, true);
  } finally {
    state.busy = false;
  }
}

// ---------- demo-uppspelning ----------
// Spelar upp den inspelade körningen (window.BUILDER_DEMO) som om pipelinen
// kördes live — samma progress-vy, men inget API anropas.
async function runDemoBuild(intake) {
  if (state.busy) return;
  const demo = window.BUILDER_DEMO;
  if (!demo || !demo.stages || !demo.team) {
    renderError("Demodatan kunde inte laddas (demo-data.js saknas). Ladda om sidan och försök igen.", false);
    return;
  }
  state.busy = true;
  const stages = [
    { key: "research", label: "Research — analyserar arbetsmoment", text: demo.stages.research },
    { key: "scale", label: "Skalning — väljer antal agenter", text: demo.stages.scaling },
    { key: "proposal", label: "Förslag — formar agenterna", text: demo.stages.proposal },
    { key: "structure", label: "Sammanställer teamet" },
  ];
  renderProgress(intake, stages);
  try {
    for (const stg of stages) {
      setStage(stg.key);
      if (stg.key === "structure") {
        await sleep(550);
        markDone(stg.key);
        state.team = demo.team;
        renderResult(demo.team);
        return;
      }
      const panel = $("#analysis-text"); panel.textContent = "";
      let acc = "";
      await streamText(stg.text, (d) => { acc += d; panel.textContent = acc; panel.scrollTop = panel.scrollHeight; });
      markDone(stg.key);
      await sleep(220);
    }
  } finally {
    state.busy = false;
  }
}

// Strömmar fram text ord för ord så det känns som riktig generering.
async function streamText(full, onDelta) {
  const tokens = (full || "").split(/(\s+)/);
  for (const tk of tokens) { await sleep(7); onDelta(tk); }
}

// ---------- progress view ----------
function renderProgress(intake, stages) {
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "progress-wrap");
  const head = el("div", "prog-head");
  head.appendChild(el("div", "eyebrow", "● Bygger team för"));
  head.appendChild(el("h1", "prog-company", intake.company));
  head.appendChild(el("p", "form-lead", "Den fullständiga pipelinen körs live. Det tar ett par minuter."));
  wrap.appendChild(head);

  const steps = el("div", "prog-steps");
  stages.forEach((s, i) => {
    const st = el("div", "prog-step"); st.dataset.stage = s.key;
    st.appendChild(el("span", "prog-dot"));
    st.appendChild(el("span", "prog-label", `${i + 1} · ${s.label}`));
    steps.appendChild(st);
  });
  wrap.appendChild(steps);

  const panel = el("div", "analysis-panel");
  const at = el("div", "analysis-text"); at.id = "analysis-text";
  panel.appendChild(at); wrap.appendChild(panel);

  if (state.abort) {
    const cancel = el("button", "link-btn prog-cancel", "Avbryt körningen");
    cancel.onclick = () => { try { state.abort.abort(); } catch (_) {} };
    wrap.appendChild(cancel);
  }
  root.appendChild(wrap);
}
function setStage(key) { document.querySelectorAll(".prog-step").forEach((n) => { if (n.dataset.stage === key) n.classList.add("active"); }); }
function markDone(key) { document.querySelectorAll(".prog-step").forEach((n) => { if (n.dataset.stage === key) { n.classList.remove("active"); n.classList.add("done"); } }); }

// ---------- result view ----------
function renderResult(team) {
  if (window.ATBAvatars) window.ATBAvatars.assign(team); // ge varje agent ett porträtt
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "result-wrap");
  wrap.appendChild(hubLink());

  const hero = el("div", "result-hero");
  hero.appendChild(el("div", "eyebrow", "✓ Teamet är klart"));
  const h = el("h1"); h.innerHTML = `${esc(team.company)} — <span class="grad">${team.agents.length} agenter</span>`;
  hero.appendChild(h);
  hero.appendChild(el("p", "result-lead", team.tagline || ""));
  const actions = el("div", "result-actions");
  const live = el("button", "btn-primary", "💬 Prova teamet live");
  live.onclick = () => { localStorage.setItem(DRAFT_STORAGE, JSON.stringify(stripTeam(team))); window.open("../portal/?team=__draft" + (state.demo ? "&demo=1" : ""), "_blank"); };
  const dl = el("button", "btn-ghost", "⬇ Ladda ner config");
  dl.onclick = () => downloadConfig(team);
  const again = el("button", "btn-ghost", "↺ Bygg ett till");
  again.onclick = () => renderForm();
  actions.append(live, dl, again); hero.appendChild(actions);
  wrap.appendChild(hero);

  const fp = team.firstProject;
  if (fp && typeof fp === "object" && fp.name) {
    const box = el("div", "decision"); box.style.marginTop = "10px";
    box.appendChild(el("div", "meta-label", "Första projektet"));
    box.appendChild(Object.assign(el("div", "big"), { textContent: fp.name }));
    if (fp.problem) box.appendChild(el("p", null, "Problemet: " + fp.problem));
    const row = el("div", "scale-row");
    if (fp.week1) row.appendChild(el("span", "scale-chip", "Efter vecka 1: " + fp.week1));
    if (fp.owner) row.appendChild(el("span", "scale-chip", "Äger: " + fp.owner));
    box.appendChild(row); wrap.appendChild(box);
  }

  const org = el("div", "org");
  const ceo = team.agents.find((a) => a.id === "vd");
  const cos = team.agents.find((a) => a.id === "vd-assistent");
  const specs = team.agents.filter((a) => a.id !== "vd" && a.id !== "vd-assistent");
  if (ceo) org.appendChild(orgRow([node(ceo, "ceo")]));
  if (ceo && cos) org.appendChild(connector(true));
  if (cos) org.appendChild(orgRow([node(cos, "cos")]));
  if (specs.length) { org.appendChild(connector(false)); org.appendChild(orgRow(specs.map((a) => node(a, "spec")))); }
  wrap.appendChild(org);

  const cards = el("div", "cards");
  team.agents.forEach((a) => cards.appendChild(agentCard(a)));
  wrap.appendChild(cards);

  if (Array.isArray(team.rejected) && team.rejected.length) {
    const rh = el("div", "section-head"); rh.style.marginTop = "10px";
    rh.appendChild(el("div", "eyebrow", "Avvisat"));
    rh.appendChild(el("h2", "section-title", "Vad som medvetet inte blev agenter"));
    wrap.appendChild(rh);
    const rg = el("div", "rejected-grid");
    team.rejected.forEach((x) => { const rj = el("div", "rej"); rj.appendChild(el("div", "rn", x.name)); rj.appendChild(el("div", "rm", x.why)); rg.appendChild(rj); });
    wrap.appendChild(rg);
  }
  root.appendChild(wrap);
}

function orgRow(nodes) { const r = el("div", "org-row"); nodes.forEach((n) => r.appendChild(n)); return r; }
function connector(solid) { return el("div", "connector" + (solid ? " solid" : "")); }
function node(a, kind) {
  const n = el("div", "node " + kind);
  n.appendChild(el("div", "role", a.role || (kind === "spec" ? "Specialist" : "")));
  const nm = el("div", "nm");
  const src = avatarSrcFor(a);
  if (src) {
    const img = el("img", "ava-inline");
    img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    nm.appendChild(img); nm.appendChild(document.createTextNode(a.name));
  } else {
    nm.textContent = `${a.icon || "•"} ${a.name}`;
  }
  n.appendChild(nm);
  n.appendChild(el("div", "jb", a.tagline || a.job || ""));
  return n;
}
function agentCard(a) {
  const cls = a.id === "vd" ? "card is-ceo" : a.id === "vd-assistent" ? "card is-cos" : "card";
  const c = el("div", cls);
  const top = el("div", "card-top"); top.appendChild(fillIcon(el("div", "icon"), a));
  const td = el("div"); td.appendChild(el("h3", null, a.name));
  td.appendChild(el("span", "tag " + (a.always ? "always" : "special"), a.always ? "Alltid närvarande" : "Specialist"));
  top.appendChild(td); c.appendChild(top);
  c.appendChild(el("p", "job", a.job || ""));
  if (Array.isArray(a.capabilities) && a.capabilities.length) { c.appendChild(el("div", "meta-label", "Kapaciteter")); const ul = el("ul", "caps"); a.capabilities.forEach((x) => ul.appendChild(el("li", null, x))); c.appendChild(ul); }
  if (Array.isArray(a.triggers) && a.triggers.length) { c.appendChild(el("div", "meta-label", "Triggas av")); const ch = el("div", "chips"); a.triggers.forEach((x) => ch.appendChild(el("span", "chip", x))); c.appendChild(ch); }
  return c;
}

function stripTeam(team) {
  return { company: team.company, tagline: team.tagline, language: "sv", defaultModel: state.model, entryAgent: team.entryAgent,
    agents: team.agents.map((a) => ({ id: a.id, name: a.name, icon: a.icon, avatarN: a.avatarN, role: a.role, tagline: a.tagline, always: !!a.always, system: a.system })) };
}
function downloadConfig(team) {
  const js = "// Genererad av Builder. Lägg i portal/teams/ och registrera i index.js.\nwindow.TEAM = " + JSON.stringify(stripTeam(team), null, 2) + ";\n";
  const url = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
  const a = el("a"); a.href = url; a.download = `${team.slug}.js`; a.click(); URL.revokeObjectURL(url);
}

function renderError(msg, canRetryStructure) {
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "result-wrap");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "eyebrow", "⚠️ Något gick fel"));
  wrap.appendChild(el("p", "result-lead", msg));
  const actions = el("div", "result-actions"); actions.style.marginTop = "22px";
  if (canRetryStructure && state.lastRun) {
    const retry = el("button", "btn-primary", "↻ Sammanställ igen");
    retry.onclick = () => retryStructure();
    actions.appendChild(retry);
  }
  const back = el("button", "btn-ghost", "↺ Till formuläret");
  back.onclick = () => renderForm();
  actions.appendChild(back);
  wrap.appendChild(actions);
  root.appendChild(wrap);
}

// ---------- Claude API ----------
// Tunna omslag runt den delade klienten (../atb-claude.js). callClaude samlar
// hela svaret; streamClaude strömmar via onDelta. Abort-signalen kommer från
// "Avbryt körningen"-knappen.
async function callClaude(system, messages, maxTokens) {
  return window.ATBClaude.collect({
    apiKey: state.apiKey, model: state.model, system, messages, maxTokens,
    signal: state.abort ? state.abort.signal : undefined,
  });
}
async function streamClaude(system, messages, onDelta, maxTokens) {
  await window.ATBClaude.stream({
    apiKey: state.apiKey, model: state.model, system, messages, maxTokens, onDelta,
    signal: state.abort ? state.abort.signal : undefined,
  });
}

boot();
