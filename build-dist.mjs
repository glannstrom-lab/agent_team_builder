// Samlar webb-delarna i dist/ för Cloudflare Pages.
// Tar med det som behövs publikt: hub, de fyra apparna (builder/site/portal/
// verticals), exakt de prompt-filer Buildern hämtar live, och _headers (CSP).
// OBS: functions/ ska INTE med i dist/ — Cloudflare hämtar Pages Functions
// från repo-roten (cwd vid `wrangler pages deploy`), och att kopiera in dem
// i dist/ publicerar API-källkoden som statiska filer.
// Lämnar templates/, examples/, docs/, migrations/, .claude/, testoutput/ och
// design/ (designskisser) utanför — utelämnandena är avsiktliga, inte glömska.
import { rmSync, mkdirSync, cpSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const ITEMS = ["index.html", "avatars.js", "atb-claude.js", "builder", "site", "verticals", "portal", "fonts", "og.png", "sitemap.xml", "robots.txt", "_headers"];

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
console.log("dist/ byggd med:", ITEMS.join(", "), "+ " + PROMPT_FILES.length + " prompt-filer");
if (legalBlocked.length) {
  console.warn(
    "\n  ⚠  EJ PUBLICERADE: " + legalBlocked.join(", ") +
    "\n     Org.nr, momsreg.nr och adress står kvar som [FYLL I]." +
    "\n     Sajten visar priser utan villkor tills det är gjort — fyll i dem," +
    "\n     lägg till sidorna i sitemap.xml och kör om bygget.\n"
  );
}
