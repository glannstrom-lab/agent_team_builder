/* ============================================================
   Mitt AI-team — Kundportal
   Statisk app i webbläsaren, men inte utan server: AI-anropen går
   till /api/ai på VÅR nyckel, och portalsvar kräver inloggning plus
   ett köpt team (functions/api/ai.js). Kunden har aldrig en egen
   nyckel. Allt arkiv — historik, minne, underlag — stannar lokalt.

   Multi-tenant: ?team=<slug> laddar portal/teams/<slug>.js.
   Utan parameter visas en kundväljare (window.TEAMS).
   __draft laddar ett utkast byggt i Builder-appen (localStorage).
   ============================================================ */

// Nyckeln är avskaffad (2026-08-06) och läses inte längre. Städa bort en
// kvarglömd sådan ur webbläsaren — den ska inte ligga kvar hos oss sedan den
// slutat betyda något.
try { localStorage.removeItem("atb_api_key"); } catch (_) { /* låst lagring */ }
const MODEL_STORAGE = "atb_model";
const HIST_PREFIX = "atb_hist_"; // + team-slug → sparad chatthistorik
const MEM_PREFIX = "atb_mem_";   // + team-slug → delat företagsminne (instruktioner)
const DOCS_PREFIX = "atb_docs_"; // + team-slug → inklistrade underlag [{title,text,on}]
const DOCSON_PREFIX = "atb_docson_"; // + team-slug → { filnamn: bool } på/av för mapp-underlag
// Ingen DEFAULT_MODEL och inget sparat val: modellen bor i atb-claude.js och
// ingen annanstans. Fanns den på två ställen glred de isär, vilket de gjorde.
// API-URL och själva strömningen ligger i ../atb-claude.js (window.ATBClaude)
// — delat med Buildern så de inte kan glida isär.
//
// ETT SPARAT MODELLVAL FICK INTE FINNAS KVAR (rättat 2026-08-06).
// Det gjorde det ändå: portalen skrev "deepseek/deepseek-v4-flash-latest" till
// atb_model_or, medan atb-claude.js kör "deepseek/deepseek-v4-flash" — exakt
// det suffix som kommentaren där varnar för. Buildern läste samma nyckel och
// visade därför TVÅ DeepSeek-rader i en väljare som ändå inte styrde något,
// eftersom stream() ignorerar modellen som skickas med.
//
// Ett val som inte gäller är värre än inget val: det får produkten att se ut
// att göra något annat än den gör. Här finns bara den låsta modellen kvar, och
// gamla sparade värden städas bort så de inte spökar i en webbläsare som
// besökt sajten tidigare.
const OR_MODEL_STORAGE = "atb_model_or";
try { localStorage.removeItem(OR_MODEL_STORAGE); localStorage.removeItem("atb_model"); } catch (_) { /* privat läge */ }

const MODELS = [{ id: window.ATBClaude.MODEL_ID, label: window.ATBClaude.MODEL_LABEL }];

function syncModelForProvider() {
  state.model = window.ATBClaude.MODEL_ID;
}

let team = null; // sätts när ett team laddats
const state = {
  // Kunden har ingen egen nyckel sedan 2026-08-06 — allt går genom /api/ai på
  // vår. Fältet står kvar tomt eftersom anropsställena skickar med det, men
  // det läses aldrig från lagringen längre: en kvarglömd nyckel i localStorage
  // skickade tidigare anropen direkt till leverantören, alltså förbi köpet,
  // taken och mätningen.
  apiKey: "",
  model: window.ATBClaude.MODEL_ID,
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

// ---------- lagringsfel ----------
// Varje sparning i portalen har ett tomt catch, så att full eller blockerad
// lagring aldrig kan krascha chatten. Priset var att ett misslyckat sparande
// blev helt osynligt — kunden trodde att samtalet låg kvar, och upptäckte
// motsatsen först nästa dag. Felen räknas nu, loggas, och första gången något
// väsentligt inte kan sparas får kunden en diskret rad ovanför chatten.
const storeErrors = [];
window.ATBStorageErrors = storeErrors; // felsökning: inspektera i konsolen
let storeBannerShown = false;
function storeWarn(what, e) {
  storeErrors.push({ what, at: Date.now(), msg: (e && e.message) || String(e || "") });
  console.warn("[Mitt AI-team] kunde inte spara:", what, e);
  if (storeBannerShown) return;
  // Flaggan sätts först när raden faktiskt syntes — händer felet innan
  // portalen ritats upp finns ingen yta att visa den på, och då ska nästa
  // fel få göra ett nytt försök i stället för att tystas.
  try { storeBannerShown = showStoreBanner(what); } catch (_) { /* varningen får aldrig krascha */ }
}
function showStoreBanner(what) {
  const main = document.querySelector(".main");
  if (!main || $("#store-banner")) return false;
  const b = el("button", "folder-banner");
  b.id = "store-banner"; b.type = "button";
  b.textContent = `⚠️ Kunde inte spara ${what} — webbläsarens utrymme kan vara fullt eller blockerat. Kopiera viktiga svar innan du stänger fliken. (Klicka för att dölja.)`;
  b.onclick = () => b.remove();
  main.insertBefore(b, $("#chat-header"));
  return true;
}

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
  } catch (e) { storeWarn("chatthistoriken", e); /* får aldrig krascha chatten */ }
}

let archiveChain = Promise.resolve(); // serialiserar arkivskrivningar
// Egen kö för mappens DELADE filer (minne.md, teamstatus.json,
// team-tillagg.json). Utan den kan två read→ändra→write mot samma fil köra om
// varandra och den sena skrivningen radera den tidigas rader — exakt det som
// archiveChain redan löser för arkivet. Två köer, inte en: arkivet skriver
// andra filer och ska inte behöva vänta på en långsam minnesskrivning.
let folderChain = Promise.resolve();
function queueFolder(fn) {
  folderChain = folderChain.then(fn).catch((e) => { storeWarn("till mappen", e); });
  return folderChain;
}

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
  } catch (e) { storeWarn("äldre svar till arkivet", e); /* kapningen sker ändå */ }
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
    // Genom kön: två snabba sparningar (minnesförslag + manuell redigering)
    // läste annars samma fil samtidigt och den sista skrivningen slog ut den
    // första — kunden såg en rad hen just godkänt försvinna.
    queueFolder(async () => {
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
      try { localStorage.setItem(MEM_PREFIX + state.slug, finalText); } catch (e) { storeWarn("företagsminnet", e); }
      paintFactCount();
    });
  }
  try { localStorage.setItem(MEM_PREFIX + state.slug, text); } catch (e) { storeWarn("företagsminnet", e); }
}
function loadLocalDocs() {
  try { const d = JSON.parse(localStorage.getItem(DOCS_PREFIX + state.slug) || "[]"); return Array.isArray(d) ? d : []; }
  catch (_) { return []; }
}
function saveDocs(docs) { try { localStorage.setItem(DOCS_PREFIX + state.slug, JSON.stringify(docs)); } catch (e) { storeWarn("underlagen", e); } }
function loadDocToggles() {
  try { return JSON.parse(localStorage.getItem(DOCSON_PREFIX + state.slug) || "{}") || {}; }
  catch (_) { return {}; }
}
function saveDocToggles(t) { try { localStorage.setItem(DOCSON_PREFIX + state.slug, JSON.stringify(t)); } catch (e) { storeWarn("valet av underlag", e); } }
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
    // Nykopplad mapp: lägg upp befintliga teamtillägg där de överlever en
    // rensad webbläsare, och ta hem sådana som redan låg i mappen.
    if (await syncTeamExtWithFolder()) renderPortal();
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
    // Tillägg gjorda på en annan dator: rita om bara om något faktiskt kom in.
    if (await syncTeamExtWithFolder()) renderPortal();
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
// Genom folderChain: read→merge→write mot teamstatus.json är inte atomärt, och
// två samtidiga synkar (sidöppning + avbockad rutin) kunde annars läsa samma
// utgångsläge och skriva över varandras bockar.
function syncStatusToFolder() {
  if (!folderActive()) return Promise.resolve();
  return queueFolder(syncStatusNow);
}
async function syncStatusNow() {
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
    if (streak) { try { localStorage.setItem("atb_streak_" + state.slug, JSON.stringify(streak)); } catch (e) { storeWarn("veckostreaken", e); } }
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

// ---------- teamtillägg ("Utveckla teamet") ----------
// Tilläggen låg BARA i localStorage. Rensad webbläsare, ny dator eller en
// kollega med egen inloggning = agenten borta, utan att något sa till — och
// det är en agent kunden själv bett om och betalat för att få formad. Med en
// kopplad mapp skrivs de därför också till team-tillagg.json, samma väg som
// teamstatus.json och genom samma kö. Utan mapp är läget som förut.
const TEAMEXT_FILE = "team-tillagg.json";
const teamExtKey = () => "atb_teamext_" + state.slug;
function loadTeamExt() {
  try { return JSON.parse(localStorage.getItem(teamExtKey()) || "{}") || {}; }
  catch (_) { return {}; } // trasigt tillägg — börja om hellre än att kasta
}
function saveTeamExt(ext) {
  try { localStorage.setItem(teamExtKey(), JSON.stringify(ext)); }
  catch (e) { storeWarn("teamets tillägg", e); return false; }
  if (folderActive()) queueFolder(() => writeFolderFile(TEAMEXT_FILE, JSON.stringify(ext, null, 2)));
  return true;
}
// Vid mappkoppling: hämta hem tillägg som gjorts i en annan webbläsare.
// Union, aldrig radering — den som tagit bort en agent har redan skrivit om
// filen, så det som ligger kvar där är sådant som ska finnas.
async function mergeTeamExtFromFolder() {
  if (!folderActive() || !team) return false;
  let fromFile = null;
  try {
    const fh = await state.folder.handle.getFileHandle(TEAMEXT_FILE);
    fromFile = JSON.parse(await (await fh.getFile()).text());
  } catch (_) { return false; } // ingen fil (eller trasig) — inget att hämta
  if (!fromFile || !Array.isArray(fromFile.agents)) return false;
  const cur = loadTeamExt();
  const agents = (cur.agents || []).slice();
  const routines = (cur.routines || []).slice();
  let changed = false;
  fromFile.agents.forEach((a) => {
    if (!a || !a.id || !a.system || agents.some((b) => b.id === a.id)) return;
    agents.push(a); changed = true;
  });
  (fromFile.routines || []).forEach((r) => {
    if (!r || !r.label || routines.some((x) => x.label === r.label)) return;
    routines.push(r); changed = true;
  });
  if (!changed) return false;
  cur.agents = agents; cur.routines = routines;
  try { localStorage.setItem(teamExtKey(), JSON.stringify(cur)); } catch (e) { storeWarn("teamets tillägg", e); }
  // Lägg in i det laddade teamet direkt, annars syns de först vid nästa F5.
  agents.forEach((a) => { if (!team.agents.some((b) => b.id === a.id)) { a.added = true; team.agents.push(a); } });
  routines.forEach((r) => { if (!(team.routines || []).some((x) => x.label === r.label)) (team.routines = team.routines || []).push(r); });
  assignAvatars(team);
  return true;
}
// Tvåvägs: hämta först hem filens tillägg (så inget skrivs över), skicka
// sedan upp den sammanslagna listan. Returnerar true om teamet ändrades.
async function syncTeamExtWithFolder() {
  if (!folderActive()) return false;
  const changed = await mergeTeamExtFromFolder();
  const cur = loadTeamExt();
  if ((cur.agents || []).length || (cur.routines || []).length) {
    queueFolder(() => writeFolderFile(TEAMEXT_FILE, JSON.stringify(cur, null, 2)));
  }
  return changed;
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

// ---------- kontextbudget för samtalet ----------
// Underlagen har haft en budget sedan länge (DOC_BUDGET). Samtalet hade ingen:
// hela historiken (upp till 60 meddelanden per agent) skickades med i VARJE
// anrop. Efter ett par veckors dagligt bruk växer alltså kostnaden för varje
// ny fråga, tills anropet till slut spränger modellfönstret — och kunden
// betalar mest just när teamet börjat bli användbart.
//
// Samma grepp som för stora underlag: behåll det färska ordagrant och låt det
// äldre krympa till ett destillat. Destillatet görs LOKALT (rubriker + första
// raderna per meddelande) — ett AI-destillat hade krävt ett extra betalt anrop
// mitt i svarsvägen, se rapporten.
const CHAT_KEEP = 12;            // meddelanden som alltid skickas ordagrant
const CHAT_BUDGET = 40000;       // tecken totalt i fönstret (≈ 12k tokens)
const CHAT_DIGEST_BUDGET = 3000; // tecken destillatet av det äldre får kosta

// Ett äldre meddelande kokas ner till roll + rubriker + inledning. Rubrikerna
// är billiga och bär strukturen i en leverans ("## Prisförslag"), så teamet
// minns VAD det levererat även när texten är borta.
function digestMessage(m) {
  const body = (m.content || "").trim();
  if (!body) return "";
  const who = m.role === "user" ? "DU" : "TEAMET";
  const heads = body.split("\n").filter((l) => /^#{1,4}\s+\S/.test(l.trim())).slice(0, 6)
    .map((l) => l.replace(/^#+\s*/, "").trim());
  const lead = body.replace(/\s+/g, " ").slice(0, 220);
  return `${who}: ${lead}${body.length > 220 ? "…" : ""}${heads.length ? `\n  (avsnitt: ${heads.join(" · ")})` : ""}`;
}

// Bygger meddelandelistan för ett anrop: destillat av det äldre + de senaste
// meddelandena ordagrant. Fönstret börjar alltid på ett användarmeddelande och
// destillatet läggs FÖRE det i samma meddelande — då behålls turordningen
// user/assistant exakt som modellen förväntar sig.
function contextFor(msgs) {
  const all = (msgs || []).filter((m) => m && m.content);
  const chars = (arr) => arr.reduce((n, m) => n + m.content.length, 0);
  let start = Math.max(0, all.length - CHAT_KEEP);
  // Krymp fönstret tills det ryms i budgeten — sista meddelandet (frågan som
  // just ställdes) släpps alltid igenom, hur långt det än är.
  while (start < all.length - 1 && chars(all.slice(start)) > CHAT_BUDGET) start++;
  // Snäpp fram till närmaste användarmeddelande.
  while (start < all.length && all[start].role !== "user") start++;
  if (start >= all.length) start = Math.max(0, all.length - 1);

  const out = all.slice(start).map((m) => ({ role: m.role, content: m.content }));
  const older = all.slice(0, start);
  if (!older.length || !out.length) return out;

  // Bygg destillatet bakifrån: det som ligger närmast i tiden är mest värt.
  const lines = [];
  let used = 0;
  for (let i = older.length - 1; i >= 0; i--) {
    const line = digestMessage(older[i]);
    if (!line) continue;
    if (used + line.length > CHAT_DIGEST_BUDGET) break;
    used += line.length;
    lines.unshift(line);
  }
  if (!lines.length) return out;
  const omitted = older.length - lines.length;
  const head = `TIDIGARE I DET HÄR SAMTALET (förkortat sammandrag — texten är avkortad, gissa inte i luckorna; be om det du saknar)${omitted > 0 ? `\n[${omitted} ännu äldre meddelanden är utelämnade]` : ""}:\n`;
  out[0] = { role: out[0].role, content: head + lines.join("\n") + "\n\n--- HÄR OCH NU ---\n" + out[0].content };
  return out;
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
// Team som finns för att visas, inte för att säljas: exempelteamen i registret
// (portal/teams/index.js) och branschsidornas demo. De öppnas utan konto och
// utan anrop — svaren är förskrivna i konfigen.
const isShowcaseSlug = (s) =>
  !!s && (s === "__vertical" || (Array.isArray(window.TEAMS) && window.TEAMS.some((t) => t.slug === s)));
// Ett lokalt team utan köp: Builder-utkastet och ett team öppnat via
// delningslänk. Konfigen finns i webbläsaren, men agenterna kan inte svara —
// det är portalen som säljs.
const isUnpaidLocalSlug = (s) => s === "__draft" || s === "__link";
const getSlug = () => new URLSearchParams(location.search).get("team");
// Nerladdning på ett ställe. Varje exportknapp byggde tidigare sin egen
// Blob + <a download> + revokeObjectURL, och den som glömde revoke läckte
// minnet tyst. Tre rader att kopiera fel är två för många.
//
// Länken läggs in i dokumentet före klicket och plockas bort efteråt: en
// lös <a> som aldrig kopplats in ignoreras av vissa webbläsare, och då händer
// exakt ingenting när kunden klickar — verifierat i headless Chromium.
// Implementationen bor i atb-claude.js sedan 2026-08-16, så att Buildern och
// portalen delar EN version. Buildern hade en egen trerading med båda felen
// kommentaren ovan varnar för. Anropsställena här är oförändrade.
const downloadFile = (filename, text, mime) => window.ATBClaude.downloadFile(filename, text, mime);
// Filnamnsvänligt företagsnamn — åäö skrivs om, resten blir bindestreck.
const fileSlug = (s) => (s || "team").toLowerCase()
  .replace(/[åä]/g, "a").replace(/ö/g, "o")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "team";
const isoDay = (ms) => new Date(ms == null ? Date.now() : ms).toISOString().slice(0, 10);
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
        "atb_hello_", "atb_intro_", "atb_tour_", "atb_wsmore_", "atb_rout_", "atb_streak_", "atb_visit_", "atb_fp_", "atb_cost_", "atb_pulse_snooze_", "atb_teamext_"]
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
      // 402 = teamet finns och är kundens, men planen har tagit slut. Skiljs
      // det inte från "hittade inget team" möts en kund vars provmånad gått ut
      // av en trasig-länk-text — och tror att felet är vårt, inte att månaden
      // är slut. Kastas vidare med kod, så boot() kan visa den låsta vyn.
      else if (res && res.status === 402) {
        const info = await res.json().catch(() => ({}));
        const err = new Error(info.error || "Teamets plan har tagit slut.");
        err.planEnded = info.plan || "expired";
        err.company = info.company || null;
        err.canResume = info.canResume !== false;
        throw err;
      }
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
  // Servern avgör om teamet är köpt; portalen talar bara om vilket det är.
  // Demoläget skickar ingen slug — där sker inga anrop alls, svaren är
  // förskrivna, och ett 402 mitt i en förhandsvisning vore obegripligt.
  try { window.ATBClaude.setTeam(state.demo ? null : slug); } catch (_) { /* äldre klient */ }
  state.history = loadHistory(slug);
  state.activeAgentId = agentById(team.entryAgent) ? team.entryAgent : team.agents[0].id;
  // team.defaultModel läses inte längre. Sedan 2026-08-05 kör hela produkten
  // en enda modell, låst i atb-claude.js, och stream() ignorerar vad anropet
  // än skickar med. Fältet finns kvar i äldre teamfiler men styr ingenting —
  // att låta det se ut som ett val vore att ljuga i konfigurationen.
}

// ---------- boot ----------
async function boot() {
  syncModelForProvider(); // nyckelns leverantör avgör vilket modellval som gäller

  // Kontot före nyckeln. Att välja vilket team man vill öppna kräver ingen
  // API-nyckel, och en kund som ännu inte loggat in ska inte mötas av en
  // ruta som frågar efter en. Gäller bara den nakna adressen: står det ett
  // team i URL:en, eller bär fragmentet en delningslänk, är avsikten redan
  // uttalad och den gamla vägen gäller.
  if (!/^#cfg=/.test(location.hash || "") && !getSlug()) {
    if (state.demo) { renderPicker(); return; }
    const me = await authMe();
    if (me) { renderAccountPicker(me); return; }
    if (me === false) { renderLogin({}); return; }
    renderPicker(); // API:et onåbart — visa det som ändå fungerar
    return;
  }

  // Nyckelrutan är borta (2026-08-06). Grinden till portalen är köpet, inte en
  // nyckel: moln-team hämtas via /api/teams/:slug, som kräver inloggning och en
  // rad i team_access. Det som återstår här är att skilja på de tre sorters
  // team som når portalen utan att vara köpta.
  //
  // Demoteamen — exempelteamen i registret och branschsidornas demo — finns
  // för att titta på. De öppnas alltid i demoläge: förskrivna svar, inga
  // anrop, ingen inloggning. Utan det mötte en besökare ett 402 mitt i sin
  // första fråga, vilket läses som ett fel och inte som ett erbjudande.
  if (isShowcaseSlug(getSlug())) state.demo = true;

  // Delningslänk? Fragment (#cfg=…) bär hela teamkonfigen och når aldrig
  // servern. Packa upp, spara lokalt och öppna som __link-team.
  const hashCfg = /^#cfg=(.+)/.exec(location.hash || "");
  if (hashCfg) {
    try {
      const t = await window.ATBClaude.decodeTeamLink(hashCfg[1]);
      try { localStorage.setItem("atb_link_team", JSON.stringify(t)); } catch (_) { /* full storage */ }
      await loadTeam("__link");
      if (!state.demo) {
        renderLocked("Teamet kom hit via en delningslänk, så du kan läsa hela uppsättningen — "
          + "vilka agenter det består av, vad var och en gör och vad som medvetet valdes bort. "
          + "För att arbeta med dem behöver teamet aktiveras på ett konto.");
        return;
      }
      renderPortal();
      initFolder();
      return;
    } catch (err) {
      renderPicker("Teamlänken kunde inte öppnas — be avsändaren om en ny. (" + ((err && err.message) || "okänt fel") + ")");
      return;
    }
  }
  const slug = getSlug();
  if (!slug) { renderPicker(); return; } // nås bara om adressen ändrats under körning
  try {
    await loadTeam(slug);
    // Utkast och delade team laddar sin konfig lokalt och passerar därför
    // aldrig köpgrinden i /api/teams/:slug. De stannar här. Moln-team har redan
    // prövats mot team_access när konfigen hämtades — når vi hit är det köpt.
    if (isUnpaidLocalSlug(slug) && !state.demo) { renderLocked(); return; }
    renderPortal();
    initFolder(); // async — banner/underlag dyker upp när mappen lästs
  } catch (err) {
    // Logga innan vi översätter till en vänlig mening. Fångsten gäller
    // "hittade inget team", men den sväljer lika gärna ett programfel i
    // renderingen — och då ser det ut som en trasig länk i stället för en bugg.
    console.error("[portal] kunde inte öppna teamet:", err);
    // Planen har tagit slut: teamet ÄR kundens, det är bara inte igång. Den
    // låsta vyn säger det, och erbjuder vägen tillbaka i stället för att be
    // henne bygga ett nytt team.
    if (err && err.planEnded) { renderPlanEnded(slug, err); return; }
    renderPicker(err.message);
  }
}

// ---------- låst team (byggt men inte köpt) ----------
//
// Ersätter den gamla nyckelrutan. Kunden har aldrig en egen nyckel; det som
// skiljer ett team som svarar från ett som inte gör det är köpet. Vyn visas
// för Builder-utkast och delningslänkar — konfigen finns i webbläsaren, men
// agenterna är inte inkopplade.
//
// Den säger vad kunden HAR, inte bara vad hon saknar: teamet är byggt, det är
// hennes, och det som köps är arbetsytan runt det.
function renderLocked(reason) {
  const root = $("#root");
  root.innerHTML = "";
  const wrap = el("main", "setup");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", "🔒 Teamet är inte aktiverat"));
  // Företagsnamnet kommer ur en teamkonfig (utkast eller delningslänk) och är
  // alltså text vi inte skrivit själva. Byggs som textnoder, aldrig innerHTML.
  const h = el("h1");
  h.append(
    document.createTextNode(((team && team.company) || "Ert team") + " är "),
    el("span", "grad", "byggt"),
    document.createTextNode(" — men inte igång"),
  );
  wrap.appendChild(h);

  const lead = el("p", "setup-lead");
  lead.textContent = reason ||
    "Teamet du ser ligger i den här webbläsaren. För att agenterna ska kunna svara, "
    + "hålla veckomöten och minnas mellan gångerna behöver det aktiveras på ett konto hos oss. "
    + "AI:n ingår — du behöver ingen egen nyckel och inget konto hos någon leverantör.";
  wrap.appendChild(lead);

  if (team && Array.isArray(team.agents) && team.agents.length) {
    const got = el("p", "setup-help");
    const nR = Array.isArray(team.routines) ? team.routines.length : 0;
    got.textContent = `Det som väntar: ${team.agents.length} agenter`
      + (nR ? `, ${nR} veckorutiner` : "")
      + ", delat företagsminne och möten mellan agenterna.";
    wrap.appendChild(got);
  }

  const btn = el("button", "btn-primary", "Aktivera teamet →");
  btn.onclick = () => { location.href = "../builder/"; };
  wrap.appendChild(btn);

  const peek = el("button", "demo-link", "Eller se hur portalen fungerar i ett demoteam →");
  peek.onclick = () => { location.href = "?team=coachonline&demo=1"; };
  wrap.appendChild(peek);

  root.appendChild(wrap);
}

// ---------- planen har tagit slut ----------
//
// Syskonet till renderLocked(), men för motsatt situation. Där handlar det om
// ett team som aldrig aktiverats; här om ett som varit igång och slutat. Det
// är skillnaden mellan "du har inte köpt något" och "din månad är slut", och
// att säga fel av de två är att antingen glömma att kunden betalat eller att
// be någon köpa något hon redan äger.
//
// Innehållet ligger kvar orört: samtal, minne och underlag bor i webbläsaren
// och i kundens egen mapp, inte hos oss. Det ska stå i klartext här — annars
// läser en kund "teamet är avstängt" som "allt jag skrivit är borta", och då
// blir uppsägningen ett bråk i stället för ett avslut.
const PLAN_ENDED_TEXT = {
  expired: {
    badge: "⏳ Provmånaden är slut",
    lead: "Provmånaden är slut, så agenterna svarar inte just nu. Ingenting har försvunnit: "
      + "samtalen, företagsminnet och era underlag ligger kvar i den här webbläsaren och i mappen ni kopplat.",
    cta: "Fortsätt löpande — 290 kr/mån →",
  },
  cancelled: {
    badge: "✔ Abonnemanget är avslutat",
    lead: "Abonnemanget är uppsagt och perioden har löpt ut, så agenterna svarar inte längre. "
      + "Allt ni lagt in ligger kvar i den här webbläsaren och i mappen ni kopplat — det är ert att behålla.",
    cta: "Starta om teamet — 290 kr/mån →",
  },
  past_due: {
    badge: "💳 Betalningen gick inte igenom",
    lead: "Vi fick inte betalt för senaste fakturan, så teamet är pausat. Det är oftast ett kort som "
      + "gått ut. Teckna om så öppnas allt igen — ingenting har försvunnit under tiden.",
    cta: "Starta abonnemanget igen →",
  },
  refunded: {
    badge: "↩ Köpet är återbetalat",
    lead: "Köpet är återbetalat, så agenterna svarar inte längre. Teamet och allt ni lagt in finns kvar "
      + "i den här webbläsaren.",
    cta: "Börja om — 290 kr/mån →",
  },
};

function renderPlanEnded(slug, info) {
  const t = PLAN_ENDED_TEXT[info.planEnded] || PLAN_ENDED_TEXT.expired;
  const root = $("#root");
  root.innerHTML = "";
  const wrap = el("main", "setup");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", t.badge));

  // Företagsnamnet kommer från servern och är kundens eget — textnoder ändå,
  // samma regel som i renderLocked().
  const h = el("h1");
  h.append(
    document.createTextNode((info.company || "Ert team") + " står "),
    el("span", "grad", "kvar"),
    document.createTextNode(" — men är pausat"),
  );
  wrap.appendChild(h);
  wrap.appendChild(el("p", "setup-lead", t.lead));

  if (info.canResume) {
    const btn = el("button", "btn-primary", t.cta);
    btn.onclick = async () => {
      btn.disabled = true;
      const orig = btn.textContent;
      btn.textContent = "Öppnar betalningen …";
      try {
        // Samma team, ny plan. Servern kontrollerar att kontot äger slugen —
        // det som skickas härifrån är bara vilket team det gäller.
        const res = await window.ATBClaude.fetchWithTimeout("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ tier: "standard", slug }),
        }, 15000);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || "Kunde inte öppna betalningen.");
        location.href = data.url;
      } catch (e) {
        btn.disabled = false;
        btn.textContent = orig;
        const msg = el("p", "setup-help", (e && e.message) || "Något gick fel. Mejla info@mittaiteam.se så löser vi det.");
        wrap.insertBefore(msg, btn.nextSibling);
      }
    };
    wrap.appendChild(btn);
  }

  const dl = el("button", "demo-link", "Ladda ner allt ni lagt in →");
  dl.onclick = () => {
    // Uttaget bygger på state.slug och team — båda saknas här, eftersom
    // konfigen aldrig levererades. Historiken finns däremot lokalt, så vi
    // skickar kunden till det som faktiskt går att få ut.
    downloadRawHistory(slug);
  };
  wrap.appendChild(dl);

  const help = el("p", "setup-help");
  help.append(
    document.createTextNode("Stämmer det inte — hör av er till "),
    (() => { const a = el("a"); a.href = "mailto:info@mittaiteam.se"; a.textContent = "info@mittaiteam.se"; return a; })(),
    document.createTextNode(", så tittar vi på det."),
  );
  wrap.appendChild(help);

  root.appendChild(wrap);
}

// Nöduttag när teamkonfigen inte finns: exportEverything() behöver agenternas
// namn för att skriva en läsbar fil, och de kommer ur konfigen. Här skrivs
// råhistoriken i stället — mindre snyggt, men det är kundens text och den ska
// aldrig sitta fast bakom en plan som tagit slut.
function downloadRawHistory(slug) {
  const out = [`# Sparat från portalen — ${slug}`, "", `Uttag ${new Date().toLocaleString("sv-SE")}.`, ""];
  const hist = loadHistory(slug);
  let any = false;
  Object.keys(hist || {}).forEach((agentId) => {
    const msgs = hist[agentId] || [];
    if (!msgs.length) return;
    any = true;
    out.push(`## ${agentId}`, "");
    msgs.forEach((m) => {
      out.push(`**${m.role === "user" ? "Du" : "Teamet"}**${m.at ? " · " + new Date(m.at).toLocaleString("sv-SE") : ""}`, "", m.content || "", "");
    });
  });
  let mem = "";
  try { mem = (localStorage.getItem(MEM_PREFIX + slug) || "").trim(); } catch (_) { /* läsfel */ }
  if (mem) { out.push("## Företagsminne", "", mem, ""); any = true; }
  if (!any) out.push("_(ingenting sparat i den här webbläsaren)_");
  downloadFile(`${slug}-sparat-${isoDay()}.md`, out.join("\n"));
}

// Lämna demoläget. Demot säljer ingenting (beslut 2026-08-06) — teamet på
// skärmen tillhör någon annan. Vägen ut ur ett demo är därför att bygga sitt
// eget, inte att koppla in något här.
function connectKey() {
  state.demo = false;
  const params = new URLSearchParams(location.search);
  if (params.get("demo")) {
    params.delete("demo");
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  }
  location.href = "../builder/";
}

// ---------- team picker ----------
// ---------- inloggning (M3) ----------
// Portalen har två publiker: exempelteamen, som är öppna för vem som helst,
// och kunder med ett köpt team, som ska logga in. Skillnaden avgörs av om
// ?team= står i adressen — står det, gäller den gamla vägen; står det inget,
// frågar vi kontot först och faller tillbaka på exempellistan.
//
// Ingen lösenordshantering här. Kunden skriver sin adress, får en sexsiffrig
// kod i mejlen och är inne. Sessionen ligger i en HttpOnly-kaka som det här
// skriptet varken kan läsa eller skriva — vilket är hela poängen.

// Tre utfall, och skillnaden mellan de två sista spelar roll:
//   objekt → inloggad
//   false  → inte inloggad, men API:et svarar (visa inloggning)
//   null   → API:et finns inte eller är onåbart (visa exempellistan)
// Utan den skillnaden möts en besökare av en inloggningsruta som inte kan
// fungera de dagar backend ligger nere eller inte är driftsatt.
async function authMe() {
  try {
    const res = await window.ATBClaude.fetchWithTimeout("/api/auth/me", { credentials: "same-origin" }, 8000);
    if (res.status === 401) return false;
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function authPost(path, body) {
  const res = await window.ATBClaude.fetchWithTimeout(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }, 15000);
  let data = {};
  try { data = await res.json(); } catch (_) { /* tomt svar */ }
  return { ok: res.ok, status: res.status, data };
}

const INPUT_CSS = "width:100%;max-width:340px;padding:12px 14px;border:1px solid var(--border);" +
  "border-radius:6px;font-size:16px;font-family:inherit;background:var(--surface);color:var(--text)";

function renderLogin(opts) {
  const o = opts || {};
  const root = $("#root");
  root.innerHTML = "";
  const wrap = el("main", "picker");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", o.email ? "Kolla mejlen" : "Logga in"));

  const h = el("h1");
  h.innerHTML = o.email
    ? `Vi skickade en <span class="grad">kod</span>`
    : `Logga in på <span class="grad">ert team</span>`;
  wrap.appendChild(h);

  wrap.appendChild(el("p", "setup-lead", o.email
    ? `Om ${o.email} finns hos oss ligger det en sexsiffrig kod i inkorgen. Den gäller i tio minuter.`
    : "Skriv adressen ni angav när teamet levererades, så skickar vi en engångskod. Inget lösenord att komma ihåg."));

  if (o.devNote) {
    const note = el("div", "setup-err", "🛠 " + o.devNote);
    note.style.cssText = "border-color:var(--accent);color:var(--accent-2)";
    wrap.appendChild(note);
  }

  const err = el("div", "setup-err"); err.style.display = "none";
  wrap.appendChild(err);
  const fail = (msg) => { err.textContent = "⚠️ " + msg; err.style.display = "block"; };

  const input = el("input");
  input.type = o.email ? "text" : "email";
  input.autocomplete = o.email ? "one-time-code" : "email";
  if (o.email) {
    input.inputMode = "numeric"; input.maxLength = 6; input.placeholder = "123456";
    if (o.devCode) input.value = o.devCode; // konsolläge: förifylld, tryck bara Logga in
  }
  else { input.placeholder = "namn@företaget.se"; input.value = o.prefill || ""; }
  input.style.cssText = INPUT_CSS + (o.email ? ";letter-spacing:.3em;font-size:22px;text-align:center;max-width:200px" : "");
  wrap.appendChild(input);

  const btn = el("button", "btn-primary", o.email ? "Logga in" : "Skicka kod");
  btn.type = "button";
  btn.style.cssText = "margin-top:14px;display:block";
  wrap.appendChild(btn);

  const submit = async () => {
    const value = input.value.trim();
    if (!value) return fail(o.email ? "Skriv koden från mejlet." : "Skriv din e-postadress.");
    btn.disabled = true;
    btn.textContent = o.email ? "Loggar in…" : "Skickar…";
    try {
      if (o.email) {
        const r = await authPost("/api/auth/verify", { email: o.email, code: value });
        if (!r.ok) throw new Error(r.data.error || "Koden gick inte att verifiera.");
        boot(); // inloggad — kör om starten, nu med session
        return;
      }
      const r = await authPost("/api/auth/request", { email: value });
      if (!r.ok) throw new Error(r.data.error || "Kunde inte skicka koden.");
      // devCode kommer bara när servern kör i konsolläge, alltså innan en
      // avsändare är uppsatt. Då fylls koden i åt användaren i stället för
      // att ligga i en logg som hen inte når.
      renderLogin({ email: value, devCode: r.data.devCode || "", devNote: r.data.devNote || "" });
      return;
    } catch (e) {
      fail((e && e.message) || "Något gick fel. Försök igen.");
    }
    btn.disabled = false;
    btn.textContent = o.email ? "Logga in" : "Skicka kod";
  };

  btn.onclick = submit;
  input.onkeydown = (e) => { if (e.key === "Enter") submit(); };

  const alt = el("p", "setup-lead");
  alt.style.cssText = "margin-top:26px;font-size:14px";
  if (o.email) {
    const again = el("a", "", "Skicka en ny kod");
    again.href = "#"; again.style.color = "var(--accent-2)";
    again.onclick = (e) => { e.preventDefault(); renderLogin({ prefill: o.email }); };
    alt.appendChild(again);
    alt.appendChild(document.createTextNode(" · "));
  }
  const demo = el("a", "", "Titta på exempelteamen i stället");
  demo.href = "#"; demo.style.color = "var(--accent-2)";
  demo.onclick = (e) => { e.preventDefault(); renderPicker(); };
  alt.appendChild(demo);
  wrap.appendChild(alt);

  root.appendChild(wrap);
  input.focus();
}

// Inloggad kund: visar de team kontot faktiskt når. Skiljer sig från
// exempellistan genom att den kommer från servern och går att ta tillbaka.
function renderAccountPicker(me) {
  const root = $("#root");
  root.innerHTML = "";
  const wrap = el("main", "picker");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "setup-badge", "Inloggad"));

  const h = el("h1");
  h.innerHTML = me.teams.length === 1
    ? `Välkommen <span class="grad">tillbaka</span>`
    : `Vilket <span class="grad">team</span> vill ni öppna?`;
  wrap.appendChild(h);
  wrap.appendChild(el("p", "setup-lead", "Inloggad som " + me.email + "."));

  if (!me.teams.length) {
    wrap.appendChild(el("div", "picker-empty",
      "Kontot finns, men inget team är kopplat till det än. Hör av dig till info@mittaiteam.se så ordnar vi det."));
  } else {
    const grid = el("div", "picker-grid");
    me.teams.forEach((t) => {
      const card = el("a", "pcard");
      card.href = `?team=${encodeURIComponent(t.slug)}`;
      // Samma uppbyggnad som exempellistans kort (ikon + meta), annars
      // ramlar layouten isär — .pcard är en flexrad, inte en stapel.
      card.appendChild(el("span", "pcard-icon", "🏢"));
      const meta = el("span", "pcard-meta");
      meta.appendChild(el("span", "pcard-name", t.company || t.slug));
      meta.appendChild(el("span", "pcard-tag", t.role === "owner" ? "Ägare" : "Medlem"));
      card.appendChild(meta);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  const out = el("button", "btn-ghost", "Logga ut");
  out.type = "button";
  out.style.cssText = "margin-top:26px";
  out.onclick = async () => {
    out.disabled = true;
    try { await authPost("/api/auth/logout", {}); } catch (_) { /* logga ut lokalt ändå */ }
    renderLogin({});
  };
  wrap.appendChild(out);

  root.appendChild(wrap);
}

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

  // Ingen "byt nyckel" längre — kunden har ingen. Kvar står vägen vidare för
  // den som tittar på ett demoteam: bygg sitt eget.
  const build = el("button", "link-btn", "Bygg ditt eget team →");
  build.style.marginTop = "10px";
  build.onclick = () => { location.href = "../builder/"; };
  wrap.appendChild(build);

  root.appendChild(wrap);
}

// ---------- portal shell ----------
function renderPortal() {
  const root = $("#root");
  root.innerHTML = "";
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
  checkTrialNotice();  // async: provmånadens slutdatum, om kontot säger att det är en provmånad
  runAutoRoutines();   // async: auto-rutiner som ska ligga klara idag
  // Första besöket: introduktionen går före allt annat. Den presenterar
  // agenterna en i taget och slutar med en väg vidare — "Därför ser ert team
  // ut så här" ligger som en knapp i sista steget i stället för att öppnas av
  // sig själv, så att en ny kund inte möts av två modaler i rad.
  //
  // Bara när chatten är orörd: den som redan jobbat i portalen ska inte få en
  // presentation av kollegor hen känner mitt i ett arbetspass. Knappen "Lär
  // känna teamet" i arbetsytan finns kvar för dem.
  const untouchedTeam = !Object.values(state.history).some((m) => m && m.length);
  if (!tourDone() && untouchedTeam) {
    // Ceremonin räknas som visad: introduktionen bär samma innehåll och
    // erbjuder det egna fönstret på slutet.
    try { localStorage.setItem("atb_hello_" + state.slug, "1"); } catch (_) { /* full storage */ }
    setTimeout(openIntro, 400);
    return;
  }
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
  // Introduktionen står överst så länge den inte är gjord — det är det första
  // en ny kund ska göra. Är den avklarad flyttar den ner bland de andra
  // "läs om teamet"-knapparna, så att Veckostart behåller sin vana plats.
  const introBtn = () => wsBtn("👋", "Lär känna teamet", openIntro, "Presentationen av teamet: en agent i taget, med en fråga tillbaka till dig");
  const tourLeft = !tourDone();
  if (tourLeft) introBtn();
  wsBtn("⭐", "Veckostart", startWeek, `${entryName} föreslår veckans fokus utifrån teamet och era rutiner`);
  wsBtn("🤝", "Håll ett möte", openMeeting, "Samla flera agenters perspektiv och landa i ett beslut");
  wsBtn("🧠", "Minne & underlag", openMemory, "Delade instruktioner och material som alla agenter ser");
  if (!tourLeft) introBtn();
  if (whyAvailable()) wsBtn("✨", "Därför detta team", openWhyTeam, "Varje agents koppling till er verksamhet — och det vi medvetet sa nej till");
  if (team.firstProject) wsBtn("🎯", "Första projektet", openFirstProject, "Ert första AI-projekt — planen och första steget");

  // Resten av arbetsytan. Byggs som en lista i stället för direkta anrop, så
  // att den kan fällas ihop för en ny kund utan att raderna dubbleras i koden.
  // Se wsCollapsed(): allt visas permanent så fort det finns chatthistorik.
  const extras = [];
  extras.push(["📈", "Veckans arbete", openWeekWork, "Vad du och teamet gjort den här veckan — och tid tillbaka"]);
  if (!state.demo && quarterEndsSoon()) extras.push(["🏆", "Kvartalet med teamet", openQuarter, "Kvartalets siffror — delbara med en kollega"]);
  if (!state.demo) extras.push(["🔄", "Utveckla teamet", openGrow, "Lägg till en agent när verksamheten förändras — avvisade moment står först i kön"]);
  if (!state.demo) extras.push(["🔍", "Sök i historiken", openSearch, "Sök i alla samtal och arkivet"]);
  const hideExtras = wsCollapsed();
  if (!hideExtras) extras.forEach((e) => wsBtn(e[0], e[1], e[2], e[3]));

  // Verktygen bygger alla på portalens egen logg och har ingenting att visa
  // förrän kunden använt teamet — de hör därför till det som fälls ut.
  const tools = state.demo ? [] : [
    ["📣", "Rapport till chefen", statusReport, "Statusuppdatering ur veckans logg — klar att klistra in i mejl eller Slack"],
    ["🏅", "Det här har jag levererat", deliveredList, "Underlag inför löne-, medarbetar- eller kundavstämningssamtal"],
    ["🎭", "Öva ett samtal", openPractice, "Rollspela ett svårt samtal — agenten spelar motparten och ger feedback"],
  ];
  if (hideExtras) {
    const more = el("button", "ws-more", `＋ Visa hela arbetsytan (${extras.length + tools.length} till)`);
    more.type = "button";
    more.title = "Möten, sök, rapporter och växtvägen — allt som bygger på arbete du ännu inte hunnit göra";
    more.onclick = () => { markWsExpanded(); refreshSidebar(); };
    ws.appendChild(more);
  }

  // Synlig inlärning: minnet som växande investering, inte gömd inställning.
  // Visas även i hopfällt läge — efter introduktionen står det plötsligt en
  // siffra där, och det är hela poängen med att svara på frågorna.
  if (!state.demo) {
    const fc = el("button", "fact-count", factLabel()); fc.id = "fact-count"; fc.type = "button";
    fc.title = "Teamets delade minne — klicka för att se och fylla på";
    fc.onclick = openMemory;
    ws.appendChild(fc);
  }

  // ---- Verktyg: engångshjälp som bygger på portalens egen logg ----
  if (tools.length && !hideExtras) {
    ws.appendChild(el("div", "side-label ws-head", "Verktyg"));
    tools.forEach((t) => wsBtn(t[0], t[1], t[2], t[3]));
  }

  // Tidig utveckling — säg det, dölj det inte. Kunderna är i praktiken
  // betatestare, och en synlig väg att klaga är billigare än en kund som
  // tyst slutar använda portalen. Ämnesraden bär teamets slug så att det
  // går att se vem som skrivit utan att fråga.

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

  ws.appendChild(el("div", "side-label ws-head", "Tyck till"));
  const beta = el("p", "ws-beta");
  beta.appendChild(document.createTextNode("Den här appen är i tidig utveckling. Rapportera buggar, berätta vad som funkar bra och dåligt, och önska funktioner — "));
  const betaLink = el("a", "", "hör av dig här");
  betaLink.href = "mailto:info@mittaiteam.se?subject=" +
    encodeURIComponent("Feedback på portalen (" + (state.slug || "okänt team") + ")") +
    "&body=" + encodeURIComponent(
      "Vad jag gjorde:\n\n\nVad som hände:\n\n\nVad jag hade väntat mig:\n\n\n" +
      "Önskemål eller idéer:\n\n");
  beta.appendChild(betaLink);
  beta.appendChild(document.createTextNode("."));
  ws.appendChild(beta);

  // ---- Sidfot: hör hemma i arbetsytan, inte i sidopanelen ----
  // Två skäl. Vänsterspalten blir helt och hållet laget, vilket var hela
  // poängen med trekolumnen — inga hublänkar eller nyckelknappar som delar
  // plats med de anställda. Och högerspalten, som annars tog slut ungefär två
  // tredjedelar ner och lämnade en stor tom yta, får något att avsluta med.
  // .ws ligger kvar som barn till .sidebar, så på mobil följer foten med in i
  // drawern precis som förut — ingen rad hamnar utom räckhåll bakom ☰.
  const foot = el("div", "side-foot");
  const hub = el("a", "hub-foot", "← Till hubben"); hub.href = "../";
  foot.appendChild(hub);
  // Modellväljaren är borttagen: produkten kör en modell och bara en, så en
  // dropdown vore ett val som inte finns. Etiketten visar vilken det är.
  const sl = el("div", "side-label", "Modell: " + window.ATBClaude.MODEL_LABEL);
  foot.appendChild(sl);
  // Här låg en <select> som byggdes, fylldes från OpenRouters katalog och
  // aldrig lades in i sidfoten. Den syntes alltså inte, men skrev fortfarande
  // ett modellval till localStorage — samma nyckel som Buildern läste, och det
  // var så den dubblerade DeepSeek-raden i Builderns väljare uppstod.
  // Död kod som ändå har biverkningar är värre än död kod. Borttagen.

  const share = el("button", "link-btn", "Dela / exportera team");
  share.onclick = openShare;
  foot.appendChild(share);

  // Vägen ut, i klartext och i samma spalt som allt annat. Villkoren lovar
  // både att data går att få ut och att uppsägning räcker med ett mejl — men
  // ett löfte som bara står i juridiken är inget löfte. Se avsnittet
  // "VÄGEN UT" längre ner i filen.
  if (!state.demo) {
    const dlAll = el("button", "link-btn", "Ladda ner allt");
    dlAll.title = "Företagsminnet, alla underlag och hela chatthistoriken som en enda markdown-fil";
    dlAll.onclick = () => downloadEverything(dlAll);
    foot.appendChild(dlAll);

    // Uppsägningen bara för riktiga team: ett Builder-utkast, en branschdemo
    // eller ett team som öppnats via delad länk har ingen beställning att säga
    // upp, och raden skulle bara förvirra. Nerladdningen finns däremot överallt
    // där det finns data — den hör till kunden, inte till avtalet.
    if (!state.slug.startsWith("__")) {
      const quit = el("button", "link-btn", "Säg upp");
      quit.title = "Avslutar abonnemanget från utgången av innevarande betalperiod. Teamet och era filer är era att behålla.";
      quit.onclick = openCancel;
      foot.appendChild(quit);
    }
  }

  if (state.demo) {
    const build = el("button", "link-btn", "Bygg ditt eget team →");
    build.onclick = connectKey;
    foot.appendChild(build);
  }

  // "Glöm allt": nyckel + all chatthistorik + utkast. Det riktiga svaret på
  // "hur tömmer jag den här datorn?" — t.ex. efter en demo på kundens maskin.
  const wipe = el("button", "link-btn wipe-btn", "Töm allt härifrån");
  wipe.title = "Tar bort nyckel, chatthistorik och team-utkast från den här webbläsaren";
  wipe.onclick = wipeAll;
  foot.appendChild(wipe);
  ws.appendChild(foot);
  side.appendChild(ws);

  return side;
}

function wipeAll() {
  if (!confirm("Ta bort ALLT sparat från den här webbläsaren?\n\n• All chatthistorik (alla team)\n• Företagsminne och underlag\n• Mappkopplingen (filerna i mappen rörs INTE)\n• Team-utkast från Builder och branschsidorna\n\nInloggningen och själva teamet ligger hos oss och påverkas inte.")) return;
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    // Alla portalens nycklar delar atb_-prefixet — svep allt, inklusive
    // framtida tillägg (rutinlogg, streak, puls, kostnad, checklista …).
    if (k && k.startsWith("atb_")) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
  try { indexedDB.deleteDatabase("atb-fs"); } catch (_) { /* inga mapphandtag */ }
  state.history = {}; state.folder = null;
  location.href = location.pathname; // tillbaka till dörren, utan team i adressen
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
  if (state.demo) {
    const mbuild = el("button", "mb-reset", "Bygg eget");
    mbuild.onclick = connectKey;
    mbar.appendChild(mbuild);
  }

  if (state.demo) {
    const banner = el("div", "demo-banner");
    banner.appendChild(el("span", "demo-dot"));
    banner.appendChild(el("span", "demo-text", "Demoläge — svaren är förskrivna exempel som visar hur portalen känns. Teamet tillhör ett annat företag."));
    const connect = el("button", "demo-connect", "Bygg samma sak för din verksamhet →");
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
  composer.appendChild(ta);
  // Diktering (Web Speech API, Chrome/Edge): tala in hjärndumpen — mobilens
  // största friktion är att skriva långt. Texten hamnar i composern för
  // redigering innan den skickas. OBS: taligenkänningen sker via webbläsar-
  // leverantören — därför märkt i title, och inget skickas utan aktivt val.
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && !state.demo) {
    const mic = el("button", "composer-mic", "🎙"); mic.type = "button";
    mic.title = "Diktera (svenska). Rösten tolkas av webbläsarens taltjänst; texten hamnar här för redigering innan du skickar.";
    mic.setAttribute("aria-label", "Diktera");
    let rec = null;
    mic.onclick = () => {
      if (rec) { try { rec.stop(); } catch (_) {} return; }
      try {
        rec = new SR();
        rec.lang = "sv-SE"; rec.continuous = true; rec.interimResults = true;
        const base = ta.value ? ta.value.replace(/\s+$/, "") + " " : "";
        let finalTxt = "";
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalTxt += r[0].transcript + " ";
            else interim += r[0].transcript;
          }
          ta.value = base + finalTxt + interim;
          ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
        };
        rec.onend = () => { rec = null; mic.classList.remove("rec"); };
        rec.onerror = () => { rec = null; mic.classList.remove("rec"); };
        mic.classList.add("rec");
        rec.start();
      } catch (_) { rec = null; mic.classList.remove("rec"); }
    };
    composer.appendChild(mic);
  }
  composer.appendChild(send);
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
        // Rutan ska vara TOM efter klicket. Fylls den med förslaget står
        // kundens fråga kvar under svaret som om den aldrig skickats, och
        // nästa klick på pilen skickar samma fråga en gång till. Skicka-vägen
        // går via argumentet nedan — textrutan är inte inblandad alls.
        const ta = $("#composer-input");
        if (ta) { ta.value = ""; ta.style.height = "auto"; }
        // Skicka texten SOM ARGUMENT, inte via textrutan.
        //
        // Förut anropades submitMessage() tomt och fick läsa rutan själv. Men
        // funktionen har ett `await` innan den läser (mappen uppdateras), och i
        // den luckan hann värdet försvinna: kunden fick ett tomt meddelande
        // besvarat med generisk text, medan hennes riktiga fråga låg kvar i
        // rutan. Klickade hon på pilen igen hade knappen hunnit bli STOPP.
        //
        // Det inträffade på första klicket en ny kund gör — alltså i exakt det
        // ögonblick produkten ska bevisa sig. Uppmätt live 2026-08-06.
        submitMessage(s);
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
    // msg.display: kort etikett för knappgenererade instruktioner, se
    // submitMessage(). Faller alltid tillbaka på den skickade texten, så
    // vanliga meddelanden och äldre historik ser ut precis som förut.
    b.textContent = (msg && msg.display) || text;
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

// ---------- ISO-vecka ----------
// Bodde tidigare i kostnadsvisningen; används av veckorutiner, streak och
// pulskortet.
function isoWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3); // torsdagen i samma vecka
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${week}`;
}

// Kostnadsvisningen är borttagen 2026-08-06. Den kom från BYO-tiden, då
// kunden betalade sin egen förbrukning och hade rätt att se den. Nu ingår
// AI:n i ett fast pris — då är ett kronbelopp under varje svar inte
// transparens utan brus, och inbjuder till frågan "varför debiteras jag?".
// Kostnaden är vår att bevaka, och den bokförs redan serversidan i
// `ai_usage`/`ai_budget`. Priserna här var dessutom DeepSeeks gamla.

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
    // Presentationen står först: den som inte vet vilka agenterna är kan
    // omöjligt veta vilken fråga som är "en riktig fråga" till nästa steg.
    { done: tourDone(), label: "Lär känna teamet — en agent i taget", act: openIntro },
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

// ---------- introduktion: lär känna teamet ----------
// Skarp test 2026-08-06: en ny kund möts av tio knappar i arbetsytan, en
// checklista, puls-kort och en tom chatt — allt på en gång, och ingen aning
// om vilka agenterna är. Introduktionen gör tvärtom: EN agent i taget, i
// första person, som avslutar med EN fråga tillbaka. Det är så man lär känna
// någon, och det är billigare än en rundvandring: svaret läggs i
// företagsminnet (samma ställe som Minne & underlag skriver till), så teamet
// är faktiskt bättre när introduktionen är slut än när den började.
//
// Ingen AI inblandad — all text kommer ur teamkonfigen. Därför fungerar
// introduktionen likadant i demoläget, utan nyckel och utan kostnad.
const TOUR_PREFIX = "atb_tour_";     // + slug → "1" när introduktionen visats
const WSMORE_PREFIX = "atb_wsmore_"; // + slug → "1" när arbetsytan fällts ut helt

// Går nyckeln inte att läsa (privat läge, blockerad lagring) svarar vi "gjord".
// Alternativet vore att auto-öppna introduktionen vid varje sidladdning för
// någon som redan sett den — en modal som inte går att bli av med är värre än
// en introduktion som aldrig visas automatiskt. Knappen i arbetsytan finns kvar.
function tourDone() {
  try { return !!localStorage.getItem(TOUR_PREFIX + state.slug); } catch (_) { return true; }
}
function markTourDone() {
  try { localStorage.setItem(TOUR_PREFIX + state.slug, "1"); } catch (_) { /* full storage */ }
}

// Ingångsagenten först, resten i teamets egen ordning — samma hierarki som
// sidopanelen och "Börja här"-märket i tomläget.
function introAgents() {
  const list = (team.agents || []).slice();
  const i = list.findIndex((a) => a.id === team.entryAgent);
  if (i > 0) list.unshift(list.splice(i, 1)[0]);
  return list;
}

// Frågorna. Varje agent ställer EN, och de är medvetet olika: åtta agenter som
// alla frågar "vad kan jag hjälpa dig med?" är en enkät, inte ett samtal.
// Varje fråga är dessutom vald för att svaret ska bli ett hållbart faktum om
// verksamheten — något som är sant om ett halvår och är värt plats i minnet.
// `topic` blir etiketten framför svaret i företagsminnet.
// En teamkonfig får skriva över med `introQuestion` (+ valfritt `introTopic`).
const INTRO_QUESTIONS = [
  { topic: "Veckans största tidstjuv", q: "Vad tar mest tid av dig en vanlig vecka — det du helst hade sluppit göra själv?" },
  { topic: "Typisk kund", q: "Vem är er typiska kund, och vad är det de egentligen köper av er?" },
  { topic: "Tonläge mot kund", q: "Hur vill ni låta när ni skriver till kunder? Ge mig gärna ett exempel på något ni aldrig skulle skriva." },
  { topic: "Regler jag alltid ska följa", q: "Finns det något ni redan bestämt — priser, arbetssätt, gränser — som jag alltid ska hålla mig till?" },
  { topic: "Målet på tre månader", q: "Vad ska vara annorlunda om tre månader för att det här ska ha varit värt pengarna?" },
  { topic: "Verktyg och system", q: "Vilka verktyg och system jobbar ni i idag som jag behöver känna till?" },
  { topic: "Vanliga fallgropar", q: "Vad brukar gå fel i det här arbetet — sådant jag ska hålla ögonen på?" },
  { topic: (a) => `Första uppgiften till ${a.name}`, q: "Vilken konkret uppgift vill du att jag tar tag i först?" },
];
function introQuestionFor(agent, idx) {
  if (agent.introQuestion) {
    return { q: agent.introQuestion, topic: agent.introTopic || `Till ${agent.name}` };
  }
  // Ingångsagenten frågar alltid om tidstjuven: det är den enda frågan vars
  // svar hela teamet har nytta av, och den är lättast att svara på direkt.
  const shape = idx === 0
    ? INTRO_QUESTIONS[0]
    : INTRO_QUESTIONS[1 + ((idx - 1) % (INTRO_QUESTIONS.length - 1))];
  return { q: shape.q, topic: typeof shape.topic === "function" ? shape.topic(agent) : shape.topic };
}

// Ett svar → en rad i företagsminnet, samma format som minnesförslagen ("• ").
// Returnerar false när ingenting sparades, så avslutsteget kan räkna rätt.
function saveIntroAnswer(topic, text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return false;
  const mem = loadMemory();
  // Körs introduktionen om ska samma svar inte hamna två gånger i minnet.
  if (mem && mem.includes(t.slice(0, 60))) return false;
  saveMemory((mem.trim() ? mem.replace(/\s+$/, "") + "\n" : "") + `• ${topic}: ${t}`);
  paintFactCount();
  return true;
}

function openIntro() {
  const agents = introAgents();
  if (!agents.length) return;
  // Markera direkt vid öppning, inte vid avslut: stänger kunden rutan med ✕,
  // Esc eller ett klick utanför är det ett "nej tack", och då ska frågan inte
  // komma tillbaka nästa gång portalen öppnas. Vägen tillbaka är knappen
  // "Lär känna teamet" i arbetsytan — den försvinner aldrig.
  markTourDone();
  const box = openOverlay("👋 Lär känna ert team");
  box.classList.add("tour-box");
  const body = el("div", "tour-body");
  box.appendChild(body);

  let step = -1; // -1 = välkomst · 0..n-1 = en agent · n = avslut
  let saved = 0;

  // Sidopanelen och puls-korten ritades FÖRE introduktionen och känner inte
  // till svaren som just sparats: checklistans bock, minnesräknaren och kortet
  // "teamet känner er inte än" skulle stå kvar och ljuga tills nästa
  // sidladdning. Måla om dem när rutan lämnas — oavsett hur den lämnas
  // (✕, bakgrundsklick, Escape eller att Minne & underlag öppnas ovanpå).
  const repaint = () => { refreshSidebar(); renderPulse(); };
  ovlOnClose = repaint;

  const progress = (label) => {
    const wrap = el("div", "tour-prog");
    wrap.appendChild(el("div", "side-label", label));
    const bar = el("div", "tour-bar");
    const fill = el("i");
    fill.style.width = Math.round(((step + 1) / (agents.length + 1)) * 100) + "%";
    bar.appendChild(fill);
    wrap.appendChild(bar);
    return wrap;
  };
  // "Hoppa över resten" finns på varje steg — kravet är att det ska gå att
  // avbryta när som helst, inte bara i början.
  const skipRow = (label) => {
    const b = el("button", "tour-skip", label || "Hoppa över resten");
    b.type = "button";
    b.onclick = () => { step = agents.length; render(); };
    return b;
  };

  const renderWelcome = () => {
    body.appendChild(el("p", "ovl-lead",
      `${team.company} har ${agents.length} ${agents.length === 1 ? "agent" : "agenter"} anställda. ` +
      "Jag presenterar dem en i taget — var och en berättar kort vem hen är och ställer en fråga tillbaka till dig. " +
      "Dina svar sparas i teamets delade minne, så teamet kan mer om er när vi är klara än när vi började."));
    if (team.tagline) body.appendChild(el("p", "tour-tagline", team.tagline));
    body.appendChild(el("p", "ovl-note", "Tar någon minut. Du kan hoppa över en fråga eller hela introduktionen när du vill — den kommer inte tillbaka av sig själv, men ligger kvar som \"Lär känna teamet\" i arbetsytan."));
    const acts = el("div", "tour-acts");
    const go = el("button", "btn-primary ovl-save", "Börja presentationen");
    go.type = "button";
    go.onclick = () => { step = 0; render(); };
    acts.appendChild(go);
    acts.appendChild(skipRow("Hoppa över"));
    body.appendChild(acts);
  };

  const renderAgent = (a, idx) => {
    body.appendChild(progress(`Agent ${idx + 1} av ${agents.length}`));

    const head = el("div", "tour-head");
    head.appendChild(agentIcon(a, "tour-icon"));
    const meta = el("div", "tour-meta");
    meta.appendChild(el("div", "tour-name", a.name));
    meta.appendChild(el("div", "tour-role", a.tagline || a.role || ""));
    head.appendChild(meta);
    body.appendChild(head);

    // Agentens egna ord ur konfigen. `job` är uppdraget, `why` är kopplingen
    // till kundens egen verksamhet — den senare är produktens starkaste
    // argument och hör hemma här, bredvid ansiktet, inte bara i en lista.
    const say = el("div", "tour-say");
    if (a.job) say.appendChild(el("p", "tour-p", a.job));
    if (a.why) say.appendChild(el("p", "tour-p tour-why", a.why));
    if (!a.job && !a.why && a.role) say.appendChild(el("p", "tour-p", a.role));
    const caps = (Array.isArray(a.capabilities) ? a.capabilities : []).slice(0, 3);
    if (caps.length) {
      say.appendChild(el("div", "ovl-label", "Det här gör jag"));
      const ul = el("ul", "tour-caps");
      caps.forEach((c) => ul.appendChild(el("li", null, c)));
      say.appendChild(ul);
    }
    body.appendChild(say);

    const { q, topic } = introQuestionFor(a, idx);
    body.appendChild(el("div", "tour-q", q));
    const ta = el("textarea", "ovl-ta tour-ta");
    ta.rows = 2;
    ta.placeholder = "Svara med en mening — eller hoppa över.";
    body.appendChild(ta);

    const acts = el("div", "tour-acts");
    const next = el("button", "btn-primary ovl-save", "Gå vidare →");
    next.type = "button";
    const label = () => { next.textContent = ta.value.trim() ? "Spara svaret och gå vidare →" : "Gå vidare →"; };
    ta.addEventListener("input", label);
    // Enter skickar, Shift+Enter ger radbrytning — samma regel som composern,
    // och svaren här är oftast en mening. Pekskärm undantagen (se COARSE).
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !COARSE) { e.preventDefault(); next.click(); }
    });
    next.onclick = () => {
      if (saveIntroAnswer(topic, ta.value)) saved++;
      step = idx + 1;
      render();
    };
    acts.appendChild(next);
    acts.appendChild(skipRow());
    body.appendChild(acts);
    // preventScroll: i ett smalt fönster ligger svarsfältet under vikningen,
    // och ett vanligt focus() hade rullat dit direkt — förbi presentationen
    // som är hela poängen med steget. Markören står ändå rätt.
    if (!COARSE) setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (_) { ta.focus(); } }, 40);
  };

  const renderDone = () => {
    repaint(); // svaren finns i minnet nu — låt arbetsytan visa det
    body.appendChild(progress("Klart"));
    const entry = agentById(team.entryAgent) || agents[0];
    body.appendChild(el("p", "tour-done-h", saved
      ? `Tack — teamet vet nu ${saved} ${saved === 1 ? "sak" : "saker"} om er som det inte visste innan.`
      : "Introduktionen är klar."));
    body.appendChild(el("p", "ovl-lead", saved
      ? "Svaren ligger i företagsminnet och följer med i varje samtal, med alla agenter. Du kan läsa, ändra och fylla på under Minne & underlag."
      : "Du hoppade över frågorna — det går bra. Teamet jobbar ändå, men blir märkbart vassare när det vet hur ni arbetar. Fyll på under Minne & underlag när du vill."));
    // Förklara den gradvisa arbetsytan, annars ser den ut som en produkt med
    // färre funktioner än den har.
    if (!state.demo && wsCollapsed()) {
      body.appendChild(el("p", "ovl-note", "Arbetsytan till höger visar de fyra viktigaste sakerna först. Resten — möten, sök, rapporter, växtvägen — fälls ut med ett klick, eller av sig själv så fort du ställt din första fråga."));
    }
    const acts = el("div", "tour-acts tour-acts-col");
    const go = el("button", "btn-primary ovl-save", `Ställ din första fråga till ${entry.name}`);
    go.type = "button";
    go.onclick = () => {
      closeOverlay();
      selectAgent(entry.id);
      if (!COARSE) setTimeout(() => $("#composer-input")?.focus(), 40);
    };
    acts.appendChild(go);
    const mem = el("button", "tour-link", saved ? "Se vad teamet vet om er" : "Öppna Minne & underlag");
    mem.type = "button";
    mem.onclick = openMemory; // openOverlay stänger den här rutan åt oss
    acts.appendChild(mem);
    // Nejen ligger kvar i sitt eget fönster — de är ett eget resonemang och
    // ska inte klämmas in som en fotnot i introduktionen.
    if (whyAvailable()) {
      const why = el("button", "tour-link", "Därför ser teamet ut precis så här");
      why.type = "button";
      why.onclick = openWhyTeam;
      acts.appendChild(why);
    }
    body.appendChild(acts);
  };

  const render = () => {
    body.innerHTML = "";
    if (step < 0) renderWelcome();
    else if (step >= agents.length) renderDone();
    else renderAgent(agents[step], step);
    // Långa presentationer: börja alltid överst i rutan vid stegbyte.
    const ovl = $("#ovl"); if (ovl) ovl.scrollTop = 0;
  };
  render();
}

// ---------- gradvis arbetsyta ----------
// Arbetsytan har vuxit i fyra omgångar och är nu tolv rader lång. För någon
// som använt portalen i en månad är det ett verktygsbälte; för någon som
// öppnar den för första gången är det en vägg — och hälften av raderna
// (Sök i historiken, Veckans arbete, Det här har jag levererat) är dessutom
// tomma innan det finns något att söka i.
//
// Regeln är medvetet försiktig: så fort det finns EN rad chatthistorik visas
// allt, för alltid. Ingen som redan lärt sig var en knapp sitter kan alltså
// tappa bort den, och den som fäller ut manuellt får utfällt läge permanent.
function wsCollapsed() {
  if (state.demo) return false; // demot ska visa hela produkten
  try {
    if (localStorage.getItem(WSMORE_PREFIX + state.slug) === "1") return false;
  } catch (_) { return false; } // kan vi inte läsa flaggan: visa allt
  return !Object.values(state.history).some((m) => m && m.length);
}
function markWsExpanded() {
  try { localStorage.setItem(WSMORE_PREFIX + state.slug, "1"); } catch (_) { /* full storage */ }
}
// Bygger om vänsterspalten på plats. Billigare än renderPortal(), som också
// kör puls, provmånadskoll och auto-rutiner (varav den sista kostar pengar).
function refreshSidebar() {
  const old = document.querySelector(".sidebar");
  if (!old) return;
  old.replaceWith(renderSidebar());
  document.querySelectorAll(".agent-item").forEach((n) => n.classList.toggle("active", n.dataset.agent === state.activeAgentId));
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
  if (state.demo || state.streaming) return;
  stopAutoRoutines(); // ett betalt anrop i taget
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
      maxTokens: 400,
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
  // Svenska myndighetsdatum (valbart under Minne & underlag) — eget kort med
  // eget fönster, så månatliga AGI:n inte tränger ut kundens egna säsonger.
  let dlForm = null;
  try { dlForm = localStorage.getItem("atb_dlform_" + state.slug); } catch (_) { /* läsfel */ }
  if (dlForm && dlForm !== "off" && Array.isArray(window.ATB_DEADLINES_SE)) {
    const base = dlForm.split("-")[0];
    const emp = dlForm.includes("anstallda");
    let bestDl = null;
    window.ATB_DEADLINES_SE.forEach((d) => {
      const match = d.forms.includes("alla") || d.forms.includes(base) || (emp && d.forms.includes("anstallda"));
      if (!match) return;
      let when;
      if (d.monthly) {
        when = new Date(now.getFullYear(), now.getMonth(), d.day);
        if (when < now) when = new Date(now.getFullYear(), now.getMonth() + 1, d.day);
      } else {
        when = new Date(now.getFullYear(), (d.month || 1) - 1, d.day || 1);
        if (when < now) when = new Date(now.getFullYear() + 1, (d.month || 1) - 1, d.day || 1);
      }
      const days = Math.ceil((when - now) / 86400000);
      const win = d.monthly ? 7 : 28;
      if (days >= 0 && days <= win && (!bestDl || days < bestDl.days)) bestDl = { d, days };
    });
    if (bestDl) {
      cards.push({ icon: "🏛", label: bestDl.days === 0 ? `Idag: ${bestDl.d.label}` : `${bestDl.days} dagar: ${bestDl.d.label}`, act: () => {
        selectAgent(team.entryAgent);
        const ta = $("#composer-input");
        if (ta) {
          ta.value = `${bestDl.d.label} närmar sig (${bestDl.days} dagar kvar). Gör en kort checklista över vad jag behöver ha klart, och vad du kan hjälpa till med redan nu.`;
          ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
          if (!COARSE) ta.focus();
        }
      } });
    }
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
  submitMessage(`Ny vecka! Teamets aktivitetsdata:\n${meta}\n\nGe mig: 1) en kort återblick — vad vi ägnade oss åt (utgå från datan ovan, gissa inga detaljer), 2) förslag på veckans tre fokus med motivering, 3) vilken rutin eller agent jag borde börja med idag. Kort och konkret.`, "☀️ Veckan som gick — och vad jag ska fokusera på nu");
}

// ---------- auto-körda rutiner ----------
// Rutiner med auto:true i teamkonfigen genereras klart i bakgrunden när
// portalen öppnas på rätt dag — skillnaden mellan "teamet väntar på order"
// och "teamet har redan jobbat". Kräver komplett prompt (inga [fyll i]),
// körs max en gång per vecka och rutin, och får aldrig störa vid fel.
//
// Bakgrundsarbete som kunden betalar för måste gå att stoppa. Kontrollen låg
// tidigare bara i en `if (state.streaming)`-koll FÖRE anropet: började
// användaren skriva under tiden fanns två betalda anrop i luften samtidigt,
// utan signal och utan stoppknapp. Nu har auto-körningen en egen
// AbortController, och den avbryts i samma ögonblick som användaren själv
// skickar något (submitMessage/runMeeting). Rutinen förblir obockad och körs
// om vid nästa sidöppning.
let autoAbort = null; // AbortController för pågående auto-rutin
let autoBusy = false; // en auto-körning i taget
function stopAutoRoutines() {
  if (!autoAbort) return;
  try { autoAbort.abort(); } catch (_) { /* redan avslutad */ }
  autoAbort = null;
}
async function runAutoRoutines() {
  if (state.demo || state.streaming || autoBusy) return;
  // Dagfönster: rutinens dag ELLER senare samma vecka — den som öppnar
  // portalen på tisdag ska inte bli utan måndagsbriefen.
  const due = (team.routines || []).filter((rt) =>
    rt.auto === true && rt.day != null && rt.day <= todayDayNo() && rt.prompt && !rt.prompt.includes("[fyll i]") && !routineDone(rt.label));
  if (!due.length) return;
  autoBusy = true;
  try {
    for (const rt of due) {
      // Racea aldrig användarens egen chatt: börjar den strömma, avvakta auto
      // till nästa sidöppning (rutinen är fortfarande obockad och körs då).
      if (state.streaming) return;
      const agent = agentById(rt.agentId) || agentById(team.entryAgent);
      if (!agent) continue;
      const ctrl = new AbortController();
      autoAbort = ctrl;
      try {
        const userMsg = { role: "user", content: `${rt.prompt}\n\n(Stående rutin, körd automatiskt av portalen. Leverera ett färdigt utkast — lista i slutet vad du vill ha kompletterat om något saknas.)`, at: Date.now() };
        const reply = await window.ATBClaude.collect({
          apiKey: state.apiKey, model: state.model, system: systemFor(agent),
          messages: contextFor((state.history[agent.id] || []).concat([userMsg])),
          maxTokens: 4096, signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return; // avbruten mitt i: spara inget halvfärdigt
        if (!state.history[agent.id]) state.history[agent.id] = [];
        state.history[agent.id].push(userMsg, { role: "assistant", content: reply, at: Date.now(), auto: true });
        saveHistory();
        routineMarkDone(rt.label);
        autoDelivered.push({ label: rt.label, agentId: agent.id });
        // Rita inte om loggen mitt i en pågående strömning hos användaren.
        if (state.activeAgentId === agent.id && !state.streaming) renderLog();
        renderPulse();
      } catch (e) {
        if (e && e.name === "AbortError") return; // användaren tog över — inte ett fel
        /* auto får aldrig störa — rutinen går att köra manuellt */
      } finally {
        if (autoAbort === ctrl) autoAbort = null;
      }
    }
  } finally {
    autoBusy = false;
  }
}

// ---------- verktyg: rapport, levererat-lista, öva samtal ----------
// Anställd-vinkeln: synlighet uppåt. Båda rapporterna bygger på portalens
// egen logg (tidsstämplar, rutiner, minne) och sätter [fyll i]-luckor där
// data saknas i stället för att fabricera resultat.
function statusReport() {
  if (state.streaming) return;
  const since = Date.now() - 7 * 86400000;
  const perAgent = [];
  team.agents.forEach((a) => {
    const n = (state.history[a.id] || []).filter((m) => m.at && m.at >= since && m.role === "assistant").length;
    if (n) perAgent.push(`- ${a.name}: ${n} leveranser`);
  });
  const doneR = routLoad().done.map((d) => d.label || d);
  selectAgent(team.entryAgent);
  submitMessage(`Skriv en kort statusuppdatering till min chef, redo att klistras in i mejl eller Slack. Jag-form, professionell men avslappnad, svenska.\n\nDATA UR VECKANS ARBETE I PORTALEN:\n${perAgent.join("\n") || "- (ingen loggad aktivitet den här veckan)"}${doneR.length ? `\nAvklarade rutiner: ${doneR.join(", ")}` : ""}\n\nStruktur: **Levererat**, **Pågående**, **Behöver input på**. Utgå från datan och det du känner till ur våra samtal — sätt [fyll i]-luckor där du saknar detaljer i stället för att hitta på.`, "📣 Rapport till chefen — ur veckans logg");
}
function deliveredList() {
  if (state.streaming) return;
  const perAgent = [];
  let total = 0, firstAt = null;
  team.agents.forEach((a) => {
    const ms = (state.history[a.id] || []).filter((m) => m.at && m.role === "assistant");
    if (ms.length) {
      perAgent.push(`- ${a.name}: ${ms.length} leveranser`);
      total += ms.length;
      if (!firstAt || ms[0].at < firstAt) firstAt = ms[0].at;
    }
  });
  const facts = memoryFactCount();
  selectAgent(team.entryAgent);
  submitMessage(`Hjälp mig bygga underlaget "Det här har jag levererat" inför ett löne-/medarbetarsamtal eller en kundavstämning. Svenska, jag-form, konkret och självsäkert utan överdrifter.\n\nDATA UR PORTALENS LOGG${firstAt ? ` (sedan ${new Date(firstAt).toLocaleDateString("sv-SE")})` : ""}:\n${perAgent.join("\n") || "- (ingen loggad aktivitet än)"}\nTotalt: ${total} leveranser.${facts ? ` Uppbyggt kunskapsminne: ${facts} rader.` : ""}\n\nGör: 1) en punktlista över leveransområden med [fyll i]-luckor för konkreta resultat och siffror jag själv fyller i, 2) tre formuleringar som knyter arbetet till verksamhetsnytta, 3) en avslutande rad om utveckling framåt. Hitta inte på specifika resultat.`, "🏅 Det här har jag levererat — underlag inför samtalet");
}

const PRACTICE_SCENARIOS = [
  "Kund som inte betalat", "Prishöjning till befintlig kund", "Reklamation / missnöjd kund",
  "Säga nej till ett uppdrag", "Be om löneförhöjning", "Svårt besked till en medarbetare",
];
function openPractice() {
  if (state.streaming) return;
  const box = openOverlay("🎭 Öva ett samtal");
  box.appendChild(el("p", "ovl-lead", "Agenten spelar motparten — realistiskt, med invändningar. Du övar i chatten och skriver STOPP när du vill kliva ur: då får du ärlig feedback och ett färdigt samtalsmanus."));
  let chosen = PRACTICE_SCENARIOS[0];
  const chipsRow = el("div", "p-chips");
  PRACTICE_SCENARIOS.forEach((s, i) => {
    const b = el("button", "p-chip" + (i === 0 ? " sel" : "")); b.type = "button"; b.textContent = s;
    b.onclick = () => { chosen = s; chipsRow.querySelectorAll(".p-chip").forEach((n) => n.classList.toggle("sel", n === b)); };
    chipsRow.appendChild(b);
  });
  box.appendChild(chipsRow);
  box.appendChild(el("div", "ovl-label", "Detaljer — vem är motparten, vad står på spel?"));
  const det = el("textarea", "ovl-ta"); det.rows = 2;
  det.placeholder = "T.ex: Byggfirma, fakturan är 45 dagar försenad, kunden är vår största.";
  box.appendChild(det);
  const go = el("button", "btn-primary ovl-save", "Starta rollspelet"); go.type = "button";
  go.onclick = () => {
    closeOverlay();
    selectAgent(team.entryAgent);
    submitMessage(`ROLLSPEL — jag vill öva ett svårt samtal: "${chosen}".${det.value.trim() ? `\nKontext: ${det.value.trim()}` : ""}\n\nSpela motparten realistiskt: naturliga invändningar, känslor, inga lättköpta eftergifter. Börja med motpartens första replik. Håll dig i rollen tills jag skriver STOPP — kliv då ur rollen och ge mig: 1) ärlig feedback på hur jag förde samtalet, 2) vad jag borde ha sagt annorlunda, 3) ett färdigt samtalsmanus jag kan använda på riktigt.`, `🎭 Öva ett samtal: ${chosen}`);
  };
  box.appendChild(go);
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
    if (state.demo) { errEl.textContent = "Demoläget kan inte generera nya agenter — svaren här är förskrivna."; errEl.style.display = "block"; return; }
    errEl.style.display = "none";
    stopAutoRoutines(); // ett betalt anrop i taget
    go.disabled = true; go.textContent = "Formar agenten… (~30 s)";
    preview.innerHTML = "";
    try {
      const existing = team.agents.map((a) => `- ${a.name} (${a.id}): ${a.job || a.tagline || ""}`).join("\n");
      const mem = loadMemory().trim().slice(0, 1500);
      const raw = await window.ATBClaude.collect({
        apiKey: state.apiKey, model: state.model, system: GROW_RULES,
        messages: [{ role: "user", content: `FÖRETAG: ${team.company} — ${team.tagline || ""}\n\nBEFINTLIGA AGENTER:\n${existing}\n\nKUNDENS BEHOV:\n${need}${mem ? `\n\nUR FÖRETAGSMINNET:\n${mem}` : ""}` }],
        maxTokens: 4096,
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
  const ext = loadTeamExt();
  if (Array.isArray(ext.agents) && ext.agents.length) {
    box.appendChild(el("div", "ovl-label", "Tillagda efter bygget"));
    ext.agents.forEach((a) => {
      const row = el("div", "doc-row");
      row.appendChild(el("span", "doc-title", `${a.icon || "•"} ${a.name}`));
      const del = el("button", "doc-del", "✕"); del.type = "button"; del.title = "Ta bort tillägget (historiken för agenten rensas inte)";
      del.onclick = () => {
        if (!confirm(`Ta bort ${a.name} ur teamet?`)) return;
        const cur = loadTeamExt();
        cur.agents = (cur.agents || []).filter((x) => x.id !== a.id);
        cur.routines = (cur.routines || []).filter((r) => r.agentId !== a.id);
        saveTeamExt(cur); // även till mappen — annars kommer agenten tillbaka där
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
  box.appendChild(el("p", "ovl-note", folderActive()
    ? `Tillägg sparas i den här webbläsaren OCH i mappen "${state.folder.name}" (team-tillagg.json) — de överlever alltså en rensad webbläsare och följer med till en annan dator. För en full omprövning av hela teamet: kör en ny Builder-körning.`
    : "Tillägg sparas lokalt i den här webbläsaren (och följer med i delningslänkar/teamfiler du skapar härifrån). Koppla en mapp under Minne & underlag om de ska överleva en rensad webbläsare. För en full omprövning av hela teamet: kör en ny Builder-körning."));
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
    const cur = loadTeamExt();
    cur.agents = (cur.agents || []).concat([a]);
    if (routine) cur.routines = (cur.routines || []).concat([routine]);
    if (!saveTeamExt(cur)) { alert("Kunde inte spara tillägget (lagringen är full)."); return; }
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
  // Var ärlig om vad länken faktiskt ger. Den bär hela teamet i sitt fragment
  // och når aldrig servern — men mottagaren kan LÄSA teamet, inte chatta med
  // det: portalsvar kräver inloggning och ett köpt team. Texten lovade förut
  // "mottagaren använder sin egen nyckel", vilket är dubbelt fel sedan
  // 2026-08-06: det finns inga kundnycklar, och länken öppnar en låst vy.
  // Ska en kollega kunna arbeta i teamet är det platser som gäller, inte en
  // länk (functions/api/team/invite.js — utan gränssnitt än, se ROADMAP P5).
  box.appendChild(el("p", "ovl-lead", "Teamet kan flyttas som en länk eller en fil — ingen server inblandad, allt ligger i länken själv. Mottagaren kan då LÄSA teamet: rollerna, uppdragen och hur det är uppbyggt. För att chatta med teamet krävs inloggning och ett eget köp — vill du ge en kollega tillgång till just det här teamet, mejla info@mittaiteam.se så lägger vi till platsen. Chatthistorik, minne och underlag följer aldrig med en delning — dem hämtar du med \"Ladda ner allt\" längst ner i arbetsytan."));
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
    downloadFile(fileSlug(team.company) + "-ai-team.json", JSON.stringify(team, null, 2), "application/json");
  };
  box.appendChild(fileBtn);
  box.appendChild(el("p", "ovl-note", "Filen öppnas via kundväljarens \"Öppna en teamfil\" på vilken dator som helst — bra som backup och för flytt mellan datorer. Länken bär hela teamet i själva adressen (efter #) och skickas aldrig till någon server."));
}

// ============================================================
// VÄGEN UT — provmånad, "Ladda ner allt" och uppsägning
//
// Villkoren lovar tre saker som portalen inte höll: att provmånaden inte
// förnyas i smyg, att all data går att få ut, och att uppsägning är ett mejl
// bort. Ingen av dem fanns som en knapp någonstans, och ett löfte som bara
// står i juridiken är inget löfte alls.
//
// En enkel väg ut är ett säljargument, inte en förlust: den som vet att hen
// kan gå när som helst vågar börja. Därför står allt tre öppet i arbetsytan
// i stället för att gömmas bakom ett mejl till supporten.
// ============================================================

// ---------- ladda ner allt ----------
// Nerladdning per svar fanns redan, men för en kund med ett halvårs samtal är
// "klicka på varje svar" i praktiken ett nej. En fil, ett klick, läsbar i
// vilken textredigerare som helst — och markdown eftersom det är formatet
// agenterna redan svarar i.
function exportEverything() {
  const now = new Date();
  const out = [];
  out.push(`# Allt från ${team.company}s AI-team`);
  out.push("");
  out.push(`Uttag ur portalen ${now.toLocaleString("sv-SE")}. Team: \`${state.slug}\`.`);
  out.push("");
  out.push("Filen innehåller företagsminnet, alla underlag och hela den chatthistorik som ligger sparad i den här webbläsaren. Själva teamkonfigurationen laddas ner separat under \"Dela / exportera team\".");
  out.push("");

  out.push("## Teamet");
  out.push("");
  team.agents.forEach((a) => out.push(`- **${a.name}** — ${a.tagline || a.role || ""}`.replace(/\s+—\s*$/, "")));
  out.push("");

  const mem = loadMemory().trim();
  out.push("## Företagsminne");
  out.push("");
  out.push(mem || "_(tomt)_");
  out.push("");

  const docs = loadDocs();
  out.push(`## Underlag (${docs.length})`);
  out.push("");
  if (!docs.length) out.push("_(inga underlag inlagda)_");
  docs.forEach((d, i) => {
    // På/av-läget följer med: ett avstängt underlag är fortfarande kundens
    // material, men den som läser filen ska veta att agenterna inte såg det.
    out.push(`### ${i + 1}. ${d.title || "Namnlöst underlag"}${d.on === false ? " (avstängt)" : ""}${d.file ? " · fil i den kopplade mappen" : ""}`);
    out.push("");
    out.push(d.text || "");
    out.push("");
  });

  out.push("## Samtal");
  out.push("");
  let anyMsg = false;
  team.agents.forEach((a) => {
    const msgs = state.history[a.id] || [];
    if (!msgs.length) return;
    anyMsg = true;
    out.push(`### ${a.name} (${msgs.length} meddelanden)`);
    out.push("");
    msgs.forEach((m) => {
      const who = m.role === "user" ? "Du" : a.name;
      out.push(`**${who}**${m.at ? " · " + new Date(m.at).toLocaleString("sv-SE") : ""}`);
      out.push("");
      out.push(m.content || "");
      out.push("");
    });
  });
  if (!anyMsg) out.push("_(inga sparade samtal)_");
  out.push("");
  out.push("---");
  out.push("");
  // Taket per agent är osynligt tills man saknar något. Säg var resten finns
  // i stället för att låta filen se komplett ut när den inte är det.
  out.push("Historiken har ett tak på 60 meddelanden per agent. Äldre svar finns kvar i `arkiv/` i den mapp på datorn som är kopplad till teamet — har ingen mapp kopplats är de borta.");
  return out.join("\n");
}

function downloadEverything(btn) {
  try {
    downloadFile(`${state.slug || "team"}-allt-${isoDay()}.md`, exportEverything());
    if (btn) { const t = btn.textContent; btn.textContent = "Nerladdat ✓"; setTimeout(() => (btn.textContent = t), 2000); }
  } catch (e) {
    // Inte storeWarn(): dess banner talar om att något inte kunde SPARAS, och
    // en misslyckad nerladdning har inte rört kundens data.
    console.warn("[Mitt AI-team] kunde inte bygga uttaget:", e);
    if (btn) { const t = btn.textContent; btn.textContent = "Gick inte att ladda ner"; setTimeout(() => (btn.textContent = t), 2400); }
  }
}

// ---------- uppsägning ----------
//
// Säljsidan lovar "uppsägningsbart när som helst". Fram till 2026-08-07 öppnade
// knappen ett förifyllt mejl till supporten — vilket är "när vi läser mejlen",
// inte "när som helst". För en kund som bestämt sig är väntan på svar precis
// det som gör en avslutad affär till ett dåligt minne, och det är i det läget
// hon berättar för andra hur det gick.
//
// Nu går uppsägningen genom /api/subscription/cancel, som sätter
// cancel_at_period_end hos Stripe. Åtkomsten upphör alltså inte i dag utan när
// den betalda perioden är slut — då skickar Stripe customer.subscription.deleted
// och webhooken sätter plan = 'cancelled'.
//
// Mejlvägen finns kvar som reserv i rutan: går anropet inte igenom ska kunden
// inte lämnas utan väg ut.
function quitMailto() {
  const company = (team && team.company) || "vårt företag";
  const subject = `Uppsägning — ${company} (${state.slug})`;
  const body =
    `Hej!\n\nJag vill säga upp vårt AI-team.\n\n` +
    `Företag: ${company}\nTeam: ${state.slug}\n\n` +
    `Vad som fick mig att sluta (frivilligt, men det hjälper oss):\n\n\n` +
    `Vänliga hälsningar,\n`;
  return "mailto:info@mittaiteam.se?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

function openCancel() {
  const box = openOverlay("Säg upp teamet");
  box.appendChild(el("p", "ovl-lead",
    "Uppsägningen gäller från utgången av innevarande betalperiod — ni betalar inte för tid ni inte använder, "
    + "och ni behåller teamet perioden ut."));
  box.appendChild(el("p", "ovl-note",
    "Det ni har lagt in ligger i den här webbläsaren och i mappen ni kopplat, inte hos oss. Det påverkas inte av "
    + "uppsägningen. Ladda gärna ner allt först — knappen finns i sidfoten."));

  const status = el("p", "ovl-note");
  const btn = el("button", "btn-primary ovl-save", "Ja, säg upp abonnemanget");
  btn.type = "button";
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Säger upp …";
    try {
      const res = await window.ATBClaude.fetchWithTimeout("/api/subscription/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ team: state.slug }),
      }, 15000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Uppsägningen gick inte igenom.");

      btn.remove();
      if (data.state === "nothing_to_cancel") {
        status.textContent = data.message;
      } else {
        const slut = data.endsAt ? new Date(data.endsAt).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }) : null;
        status.textContent = slut
          ? `Klart. Abonnemanget avslutas ${slut} och förnyas inte. Fram till dess fungerar teamet som vanligt.`
          : "Klart. Abonnemanget avslutas vid periodens slut och förnyas inte.";
      }
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Ja, säg upp abonnemanget";
      status.textContent = (e && e.message) || "Något gick fel.";
      // Reserven, inte som förstahandsval: en kund som klickat "säg upp" ska
      // aldrig lämnas kvar i tjänsten bara för att ett anrop misslyckades.
      const mail = el("a", "link-btn", "Säg upp via mejl i stället");
      mail.href = quitMailto();
      box.appendChild(mail);
    }
  };
  box.appendChild(btn);
  box.appendChild(status);
}

// ---------- provmånaden går mot sitt slut ----------
// Villkoren: provmånaden löper en månad från beställningen och övergår inte
// automatiskt i något annat. Att kunden ska slippa bli överraskad gäller åt
// BÅDA hållen — ingen oväntad dragning, men heller ingen dag då teamet tyst
// slutar fungera utan att någon sagt till i förväg.
const TRIAL_LENGTH_DAYS = 30; // "en månad från beställningen", villkor.html §4
const TRIAL_NOTICE_DAYS = 25; // fem dagars framförhållning — tid att hinna välja
const TRIAL_SNOOZE_PREFIX = "atb_trial_snooze_"; // + slug → ISO-datum kortet göms

// Tidsstämplar kommer från en annan tjänst än den som läser dem, och format
// är det som brukar glida isär. Ta emot millisekunder, sekunder och ISO-sträng;
// allt annat ger 0, vilket betyder "vet inte" och därmed inget kort.
function msFromStamp(v) {
  if (typeof v === "number" && isFinite(v) && v > 0) return v < 1e11 ? v * 1000 : v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (isFinite(n) && n > 0) return n < 1e11 ? n * 1000 : n;
    const p = Date.parse(v);
    if (!isNaN(p)) return p;
  }
  return 0;
}

// /api/auth/me svarar { email, teams: [{ slug, company, role, plan?, createdAt? }] }.
// plan och createdAt är NYA fält. En portal som körs mot en äldre backend, mot
// ett team utan konto, eller mot ett svar där fälten heter något annat ska bete
// sig exakt som förut — därför returnerar varje avvikelse null i stället för
// att gissa ett slutdatum. Ett felgissat "provmånaden tar slut imorgon" är
// värre än inget kort alls.
function trialNoticeFor(me, slug) {
  if (!me || typeof me !== "object" || !Array.isArray(me.teams)) return null;
  const t = me.teams.find((x) => x && x.slug === slug);
  // "trial-byo" är det gamla namnet och ligger kvar på team som köptes före
  // 2026-08-06. Att glömma det hade tystat påminnelsen för just de kunderna.
  if (!t || (t.plan !== "trial" && t.plan !== "trial-byo")) return null;
  const started = msFromStamp(t.createdAt);
  if (!started) return null;
  const daysIn = Math.floor((Date.now() - started) / 86400000);
  if (daysIn < TRIAL_NOTICE_DAYS) return null;
  const endsAt = started + TRIAL_LENGTH_DAYS * 86400000;
  return { endsAt, daysLeft: Math.ceil((endsAt - Date.now()) / 86400000) };
}

// Ett anrop per sidladdning, delat med boot(): renderPortal() körs om varje
// gång teamet ändras ("Utveckla teamet"), och kontot ändrar sig inte däremellan.
let mePromise = null;
function meOnce() {
  if (!mePromise) mePromise = authMe().catch(() => null);
  return mePromise;
}

async function checkTrialNotice() {
  // Demo, utkast och branschdemo har ingen beställning bakom sig — och en
  // delad länk tillhör inte den som öppnar den.
  if (state.demo || !state.slug || state.slug.startsWith("__")) return;
  const today = isoDay();
  try { if (localStorage.getItem(TRIAL_SNOOZE_PREFIX + state.slug) === today) return; } catch (_) { /* läsfel — visa ändå */ }
  const info = trialNoticeFor(await meOnce(), state.slug);
  if (info) renderTrialCard(info, today);
}

function renderTrialCard(info, today) {
  const ws = document.querySelector(".ws");
  if (!ws || $("#trial-card")) return;
  const ends = new Date(info.endsAt).toLocaleDateString("sv-SE", { day: "numeric", month: "long" });

  const card = el("div", "trial-card"); card.id = "trial-card";
  const head = el("div", "intro-head");
  head.appendChild(el("span", "side-label", info.daysLeft > 0
    ? `Provmånaden · ${info.daysLeft} ${info.daysLeft === 1 ? "dag" : "dagar"} kvar`
    : "Provmånaden är slut"));
  const x = el("button", "intro-x", "✕"); x.type = "button"; x.title = "Dölj för idag";
  x.onclick = () => {
    try { localStorage.setItem(TRIAL_SNOOZE_PREFIX + state.slug, today); } catch (_) { /* full storage */ }
    card.remove();
  };
  head.appendChild(x);
  card.appendChild(head);

  card.appendChild(el("p", "trial-line", info.daysLeft > 0
    ? `Provmånaden för ${team.company} tar slut den ${ends}.`
    : `Provmånaden för ${team.company} tog slut den ${ends}.`));
  card.appendChild(el("p", "trial-note",
    "Ingenting dras automatiskt. Provmånaden är ett engångsköp som inte förnyas — vill ni inte fortsätta behöver ni inte göra någonting. "
    + "Samtal, minne och underlag ligger i den här webbläsaren och berörs inte. Fortsätter ni är det samma team som rullar vidare; "
    + "ingenting byggs om."));

  // Knapp, inte länk till prislistan. Kunden har redan bestämt vad teamet är
  // värt — att skicka henne till en säljsida för att läsa om det igen är ett
  // extra steg på precis det ställe där de flesta faller ifrån.
  const cont = el("button", "trial-act", "Fortsätt löpande — 290 kr/mån →");
  cont.type = "button";
  cont.onclick = async () => {
    cont.disabled = true;
    const orig = cont.textContent;
    cont.textContent = "Öppnar betalningen …";
    try {
      const res = await window.ATBClaude.fetchWithTimeout("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tier: "standard", slug: state.slug }),
      }, 15000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Kunde inte öppna betalningen.");
      location.href = data.url;
    } catch (e) {
      cont.disabled = false;
      cont.textContent = orig;
      card.appendChild(el("p", "trial-note", (e && e.message) || "Något gick fel — mejla info@mittaiteam.se så löser vi det."));
    }
  };
  card.appendChild(cont);

  const dl = el("button", "trial-act", "Ladda ner allt ni lagt in"); dl.type = "button";
  dl.onclick = () => downloadEverything(dl);
  card.appendChild(dl);

  ws.insertBefore(card, ws.firstChild);
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
  dl.onclick = () => downloadFile(`${state.slug || "team"}-${isoDay()}.md`, getText());
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
// Kodblock (```) var det enda som saknades — och det är arbetsledarlägets
// HELA leverans: den färdiga prompten kunden ska klistra in i sin egen AI
// levereras i ett kodblock. Utan stöd här renderades den som brödtext, med
// staketen kvar och radbrytningarna borta. Egen CSS får inte läggas till
// härifrån (portal.css ägs av någon annan), så stilen sätts inline på samma
// tokens som .md-code redan använder.
const PRE_CSS = 'font-family:ui-monospace,"Cascadia Code",Consolas,monospace;font-size:12.5px;' +
  "line-height:1.5;white-space:pre-wrap;word-break:break-word;background:var(--surface-3);" +
  "border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin:0;overflow-x:auto";
function appendCodeBlock(container, code, lang) {
  const wrap = el("div", "md-pre-wrap");
  wrap.style.cssText = "margin:7px 0";
  const pre = el("pre", "md-pre", code);
  pre.style.cssText = PRE_CSS;
  wrap.appendChild(pre);
  // Kopieringsknappen är själva poängen: prompten ska vidare till ett annat
  // fönster, och att markera flera hundra rader med musen är inget en kund gör.
  const copy = el("button", "act-btn", lang ? `Kopiera (${lang})` : "Kopiera");
  copy.type = "button";
  copy.style.cssText = "margin-top:5px";
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(code); copy.textContent = "Kopierad ✓"; }
    catch (_) { copy.textContent = "Kunde inte kopiera"; }
    setTimeout(() => { copy.textContent = lang ? `Kopiera (${lang})` : "Kopiera"; }, 1800);
  };
  wrap.appendChild(copy);
  container.appendChild(wrap);
}
function renderMarkdown(container, text) {
  container.textContent = "";
  let list = null, listType = null;
  const endList = () => { list = null; listType = null; };
  // Kodblocksläge: allt mellan ``` och ``` går rått in i ett <pre>. Ett
  // oavslutat staket (svaret strömmar fortfarande, eller modellen glömde
  // stänga) renderas ändå vid slutet — hellre synlig text än tappad text.
  let fence = null, fenceLang = "", fenceLines = null;
  const closeFence = () => {
    if (fence === null) return;
    appendCodeBlock(container, fenceLines.join("\n"), fenceLang);
    fence = null; fenceLang = ""; fenceLines = null;
  };
  for (const raw of (text || "").split("\n")) {
    const fenceMark = /^\s*(```|~~~)\s*([A-Za-z0-9+#._-]*)\s*$/.exec(raw);
    if (fence !== null) {
      if (fenceMark && fenceMark[1] === fence) { closeFence(); continue; }
      fenceLines.push(raw);
      continue;
    }
    if (fenceMark) {
      endList();
      fence = fenceMark[1]; fenceLang = fenceMark[2] || ""; fenceLines = [];
      continue;
    }
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
  closeFence(); // oavslutat staket — visa innehållet ändå
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
  submitMessage(text, `⭐ Veckostart — ${days[now.getDay()]} ${now.toLocaleDateString("sv-SE")}`);
}

// ---------- overlay ----------
// Escape stänger. Rutan gick tidigare bara att lämna med ✕ eller ett klick på
// bakgrunden — Escape är den genväg alla utom nybörjaren provar först, och en
// modal som inte svarar på den känns låst. Lyssnaren sitter på document och
// plockas bort i closeOverlay, så den kan inte ligga kvar och stänga något
// annat senare.
let ovlEsc = null;
// Enskilda rutor kan registrera städning som ska ske oavsett HUR de lämnas
// (✕, bakgrundsklick, Escape eller att en annan ruta öppnas ovanpå).
// Introduktionen använder den för att måla om arbetsytan — se openIntro.
let ovlOnClose = null;
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
  ovlEsc = (e) => { if (e.key === "Escape") closeOverlay(); };
  document.addEventListener("keydown", ovlEsc);
  return box;
}
function closeOverlay() {
  if (ovlEsc) { document.removeEventListener("keydown", ovlEsc); ovlEsc = null; }
  const o = $("#ovl"); if (o) o.remove();
  const fn = ovlOnClose; ovlOnClose = null;
  if (fn) { try { fn(); } catch (_) { /* städning får aldrig hindra stängning */ } }
}

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
      if ((d.text || "").length < 4000 || state.demo) return null;
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
    stopAutoRoutines(); // ett betalt anrop i taget
    const out = await window.ATBClaude.collect({
      apiKey: state.apiKey, model: state.model,
      system: "Komprimera underlaget till ett destillat på högst 2500 tecken som bevarar alla fakta, siffror, namn, priser, datum och beslut. Punktform, svenska, ingen inledning eller avslutning.",
      messages: [{ role: "user", content: (d.text || "").slice(0, 60000) }],
      maxTokens: 1200,
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
  const fileBtn = el("button", "btn-primary ovl-save", "📎 Lägg till fil (PDF, Word, Excel/CSV, .md, .txt)…"); fileBtn.type = "button";
  fileBtn.onclick = () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".pdf,.docx,.doc,.md,.txt,.xlsx,.xls,.csv"; inp.multiple = true;
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
      fileBtn.disabled = false; fileBtn.textContent = "📎 Lägg till fil (PDF, Word, Excel/CSV, .md, .txt)…";
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

  // ---- Svenska företagsdatum (matar årshjulets puls-kort) ----
  if (!state.demo && Array.isArray(window.ATB_DEADLINES_SE)) {
    box.appendChild(el("div", "ovl-label", "🏛 Svenska företagsdatum i årshjulet"));
    const dlSel = el("select", "ovl-input");
    [["off", "Visa inte"], ["enskild", "Enskild firma"], ["enskild-anstallda", "Enskild firma med anställda"], ["ab", "Aktiebolag"], ["ab-anstallda", "Aktiebolag med anställda"]]
      .forEach(([v, l]) => { const o = el("option", null, l); o.value = v; dlSel.appendChild(o); });
    try { dlSel.value = localStorage.getItem("atb_dlform_" + state.slug) || "off"; } catch (_) { /* läsfel */ }
    dlSel.onchange = () => {
      try { localStorage.setItem("atb_dlform_" + state.slug, dlSel.value); } catch (_) { /* full storage */ }
      renderPulse();
    };
    box.appendChild(dlSel);
    box.appendChild(el("p", "ovl-note", "Påminner i förväg om moms, deklaration och AGI via korten ovanför chatten. Typiska datum (kalenderår som räkenskapsår, kvartalsmoms) — kontrollera alltid Skatteverket för era exakta datum."));
  }
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
    // pdf.js ≥4 distribueras bara som ES-modul → dynamisk import i stället för
    // <script>. isEvalSupported:false stänger dessutom av pdf.js interna
    // eval-väg, så en preparerad PDF aldrig kan köra egen JS (CVE-2024-4367).
    if (!window.pdfjsLib) window.pdfjsLib = await import(new URL("vendor/pdf.min.mjs", document.baseURI).href);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("vendor/pdf.worker.min.mjs", document.baseURI).href;
    const doc = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
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
  if (ext === "csv") return (await file.text()).slice(0, 120000);
  if (ext === "xlsx" || ext === "xls") {
    // Kalkylark: Fortnox-/bokföringsexporter, Shopify-order, kundlistor —
    // ekonomipulsen. Varje blad blir CSV-text med bladnamnet som rubrik.
    if (!window.XLSX) await loadScript("vendor/xlsx.full.min.js");
    const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const parts = [];
    wb.SheetNames.forEach((name) => {
      const csv = window.XLSX.utils.sheet_to_csv(wb.Sheets[name]).trim();
      if (csv) parts.push(`## Blad: ${name}\n${csv}`);
    });
    const text = parts.join("\n\n").slice(0, 120000);
    if (!text) throw new Error("Kalkylarket verkar vara tomt.");
    return text;
  }
  throw new Error(ext === "doc"
    ? "Gamla .doc-formatet stöds inte — spara om filen som .docx eller PDF."
    : "Filtypen stöds inte. Portalen läser PDF, .docx, .xlsx, .csv, .md och .txt.");
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
    box.appendChild(el("p", "ovl-lead", `Möten körs mot riktiga modellen och finns i det köpta teamet. Så funkar det: du väljer fråga och deltagare, varje agent ger sitt perspektiv utifrån sin roll, och ${entryName} sammanställer till ett beslut med tydligt format.`));
    const c = el("button", "btn-primary ovl-save", "Bygg ditt eget team →"); c.type = "button";
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
  stopAutoRoutines(); // mötet är dyrt nog utan en bakgrundsrutin bredvid
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
          maxTokens: 600, signal,
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
      maxTokens: 2000, signal,
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
    if (bub.isConnected) { renderMarkdown(bub, finalText); addActions(row, () => finalText); row.appendChild(perspToggle(perspectives)); }
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
//
// `display` finns för knapparna i arbetsytan. De skickar en instruktion på
// fem rader ("Ge mig en kort veckostart: 1)… 2)… 3)…"), och den stod ordagrant
// i chatten som om kunden själv skrivit den — som att se maskineriet i stället
// för produkten. Modellen får fortfarande hela instruktionen (den ligger i
// `content` och följer med i historik, kontext och export); det är bara
// bubblan som visar den korta versionen.
async function submitMessage(text, display) {
  if (state.streaming) return;
  // Användaren går före: en auto-rutin i bakgrunden avbryts här, så att det
  // aldrig finns två betalda anrop i luften samtidigt.
  stopAutoRoutines();
  // Färska underlag från mappen inför varje anrop (vi är i en användargest,
  // så ett ev. tillståndsprompt är tillåtet här).
  if (state.folder) { await refreshFolder(state.folder.needsPermission ? { ask: true } : undefined); updateFolderBanner(); }
  const agentId = state.activeAgentId;
  const agent = agentById(agentId);
  // Läses FÖRE meddelandet läggs in: wsCollapsed() svarar på om det fanns
  // historik, och den finns om två rader.
  const wsWasCollapsed = wsCollapsed();
  if (!state.history[agentId]) state.history[agentId] = [];
  // Behåll referensen — vid fel ska EXAKT detta meddelande tas bort, inte
  // det som råkar ligga sist (en auto-rutin kan ha hunnit skriva under tiden).
  const userMsg = { role: "user", content: text, at: Date.now() };
  if (display) userMsg.display = display;
  state.history[agentId].push(userMsg);
  saveHistory();

  const log = $("#chat-log");
  if (state.history[agentId].length === 1) log.innerHTML = "";
  log.appendChild(bubble("user", text, userMsg));

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
    // Första riktiga svaret: fäll ut hela arbetsytan, permanent. Kunden har
    // sett hur portalen fungerar och ska aldrig behöva leta efter en knapp
    // som var där igår — se wsCollapsed().
    if (wsWasCollapsed) { markWsExpanded(); refreshSidebar(); }
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
    if (assistantBubble.isConnected) { renderMarkdown(assistantBubble, finalText); addActions(assistantRow, () => finalText); }
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
// Förskrivna demosvar ur teamkonfigen (agent.demoAnswers). Matchar på
// starter-texten (q) i första hand, nyckelord i andra. Ingen träff → det
// generiska svaret nedan. Team utan demoAnswers beter sig som förut.
function demoAnswerFor(agent, userText) {
  const list = Array.isArray(agent.demoAnswers) ? agent.demoAnswers : [];
  const t = (userText || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!list.length || !t) return null;
  let best = null, bestScore = 0;
  list.forEach((d) => {
    let score = 0;
    const q = (d.q || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (q && (t === q || t.startsWith(q) || q.startsWith(t))) score += 10;
    (d.keywords || []).forEach((k) => { if (k && t.includes(k)) score += 2; });
    if (score > bestScore) { bestScore = score; best = d; }
  });
  return bestScore >= 2 ? best.text : null;
}

// Skapar ett trovärdigt, rollanpassat exempelsvar — utan API-anrop. Tanken är
// att visa hur portalen känns, inte att ersätta riktiga svar.
function demoReply(agent, userText) {
  const hit = demoAnswerFor(agent, userText);
  if (hit) return hit;
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
  // Skala takten efter svarets längd: de förskrivna demosvaren är upp till
  // ~1000 tokens, och 16 ms styck hade gjort ett nyhetsbrevsutkast 16 sekunder
  // långt att titta på. Korta svar behåller sin ursprungliga rytm.
  const delay = Math.max(4, Math.min(16, Math.round(6000 / Math.max(1, tokens.length))));
  for (const tk of tokens) {
    if (state.chatAbort && state.chatAbort.signal.aborted) {
      const e = new Error("Stoppad."); e.name = "AbortError"; throw e;
    }
    await new Promise((r) => setTimeout(r, delay));
    onDelta(tk);
  }
}

// Anropar Claude Messages API direkt från webbläsaren och strömmar svaret.
// Själva strömningen + felhanteringen ligger i den delade klienten.
async function streamClaude(system, messages, onDelta, onUsage) {
  await window.ATBClaude.stream({
    apiKey: state.apiKey,
    model: state.model,
    system,
    messages: contextFor(messages), // rullande fönster + destillat, inte hela historiken
    maxTokens: 4096,
    onDelta,
    onUsage,
    signal: state.chatAbort ? state.chatAbort.signal : undefined,
  });
}

boot();
