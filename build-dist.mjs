// Samlar webb-delarna i dist/ för Cloudflare Pages.
// Tar med det som behövs publikt: hub, de fyra apparna (builder/site/portal/
// verticals), exakt de prompt-filer Buildern hämtar live, och _headers (CSP).
// OBS: functions/ ska INTE med i dist/ — Cloudflare hämtar Pages Functions
// från repo-roten (cwd vid `wrangler pages deploy`), och att kopiera in dem
// i dist/ publicerar API-källkoden som statiska filer.
// Lämnar templates/, examples/, docs/, migrations/, .claude/, testoutput/ och
// design/ (designskisser) utanför — utelämnandena är avsiktliga, inte glömska.
import { rmSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { createHash } from "node:crypto";

// 404.html: Cloudflare Pages serverar den för omatchade sökvägar OCH sätter rätt
// statuskod. Utan filen faller Pages tillbaka på index.html med status 200, så
// varje felstavad adress blev en till kopia av säljsidan i sökmotorns ögon
// (mjuk 404) — uppmätt 2026-08-17: /helt/pahittad/sida gav 200 och 44 kB
// startsida. Den lurade dessutom en granskning att tro att en fil låg exponerad.
const ITEMS = ["index.html", "404.html", "avatars.js", "atb-claude.js", "builder", "site", "verticals", "portal", "fonts", "og.png", "sitemap.xml", "robots.txt", "_headers"];

// Juridiksidorna publiceras bara när de är ifyllda. Org.nr, momsreg.nr och
// adress är lagkrav (8 § e-handelslagen) och står som [FYLL I] tills Mikael
// fyllt i dem för hand. En halvfärdig villkorssida är värre än ingen alls:
// den ser ut som ett åtagande men saknar den part som ska hållas till det.
// Spärren nedan hoppar över dem — den fäller inte bygget, så en orelaterad
// rättning kan fortfarande deployas.
const LEGAL = ["integritet.html", "villkor.html"];
const legalRedo = LEGAL.filter((f) => !readFileSync(f, "utf8").includes("[FYLL I]"));
const legalBlocked = LEGAL.filter((f) => !legalRedo.includes(f));
ITEMS.push(...legalRedo);

// Hubben länkar till juridiksidorna i sidfoten och i prisnoten. Publiceras de
// inte blir de länkarna 404 — en sajt som visar priser och länkar till villkor
// som inte finns är sämre än en som inte länkar alls. Därför fäller vi bygget
// i just den kombinationen i stället för att varna. Fixen tar fem minuter.
const hub = readFileSync("index.html", "utf8");
const dangling = legalBlocked.filter((f) => hub.includes(`href="${f}"`));
if (dangling.length) {
  console.error(
    "\n  ✖  BYGGET STOPPAT — index.html länkar till " + dangling.join(" och ") +
    ",\n     men sidorna publiceras inte eftersom [FYLL I] står kvar i dem." +
    "\n\n     Gör så här:" +
    "\n       1. Fyll i org.nr, momsreg.nr och adress i villkor.html," +
    "\n          integritet.html och sidfoten i index.html." +
    "\n       2. Avkommentera de två posterna i sitemap.xml." +
    "\n       3. Kör om bygget.\n"
  );
  process.exit(1);
}

// Buildern kör exakt dessa filer verbatim (builder/builder.js). Resten av
// prompts/ — intake, pedagogik, generate, handoff — är konsult-IP och
// publiceras inte på den publika sajten.
const PROMPT_FILES = [
  "prompts/shared/research.md",
  "prompts/shared/scale.md",
  "prompts/shared/proposal.md",
  "prompts/ai-consultant/first-project.md",
];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const item of ITEMS) {
  cpSync(item, `dist/${item}`, { recursive: true });
}
for (const f of PROMPT_FILES) {
  mkdirSync(dirname(`dist/${f}`), { recursive: true });
  cpSync(f, `dist/${f}`);
}
// ── versionsstämpling av tillgångar ───────────────────────────────────────
//
// Uppmätt 2026-08-16: Cloudflare Pages ÄGER `Cache-Control` på statiska
// tillgångar och skriver över den. Sökvägsreglerna i `_headers` träffar (mätt
// med en egen testheader, som kom fram), men just den headern går inte att
// sätta — varje .js och .css levereras med `max-age=14400` oavsett vad filen
// säger. Hela `no-cache`-sektionen i `_headers` hade alltså aldrig gjort
// någonting, och kommentaren där lovade ett skydd som inte fanns.
//
// Följden var att en deploy kunde ta fyra timmar på sig att nå en återvändande
// besökare. Det är samma fyra timmar som gjorde `openrouter is not defined`
// så svårt att lita på: filen var lagad, men webbläsaren körte den gamla.
//
// Fixen är den som fungerar oavsett headers: `?v=<innehållshash>` på varje
// referens. Ändras filen ändras URL:en, och en URL som aldrig setts förut kan
// inte ligga i en cache. Ändras filen inte behålls hashen, så cachen används
// som den ska — det här är inte samma sak som att stänga av caching.
const HASH_EXT = /\.(js|css)$/;
const hashCache = new Map();
function assetHash(distPath) {
  if (!hashCache.has(distPath)) {
    hashCache.set(distPath, createHash("sha1").update(readFileSync(distPath)).digest("hex").slice(0, 8));
  }
  return hashCache.get(distPath);
}

// Löser en referens ur en fil till en sökväg i dist/. Root-absoluta URL:er
// (/fonts/fonts.css) räknas från dist-roten, relativa från filens egen mapp.
function resolveAsset(fromDir, url) {
  const rent = url.split(/[?#]/)[0];
  if (!rent || /^[a-z]+:/i.test(rent) || rent.startsWith("//")) return null; // extern
  if (!HASH_EXT.test(rent)) return null;
  const p = rent.startsWith("/") ? join("dist", rent) : join(fromDir, rent);
  return existsSync(p) && statSync(p).isFile() ? p : null;
}

function stämpla(url, fromDir) {
  if (url.includes("?")) return url; // redan versionerad — rör den inte
  const p = resolveAsset(fromDir, url);
  return p ? url + "?v=" + assetHash(p) : url;
}

function allaFiler(dir) {
  const ut = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) ut.push(...allaFiler(p));
    else ut.push(p);
  }
  return ut;
}

// Branschsidorna skrivs FÖRE filträdet läses in, så att de kommer med i
// versionsstämplingen och kommentarsstrippningen som varje annan HTML-fil.
const branschsidor = renderaBranschsidor();
for (const { v, html } of branschsidor) {
  writeFileSync(
    `dist/verticals/${v.slug}.html`,
    branschHuvud(v) + "\n" + `<div id="root">${html}</div>` + "\n" +
    // Samma tre skript som index.html, i samma ordning. Sidan är fullt läsbar
    // utan dem — det är hela poängen med att rendera i förväg — men app.js
    // hydrerar demo-knappen och reveal-animationerna, och känner igen branschen
    // ur sökvägen (se getV i verticals/app.js).
    `<script src="../avatars.js"></script>\n<script src="verticals.js"></script>\n<script src="app.js"></script>\n` +
    "</body>\n</html>\n",
  );
}
// Sitemapen får branschsidorna skrivna in på markören. En handskriven lista
// hade glömts bort första gången en trettonde bransch lades till, och en
// bransch som inte står i sitemapen är en bransch som inte finns.
{
  const MARKÖR = "<!--BRANSCHSIDOR-->";
  const väg = "dist/sitemap.xml";
  const src = readFileSync(väg, "utf8");
  if (!src.includes(MARKÖR)) {
    console.error(`\n  ✖  BYGGET STOPPAT — ${MARKÖR} saknas i sitemap.xml.` +
      "\n     Utan den hamnar branschsidorna inte i sitemapen, och det syns inte.\n");
    process.exit(1);
  }
  const poster = branschsidor.map(({ v }) =>
    "  <url>\n" +
    `    <loc>https://mittaiteam.se/verticals/${v.slug}</loc>\n` +
    "    <changefreq>monthly</changefreq>\n" +
    "    <priority>0.8</priority>\n" +
    "  </url>",
  ).join("\n");
  writeFileSync(väg, src.replace(MARKÖR, poster.trimStart()));
}
console.log(`branschsidor: ${branschsidor.length} statiska sidor genererade ur verticals.js, och lagda i sitemap.xml`);

const distFiler = allaFiler("dist");
let stämplade = 0;

// HTML-kommentarerna städas bort ur dist/ (BL1). De är arbetsanteckningar
// skrivna till oss själva, och de står i klartext för var och en som väljer
// "visa källkod" på mittaiteam.se: strukna prisnivåer med belopp, vad vi INTE
// kan leverera och varför, vad ett bygge kostar oss i ören, och anteckningar om
// konkurrenter. Källfilerna behåller allt — det är bara den publicerade kopian
// som städas, så ingen läsbarhet går förlorad där den behövs.
//
// Uppmätt före strippning: 21,2 kB av 258 kB HTML.
//
// Säkert med en ren regex just här, och kontrollerat: ingen `<script>` eller
// `<style>` i projektet innehåller `<!--` eller `-->`, så det finns inget
// tillfälle att kapa mitt i kod. Bygget kontrollerar det varje gång i stället
// för att lita på att det förblir sant.
//
// JS-kommentarerna (97 kB) lämnas MED FLIT kvar. Att ta bort dem kräver en
// riktig tokeniserare — en regex bryter på `https://` och på `//` inuti
// strängar och regexliteraler — och en minifierare gör den driftsatta koden
// oläsbar. Det priset är för högt i just det här projektet: felsökningen av
// `openrouter is not defined` byggde på att hämta den skarpa filen och läsa
// den. Konsekvensen att leva med är att klientkoden är offentlig läsning, och
// den regeln gäller ändå: ingenting hemligt får ligga i den.
// ── En riktig sida per bransch (SE1) ──────────────────────────────────────
//
// Tolv branscher låg på EN URL med olika query-parameter (`?v=<slug>`), med
// `<div id="root"></div>` som hela sidans body och samma titel och beskrivning
// för allihop. En sökmotor kan inte indexera det som tolv sidor: det finns
// ingen egen adress att ranka, ingen egen rubrik och inget eget utdrag. Det är
// projektets bästa long-tail-yta — tolv nischer med färdig text och en demo var
// — och den var osynlig.
//
// Sidorna renderas med KLIENTENS EGEN renderSingle(), körd här i Node med ett
// stubbat window/document. Det är hela poängen: ett andra, handskrivet
// HTML-bygge hade blivit ett andra ställe där layouten kan glida, och den
// fällan har projektet redan gått i (PORTAL_RULES mot portal-team.md). Ändras
// branschsidan i app.js följer de statiska sidorna med automatiskt.
//
// Filnamnet är `verticals/<slug>.html`, alltså SAMMA katalognivå som
// index.html. Då gäller varje relativ länk i den renderade HTML:en (../builder/,
// ../portal/, ../site/) oförändrat. `<base href>` hade varit alternativet men
// CSP:n sätter `base-uri 'none'`.
function renderaBranschsidor() {
  const källa = (f) => readFileSync(f, "utf8");
  const rot = { innerHTML: "" };
  const win = {};
  const doc = {
    documentElement: { classList: { add() {} } },
    getElementById: (id) => (id === "root" ? rot : null),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const sandbox = {
    window: win,
    document: doc,
    location: { search: "", pathname: "/verticals/" },
    IntersectionObserver: class { observe() {} unobserve() {} },
    URLSearchParams,
    setTimeout,
  };
  const nycklar = Object.keys(sandbox);
  const värden = nycklar.map((k) => sandbox[k]);
  // Ordningen är sidans egen: avatars → data → app.
  for (const f of ["avatars.js", "verticals/verticals.js"]) {
    new Function(...nycklar, källa(f))(...värden);
  }
  // app.js anropar boot() sist. Med location.search tom renderar den griden,
  // vilket är harmlöst — vi anropar renderSingle själva per bransch efteråt.
  const app = new Function(...nycklar, källa("verticals/app.js") + "\nreturn { renderSingle, VERTS };")(...värden);

  const sidor = [];
  for (const v of app.VERTS) {
    rot.innerHTML = "";
    app.renderSingle(v);
    if (!rot.innerHTML.trim()) {
      console.error(`\n  ✖  BYGGET STOPPAT — renderSingle gav ingen HTML för branschen "${v.slug}".` +
        "\n     Antingen har renderSingle bytt form, eller saknar posten fält.\n");
      process.exit(1);
    }
    sidor.push({ v, html: rot.innerHTML });
  }
  return sidor;
}

// Head:en per bransch — det som gör sidan indexerbar som just den branschen.
function branschHuvud(v) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const url = `https://mittaiteam.se/verticals/${v.slug}`;
  // Titeln sätter branschen först: det är ordet någon sökt på, och det som
  // syns i en smal flik och i sökresultatets rubrik.
  const titel = `AI-team för ${v.name} · Mitt AI-team`;
  // Beskrivningen är branschens egen intro, kortad till det Google visar.
  const beskrivning = String(v.intro || v.tagline).replace(/\s+/g, " ").slice(0, 300);
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<script>document.documentElement.classList.add('js');
if (location.hostname === 'agent-team-builder-2xy.pages.dev') location.replace('https://mittaiteam.se' + location.pathname + location.search + location.hash);</script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(titel)}</title>
<link rel="icon" type="image/svg+xml" href="../portal/icon.svg" />
<meta name="description" content="${esc(beskrivning)}" />
<meta name="theme-color" content="#F1ECE3" />
<link rel="canonical" href="${url}" />
<meta property="og:site_name" content="Mitt AI-team" />
<meta property="og:title" content="${esc(v.tagline || titel)}" />
<meta property="og:description" content="${esc(beskrivning)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:locale" content="sv_SE" />
<meta property="og:image" content="https://mittaiteam.se/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Mitt AI-team: fyra föreslagna agenter i en personalliggare, och en femte som fick nej." />
<meta name="twitter:card" content="summary_large_image" />
<link rel="preload" href="/fonts/karla-var-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/archivo-var-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/fonts/fonts.css" />
<link rel="stylesheet" href="../site/showcase.css" />
<style>
  .cta-row { display: flex; flex-wrap: wrap; gap: 13px; margin-top: 30px; }
</style>
</head>
<body>`;
}

// Markören som byts mot genererat FAQPage-schema. Står i index.html.
const FAQ_MARKÖR = '<script type="application/ld+json" data-faq-schema></script>';

let strippade = 0;
function striptHtml(fil, src) {
  for (const m of src.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    if (m[2].includes("<!--") || m[2].includes("-->")) {
      console.error(`\n  ✖  BYGGET STOPPAT — ${fil} har "<!--" eller "-->" inuti <${m[1]}>.` +
        "\n     Kommentarsstrippningen skulle kapa mitt i kod. Ta bort sekvensen" +
        "\n     ur skriptet, eller gör strippningen medveten om script-taggar.\n");
      process.exit(1);
    }
  }
  return src.replace(/<!--[\s\S]*?-->/g, (m) => { strippade += m.length; return ""; });
}

// ── FAQPage-schema, genererat ur den synliga FAQ:n ─────────────────────────
//
// Google kräver att FAQ-markup matchar det besökaren faktiskt ser. Skrevs
// frågorna och svaren av HAND i ett JSON-LD-block hade de duplicerat 1,5 kB
// prosa i samma fil som originalet — alltså glidit isär vid första
// omformuleringen, och en FAQ-markup som inte stämmer är sämre än ingen.
// Därför läses de ur `<details>`-blocken vid bygget. Källfilen bär bara en tom
// markör, så det finns ingenting att hålla synkroniserat.
let faqAntal = 0;
function fyllFaqSchema(fil, src) {
  if (!src.includes(FAQ_MARKÖR)) return src;
  const par = [];
  for (const m of src.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="fa">([\s\S]*?)<\/div>/g)) {
    const text = (s) => s.replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ").trim();
    par.push({ q: text(m[1]), a: text(m[2]) });
  }
  if (!par.length) {
    console.error(`\n  ✖  BYGGET STOPPAT — ${fil} har FAQ-markören men inga <details>-par att bygga av.` +
      "\n     Antingen togs FAQ:n bort (ta då bort markören) eller ändrade den form.\n");
    process.exit(1);
  }
  faqAntal = par.length;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: par.map(({ q, a }) => ({
      "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  // </script> inuti en JSON-sträng skulle stänga taggen för tidigt.
  const json = JSON.stringify(schema).replace(/<\//g, "<\\/");
  return src.replace(FAQ_MARKÖR, `<script type="application/ld+json">${json}</script>`);
}

for (const fil of distFiler.filter((f) => f.endsWith(".html"))) {
  const dir = dirname(fil);
  const före = readFileSync(fil, "utf8");
  const medFaq = fyllFaqSchema(fil, före);
  const utanKommentarer = striptHtml(fil, medFaq);
  const efter = utanKommentarer.replace(/(\b(?:src|href)=")([^"]+)(")/g, (hel, pre, url, post) => {
    const ny = stämpla(url, dir);
    if (ny !== url) stämplade++;
    return pre + ny + post;
  });
  if (efter !== före) writeFileSync(fil, efter);
}

// Service workern måste stämplas med SAMMA URL:er som sidorna begär, annars
// precachar den ./app.js medan sidan hämtar ./app.js?v=abc123 — två poster,
// och den offline-öppnade PWA:n hittar ingen av dem.
//
// Cachenamnet får en hash av hela SHELL. Det gör CACHE-bumpen automatisk:
// tidigare var den ett minneskrav som stod i tre olika filer som en varning,
// och som ändå glömdes bort. Ändras en SHELL-fil ändras namnet, activate
// slänger den gamla cachen, och install hämtar om skalet. Själva sw.js
// versionsstämplas ALDRIG — webbläsaren revaliderar service worker-skriptet
// utanför HTTP-cachen, och en versionerad URL hade i stället registrerat en ny
// service worker vid varje bygge.
const swPath = join("dist", "portal", "sw.js");
if (existsSync(swPath)) {
  let sw = readFileSync(swPath, "utf8");
  const swDir = dirname(swPath);
  const shellRad = sw.match(/^const SHELL = \[(.*)\];$/m);
  if (!shellRad) {
    console.error("\n  ✖  BYGGET STOPPAT — hittade ingen SHELL-rad i portal/sw.js.\n" +
      "     Versionsstämplingen kan inte hållas i synk med sidorna.\n" +
      "     Skrivs SHELL om måste mönstret i build-dist.mjs följa med.\n");
    process.exit(1);
  }
  const urls = [...shellRad[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const nya = urls.map((u) => stämpla(u, swDir));
  sw = sw.replace(shellRad[0], "const SHELL = [" + nya.map((u) => JSON.stringify(u)).join(", ") + "];");

  const skalHash = createHash("sha1").update(nya.join("|")).digest("hex").slice(0, 8);
  const cacheRad = sw.match(/^const CACHE = "([^"]+)";/m);
  if (!cacheRad) {
    console.error("\n  ✖  BYGGET STOPPAT — hittade ingen CACHE-rad i portal/sw.js.\n");
    process.exit(1);
  }
  sw = sw.replace(cacheRad[0], `const CACHE = "${cacheRad[1]}-${skalHash}";`);
  writeFileSync(swPath, sw);
  console.log(`sw.js: SHELL versionsstämplad, cache = ${cacheRad[1]}-${skalHash}`);
}

console.log(`FAQPage-schema genererat ur ${faqAntal} synliga frågor`);
console.log(`versionsstämplade ${stämplade} tillgångsreferenser i HTML`);
console.log(`strippade ${(strippade / 1024).toFixed(1)} kB HTML-kommentarer (arbetsanteckningar publiceras inte)`);
console.log("dist/ byggd med:", ITEMS.join(", "), "+ " + PROMPT_FILES.length + " prompt-filer");
if (legalBlocked.length) {
  console.warn(
    "\n  ⚠  EJ PUBLICERADE: " + legalBlocked.join(", ") +
    "\n     Org.nr, momsreg.nr och adress står kvar som [FYLL I]." +
    "\n     Sajten visar priser utan villkor tills det är gjort — fyll i dem," +
    "\n     lägg till sidorna i sitemap.xml och kör om bygget.\n"
  );
}
