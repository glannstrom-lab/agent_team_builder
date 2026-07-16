/* ============================================================
   Mitt AI-team — Builder-UI (djup körning)
   Kör den RIKTIGA pipelinen i webbläsaren mot kundens nyckel.
   Varje steg använder den faktiska prompt-filen som systemprompt:
   research.md → scale.md → proposal.md → (first-project.md) → sammanställning.
   ============================================================ */

const KEY_STORAGE = "atb_api_key";
const MODEL_STORAGE = "atb_model";
const DRAFT_STORAGE = "atb_draft_team";
const DEFAULT_MODEL = "claude-opus-4-8";
// OpenRouter-nycklar (sk-or-) har eget modellval, sparat separat — samma
// mönster som portalen så valen inte krockar vid nyckelbyte.
const OR_MODEL_STORAGE = "atb_model_or";
const DEFAULT_OR_MODEL = "deepseek/deepseek-v4-flash"; // billigast som klarar jobbet bra
// API-URL, anthropic-version och strömningen ligger i ../atb-claude.js
// (window.ATBClaude) — delat med Portalen så de inte kan glida isär.

const MODELS = [
  { id: "claude-opus-4-8", label: "Opus 4.8 — mest kapabel (djupast analys)" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — snabbare & billigare" },
];

function isOpenRouter() { return window.ATBClaude.providerFor(state.apiKey) === "openrouter"; }
function syncModelForProvider() {
  state.model = isOpenRouter()
    ? (localStorage.getItem(OR_MODEL_STORAGE) || DEFAULT_OR_MODEL)
    : (localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL);
}

// Regler för hur en agent blir en portal-systemprompt (speglar templates/shared/portal-team.md).
const PORTAL_RULES = `Bygg varje agents "system" som en komplett systemprompt SKRIVEN FÖR AGENTEN (inte för användaren):
1. Kontext om företaget + agentens jobb (jobb-meningen ur proposalen).
2. DINA KAPACITETER — punktlista ur proposalen.
3. (Bara VD-assistenten) DITT TEAM — lista övriga agenter och vad de gör, så den kan hänvisa rätt.
4. ARBETSSÄTT — be om data agenten saknar istället för att gissa.
5. TON — kort; nybörjarkund → pedagogisk/klarspråk, van/byggare → rakare. Avsluta med "Svara på <språk>."
6. VIKTIGT — vad agenten INTE gör (proposalens "Rör inte"); slutbeslut/juridik ligger hos människan.
7. STARTERS — per agent: 2–4 korta exempeluppgifter i du-form ("Skriv ett utkast till …", "Gå igenom …"), hämtade ur agentens kapaciteter och kundens veckomoment. De blir klickbara startförslag i portalen — konkreta nog att skicka direkt.`;

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

function hubLink() { const a = el("a", "hublink", "← Mitt AI-team"); a.href = "../"; return a; }

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
function boot() { if (state.apiKey) syncModelForProvider(); (state.apiKey || state.demo) ? renderForm() : renderKeySetup(); }

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
  const h = el("h1"); h.innerHTML = `Bygg ditt <span class="grad">AI-team</span>`;
  wrap.appendChild(h);
  wrap.appendChild(el("p", "setup-lead", "Klistra in din API-nyckel — Anthropic (sk-ant-…) eller OpenRouter (sk-or-…). Den sparas bara här i den här webbläsaren och skickas direkt till leverantören — aldrig till någon annan server. Tips: använd en nyckel med begränsad budget."));
  const field = el("div", "setup-field");
  const input = el("input"); input.type = "password"; input.id = "api-key-input"; input.placeholder = "sk-ant-... eller sk-or-..."; input.spellcheck = false;
  input.setAttribute("aria-label", "API-nyckel (Anthropic eller OpenRouter)");
  field.appendChild(input); wrap.appendChild(field);
  const err = el("div", "setup-err"); err.style.display = "none"; wrap.appendChild(err);
  const btn = el("button", "btn-primary", "Anslut");
  btn.onclick = () => {
    const v = input.value.trim();
    if (!v.startsWith("sk-ant-") && !v.startsWith("sk-or-")) { err.textContent = "Det ser inte ut som en giltig nyckel (Anthropic: sk-ant-…, OpenRouter: sk-or-…)."; err.style.display = "block"; return; }
    state.apiKey = v; localStorage.setItem(KEY_STORAGE, v); syncModelForProvider(); renderForm();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  wrap.appendChild(btn);
  const help = el("div", "setup-help");
  help.innerHTML = 'Skapa en nyckel på <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a> eller <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">openrouter.ai</a>.';
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

  let modelSel;
  if (!state.demo && isOpenRouter()) {
    // OpenRouter: hämta katalogen live (kurerad i atb-claude.js); tills dess
    // visas bara nuvarande val så formuläret fungerar direkt.
    modelSel = selectEl("model", "model", [[state.model, state.model]]);
    window.ATBClaude.openrouterModels()
      .then((models) => {
        const list = models.some((m) => m.id === state.model) ? models : [{ id: state.model, name: state.model }].concat(models);
        modelSel.innerHTML = "";
        list.forEach((m) => { const o = el("option", null, m.name || m.id); o.value = m.id; modelSel.appendChild(o); });
        modelSel.value = state.model;
      })
      .catch(() => { /* offline/fel — behåll nuvarande val */ });
  } else {
    modelSel = selectEl("model", "model", MODELS.map((m) => [m.id, m.label]));
  }
  modelSel.value = state.model;
  modelSel.onchange = () => {
    state.model = modelSel.value;
    localStorage.setItem(isOpenRouter() ? OR_MODEL_STORAGE : MODEL_STORAGE, modelSel.value);
  };
  form.appendChild(fieldRow("Modell", modelSel));

  // Strukturerat frågeformulär istället för en tom textruta — kunden vet vad
  // den ska svara på, och research-steget får jämnt råmaterial i exakt det
  // format intake-kontraktet (prompts/shared/research.md) kräver.
  const taEl = (name, rows, ph) => { const t = el("textarea", "intake-text"); t.name = name; t.id = "f-" + name; t.rows = rows; t.placeholder = ph || ""; return t; };
  form.appendChild(fieldRow("Vad gör företaget?", taEl("what", 2, "1–2 meningar. T.ex: Livs- och karriärcoach som säljer 1-on-1-sessioner online.")));
  form.appendChild(fieldRow("Veckans återkommande moment — vad tar mest tid?", taEl("moments", 4, "De 2–4 moment som återkommer varje vecka, gärna med ungefärlig tid.\nT.ex: 1) Nyhetsbrev och blogg, 5–7 h. 2) Svara på inkommande leads (mail, DM).")));
  form.appendChild(fieldRow("Var klämmer skon?", taEl("pains", 2, "Det som är frustrerande eller blir liggande. Valfritt men gör analysen skarpare.")));
  form.appendChild(fieldRow("Program & system ni använder dagligen", inputEl("tools", "tools", "T.ex. Fortnox, Outlook, Shopify, Google Kalender")));
  form.appendChild(fieldRow("Vad ska AI-teamet uppnå?", inputEl("goals", "goals", "T.ex. frigöra 5 h/vecka från admin till betalt arbete")));
  form.appendChild(fieldRow("Något AI inte ska röra?", inputEl("nogo", "nogo", "T.ex. kundsamtalen, prissättningen. Lämna tomt om inget.")));

  const err = el("div", "fin-err"); err.id = "form-err"; err.style.display = "none";
  form.appendChild(err);

  const btn = el("button", "btn-primary build-btn", "⚡ Bygg teamet"); btn.type = "submit";
  form.appendChild(btn);
  form.onsubmit = (e) => {
    e.preventDefault();
    const intake = collect(form);
    if (!intake.company || !intake.what || intake.what.trim().length < 10) {
      err.textContent = "Fyll i företag och vad företaget gör (minst en mening)."; err.style.display = "block"; return;
    }
    if (!intake.moments || intake.moments.trim().length < 20) {
      err.textContent = "Veckans moment är det viktigaste fältet — beskriv minst ett par moment."; err.style.display = "block"; return;
    }
    err.style.display = "none";
    if (state.demo) runBuild(intake);
    else clarifyThenBuild(intake, form, btn); // 1–2 AI-följdfrågor innan pipelinen
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
  set("company", d.company); set("size", d.size);
  set("what", d.what); set("moments", d.moments); set("pains", d.pains);
  set("tools", d.tools); set("goals", d.goals); set("nogo", d.nogo);
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
// Mappar formuläret till intake-kontraktet i prompts/shared/research.md —
// samma sektioner (inkl. ## Avgränsningar) som intervju-prompterna levererar.
function buildIntakeBlock(intake) {
  const val = (v, alt) => (v && v.trim() ? v.trim() : alt);
  return [
    "```",
    `företagsnamn:   ${intake.company}`,
    `bransch:        (härled ur beskrivningen)`,
    `storlek:        ${intake.size}`,
    `läge:           ${intake.mode}`,
    intake.maturity ? `ai_mognad:      ${intake.maturity}` : null,
    `källa:          intervju`,
    "",
    "## Vad företaget gör",
    val(intake.what, "(saknas)"),
    "",
    "## Återkommande moment",
    val(intake.moments, "(saknas)"),
    "",
    "## Var det klämmer",
    val(intake.pains, "Framgår inte uttryckligen — härled försiktigt ur momenten."),
    "",
    "## Befintliga verktyg och vanor",
    val(intake.tools, "Okänt."),
    "",
    "## Mål och ambition",
    val(intake.goals, "Frigöra tid från de mest återkommande momenten."),
    "",
    "## Avgränsningar",
    val(intake.nogo, "Inga uttryckliga avgränsningar."),
    intake.extra ? "\n## Kompletterande svar (följdfrågor)\n" + intake.extra : null,
    "```",
  ].filter((x) => x !== null).join("\n");
}

// ---------- följdfrågor (hybrid-intake) ----------
// Formulär först, sedan max två AI-följdfrågor på det som stack ut — så
// tappas inte djupet från fri intervju. Frågorna är nice-to-have: vid fel
// eller "OK" startar pipelinen direkt.
const CLARIFY_PROMPT = `Du granskar ett intake-underlag för att bygga ett AI-agentteam.
Bedöm om research-steget kan arbeta med det: konkreta veckomoment (helst med tidsangivelse), begriplig verksamhet, någon bild av verktyg.
Svara EXAKT "OK" om underlaget räcker.
Annars: ställ 1–2 korta följdfrågor som skulle göra störst skillnad — en per rad, varje rad börjar med "- ". Fråga bara om sådant som inte redan står i underlaget. Inga andra ord, ingen inledning.`;

async function clarifyThenBuild(intake, form, btn) {
  if (state.busy) return;
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = "Läser dina svar…";
  let out = "OK";
  try {
    out = (await window.ATBClaude.collect({
      apiKey: state.apiKey, model: state.model,
      system: CLARIFY_PROMPT,
      messages: [{ role: "user", content: buildIntakeBlock(intake) }],
      maxTokens: 300,
    })).trim();
  } catch (_) { /* följdfrågor är nice-to-have — fortsätt utan */ }
  btn.disabled = false; btn.textContent = orig;
  const qs = /^ok\b/i.test(out) ? [] : out.split("\n").map((s) => s.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean).slice(0, 2);
  if (!qs.length) { runBuild(intake); return; }
  renderClarify(form, intake, qs);
}

function renderClarify(form, intake, qs) {
  form.querySelector(".clarify-box")?.remove();
  const box = el("div", "clarify-box");
  box.appendChild(el("div", "clarify-title", "Snabba följdfrågor — svaren gör analysen skarpare"));
  const inputs = qs.map((q) => {
    const r = el("div", "frow");
    r.appendChild(el("label", "flabel", q));
    const t = el("textarea", "intake-text"); t.rows = 2;
    r.appendChild(t); box.appendChild(r);
    return { q, t };
  });
  const row = el("div", "clarify-actions");
  const go = el("button", "btn-primary", "Fortsätt — bygg teamet"); go.type = "button";
  go.onclick = () => {
    const extra = inputs.map(({ q, t }) => `**${q}**\n${t.value.trim() || "(inget svar)"}`).join("\n\n");
    runBuild(Object.assign({}, intake, { extra }));
  };
  const skip = el("button", "link-btn", "Hoppa över och bygg direkt"); skip.type = "button";
  skip.onclick = () => runBuild(intake);
  row.append(go, skip); box.appendChild(row);
  form.appendChild(box);
  box.scrollIntoView({ behavior: "smooth", block: "center" });
  inputs[0]?.t.focus();
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
    "always": boolean, "job": string, "capabilities": [string], "triggers": [string],
    "starters": [string], "system": string
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
  // job/capabilities/starters följer med till portalen — de driver agentkortet
  // ("det här kan jag hjälpa dig med" + klickbara exempeluppgifter).
  return { company: team.company, tagline: team.tagline, language: "sv", defaultModel: state.model, entryAgent: team.entryAgent,
    agents: team.agents.map((a) => ({ id: a.id, name: a.name, icon: a.icon, avatarN: a.avatarN, role: a.role, tagline: a.tagline, always: !!a.always,
      job: a.job, capabilities: a.capabilities, starters: a.starters, system: a.system })) };
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
