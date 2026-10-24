// Intervjun (SP7-fyndet 2026-10-24): kandidaten frågade samma sak om fakturan
// tre gånger trots regeln om en följdfråga per ämne. Det här skriptet kör hela
// intervjun mot den lokala emulatorn (steget "intervju", precis som Buildern)
// med en simulerad kund per persona, och låter sedan en domare märka varje
// fråga med ämne och om den upprepar något kunden redan svarat på.
//
// Kör från repo-roten, med `npm run dev:cf` igång på 8788:
//   node testoutput/intervju-2026-10-24/mat.mjs <etikett> [persona…]
// Utdata: testoutput/intervju-2026-10-24/<etikett>/<persona>.json + sammanfattning.
import fs from "node:fs";
import { execSync } from "node:child_process";
// Lokala IP-taket (24 per kvart) räcker inte till tre intervjuer; nollställs vid 429.
const nollställ = () => execSync(`npx --yes wrangler@4.123.0 d1 execute agent-team-builder --local --command "DELETE FROM auth_throttle WHERE bucket LIKE 'ip:ai:%'; DELETE FROM ai_usage WHERE subject LIKE 'ip:%'"`, { stdio: "ignore" });

const BAS = process.env.ATB_BAS || "http://localhost:8788";
const KEY = fs.readFileSync(".dev.vars", "utf8").match(/^OPENROUTER_KEY=(.*)$/m)[1].trim();
const MODELL = "deepseek/deepseek-v4.1-flash";
const LEV = { only: ["deepinfra", "together", "fireworks", "parasail", "coreweave"], data_collection: "deny" };

// Personorna svarar som riktiga människor: korta svar, och var och en har en
// käpphäst hen återkommer till — det är just den som lockade fram upprepningen.
const PERSONOR = {
  byggfirma: `Du är Jonas, 44, driver en byggfirma i Örebro med två anställda snickare (Ali och Petter). Ni gör badrum och tillbyggnader åt privatpersoner. Din käpphäst är fakturorna: du fakturerar på söndagskvällar i Fortnox, ÄTA-arbeten glöms, och kunder betalar sent. Annat i veckan: hembesök för offerter (3–4 per vecka, offerten skrivs på kvällen i Word, tar 1–2 h styck), beställa material hos Beijer, ringa kunder om tider, Offerta-förfrågningar. Du vill inte lämna ifrån dig kundkontakten på plats eller prissättningen.`,
  salong: `Du är Lina, 31, äger en frisörsalong i Västerås med en anställd (Sara). Din käpphäst är avbokningarna: luckor i kalendern i Bokadirekt som ingen fyller. Annat i veckan: Instagraminlägg (ska vara 3 i veckan, blir 1), beställa produkter från grossisten varannan vecka, skriva schema, svara på DM om priser. Du vill inte att någon annan svarar kunder om färgresultat eller klagomål.`,
  fotograf: `Du är Erik, 52, frilansande bröllops- och porträttfotograf i Umeå, ensam. Din käpphäst är redigeringen: varje bröllop är 20–30 timmar i Lightroom, och leveransen drar ut på tiden. Annat i veckan: mejla med brudpar om planering, skriva offerter, lägga upp bilder i Pixieset-galleri, bokföra kvitton (gör det kvartalsvis i panik). Du vill inte lämna ifrån dig urvalet av bilder.`,
};
const KUNDREGLER = `Du svarar i ett samtal med en kandidat som söker jobb som din assistent. Svara som en upptagen människa: 1–3 meningar, vardagligt, ibland bara några ord. Svara på frågan som ställs, men glid gärna tillbaka till din käpphäst. Hitta inte på saker som strider mot beskrivningen. Svara bara med din replik.`;

async function openrouter(messages, json = false) {
  for (let f = 0; f < 3; f++) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODELL, messages, provider: LEV, reasoning: { enabled: false }, max_tokens: 2000, ...(json ? { response_format: { type: "json_object" } } : {}) }),
    });
    const d = await r.json();
    const t = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    if (t) return { text: t.trim(), cost: (d.usage && d.usage.cost) || 0 };
  }
  throw new Error("openrouter gav inget");
}

async function kandidaten(turer) {
  for (let f = 0; f < 3; f++) {
    const r = await fetch(BAS + "/api/ai", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ step: "intervju", stream: true, messages: [{ role: "user", content: JSON.stringify({ turer }) }] }),
    });
    const raw = await r.text();
    if (r.status === 429 || r.status === 402 || /build_quota/.test(raw)) { nollställ(); continue; }
    if (!r.ok) throw new Error(`${r.status} ${raw.slice(0, 200)}`);
    let ut = "";
    for (const rad of raw.split("\n")) {
      if (!rad.startsWith("data:")) continue;
      const p = rad.slice(5).trim();
      if (p === "[DONE]") continue;
      try { const j = JSON.parse(p); ut += (j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content) || ""; } catch (_) {}
    }
    try { return JSON.parse(ut.replace(/^```(json)?|```$/g, "").trim()); } catch (_) {}
  }
  throw new Error("kandidaten gav ingen JSON");
}

const DOMARE = `Du granskar en intervju. Märk VARJE fråga kandidaten ställer med:
- "amne": ett av: vem, verksamhet, storlek, verktyg, moment, klammer, avgransning, annat — plus vilket konkret sak frågan gäller (t.ex. "moment: fakturering").
- "upprepar": true om frågan frågar efter något kunden redan har besvarat tidigare i samtalet (samma sak, även med andra ord) — en specificerande följdfråga som ber om NY information (tid, frekvens, konkret exempel) som inte redan givits är INTE upprepning. Annars false.
- "varfor": en kort mening.
Svara med JSON: {"fragor":[{"nr":1,"amne":"…","upprepar":false,"varfor":"…"}], "sammanfattning":"…"}`;

const [etikett, ...valda] = process.argv.slice(2);
if (!etikett) { console.error("ange etikett"); process.exit(1); }
const dir = `testoutput/intervju-2026-10-24/${etikett}`;
fs.mkdirSync(dir, { recursive: true });

let kost = 0;
for (const namn of valda.length ? valda : Object.keys(PERSONOR)) {
  const turer = [];
  let fråga = (await kandidaten([])).replik, slut = null;
  while (true) {
    const hist = [{ role: "system", content: PERSONOR[namn] + "\n\n" + KUNDREGLER }];
    for (const t of turer) { hist.push({ role: "user", content: t.fraga }, { role: "assistant", content: t.svar }); }
    hist.push({ role: "user", content: fråga });
    const s = await openrouter(hist); kost += s.cost;
    turer.push({ fraga: fråga, svar: s.text });
    const k = await kandidaten(turer);
    if (k.status === "klart") { slut = k; break; }
    fråga = k.replik;
  }
  const transkript = turer.map((t, i) => `[${i + 1}] Kandidaten: ${t.fraga}\n[${i + 1}] Kunden: ${t.svar}`).join("\n\n");
  const d = await openrouter([{ role: "system", content: DOMARE }, { role: "user", content: transkript }], true); kost += d.cost;
  let dom; try { dom = JSON.parse(d.text); } catch (_) { dom = { fel: d.text }; }
  const upp = (dom.fragor || []).filter((x) => x.upprepar);
  const avgr = (dom.fragor || []).some((x) => /avgr/.test(x.amne));
  fs.writeFileSync(`${dir}/${namn}.json`, JSON.stringify({ turer, slut, dom }, null, 2));
  fs.writeFileSync(`${dir}/${namn}.txt`, transkript + `\n\n[slut] ${slut.replik}\n\n--- INTAG ---\n${slut.intag}\n`);
  console.log(`${namn}: ${turer.length} svar · upprepningar ${upp.length} · avgränsning ${avgr ? "ja" : "NEJ"} · intag ${slut.intag ? slut.intag.length : 0} tecken`);
  for (const x of upp) console.log(`   ↻ [${x.nr}] ${x.amne} — ${x.varfor}`);
}
console.log(`simulator+domare: $${kost.toFixed(4)} (kandidatens anrop bokförs i emulatorn)`);
