// Går igenom köpkedjan i koden, länk för länk, och säger var den brister.
//
//   node .claude/skills/kundresa/kopresan.mjs
//   node .claude/skills/kundresa/kopresan.mjs --live https://mittaiteam.se
//
// Kedjan är: bygga gratis → köpa → webhook levererar → logga in → första svaret.
// Sex av de öppna punkterna i ROADMAP.md (KR3–KR6, BF4, DR8) ligger på den
// sträckan, och de hittades var för sig genom läsning. Ingen har gått den hel.
//
// Skriptet läser källan och kontrollerar det som GÅR att kontrollera statiskt.
// Resten — att kortet faktiskt dras, att mejlet faktiskt kommer fram — kräver
// en riktig körning, och stegen för den står i SKILL.md.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const läs = (p) => { try { return readFileSync(join(ROT, p), "utf8"); } catch { return ""; } };
const C = { röd: "\x1b[31m", gul: "\x1b[33m", grön: "\x1b[32m", dim: "\x1b[2m", fet: "\x1b[1m", av: "\x1b[0m" };

const args = process.argv.slice(2);
const liveBas = args.includes("--live") ? args[args.indexOf("--live") + 1] : null;

let hål = 0;
const ok = (s, d) => { console.log(`  ${C.grön}✔${C.av} ${s}`); if (d) console.log(`    ${C.dim}${d}${C.av}`); };
const gap = (s, d) => { hål++; console.log(`  ${C.röd}✖${C.av} ${s}`); if (d) console.log(`    ${C.dim}${d}${C.av}`); };
const obs = (s, d) => { console.log(`  ${C.gul}⚠${C.av} ${s}`); if (d) console.log(`    ${C.dim}${d}${C.av}`); };
const steg = (n, t) => console.log(`\n${C.fet}${n}. ${t}${C.av}`);

const builder = läs("builder/builder.js");
const checkout = läs("functions/api/checkout.js");
const webhook = läs("functions/api/stripe-webhook.js");
const aktivera = läs("portal/aktivera.html");
const villkor = läs("villkor.html");
const authLib = läs("functions/api/auth/_lib.js");
const app = läs("portal/app.js");

console.log(`${C.fet}\nKöpkedjan: bygga → köpa → levereras → logga in → första svaret${C.av}`);

// ── 1. bygget ─────────────────────────────────────────────────────────────
steg(1, "Bygget är gratis och anonymt");
if (/step:\s*"research"/.test(builder)) ok("Buildern namnger byggsteg (K4) — ingen systemprompt skickas till fria rutten.");
else gap("Hittade inga stegnamn i builder.js — K4-vägen kan ha ändrats.");
if (/atb_last_run/.test(builder)) ok("Körningen persisteras per steg (atb_last_run) och kan återupptas efter F5.");
if (!/e-?post|email/i.test(builder.slice(builder.indexOf("const PLANS"), builder.indexOf("const PLANS") + 4000))) {
  obs("P2: gratisbygget fångar ingen e-postadress.", "Den som bygger och tvekar går inte att höra av sig till. Punkten har en GDPR-sida som är Mikaels att avgöra före koden.");
}

// ── 2. villkoren före köpet ───────────────────────────────────────────────
steg(2, "Villkoren visas INNAN avtalet ingås");
const kundtext = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/<!--[\s\S]*?-->/g, " ");
const nämnerVillkor = [["builder/builder.js", builder], ["portal/aktivera.html", aktivera]]
  .filter(([, s]) => /villkor|ånger/i.test(kundtext(s))).map(([n]) => n);
if (/consent_collection/.test(checkout)) ok("checkout.js sätter consent_collection — Stripe kräver godkännande av villkoren.");
else gap("BF4: checkout.js sätter varken consent_collection eller custom_text.",
         "Distansavtalslagen kräver information om ångerrätten INNAN avtalet ingås. Utan den börjar fristen inte löpa, och ångerknappen skyddar då inte mot en väsentligt längre frist än de 14 dagar koden räknar med. Fix: consent_collection[terms_of_service]=required i BÅDA sessionsanropen + villkors-URL i Stripes dashboard.");
if (nämnerVillkor.length) ok(`Villkor eller ångerrätt nämns i kundens gränssnitt: ${nämnerVillkor.join(", ")}`);
else gap("Varken Builderns avslut eller kvittosidan nämner villkor eller ångerrätt för kunden.");
if (/Vi ber om det samtycket uttryckligen/.test(villkor) && !/consent_collection/.test(checkout)) {
  gap("villkor.html §15 lovar ett samtycke som ingen kod inhämtar.", "Meningen är Mikaels text — rör den inte utan att fråga.");
}

// ── 3. kassan ─────────────────────────────────────────────────────────────
steg(3, "Kassan");
const nivåer = [...läs("functions/api/_stripe.js").matchAll(/"(\w[\w-]*)":\s*\{\s*env:/g)].map((m) => m[1]);
ok(`Säljbara nivåer: ${nivåer.join(", ") || "—"}`, "Prislistan i index.html, villkor.html §4 och TIERS ändras samma dag (test/stripe.mjs fäller).");
if (/success_url:\s*origin \+ "\/portal\/aktivera\.html/.test(checkout)) ok("success_url pekar på kvittosidan med session_id.");
else gap("success_url ser inte ut som väntat — kvittosidan kan inte slå upp köpet.");
if (/sälja samma sak två gånger|redan/.test(checkout)) ok("Uppgradering blockerar en ny provmånad på samma slug.");
if (!/COUNT\(\*\)[\s\S]{0,200}team_access|redan äger/.test(webhook)) {
  gap("KR4: webhookens nytt-team-gren har ingen kundkontroll.",
      "Provmånaden tar slut per TEAM, inte per KUND. Med gratis bygge är cykeln två klick i månaden: 90 kr i stället för 290, i all evighet. Förslag: leverera ändå (betalt är betalt) men flagga raden och mejla info@.");
}

// ── 4. leveransen ─────────────────────────────────────────────────────────
steg(4, "Webhooken levererar");
const grenar = [...webhook.matchAll(/case "([\w.]+)":/g)].map((m) => m[1]);
ok(`${grenar.length} händelsetyper hanteras: ${grenar.join(", ")}`,
   "DE MÅSTE VARA PÅSLAGNA I STRIPES DASHBOARD — annars körs koden aldrig och allt ser ut att fungera som förut.");
if (/stripe_session/.test(webhook)) ok("stripe_session ger idempotens vid retries.");
// Precist: kör NÅGON test webhookens egen onRequestPost? test/plan.mjs
// importerar hjälparen subscriptionOf ur samma fil, vilket är lätt att
// förväxla med täckning — den grenar aldrig på en händelse.
const körWebhook = ["plan", "stripe", "ai", "teams", "health"]
  .some((f) => /import\s*\{[^}]*onRequestPost[^}]*\}\s*from\s*"[^"]*stripe-webhook/.test(läs(`test/${f}.mjs`)));
if (!körWebhook) {
  gap("DR8: betalningens livscykel har noll tester.",
      "Sex grenar i dispatchern, inget test kör onRequestPost. En regression här är per definition tyst: 'uppsagd kund behåller åtkomst' märks aldrig. Selen finns — test/ai.mjs kör redan riktiga rutter med stubbad D1.");
}

// ── 5. kvittot ────────────────────────────────────────────────────────────
steg(5, "Kvittosidan");
if (/kvittomejlet/.test(aktivera)) {
  gap("KR6: räddningsplankan pekar på en länk som inte finns.",
      "Stripes kvittomejl leder till Stripes egen kvittosida, inte till vår success_url. Byt båda styckena mot: gå till mittaiteam.se/portal och logga in med adressen ni betalade med.");
} else ok("Kvittosidan hänvisar inte till kvittomejlets länk.");
if (/atb_last_run_purchased/.test(aktivera) || /atb_last_run_purchased/.test(builder)) {
  ok("Buildern vet att teamet är köpt och säljer det inte igen.");
} else {
  gap("KR5: Buildern säljer teamet en gång till, direkt efter köpet.",
      "clearRun() anropas bara av 'Släng den', och aktivera.html rör aldrig atb_last_run. Kunden som just betalat möts av återupptagningsrutan, av 'teamet finns bara i den här webbläsaren' (falskt för henne) och av en fungerande köpknapp för teamet hon redan äger.");
}

// ── 6. inloggningen ───────────────────────────────────────────────────────
steg(6, "Inloggningen");
if (/login_codes|generateCode/.test(authLib)) ok("Engångskod till mejlen — inga lösenord, inget återställningsflöde.");
if (/console\.error/.test(authLib) && !/ai_errors/.test(authLib)) {
  gap("DR6: mejlvägen kan dö totalt medan /api/health säger 200.",
      "sendMail gör bara console.error + throw; inget bokförs i ai_errors och hälsokontrollen tittar varken på mejlfel eller på om de övriga sju hemligheterna är satta. En roterad avsändarnyckel ger B1-scenariot igen: produkten stum för nya inloggningar, hälsan grön, upptäckt via den kanal som inte fungerar.");
}

// ── 7. första svaret ──────────────────────────────────────────────────────
steg(7, "Första svaret i portalen");
if (/purchase_required/.test(läs("functions/api/ai.js"))) ok("Portalen kräver inloggning och en rad i team_access, annars 402.");
if (/TRIAL_LENGTH_DAYS/.test(app)) ok("Provmånadskortet finns i arbetsytan.");
// Räkna ANROP, inte definitionen — "async function checkTrialNotice()" matchar
// annars och får ett enda anropsställe att se ut som två.
const trialAnrop = (app.match(/(?<!function\s)\bcheckTrialNotice\(\)/g) || []).length;
if (trialAnrop && trialAnrop < 2) {
  gap("KR3: provmånadskortet ritas bara vid boot.",
      "refreshSidebar() byter ut hela .sidebar utan att rita om kortet — verifierat i webbläsare 2026-09-06: kortet är borta så fort presentationsöverlägget stängs. Fixen är en rad sist i refreshSidebar(); funktionen är redan idempotent.");
}

// ── 8. live-sonden ────────────────────────────────────────────────────────
if (liveBas) {
  steg(8, "Live-sond mot " + liveBas);
  try {
    const h = await fetch(liveBas + "/api/health").then((r) => r.json());
    console.log(`  ${h.ok ? C.grön + "✔" : C.röd + "✖"}${C.av} /api/health: ${JSON.stringify(h.checks || h)}`);
  } catch (e) { gap("Kunde inte nå /api/health: " + e.message); }
  console.log(`  ${C.dim}Kassans läge går INTE att läsa ur repot. Kör en riktig checkout och titta på id:t:`);
  console.log(`    cs_test_… = testläge (inga pengar dras) · cs_live_… = skarpt`);
  console.log(`  Uppmätt 2026-08-07 låg den i TESTLÄGE. Fråga Mikael innan du påstår något annat.${C.av}`);
}

console.log("");
if (hål) console.log(`${C.röd}${C.fet}${hål} brott i kedjan.${C.av} Var och en av dem träffar en kund som redan betalat.`);
else console.log(`${C.grön}Inga statiskt läsbara brott.${C.av} ${C.dim}Kvar: gå kedjan på riktigt — se SKILL.md.${C.av}`);
process.exit(hål ? 1 : 0);
