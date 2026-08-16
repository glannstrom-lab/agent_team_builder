/* ============================================================
   Service worker för kundportalen (PWA).
   Network-first: alltid färskt när man är online, faller tillbaka
   till cache offline. API-anrop (POST till Claude) rörs aldrig.
   ============================================================ */

// Bumpen är INTE längre ett minneskrav (2026-08-16). build-dist.mjs lägger på
// en hash av hela SHELL vid bygget — namnet nedan blir t.ex.
// "atb-portal-v28-ff211dc2" i dist/, och hashen ändras så fort någon
// SHELL-fil ändras. Ändras cachenamnet slänger activate den gamla cachen och
// install hämtar om skalet, utan att någon behövt komma ihåg något.
//
// Samma bygge versionsstämplar SHELL-posterna (./app.js?v=…) med exakt de
// URL:er sidorna begär, så att precache och körning inte hamnar på varsin
// post. Det är därför mönstren nedan inte får skrivas om utan att
// build-dist.mjs följer med — bygget avbryter hellre än gissar.
//
// Talet nedan är kvar som läsbar generation för människor, och det är det som
// gäller vid lokal körning (python -m http.server serverar källan, inte dist/).
const CACHE = "atb-portal-v28";
// De delade rot-skripten (avatars/atb-claude) MÅSTE precachas — utan dem
// kraschar en offline-öppnad PWA med "ATBClaude is undefined".
// Typsnitten är självhostade sedan 2026-08-05 — utan dem i skalet renderar en
// offline-öppnad PWA fallback-sans tills runtime-cachen hunnit hämta dem.
const SHELL = ["./", "./index.html", "./app.js", "./portal.css", "./teams/index.js", "./manifest.webmanifest", "./icon.svg", "../avatars.js", "../atb-claude.js", "../fonts/fonts.css", "../fonts/archivo-var-latin.woff2", "../fonts/karla-var-latin.woff2", "../fonts/ibm-plex-mono-400-latin.woff2", "../fonts/ibm-plex-mono-500-latin.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // släpp igenom POST (Claude-anropen) orört
  // /api/-svar (moln-team, capability-URL) får aldrig hamna i CacheStorage —
  // servern säger no-store men Cache API respekterar inte det på egen hand.
  const isApi = new URL(req.url).pathname.startsWith("/api/");
  if (isApi) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // Bara lyckade svar får cachas. Utan den här kontrollen hamnade även
        // 404/500 permanent i CacheStorage och serverades sedan som "sanning".
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      // HTML-fallbacken gäller bara sidnavigeringar — annars kan en offline-
      // hämtning av .js/.png/JSON få index.html som svar och ge kryptiska fel.
      .catch(() => caches.match(req).then((m) => m || (req.mode === "navigate" ? caches.match("./index.html") : Promise.reject(new Error("offline")))))
  );
});
