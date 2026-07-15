// Samlar webb-delarna i dist/ för Cloudflare Pages.
// Tar med det som behövs publikt: hub, de fyra apparna (builder/site/portal/
// verticals), prompts/ (Buildern hämtar dem live), functions/ (Pages Functions
// måste ligga i deploy-katalogens rot), _headers (CSP m.m.). Lämnar templates/,
// examples/, docs/, migrations/, .claude/, testoutput/, .git m.m. utanför.
import { rmSync, mkdirSync, cpSync } from "node:fs";

const ITEMS = ["index.html", "avatars.js", "atb-claude.js", "builder", "site", "portal", "prompts", "verticals", "functions", "_headers"];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const item of ITEMS) {
  cpSync(item, `dist/${item}`, { recursive: true });
}
console.log("dist/ byggd med:", ITEMS.join(", "));
