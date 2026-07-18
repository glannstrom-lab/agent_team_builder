/* ============================================================
   Mitt AI-team — Kundportal
   Statisk app. Kundens egen Anthropic-nyckel lagras lokalt i
   webbläsaren och anropar Claude direkt. Ingen backend.

   Multi-tenant: ?team=<slug> laddar portal/teams/<slug>.js.
   Utan parameter visas en kundväljare (window.TEAMS).
   __draft laddar ett utkast byggt i Builder-appen (localStorage).
   ============================================================ */

const KEY_STORAGE = "atb_api_key";
const MODEL_STORAGE = "atb_model";
const HIST_PREFIX = "atb_hist_"; // + team-slug → sparad chatthistorik
const MEM_PREFIX = "atb_mem_";   // + team-slug → delat företagsminne (instruktioner)
const DOCS_PREFIX = "atb_docs_"; // + team-slug → inklistrade underlag [{title,text,on}]
const DOCSON_PREFIX = "atb_docson_"; // + team-slug → { filnamn: bool } på/av för mapp-underlag
const DEFAULT_MODEL = "claude-sonnet-4-6"; // billig default för BYO-kund; kan höjas till Opus i UI
// OpenRouter-nycklar (sk-or-) har eget modellval — sparas separat så det
// aldrig krockar med Anthropic-valet när man byter nyckel fram och tillbaka.
const OR_MODEL_STORAGE = "atb_model_or";
const DEFAULT_OR_MODEL = "deepseek/deepseek-v4-flash"; // billigast som klarar jobbet bra
// API-URL, anthropic-version och själva strömningen ligger i ../atb-claude.js
// (window.ATBClaude) — delat med Buildern så de inte kan glida isär.

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — snabb & prisvärd (rekommenderad)" },
  { id: "claude-opus-4-8", label: "Opus 4.8 — mest kapabel" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — billigast" },
];

function isOpenRouter() { return window.ATBClaude.providerFor(state.apiKey) === "openrouter"; }
// Läs rätt sparat modellval för nyckelns leverantör (anropas vid boot och nyckelbyte).
function syncModelForProvider() {
  state.model = isOpenRouter()
    ? (localStorage.getItem(OR_MODEL_STORAGE) || DEFAULT_OR_MODEL)
    : (localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL);
}

let team = null; // sätts när ett team laddats
const state = {
  apiKey: localStorage.getItem(KEY_STORAGE) || "",
  model: localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL,
  // Demoläge: bläddra och chatta utan nyckel — svaren är förskrivna exempel.
  // Aktiveras via knapp eller ?demo=1 (delbar demolänk).
  demo: new URLSearchParams(location.search).get("demo") === "1",
  slug: null, // aktivt teams slug — nyckel för sparad historik
  folder: null, // kopplad mapp: { handle, name, docs, memory, needsPermission }
  activeAgentId: null,
  history: {}, // { [agentId]: [{role, content, at?, auto?, perspectives?}] }
  pendingRoutine: null, // rutin-label som väntar på att dess prompt skickas (avbockning)
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
    // Tak per agent så localStorage inte växer obegränsat. Med kopplad mapp
    // ARKIVERAS det som faller ur (arkiv/<agent>.md) i stället för att
    // slängas — läsrapporter och beslut ska gå att hitta månader senare.
    const capped = {};
    for (const id of Object.keys(state.history)) {
      const msgs = state.history[id];
      if (msgs.length > 60) {
        const dropped = msgs.slice(0, msgs.length - 60);
        state.history[id] = msgs.slice(-60);
        // Seriell kö: två samtidiga read→append→write mot samma arkivfil
        // skulle låta den ena skrivningen radera den andras rader.
        if (folderActive()) archiveChain = archiveChain.then(() => archiveMessages(id, dropped)).catch(() => {});
      }
      capped[id] = state.history[id];
    }
    localStorage.setItem(HIST_PREFIX + state.slug, JSON.stringify(capped));
  } catch (_) { /* full/blockerad storage får aldrig krascha chatten */ }
}

let archiveChain = Promise.resolve(); // serialiserar arkivskrivningar

async function archiveMessages(agentId, dropped) {
  try {
    const a = agentById(agentId);
    const dir = await state.folder.handle.getDirectoryHandle("arkiv", { create: true });
    const fh = await dir.getFileHandle(agentId + ".md", { create: true });
    let old = "";
    try { old = await (await fh.getFile()).text(); } catch (_) { /* ny fil */ }
    const add = dropped.map((m) =>
      `\n\n---\n**${m.role === "user" ? "Du" : (a ? a.name : "Agenten")}**${m.at ? " · " + new Date(m.at).toLocaleString("sv-SE") : ""}\n\n${m.content || ""}`
    ).join("");
    const w = await fh.createWritable();
    await w.write(old + add);
    await w.close();
  } catch (_) { /* arkivering är best effort — kapningen sker ändå */ }
}

// ---------- minne & underlag ----------
// Det som gör portalen till en arbetsyta i stil med ett "projekt" (à la
// ChatGPT Projects): teamet delar instruktioner och material, i stället för
// att varje chatt börjar tom. Allt lagras per team i localStorage och
// injiceras i varje agents systemprompt via systemFor().
function loadMemory() {
  if (folderActive() && state.folder.memory != null) return state.folder.memory;
  return localStorage.getItem(MEM_PREFIX + state.slug) || "";
}
function saveMemory(text) {
  // Mapp kopplad → minne.md är sanningen (redigerbar i valfritt program).
  // localStorage skrivs alltid som reserv så inget tappas om mappen försvinner.
  if (folderActive()) {
    const baseline = state.folder.memory || "";
    state.folder.memory = text;
    (async () => {
      try {
        // Konfliktskydd: rader en kollega hunnit lägga till i minne.md (via
        // OneDrive-synk) sedan vår senaste läsning får inte skrivas över —
        // de följer med. Rader användaren aktivt raderat återuppstår inte
        // (bara det som är nytt gentemot VÅR baslinje flyttas med).
        let finalText = text;
        try {
          const fh = await state.folder.handle.getFileHandle("minne.md");
          const current = await (await fh.getFile()).text();
          if (current !== baseline) {
            const inText = new Set(text.split("\n").map((s) => s.trim()));
            const inBase = new Set(baseline.split("\n").map((s) => s.trim()));
            const added = current.split("\n").filter((l) => l.trim() && !inBase.has(l.trim()) && !inText.has(l.trim()));
            if (added.length) finalText = text.replace(/\s+$/, "") + "\n" + added.join("\n");
          }
        } catch (_) { /* ingen fil än — skriv vårt innehåll */ }
        state.folder.memory = finalText;
        await writeFolderFile("minne.md", finalText);
        try { localStorage.setItem(MEM_PREFIX + state.slug, finalText); } catch (_) { /* full storage */ }
        paintFactCount();
      } catch (_) { /* skrivfel — localStorage-reserven nedan gäller */ }
    })();
  }
  try { localStorage.setItem(MEM_PREFIX + state.slug, text); } catch (_) { /* full storage */ }
}
function loadLocalDocs() {
  try { const d = JSON.parse(localStorage.getItem(DOCS_PREFIX + state.slug) || "[]"); return Array.isArray(d) ? d : []; }
  catch (_) { return []; }
}
function saveDocs(docs) { try { localStorage.setItem(DOCS_PREFIX + state.slug, JSON.stringify(docs)); } catch (_) { /* full storage */ } }
function loadDocToggles() {
  try { return JSON.parse(localStorage.getItem(DOCSON_PREFIX + state.slug) || "{}") || {}; }
  catch (_) { return {}; }
}
function saveDocToggles(t) { try { localStorage.setItem(DOCSON_PREFIX + state.slug, JSON.stringify(t)); } catch (_) { /* full storage */ } }
// Alla underlag agenterna ser: mappens filer (om kopplad) + inklistrade.
function loadDocs() {
  const local = loadLocalDocs();
  if (!folderActive()) return local;
  const t = loadDocToggles();
  return state.folder.docs
    .map((d) => ({ title: d.title, text: d.text, on: t[d.title] !== false, file: true }))
    .concat(local);
}

// ---------- mapp på datorn (File System Access API) ----------
// BYO-lägets "pro-läge": kunden kopplar en vanlig mapp — .md/.txt blir
// underlag, minne.md blir företagsminnet, och svar kan sparas tillbaka till
// från-teamet/. Större än webblagringen, överlever rensad webbdata, och läggs
// mappen i OneDrive/Dropbox får kunden synk + delning via sin egen infra.
// Kräver Chrome/Edge på desktop; annars förblir localStorage-läget som idag.
const FOLDER_SUPPORTED = typeof window.showDirectoryPicker === "function";

// Litet IndexedDB-lager — mapphandtag kan inte ligga i localStorage.
function idbOpen() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open("atb-fs", 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore("kv");
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbSet(k, v) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(v, k);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(k) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const rq = db.transaction("kv", "readonly").objectStore("kv").get(k);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbDel(k) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").delete(k);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

function folderActive() { return !!(state.folder && state.folder.handle && !state.folder.needsPermission); }

// Läser om mappens innehåll till cachen. ask=true får bara komma från en
// användargest (klick/enter) — annars vägrar webbläsaren visa tillståndsfrågan.
async function refreshFolder(opts) {
  const f = state.folder;
  if (!f || !f.handle) return;
  try {
    let perm = await f.handle.queryPermission({ mode: "readwrite" });
    if (perm === "prompt" && opts && opts.ask) perm = await f.handle.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") { f.needsPermission = true; return; }
    f.needsPermission = false;
    const docs = [];
    let memory = null;
    for await (const [name, h] of f.handle.entries()) {
      if (h.kind !== "file" || !/\.(md|txt)$/i.test(name)) continue;
      const file = await h.getFile();
      if (file.size > 400000) continue; // hoppa jättefiler — de skulle ändå kapas av budgeten
      const text = await file.text();
      if (name.toLowerCase() === "minne.md") memory = text;
      else docs.push({ title: name, text });
    }
    docs.sort((a, b) => a.title.localeCompare(b.title, "sv"));
    f.docs = docs;
    f.memory = memory;
  } catch (_) { /* mappen flyttad/borta — behåll senaste cache */ }
}

async function connectFolder() {
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    state.folder = { handle, name: handle.name, docs: [], memory: null, needsPermission: false };
    await idbSet("dir_" + state.slug, handle);
    await refreshFolder({ ask: true });
    updateFolderBanner();
  } catch (_) { /* avbruten dialog */ }
}
async function disconnectFolder() {
  state.folder = null;
  await idbDel("dir_" + state.slug).catch(() => {});
  updateFolderBanner();
}

// Vid sidladdning: återanslut sparat mapphandtag. Tillstånd kan inte begäras
// utan gest — då visas en banner som återansluter med ett klick.
async function initFolder() {
  if (state.demo || !FOLDER_SUPPORTED || !state.slug) return;
  try {
    const handle = await idbGet("dir_" + state.slug);
    if (!handle) return;
    state.folder = { handle, name: handle.name, docs: [], memory: null, needsPermission: false };
    await refreshFolder();
    updateFolderBanner();
    await syncStatusToFolder(); // hämta in kollegors rutinbockar/streak
  } catch (_) { /* ingen mapp */ }
}

async function writeFolderFile(name, text, sub) {
  let dir = state.folder.handle;
  if (sub) dir = await dir.getDirectoryHandle(sub, { create: true });
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

// ---------- delad teamstatus via mappen ----------
// Tre kollegor = tre webbläsare med varsin localStorage. Mappen är den delade
// ytan: rutinlogg + streak speglas till teamstatus.json och merge:as vid
// inläsning, så "klar ✓" och streaken blir gemensamma när mappen ligger i
// OneDrive/Dropbox. (Chatthistorik delas inte — den är för stor och personlig.)
async function readStatusFile() {
  try {
    const fh = await state.folder.handle.getFileHandle("teamstatus.json");
    return JSON.parse(await (await fh.getFile()).text());
  } catch (_) { return null; }
}
async function syncStatusToFolder() {
  if (!folderActive()) return;
  try {
    const cur = (await readStatusFile()) || {};
    // Rutiner: union av lokala + filens avklarade för innevarande vecka.
    const local = routLoad();
    const merged = { week: local.week, done: [...local.done] };
    if (cur.rout && cur.rout.week === local.week && Array.isArray(cur.rout.done)) {
      cur.rout.done.forEach((d) => {
        const l = d.label || d;
        if (!merged.done.some((x) => (x.label || x) === l)) merged.done.push(d);
      });
    }
    // Streak: ta den mest generösa (senast aktiv + högsta räknaren).
    let streakL = null;
    try { streakL = JSON.parse(localStorage.getItem("atb_streak_" + state.slug) || "null"); } catch (_) { /* läsfel */ }
    const streakF = cur.streak || null;
    let streak = streakL || streakF;
    if (streakL && streakF) {
      streak = {
        lastAt: Math.max(streakL.lastAt || 0, streakF.lastAt || 0),
        count: Math.max(streakL.count || 0, streakF.count || 0),
        freezeQ: streakF.freezeQ || streakL.freezeQ || "",
      };
    }
    await writeFolderFile("teamstatus.json", JSON.stringify({ rout: merged, streak, at: Date.now() }, null, 2));
    // Spegla tillbaka det merge:ade läget lokalt.
    routSave(merged);
    if (streak) { try { localStorage.setItem("atb_streak_" + state.slug, JSON.stringify(streak)); } catch (_) { /* full storage */ } }
    // Måla om rutinbockar som kom in från en kollega.
    merged.done.forEach((d) => {
      const label = d.label || d;
      document.querySelectorAll(".routine-item").forEach((n) => {
        if (n.dataset.label === label && !n.classList.contains("done")) {
          n.classList.add("done");
          const dEl = n.querySelector(".routine-day"); if (dEl) dEl.textContent = "klar ✓";
        }
      });
    });
  } catch (_) { /* status-synk är best effort — lokalt läge gäller ändå */ }
}

function updateFolderBanner() {
  const old = $("#folder-banner");
  if (old) old.remove();
  if (!(state.folder && state.folder.handle && state.folder.needsPermission)) return;
  const main = document.querySelector(".main");
  if (!main) return;
  const b = el("button", "folder-banner");
  b.id = "folder-banner"; b.type = "button";
  b.textContent = `📁 Mappen "${state.folder.name}" väntar på tillstånd — klicka för att återansluta`;
  b.onclick = async () => { await refreshFolder({ ask: true }); updateFolderBanner(); };
  main.insertBefore(b, $("#chat-header"));
}

const DOC_BUDGET = 12000; // tecken underlag totalt per anrop — skydd mot tokensvällning
function systemFor(agent) {
  let sys = agent.system || "";
  const mem = loadMemory().trim();
  if (mem) sys += `\n\nFÖRETAGSMINNE (delat för hela teamet, skrivet av användaren — följ det):\n${mem}`;
  const active = loadDocs().filter((d) => d && d.on && d.text);
  if (active.length) {
    let used = 0;
    const parts = [];
    for (const d of active) {
      const left = DOC_BUDGET - used;
      if (left <= 0) break;
      const t = d.text.length > left ? d.text.slice(0, left) + "\n[…avkortat]" : d.text;
      used += t.length;
      parts.push(`--- UNDERLAG: ${d.title} ---\n${t}`);
    }
    sys += `\n\nUNDERLAG (material användaren lagt in — använd som källa när det är relevant):\n${parts.join("\n\n")}`;
  }
  // Källhänvisning: när ett underlag används ska det synas varifrån uppgiften
  // kommer — det gör svaren granskningsbara och underlagen begripliga.
  if (mem || active.length) {
    sys += `\n\nNär du använder företagsminnet eller ett underlag i ett svar: hänvisa kort till källan vid namn (t.ex. "enligt er prislista"). Påstå aldrig att ett underlag innehåller något det inte gör — saknas uppgiften, säg det och be om den.`;
  }
  return sys;
}

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
// Pekskärm: Enter ska göra radbrytning (skicka-knappen finns), och autofokus
// ska inte poppa upp tangentbordet över svaret man just fått.
const COARSE = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
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
  const a = el("a", cls || "hublink", "← Mitt AI-team");
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
  if (slug === "__draft" || slug === "__vertical" || slug === "__link") {
    // __draft = utkast från Builder; __vertical = branschsidornas demo-team;
    // __link = team öppnat via delningslänk (#cfg=…) eller teamfil.
    // Separata nycklar så de aldrig skriver över varandra.
    const storageKey = slug === "__vertical" ? "atb_vertical_demo_team" : slug === "__link" ? "atb_link_team" : "atb_draft_team";
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error(slug === "__link" ? "Ingen teamlänk eller teamfil är öppnad här ännu." : "Inget team-utkast hittades. Bygg ett i Builder först.");
    try {
      window.TEAM = JSON.parse(raw);
    } catch (_) {
      throw new Error("Utkastet i webbläsaren är skadat — bygg ett nytt i Builder.");
    }
    // Nytt utkast för ett annat företag? Rensa förra utkastets historik,
    // minne och underlag — annars "minns" företag B företag A:s samtal
    // (förvirrande och pinsamt i kundmöten).
    const ownerKey = "atb_owner_" + slug;
    const owner = (window.TEAM && window.TEAM.company) || "";
    const prevOwner = localStorage.getItem(ownerKey);
    if (prevOwner !== null && prevOwner !== owner) {
      [HIST_PREFIX, MEM_PREFIX, DOCS_PREFIX, DOCSON_PREFIX,
        "atb_hello_", "atb_intro_", "atb_rout_", "atb_streak_", "atb_visit_", "atb_fp_", "atb_cost_", "atb_pulse_snooze_", "atb_teamext_"]
        .forEach((p) => localStorage.removeItem(p + slug));
      // Mappkopplingen ligger i IndexedDB — utan detta återansluter förra
      // företagets mapp och dess minne/underlag läcker in i nya teamet.
      state.folder = null;
      idbDel("dir_" + slug).catch(() => { /* ingen koppling fanns */ });
    }
    try { localStorage.setItem(ownerKey, owner); } catch (_) { /* full storage */ }
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
  // Lokala teamtillägg ("Utveckla teamet"): agenter/rutiner kunden godkänt
  // efter bygget läggs ovanpå grundkonfigen vid varje laddning.
  try {
    const ext = JSON.parse(localStorage.getItem("atb_teamext_" + slug) || "null");
    if (ext && Array.isArray(ext.agents)) {
      ext.agents.forEach((a) => { if (a && a.id && a.system && !team.agents.some((b) => b.id === a.id)) { a.added = true; team.agents.push(a); } });
      (ext.routines || []).forEach((r) => {
        if (r && r.label && !(team.routines || []).some((x) => x.label === r.label)) (team.routines = team.routines || []).push(r);
      });
    }
  } catch (_) { /* trasigt tillägg — kör grundkonfigen */ }
  assignAvatars(team); // ge varje agent en (stabil, slumpad) avatar om ingen är satt
  state.slug = slug;
  state.history = loadHistory(slug);
  state.activeAgentId = agentById(team.entryAgent) ? team.entryAgent : team.agents[0].id;
  // Teamets defaultModel gäller bara om det matchar användarens leverantör —
  // ett team byggt med OpenRouter-nyckel kan bära t.ex. "openrouter/auto",
  // som skulle ge 404 på varje anrop mot api.anthropic.com.
  if (!isOpenRouter() && !localStorage.getItem(MODEL_STORAGE) && team.defaultModel && /^claude-/.test(team.defaultModel)) state.model = team.defaultModel;
}

// ---------- boot ----------
async function boot() {
  if (!state.apiKey && !state.demo) { renderKeySetup(); return; }
  syncModelForProvider(); // nyckelns leverantör avgör vilket modellval som gäller
  // Delningslänk? Fragment (#cfg=…) bär hela teamkonfigen och når aldrig
  // servern. Packa upp, spara lokalt och öppna som __link-team.
  const hashCfg = /^#cfg=(.+)/.exec(location.hash || "");
  if (hashCfg) {
    try {
      const t = await window.ATBClaude.decodeTeamLink(hashCfg[1]);
      try { localStorage.setItem("atb_link_team", JSON.stringify(t)); } catch (_) { /* full storage */ }
      await loadTeam("__link");
      renderPortal();
      initFolder();
      return;
    } catch (err) {
      renderPicker("Teamlänken kunde inte öppnas — be avsändaren om en ny. (" + ((err && err.message) || "okänt fel") + ")");
      return;
    }
  }
  const slug = getSlug();
  if (!slug) { renderPicker(); return; }
  try {
    await loadTeam(slug);
    renderPortal();
    initFolder(); // async — banner/underlag dyker upp när mappen lästs
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
  wrap.appendChild(el("p", "setup-lead", "Klistra in er egen API-nyckel — Anthropic (sk-ant-…) eller OpenRouter (sk-or-…). Den sparas bara här i er webbläsare och skickas direkt till leverantören — aldrig till någon annan server. Tips: använd en nyckel med begränsad budget."));

  const field = el("div", "setup-field");
  const input = el("input");
  input.type = "password"; input.id = "api-key-input"; input.placeholder = "sk-ant-... eller sk-or-...";
  input.autocomplete = "off"; input.spellcheck = false;
  input.setAttribute("aria-label", "API-nyckel (Anthropic eller OpenRouter)");
  field.appendChild(input);
  wrap.appendChild(field);

  const err = el("div", "setup-err"); err.style.display = "none"; wrap.appendChild(err);

  const btn = el("button", "btn-primary", "Anslut");
  btn.onclick = async () => {
    const val = input.value.trim();
    if (!val.startsWith("sk-ant-") && !val.startsWith("sk-or-")) {
      err.textContent = "Det ser inte ut som en giltig nyckel (Anthropic börjar med sk-ant-, OpenRouter med sk-or-).";
      err.style.display = "block";
      return;
    }
    // Testa nyckeln direkt (gratis anrop) — en felklistrad nyckel ska ge
    // besked nu, medan användaren har nyckelsidan öppen, inte mitt i
    // första frågan till teamet.
    btn.disabled = true; btn.textContent = "Testar nyckeln…"; err.style.display = "none";
    try {
      await window.ATBClaude.validateKey(val);
    } catch (e) {
      err.textContent = e.message; err.style.display = "block";
      btn.disabled = false; btn.textContent = "Anslut"; return;
    }
    btn.disabled = false; btn.textContent = "Anslut";
    state.apiKey = val;
    localStorage.setItem(KEY_STORAGE, val);
    boot();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  wrap.appendChild(btn);

  const help = el("div", "setup-help");
  help.innerHTML = 'Har ni ingen nyckel än? Skapa en på <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a> eller <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">openrouter.ai</a> — det tar någon minut. Med OpenRouter kan ni välja bland fler modeller än Claude.';
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

  // Teamfil (LibreChat-preset-mönstret): backup, flytt mellan datorer och
  // konsultflödet "jag mailar er teamet" — utan server.
  const openFile = el("button", "link-btn", "📄 Öppna en teamfil (.js/.json)…");
  openFile.style.marginTop = "26px";
  openFile.onclick = () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".js,.json,application/json,text/javascript";
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        let txt = await f.text();
        txt = txt.replace(/^[\s\S]*?window\.TEAM\s*=\s*/, "").trim().replace(/;\s*$/, "");
        const t = JSON.parse(txt);
        if (!t || !Array.isArray(t.agents) || !t.agents.length) throw new Error("filen innehåller inget team");
        localStorage.setItem("atb_link_team", JSON.stringify(t));
        location.href = withDemo("?team=__link");
      } catch (e) { renderPicker("Teamfilen kunde inte läsas: " + ((e && e.message) || "okänt fel")); }
    };
    inp.click();
  };
  wrap.appendChild(openFile);

  const reset = el("button", "link-btn", state.demo ? "Koppla in din nyckel" : "Byt API-nyckel");
  reset.style.marginTop = "10px";
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
  ensureOrPrices(); // OpenRouter-priser till kostnadsvisningen (async, tyst)
  const app = el("div", "app");
  app.appendChild(renderSidebar());
  app.appendChild(renderMain());
  // Backdrop för mobil-drawern — klick utanför stänger.
  const backdrop = el("div", "drawer-backdrop");
  backdrop.onclick = () => document.body.classList.remove("drawer-open");
  app.appendChild(backdrop);
  root.appendChild(app);
  selectAgent(state.activeAgentId);
  renderPulse();       // lokala puls-kort — portalen har alltid något att säga
  runAutoRoutines();   // async: auto-rutiner som ska ligga klara idag
  // Anställningsceremonin: första besöket i ett team med motiveringar öppnas
  // "Därför ser ert team ut så här" automatiskt — en gång, aldrig igen.
  if (!state.demo && whyAvailable()) {
    let seen = null;
    try { seen = localStorage.getItem("atb_hello_" + state.slug); } catch (_) { /* läsfel */ }
    if (!seen) {
      try { localStorage.setItem("atb_hello_" + state.slug, "1"); } catch (_) { /* full storage */ }
      setTimeout(openWhyTeam, 500);
    }
  }
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

  // Kom igång-kortet (döljs när allt är gjort eller kunden klickat bort det).
  const intro = renderIntroCard();
  if (intro) side.appendChild(intro);

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

  // ---- Arbetsyta: det som gör portalen till mer än en chatt ----
  const ws = el("div", "ws");
  ws.appendChild(el("div", "side-label ws-head", "Arbetsyta"));
  const wsBtn = (icon, label, fn, title) => {
    const b = el("button", "ws-btn"); b.type = "button"; if (title) b.title = title;
    b.appendChild(el("span", "ws-ico", icon)); b.appendChild(el("span", "ws-txt", label));
    b.onclick = fn; ws.appendChild(b); return b;
  };
  // Streak-badge: veckor i rad med aktivitet — förlustaversion på rätt enhet.
  const streak = state.demo ? 0 : streakCount();
  if (streak >= 2) ws.appendChild(el("div", "streak-badge", `🔥 ${streak} veckor i rad med teamet`));

  const entryName = (agentById(team.entryAgent) || {}).name || "VD-assistenten";
  wsBtn("⭐", "Veckostart", startWeek, `${entryName} föreslår veckans fokus utifrån teamet och era rutiner`);
  wsBtn("🤝", "Håll ett möte", openMeeting, "Samla flera agenters perspektiv och landa i ett beslut");
  wsBtn("🧠", "Minne & underlag", openMemory, "Delade instruktioner och material som alla agenter ser");
  wsBtn("📈", "Veckans arbete", openWeekWork, "Vad du och teamet gjort den här veckan — och tid tillbaka");
  if (whyAvailable()) wsBtn("✨", "Därför detta team", openWhyTeam, "Varje agents koppling till er verksamhet — och det vi medvetet sa nej till");
  if (!state.demo && quarterEndsSoon()) wsBtn("🏆", "Kvartalet med teamet", openQuarter, "Kvartalets siffror — delbara med en kollega");
  if (!state.demo) wsBtn("🔄", "Utveckla teamet", openGrow, "Lägg till en agent när verksamheten förändras — avvisade moment står först i kön");
  if (!state.demo) wsBtn("🔍", "Sök i historiken", openSearch, "Sök i alla samtal och arkivet");
  if (team.firstProject) wsBtn("🎯", "Första projektet", openFirstProject, "Ert första AI-projekt — planen och första steget");

  // Synlig inlärning: minnet som växande investering, inte gömd inställning.
  if (!state.demo) {
    const fc = el("button", "fact-count", factLabel()); fc.id = "fact-count"; fc.type = "button";
    fc.title = "Teamets delade minne — klicka för att se och fylla på";
    fc.onclick = openMemory;
    ws.appendChild(fc);
  }

  const routines = Array.isArray(team.routines) ? team.routines : [];
  if (routines.length) {
    ws.appendChild(el("div", "side-label ws-head", "Veckans rutiner"));
    const today = todayDayNo();
    routines.forEach((rt) => {
      const due = rt.day === today;
      const done = !state.demo && routineDone(rt.label);
      const b = el("button", "routine-item" + (due ? " due" : "") + (done ? " done" : "")); b.type = "button";
      b.dataset.label = rt.label;
      b.appendChild(el("span", "routine-label", rt.label));
      b.appendChild(el("span", "routine-day", done ? "klar ✓" : due ? "idag" : dayName(rt.day)));
      b.title = rt.prompt || "";
      b.onclick = () => runRoutine(rt);
      ws.appendChild(b);
    });
  }
  side.appendChild(ws);

  const foot = el("div", "side-foot");
  const hub = el("a", "hub-foot", "← Till hubben"); hub.href = "../";
  foot.appendChild(hub);
  const sl = el("label", "side-label", "Modell"); sl.setAttribute("for", "model-select");
  foot.appendChild(sl);
  const sel = el("select", "model-select"); sel.id = "model-select";
  const fillOptions = (list) => {
    sel.innerHTML = "";
    list.forEach((m) => {
      const o = el("option", null, m.label || m.name || m.id); o.value = m.id;
      if (m.id === state.model) o.selected = true;
      sel.appendChild(o);
    });
  };
  if (!state.demo && isOpenRouter()) {
    // OpenRouter: hämta katalogen live (kurerad i atb-claude.js). Tills den
    // laddats visas bara nuvarande val — dropdownen fungerar hela tiden.
    fillOptions([{ id: state.model, name: state.model }]);
    window.ATBClaude.openrouterModels()
      .then((models) => {
        const extra = models.some((m) => m.id === state.model) ? [] : [{ id: state.model, name: state.model }];
        fillOptions(extra.concat(models));
      })
      .catch(() => { /* offline/fel — behåll nuvarande val */ });
  } else {
    fillOptions(MODELS);
  }
  sel.onchange = () => {
    state.model = sel.value;
    localStorage.setItem(isOpenRouter() ? OR_MODEL_STORAGE : MODEL_STORAGE, sel.value);
  };
  foot.appendChild(sel);

  const share = el("button", "link-btn", "Dela / exportera team");
  share.onclick = openShare;
  foot.appendChild(share);

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
  if (!confirm("Ta bort ALLT sparat från den här webbläsaren?\n\n• API-nyckeln\n• All chatthistorik (alla team)\n• Företagsminne och underlag\n• Mappkopplingen (filerna i mappen rörs INTE)\n• Team-utkast från Builder och branschsidorna")) return;
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    // Alla portalens nycklar delar atb_-prefixet — svep allt, inklusive
    // framtida tillägg (rutinlogg, streak, puls, kostnad, checklista …).
    if (k && k.startsWith("atb_")) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
  try { indexedDB.deleteDatabase("atb-fs"); } catch (_) { /* inga mapphandtag */ }
  state.apiKey = ""; state.history = {}; state.folder = null;
  renderKeySetup();
}

function renderMain() {
  const main = el("main", "main");

  // mobil-rad (visas < 720px när sidebaren är gömd). ☰ öppnar sidebaren som
  // drawer — hela arbetsytan (rutiner, möten, minne) ska finnas på mobil,
  // annars är portalen exakt den AI-chatt den inte ska vara.
  const mbar = el("div", "mobile-bar");
  const mhome = el("button", "mb-home", "☰"); mhome.type = "button"; mhome.title = "Meny — agenter, rutiner, möten, minne";
  mhome.setAttribute("aria-label", "Öppna menyn");
  mhome.onclick = () => document.body.classList.toggle("drawer-open");
  mbar.appendChild(mhome);
  const msel = el("select", "mb-agent"); msel.id = "mb-agent";
  msel.setAttribute("aria-label", "Välj agent");
  team.agents.forEach((a) => { const o = el("option", null, `${a.icon} ${a.name}`); o.value = a.id; msel.appendChild(o); });
  msel.onchange = () => selectAgent(msel.value);
  mbar.appendChild(msel);
  const mws = el("button", "mb-reset", "⭐"); mws.title = "Veckostart";
  mws.onclick = startWeek;
  mbar.appendChild(mws);
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
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !COARSE) { e.preventDefault(); composer.requestSubmit(); } });
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
  state.pendingRoutine = null; // agentbyte = rutinklicket är inte längre "på väg"
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

  document.body.classList.remove("drawer-open"); // stäng mobil-drawern vid val
  renderLog();
  if (!COARSE) setTimeout(() => $("#composer-input")?.focus(), 30);
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
  msgs.forEach((m) => log.appendChild(bubble(m.role, m.content, m)));
  log.scrollTop = log.scrollHeight;
}

function bubble(role, text, msg) {
  const row = el("div", `msg msg-${role}`);
  const b = el("div", "bubble");
  if (role === "assistant") {
    b.setAttribute("aria-label", "Svar");
    renderMarkdown(b, text); // agenterna svarar med rubriker/listor/fetstil
    if (text) addActions(row, () => text); // färdiga svar får kopiera/ladda ner
    // Mötesanteckningar bär deltagarnas oberoende perspektiv — produktens
    // bevis för att mötet inte är en modell som lajvar roller. Visa dem.
    if (msg && Array.isArray(msg.perspectives) && msg.perspectives.length) row.appendChild(perspToggle(msg.perspectives));
  } else {
    b.textContent = text;
  }
  row.appendChild(b);
  return row;
}

// Utfällbara deltagarperspektiv under en mötesanteckning.
function perspToggle(perspectives) {
  const wrap = el("div", "persp-wrap");
  const btn = el("button", "act-btn persp-btn", `Visa deltagarnas perspektiv (${perspectives.length}) ▾`);
  btn.type = "button";
  const box = el("div", "persp-box"); box.style.display = "none";
  perspectives.forEach((p) => {
    const item = el("div", "persp-item");
    item.appendChild(el("div", "persp-name", p.name + (p.tagline ? ` — ${p.tagline}` : "")));
    const t = el("div", "persp-text"); renderMarkdown(t, p.text);
    item.appendChild(t);
    box.appendChild(item);
  });
  btn.onclick = () => {
    const open = box.style.display !== "none";
    box.style.display = open ? "none" : "";
    btn.textContent = `${open ? "Visa" : "Dölj"} deltagarnas perspektiv (${perspectives.length}) ${open ? "▾" : "▴"}`;
  };
  wrap.appendChild(btn); wrap.appendChild(box);
  return wrap;
}

// ---------- kostnadsvisning ----------
// BYO-kundens största oro är "vad kostar det här?" — svaret är öre, och det
// ska synas. Tokenpriser är uppskattningar (USD/miljon tokens) och visas som
// "≈"; veckosumman ackumuleras per ISO-vecka i localStorage.
const SEK_PER_USD = 10.5;
const CLAUDE_PRICES = { // model-id-prefix → [input, output] USD per miljon tokens
  "claude-opus": [15, 75],
  "claude-sonnet": [3, 15],
  "claude-haiku": [1, 5],
};
let orPriceMap = null; // fylls från OpenRouters katalog (USD per token)
function ensureOrPrices() {
  if (orPriceMap || !isOpenRouter() || state.demo) return;
  orPriceMap = {};
  window.ATBClaude.openrouterModels().then((models) => {
    models.forEach((m) => { if (m.pricing) orPriceMap[m.id] = m.pricing; });
  }).catch(() => { orPriceMap = null; });
}
function costSek(used) {
  if (!used || (!used.input && !used.output)) return null;
  if (isOpenRouter()) {
    const p = orPriceMap && orPriceMap[state.model];
    if (!p || (!p.prompt && !p.completion)) return null;
    return (used.input * (p.prompt || 0) + used.output * (p.completion || 0)) * SEK_PER_USD;
  }
  const key = Object.keys(CLAUDE_PRICES).find((k) => state.model.startsWith(k));
  if (!key) return null;
  const [inP, outP] = CLAUDE_PRICES[key];
  return ((used.input * inP + used.output * outP) / 1e6) * SEK_PER_USD;
}
function isoWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3); // torsdagen i samma vecka
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${week}`;
}
// Senaste anropskedjans kostnad (nollställs i submitMessage/runMeeting-start
// implicit genom att läsas och visas direkt efter svaret).
let lastCallCost = 0;
function costAdd(used) {
  const c = costSek(used);
  if (c == null) return;
  lastCallCost += c;
  try {
    const key = "atb_cost_" + (state.slug || "team");
    const cur = JSON.parse(localStorage.getItem(key) || "null");
    const wk = isoWeek();
    const rec = cur && cur.week === wk ? cur : { week: wk, sek: 0 };
    rec.sek += c;
    localStorage.setItem(key, JSON.stringify(rec));
  } catch (_) { /* full storage — visningen är nice-to-have */ }
}
function costWeekSek() {
  try {
    const rec = JSON.parse(localStorage.getItem("atb_cost_" + (state.slug || "team")) || "null");
    return rec && rec.week === isoWeek() ? rec.sek : 0;
  } catch (_) { return 0; }
}
const fmtSek = (v) => (v >= 1 ? v.toFixed(2) : v.toFixed(2)).replace(".", ",") + " kr";
// Liten kostnadsrad under ett svar: "≈ 0,04 kr · den här veckan: 3,20 kr".
function appendCost(row) {
  if (state.demo || lastCallCost <= 0) { lastCallCost = 0; return; }
  const c = el("div", "msg-cost", `≈ ${fmtSek(lastCallCost)} · den här veckan: ${fmtSek(costWeekSek())}`);
  c.title = "Uppskattad API-kostnad via din egen nyckel (tokenpris × förbrukning). Ingen avgift till Mitt AI-team.";
  row.appendChild(c);
  lastCallCost = 0;
}

// ---------- kom igång-checklista ----------
// Fem steg där de två första ger omedelbart värde och de sista bygger
// investerat värde (minne, möte, mapp). Läge härleds ur riktig användning +
// små flaggor i localStorage; kortet försvinner när allt är gjort.
function introState() {
  try { return JSON.parse(localStorage.getItem("atb_intro_" + state.slug) || "{}") || {}; }
  catch (_) { return {}; }
}
function introMark(key) {
  try {
    const s = introState(); if (s[key]) return;
    s[key] = true;
    localStorage.setItem("atb_intro_" + state.slug, JSON.stringify(s));
  } catch (_) { /* full storage */ }
}
function renderIntroCard() {
  if (state.demo) return null;
  const s = introState();
  if (s.dismissed) return null;
  const entry = agentById(team.entryAgent) || team.agents[0];
  const anyChat = Object.values(state.history).some((m) => m && m.length);
  const hasMaterial = !!(loadMemory().trim() || loadDocs().length);
  const steps = [
    { done: anyChat, label: `Ställ en riktig fråga till ${entry.name}`, act: () => selectAgent(team.entryAgent) },
    { done: !!s.week, label: "Kör din första Veckostart", act: startWeek },
    { done: hasMaterial, label: "Lägg in ett underlag eller minne", act: openMemory },
    { done: !!s.meeting, label: "Håll ditt första möte", act: openMeeting },
  ];
  if (FOLDER_SUPPORTED) steps.push({ done: folderActive(), label: "Koppla en mapp på datorn", act: openMemory });
  const doneCount = steps.filter((x) => x.done).length;
  if (doneCount === steps.length) return null;
  const card = el("div", "intro-card");
  const head = el("div", "intro-head");
  head.appendChild(el("span", "side-label", `Kom igång · ${doneCount} av ${steps.length}`));
  const x = el("button", "intro-x", "✕"); x.type = "button"; x.title = "Dölj checklistan";
  x.onclick = () => { introMark("dismissed"); card.remove(); };
  head.appendChild(x);
  card.appendChild(head);
  steps.forEach((st) => {
    const b = el("button", "intro-step" + (st.done ? " done" : "")); b.type = "button";
    b.appendChild(el("span", "intro-tick", st.done ? "✓" : "○"));
    b.appendChild(el("span", "intro-label", st.label));
    if (st.done) b.disabled = true; else b.onclick = st.act;
    card.appendChild(b);
  });
  return card;
}

// ============================================================
// ACKUMULERING & PROAKTIVITET (etapp 2 i roadmap-anvandarvarde)
// Sidöppningen är portalens enda trigger — varje öppning ska mötas av
// något som redan är gjort eller räknat: avbockade rutiner, streak,
// puls-kort, auto-körda rutiner och ett minne som synligt växer.
// ============================================================

// ---------- veckoräkning ----------
function weekStartMs(ms) { // torsdagen kl 12 i ISO-veckan — stabil bas för veckodiff
  const d = new Date(ms);
  const day = (d.getDay() + 6) % 7;
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - day + 3);
  return d.getTime();
}
const weeksBetween = (a, b) => Math.round((weekStartMs(b) - weekStartMs(a)) / (7 * 86400000));
function mondayMs() { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d.getTime(); }
const quarterOf = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`; };
const todayDayNo = () => ((new Date().getDay() + 6) % 7) + 1; // 1=mån … 7=sön

// ---------- rutinlogg (avbockning per ISO-vecka) ----------
function routLoad() {
  try { const r = JSON.parse(localStorage.getItem("atb_rout_" + state.slug) || "null"); if (r && r.week === isoWeek() && Array.isArray(r.done)) return r; } catch (_) { /* trasig — börja om */ }
  return { week: isoWeek(), done: [] };
}
function routSave(r) { try { localStorage.setItem("atb_rout_" + state.slug, JSON.stringify(r)); } catch (_) { /* full storage */ } }
function routineDone(label) { return routLoad().done.some((d) => (d.label || d) === label); }
function routineMarkDone(label) {
  if (state.demo) return;
  const r = routLoad();
  if (r.done.some((d) => (d.label || d) === label)) return;
  r.done.push({ label, at: Date.now() });
  routSave(r);
  touchStreak();
  syncStatusToFolder(); // dela avbockningen med kollegor via mappen (best effort)
  // Uppdatera sidopanelens rutinknapp utan full omritning.
  document.querySelectorAll(".routine-item").forEach((n) => {
    if (n.dataset.label === label) { n.classList.add("done"); const dEl = n.querySelector(".routine-day"); if (dEl) dEl.textContent = "klar ✓"; }
  });
}

// ---------- vecko-streak (med semester-freeze, en per kvartal) ----------
// Rätt enhet för en småföretagare är veckor, inte dagar. En missad vecka per
// kvartal förlåts tyst — annars nollställer semestern och demotiverar.
function touchStreak() {
  if (state.demo) return;
  try {
    const key = "atb_streak_" + state.slug;
    const s = JSON.parse(localStorage.getItem(key) || "null") || { lastAt: 0, count: 0, freezeQ: "" };
    if (!s.lastAt) s.count = 1;
    else {
      const gap = weeksBetween(s.lastAt, Date.now());
      if (gap === 1) s.count += 1;
      else if (gap === 2 && s.freezeQ !== quarterOf(Date.now())) { s.count += 1; s.freezeQ = quarterOf(Date.now()); }
      else if (gap > 1) s.count = 1;
      // gap === 0 → samma vecka, räknaren står kvar
    }
    s.lastAt = Date.now();
    localStorage.setItem(key, JSON.stringify(s));
  } catch (_) { /* full storage */ }
}
function streakCount() {
  try {
    const s = JSON.parse(localStorage.getItem("atb_streak_" + state.slug) || "null");
    if (!s || !s.lastAt) return 0;
    return weeksBetween(s.lastAt, Date.now()) > 2 ? 0 : s.count;
  } catch (_) { return 0; }
}

// ---------- minnesräknaren ----------
function memoryFactCount() { return loadMemory().split("\n").map((s) => s.trim()).filter((s) => s.length > 2).length; }
function factLabel() {
  const c = memoryFactCount();
  return c ? `🧠 Teamet känner till ${c} ${c === 1 ? "sak" : "saker"} om er verksamhet` : "🧠 Lär teamet er verksamhet";
}
function paintFactCount() { const n = $("#fact-count"); if (n) n.textContent = factLabel(); }

// ---------- minnesförslag med godkännande ----------
// Klibbighetsmotorn: teamet blir märkbart smartare vecka för vecka, och
// kunden ser investeringen växa. Automatiskt förslag, manuell grind —
// ingenting skrivs till minnet utan ett aktivt ja.
const MEM_SUGGEST_PROMPT = `Du hjälper ett företags AI-team att bygga sitt delade minne.
Läs samtalsutdraget och föreslå 0–3 KORTA rader med stabila fakta om företaget som är värda att spara: beslut, preferenser, siffror, arbetssätt. Inte tillfälligheter, inte AI:ns egna förslag — bara sådant ANVÄNDAREN själv sagt eller bekräftat.
Upprepa inget som redan står i minnet. Returnera EN rad per faktum, varje rad börjar med "- ". Finns inget nytt att spara: svara exakt "INGA".`;
async function suggestMemory(agentId) {
  if (state.demo || !state.apiKey || state.streaming) return;
  const msgs = (state.history[agentId] || []).slice(-8);
  if (!msgs.length) return;
  const convo = msgs.map((m) => `${m.role === "user" ? "ANVÄNDAREN" : "AGENTEN"}: ${(m.content || "").slice(0, 1500)}`).join("\n\n");
  const box = openOverlay("🧠 Förslag till minnet");
  const status = el("p", "ovl-lead", "Läser samtalet och letar efter fakta värda att spara…");
  box.appendChild(status);
  let out = "";
  try {
    out = await window.ATBClaude.collect({
      apiKey: state.apiKey, model: state.model, system: MEM_SUGGEST_PROMPT,
      messages: [{ role: "user", content: `BEFINTLIGT MINNE:\n${loadMemory().trim() || "(tomt)"}\n\nSAMTAL:\n${convo}` }],
      maxTokens: 400, onUsage: costAdd,
    });
  } catch (e) { status.textContent = "⚠️ " + ((e && e.message) || "Gick inte att hämta förslag — försök igen."); return; }
  const lines = out.split("\n").map((s) => s.replace(/^[-•\s]+/, "").trim()).filter((s) => s && !/^INGA\b/i.test(s)).slice(0, 3);
  if (!lines.length) { status.textContent = "Inget nytt att spara ur det här samtalet — minnet är redan uppdaterat."; return; }
  status.textContent = "Bocka i det som stämmer — det sparas i teamets delade minne som alla agenter ser:";
  const checks = lines.map((l) => {
    const lab = el("label", "meet-part");
    const c = el("input"); c.type = "checkbox"; c.checked = true;
    lab.appendChild(c); lab.appendChild(el("span", null, l));
    box.appendChild(lab);
    return { c, l };
  });
  const save = el("button", "btn-primary ovl-save", "Spara i minnet"); save.type = "button";
  save.onclick = () => {
    const picked = checks.filter((x) => x.c.checked).map((x) => "• " + x.l);
    if (picked.length) {
      const mem = loadMemory();
      saveMemory((mem.trim() ? mem.replace(/\s+$/, "") + "\n" : "") + picked.join("\n"));
      paintFactCount();
    }
    closeOverlay();
  };
  box.appendChild(save);
}

// ---------- puls-kort ----------
// 2–3 lokalt beräknade kort ovanför chatten — ingen AI-kostnad, alltid
// färska. Portalen har alltid något att säga när den öppnas.
let pulseNewWeek = null;   // beräknas en gång per sidladdning
const autoDelivered = [];  // auto-körda rutiner denna sidladdning → "ligger klar"-kort
function renderPulse() {
  const old = $("#pulse-strip"); if (old) old.remove();
  if (state.demo) return;
  const main = document.querySelector(".main"); if (!main) return;
  const today = new Date().toISOString().slice(0, 10);
  try { if (localStorage.getItem("atb_pulse_snooze_" + state.slug) === today) return; } catch (_) { /* läsfel — visa ändå */ }

  if (pulseNewWeek === null) {
    let lastVisit = null;
    try { lastVisit = localStorage.getItem("atb_visit_" + state.slug); } catch (_) { /* läsfel */ }
    const anyHistory = Object.values(state.history).some((m) => m && m.length);
    pulseNewWeek = !!(anyHistory && lastVisit && lastVisit !== isoWeek());
    try { localStorage.setItem("atb_visit_" + state.slug, isoWeek()); } catch (_) { /* full storage */ }
  }

  const cards = [];
  autoDelivered.forEach((d) => {
    const a = agentById(d.agentId);
    cards.push({ icon: "✅", label: `${d.label} ligger klar hos ${a ? a.name : "teamet"} — läs`, act: () => selectAgent(d.agentId) });
  });
  if (pulseNewWeek) cards.push({ icon: "☀️", label: "Ny vecka — få \"Veckan som gick\" + förslag på veckans fokus", act: () => { pulseNewWeek = false; weekReview(); } });
  (team.routines || []).forEach((rt) => {
    if (rt.day === todayDayNo() && !routineDone(rt.label)) cards.push({ icon: "📌", label: `Idag: ${rt.label}`, act: () => runRoutine(rt) });
  });
  if (team.firstProject) {
    let last = 0;
    try { last = +localStorage.getItem("atb_fp_" + state.slug) || 0; } catch (_) { /* läsfel */ }
    const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
    if (days === null) cards.push({ icon: "🎯", label: "Första projektet väntar på sitt första steg", act: openFirstProject });
    else if (days >= 7) cards.push({ icon: "🎯", label: `${days} dagar sedan ni rörde första projektet`, act: openFirstProject });
  }
  // Årshjulet: närmaste säsongshändelse ur teamkonfigen (`seasons`) inom
  // fyra veckor — "3 veckor till mässan" är initiativ som känns som personal.
  const seasons = Array.isArray(team.seasons) ? team.seasons : [];
  const now = new Date();
  let nextSeason = null;
  seasons.forEach((s) => {
    if (!s || !s.label || !s.month) return;
    let when = new Date(now.getFullYear(), s.month - 1, s.day || 1);
    if (when < now && (now - when) / 86400000 > 1) when = new Date(now.getFullYear() + 1, s.month - 1, s.day || 1);
    const days = Math.ceil((when - now) / 86400000);
    if (days >= 0 && days <= 28 && (!nextSeason || days < nextSeason.days)) nextSeason = { s, days };
  });
  if (nextSeason) {
    const aid = nextSeason.s.agentId && agentById(nextSeason.s.agentId) ? nextSeason.s.agentId : team.entryAgent;
    const lbl = nextSeason.days === 0 ? `Idag: ${nextSeason.s.label}` : `${nextSeason.days} dagar till ${nextSeason.s.label} — dags att börja?`;
    cards.push({ icon: "🗓", label: lbl, act: () => {
      selectAgent(aid);
      const ta = $("#composer-input");
      if (ta) {
        ta.value = nextSeason.s.prompt || `Det är ${nextSeason.days} dagar kvar till ${nextSeason.s.label}. Vad borde vi börja med nu, och vad kan vänta?`;
        ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
        if (!COARSE) ta.focus();
      }
    } });
  }
  if (!loadMemory().trim() && !loadDocs().length) cards.push({ icon: "🧠", label: "Teamet känner er inte än — lägg in ett underlag eller minne", act: openMemory });
  if (!cards.length) return;

  const strip = el("div", "pulse-strip"); strip.id = "pulse-strip";
  cards.slice(0, 3).forEach((c) => {
    const b = el("button", "pulse-card"); b.type = "button";
    b.appendChild(el("span", "pulse-ico", c.icon));
    b.appendChild(el("span", "pulse-txt", c.label));
    b.onclick = c.act;
    strip.appendChild(b);
  });
  const x = el("button", "pulse-x", "✕"); x.type = "button"; x.title = "Dölj för idag";
  x.onclick = () => { try { localStorage.setItem("atb_pulse_snooze_" + state.slug, today); } catch (_) { /* full storage */ } strip.remove(); };
  strip.appendChild(x);
  main.insertBefore(strip, $("#chat-header"));
}

// ---------- veckan som gick ----------
// Grammarly/Strava-mönstret fast i produkten: kvantifiera värdet varje vecka.
// Metadatan är lokal (tidsstämplar, rutinlogg, minnesräknare) — ett enda
// anrop, och bara när kunden klickar på kortet.
function weekReview() {
  if (state.streaming) return;
  const since = Date.now() - 7 * 86400000;
  const perAgent = [];
  team.agents.forEach((a) => {
    const q = (state.history[a.id] || []).filter((m) => m.at && m.at >= since && m.role === "user").length;
    if (q) perAgent.push(`- ${a.name}: ${q} frågor/uppgifter`);
  });
  const meetings = Object.values(state.history).flat().filter((m) => m && m.at && m.at >= since && m.role === "user" && /^🤝 Möte/.test(m.content || "")).length;
  const doneR = routLoad().done.map((d) => d.label || d);
  const facts = memoryFactCount();
  const meta = [
    perAgent.length ? `Aktivitet per agent senaste 7 dagarna:\n${perAgent.join("\n")}` : "Ingen loggad aktivitet senaste 7 dagarna.",
    meetings ? `Antal möten: ${meetings}` : null,
    doneR.length ? `Avklarade rutiner denna vecka: ${doneR.join(", ")}` : null,
    facts ? `Teamets delade minne: ${facts} rader.` : null,
  ].filter(Boolean).join("\n");
  selectAgent(team.entryAgent);
  touchStreak();
  submitMessage(`Ny vecka! Teamets aktivitetsdata:\n${meta}\n\nGe mig: 1) en kort återblick — vad vi ägnade oss åt (utgå från datan ovan, gissa inga detaljer), 2) förslag på veckans tre fokus med motivering, 3) vilken rutin eller agent jag borde börja med idag. Kort och konkret.`);
}

// ---------- auto-körda rutiner ----------
// Rutiner med auto:true i teamkonfigen genereras klart i bakgrunden när
// portalen öppnas på rätt dag — skillnaden mellan "teamet väntar på order"
// och "teamet har redan jobbat". Kräver komplett prompt (inga [fyll i]),
// körs max en gång per vecka och rutin, och får aldrig störa vid fel.
async function runAutoRoutines() {
  if (state.demo || !state.apiKey || state.streaming) return;
  // Dagfönster: rutinens dag ELLER senare samma vecka — den som öppnar
  // portalen på tisdag ska inte bli utan måndagsbriefen.
  const due = (team.routines || []).filter((rt) =>
    rt.auto === true && rt.day != null && rt.day <= todayDayNo() && rt.prompt && !rt.prompt.includes("[fyll i]") && !routineDone(rt.label));
  for (const rt of due) {
    // Racea aldrig användarens egen chatt: börjar den strömma, avvakta auto
    // till nästa sidöppning (rutinen är fortfarande obockad och körs då).
    if (state.streaming) return;
    const agent = agentById(rt.agentId) || agentById(team.entryAgent);
    if (!agent) continue;
    try {
      const costBefore = lastCallCost; // stör inte användarens pågående kostnadsräkning
      const userMsg = { role: "user", content: `${rt.prompt}\n\n(Stående rutin, körd automatiskt av portalen. Leverera ett färdigt utkast — lista i slutet vad du vill ha kompletterat om något saknas.)`, at: Date.now() };
      const reply = await window.ATBClaude.collect({
        apiKey: state.apiKey, model: state.model, system: systemFor(agent),
        messages: (state.history[agent.id] || []).map((m) => ({ role: m.role, content: m.content })).concat([{ role: "user", content: userMsg.content }]),
        maxTokens: 4096, onUsage: costAdd,
      });
      lastCallCost = costBefore;
      if (!state.history[agent.id]) state.history[agent.id] = [];
      state.history[agent.id].push(userMsg, { role: "assistant", content: reply, at: Date.now(), auto: true });
      saveHistory();
      routineMarkDone(rt.label);
      autoDelivered.push({ label: rt.label, agentId: agent.id });
      // Rita inte om loggen mitt i en pågående strömning hos användaren.
      if (state.activeAgentId === agent.id && !state.streaming) renderLog();
      renderPulse();
    } catch (_) { /* auto får aldrig störa — rutinen går att köra manuellt */ }
  }
}

// ---------- "därför ser ert team ut så här" (anställningsceremonin) ----------
// Quiz-effekten: att se kopplingen mellan sina egna svar och teamet mer än
// dubblar upplevd träffsäkerhet. Nejen (avvisade agenter) är produktens
// starkaste förtroendeargument — en AI som säger nej till sig själv.
function whyAvailable() {
  return (team.agents || []).some((a) => a.why) || (Array.isArray(team.rejected) && team.rejected.length > 0) || !!team.divergence;
}
function openWhyTeam() {
  const box = openOverlay("✨ Därför ser ert team ut så här");
  box.appendChild(el("p", "ovl-lead", "Teamet är ingen mall — varje agent finns för att något i just er verksamhet krävde den. Här är kopplingen, byggd på det ni själva berättade."));
  (team.agents || []).forEach((a) => {
    if (!a.why && !a.job) return;
    const row = el("div", "why-row");
    const head = el("div", "why-head");
    head.appendChild(agentIcon(a, "why-icon"));
    head.appendChild(el("span", "why-name", a.name));
    row.appendChild(head);
    row.appendChild(el("div", "why-text", a.why || a.job));
    box.appendChild(row);
  });
  if (Array.isArray(team.rejected) && team.rejected.length) {
    box.appendChild(el("div", "ovl-label", "Det vi medvetet sa nej till"));
    team.rejected.forEach((r) => {
      const row = el("div", "why-row rej");
      row.appendChild(el("div", "why-name", "✕ " + r.name));
      row.appendChild(el("div", "why-text", r.why));
      box.appendChild(row);
    });
    box.appendChild(el("p", "ovl-note", "En agent som inte kan motiveras av ett konkret behov blir teater. Därför är nejen lika viktiga som jaen."));
  }
  if (team.divergence) {
    box.appendChild(el("div", "ovl-label", "Skulle samma team passa någon annan?"));
    box.appendChild(el("div", "why-text", team.divergence));
  }
}

// ---------- sök i historiken + arkivet ----------
// Simuleringens månad 3-fynd: utan sök tappar portalen sitt värde som
// arbetsyta med minne ("vad sa hon om prissättningen i augusti?").
function snippetAround(text, idx, qlen) {
  const start = Math.max(0, idx - 60);
  return (start > 0 ? "…" : "") + text.slice(start, idx + qlen + 90).replace(/\s+/g, " ").trim() + "…";
}
function openSearch() {
  const box = openOverlay("🔍 Sök i historiken");
  box.appendChild(el("p", "ovl-lead", "Söker i alla agenters samtal" + (folderActive() ? " och i mappens arkiv." : ". Koppla en mapp så söks även arkiverade äldre samtal.")));
  const inp = el("input", "ovl-input"); inp.placeholder = "Sök ord eller fras…";
  const res = el("div", "search-res");
  const run = async () => {
    const q = inp.value.trim().toLowerCase();
    res.innerHTML = "";
    if (q.length < 2) return;
    const hits = [];
    team.agents.forEach((a) => {
      (state.history[a.id] || []).forEach((m) => {
        const idx = (m.content || "").toLowerCase().indexOf(q);
        if (idx >= 0) hits.push({ agent: a, role: m.role, at: m.at, snippet: snippetAround(m.content, idx, q.length) });
      });
    });
    if (folderActive()) {
      try {
        const dir = await state.folder.handle.getDirectoryHandle("arkiv");
        for await (const [name, h] of dir.entries()) {
          if (h.kind !== "file" || !name.endsWith(".md")) continue;
          const text = await (await h.getFile()).text();
          const lower = text.toLowerCase();
          let from = 0, idx, n = 0;
          while ((idx = lower.indexOf(q, from)) >= 0 && n < 10) {
            const a = agentById(name.replace(/\.md$/, ""));
            hits.push({ agent: a || { name: name.replace(/\.md$/, "") }, role: "arkiv", at: null, snippet: snippetAround(text, idx, q.length) });
            from = idx + q.length; n++;
          }
        }
      } catch (_) { /* inget arkiv än */ }
    }
    if (!hits.length) { res.appendChild(el("div", "doc-empty", "Inga träffar.")); return; }
    hits.sort((x, y) => (y.at || 0) - (x.at || 0));
    hits.slice(0, 50).forEach((h) => {
      const row = el("button", "search-hit"); row.type = "button";
      row.appendChild(el("div", "search-meta",
        `${h.agent.name || "?"} · ${h.role === "user" ? "du" : h.role === "arkiv" ? "arkiv" : "svar"}${h.at ? " · " + new Date(h.at).toLocaleDateString("sv-SE") : ""}`));
      row.appendChild(el("div", "search-snip", h.snippet));
      if (h.agent.id) row.onclick = () => { closeOverlay(); selectAgent(h.agent.id); };
      res.appendChild(row);
    });
    if (hits.length > 50) res.appendChild(el("p", "ovl-note", `Visar 50 av ${hits.length} träffar — förfina sökningen.`));
  };
  let t;
  inp.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 250); });
  box.appendChild(inp);
  box.appendChild(res);
  setTimeout(() => inp.focus(), 60);
}

// ---------- utveckla teamet (växtväg utan konsultsamtal) ----------
// Simuleringens oktober-kris: ett avvisat moment behövdes plötsligt, och
// portalen hade ingen väg att växa teamet → "varför betalar vi"-frågan.
// Avvisade moment är "först i kön"; ett anrop genererar en komplett agent
// som förhandsvisas och läggs till som lokalt tillägg efter godkännande.
function extractJsonBlock(s) {
  const t = (s || "").trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = t.indexOf("{");
  if (start === -1) throw new Error("ingen JSON i svaret");
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; }
    else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return t.slice(start, i + 1); }
  }
  throw new Error("ofullständig JSON");
}
const GROW_RULES = `Du utökar ett befintligt AI-agentteam för ett företag med EN ny agent.
Regler:
- Agenten måste motiveras av kundens beskrivna behov. Fabricera inget.
- Den får inte dela perspektiv med någon befintlig agent — den ska se något ingen annan ser.
- system skrivs FÖR agenten (inte för användaren) med: kontext + roll, DITT PERSPEKTIV (blicken den resonerar från), DINA KAPACITETER (punktlista), LEVERANS med 2–4 "Klart när"-punkter som går att svara ja/nej på, ARBETSSÄTT (be om data som saknas i stället för att gissa), TON (svenska, vardaglig och rak), VIKTIGT (vad agenten INTE gör — slutbeslut, juridik och relationer ligger hos människan).
- why = EN mening som knyter agenten till kundens egna ord.
- starters = 2–4 korta exempeluppgifter i du-form, konkreta nog att skicka direkt.
- routine bara om behovet är återkommande (annars null); prompt i du-form med [fyll i]-luckor; auto alltid false; timeEstimate alltid null.
Returnera ENBART giltig JSON (inga staket, ingen text runt):
{ "agent": { "id": "<kebab-case>", "name": "", "icon": "<emoji>", "role": "", "tagline": "", "always": false, "job": "", "why": "", "capabilities": [""], "starters": [""], "system": "" }, "routine": { "label": "", "agentId": "<samma id>", "day": null, "timeEstimate": null, "auto": false, "prompt": "" } | null }`;

function openGrow() {
  const box = openOverlay("🔄 Utveckla teamet");
  box.appendChild(el("p", "ovl-lead", "Verksamheter förändras — teamet ska kunna växa med er. Beskriv vad som ändrats, eller aktivera något vi medvetet sa nej till vid bygget."));

  const ta = el("textarea", "ovl-ta"); ta.rows = 3;
  ta.placeholder = "T.ex: Vi har börjat söka projektstöd och behöver hjälp med ansökningarna — deadline i april.";

  if (Array.isArray(team.rejected) && team.rejected.length) {
    box.appendChild(el("div", "ovl-label", "Först i kön — det vi sa nej till vid bygget"));
    team.rejected.forEach((r) => {
      const row = el("div", "why-row rej");
      const head = el("div", "why-head");
      head.appendChild(el("span", "why-name", r.name));
      const act = el("button", "act-btn", "Aktivera →"); act.type = "button";
      act.onclick = () => { ta.value = `Vi behöver nu hjälp med: ${r.name}. (Avvisades vid bygget med motiveringen: ${r.why})`; ta.focus(); };
      head.appendChild(act);
      row.appendChild(head);
      row.appendChild(el("div", "why-text", r.why));
      box.appendChild(row);
    });
  }

  box.appendChild(el("div", "ovl-label", "Vad har ändrats / vad behöver ni?"));
  box.appendChild(ta);
  const errEl = el("div", "setup-err"); errEl.style.display = "none"; box.appendChild(errEl);
  const preview = el("div", "grow-preview");
  box.appendChild(preview);

  const go = el("button", "btn-primary ovl-save", "Föreslå en ny agent"); go.type = "button";
  go.onclick = async () => {
    const need = ta.value.trim();
    if (need.length < 10) { errEl.textContent = "Beskriv behovet med åtminstone en mening."; errEl.style.display = "block"; return; }
    if (state.demo || !state.apiKey) { errEl.textContent = "Kräver en inkopplad nyckel — demoläget kan inte generera."; errEl.style.display = "block"; return; }
    errEl.style.display = "none";
    go.disabled = true; go.textContent = "Formar agenten… (~30 s)";
    preview.innerHTML = "";
    try {
      const existing = team.agents.map((a) => `- ${a.name} (${a.id}): ${a.job || a.tagline || ""}`).join("\n");
      const mem = loadMemory().trim().slice(0, 1500);
      const raw = await window.ATBClaude.collect({
        apiKey: state.apiKey, model: state.model, system: GROW_RULES,
        messages: [{ role: "user", content: `FÖRETAG: ${team.company} — ${team.tagline || ""}\n\nBEFINTLIGA AGENTER:\n${existing}\n\nKUNDENS BEHOV:\n${need}${mem ? `\n\nUR FÖRETAGSMINNET:\n${mem}` : ""}` }],
        maxTokens: 4096, onUsage: costAdd,
      });
      const data = JSON.parse(extractJsonBlock(raw));
      const a = data.agent;
      if (!a || !a.id || !a.system) throw new Error("svaret saknade en komplett agent");
      if (team.agents.some((b) => b.id === a.id)) a.id = a.id + "-2";
      if (data.routine) data.routine.agentId = a.id;
      renderGrowPreview(preview, a, data.routine || null);
    } catch (e) {
      errEl.textContent = "Kunde inte forma agenten: " + ((e && e.message) || "okänt fel") + " — försök igen.";
      errEl.style.display = "block";
    } finally {
      go.disabled = false; go.textContent = "Föreslå en ny agent";
    }
  };
  box.appendChild(go);

  // Befintliga tillägg — kan tas bort (grundteamet kan inte).
  let ext = null;
  try { ext = JSON.parse(localStorage.getItem("atb_teamext_" + state.slug) || "null"); } catch (_) { /* trasigt */ }
  if (ext && Array.isArray(ext.agents) && ext.agents.length) {
    box.appendChild(el("div", "ovl-label", "Tillagda efter bygget"));
    ext.agents.forEach((a) => {
      const row = el("div", "doc-row");
      row.appendChild(el("span", "doc-title", `${a.icon || "•"} ${a.name}`));
      const del = el("button", "doc-del", "✕"); del.type = "button"; del.title = "Ta bort tillägget (historiken för agenten rensas inte)";
      del.onclick = () => {
        if (!confirm(`Ta bort ${a.name} ur teamet?`)) return;
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem("atb_teamext_" + state.slug) || "{}") || {}; } catch (_) { /* trasigt — bygg om */ }
        cur.agents = (cur.agents || []).filter((x) => x.id !== a.id);
        cur.routines = (cur.routines || []).filter((r) => r.agentId !== a.id);
        try { localStorage.setItem("atb_teamext_" + state.slug, JSON.stringify(cur)); } catch (_) { /* full storage */ }
        team.agents = team.agents.filter((x) => x.id !== a.id);
        team.routines = (team.routines || []).filter((r) => r.agentId !== a.id);
        // Stod kunden i den borttagna agentens chatt? Peka om till ingången,
        // annars renderas en portal utan aktiv agent (och nästa send kastar).
        if (state.activeAgentId === a.id) state.activeAgentId = agentById(team.entryAgent) ? team.entryAgent : team.agents[0].id;
        closeOverlay(); renderPortal();
      };
      row.appendChild(del);
      box.appendChild(row);
    });
  }
  box.appendChild(el("p", "ovl-note", "Tillägg sparas lokalt i den här webbläsaren (och följer med i delningslänkar/teamfiler du skapar härifrån). För en full omprövning av hela teamet: kör en ny Builder-körning."));
}

function renderGrowPreview(preview, a, routine) {
  preview.innerHTML = "";
  const card = el("div", "why-row");
  const head = el("div", "why-head");
  head.appendChild(el("span", "why-icon", a.icon || "•"));
  head.appendChild(el("span", "why-name", `${a.name} — ${a.role || ""}`));
  card.appendChild(head);
  if (a.why) card.appendChild(el("div", "why-text", a.why));
  if (a.job) card.appendChild(el("div", "why-text", a.job));
  if (Array.isArray(a.capabilities) && a.capabilities.length) {
    const ul = el("ul", "week-list");
    a.capabilities.slice(0, 6).forEach((c) => ul.appendChild(el("li", null, c)));
    card.appendChild(ul);
  }
  if (routine) card.appendChild(el("div", "why-text", `Föreslagen rutin: ${routine.label}${routine.day ? ` (${dayName(routine.day)})` : ""}`));
  preview.appendChild(card);
  const add = el("button", "btn-primary ovl-save", `✓ Lägg till ${a.name} i teamet`); add.type = "button";
  add.onclick = () => {
    let cur = {};
    try { cur = JSON.parse(localStorage.getItem("atb_teamext_" + state.slug) || "{}") || {}; } catch (_) { /* trasigt */ }
    cur.agents = (cur.agents || []).concat([a]);
    if (routine) cur.routines = (cur.routines || []).concat([routine]);
    try { localStorage.setItem("atb_teamext_" + state.slug, JSON.stringify(cur)); } catch (_) { alert("Kunde inte spara tillägget (lagringen är full)."); return; }
    a.added = true;
    team.agents.push(a);
    if (routine) (team.routines = team.routines || []).push(routine);
    assignAvatars(team);
    closeOverlay();
    renderPortal();
    selectAgent(a.id);
  };
  preview.appendChild(add);
}

// ---------- dela & exportera team ----------
function openShare() {
  const box = openOverlay("🔗 Dela & exportera teamet");
  box.appendChild(el("p", "ovl-lead", "Teamet kan flyttas som en länk eller en fil — ingen server inblandad. Mottagaren använder sin egen nyckel. Chatthistorik, minne och underlag följer inte med."));
  const linkBtn = el("button", "btn-primary ovl-save", "🔗 Kopiera delningslänk"); linkBtn.type = "button";
  linkBtn.onclick = async () => {
    try {
      const b64 = await window.ATBClaude.encodeTeamLink(team);
      await navigator.clipboard.writeText(new URL(location.pathname, location.href).href + "#cfg=" + b64);
      linkBtn.textContent = "Kopierad ✓ — skicka länken";
    } catch (_) { linkBtn.textContent = "Kunde inte kopiera"; }
    setTimeout(() => (linkBtn.textContent = "🔗 Kopiera delningslänk"), 2400);
  };
  box.appendChild(linkBtn);
  const fileBtn = el("button", "btn-primary ovl-save", "⬇ Ladda ner teamfil (.json)"); fileBtn.type = "button";
  fileBtn.onclick = () => {
    const name = (team.company || "team").toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "team";
    const blob = new Blob([JSON.stringify(team, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + "-ai-team.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  box.appendChild(fileBtn);
  box.appendChild(el("p", "ovl-note", "Filen öppnas via kundväljarens \"Öppna en teamfil\" på vilken dator som helst — bra som backup och för flytt mellan datorer. Länken bär hela teamet i själva adressen (efter #) och skickas aldrig till någon server."));
}

// ---------- kvartalet med teamet ----------
// Wrapped-mönstret, sparsamt: knappen dyker upp de sista tre veckorna av
// kvartalet. Lokala siffror ur portalens logg + delbar textsammanfattning.
function quarterEndsSoon() {
  const now = new Date();
  const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
  return (qEnd - now) / 86400000 <= 21;
}
function openQuarter() {
  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).getTime();
  let questions = 0, answers = 0, meetings = 0;
  const perAgent = {};
  team.agents.forEach((a) => {
    (state.history[a.id] || []).forEach((m) => {
      if (!m || !m.at || m.at < qStart) return;
      if (m.role === "user") { questions++; if (/^🤝 Möte/.test(m.content || "")) meetings++; }
      else { answers++; perAgent[a.name] = (perAgent[a.name] || 0) + 1; }
    });
  });
  const top = Object.entries(perAgent).sort((x, y) => y[1] - x[1])[0];
  const facts = memoryFactCount();
  const streak = streakCount();
  const box = openOverlay(`🏆 Kvartalet med teamet — ${quarterOf(Date.now())}`);
  box.appendChild(el("p", "ovl-lead", `Så här blev kvartalet med ${team.company}s AI-team — ur portalens egen logg.`));
  const stat = (num, lbl) => { const r = el("div", "q-stat"); r.appendChild(el("span", "q-num", String(num))); r.appendChild(el("span", "q-lbl", lbl)); return r; };
  const grid = el("div", "q-grid");
  grid.appendChild(stat(questions, "frågor & uppgifter"));
  grid.appendChild(stat(answers, "leveranser från teamet"));
  if (meetings) grid.appendChild(stat(meetings, "möten"));
  if (facts) grid.appendChild(stat(facts, "saker teamet lärt sig om er"));
  if (streak >= 2) grid.appendChild(stat(streak, "veckor i rad"));
  box.appendChild(grid);
  if (top) box.appendChild(el("p", "ovl-note", `Kvartalets arbetshäst: ${top[0]} (${top[1]} leveranser).`));
  const copyBtn = el("button", "btn-primary ovl-save", "Kopiera som text att dela"); copyBtn.type = "button";
  copyBtn.onclick = async () => {
    const parts = [`Kvartalet med vårt AI-team (${quarterOf(Date.now())}):`, `• ${questions} frågor, ${answers} leveranser`];
    if (meetings) parts.push(`• ${meetings} möten där agenterna gav oberoende perspektiv`);
    if (facts) parts.push(`• Teamet kan nu ${facts} saker om vår verksamhet`);
    if (top) parts.push(`• Flitigast: ${top[0]}`);
    parts.push("Byggt med mittaiteam.se — ett AI-team skräddarsytt från vår faktiska vecka.");
    try { await navigator.clipboard.writeText(parts.join("\n")); copyBtn.textContent = "Kopierat ✓"; }
    catch (_) { copyBtn.textContent = "Kunde inte kopiera"; }
    setTimeout(() => (copyBtn.textContent = "Kopiera som text att dela"), 2000);
  };
  box.appendChild(copyBtn);
  box.appendChild(el("p", "ovl-note", "Siffrorna bygger på det som finns sparat lokalt (historiken har ett tak per agent) — se dem som ett golv, inte facit."));
}

// ---------- veckans arbete (tidslinje) ----------
// Marblism-mönstret: rendera veckan som en berättelse ur portalens egen
// logg — rutiner, möten, svar per agent, och tid tillbaka via rutinernas
// timeEstimate. Ren frontend, ingen AI-kostnad.
function openWeekWork() {
  const box = openOverlay("📈 Veckans arbete");
  const start = mondayMs();
  const idx = (at) => Math.floor((at - start) / 86400000);
  const dayEvents = Array.from({ length: 7 }, () => ({ agents: {}, meetings: [], routines: [], auto: [] }));
  team.agents.forEach((a) => {
    (state.history[a.id] || []).forEach((m) => {
      if (!m || !m.at) return;
      const i = idx(m.at); if (i < 0 || i > 6) return;
      const d = dayEvents[i];
      if (m.role === "user" && /^🤝 Möte/.test(m.content || "")) d.meetings.push((m.content || "").replace(/^🤝\s*/, "").slice(0, 70));
      else if (m.role === "assistant") { if (m.auto) d.auto.push(a.name); else d.agents[a.name] = (d.agents[a.name] || 0) + 1; }
    });
  });
  let savedMin = 0;
  routLoad().done.forEach((d) => {
    const label = d.label || d;
    const rt = (team.routines || []).find((r) => r.label === label);
    if (rt && rt.timeEstimate) savedMin += rt.timeEstimate;
    const i = d.at ? idx(d.at) : -1;
    if (i >= 0 && i <= 6) dayEvents[i].routines.push(label);
  });
  box.appendChild(el("p", "ovl-lead", "Det du och teamet gjort den här veckan — ur portalens egen logg, inget hämtas någonstans ifrån."));
  if (savedMin) {
    const h = savedMin >= 90 ? `≈ ${(Math.round(savedMin / 30) / 2).toString().replace(".", ",")} timmar` : `≈ ${savedMin} minuter`;
    box.appendChild(el("div", "week-saved", `⏱ Avklarade rutiner motsvarar ${h} manuellt arbete`));
  }
  const DAY_FULL = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
  const todayI = Math.min(idx(Date.now()), 6);
  let any = false;
  for (let i = 0; i <= todayI; i++) {
    const d = dayEvents[i];
    const items = [];
    d.routines.forEach((r) => items.push(`✓ Rutin avklarad: ${r}`));
    d.auto.forEach((n) => items.push(`🤖 ${n} körde sin rutin automatiskt`));
    d.meetings.forEach((m) => items.push(`🤝 ${m}`));
    Object.entries(d.agents).forEach(([n, c]) => items.push(`💬 ${n}: ${c} svar`));
    if (!items.length) continue;
    any = true;
    box.appendChild(el("div", "ovl-label", DAY_FULL[i] + (i === todayI ? " · idag" : "")));
    const ul = el("ul", "week-list");
    items.forEach((t) => ul.appendChild(el("li", null, t)));
    box.appendChild(ul);
  }
  if (!any) box.appendChild(el("p", "ovl-note", "Inget loggat än den här veckan — kör en rutin eller ställ en fråga så börjar tidslinjen fyllas."));
  else box.appendChild(el("p", "ovl-note", "Samtal från före den här funktionen saknar tidsstämplar och syns inte i tidslinjen."));
}

// Kopiera/ladda ner per svar — svaret ska vidare in i mail och dokument,
// inte dö i chatten. Rå markdown kopieras (klistras fint i de flesta verktyg).
function addActions(row, getText) {
  if (row.querySelector(".msg-actions")) return;
  const acts = el("div", "msg-actions");
  const copy = el("button", "act-btn", "Kopiera"); copy.type = "button";
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(getText()); copy.textContent = "Kopierat ✓"; setTimeout(() => (copy.textContent = "Kopiera"), 1400); }
    catch (_) { copy.textContent = "Kunde inte kopiera"; setTimeout(() => (copy.textContent = "Kopiera"), 1400); }
  };
  const dl = el("button", "act-btn", "Ladda ner"); dl.type = "button"; dl.title = "Spara som markdown-fil";
  dl.onclick = () => {
    const blob = new Blob([getText()], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.slug || "team"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  acts.appendChild(copy); acts.appendChild(dl);
  if (!state.demo) {
    // Fork ("fortsätt härifrån"): räddar ett urspårat samtal utan att kunden
    // behöver förstå kontextfönster — allt efter det här svaret rensas.
    const fk = el("button", "act-btn", "✂ Fortsätt härifrån"); fk.type = "button";
    fk.title = "Ta bort allt som kommit efter det här svaret och fortsätt samtalet från den här punkten";
    fk.onclick = () => {
      const msgs = state.history[state.activeAgentId] || [];
      const i = msgs.map((m) => m.content).lastIndexOf(getText());
      if (i < 0) return;
      const after = msgs.length - 1 - i;
      if (!after) { fk.textContent = "Redan sista svaret"; setTimeout(() => (fk.textContent = "✂ Fortsätt härifrån"), 1600); return; }
      if (!confirm(`Ta bort de ${after} meddelanden som kommit efter det här svaret? Det går inte att ångra.`)) return;
      state.history[state.activeAgentId] = msgs.slice(0, i + 1);
      saveHistory();
      renderLog();
    };
    acts.appendChild(fk);
  }
  if (/```/.test(getText())) {
    // Arbetsledarläget: svar med kodblock är oftast en färdig prompt till
    // kundens egen AI — kopiera bara blocket, inte hela svaret.
    const pb = el("button", "act-btn", "🤖 Kopiera prompten"); pb.type = "button";
    pb.title = "Kopierar promptblocket — klistra in i din egen AI (t.ex. ChatGPT)";
    pb.onclick = async () => {
      const m = /```(?:\w+)?\r?\n([\s\S]*?)```/.exec(getText());
      try { await navigator.clipboard.writeText(m ? m[1].trim() : getText()); pb.textContent = "Kopierad ✓ — klistra in i din AI"; }
      catch (_) { pb.textContent = "Kunde inte kopiera"; }
      setTimeout(() => (pb.textContent = "🤖 Kopiera prompten"), 2200);
    };
    acts.appendChild(pb);
  }
  if (!state.demo) {
    // Minnesförslag med grind: agenten föreslår, användaren godkänner.
    const mb = el("button", "act-btn", "🧠 Spara lärdomar"); mb.type = "button";
    mb.title = "Låt teamet föreslå rader till det delade minnet ur det här samtalet (ett litet anrop)";
    mb.onclick = () => suggestMemory(state.activeAgentId);
    acts.appendChild(mb);
  }
  if (!state.demo && team.agents.length > 1) {
    // Synlig delegering: svaret blir en brief till en kollega i teamet —
    // researchen designar kedjorna ("X ger Y en brief"), här görs de i praktiken.
    const hb = el("button", "act-btn", "→ Skicka vidare"); hb.type = "button";
    hb.title = "Skicka svaret som brief till en annan agent i teamet";
    hb.onclick = () => {
      const openMenu = row.querySelector(".handoff-menu");
      if (openMenu) { openMenu.remove(); return; }
      const from = agentById(state.activeAgentId);
      const m = el("div", "handoff-menu");
      team.agents.filter((a) => a.id !== state.activeAgentId).forEach((a) => {
        const b = el("button", "handoff-opt", `${a.icon || "•"} ${a.name}`); b.type = "button";
        b.onclick = () => {
          m.remove();
          const brief = `📨 Brief från ${from ? from.name : "kollegan"}:\n\n${getText()}\n\nTa detta vidare utifrån din roll — vad är ditt konkreta nästa bidrag?`;
          selectAgent(a.id);
          const ta = $("#composer-input");
          if (ta) { ta.value = brief; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; if (!COARSE) ta.focus(); }
        };
        m.appendChild(b);
      });
      row.appendChild(m);
    };
    acts.appendChild(hb);
  }
  if (!state.demo && FOLDER_SUPPORTED) {
    const sf = el("button", "act-btn", "Spara i mappen"); sf.type = "button";
    sf.title = "Sparar svaret som markdown-fil i från-teamet/ i er kopplade mapp";
    sf.onclick = async () => {
      if (!folderActive()) { openMemory(); return; } // ingen mapp än → visa panelen där man kopplar
      try {
        const name = `svar-${new Date().toISOString().slice(0, 10)}-${String(Date.now() % 100000)}.md`;
        await writeFolderFile(name, getText(), "från-teamet");
        sf.textContent = "Sparat ✓ från-teamet/";
      } catch (_) { sf.textContent = "Kunde inte spara"; }
      setTimeout(() => (sf.textContent = "Spara i mappen"), 2200);
    };
    acts.appendChild(sf);
  }
  row.appendChild(acts);
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

// ============================================================
// ARBETSYTAN — veckostart, rutiner, möten, minne, första projektet.
// Det här skiktet är portalens svar på "hur är det mer än en chatt?":
// stående rutiner i stället för frågor, delat minne i stället för amnesi,
// riktiga multi-agent-möten i stället för en modell som lajvar roller.
// ============================================================

const DAY_NAMES = [null, "mån", "tis", "ons", "tors", "fre", "lör", "sön"];
const dayName = (d) => DAY_NAMES[d] || "";

// Rutin-klick: hoppa till rätt agent med uppgiften förifylld — användaren
// fyller i luckorna ([fyll i]) och skickar. Kontrollen ligger kvar hos människan.
function runRoutine(rt) {
  const target = agentById(rt.agentId) ? rt.agentId : team.entryAgent;
  selectAgent(target);
  // Bockas av när rutinens prompt faktiskt skickas — stem (texten före första
  // [fyll i]-luckan) används för att inte bocka av en helt annan fråga.
  state.pendingRoutine = { label: rt.label, stem: (rt.prompt || rt.label).split("[")[0].trim().slice(0, 40) };
  const ta = $("#composer-input");
  if (ta) {
    ta.value = rt.prompt || rt.label;
    ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    ta.focus();
  }
}

// Veckostart: ett klick → ingångsagenten föreslår veckans fokus. Skickas
// direkt (ingen förifyllning) — hela poängen är noll friktion på måndagsmorgonen.
function startWeek() {
  if (state.streaming) return;
  selectAgent(team.entryAgent);
  const now = new Date();
  const days = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
  const rlist = (team.routines || []).map((r) => `- ${r.label}${r.day ? ` (${dayName(r.day)})` : ""}`).join("\n");
  const text = `Veckostart! Det är ${days[now.getDay()]} den ${now.toLocaleDateString("sv-SE")}.` +
    (rlist ? `\nVåra stående rutiner:\n${rlist}` : "") +
    `\n\nGe mig en kort veckostart: 1) de tre viktigaste sakerna att fokusera på, med motivering, 2) vilken agent i teamet som hjälper mig med varje, 3) vad du behöver veta från mig. Kort och konkret.`;
  introMark("week");
  touchStreak();
  submitMessage(text);
}

// ---------- overlay ----------
function openOverlay(title) {
  closeOverlay();
  document.body.classList.remove("drawer-open"); // overlay ska inte hamna bakom mobil-drawern
  const ovl = el("div", "ovl"); ovl.id = "ovl";
  ovl.onclick = (e) => { if (e.target === ovl) closeOverlay(); };
  const box = el("div", "ovl-box");
  const head = el("div", "ovl-head");
  head.appendChild(el("div", "ovl-title", title));
  const x = el("button", "ovl-close", "✕"); x.type = "button"; x.setAttribute("aria-label", "Stäng");
  x.onclick = closeOverlay;
  head.appendChild(x);
  box.appendChild(head);
  ovl.appendChild(box);
  document.body.appendChild(ovl);
  return box;
}
function closeOverlay() { const o = $("#ovl"); if (o) o.remove(); }

// ---------- minne & underlag (UI) ----------
function openMemory() {
  const box = openOverlay("🧠 Minne & underlag");
  box.appendChild(el("p", "ovl-lead", "Det här ser alla agenter i varje samtal — teamets delade projektminne. Skriv hur ni jobbar och vad ni beslutat; klistra in material teamet ska kunna använda. Allt sparas lokalt i den här webbläsaren."));

  box.appendChild(el("div", "ovl-label", "Företagsminne — korta, viktiga instruktioner"));
  const ta = el("textarea", "ovl-ta"); ta.rows = 7; ta.value = loadMemory();
  ta.placeholder = "T.ex:\n• Vi skriver alltid på svenska, du-form, inga utropstecken.\n• Våra kunder är småföretag i Bergslagen.\n• Beslut juli 2026: vi säljer månadspaket, inte timmar.";
  box.appendChild(ta);
  const save = el("button", "btn-primary ovl-save", "Spara minnet");
  save.type = "button";
  save.onclick = () => { saveMemory(ta.value); save.textContent = "Sparat ✓"; setTimeout(() => (save.textContent = "Spara minnet"), 1400); };
  box.appendChild(save);

  // ---- Mapp på datorn (Chrome/Edge) ----
  const listBox = el("div", "doc-list"); // deklareras före mappsektionen — dess knappar ritar om listan
  let renderDocs = () => {};
  if (!state.demo && FOLDER_SUPPORTED) {
    box.appendChild(el("div", "ovl-label", "Mapp på datorn"));
    const fWrap = el("div", "folder-box");
    const renderFolder = () => {
      fWrap.innerHTML = "";
      if (state.folder && state.folder.handle) {
        const row = el("div", "doc-row");
        row.appendChild(el("span", "doc-title", `📁 ${state.folder.name}` + (state.folder.needsPermission ? " — väntar på tillstånd" : ` · ${state.folder.docs.length} filer${state.folder.memory != null ? " + minne.md" : ""}`)));
        if (state.folder.needsPermission) {
          const rb = el("button", "act-btn", "Återanslut"); rb.type = "button";
          rb.onclick = async () => { await refreshFolder({ ask: true }); updateFolderBanner(); renderFolder(); renderDocs(); };
          row.appendChild(rb);
        } else {
          const ub = el("button", "act-btn", "Läs om"); ub.type = "button"; ub.title = "Läs in mappens filer på nytt";
          ub.onclick = async () => { await refreshFolder(); renderFolder(); renderDocs(); };
          row.appendChild(ub);
        }
        const db = el("button", "doc-del", "✕"); db.type = "button"; db.title = "Koppla bort mappen (raderar inga filer)";
        db.onclick = async () => { await disconnectFolder(); renderFolder(); renderDocs(); };
        row.appendChild(db);
        fWrap.appendChild(row);
        fWrap.appendChild(el("p", "ovl-note", "Alla .md/.txt i mappen blir underlag; minne.md är företagsminnet; svar kan sparas till från-teamet/. Tips: lägg mappen i OneDrive/Dropbox så får ni synk och delning på köpet."));
      } else {
        const cb = el("button", "btn-primary ovl-save", "📁 Koppla en mapp på datorn"); cb.type = "button";
        cb.onclick = async () => { await connectFolder(); renderFolder(); renderDocs(); };
        fWrap.appendChild(cb);
        fWrap.appendChild(el("p", "ovl-note", "Underlag som vanliga filer: större än webblagringen, överlever rensad webbdata och kan redigeras i valfritt program."));
      }
    };
    renderFolder();
    box.appendChild(fWrap);
  }

  box.appendChild(el("div", "ovl-label", "Underlag — dokument och material"));
  renderDocs = () => {
    listBox.innerHTML = "";
    const toggles = loadDocToggles();
    const fdocs = folderActive() ? state.folder.docs : [];
    const local = loadLocalDocs();
    if (!fdocs.length && !local.length) { listBox.appendChild(el("div", "doc-empty", "Inga underlag än. Klistra in er prislista, en typisk offert eller er \"om oss\"-text nedan — teamet blir märkbart vassare med riktigt material.")); return; }
    // Budgetsimulering i samma ordning som systemFor() skickar underlagen —
    // så kunden ser vilka aktiva underlag som faktiskt ryms (grön), kapas
    // (halv) eller inte kommer med alls, i stället för att de klipps tyst.
    let budgetUsed = 0;
    const fitOf = (text, on) => {
      if (!on) return null;
      const left = DOC_BUDGET - budgetUsed;
      if (left <= 0) return "out";
      budgetUsed += Math.min((text || "").length, left);
      return (text || "").length > left ? "cut" : "in";
    };
    const fitDot = (fit) => {
      if (!fit) return null;
      const map = {
        in: ["fit-in", "●", "Ryms — hela underlaget skickas med"],
        cut: ["fit-cut", "◐", "Ryms delvis — slutet kapas. Slå av något annat om hela behövs."],
        out: ["fit-out", "○", "Ryms inte — budgeten är full. Slå av något annat underlag."],
      };
      const [cls, ch, tip] = map[fit];
      const s = el("span", "doc-fit " + cls, ch); s.title = tip;
      return s;
    };
    // Stora underlag kan destilleras: ett AI-koncentrat ersätter originalet i
    // det som skickas med (originalet ligger kvar avstängt) — så spricker
    // inte budgeten av sju titelunderlag i en katalogvecka.
    const sumBtn = (d, isFile, idx) => {
      if ((d.text || "").length < 4000 || state.demo || !state.apiKey) return null;
      const b = el("button", "act-btn", "Sammanfatta"); b.type = "button";
      b.title = "Skapa ett kort destillat som tar originalets plats i det som skickas med (originalet finns kvar, avstängt)";
      b.onclick = async () => {
        b.disabled = true; b.textContent = "Destillerar…";
        try { await distillDoc(d, isFile, idx); renderDocs(); }
        catch (e) { alert("Kunde inte sammanfatta: " + ((e && e.message) || "fel")); renderDocs(); }
      };
      return b;
    };
    fdocs.forEach((d) => {
      const rowEl = el("div", "doc-row");
      const on = toggles[d.title] !== false;
      const chk = el("input"); chk.type = "checkbox"; chk.checked = on;
      chk.title = "Aktivt = skickas med till agenterna";
      chk.onchange = () => { const t = loadDocToggles(); t[d.title] = chk.checked; saveDocToggles(t); renderDocs(); };
      rowEl.appendChild(chk);
      const dot = fitDot(fitOf(d.text, on)); if (dot) rowEl.appendChild(dot);
      rowEl.appendChild(el("span", "doc-title", `📄 ${d.title} · ${Math.max(1, Math.round((d.text || "").length / 1000))}k tecken`));
      const sb = sumBtn(d, true, -1); if (sb) rowEl.appendChild(sb);
      listBox.appendChild(rowEl); // mappfiler tas bort i Utforskaren, inte här
    });
    local.forEach((d, i) => {
      const rowEl = el("div", "doc-row");
      const chk = el("input"); chk.type = "checkbox"; chk.checked = !!d.on;
      chk.title = "Aktivt = skickas med till agenterna";
      chk.onchange = () => { const ds = loadLocalDocs(); if (ds[i]) { ds[i].on = chk.checked; saveDocs(ds); } renderDocs(); };
      rowEl.appendChild(chk);
      const dot = fitDot(fitOf(d.text, !!d.on)); if (dot) rowEl.appendChild(dot);
      rowEl.appendChild(el("span", "doc-title", `${d.title} · ${Math.max(1, Math.round((d.text || "").length / 1000))}k tecken`));
      const sb = sumBtn(d, false, i); if (sb) rowEl.appendChild(sb);
      const del = el("button", "doc-del", "✕"); del.type = "button"; del.title = "Ta bort underlaget";
      del.onclick = () => { const ds = loadLocalDocs(); ds.splice(i, 1); saveDocs(ds); renderDocs(); };
      rowEl.appendChild(del);
      listBox.appendChild(rowEl);
    });
  };

  async function distillDoc(d, isFile, idx) {
    const out = await window.ATBClaude.collect({
      apiKey: state.apiKey, model: state.model,
      system: "Komprimera underlaget till ett destillat på högst 2500 tecken som bevarar alla fakta, siffror, namn, priser, datum och beslut. Punktform, svenska, ingen inledning eller avslutning.",
      messages: [{ role: "user", content: (d.text || "").slice(0, 60000) }],
      maxTokens: 1200, onUsage: costAdd,
    });
    const title = d.title.replace(/\.(md|txt)$/i, "") + " (destillat)";
    if (isFile && folderActive()) {
      const safe = title.replace(/[\\/:*?"<>|]/g, "-").slice(0, 60);
      await writeFolderFile(safe + ".md", out.trim());
      const t = loadDocToggles(); t[d.title] = false; saveDocToggles(t); // originalet av
      await refreshFolder();
    } else {
      const ds = loadLocalDocs();
      if (idx >= 0 && ds[idx]) ds[idx].on = false;
      ds.push({ title, text: out.trim(), on: true });
      saveDocs(ds);
    }
  }
  renderDocs();
  box.appendChild(listBox);

  // Fil-import: PDF/Word/txt/md blir underlag utan att klistras in för hand.
  const fileRow = el("div", "file-row");
  const fileBtn = el("button", "btn-primary ovl-save", "📎 Lägg till fil (PDF, Word, .md, .txt)…"); fileBtn.type = "button";
  fileBtn.onclick = () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".pdf,.docx,.doc,.md,.txt"; inp.multiple = true;
    inp.onchange = async () => {
      const files = [...(inp.files || [])];
      for (const f of files) {
        fileBtn.disabled = true; fileBtn.textContent = `Läser ${f.name}…`;
        try {
          const text = await extractFileText(f);
          const title = (f.name || "underlag").replace(/\.[^.]+$/, "");
          if (folderActive()) {
            const safe = title.replace(/[\\/:*?"<>|]/g, "-").slice(0, 60);
            try { await writeFolderFile(safe + ".md", text); await refreshFolder(); }
            catch (_) { const ds = loadLocalDocs(); ds.push({ title, text, on: true }); saveDocs(ds); }
          } else {
            const ds = loadLocalDocs(); ds.push({ title, text, on: true }); saveDocs(ds);
          }
        } catch (e) {
          alert(`${f.name}: ${(e && e.message) || "kunde inte läsas"}`);
        }
      }
      fileBtn.disabled = false; fileBtn.textContent = "📎 Lägg till fil (PDF, Word, .md, .txt)…";
      renderDocs();
    };
    inp.click();
  };
  fileRow.appendChild(fileBtn);
  box.appendChild(fileRow);
  box.appendChild(el("p", "ovl-note", "Filen läses helt lokalt i din webbläsare — innehållet skickas ingenstans förrän du ställer en fråga med underlaget aktivt."));

  const dt = el("input", "ovl-input"); dt.placeholder = "Namn, t.ex. Prislista 2026 eller Mötesanteckning 14 juli";
  const dta = el("textarea", "ovl-ta"); dta.rows = 5; dta.placeholder = "…eller klistra in text här";
  const add = el("button", "btn-primary ovl-save", "Lägg till underlag"); add.type = "button";
  add.onclick = async () => {
    const text = dta.value.trim();
    if (!text) return;
    const title = dt.value.trim();
    if (folderActive()) {
      // Mapp kopplad → underlaget blir en riktig fil i mappen.
      const safe = (title || "underlag-" + Date.now()).replace(/[\\/:*?"<>|]/g, "-").slice(0, 60);
      try { await writeFolderFile(safe + ".md", text); await refreshFolder(); }
      catch (_) { const docs = loadLocalDocs(); docs.push({ title: title || safe, text, on: true }); saveDocs(docs); }
    } else {
      const docs = loadLocalDocs();
      docs.push({ title: title || "Underlag " + (docs.length + 1), text, on: true });
      saveDocs(docs);
    }
    dt.value = ""; dta.value = "";
    renderDocs();
  };
  box.appendChild(dt); box.appendChild(dta); box.appendChild(add);
  box.appendChild(el("p", "ovl-note", `Aktiva underlag följer med i varje anrop (max ~${Math.round(DOC_BUDGET / 1000)}000 tecken totalt) — fler aktiva = högre kostnad per fråga. Slå av det som inte behövs just nu, och håll minnet kort och kurerat.`));
}

// ---------- filimport (PDF/Word → underlag) ----------
// Simuleringens största churn-risk: kärnmaterial (manus, offerter, avtal)
// lever som PDF/Word och fick klistras in för hand. Extraheringen sker helt
// lokalt i webbläsaren (vendorerade pdf.js/mammoth laddas först vid behov) —
// filen lämnar aldrig datorn, i linje med BYO-löftet.
async function extractFileText(file) {
  const ext = ((file.name || "").split(".").pop() || "").toLowerCase();
  if (ext === "txt" || ext === "md") return await file.text();
  if (ext === "pdf") {
    if (!window.pdfjsLib) await loadScript("vendor/pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
    const doc = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = [];
    const pages = Math.min(doc.numPages, 400);
    for (let i = 1; i <= pages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      out.push(tc.items.map((it) => it.str).join(" "));
    }
    if (doc.numPages > pages) out.push(`[… ${doc.numPages - pages} sidor till utelämnade]`);
    const text = out.join("\n\n").trim();
    if (!text) throw new Error("PDF:en verkar sakna textlager (inskannad?) — prova att spara om den med OCR, eller klistra in texten.");
    return text;
  }
  if (ext === "docx") {
    if (!window.mammoth) await loadScript("vendor/mammoth.browser.min.js");
    const res = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const text = (res.value || "").trim();
    if (!text) throw new Error("Dokumentet verkar vara tomt.");
    return text;
  }
  throw new Error(ext === "doc"
    ? "Gamla .doc-formatet stöds inte — spara om filen som .docx eller PDF."
    : "Filtypen stöds inte. Portalen läser PDF, .docx, .md och .txt.");
}

// ---------- första projektet ----------
function openFirstProject() {
  const fp = team.firstProject;
  if (!fp) return;
  try { localStorage.setItem("atb_fp_" + state.slug, String(Date.now())); } catch (_) { /* full storage */ }
  const box = openOverlay("🎯 Första projektet");
  box.appendChild(el("div", "fp-name", fp.name || "Ert första projekt"));
  if (fp.problem) { box.appendChild(el("div", "ovl-label", "Problemet vi löser")); const p = el("div", "fp-text"); renderMarkdown(p, fp.problem); box.appendChild(p); }
  if (fp.week1) { box.appendChild(el("div", "ovl-label", "Första veckan")); const w = el("div", "fp-text"); renderMarkdown(w, fp.week1); box.appendChild(w); }
  if (fp.owner) box.appendChild(el("p", "ovl-note", "Ansvarig i teamet: " + fp.owner));
  const go = el("button", "btn-primary ovl-save", "Be teamet ta första steget →"); go.type = "button";
  go.onclick = () => {
    closeOverlay();
    selectAgent(team.entryAgent);
    const ta = $("#composer-input");
    if (ta) {
      ta.value = `Vi kör igång första projektet: "${fp.name}". Vad är det allra första konkreta steget idag, och vad behöver du från mig?`;
      ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
      ta.focus();
    }
  };
  box.appendChild(go);
}

// ---------- möten ----------
// Riktiga multi-agent-möten: varje deltagare svarar utifrån SIN systemprompt
// (ett anrop per agent), sedan sammanställer ingångsagenten. Skillnaden mot
// att be en chatt "lajva flera roller" är att perspektiven genereras oberoende
// — de kan faktiskt krocka, och krocken syns i sammanställningen.
const MEETING_TYPES = [
  { id: "whats-next", icon: "🧭", label: "Vad gör vi härnäst?", desc: "Prioriteringsmöte — landar i max tre motiverade prioriteringar.",
    output: "En rangordnad lista med MAX TRE prioriteringar. För varje: vad, varför just nu, första konkreta steg och vilken agent som äger det. Avsluta med vad som medvetet får vänta." },
  { id: "review", icon: "🔍", label: "Projektgranskning", desc: "Bred genomlysning — var står vi och vad är viktigast att åtgärda?",
    output: "En rangordnad lista över de viktigaste fynden (max fem), vart och ett med konsekvens och rekommenderad åtgärd. Avsluta med en samlad rekommendation i 2–3 meningar." },
  { id: "improve", icon: "🔧", label: "Förbättra något specifikt", desc: "Smalt fokus på en sak — konkreta förslag som kan påbörjas direkt.",
    output: "Numrerade, handlingsbara förbättringsförslag (max fem). Varje förslag ska kunna påbörjas idag och ange första steget. Ingen filosofi, inga abstraktioner." },
];

function openMeeting() {
  const entryName = (agentById(team.entryAgent) || {}).name || "VD-assistenten";
  if (state.demo) {
    const box = openOverlay("🤝 Håll ett möte");
    box.appendChild(el("p", "ovl-lead", `Möten körs mot riktiga modellen — koppla in en nyckel för att prova. Så funkar det: du väljer fråga och deltagare, varje agent ger sitt perspektiv utifrån sin roll, och ${entryName} sammanställer till ett beslut med tydligt format.`));
    const c = el("button", "btn-primary ovl-save", "Koppla in din nyckel →"); c.type = "button";
    c.onclick = () => { closeOverlay(); connectKey(); };
    box.appendChild(c);
    return;
  }
  if (state.streaming) return;
  const box = openOverlay("🤝 Håll ett möte");
  box.appendChild(el("p", "ovl-lead", `Flera agenter ger sitt perspektiv utifrån sin roll — sen sammanställer ${entryName} till ett tydligt beslut.`));

  let chosen = MEETING_TYPES[0];
  const typeWrap = el("div", "meet-types");
  MEETING_TYPES.forEach((t, i) => {
    const b = el("button", "meet-type" + (i === 0 ? " sel" : "")); b.type = "button";
    b.appendChild(el("div", "meet-type-label", `${t.icon} ${t.label}`));
    b.appendChild(el("div", "meet-type-desc", t.desc));
    b.onclick = () => { chosen = t; typeWrap.querySelectorAll(".meet-type").forEach((n) => n.classList.remove("sel")); b.classList.add("sel"); };
    typeWrap.appendChild(b);
  });
  box.appendChild(typeWrap);

  box.appendChild(el("div", "ovl-label", "Vad gäller mötet?"));
  const focus = el("textarea", "ovl-ta"); focus.rows = 2;
  focus.placeholder = "T.ex: Ska vi satsa på nyhetsbrevet eller Instagram i höst?";
  box.appendChild(focus);

  box.appendChild(el("div", "ovl-label", "Deltagare (minst två)"));
  const parts = el("div", "meet-parts");
  const checks = [];
  team.agents.filter((a) => a.id !== team.entryAgent).forEach((a) => {
    const lab = el("label", "meet-part");
    const c = el("input"); c.type = "checkbox"; c.checked = true; c.value = a.id;
    checks.push(c);
    lab.appendChild(c);
    lab.appendChild(el("span", null, `${a.icon || "•"} ${a.name}`));
    parts.appendChild(lab);
  });
  box.appendChild(parts);

  const errEl = el("div", "setup-err"); errEl.style.display = "none"; box.appendChild(errEl);
  const run = el("button", "btn-primary ovl-save", "Starta mötet"); run.type = "button";
  run.onclick = () => {
    const ids = checks.filter((c) => c.checked).map((c) => c.value);
    const q = focus.value.trim();
    if (!q) { errEl.textContent = "Skriv vad mötet gäller."; errEl.style.display = "block"; return; }
    if (ids.length < 2) { errEl.textContent = "Välj minst två deltagare — med en enda räcker det att fråga agenten direkt."; errEl.style.display = "block"; return; }
    closeOverlay();
    runMeeting(chosen, q, ids);
  };
  box.appendChild(run);
  box.appendChild(el("p", "ovl-note", "Ett möte gör ett anrop per deltagare plus ett för sammanställningen."));
}

async function runMeeting(type, focus, ids) {
  if (state.streaming) return;
  if (state.folder) { await refreshFolder(state.folder.needsPermission ? { ask: true } : undefined); updateFolderBanner(); }
  selectAgent(team.entryAgent);
  const entry = agentById(team.entryAgent);
  const agentId = team.entryAgent;
  const userText = `🤝 Möte — ${type.label}: ${focus}`;
  if (!state.history[agentId]) state.history[agentId] = [];
  const meetingMsg = { role: "user", content: userText, at: Date.now() };
  state.history[agentId].push(meetingMsg);
  saveHistory();

  const log = $("#chat-log");
  if (state.history[agentId].length === 1) log.innerHTML = "";
  log.appendChild(bubble("user", userText));
  const row = bubble("assistant", "");
  const bub = row.querySelector(".bubble");
  bub.classList.add("typing");
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;

  const send = $("#composer-send");
  state.streaming = true;
  state.chatAbort = new AbortController();
  const signal = state.chatAbort.signal;
  if (send) { send.textContent = "■"; send.setAttribute("aria-label", "Stoppa mötet"); send.classList.add("stop"); }

  lastCallCost = 0; // mötets kostnad = summan av alla anrop i kedjan
  let acc = "";
  const perspectives = []; // { name, tagline, text } — sparas med anteckningen
  try {
    // 1) Oberoende perspektiv, ett anrop per deltagare. Ett delfel kastar
    // ALDRIG redan hämtade (betalda) perspektiv — mötet fortsätter med de
    // som kom in, och sammanställningen nämner vilka som saknades.
    const failed = [];
    for (let i = 0; i < ids.length; i++) {
      const a = agentById(ids[i]);
      if (!a) continue;
      if (bub.isConnected) bub.textContent = `🤝 Hämtar perspektiv från ${a.name}… (${i + 1}/${ids.length})`;
      try {
        const p = await window.ATBClaude.collect({
          apiKey: state.apiKey, model: state.model,
          system: systemFor(a),
          messages: [{ role: "user", content: `MÖTE — ${type.label}.\nFråga/fokus: ${focus}\n\nGe DITT perspektiv utifrån din roll. Max 120 ord. Var konkret och våga ha en åsikt — vad är viktigast och varför, och vad kan vänta? Ingen artighetsprosa.` }],
          maxTokens: 600, signal, onUsage: costAdd,
        });
        perspectives.push({ name: a.name, tagline: a.tagline || "", text: p });
      } catch (e) {
        if (e && e.name === "AbortError") throw e;
        failed.push(a.name);
      }
    }
    if (!perspectives.length) throw new Error("Inget perspektiv kunde hämtas — mötet gick inte att genomföra. Försök igen om en stund.");
    const perspBlockText = perspectives.map((p) => `### ${p.name}${p.tagline ? ` (${p.tagline})` : ""}\n${p.text}`).join("\n\n");
    const failedNote = failed.length ? `\n\nOBS: Perspektiv från ${failed.join(", ")} kunde inte hämtas (tekniskt fel). Nämn kort i anteckningen att mötet hölls utan dem.` : "";
    // 2) Sammanställning av ingångsagenten, strömmad.
    if (bub.isConnected) bub.textContent = `🧭 ${entry.name} sammanställer…`;
    let started = false;
    await window.ATBClaude.stream({
      apiKey: state.apiKey, model: state.model,
      system: systemFor(entry),
      messages: [{ role: "user", content: `Du leder ett möte av typen "${type.label}".\nFråga/fokus: ${focus}\n\nDeltagarnas oberoende perspektiv:\n\n${perspBlockText}${failedNote}\n\nSAMMANSTÄLL TILL EN MÖTESANTECKNING. Börja med raden "## 🤝 Mötesanteckning — ${type.label}". Format därefter:\n${type.output}\n\nOm perspektiven krockar: lyft krocken öppet och ta ställning. Om frågan egentligen inte behövde ett möte, säg det ärligt.` }],
      maxTokens: 2000, signal, onUsage: costAdd,
      onDelta: (d) => {
        if (!started && bub.isConnected) { bub.textContent = ""; bub.classList.remove("typing"); started = true; }
        acc += d;
        if (bub.isConnected) {
          const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 90;
          bub.textContent = acc;
          if (atBottom) log.scrollTop = log.scrollHeight;
        }
      },
    });
    const msg = { role: "assistant", content: acc, perspectives, at: Date.now() };
    state.history[agentId].push(msg);
    saveHistory();
    introMark("meeting");
    touchStreak();
    const finalText = acc;
    if (bub.isConnected) { renderMarkdown(bub, finalText); addActions(row, () => finalText); row.appendChild(perspToggle(perspectives)); appendCost(row); }
    else if (state.activeAgentId === agentId) renderLog();
  } catch (err) {
    if (err && err.name === "AbortError" && acc) {
      // Stoppad mitt i sammanställningen — behåll det som kom; det är betald output.
      state.history[agentId].push({ role: "assistant", content: acc, perspectives, at: Date.now() });
      saveHistory();
      if (bub.isConnected) { renderMarkdown(bub, acc); addActions(row, () => acc); if (perspectives.length) row.appendChild(perspToggle(perspectives)); }
    } else {
      // Ta bort exakt mötesraden — inte det som råkar ligga sist.
      const arr = state.history[agentId] || [];
      const mi = arr.lastIndexOf(meetingMsg);
      if (mi >= 0) arr.splice(mi, 1);
      saveHistory();
      if (bub.isConnected) {
        bub.classList.remove("typing");
        if (err && err.name === "AbortError") bub.textContent = "⏹ Mötet avbröts.";
        else { bub.classList.add("error"); bub.textContent = "⚠️ " + ((err && err.message) || "Mötet misslyckades."); }
      }
    }
  } finally {
    state.streaming = false;
    state.chatAbort = null;
    if (send) { send.textContent = "↑"; send.setAttribute("aria-label", "Skicka"); send.classList.remove("stop"); }
  }
}

// ---------- chat ----------
async function sendMessage() {
  if (state.streaming) return;
  const ta = $("#composer-input");
  const text = ta.value.trim();
  if (!text) return;
  ta.value = ""; ta.style.height = "auto";
  await submitMessage(text);
}

// Kärnan i att skicka — separat från composern så arbetsytan (veckostart,
// rutiner) kan skicka programmatiskt till den aktiva agenten.
async function submitMessage(text) {
  if (state.streaming) return;
  // Färska underlag från mappen inför varje anrop (vi är i en användargest,
  // så ett ev. tillståndsprompt är tillåtet här).
  if (state.folder) { await refreshFolder(state.folder.needsPermission ? { ask: true } : undefined); updateFolderBanner(); }
  const agentId = state.activeAgentId;
  const agent = agentById(agentId);
  if (!state.history[agentId]) state.history[agentId] = [];
  // Behåll referensen — vid fel ska EXAKT detta meddelande tas bort, inte
  // det som råkar ligga sist (en auto-rutin kan ha hunnit skriva under tiden).
  const userMsg = { role: "user", content: text, at: Date.now() };
  state.history[agentId].push(userMsg);
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
  lastCallCost = 0; // nollställ inför den här svarskedjan
  let acc = "";
  const onDelta = (delta) => {
    acc += delta;
    // Bubblan kan ha kopplats loss om användaren byter agent under strömningen
    // (renderLog tömmer loggen) — skriv bara om den fortfarande sitter i DOM:en.
    if (!assistantBubble.isConnected) return;
    assistantBubble.classList.remove("typing");
    // Auto-scrolla bara om användaren redan är nära botten — den som scrollat
    // upp för att läsa början av svaret ska inte ryckas ner igen.
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 90;
    assistantBubble.textContent = acc;
    if (atBottom) log.scrollTop = log.scrollHeight;
  };
  try {
    if (state.demo) await streamDemo(agent, state.history[agentId], onDelta);
    else await streamClaude(systemFor(agent), state.history[agentId], onDelta);
    state.history[agentId].push({ role: "assistant", content: acc, at: Date.now() });
    saveHistory();
    // Skickades en rutin-prompt? Bocka av den för veckan (+ streak + puls) —
    // men bara om det som skickades faktiskt var rutinen, inte en annan fråga.
    if (state.pendingRoutine) {
      const pr = state.pendingRoutine;
      state.pendingRoutine = null;
      if (pr.stem.length < 8 || text.startsWith(pr.stem)) { routineMarkDone(pr.label); renderPulse(); }
    }
    // Rendera det färdiga svaret som markdown (strömningen skrev råtext),
    // och rita om från historiken om bubblan detachats av ett agentbyte.
    const finalText = acc;
    if (assistantBubble.isConnected) { renderMarkdown(assistantBubble, finalText); addActions(assistantRow, () => finalText); appendCost(assistantRow); }
    else if (state.activeAgentId === agentId) renderLog();
  } catch (err) {
    if (err && err.name === "AbortError" && acc) {
      // Stoppad mitt i — behåll det som hann komma; det är betald output.
      state.history[agentId].push({ role: "assistant", content: acc, at: Date.now() });
      saveHistory();
      if (assistantBubble.isConnected) renderMarkdown(assistantBubble, acc);
    } else {
      if (assistantBubble.isConnected) {
        assistantBubble.classList.remove("typing");
        assistantBubble.classList.add("error");
        assistantBubble.textContent = err && err.name === "AbortError" ? "⏹ Stoppad." : "⚠️ " + (err.message || "Något gick fel.");
      }
      const arr = state.history[agentId] || [];
      const ui = arr.lastIndexOf(userMsg);
      if (ui >= 0) arr.splice(ui, 1);
      saveHistory();
      // Ge tillbaka det skickade meddelandet så användaren inte behöver skriva om det.
      const input = $("#composer-input");
      if (input && !input.value) { input.value = text; input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; }
    }
  } finally {
    state.streaming = false;
    state.chatAbort = null;
    if (send) { send.textContent = "↑"; send.setAttribute("aria-label", "Skicka"); send.classList.remove("stop"); }
    if (!COARSE) $("#composer-input")?.focus();
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
    onUsage: costAdd,
    signal: state.chatAbort ? state.chatAbort.signal : undefined,
  });
}

boot();
