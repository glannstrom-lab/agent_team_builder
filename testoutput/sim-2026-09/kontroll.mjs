// Kör Builderns kontroll (ur källan) mot simuleringens team och portal/teams/.
//   node testoutput/sim-2026-09/kontroll.mjs      (från repo-roten)
import fs from "fs";
const B = fs.readFileSync("builder/builder.js", "utf8");
const i = B.indexOf("⟦DELAD-START⟧"), j = B.indexOf("⟦DELAD-SLUT⟧");
const D = B.slice(B.indexOf("\n", i) + 1, B.lastIndexOf("\n", j) + 1);
const k1 = B.indexOf("const OBLIGATORISKA_SEKTIONER"), k2 = B.indexOf("// TEAM_SCHEMA bor i");
const K = new Function(D + B.slice(k1, k2).replace(/console\.warn\([^;]*;/, "") +
  "; return {kontrolleraSystemprompter,perspektivText,sektionText,LEVERANS_RUBRIK};")();
const prov = (team) => { try { K.kontrolleraSystemprompter(team); return "OK"; }
  catch (e) { return "FÄLLS: " + e.message.split("\n").filter((l) => l.startsWith("•")).slice(0, 2).join(" | "); } };
for (const k of fs.readdirSync("testoutput/sim-2026-09")) {
  const f = `testoutput/sim-2026-09/${k}/team.json`;
  if (!fs.existsSync(f)) continue;
  const t = JSON.parse(fs.readFileSync(f, "utf8"));
  console.log(k.padEnd(12), prov(t), "| persp", t.agents.map((a) => K.perspektivText(a.system).length).join("/"),
    "| lev", t.agents.map((a) => (K.sektionText(a.system, K.LEVERANS_RUBRIK) || "").length).join("/"));
}
const reg = {}; new Function("window", fs.readFileSync("portal/teams/index.js", "utf8"))(reg);
let ok = 0; const fel = [];
for (const t0 of reg.TEAMS) { const w = {}; try { new Function("window", fs.readFileSync("portal/teams/" + t0.slug + ".js", "utf8"))(w); } catch { continue; }
  const r = prov(w.TEAM); r === "OK" ? ok++ : fel.push(t0.slug + ": " + r); }
console.log("portal/teams:", ok, "OK;", fel.length, "fäller"); fel.forEach((x) => console.log("  " + x));
