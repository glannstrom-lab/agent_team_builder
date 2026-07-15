/* ============================================================
   Service worker för kundportalen (PWA).
   Network-first: alltid färskt när man är online, faller tillbaka
   till cache offline. API-anrop (POST till Claude) rörs aldrig.
   ============================================================ */

// Bumpa versionen vid varje ändring i SHELL-filerna nedan — annars precachar
// inte service workern om skalet och offline-användare fastnar på gammal kod.
const CACHE = "atb-portal-v2";
const SHELL = ["./", "./index.html", "./app.js", "./portal.css", "./teams/index.js", "./manifest.webmanifest", "./icon.svg"];

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
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
  );
});
