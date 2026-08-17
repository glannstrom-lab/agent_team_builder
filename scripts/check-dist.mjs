// Kontrollerar att versionsstämplingen i dist/ håller.
//
// Körs av CI efter `npm run build`, och går att köra för hand:
//   node scripts/check-dist.mjs
//
// Varför den finns: `?v=<hash>` på tillgångarna är det enda som får en deploy
// att nå en återvändande besökare (Cloudflare Pages skriver över Cache-Control
// — se kommentaren i _headers). Går stämplingen sönder märks det inte i
// webbläsaren förrän någon får en 404 på en CSS-fil, eller kör gammal kod utan
// att veta om det. Tre saker kontrolleras:
//
//   1. Varje stämplad URL pekar på en fil som faktiskt finns i dist/.
//   2. Hashen i URL:en stämmer med filens innehåll — annars är stämpeln
//      inaktuell och cachen bryts inte när filen ändras.
//   3. Inga lokala js/css-referenser i HTML är ostämplade, alltså glömda.
//
// Dessutom: service workerns SHELL måste begära EXAKT samma URL:er som
// sidorna. Gör den inte det precachas en variant och körs en annan, och den
// offline-öppnade PWA:n hittar ingen av dem.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

if (!existsSync("dist")) {
  console.error("✖  dist/ saknas — kör `npm run build` först.");
  process.exit(1);
}

function allaFiler(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? allaFiler(p) : [p];
  });
}

const filer = allaFiler("dist");
const fel = [];
let kontrollerade = 0;

// Absolut URL (som webbläsaren skulle lösa den) för en referens i en fil.
// Det är den formen service workerns cache nycklas på — därför jämförs SHELL
// och sidorna på den, inte på strängarna som står skrivna.
const absolut = (frånFil, url) => "/" + resolve(dirname(frånFil), url.split("#")[0])
  .replace(/\\/g, "/").split("/dist/")[1];

const stämplad = /["'`]([^"'`\s]+\.(?:js|css))\?v=([0-9a-f]{8})["'`]/g;

for (const fil of filer.filter((f) => f.endsWith(".html") || f.endsWith("sw.js"))) {
  const src = readFileSync(fil, "utf8");
  for (const m of src.matchAll(stämplad)) {
    const [, url, hash] = m;
    const p = url.startsWith("/") ? join("dist", url) : join(dirname(fil), url);
    if (!existsSync(p)) { fel.push(`${fil}: ${url} pekar på en fil som inte finns`); continue; }
    const verklig = createHash("sha1").update(readFileSync(p)).digest("hex").slice(0, 8);
    if (verklig !== hash) fel.push(`${fil}: ${url} har hash ${hash} men innehållet ger ${verklig}`);
    else kontrollerade++;
  }
}

// Ostämplade lokala referenser i HTML — glömda filer kör vidare på fyra
// timmars cache utan att någon märker det.
for (const fil of filer.filter((f) => f.endsWith(".html"))) {
  const src = readFileSync(fil, "utf8");
  for (const m of src.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
    if (/^[a-z]+:|^\/\//i.test(m[1])) continue; // extern
    fel.push(`${fil}: ${m[1]} är inte versionsstämplad`);
  }
}

// SHELL mot sidorna: samma absoluta URL på båda ställena.
const swPath = join("dist", "portal", "sw.js");
if (existsSync(swPath)) {
  const sw = readFileSync(swPath, "utf8");
  const rad = sw.match(/^const SHELL = \[(.*)\];$/m);
  if (!rad) {
    fel.push("portal/sw.js: hittade ingen SHELL-rad — versionsstämplingen kan inte verifieras");
  } else {
    const shell = new Set([...rad[1].matchAll(/"([^"]+)"/g)].map((m) => absolut(swPath, m[1])));
    const sida = join("dist", "portal", "index.html");
    if (existsSync(sida)) {
      const html = readFileSync(sida, "utf8");
      for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)\?v=[0-9a-f]{8})"/g)) {
        const abs = absolut(sida, m[1]);
        // Bara filer som FINNS i skalet ska matcha; portalen laddar även
        // sådant som medvetet står utanför (t.ex. deadlines-se.js).
        const utanFråga = abs.split("?")[0];
        const iShell = [...shell].some((s) => s.split("?")[0] === utanFråga);
        if (iShell && !shell.has(abs)) {
          fel.push(`portal: sidan begär ${abs} men SHELL har en annan version av samma fil`);
        }
      }
    }
  }
  if (!/const CACHE = "[^"]+-[0-9a-f]{8}";/.test(sw)) {
    fel.push("portal/sw.js: cachenamnet saknar innehållshash — bumpen har blivit ett minneskrav igen");
  }
}

// ── Strukturerad data ──────────────────────────────────────────────────────
//
// FAQPage-schemat genereras vid bygget ur de synliga <details>-blocken
// (fyllFaqSchema i build-dist.mjs). Två saker kan ändå gå fel: JSON:en kan bli
// syntaktiskt trasig av ett citattecken i ett svar, och markören kan bli kvar
// tom om FAQ:n bytt form — då publiceras en tom script-tagg, och Google får en
// FAQ-markup utan innehåll. Google straffar dessutom markup som inte matchar
// det besökaren ser, så varje fråga och svar kontrolleras mot sidans text.
const jsonLdFel = [];
const startsida = join("dist", "index.html");
if (existsSync(startsida)) {
  const html = readFileSync(startsida, "utf8");
  if (html.includes("data-faq-schema")) {
    jsonLdFel.push("index.html: FAQ-markören är kvar ofylld — schemat genererades inte");
  }
  const LD = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  const block = [...html.matchAll(LD)].map((m) => m[1].trim()).filter(Boolean);
  // Sök frågorna i sidan UTAN schemablocken. Annars hittar kontrollen texten
  // inne i sitt eget JSON-LD och godkänner sig själv — den första versionen av
  // den här kontrollen gjorde precis det, och upptäcktes bara genom att ett
  // synligt svar ändrades med flit och grinden ändå var grön.
  const synligt = html.replace(LD, "");
  if (!block.length) jsonLdFel.push("index.html: inget JSON-LD alls");
  let frågor = 0;
  for (const [i, b] of block.entries()) {
    let data;
    try {
      data = JSON.parse(b.split("<\\/").join("</"));
    } catch (e) {
      jsonLdFel.push(`index.html: JSON-LD-block ${i + 1} går inte att tolka (${e.message})`);
      continue;
    }
    if (data["@type"] !== "FAQPage") continue;
    for (const q of data.mainEntity || []) {
      frågor++;
      if (!synligt.includes(q.name)) jsonLdFel.push(`FAQ-frågan finns inte som synlig text: "${q.name}"`);
      const bit = (q.acceptedAnswer && q.acceptedAnswer.text || "").slice(0, 40);
      if (bit && !synligt.includes(bit)) jsonLdFel.push(`FAQ-svaret finns inte som synlig text: "${bit}…"`);
    }
  }
  if (!frågor) jsonLdFel.push("index.html: FAQPage saknar frågor");
  if (!jsonLdFel.length) {
    console.log(`✓  JSON-LD tolkar rent, och FAQPage:s ${frågor} frågor och svar finns som synlig text`);
  }
}
fel.push(...jsonLdFel);

if (fel.length) {
  console.error(`\n✖  ${fel.length} problem i dist/:\n`);
  fel.forEach((f) => console.error("   " + f));
  console.error("\n   Stämplingen och JSON-LD-genereringen sätts båda i build-dist.mjs.\n");
  process.exit(1);
}

console.log(`✓  ${kontrollerade} versionsstämplade referenser stämmer med filernas innehåll`);
console.log("✓  inga ostämplade lokala js/css-referenser i HTML");
console.log("✓  service workerns SHELL matchar sidornas URL:er, och cachenamnet är hashat");
