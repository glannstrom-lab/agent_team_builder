// Statisk server för repo-roten, utan beroenden.
//
//   node .claude/skills/portal-med-ogon/server.mjs [port]
//
// `npm run dev` gör samma sak via `npx http-server`, men npx kan behöva hämta
// paketet — och en genomgång som kräver nät för att starta blir en genomgång
// som inte körs. Den här räcker för allt utom /api/*; för det krävs
// `npm run dev:cf` (wrangler), och då pekar genomgången på den i stället.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PORT = Number(process.argv[2]) || 8420;

const TYPER = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".ico": "image/x-icon",
};

export function starta(port = PORT) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      // normalize + strip ".." innan join: annars är servern en filläsare för
      // hela disken, och den ligger i ett repo med .dev.vars i roten.
      let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
      let filväg = join(ROT, p);
      let s = await stat(filväg).catch(() => null);
      if (s && s.isDirectory()) { filväg = join(filväg, "index.html"); s = await stat(filväg).catch(() => null); }
      if (!s) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("404"); }
      const buf = await readFile(filväg);
      res.writeHead(200, { "content-type": TYPER[extname(filväg)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(buf);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("500 " + e.message);
    }
  });
  return new Promise((klar) => server.listen(port, () => klar(server)));
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  starta(PORT).then(() => console.log(`Serverar ${ROT} på http://localhost:${PORT}/`));
}
