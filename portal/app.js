/* ============================================================
   Agent Team Builder — Kundportal
   Statisk app. Kundens egen Anthropic-nyckel lagras lokalt i
   webbläsaren och anropar Claude direkt. Ingen backend.

   Multi-tenant: ?team=<slug> laddar portal/teams/<slug>.js.
   Utan parameter visas en kundväljare (window.TEAMS).
   __draft laddar ett utkast byggt i Builder-appen (localStorage).
   ============================================================ */

const KEY_STORAGE = "atb_api_key";
const MODEL_STORAGE = "atb_model";
const HIST_PREFIX = "atb_hist_"; // + team-slug → sparad chatthistorik
const DEFAULT_MODEL = "claude-sonnet-4-6"; // billig default för BYO-kund; kan höjas till Opus i UI
// API-URL, anthropic-version och själva strömningen ligger i ../atb-claude.js
// (window.ATBClaude) — delat med Buildern så de inte kan glida isär.

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — snabb & prisvärd (rekommenderad)" },
  { id: "claude-opus-4-8", label: "Opus 4.8 — mest kapabel" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — billigast" },
];

let team = null; // sätts när ett team laddats
const state = {
  apiKey: localStorage.getItem(KEY_STORAGE) || "",
  model: localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL,
  // Demoläge: bläddra och chatta utan nyckel — svaren är förskrivna exempel.
  // Aktiveras via knapp eller ?demo=1 (delbar demolänk).
  demo: new URLSearchParams(location.search).get("demo") === "1",
  slug: null, // aktivt teams slug — nyckel för sparad historik
  activeAgentId: null,
  history: {}, // { [agentId]: [{role, content}] }
  streaming: false,
  chatAbort: null, // AbortController för pågående svar (stoppknappen)
};

// ---------- persistent historik ----------
// Chatten överlever sidladdningar: historiken sparas per team i localStorage.
// Utan detta tappar en kund som stänger fliken allt — då är portalen en
// leksak, inte ett arbetsverktyg.
function loadHistory(slug) {
  try {
    const raw = localStorage.getItem(HIST_PREFIX + slug);
    const h = raw ? JSON.parse(raw) : null;
    return h && typeof h === "object" ? h : {};
  } catch (_) { return {}; }
}
function saveHistory() {
  if (!state.slug) return;
  try {
    // Tak per agent så localStorage inte växer obegränsat (äldst ryker först).
    const capped = {};
    for (const [id, msgs] of Object.entries(state.history)) capped[id] = msgs.slice(-60);
    localStorage.setItem(HIST_PREFIX + state.slug, JSON.stringify(capped));
  } catch (_) { /* full/blockerad storage får aldrig krascha chatten */ }
}

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};
const agentById = (id) => team.agents.find((a) => a.id === id);
const getSlug = () => new URLSearchParams(location.search).get("team");
// Behåll demo=1 i alla interna länkar — annars dumpas en demo-besökare på
// nyckelskärmen vid första klicket (kundväljarkort, brand, mobilmeny).
const withDemo = (url) => (state.demo ? url + (url.includes("?") ? "&" : "?") + "demo=1" : url);
// Gör demoläget beständigt över sidladdningar (F5, delning) genom att
// spegla state.demo till URL:en — samma symmetri som connectKey städar bort den.
function enterDemo() {
  state.demo = true;
  const params = new URLSearchParams(location.search);
  if (params.get("demo") !== "1") {
    params.set("demo", "1");
    history.replaceState(null, "", location.pathname + "?" + params.toString());
  }
}

// ---------- avatarer ----------
// Tilldelningslogiken är delad (../avatars.js → window.ATBAvatars) så att
// portal, builder, verticals och galleri ger samma agent samma porträtt.
// Varje agent får ett `avatarN` (1..25) om den saknar det; bilden ligger i
// portal/avatars/ och refereras härifrån med basen "avatars/". Ett uttryckligt
// `avatar`-fält (full sökväg) i team-konfigen vinner alltid.
const AVATAR_BASE = "avatars/";
function assignAvatars(t) {
  if (window.ATBAvatars) window.ATBAvatars.assign(t);
}
function avatarSrcFor(agent) {
  if (agent.avatar) return agent.avatar; // uttryckligt val vinner
  if (agent.avatarN && window.ATBAvatars) return window.ATBAvatars.src(agent.avatarN, AVATAR_BASE);
  return null;
}

// Renderar en agents bild-avatar (om en finns) annars emoji-ikonen.
// Samma box-klass (.agent-icon/.chat-icon/.empty-icon) används i båda fallen,
// så styling och aktiv-glow funkar oavsett. Om bilden inte kan laddas faller
// vi tillbaka till emoji-ikonen så portalen aldrig visar en trasig bild.
function agentIcon(agent, cls) {
  const src = avatarSrcFor(agent);
  if (src) {
    const box = el("span", cls + " has-img");
    const img = el("img", "icon-img");
    img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    img.onerror = () => { box.classList.remove("has-img"); box.textContent = agent.icon || "•"; };
    box.appendChild(img);
    return box;
  }
  return el("span", cls, agent.icon);
}

function hubLink(cls) {
  const a = el("a", cls || "hublink", "← Agent Team Builder");
  a.href = "../";
  return a;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { s.remove(); resolve(); };
    s.onerror = () => { s.remove(); reject(new Error("Kunde inte ladda team: " + src)); };
    document.head.appendChild(s);
  });
}

async function loadTeam(slug) {
  window.TEAM = null;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(slug || "")) throw new Error("Ogiltig team-länk.");
  if (slug === "__draft" || slug === "__vertical") {
    // __draft = utkast från Builder; __vertical = branschsidornas demo-team.
    // Separata nycklar så en branschdemo aldrig skriver över ett Builder-bygge.
    const storageKey = slug === "__vertical" ? "atb_vertical_demo_team" : "atb_draft_team";
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error("Inget team-utkast hittades. Bygg ett i Builder först.");
    try {
      window.TEAM = JSON.parse(raw);
    } catch (_) {
      throw new Error("Utkastet i webbläsaren är skadat — bygg ett nytt i Builder.");
    }
  } else {
    try {
      await loadScript(`teams/${slug}.js`);
    } catch (_) {
      // Inte ett inbyggt team — försök hämta ett moln-sparat team (M2a, capability-URL).
      // Timeout så en seg/hängande request inte låser portalen; fel loggas men
      // sväljs så att vi faller igenom till "Hittade inget team"-meddelandet.
      const res = await window.ATBClaude.fetchWithTimeout(`/api/teams/${encodeURIComponent(slug)}`)
        .catch((e) => { console.warn("Moln-team kunde inte hämtas:", slug, e && e.message); return null; });
      if (res && res.ok) window.TEAM = await res.json().catch(() => null);
    }
  }
  if (!window.TEAM) throw new Error("Hittade inget team med den länken — kontrollera att den är komplett.");
  team = window.TEAM;
  // robusthet: säkerställ att teamet har agenter och en giltig ingångsagent
  if (!Array.isArray(team.agents) || team.agents.length === 0) {
    throw new Error("Teamet saknar agenter.");
  }
  assignAvatars(team); // ge varje agent en (stabil, slumpad) avatar om ingen är satt
  state.slug = slug;
  state.history = loadHistory(slug);
  state.activeAgentId = agentById(team.entryAgent) ? team.entryAgent : team.agents[0].id;
  if (!localStorage.getItem(MODEL_STORAGE) && team.defaultModel) state.model = team.defaultModel;
}

// ---------- boot ----------
async function boot() {
  if (!state.apiKey && !state.demo) { renderKeySetup(); return; }
  const slug = getSlug();
  if (!slug) { renderPicker(); return; }
  try {
    await loadTeam(slug);
    renderPortal();
  } catch (err) {
    renderPicker(err.message);
  }
}

// ---------- key setup ----------
function renderKeySetup() {
  const root = $("#root");
  root.innerHTML = "";
  const wrap = el("main", "setup");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", "🔑 Engångsuppkoppling"));
  const h = el("h1");
  h.innerHTML = `Koppla in ert <span class="grad">AI-team</span>`;
  wrap.appendChild(h);
  wrap.appendChild(el("p", "setup-lead", "Klistra in er egen Anthropic API-nyckel. Den sparas bara här i er webbläsare och skickas direkt till Claude — aldrig till någon annan server. Tips: använd en nyckel med begränsad budget."));

  const field = el("div", "setup-field");
  const input = el("input");
  input.type = "password"; input.id = "api-key-input"; input.placeholder = "sk-ant-...";
  input.autocomplete = "off"; input.spellcheck = false;
  input.setAttribute("aria-label", "Anthropic API-nyckel");
  field.appendChild(input);
  wrap.appendChild(field);

  const err = el("div", "setup-err"); err.style.display = "none"; wrap.appendChild(err);

  const btn = el("button", "btn-primary", "Anslut");
  btn.onclick = () => {
    const val = input.value.trim();
    if (!val.startsWith("sk-ant-")) {
      err.textContent = "Det ser inte ut som en Anthropic-nyckel (börjar med sk-ant-).";
      err.style.display = "block";
      return;
    }
    state.apiKey = val;
    localStorage.setItem(KEY_STORAGE, val);
    boot();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  wrap.appendChild(btn);

  const help = el("div", "setup-help");
  help.innerHTML = 'Har ni ingen nyckel än? Skapa en på <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a> — det tar någon minut.';
  wrap.appendChild(help);

  const demoBtn = el("button", "demo-link", "Eller utforska i demoläge utan nyckel →");
  demoBtn.onclick = () => { enterDemo(); boot(); };
  wrap.appendChild(demoBtn);

  root.appendChild(wrap);
  setTimeout(() => input.focus(), 50);
}

// Lämna demoläget och visa nyckel-skärmen (behåller vald team-slug i URL:en).
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

// ---------- team picker ----------
function renderPicker(errMsg) {
  const root = $("#root");
  root.innerHTML = "";
  const wrap = el("main", "picker");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", "Välj team"));
  const h = el("h1");
  h.innerHTML = `Vilket <span class="grad">team</span> vill ni öppna?`;
  wrap.appendChild(h);
  wrap.appendChild(el("p", "setup-lead", "Varje team är skräddarsytt för ett företag. Välj ett för att börja prata med agenterna."));

  if (errMsg) wrap.appendChild(el("div", "setup-err", "⚠️ " + errMsg));

  const teams = window.TEAMS || [];
  if (teams.length === 0) {
    wrap.appendChild(el("div", "picker-empty", "Inga team än — bygg ett i Builder så dyker det upp här."));
  } else {
    const grid = el("div", "picker-grid");
    teams.forEach((t) => {
      const card = el("a", "pcard");
      card.href = withDemo(`?team=${t.slug}`);
      card.title = t.tagline || t.company;
      card.appendChild(el("span", "pcard-icon", t.icon || "•"));
      const m = el("span", "pcard-meta");
      m.appendChild(el("span", "pcard-name", t.company || t.slug));
      m.appendChild(el("span", "pcard-tag", t.tagline || ""));
      card.appendChild(m);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  const reset = el("button", "link-btn", state.demo ? "Koppla in din nyckel" : "Byt API-nyckel");
  reset.style.marginTop = "26px";
  reset.onclick = state.demo ? connectKey : resetKey;
  wrap.appendChild(reset);

  root.appendChild(wrap);
}

function resetKey() {
  if (confirm("Ta bort den sparade nyckeln från den här webbläsaren?")) {
    localStorage.removeItem(KEY_STORAGE);
    state.apiKey = "";
    renderKeySetup();
  }
}

// ---------- portal shell ----------
function renderPortal() {
  const root = $("#root");
  root.innerHTML = "";
  const app = el("div", "app");
  app.appendChild(renderSidebar());
  app.appendChild(renderMain());
  root.appendChild(app);
  selectAgent(state.activeAgentId);
}

function renderSidebar() {
  const side = el("aside", "sidebar");

  const brand = el("a", "brand");
  brand.href = withDemo("./");
  brand.title = "Till kundväljaren";
  brand.appendChild(el("div", "brand-dot"));
  const bt = el("div");
  bt.appendChild(el("div", "brand-name", team.company));
  bt.appendChild(el("div", "brand-sub", "AI-team"));
  brand.appendChild(bt);
  side.appendChild(brand);

  const list = el("nav", "agent-list");
  list.setAttribute("aria-label", "Agenter");
  team.agents.forEach((a) => {
    const item = el("button", "agent-item");
    item.dataset.agent = a.id;
    item.title = a.tagline || a.name;
    item.appendChild(agentIcon(a, "agent-icon"));
    const meta = el("span", "agent-meta");
    meta.appendChild(el("span", "agent-name", a.name));
    meta.appendChild(el("span", "agent-role", a.tagline));
    item.appendChild(meta);
    item.onclick = () => selectAgent(a.id);
    list.appendChild(item);
  });
  side.appendChild(list);

  const foot = el("div", "side-foot");
  const hub = el("a", "hub-foot", "← Till hubben"); hub.href = "../";
  foot.appendChild(hub);
  const sl = el("label", "side-label", "Modell"); sl.setAttribute("for", "model-select");
  foot.appendChild(sl);
  const sel = el("select", "model-select"); sel.id = "model-select";
  MODELS.forEach((m) => {
    const o = el("option", null, m.label); o.value = m.id;
    if (m.id === state.model) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = () => { state.model = sel.value; localStorage.setItem(MODEL_STORAGE, sel.value); };
  foot.appendChild(sel);

  const reset = el("button", "link-btn", state.demo ? "Koppla in din nyckel" : "Byt API-nyckel");
  reset.onclick = state.demo ? connectKey : resetKey;
  foot.appendChild(reset);

  // "Glöm allt": nyckel + all chatthistorik + utkast. Det riktiga svaret på
  // "hur tömmer jag den här datorn?" — t.ex. efter en demo på kundens maskin.
  const wipe = el("button", "link-btn wipe-btn", "Töm allt härifrån");
  wipe.title = "Tar bort nyckel, chatthistorik och team-utkast från den här webbläsaren";
  wipe.onclick = wipeAll;
  foot.appendChild(wipe);
  side.appendChild(foot);

  return side;
}

function wipeAll() {
  if (!confirm("Ta bort ALLT sparat från den här webbläsaren?\n\n• API-nyckeln\n• All chatthistorik (alla team)\n• Team-utkast från Builder och branschsidorna")) return;
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k === KEY_STORAGE || k === MODEL_STORAGE || k === "atb_draft_team" || k === "atb_vertical_demo_team" || k.startsWith(HIST_PREFIX))) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
  state.apiKey = ""; state.history = {};
  renderKeySetup();
}

function renderMain() {
  const main = el("main", "main");

  // mobil-rad (visas < 720px när sidebaren är gömd)
  const mbar = el("div", "mobile-bar");
  const mhome = el("a", "mb-home", "☰"); mhome.href = withDemo("./"); mhome.title = "Byt team";
  mbar.appendChild(mhome);
  const msel = el("select", "mb-agent"); msel.id = "mb-agent";
  msel.setAttribute("aria-label", "Välj agent");
  team.agents.forEach((a) => { const o = el("option", null, `${a.icon} ${a.name}`); o.value = a.id; msel.appendChild(o); });
  msel.onchange = () => selectAgent(msel.value);
  mbar.appendChild(msel);
  const mreset = el("button", "mb-reset", state.demo ? "Anslut" : "Nyckel");
  mreset.onclick = state.demo ? connectKey : resetKey;
  mbar.appendChild(mreset);

  if (state.demo) {
    const banner = el("div", "demo-banner");
    banner.appendChild(el("span", "demo-dot"));
    banner.appendChild(el("span", "demo-text", "Demoläge — svaren är förskrivna exempel som visar hur portalen känns."));
    const connect = el("button", "demo-connect", "Koppla in din nyckel för riktiga svar →");
    connect.onclick = connectKey;
    banner.appendChild(connect);
    main.appendChild(banner);
  }

  main.appendChild(mbar);

  const header = el("header", "chat-header"); header.id = "chat-header";
  main.appendChild(header);

  const log = el("div", "chat-log"); log.id = "chat-log";
  log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite");
  main.appendChild(log);

  const composer = el("form", "composer"); composer.id = "composer";
  const ta = el("textarea", "composer-input"); ta.id = "composer-input"; ta.rows = 1;
  ta.placeholder = "Skriv ett meddelande…"; ta.setAttribute("aria-label", "Meddelande");
  ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; });
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); composer.requestSubmit(); } });
  const send = el("button", "composer-send", "↑"); send.type = "submit"; send.id = "composer-send";
  send.setAttribute("aria-label", "Skicka");
  composer.appendChild(ta); composer.appendChild(send);
  // Under strömning blir skicka-knappen en stoppknapp — med BYO-nyckel
  // betalar kunden för varje token, så ett långt svar måste gå att avbryta.
  composer.onsubmit = (e) => {
    e.preventDefault();
    if (state.streaming) { try { state.chatAbort?.abort(); } catch (_) {} return; }
    sendMessage();
  };
  main.appendChild(composer);

  return main;
}

// ---------- agent selection ----------
function selectAgent(id) {
  state.activeAgentId = id;
  const agent = agentById(id);
  if (!agent) return;

  document.querySelectorAll(".agent-item").forEach((n) => n.classList.toggle("active", n.dataset.agent === id));
  const msel = $("#mb-agent"); if (msel) msel.value = id;

  const header = $("#chat-header");
  header.innerHTML = "";
  header.appendChild(agentIcon(agent, "chat-icon"));
  const ht = el("div");
  ht.appendChild(el("div", "chat-title", agent.name));
  ht.appendChild(el("div", "chat-sub", agent.tagline));
  header.appendChild(ht);
  const clear = el("button", "chat-clear", "Rensa samtal");
  clear.type = "button";
  clear.title = "Töm samtalet med den här agenten";
  clear.onclick = () => {
    const msgs = state.history[agent.id] || [];
    if (!msgs.length) return;
    if (!confirm(`Töm samtalet med ${agent.name}? Historiken går inte att få tillbaka.`)) return;
    delete state.history[agent.id];
    saveHistory();
    renderLog();
  };
  header.appendChild(clear);

  renderLog();
  setTimeout(() => $("#composer-input")?.focus(), 30);
}

function renderLog() {
  const log = $("#chat-log");
  log.innerHTML = "";
  const agent = agentById(state.activeAgentId);
  const msgs = state.history[state.activeAgentId] || [];

  if (msgs.length === 0) {
    // Agentkort istället för tom yta: vad agenten hjälper till med +
    // klickbara exempeluppgifter. Svar på "vad gör jag nu?"-problemet —
    // en tom chattruta underanvänds, särskilt av AI-nybörjare.
    const empty = el("div", "empty");
    empty.appendChild(agentIcon(agent, "empty-icon"));
    // Onboarding-hint: helt orört team → peka ut ingångsagenten.
    const untouched = Object.values(state.history).every((m) => !m || m.length === 0);
    if (untouched && agent.id === team.entryAgent) {
      empty.appendChild(el("div", "start-here", "👋 Börja här — din primära arbetspartner"));
    }
    empty.appendChild(el("div", "empty-title", agent.name));
    empty.appendChild(el("div", "empty-sub", agent.tagline));
    if (agent.job) empty.appendChild(el("p", "empty-job", agent.job));
    const caps = Array.isArray(agent.capabilities) ? agent.capabilities : [];
    if (caps.length) {
      empty.appendChild(el("div", "empty-label", "Det här kan jag hjälpa dig med"));
      const ul = el("ul", "empty-caps");
      caps.slice(0, 5).forEach((c) => ul.appendChild(el("li", null, c)));
      empty.appendChild(ul);
    }
    // Exempeluppgifter: förifyller composern (skickar inte — användaren
    // behåller kontrollen och kan anpassa innan den skickar).
    const starters = (Array.isArray(agent.starters) && agent.starters.length)
      ? agent.starters
      : ["Vad kan du hjälpa mig med den här veckan — och vad behöver du från mig för att komma igång?"];
    empty.appendChild(el("div", "empty-label", "Prova en av de här"));
    const chips = el("div", "starter-chips");
    starters.slice(0, 4).forEach((s) => {
      const chip = el("button", "starter-chip", s);
      chip.type = "button";
      chip.onclick = () => {
        const ta = $("#composer-input");
        if (!ta) return;
        ta.value = s;
        ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
        ta.focus();
      };
      chips.appendChild(chip);
    });
    empty.appendChild(chips);
    log.appendChild(empty);
    return;
  }
  msgs.forEach((m) => log.appendChild(bubble(m.role, m.content)));
  log.scrollTop = log.scrollHeight;
}

function bubble(role, text) {
  const row = el("div", `msg msg-${role}`);
  const b = el("div", "bubble");
  if (role === "assistant") {
    b.setAttribute("aria-label", "Svar");
    renderMarkdown(b, text); // agenterna svarar med rubriker/listor/fetstil
  } else {
    b.textContent = text;
  }
  row.appendChild(b);
  return row;
}

// ---------- minimal markdown ----------
// Agentsvaren innehåller ofta **fetstil**, listor och rubriker — som råtext
// ser det trasigt ut. Egen liten renderare byggd på textNodes (aldrig
// innerHTML för LLM-text → ingen XSS-yta). Täcker det chattsvar använder:
// rubriker, punkt-/nummerlistor, fetstil, inline-kod. Resten förblir text.
function mdInline(parent, text) {
  const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
    const tok = m[0];
    parent.appendChild(tok.startsWith("**") ? el("strong", null, tok.slice(2, -2)) : el("code", "md-code", tok.slice(1, -1)));
    last = m.index + tok.length;
  }
  if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
}
function renderMarkdown(container, text) {
  container.textContent = "";
  let list = null, listType = null;
  const endList = () => { list = null; listType = null; };
  for (const raw of (text || "").split("\n")) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.+)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.+)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (h) {
      endList();
      const hd = el("div", "md-h md-h" + h[1].length);
      mdInline(hd, h[2]); container.appendChild(hd);
    } else if (ul || ol) {
      const type = ul ? "ul" : "ol";
      if (!list || listType !== type) { list = el(type, "md-list"); listType = type; container.appendChild(list); }
      const li = el("li"); mdInline(li, (ul || ol)[1]); list.appendChild(li);
    } else if (!line.trim()) {
      endList(); container.appendChild(el("div", "md-space"));
    } else {
      endList();
      const p = el("div", "md-p"); mdInline(p, line); container.appendChild(p);
    }
  }
}

// ---------- chat ----------
async function sendMessage() {
  if (state.streaming) return;
  const ta = $("#composer-input");
  const text = ta.value.trim();
  if (!text) return;
  ta.value = ""; ta.style.height = "auto";

  const agentId = state.activeAgentId;
  const agent = agentById(agentId);
  if (!state.history[agentId]) state.history[agentId] = [];
  state.history[agentId].push({ role: "user", content: text });
  saveHistory();

  const log = $("#chat-log");
  if (state.history[agentId].length === 1) log.innerHTML = "";
  log.appendChild(bubble("user", text));

  const assistantRow = bubble("assistant", "");
  const assistantBubble = assistantRow.querySelector(".bubble");
  assistantBubble.classList.add("typing");
  assistantBubble.textContent = "…";
  log.appendChild(assistantRow);
  log.scrollTop = log.scrollHeight;

  const send = $("#composer-send");
  state.streaming = true;
  state.chatAbort = new AbortController();
  if (send) { send.textContent = "■"; send.setAttribute("aria-label", "Stoppa svaret"); send.classList.add("stop"); }
  let acc = "";
  const onDelta = (delta) => {
    acc += delta;
    // Bubblan kan ha kopplats loss om användaren byter agent under strömningen
    // (renderLog tömmer loggen) — skriv bara om den fortfarande sitter i DOM:en.
    if (!assistantBubble.isConnected) return;
    assistantBubble.classList.remove("typing");
    assistantBubble.textContent = acc;
    log.scrollTop = log.scrollHeight;
  };
  try {
    if (state.demo) await streamDemo(agent, state.history[agentId], onDelta);
    else await streamClaude(agent.system, state.history[agentId], onDelta);
    state.history[agentId].push({ role: "assistant", content: acc });
    saveHistory();
    // Rendera det färdiga svaret som markdown (strömningen skrev råtext),
    // och rita om från historiken om bubblan detachats av ett agentbyte.
    if (assistantBubble.isConnected) renderMarkdown(assistantBubble, acc);
    else if (state.activeAgentId === agentId) renderLog();
  } catch (err) {
    if (err && err.name === "AbortError" && acc) {
      // Stoppad mitt i — behåll det som hann komma; det är betald output.
      state.history[agentId].push({ role: "assistant", content: acc });
      saveHistory();
      if (assistantBubble.isConnected) renderMarkdown(assistantBubble, acc);
    } else {
      if (assistantBubble.isConnected) {
        assistantBubble.classList.remove("typing");
        assistantBubble.classList.add("error");
        assistantBubble.textContent = err && err.name === "AbortError" ? "⏹ Stoppad." : "⚠️ " + (err.message || "Något gick fel.");
      }
      state.history[agentId].pop();
      saveHistory();
      // Ge tillbaka det skickade meddelandet så användaren inte behöver skriva om det.
      const input = $("#composer-input");
      if (input && !input.value) { input.value = text; input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; }
    }
  } finally {
    state.streaming = false;
    state.chatAbort = null;
    if (send) { send.textContent = "↑"; send.setAttribute("aria-label", "Skicka"); send.classList.remove("stop"); }
    $("#composer-input")?.focus();
  }
}

// ---------- demoläge ----------
// Skapar ett trovärdigt, rollanpassat exempelsvar — utan API-anrop. Tanken är
// att visa hur portalen känns, inte att ersätta riktiga svar.
function demoReply(agent, userText) {
  const topic = (userText || "").replace(/\s+/g, " ").trim();
  const short = topic.length > 70 ? topic.slice(0, 67).trim() + "…" : topic;
  const hat = (agent.tagline || agent.role || "din arbetspartner").replace(/\.$/, "").toLowerCase();
  return [
    short ? `Bra — låt mig ta "${short}".` : `Hej! Berätta vad du sitter med så sätter vi igång.`,
    ``,
    `Min roll i teamet är att ${hat}. Så här skulle jag närma mig det:`,
    ``,
    `• Först läser jag av läget och vad som ger mest effekt just nu.`,
    `• Ge mig de konkreta uppgifterna du har, så levererar jag ett första utkast du bara behöver granska.`,
    ``,
    `Vill du att jag tar det vidare — eller ska jag skicka dig till rätt kollega i teamet?`,
  ].join("\n");
}

// Strömmar fram demosvaret ord för ord så att det känns som riktig generering.
async function streamDemo(agent, messages, onDelta) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const full = demoReply(agent, last ? last.content : "");
  await new Promise((r) => setTimeout(r, 280)); // liten "tänk-paus"
  const tokens = full.split(/(\s+)/);
  for (const tk of tokens) {
    if (state.chatAbort && state.chatAbort.signal.aborted) {
      const e = new Error("Stoppad."); e.name = "AbortError"; throw e;
    }
    await new Promise((r) => setTimeout(r, 16));
    onDelta(tk);
  }
}

// Anropar Claude Messages API direkt från webbläsaren och strömmar svaret.
// Själva strömningen + felhanteringen ligger i den delade klienten.
async function streamClaude(system, messages, onDelta) {
  await window.ATBClaude.stream({
    apiKey: state.apiKey,
    model: state.model,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxTokens: 4096,
    onDelta,
    signal: state.chatAbort ? state.chatAbort.signal : undefined,
  });
}

boot();
