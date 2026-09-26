// Vad AI:n har kostat per team den här månaden — kronmätaren i läsbar form.
//
//   npm run kostnad              (skarpa D1)
//   npm run kostnad -- --local   (emulatorns kopia)
//   npm run kostnad -- --manad 2026-09
//
// Räknar med SAMMA funktion som /api/ai (kronorFör i functions/api/ai.js), så
// siffran här är den som taket på 40 kr jämförs mot. Läser bara.
import { execFileSync } from "node:child_process";
import { kronorFör, KOSTNAD } from "../functions/api/ai.js";

const args = process.argv.slice(2);
const månad = args.includes("--manad") ? args[args.indexOf("--manad") + 1] : new Date().toISOString().slice(0, 7);
const flagga = args.includes("--local") ? "--local" : "--remote";
const sql = `SELECT subject, calls, input_tok, output_tok FROM ai_usage WHERE period = '${månad.replace(/[^0-9-]/g, "")}' AND (subject LIKE 'team:%' OR subject LIKE 'web:%')`;
const ut = execFileSync("npx", ["wrangler@4.123.0", "d1", "execute", "agent-team-builder", flagga, "--json", "--command", JSON.stringify(sql)],
  { encoding: "utf8", shell: true });
const rader = JSON.parse(ut.slice(ut.indexOf("[")))[0].results || [];
const webb = Object.fromEntries(rader.filter((r) => r.subject.startsWith("web:")).map((r) => [r.subject.slice(4), r.calls]));
const team = rader.filter((r) => r.subject.startsWith("team:")).map((r) => {
  const slug = r.subject.slice(5);
  return { slug, anrop: r.calls, webb: webb[slug] || 0, kr: kronorFör(r, webb[slug] || 0) };
}).sort((a, b) => b.kr - a.kr);

console.log(`\nAI-kostnad per team, ${månad} (tak ${KOSTNAD.takKr} kr, larm ${KOSTNAD.larmKr} kr, pris ${KOSTNAD.inUsdPerMtok}/${KOSTNAD.utUsdPerMtok} USD per Mtok)\n`);
for (const t of team) {
  const flagg = t.kr >= KOSTNAD.takKr ? "  ← SPARLÄGE" : t.kr >= KOSTNAD.larmKr ? "  ← larm" : "";
  console.log(`  ${t.kr.toFixed(2).padStart(7)} kr  ${String(t.anrop).padStart(5)} anrop  ${String(t.webb).padStart(4)} webb  ${t.slug}${flagg}`);
}
const summa = team.reduce((n, t) => n + t.kr, 0);
console.log(`\n  ${summa.toFixed(2).padStart(7)} kr totalt, ${team.length} team\n`);
