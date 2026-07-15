/* ============================================================
   Service worker för kundportalen (PWA).
   Network-first: alltid färskt när man är online, faller tillbaka
   till cache offline. API-anrop (POST till Claude) rörs aldrig.
   ============================================================ */

// Bumpa versionen vid varje ändring i SHELL-filerna nedan — annars precachar
// inte service workern om skalet och offline-användare fastnar på gammal kod.
const CACHE = "atb-portal-v3";
// De delade rot-skripten (avatars/atb-claude) MÅSTE precachas — utan dem
// kraschar en offline-öppnad PWA med "ATBClaude is undefined".
const SHELL = ["./", "./index.html", "./app.js", "./portal.css", "./teams/index.js", "./manifest.webmanifest", "./icon.svg", "../avatars.js", "../atb-claude.js"];

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
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      // HTML-fallbacken gäller bara sidnavigeringar — annars kan en offline-
      // hämtning av .js/.png/JSON få index.html som svar och ge kryptiska fel.
      .catch(() => caches.match(req).then((m) => m || (req.mode === "navigate" ? caches.match("./index.html") : Promise.reject(new Error("offline")))))
  );
});
