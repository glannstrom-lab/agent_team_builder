/* ============================================================
   Mitt AI-team — Builder-UI (djup körning)
   Kör den RIKTIGA pipelinen i webbläsaren mot kundens nyckel.
   Varje steg använder den faktiska prompt-filen som systemprompt:
   research.md → scale.md → proposal.md → (first-project.md) → sammanställning.
   ============================================================ */

const KEY_STORAGE = "atb_api_key";
const MODEL_STORAGE = "atb_model";
const DRAFT_STORAGE = "atb_draft_team";
// Pågående/senaste körning ({intake, r, team?, at}) — persisteras efter varje
// avklarat pipeline-steg så att ett fel eller en F5 aldrig kastar bort betalda
// steg. Utan detta är en refresh mitt i produktens dyraste operation = börja om.
const RUN_STORAGE = "atb_last_run";
const DEFAULT_MODEL = "claude-opus-4-8";
// OpenRouter-nycklar (sk-or-) har eget modellval, sparat separat — samma
// mönster som portalen så valen inte krockar vid nyckelbyte.
const OR_MODEL_STORAGE = "atb_model_or";
const DEFAULT_OR_MODEL = "deepseek/deepseek-v4-flash"; // billigast som klarar jobbet bra
// API-URL, anthropic-version och strömningen ligger i ../atb-claude.js
// (window.ATBClaude) — delat med Portalen så de inte kan glida isär.

const MODELS = [{ id: window.ATBClaude.MODEL_ID, label: window.ATBClaude.MODEL_LABEL }];
// En modell, inga alternativ (2026-08-05). Listan finns kvar för att
// anropande kod inte ska behöva skrivas om, men har exakt ett element
// och hämtar det från atb-claude.js — modellvalet bor på ett ställe.

function isOpenRouter() { return window.ATBClaude.providerFor(state.apiKey) === "openrouter"; }
function syncModelForProvider() {
  state.model = isOpenRouter()
    ? (localStorage.getItem(OR_MODEL_STORAGE) || DEFAULT_OR_MODEL)
    : (localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL);
}

// Regler för hur en agent blir en portal-systemprompt (speglar templates/shared/portal-team.md).
const PORTAL_RULES = `Bygg varje agents "system" som en komplett systemprompt SKRIVEN FÖR AGENTEN (inte för användaren):
1. Kontext om företaget + agentens jobb (jobb-meningen ur proposalen).
2. DITT PERSPEKTIV — proposalens Perspektiv: blicken agenten resonerar från, vad den alltid letar efter/varnar för. Det som gör att två agenter med närliggande uppgifter svarar olika.
3. DINA KAPACITETER — punktlista ur proposalen.
4. (Bara VD-assistenten) DITT TEAM — lista övriga agenter och vad de gör, så den kan hänvisa rätt. VD-assistenten granskar dessutom mötesbidrag mot varje agents "Klart när"-punkter innan sammanställning.
5. LEVERANS — proposalens Leverans + "Klart när"-punkter: hur ett färdigt svar ser ut, så agenten levererar mot det istället för att resonera fritt.
6. ARBETSSÄTT — be om data agenten saknar istället för att gissa.
7. TON — kort; nybörjarkund → pedagogisk/klarspråk, van/byggare → rakare. Avsluta med "Svara på <språk>."
8. VIKTIGT — vad agenten INTE gör (proposalens "Rör inte"); slutbeslut/juridik ligger hos människan.
9. STARTERS — per agent: 2–4 korta exempeluppgifter i du-form ("Skriv ett utkast till …", "Gå igenom …"), hämtade ur agentens kapaciteter och kundens veckomoment. De blir klickbara startförslag i portalen — konkreta nog att skicka direkt.
10. WHY — per agent: EN mening som knyter agenten till kundens egna ord ur intaket/researchen, riktad till kunden: "Du sa att offerterna tar söndagskvällarna — därför finns Offertagenten." Använd kundens formuleringar, fabricera inget. Detta visas på "Därför ser ert team ut så här"-sidan i portalen.`;

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

// ---------- nyckelkontroll (delad av nyckelrutan och köppanelens grind) ----------
//
// Samma nyckel kontrolleras på två ställen: innan ett bygge och innan ett köp.
// Reglerna får inte glida isär — kunden ska aldrig kunna lära sig att en nyckel
// "duger" på ena stället och inte på det andra. Returnerar null när nyckeln
// duger, annars { html } eller { text } att visa för användaren.
async function checkApiKey(v) {
  if (v.startsWith("sk-ant-")) {
    return { html: 'Det där är en Anthropic-nyckel. Vi kör numera på OpenRouter — samma arbete, en bråkdel av kostnaden. ' +
      '<a href="../#forbrukning" target="_blank" rel="noreferrer">Så skaffar du en OpenRouter-nyckel →</a>' };
  }
  if (!v.startsWith("sk-or-")) {
    return { text: "Det ser inte ut som en OpenRouter-nyckel — de börjar med sk-or-." };
  }
  // Testa nyckeln direkt (gratis anrop) — felet ska komma nu, medan användaren
  // har rutan framför sig, inte mitt i en körning och absolut inte efter ett köp.
  try {
    await window.ATBClaude.validateKey(v);
  } catch (e) {
    return { text: e.message };
  }
  return null;
}

// Skriver ut ett fel från checkApiKey. Anthropic-felet innehåller en länk och
// måste därför sättas som HTML; övriga är ren text från leverantören.
function showKeyError(node, err) {
  if (err.html) node.innerHTML = err.html; else node.textContent = err.text;
  node.style.display = "block";
}

// Spara en verifierad nyckel. KEY_STORAGE ("atb_api_key") är samma nyckel som
// portalen läser — den som verifierar här slipper klistra in den igen där.
function saveVerifiedKey(v) {
  state.apiKey = v;
  localStorage.setItem(KEY_STORAGE, v);
  syncModelForProvider();
}

function renderKeySetup() {
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "setup");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", "🔑 Engångsuppkoppling"));
  const h = el("h1"); h.innerHTML = `Bygg ditt <span class="grad">AI-team</span>`;
  wrap.appendChild(h);
  const lead = el("p", "setup-lead");
  lead.innerHTML = 'Klistra in din nyckel från OpenRouter (den börjar med <b>sk-or-</b>). Den sparas bara här i den här webbläsaren och skickas direkt till leverantören — aldrig till någon annan server. Att bygga ett team kostar ungefär åtta öre. ' +
    '<a href="../#forbrukning" target="_blank" rel="noreferrer">Har du ingen nyckel? Så skaffar du en på fem minuter →</a>';
  wrap.appendChild(lead);
  const field = el("div", "setup-field");
  const input = el("input"); input.type = "password"; input.id = "api-key-input"; input.placeholder = "sk-or-..."; input.spellcheck = false;
  input.setAttribute("aria-label", "API-nyckel från OpenRouter");
  field.appendChild(input); wrap.appendChild(field);
  const err = el("div", "setup-err"); err.style.display = "none"; wrap.appendChild(err);
  const btn = el("button", "btn-primary", "Anslut");
  btn.onclick = async () => {
    const v = input.value.trim();
    btn.disabled = true; btn.textContent = "Testar nyckeln…"; err.style.display = "none";
    const bad = await checkApiKey(v);
    btn.disabled = false; btn.textContent = "Anslut";
    if (bad) { showKeyError(err, bad); return; }
    saveVerifiedKey(v); renderForm();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  wrap.appendChild(btn);
  const help = el("div", "setup-help");
  help.innerHTML = 'Skapa en nyckel på <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> — <a href="../#forbrukning" target="_blank" rel="noreferrer">steg för steg här</a>.';
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

  // Sparad körning? Erbjud återupptagning — de klara stegen är redan betalda.
  const saved = state.demo ? null : loadRun();
  if (saved && saved.intake && (saved.team || (saved.r && Object.keys(saved.r).length))) {
    const box = el("div", "resume-box");
    box.appendChild(el("div", "clarify-title", saved.team
      ? `Din senaste körning (${saved.intake.company}) är klar och finns kvar.`
      : `Du har en oavslutad körning för ${saved.intake.company} — de avklarade stegen finns kvar.`));
    const row = el("div", "clarify-actions");
    const go = el("button", "btn-primary", saved.team ? "Visa teamet igen" : "↻ Återuppta körningen"); go.type = "button";
    go.onclick = () => {
      state.lastRun = { intake: saved.intake, intakeBlock: buildIntakeBlock(saved.intake), r: saved.r || {} };
      if (saved.team) { state.team = saved.team; renderResult(saved.team); }
      else runBuild(saved.intake, saved.r || {});
    };
    const drop = el("button", "link-btn", "Släng den"); drop.type = "button";
    drop.onclick = () => { clearRun(); box.remove(); };
    row.append(go, drop); box.appendChild(row);
    wrap.appendChild(box);
  }

  const form = el("form", "intake");
  form.appendChild(fieldRow("Företag / projekt", inputEl("company", "company", "T.ex. CoachOnline")));
  // Etiketterna hette förut "Team-builder (för dig själv / tekniska)" och
  // "AI-konsult (för kunduppdrag)" — projektets egna arbetsnamn, obegripliga
  // för den som bara vill ha ett team. Värdena är oförändrade; det är bara
  // vad kunden ser som är omskrivet.
  const modeSel = selectEl("mode", "mode", [["team-builder", "Bara teamet — jag vet vad jag vill ha"], ["ai-consultant", "Teamet plus ett första projekt att börja med"]]);
  form.appendChild(fieldRow("Vad vill du få ut?", modeSel));
  const sizeSel = selectEl("size", "size", [["solo", "Solo (1 person)"], ["mikro", "Mikro (2)"], ["litet", "Litet team (3–10)"], ["medelstort", "Medelstort (10–100)"], ["stort", "Stort (100+)"]]);
  form.appendChild(fieldRow("Storlek", sizeSel));
  const matRow = fieldRow("AI-mognad", selectEl("maturity", "maturity", [["nybörjare", "Nybörjare — har inte börjat"], ["van", "Van — provat ChatGPT osv."], ["byggare", "Byggare — bygger redan egna verktyg"]]));
  matRow.style.display = "none"; form.appendChild(matRow);
  modeSel.onchange = () => { matRow.style.display = modeSel.value === "ai-consultant" ? "" : "none"; };

  // Arbetsledarläge: kunder som redan betalar för en egen AI (ChatGPT m.fl.)
  // kan låta teamet briefa/coacha i stället för att utföra — portalen förblir
  // navet (rutiner, minne, uppföljning), utförandet sker i kundens AI.
  form.appendChild(fieldRow("Hur ska teamet arbeta?", selectEl("workstyle", "workstyle", [
    ["team", "Teamet gör jobbet — allt sker i portalen (standard)"],
    ["coach", "Arbetsledarläge — teamet briefar & coachar, ni kör er egen AI (t.ex. ChatGPT)"],
  ])));

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

  // Valbar förvalsenkät — för den som tycker det är svårt att formulera sin
  // verksamhet i fritext. Allt går att kryssa, inget kräver text.
  form.appendChild(renderSurvey());

  // Strukturerat frågeformulär istället för en tom textruta — kunden vet vad
  // den ska svara på, och research-steget får jämnt råmaterial i exakt det
  // format intake-kontraktet (prompts/shared/research.md) kräver.
  const taEl = (name, rows, ph) => { const t = el("textarea", "intake-text"); t.name = name; t.id = "f-" + name; t.rows = rows; t.placeholder = ph || ""; return t; };
  form.appendChild(fieldRow("Vad gör företaget?", taEl("what", 2, "1–2 meningar. T.ex: Livs- och karriärcoach som säljer 1-on-1-sessioner online. Har du fyllt i enkäten räcker det att komplettera med det den inte fångar.")));
  form.appendChild(fieldRow("Veckans återkommande moment — vad tar mest tid?", taEl("moments", 4, "De 2–4 moment som återkommer varje vecka, gärna med ungefärlig tid.\nT.ex: 1) Nyhetsbrev och blogg, 5–7 h. 2) Svara på inkommande leads (mail, DM).")));
  form.appendChild(fieldRow("Var klämmer skon?", taEl("pains", 2, "Det som är frustrerande eller blir liggande. Valfritt men gör analysen skarpare.")));
  form.appendChild(fieldRow("Program & system ni använder dagligen", inputEl("tools", "tools", "T.ex. Fortnox, Outlook, Shopify, Google Kalender")));
  form.appendChild(fieldRow("Vad ska AI-teamet uppnå?", inputEl("goals", "goals", "T.ex. frigöra 5 h/vecka från admin till betalt arbete")));
  form.appendChild(fieldRow("Något AI inte ska röra?", inputEl("nogo", "nogo", "T.ex. kundsamtalen, prissättningen. Lämna tomt om inget.")));

  const err = el("div", "fin-err"); err.id = "form-err"; err.style.display = "none";
  form.appendChild(err);

  const btn = el("button", "btn-primary build-btn", "⚡ Bygg teamet"); btn.type = "submit";
  form.appendChild(btn);

  // Grov kostnadsbild vid knappen — ovisshet om pris är den största bromsen
  // för BYO-användare. Uppskattning, inte löfte; uppdateras med modellvalet.
  const costHint = el("div", "cost-hint");
  const paintCost = () => {
    if (state.demo) { costHint.textContent = "I demoläget anropas inget API — att bygga på riktigt kostar bara dina egna API-ören."; return; }
    costHint.textContent = isOpenRouter()
      ? "En körning gör 4–6 anrop via din OpenRouter-nyckel. Kostnaden beror på modellen — billiga modeller bygger ett team för under en krona."
      : (state.model.includes("opus")
        ? "En körning gör 4–6 anrop via din egen nyckel — med Opus typiskt ca 10–20 kr."
        : "En körning gör 4–6 anrop via din egen nyckel — med Sonnet typiskt ca 2–4 kr.");
  };
  paintCost();
  modelSel.addEventListener("change", paintCost);
  form.appendChild(costHint);
  form.onsubmit = (e) => {
    e.preventDefault();
    const intake = collect(form);
    intake.survey = surveyCollect();
    const sv = intake.survey || {};
    // Enkäten kan ersätta fritexten: bransch + kundbild räcker som "vad
    // företaget gör", och ≥3 ikryssade moment räcker som veckomoment.
    const surveyProfile = sv.industry && ((sv.customers || []).length || (sv.sales || []).length);
    const surveyMoments = (sv.moments || []).length + (sv.tidstjuvar || []).length;
    if (!intake.company) {
      err.textContent = "Fyll i företagets eller projektets namn."; err.style.display = "block"; return;
    }
    if ((!intake.what || intake.what.trim().length < 10) && !surveyProfile) {
      err.textContent = "Beskriv vad företaget gör med en mening — eller öppna enkäten och välj bransch + kunder."; err.style.display = "block"; return;
    }
    if ((!intake.moments || intake.moments.trim().length < 20) && surveyMoments < 3) {
      err.textContent = "Veckans moment är det viktigaste underlaget — beskriv ett par moment i fritext eller kryssa i minst tre i enkäten."; err.style.display = "block"; return;
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

// ---------- förvalsenkät ----------
// UI för window.BUILDER_SURVEY (builder/survey-data.js). Helt valbar: chips
// som togglas med klick, inga textfält. Moments-sektionen har tre lägen:
// av → ingår i vardagen → stor tidstjuv (⏱) → av.
let surveyState = null;
function newSurveyState() {
  const s = { single: {}, multi: {}, momSel: new Set(), momHot: new Set() };
  (window.BUILDER_SURVEY?.sections || []).forEach((sec) => {
    if (sec.type === "multi") s.multi[sec.key] = new Set();
    if (sec.type === "single") s.single[sec.key] = null;
  });
  return s;
}
function surveyCount() {
  if (!surveyState) return 0;
  let n = surveyState.momSel.size + surveyState.momHot.size;
  Object.values(surveyState.single).forEach((v) => { if (v) n++; });
  Object.values(surveyState.multi).forEach((set) => { n += set.size; });
  return n;
}
function surveyCollect() {
  if (!surveyState) return null;
  const out = {
    industry: surveyState.single.industry || null,
    rhythm: surveyState.single.rhythm || null,
    ownai: surveyState.single.ownai || null,
    customers: [...(surveyState.multi.customers || [])],
    sales: [...(surveyState.multi.sales || [])],
    tools: [...(surveyState.multi.tools || [])],
    channels: [...(surveyState.multi.channels || [])],
    goals: [...(surveyState.multi.goals || [])],
    nogo: [...(surveyState.multi.nogo || [])],
    moments: [...surveyState.momSel],
    tidstjuvar: [...surveyState.momHot],
  };
  return surveyCount() ? out : null;
}

function renderSurvey() {
  surveyState = newSurveyState();
  const data = window.BUILDER_SURVEY;
  const wrap = el("div", "survey-wrap");
  if (!data || !Array.isArray(data.sections)) return wrap; // datafilen saknas — formuläret funkar ändå

  const toggle = el("button", "survey-toggle"); toggle.type = "button";
  const tLabel = el("span", "survey-toggle-label", "📋 Svårt att sätta ord på verksamheten? Öppna enkäten och kryssa i stället");
  const tBadge = el("span", "survey-badge"); tBadge.style.display = "none";
  const tChev = el("span", "survey-chev", "▾");
  toggle.append(tLabel, tBadge, tChev);
  wrap.appendChild(toggle);

  const body = el("div", "survey-body");
  body.appendChild(el("p", "survey-lead", "Allt är valfritt och går att kryssa utan att skriva något. Dina val vävs in i analysen tillsammans med det du eventuellt skriver i fälten nedanför."));

  const updateBadge = () => {
    const n = surveyCount();
    tBadge.textContent = n ? `${n} val` : "";
    tBadge.style.display = n ? "" : "none";
  };

  const chip = (label, getState, cycle) => {
    const b = el("button", "schip", label); b.type = "button";
    const paint = () => {
      const st = getState();
      b.classList.toggle("sel", st === 1 || st === 2);
      b.classList.toggle("hot", st === 2);
    };
    b.onclick = () => { cycle(); paint(); updateBadge(); };
    paint();
    return b;
  };

  data.sections.forEach((sec) => {
    const box = el("div", "survey-sec");
    box.appendChild(el("div", "survey-sec-title", sec.title));
    if (sec.hint) box.appendChild(el("div", "survey-hint", sec.hint));

    if (sec.type === "moments") {
      (sec.groups || []).forEach((g) => {
        box.appendChild(el("div", "survey-group-label", g.label));
        const row = el("div", "survey-chips");
        g.items.forEach((item) => {
          row.appendChild(chip(item,
            () => surveyState.momHot.has(item) ? 2 : surveyState.momSel.has(item) ? 1 : 0,
            () => {
              if (surveyState.momHot.has(item)) surveyState.momHot.delete(item);
              else if (surveyState.momSel.has(item)) { surveyState.momSel.delete(item); surveyState.momHot.add(item); }
              else surveyState.momSel.add(item);
            }));
        });
        box.appendChild(row);
      });
    } else if (sec.type === "single") {
      const row = el("div", "survey-chips");
      sec.options.forEach((opt) => {
        row.appendChild(chip(opt,
          () => surveyState.single[sec.key] === opt ? 1 : 0,
          () => { surveyState.single[sec.key] = surveyState.single[sec.key] === opt ? null : opt; }));
      });
      box.appendChild(row);
      // Radio-beteende: måla om alla chips i sektionen när ett val görs.
      row.addEventListener("click", () => {
        [...row.children].forEach((c) => c.classList.toggle("sel", surveyState.single[sec.key] === c.textContent));
      });
    } else {
      const row = el("div", "survey-chips");
      sec.options.forEach((opt) => {
        row.appendChild(chip(opt,
          () => surveyState.multi[sec.key].has(opt) ? 1 : 0,
          () => { surveyState.multi[sec.key].has(opt) ? surveyState.multi[sec.key].delete(opt) : surveyState.multi[sec.key].add(opt); }));
      });
      box.appendChild(row);
    }
    body.appendChild(box);
  });

  wrap.appendChild(body);
  toggle.onclick = () => {
    const open = wrap.classList.toggle("open");
    tChev.textContent = open ? "▴" : "▾";
  };
  return wrap;
}

// ---------- intake block ----------
// Mappar formuläret till intake-kontraktet i prompts/shared/research.md —
// samma sektioner (inkl. ## Avgränsningar) som intervju-prompterna levererar.
// Enkätsvaren (intake.survey) vävs in i respektive sektion: fritext först
// (användarens egna ord väger tyngst i research), förval som komplement.
function buildIntakeBlock(intake) {
  const val = (v, alt) => (v && v.trim() ? v.trim() : alt);
  const sv = intake.survey || {};
  const list = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");

  // Fritext + enkätrader kombinerat; alt används bara om båda saknas.
  const merge = (free, surveyLines, alt) => {
    const parts = [];
    if (free && free.trim()) parts.push(free.trim());
    surveyLines.forEach((l) => { if (l) parts.push(l); });
    return parts.length ? parts.join("\n") : alt;
  };

  const what = merge(intake.what, [
    !intake.what?.trim() && sv.industry
      ? `(Fri beskrivning saknas — ur enkäten: ${sv.industry}${list(sv.customers) ? ", säljer till " + list(sv.customers).toLowerCase() : ""}${list(sv.sales) ? ", via " + list(sv.sales).toLowerCase() : ""}.)`
      : null,
  ], "(saknas)");

  const moments = merge(intake.moments, [
    list(sv.moments) ? `Ur enkäten — ingår i vardagen: ${list(sv.moments)}.` : null,
    list(sv.tidstjuvar) ? `Ur enkäten — markerade som STORA TIDSTJUVAR: ${list(sv.tidstjuvar)}. Väg dessa tyngst.` : null,
  ], "(saknas)");

  const pains = merge(intake.pains, [
    list(sv.tidstjuvar) ? `Tidstjuvarna ur enkäten (${list(sv.tidstjuvar)}) är sannolikt där det klämmer.` : null,
  ], "Framgår inte uttryckligen — härled försiktigt ur momenten.");

  const tools = merge(intake.tools, [
    list(sv.tools) ? `Ur enkäten: ${list(sv.tools)}.` : null,
  ], "Okänt.");

  const goals = merge(intake.goals, [
    list(sv.goals) ? `Ur enkäten: ${list(sv.goals)}.` : null,
  ], "Frigöra tid från de mest återkommande momenten.");

  // "Inget särskilt …" är ett aktivt icke-svar, inte en avgränsning.
  const nogoChoices = (sv.nogo || []).filter((x) => !/^inget särskilt/i.test(x));
  const nogo = merge(intake.nogo, [
    nogoChoices.length ? `Ur enkäten: ${nogoChoices.join(", ")}.` : null,
  ], "Inga uttryckliga avgränsningar.");

  // Profilrader som saknar egen sektion i kontraktet — extra kontext för research.
  const profile = [
    list(sv.customers) ? `kunder:         ${list(sv.customers)}` : null,
    list(sv.sales) ? `försäljning:    ${list(sv.sales)}` : null,
    list(sv.channels) ? `kanaler:        ${list(sv.channels)}` : null,
    sv.rhythm ? `årsrytm:        ${sv.rhythm}` : null,
    sv.ownai && !/^nej/i.test(sv.ownai) ? `egen_ai:        ${sv.ownai}` : null,
  ].filter(Boolean);

  // Arbetsledarläget påverkar VAD agenterna levererar — research/proposal ska
  // känna till det, så det går in som egen intake-sektion.
  const coach = intake.workstyle === "coach";

  return [
    "```",
    `företagsnamn:   ${intake.company}`,
    `bransch:        ${sv.industry || "(härled ur beskrivningen)"}`,
    `storlek:        ${intake.size}`,
    `läge:           ${intake.mode}`,
    intake.maturity ? `ai_mognad:      ${intake.maturity}` : null,
    `källa:          intervju`,
    ...profile,
    "",
    "## Vad företaget gör",
    what,
    "",
    "## Återkommande moment",
    moments,
    "",
    "## Var det klämmer",
    pains,
    "",
    "## Befintliga verktyg och vanor",
    tools,
    "",
    "## Mål och ambition",
    goals,
    "",
    "## Avgränsningar",
    nogo,
    coach ? `\n## Arbetssätt (viktigt för förslaget)\nKunden vill fortsätta göra själva utförandet i sin egen AI${sv.ownai && !/^nej/i.test(sv.ownai) ? ` (${sv.ownai})` : " (t.ex. ChatGPT)"}. Teamets agenter ska därför ARBETSLEDA, inte utföra: varje agents Leverans blir ett arbetspaket — en kort brief, en FÄRDIG självbärande prompt att klistra in i kundens AI, och en "Klart när"-checklista för att bedöma resultatet. Portalen förblir navet för rutiner, minne och uppföljning.` : null,
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

// ---------- körnings-persistens ----------
// Varje avklarat steg skrivs till localStorage så att fel, F5 eller en stängd
// flik aldrig kostar redan betalda API-anrop. team följer med när det är klart.
function saveRun(team) {
  if (!state.lastRun) return;
  try {
    localStorage.setItem(RUN_STORAGE, JSON.stringify({ intake: state.lastRun.intake, r: state.lastRun.r, team: team || null, at: Date.now() }));
  } catch (_) { /* full storage — körningen fungerar ändå, bara utan skyddsnät */ }
}
function loadRun() { try { return JSON.parse(localStorage.getItem(RUN_STORAGE) || "null"); } catch (_) { return null; } }
function clearRun() { localStorage.removeItem(RUN_STORAGE); }

// ---------- pipeline ----------
// prevR: redan avklarade stegresultat (från en avbruten körning) — steg med
// resultat hoppas över, så en återupptagning bara betalar för det som saknas.
async function runBuild(intake, prevR) {
  if (state.demo) return runDemoBuild(intake);
  if (state.busy) return;
  state.busy = true;
  state.abort = new AbortController();
  const intakeBlock = buildIntakeBlock(intake);
  const r = prevR || {};
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

  let current = null;
  try {
    for (const stg of stages) {
      current = stg;
      setStage(stg.key);
      if (stg.key === "structure") {
        const teamObj = await structureWithStatus(intake, r);
        markDone(stg.key);
        state.team = teamObj;
        saveRun(teamObj);
        renderResult(teamObj);
        return;
      }
      if (stg.store && r[stg.store]) { markDone(stg.key); continue; } // klar sedan tidigare — betala inte igen
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
      saveRun();
      markDone(stg.key);
    }
  } catch (err) {
    if (err.name === "AbortError") { renderForm(); }
    else {
      if (!err.stage && current) err.stage = current.key;
      renderError(err.message, err.stage === "structure", err.stage !== "structure");
    }
  } finally {
    state.busy = false;
  }
}

// Sammanställningssteget är långt (upp till 16k tokens, icke-strömmat) och
// kom precis vid klimaxet — utan livstecken ser det ut som en hängning.
// Töm panelen och visa förfluten tid tills svaret landar.
async function structureWithStatus(intake, r) {
  const panel = $("#analysis-text");
  const started = Date.now();
  const paint = () => {
    const s = Math.round((Date.now() - started) / 1000);
    if (panel) panel.textContent = `Formaterar teamet för portalen — alla beslut är redan fattade, inget innehåll ändras.\n\nDet här brukar ta 1–2 minuter. (${s} s)`;
  };
  paint();
  const timer = setInterval(paint, 1000);
  try {
    return await structureTeam(intake, r);
  } finally {
    clearInterval(timer);
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
  "divergence": string,
  "rejected": [{ "name": string, "why": string }],
  "routines": [{ "label": string, "agentId": string, "day": number|null, "timeEstimate": number|null, "auto": boolean, "prompt": string }],
  "seasons": [{ "label": string, "month": number, "day": number|null, "agentId": string|null, "prompt": string|null }],
  "agents": [{
    "id": string, "name": string, "icon": string, "role": string, "tagline": string,
    "always": boolean, "job": string, "why": string, "capabilities": [string], "triggers": [string],
    "starters": [string], "system": string
  }]
}`;
  const coachRules = intake.workstyle === "coach" ? `

ARBETSLEDARLÄGE (viktigt): kunden gör själva utförandet i sin egen AI (t.ex. ChatGPT). Varje agents system-prompt ska instruera agenten att leverera ARBETSPAKET i stället för färdigt innehåll: 1) kort brief (vad och varför), 2) en FÄRDIG självbärande prompt i ett \`\`\`-kodblock — med all kontext kundens AI behöver inbakad, 3) "Klart när"-checklistan att bedöma resultatet mot, 4) erbjudande att kvalitetsgranska om kunden klistrar tillbaka resultatet. Starters formuleras som arbetspaket-beställningar ("Gör ett arbetspaket för veckans nyhetsbrev").` : "";
  const sys = `Du sammanställer ett redan färdigt agent-team till strukturerad JSON för rendering och för en kundportal.

HÄMTA ALLT INNEHÅLL FRÅN FÖRSLAGET OCH RESEARCHEN NEDAN. Fabricera inget, lägg inte till eller ta bort agenter, ändra inte besluten. Du formaterar bara om — innehållet är redan bestämt.

${PORTAL_RULES}${coachRules}

VD-assistenten ska ha id "vd-assistent" och vara först i listan, sedan VD (id "vd"), sedan specialister i prioritetsordning. always=true för VD och VD-assistent. VD ⚡, VD-assistent 🧭, domän-emoji för specialister. Avvisade moment kommer från researchen/förslaget (minst ett).

DIVERGENCE: en mening ur proposalens/researchens divergens-check — varför just DETTA team inte skulle passa en annan aktör i samma bransch ("Skulle det passa en annan keramiker? Nej, för …"). Hämta ur underlaget; finns ingen divergens-check, härled den ur teamets mest verksamhetsspecifika val.

SEASONS: kundens årshjul — BARA händelser som uttryckligen nämns i intake/research (mässor, deklarationsdatum, högsäsonger, ansökningsdeadlines). month 1–12, day om känd annars null, agentId = mest relevant agent annars null, prompt = valfri startuppgift i du-form. Fabricera inga datum; tom lista om årsrytmen är okänd. Portalen påminner kunden i förväg ("X dagar till mässan").

RUTINER: 3–5 stående rutiner hämtade ur kundens faktiska veckomoment (inte påhittade). label = kort namn; agentId = agenten som äger momentet; day = veckodag 1–7 (1=måndag) om momentet är dagbundet, annars null; timeEstimate = minuter momentet brukar ta manuellt ENLIGT RESEARCHEN (null om researchen inte anger tid — hitta aldrig på); auto = true på HÖGST EN rutin och bara om dess prompt är komplett utan [fyll i]-luckor (portalen kör den då automatiskt på rätt dag), annars false; prompt = uppgiften i du-form med [fyll i]-luckor för det agenten behöver av användaren, konkret nog att skicka direkt.

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
  // Ingen defaultModel: modellen är låst i atb-claude.js och samma för alla.
  // Ett fält som ser ut som ett val men inte är det förvirrar den som läser
  // konfigen — och den är gjord för att läsas.
  team.workstyle = intake.workstyle === "coach" ? "coach" : null;
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
    const teamObj = await structureWithStatus(state.lastRun.intake, state.lastRun.r);
    state.team = teamObj;
    saveRun(teamObj);
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

  // Undertexter som förklarar vad som händer — och lyfter att analysen även
  // säger NEJ (avvisningarna är förtroendeargumentet, inte en bieffekt).
  const STAGE_SUBS = {
    research: "Letar konkreta veckomoment — och sorterar bort det som vore AI-teater. Nejen syns i texten.",
    scale: "Hur många agenter förtjänar underlaget? Fler är inte bättre.",
    proposal: "Varje agent måste motiveras av ett konkret fynd — annars ryker den.",
    firstproject: "Ett första projekt som ger resultat inom en vecka.",
    structure: "Formaterar för portalen — inga nya beslut fattas.",
  };
  const steps = el("div", "prog-steps");
  stages.forEach((s, i) => {
    const st = el("div", "prog-step"); st.dataset.stage = s.key;
    st.appendChild(el("span", "prog-dot"));
    const meta = el("span", "prog-meta");
    meta.appendChild(el("span", "prog-label", `${i + 1} · ${s.label}`));
    if (STAGE_SUBS[s.key]) meta.appendChild(el("span", "prog-sub", STAGE_SUBS[s.key]));
    st.appendChild(meta);
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
  // Autospara utkastet direkt — ett färdigt team ska aldrig kunna försvinna
  // för att användaren råkade ladda om innan den tryckte "Prova teamet live".
  if (!state.demo) { try { localStorage.setItem(DRAFT_STORAGE, JSON.stringify(stripTeam(team))); } catch (_) { /* full storage */ } }
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
  // Delbar länk utan server: hela konfigen komprimeras in i URL-fragmentet
  // (#cfg=…) — fragment skickas aldrig till servern. Mottagaren öppnar
  // teamet direkt i portalen med sin egen nyckel.
  const share = el("button", "btn-ghost", "🔗 Kopiera delningslänk");
  share.onclick = async () => {
    try {
      const b64 = await window.ATBClaude.encodeTeamLink(stripTeam(team));
      const url = new URL("../portal/", location.href).href + "#cfg=" + b64;
      await navigator.clipboard.writeText(url);
      share.textContent = "Kopierad ✓ — skicka länken";
    } catch (_) { share.textContent = "Kunde inte kopiera"; }
    setTimeout(() => (share.textContent = "🔗 Kopiera delningslänk"), 2400);
  };
  // Spara i molnet = köp. Allt annat i den här raden händer i webbläsaren;
  // det här är det enda som lämnar den, och därför det enda som kostar.
  const buy = el("button", "btn-ghost", "☁ Spara i molnet");
  buy.onclick = () => renderPurchase(team, hero, buy);
  const again = el("button", "btn-ghost", "↺ Bygg ett till");
  again.onclick = () => renderForm();
  actions.append(live, dl, share, buy, again); hero.appendChild(actions);
  wrap.appendChild(hero);

  if (team.divergence) {
    const dv = el("p", "divergence");
    dv.textContent = "🧭 " + team.divergence;
    dv.title = "Divergens-checken: därför skulle det här teamet inte passa en annan aktör i samma bransch";
    wrap.appendChild(dv);
  }

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
  if (a.why) c.appendChild(el("p", "why", "→ " + a.why)); // kopplingen till kundens egna ord
  if (Array.isArray(a.capabilities) && a.capabilities.length) { c.appendChild(el("div", "meta-label", "Kapaciteter")); const ul = el("ul", "caps"); a.capabilities.forEach((x) => ul.appendChild(el("li", null, x))); c.appendChild(ul); }
  if (Array.isArray(a.triggers) && a.triggers.length) { c.appendChild(el("div", "meta-label", "Triggas av")); const ch = el("div", "chips"); a.triggers.forEach((x) => ch.appendChild(el("span", "chip", x))); c.appendChild(ch); }
  return c;
}

function stripTeam(team) {
  // job/capabilities/starters följer med till portalen — de driver agentkortet
  // ("det här kan jag hjälpa dig med" + klickbara exempeluppgifter).
  // routines + firstProject driver arbetsytan (rutinlistan och 🎯-panelen).
  // rejected + divergence + why följer med — de driver portalens
  // "Därför ser ert team ut så här"-sida (anställningsceremonin).
  return { company: team.company, tagline: team.tagline, language: "sv", entryAgent: team.entryAgent,
    routines: Array.isArray(team.routines) ? team.routines : [],
    seasons: Array.isArray(team.seasons) ? team.seasons : [],
    firstProject: team.firstProject || null,
    divergence: team.divergence || null,
    rejected: Array.isArray(team.rejected) ? team.rejected : [],
    workstyle: team.workstyle || null,
    agents: team.agents.map((a) => ({ id: a.id, name: a.name, icon: a.icon, avatarN: a.avatarN, role: a.role, tagline: a.tagline, always: !!a.always,
      job: a.job, why: a.why || null, capabilities: a.capabilities, starters: a.starters, system: a.system })) };
}
// ---------- köp ("Spara i molnet") ----------
//
// De två nivåerna som går att leverera i dag. 190 kr och 490 kr/mån kräver en
// proxy på vår nyckel med kvotmätning — den finns inte, och tills den gör det
// ska de inte gå att köpa. Priserna här är etiketter; beloppen som dras kommer
// från Stripe, och prislistan i index.html och villkor.html § 4 måste följa med
// om de ändras.
const PLANS = [
  { tier: "trial-byo", label: "Provmånad", price: "90 kr", note: "En månad med teamet i portalen, på er egen API-nyckel. Ingen bindning." },
  { tier: "buy", label: "Köp teamet", price: "4 990 kr", note: "Teamet är ert, med uppdateringar. Engångsbetalning." },
];

// Nyckelrutan inuti köppanelen. Samma validering, samma test och samma
// hjälplänk som den stora nyckelrutan — den som möter grinden här ska få exakt
// de besked hen hade fått på nyckelsidan. Låser upp planknapparna först när
// nyckeln har svarat OK, och sparar den där portalen läser den.
// onVerified körs när nyckeln testats OK. Att den skickas in i stället för att
// grinden själv vet vad som ska hända gör att samma grind kan användas både
// för att låsa upp ett köp och för att släppa in någon i ett riktigt bygge.
function buildKeyGate(onVerified, okLead) {
  const box = el("div", "buy-keygate");
  box.appendChild(el("div", "clarify-title", "Först: koppla in din nyckel"));

  const lead = el("p", "buy-keygate-lead");
  lead.innerHTML = "Teamet drivs av din egen nyckel hos OpenRouter — det är den som gör att agenterna faktiskt kan svara dig. " +
    "Utan nyckel kommer du inte in i teamet ens efter att du betalat, och då har vi tagit betalt för en stängd dörr. " +
    "Därför testar vi nyckeln här i stället, innan pengarna byter ägare. Den sparas bara i den här webbläsaren och följer med till portalen, " +
    'så du slipper klistra in den igen. <a href="../#forbrukning" target="_blank" rel="noreferrer">Har du ingen nyckel? Så skaffar du en på fem minuter →</a>';
  box.appendChild(lead);

  const row = el("div", "buy-keygate-row");
  const input = el("input");
  input.type = "password"; input.placeholder = "sk-or-..."; input.spellcheck = false;
  input.setAttribute("aria-label", "API-nyckel från OpenRouter");
  const btn = el("button", "btn-primary", "Testa nyckeln");
  btn.type = "button";
  row.append(input, btn);
  box.appendChild(row);

  const err = el("div", "buy-keygate-err"); err.style.display = "none";
  box.appendChild(err);

  btn.onclick = async () => {
    const v = input.value.trim();
    btn.disabled = true; btn.textContent = "Testar nyckeln…"; err.style.display = "none";
    const bad = await checkApiKey(v);
    if (bad) {
      showKeyError(err, bad);
      btn.disabled = false; btn.textContent = "Testa nyckeln"; return;
    }
    saveVerifiedKey(v);
    // Grinden byts mot ett kvitto: kunden ska se att just det här steget är
    // avklarat, inte bara att knapparna plötsligt går att trycka på.
    box.innerHTML = "";
    box.classList.add("ok");
    box.appendChild(el("div", "buy-keygate-ok", "✓ Nyckeln fungerar och är sparad i den här webbläsaren."));
    box.appendChild(el("p", "buy-keygate-lead", okLead || "Portalen hittar den automatiskt när du loggat in. Välj hur du vill spara teamet nedan."));
    if (typeof onVerified === "function") onVerified();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  return box;
}

function renderPurchase(team, hero, trigger) {
  if (hero.querySelector(".buy-panel")) return; // redan öppen
  trigger.disabled = true;

  const panel = el("div", "buy-panel");
  panel.style.cssText = "margin-top:20px;padding:18px;border:1px solid var(--border);border-radius:6px;background:var(--surface);text-align:left";

  // Demoläget säljer inte demoteamet. Körningen är inspelad och gjord åt ett
  // påhittat företag — att ta betalt för den vore att sälja någon annans team
  // till någon som tror att det är sitt. Nyckelgrinden räckte inte mot det:
  // den ser till att kunden KAN öppna dörren, inte att det ligger rätt sak
  // bakom den. Här blir köpknappen i stället vägen till ett riktigt bygge.
  if (state.demo) {
    panel.appendChild(el("div", "eyebrow", "Först: bygg ditt eget team"));
    const dl = el("p");
    dl.style.cssText = "color:var(--text-dim);margin:8px 0 16px;line-height:1.6";
    dl.textContent = "Det du ser nu är en inspelad demo åt ett påhittat företag — vi säljer inte den. " +
      "Koppla in din nyckel, så kör vi samma sak mot din verksamhet i stället. Det tar ungefär en kvart och " +
      "kostar åtta öre i API-förbrukning. Först när du har ett team som faktiskt handlar om dig är det något värt att spara.";
    panel.appendChild(dl);
    panel.appendChild(buildKeyGate(
      () => { state.demo = false; renderForm(); },
      "Nu bygger vi mot din verksamhet. Formuläret öppnas — fyll i det, så får du ditt eget team."
    ));
    const back = el("button", "btn-ghost", "Inte nu");
    back.style.marginTop = "4px";
    back.onclick = () => { panel.remove(); trigger.disabled = false; };
    panel.appendChild(back);
    hero.appendChild(panel);
    return;
  }

  panel.appendChild(el("div", "eyebrow", "Spara teamet hos oss"));

  const lead = el("p");
  lead.style.cssText = "color:var(--text-dim);margin:8px 0 16px;line-height:1.6";
  lead.textContent = "Teamet finns just nu bara i den här webbläsaren. Sparar ni det hos oss får ni ett konto och kommer åt det från vilken dator som helst — inloggning med en kod till mejlen, inget lösenord.";
  panel.appendChild(lead);

  const status = el("p");
  status.style.cssText = "color:var(--text-dim);margin:14px 0 0;min-height:20px";

  // Nyckelgrind. Den som byggt på riktigt har redan en verifierad nyckel — den
  // krävdes för att komma hit, och då ska ingenting stå i vägen för köpet. Den
  // som kommer ur demoläget har ingen, och skulle utan grinden upptäcka kravet
  // först efter betalningen, inne i portalen: betalt för en dörr hon inte kan
  // öppna. Det är kundresans värsta fel, och en varningsruta räcker inte mot
  // det — den går att klicka förbi. Därför får planknapparna inte gå att trycka
  // på förrän en nyckel faktiskt har testats mot leverantören.
  const needsKey = !state.apiKey;
  const planBtns = [];

  PLANS.forEach((plan) => {
    const row = el("button", "btn-ghost");
    row.style.cssText = "display:block;width:100%;text-align:left;margin-bottom:8px";
    row.innerHTML = `<b>${esc(plan.label)} — ${esc(plan.price)}</b><br><span style="color:var(--text-dim);font-weight:400">${esc(plan.note)}</span>`;
    row.disabled = needsKey;
    planBtns.push(row);
    row.onclick = async () => {
      panel.querySelectorAll("button").forEach((b) => (b.disabled = true));
      status.textContent = "Öppnar betalningen…";
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tier: plan.tier, config: stripTeam(team) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || "kunde inte starta betalningen");
        // Samma flik, inte ny: en popup-blockerare får aldrig stå mellan en
        // kund och en kassa. Teamet ligger kvar i localStorage om hen ångrar sig.
        location.href = data.url;
      } catch (e) {
        panel.querySelectorAll("button").forEach((b) => (b.disabled = false));
        status.textContent = "Det gick inte: " + ((e && e.message) || "okänt fel") + ". Teamet ligger kvar — prova igen, eller ladda ner configen så länge.";
      }
    };
    panel.appendChild(row);
  });

  if (needsKey) panel.insertBefore(buildKeyGate(() => planBtns.forEach((b) => (b.disabled = false))), planBtns[0]);

  const cancel = el("button", "btn-ghost", "Inte nu");
  cancel.style.marginTop = "4px";
  cancel.onclick = () => { panel.remove(); trigger.disabled = false; };
  panel.append(cancel, status);
  hero.appendChild(panel);
}

function downloadConfig(team) {
  const js = "// Genererad av Builder. Lägg i portal/teams/ och registrera i index.js.\nwindow.TEAM = " + JSON.stringify(stripTeam(team), null, 2) + ";\n";
  const url = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
  const a = el("a"); a.href = url; a.download = `${team.slug}.js`; a.click(); URL.revokeObjectURL(url);
}

function renderError(msg, canRetryStructure, canResume) {
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
  if (canResume && state.lastRun) {
    // Färdiga steg ligger i state.lastRun.r (och i localStorage) — kör vidare
    // därifrån i stället för att börja om och betala om researchen.
    const resume = el("button", "btn-primary", "↻ Fortsätt från steget som misslyckades");
    resume.onclick = () => runBuild(state.lastRun.intake, state.lastRun.r);
    actions.appendChild(resume);
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
