// SP17 (2026-10-26): VD-assistenten mätt över 3 × 3 byggen i stället för ett.
// Byggfirma och salong har ett kundvalt namn i intaget (scenvägen sedan SP22),
// fotografen har inget — där ska hon heta "VD-assistent" och inget annat.
// Kör från repo-roten:
//   node testoutput/sp17-2026-10-26/mat.mjs [katalog]      (default: baslinjen)
// Måtten hämtas ur Builderns egen källa (DELAD-blocket), samma grepp som
// test/teams.mjs och testoutput/sp9-2026-10-23/mat.mjs.
import fs from "node:fs";

const B = fs.readFileSync("builder/builder.js", "utf8");
const i = B.indexOf("⟦DELAD-START⟧"), j = B.indexOf("⟦DELAD-SLUT⟧");
const D = B.slice(B.indexOf("\n", i) + 1, B.lastIndexOf("\n", j) + 1);
const k1 = B.indexOf("const OBLIGATORISKA_SEKTIONER"), k2 = B.indexOf("// TEAM_SCHEMA bor i");
const K = new Function(D + B.slice(k1, k2).replace(/console\.warn\([^;]*;/, "") +
  "; return { kontrolleraSystemprompter, perspektivText, perspektivLikhet, perspektivBrister, teamBrister, skalningsAntal };")();

const ROT = "testoutput/sp17-2026-10-26/" + (process.argv[2] || ".");
const läs = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const r2 = (x) => Math.round(x * 100) / 100;
const VALT = { byggfirma: "Robin", salong: "Saga", fotograf: null };
// Namn som får förekomma: de som står i intaget. Allt annat personnamnslikt i
// VD-assistentens text är påhittat.
const FÖRNAMN = /\b(Anna|Maria|Eva|Karin|Sara|Emma|Lina|Klara|Nova|Elin|Ida|Moa|Saga|Alva|Maja|Elsa|Ella|Wilma|Lisa|Sofia|Johanna|Linnea|Hanna|Erik|Lars|Karl|Anders|Johan|Per|Nils|Jonas|Oskar|Ali|Robin|Sam|Alex|Kim|Leo|Hugo|Liam|Noah|Axel|Max|Theo|Mikael|Stina|Greta|Vera|Iris|Tove|Frida|Ebba|Signe|Astrid|Märta|Selma|Ture|Bengt|Sven|Gunnar|Mats)\b/g;

const rader = [], perFöretag = {};
const kat = fs.readdirSync(ROT).filter((d) => /^(byggfirma|salong|fotograf)-\d$/.test(d)).sort();
const vdaText = {};
for (const d of kat) {
  const f = d.replace(/-\d$/, ""), run = d.slice(-1);
  const dir = `${ROT}/${d}`;
  if (!fs.existsSync(`${dir}/team.json`)) { rader.push(`${d}: INGET TEAM`); continue; }
  const team = läs(`${dir}/team.json`), bygge = läs(`${dir}/bygge.json`);
  const intake = fs.readFileSync(`${dir}/intake.md`, "utf8") + (fs.existsSync(`${dir}/clarify-svar.md`) ? fs.readFileSync(`${dir}/clarify-svar.md`, "utf8") : "");
  const a = team.agents.find((x) => x.id === "vd-assistent");
  const sys = (a && a.system) || "";
  vdaText[d] = K.perspektivText(sys);
  // 1. Namnet
  const valt = VALT[f];
  const namnOk = valt ? a.name === valt : /^VD-assistent(en)?$/i.test(a.name);
  // 2. Påhittade personnamn i hennes text (inte i intaget)
  const iText = new Set(intake.match(FÖRNAMN) || []);
  const påhittat = [...new Set((sys + " " + (a.job || "")).match(FÖRNAMN) || [])].filter((n) => !iText.has(n));
  // 3. Påhittade efternamn på personer ur intaget ("Mikael Glänne"-felet)
  const efternamn = [...new Set([...sys.matchAll(/\b(Jonas|Lina|Oskar|Emma|Ali|Sara) ([A-ZÅÄÖ][a-zåäö]{2,})/g)]
    .map((m) => m[0]).filter((s) => !intake.includes(s) && !/ (Bygg|Och|Är|Har|Gör|Vill|Ska|Kan|Väljer|Avgör|Bestämmer)$/.test(s)))];
  // 4. Specialister med personnamn i stället för vad de gör
  const persSpec = team.agents.filter((x) => x.id !== "vd-assistent" && /^[A-ZÅÄÖ][a-zåäö]+$/.test(x.name) && (x.name.match(FÖRNAMN) || []).length).map((x) => x.name);
  // 5. Lånad blick: hennes perspektiv mot de egna specialisternas
  const egna = team.agents.filter((x) => x.id !== "vd-assistent").map((x) => [x.id, K.perspektivLikhet(vdaText[d], K.perspektivText(x.system))]);
  const maxEgen = Math.max(...egna.map((x) => x[1]));
  let kontroll = "OK";
  try { K.kontrolleraSystemprompter(team); } catch (e) { kontroll = "FÄLLS: " + e.message.split("\n")[0]; }
  const kost = (bygge.förbrukning || []).reduce((s, x) => s + ((x.usage && x.usage.cost) || 0), 0);
  (perFöretag[f] = perFöretag[f] || []).push({ d, namnOk, påhittat, efternamn, persSpec, maxEgen, kost });
  rader.push(`${d}: namn="${a.name}" ${namnOk ? "ok" : "FEL"} · påhittade namn: ${påhittat.join(",") || "–"} · påhittade efternamn: ${efternamn.join(",") || "–"} · specialister med personnamn: ${persSpec.join(",") || "–"}`);
  rader.push(`   mot egna: ${egna.map(([id, v]) => `${id} ${r2(v)}`).join(" · ")} · max ${r2(maxEgen)} · kontroll ${kontroll} · $${kost.toFixed(3)}`);
  rader.push(`   perspektiv: ${vdaText[d].slice(0, 220).replace(/\s+/g, " ")}`);
}
console.log(rader.join("\n"));

console.log("\n=== Mellan företagen, inom samma omgång ===");
const mellan = [];
for (const run of ["1", "2", "3"]) {
  const ks = ["byggfirma", "salong", "fotograf"].map((f) => `${f}-${run}`).filter((d) => vdaText[d]);
  const p = [];
  for (let x = 0; x < ks.length; x++) for (let y = x + 1; y < ks.length; y++) { const v = K.perspektivLikhet(vdaText[ks[x]], vdaText[ks[y]]); mellan.push(v); p.push(`${ks[x].replace(/-\d/, "")}~${ks[y].replace(/-\d/, "")} ${r2(v)}`); }
  console.log(`omgång ${run}: ${p.join(" · ")}`);
}

console.log("\n=== Summering ===");
let alla = [];
for (const [f, xs] of Object.entries(perFöretag)) {
  alla = alla.concat(xs);
  const m = xs.map((x) => x.maxEgen);
  console.log(`${f}: namn rätt ${xs.filter((x) => x.namnOk).length}/${xs.length} · påhittade namn i ${xs.filter((x) => x.påhittat.length).length}/${xs.length} · påhittade efternamn i ${xs.filter((x) => x.efternamn.length).length}/${xs.length} · personnamn på specialist i ${xs.filter((x) => x.persSpec.length).length}/${xs.length} · mot egna max ${m.map(r2).join("/")} (snitt ${r2(m.reduce((s, v) => s + v, 0) / m.length)})`);
}
const me = alla.map((x) => x.maxEgen);
console.log(`ALLA: mot egna snitt ${r2(me.reduce((s, v) => s + v, 0) / me.length)} max ${r2(Math.max(...me))} · mellan företag snitt ${r2(mellan.reduce((s, v) => s + v, 0) / mellan.length)} max ${r2(Math.max(...mellan))} · namnfel ${alla.filter((x) => !x.namnOk || x.påhittat.length || x.efternamn.length || x.persSpec.length).length}/${alla.length} · kostnad $${alla.reduce((s, x) => s + x.kost, 0).toFixed(3)}`);
