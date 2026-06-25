// Samlar webb-delarna i dist/ för Cloudflare Pages.
// Tar bara med det som behövs publikt: hub, de tre apparna och prompts/
// (Buildern hämtar prompts/ live). Lämnar templates/, examples/, docs/,
// .claude/, testoutput/, .git m.m. utanför.
import { rmSync, mkdirSync, cpSync } from "node:fs";

const ITEMS = ["index.html", "builder", "site", "portal", "prompts"];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const item of ITEMS) {
  cpSync(item, `dist/${item}`, { recursive: true });
}
console.log("dist/ byggd med:", ITEMS.join(", "));
