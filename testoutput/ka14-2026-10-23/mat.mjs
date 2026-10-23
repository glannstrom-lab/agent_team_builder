// KA14 (2026-10-23): mätning av tre mikrobyggen utan VD-agent, mot KA9:s
// byggen av samma tre intag (2026-09-26, med VD). Kör från repo-roten:
//   node testoutput/ka14-2026-10-23/mat.mjs
// Måtten hämtas ur Builderns egen källa (DELAD-blocket + systempromptkontrollen),
// samma grepp som test/teams.mjs och testoutput/sim-2026-09/kontroll.mjs.
import fs from "node:fs";

const B = fs.readFileSync("builder/builder.js", "utf8");
const i = B.indexOf("⟦DELAD-START⟧"), j = B.indexOf("⟦DELAD-SLUT⟧");
const D = B.slice(B.indexOf("\n", i) + 1, B.lastIndexOf("\n", j) + 1);
const k1 = B.indexOf("const OBLIGATORISKA_SEKTIONER"), k2 = B.indexOf("// TEAM_SCHEMA bor i");
const K = new Function(D + B.slice(k1, k2).replace(/console\.warn\([^;]*;/, "") +
  "; return { kontrolleraSystemprompter, perspektivText, perspektivLikhet, perspektivBrister, teamBrister, skalningsAntal, förslagsAntal };")();

const NU = { byggfirma: "testoutput/ka14-2026-10-23/byggfirma", salong: "testoutput/ka14-2026-10-23/salong", fotograf: "testoutput/ka14-2026-10-23/fotograf" };
const FÖRE = { byggfirma: "testoutput/sim-2026-09/bygg2", salong: "testoutput/sim-2026-09/ka9-salong", fotograf: "testoutput/sim-2026-09/ka9-fotograf" };
const läs = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const r2 = (x) => Math.round(x * 100) / 100;

function mät(kataloger, rubrik) {
  console.log(`\n=== ${rubrik} ===`);
  const vda = {};
  for (const [k, dir] of Object.entries(kataloger)) {
    const team = läs(`${dir}/team.json`), bygge = läs(`${dir}/bygge.json`);
    const n = K.skalningsAntal(bygge.scaling);
    let prompt = "OK";
    try { K.kontrolleraSystemprompter(team); } catch (e) { prompt = "FÄLLS: " + e.message.split("\n")[0]; }
    const a = team.agents.find((x) => x.id === "vd-assistent");
    vda[k] = K.perspektivText(a && a.system);
    const egna = team.agents.filter((x) => x.id !== "vd-assistent")
      .map((x) => `${x.id} ${r2(K.perspektivLikhet(vda[k], K.perspektivText(x.system)))}`);
    const p = bygge.proposal || "";
    console.log(`${k}: ${team.agents.map((x) => x.id).join(", ")}`);
    console.log(`  skalning: ${bygge.scaling.split("\n")[0]}`);
    console.log(`  VD-agent: ${team.agents.some((x) => x.id === "vd") ? "JA" : "nej"} · teamBrister(utanVd): ${JSON.stringify(K.teamBrister(team, n, true))} · systemprompter: ${prompt} · perspektivBrister: ${K.perspektivBrister(team.agents).length}`);
    console.log(`  VD-assistenten mot egna: ${egna.join(" · ")}`);
    console.log(`  förslaget: "### VD"-rubrik utan assistent: ${/^###\s+VD\s*$/m.test(p) || /^###\s+VD\s*\(/m.test(p) ? "JA" : "nej"} · ## Rekryteringsplan: ${/^##\s+Rekryteringsplan/m.test(p) ? "ja" : "nej"} · **Anställs:** ${(p.match(/\*\*Anställs:\*\*/g) || []).length} · Varje vecka: ${/\*\*Varje vecka:\*\*/.test(p) ? "ja" : "nej"} · Håller koll på: ${/\*\*Håller koll på:\*\*/.test(p) ? "ja" : "nej"} · Tills de anställs: ${/\*\*Tills de anställs:\*\*/.test(p) ? "ja" : "nej"}`);
    console.log(`  i teamet (efter sammanställningen): rekrytering/turordning i JSON: ${/anställ|rekryter/i.test(JSON.stringify({ a: team.agents.map((x) => [x.job, x.why]) })) ? "nämns i job/why" : "nej"} · "förbered" i VD-assistentens system: ${/förbered/i.test(a.system) ? "ja" : "nej"} · "kunden är VD"/"du är VD": ${/(är|du är) VD:n|är VD\b/i.test(a.system) ? "ja" : "nej"}`);
    const f = bygge.förbrukning || [];
    if (f.length) {
      const kost = f.reduce((s, x) => s + ((x.usage && x.usage.cost) || 0), 0);
      const tin = f.reduce((s, x) => s + ((x.usage && x.usage.prompt_tokens) || 0), 0);
      const tut = f.reduce((s, x) => s + ((x.usage && x.usage.completion_tokens) || 0), 0);
      console.log(`  förbrukning: ${f.length} anrop · ${tin} in / ${tut} ut tokens · $${kost.toFixed(4)} (usage.cost)`);
      mät.kostnad = (mät.kostnad || 0) + kost;
    }
  }
  const ks = Object.keys(vda), par = [];
  for (let x = 0; x < ks.length; x++) for (let y = x + 1; y < ks.length; y++)
    par.push(`${ks[x]}~${ks[y]} ${r2(K.perspektivLikhet(vda[ks[x]], vda[ks[y]]))}`);
  console.log(`  VD-assistenterna mellan teamen: ${par.join(" · ")}`);
}

mät(FÖRE, "FÖRE: KA9 2026-09-26 (drift, med VD)");
mät.kostnad = 0;
mät(NU, "EFTER: KA14 2026-10-23 (lokal emulator, utan VD)");
console.log(`\nTotal kostnad för de tre KA14-byggena: $${mät.kostnad.toFixed(4)}`);
