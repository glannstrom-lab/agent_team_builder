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
const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-opus-4-8";

const MODELS = [
  { id: "claude-opus-4-8", label: "Opus 4.8 — mest kapabel" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — snabb & billigare" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — billigast" },
];

let team = null; // sätts när ett team laddats
const state = {
  apiKey: localStorage.getItem(KEY_STORAGE) || "",
  model: localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL,
  activeAgentId: null,
  history: {}, // { [agentId]: [{role, content}] }
  streaming: false,
};

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
  if (slug === "__draft") {
    const raw = localStorage.getItem("atb_draft_team");
    if (!raw) throw new Error("Inget team-utkast hittades. Bygg ett i Builder först.");
    window.TEAM = JSON.parse(raw);
  } else {
    await loadScript(`teams/${slug}.js?v=${Date.now()}`);
  }
  if (!window.TEAM) throw new Error("Team-filen saknar konfiguration.");
  team = window.TEAM;
  // robusthet: säkerställ att teamet har agenter och en giltig ingångsagent
  if (!Array.isArray(team.agents) || team.agents.length === 0) {
    throw new Error("Teamet saknar agenter.");
  }
  state.activeAgentId = agentById(team.entryAgent) ? team.entryAgent : team.agents[0].id;
  if (!localStorage.getItem(MODEL_STORAGE) && team.defaultModel) state.model = team.defaultModel;
}

// ---------- boot ----------
async function boot() {
  if (!state.apiKey) { renderKeySetup(); return; }
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

  root.appendChild(wrap);
  setTimeout(() => input.focus(), 50);
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
      card.href = `?team=${t.slug}`;
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

  const reset = el("button", "link-btn", "Byt API-nyckel");
  reset.style.marginTop = "26px";
  reset.onclick = resetKey;
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
  brand.href = "./";
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
    item.appendChild(el("span", "agent-icon", a.icon));
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

  const reset = el("button", "link-btn", "Byt API-nyckel");
  reset.onclick = resetKey;
  foot.appendChild(reset);
  side.appendChild(foot);

  return side;
}

function renderMain() {
  const main = el("main", "main");

  // mobil-rad (visas < 720px när sidebaren är gömd)
  const mbar = el("div", "mobile-bar");
  const mhome = el("a", "mb-home", "☰"); mhome.href = "./"; mhome.title = "Byt team";
  mbar.appendChild(mhome);
  const msel = el("select", "mb-agent"); msel.id = "mb-agent";
  msel.setAttribute("aria-label", "Välj agent");
  team.agents.forEach((a) => { const o = el("option", null, `${a.icon} ${a.name}`); o.value = a.id; msel.appendChild(o); });
  msel.onchange = () => selectAgent(msel.value);
  mbar.appendChild(msel);
  const mreset = el("button", "mb-reset", "Nyckel"); mreset.onclick = resetKey;
  mbar.appendChild(mreset);
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
  composer.onsubmit = (e) => { e.preventDefault(); sendMessage(); };
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
  header.appendChild(el("span", "chat-icon", agent.icon));
  const ht = el("div");
  ht.appendChild(el("div", "chat-title", agent.name));
  ht.appendChild(el("div", "chat-sub", agent.tagline));
  header.appendChild(ht);

  renderLog();
  setTimeout(() => $("#composer-input")?.focus(), 30);
}

function renderLog() {
  const log = $("#chat-log");
  log.innerHTML = "";
  const agent = agentById(state.activeAgentId);
  const msgs = state.history[state.activeAgentId] || [];

  if (msgs.length === 0) {
    const empty = el("div", "empty");
    empty.appendChild(el("div", "empty-icon", agent.icon));
    empty.appendChild(el("div", "empty-title", agent.name));
    empty.appendChild(el("div", "empty-sub", agent.tagline));
    log.appendChild(empty);
    return;
  }
  msgs.forEach((m) => log.appendChild(bubble(m.role, m.content)));
  log.scrollTop = log.scrollHeight;
}

function bubble(role, text) {
  const row = el("div", `msg msg-${role}`);
  const b = el("div", "bubble");
  if (role === "assistant") b.setAttribute("aria-label", "Svar");
  b.textContent = text;
  row.appendChild(b);
  return row;
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
  if (send) send.disabled = true;
  let acc = "";
  try {
    await streamClaude(agent.system, state.history[agentId], (delta) => {
      acc += delta;
      assistantBubble.classList.remove("typing");
      assistantBubble.textContent = acc;
      log.scrollTop = log.scrollHeight;
    });
    state.history[agentId].push({ role: "assistant", content: acc });
  } catch (err) {
    assistantBubble.classList.remove("typing");
    assistantBubble.classList.add("error");
    assistantBubble.textContent = "⚠️ " + (err.message || "Något gick fel.");
    state.history[agentId].pop();
  } finally {
    state.streaming = false;
    if (send) send.disabled = false;
    $("#composer-input")?.focus();
  }
}

// Anropar Claude Messages API direkt från webbläsaren och strömmar svaret.
async function streamClaude(system, messages, onDelta) {
  const body = {
    model: state.model,
    max_tokens: 4096,
    stream: true,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": state.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `Fel ${res.status}`;
    try {
      const j = await res.json();
      if (j.error?.message) msg = j.error.message;
      if (res.status === 401) msg = "Ogiltig API-nyckel. Kontrollera nyckeln under 'Byt API-nyckel'.";
      if (res.status === 429) msg = "För många anrop just nu — vänta en stund och försök igen.";
    } catch (_) {}
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const evt = JSON.parse(data);
      if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") onDelta(evt.delta.text);
      else if (evt.type === "error") throw new Error(evt.error?.message || "Strömningsfel");
    } catch (e) {
      if (e instanceof SyntaxError) return;
      throw e;
    }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) handleLine(line);
  }
  if (buffer) handleLine(buffer); // ev. sista rad utan avslutande radbrytning
}

boot();
