// Samlar webb-delarna i dist/ för Cloudflare Pages.
// Tar med det som behövs publikt: hub, de fyra apparna (builder/site/portal/
// verticals), exakt de prompt-filer Buildern hämtar live, och _headers (CSP).
// OBS: functions/ ska INTE med i dist/ — Cloudflare hämtar Pages Functions
// från repo-roten (cwd vid `wrangler pages deploy`), och att kopiera in dem
// i dist/ publicerar API-källkoden som statiska filer.
// Lämnar templates/, examples/, docs/, migrations/, .claude/, testoutput/ och
// design/ (designskisser) utanför — utelämnandena är avsiktliga, inte glömska.
import { rmSync, mkdirSync, cpSync } from "node:fs";
import { dirname } from "node:path";

// OBS: integritet.html och villkor.html ligger MEDVETET inte här. De är utkast
// med öppna beslutsmarkeringar (firmaform, B2B/konsument, moms) och ska läsas av
// jurist först. Lägg in dem — och i sitemap.xml — samma dag de är klara.
const ITEMS = ["index.html", "avatars.js", "atb-claude.js", "builder", "site", "verticals", "portal", "fonts", "og.png", "sitemap.xml", "robots.txt", "_headers"];

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
