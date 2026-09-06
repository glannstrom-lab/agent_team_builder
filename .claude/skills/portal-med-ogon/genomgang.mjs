// Öppnar portalen i en riktig webbläsare och går igenom den, steg för steg,
// med skärmbilder och konsolfel.
//
//   node .claude/skills/portal-med-ogon/genomgang.mjs                  # demoläge, offline
//   node .claude/skills/portal-med-ogon/genomgang.mjs --synlig         # med fönster
//   node .claude/skills/portal-med-ogon/genomgang.mjs --team salong
//   node .claude/skills/portal-med-ogon/genomgang.mjs --url http://localhost:8788 \
//        --team <slug> --cookie <sessionstoken>     # riktigt team mot wrangler
//
// Varför skriptet finns: fem pass i rad lade kod i portal/app.js utan att någon
// öppnade portalen. KR3 (provmånadskortet försvinner när arbetsytan expanderas)
// och RE1 ("Veckan som gick" läser en logg som just nollställts) syns inte vid
// genomläsning men direkt på skärmen.
//
// TVÅ LÄGEN, och skillnaden är hela poängen:
//
//   DEMO (standard) — `?demo=1`, ingen server utöver den här filen, ingen
//   nyckel, inget konto. Visar chatt, agentkort, layout, mobil. MEN: demoläget
//   stänger av rutiner, streak, sparad tid, provmånadskort, "Utveckla teamet",
//   sök och mappkoppling (`if (state.demo) return` på ~40 ställen). Precis det
//   som byggts blint går alltså INTE att se här.
//
//   RIKTIGT (--url + --cookie) — kräver `npm run dev:cf` och en rad i lokala
//   D1. Kör `satt-upp-lokalt.mjs` först; den skriver ut kommandot och token.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { starta } from "./server.mjs";

const args = process.argv.slice(2);
const flagga = (n) => args.includes("--" + n);
const värde = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : d; };

const TEAM = värde("team", "coachonline");
const COOKIE = värde("cookie", null);
const EGEN_URL = värde("url", null);
const PORT = Number(värde("port", 8420));
const UT = värde("ut", join(tmpdir(), "portal-genomgang"));
const DEMO = !COOKIE;

const C = { röd: "\x1b[31m", gul: "\x1b[33m", grön: "\x1b[32m", dim: "\x1b[2m", fet: "\x1b[1m", av: "\x1b[0m" };
mkdirSync(UT, { recursive: true });

const fynd = [];
const anteckna = (nivå, text) => { fynd.push({ nivå, text }); console.log(`  ${nivå === "fel" ? C.röd + "✖" : nivå === "varning" ? C.gul + "⚠" : C.grön + "✔"}${C.av} ${text}`); };

let server = null;
const bas = EGEN_URL || `http://localhost:${PORT}`;
if (!EGEN_URL) server = await starta(PORT);

const webbläsare = await chromium.launch({ headless: !flagga("synlig") });
const kontext = await webbläsare.newContext({ viewport: { width: 1440, height: 900 } });
if (COOKIE) {
  const u = new URL(bas);
  await kontext.addCookies([{ name: "atb_session", value: COOKIE, domain: u.hostname, path: "/", httpOnly: true }]);
}
const sida = await kontext.newPage();

const konsolfel = [], nätfel = [];
sida.on("console", (m) => { if (m.type() === "error") konsolfel.push(m.text()); });
sida.on("pageerror", (e) => konsolfel.push("pageerror: " + e.message));
sida.on("requestfailed", (r) => nätfel.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`));

const skärm = async (namn) => { const p = join(UT, namn + ".png"); await sida.screenshot({ path: p, fullPage: false }); return p; };
const finns = async (sel) => (await sida.locator(sel).count()) > 0;

// KR3: provmånadskortet ritas EN gång, vid boot, in i .ws — och .ws byggs om
// av renderSidebar() varje gång sidopanelen ritas om. Kortet mäts därför efter
// varje steg, inte bara en gång: det är där det försvinner som är fyndet.
// Uppmätt 2026-09-06 mot lokal emulator (plan=trial, created_at 27 dagar bakåt):
// kortet finns vid laddning och är BORTA så fort presentationsöverlägget stängs.
const kortSpår = [];
const spåraKort = async (steg) => {
  kortSpår.push({ steg, n: await sida.locator("#trial-card").count() });
};

console.log(`${C.fet}\nPortalgenomgång${C.av} — ${DEMO ? "DEMOLÄGE" : "riktigt team"} · ${bas}/portal/?team=${TEAM}`);
console.log(`${C.dim}Skärmbilder: ${UT}${C.av}\n`);

// ── 1. laddning ───────────────────────────────────────────────────────────
console.log(`${C.fet}1. Portalen laddar${C.av}`);
const url = `${bas}/portal/?team=${TEAM}${DEMO ? "&demo=1" : ""}`;
await sida.goto(url, { waitUntil: "networkidle" });
await sida.waitForTimeout(600);

if (await finns(".app")) anteckna("ok", "Arbetsytan (.app) ritades upp.");
else if (await finns(".setup")) anteckna("fel", "Inloggningsvyn visas — sessionen gäller inte (eller servern saknar /api).");
else if (await finns(".picker")) anteckna("fel", "Kundväljaren visas — slugen nådde inte fram.");
else anteckna("fel", "Varken .app, .setup eller .picker — sidan ritade ingenting.");

const antalAgenter = await sida.locator(".agent-item").count();
anteckna(antalAgenter ? "ok" : "fel", `${antalAgenter} agenter i laget till vänster.`);
if (DEMO && !(await finns(".demo-banner"))) anteckna("varning", "Ingen demobanner — teamet öppnades inte i demoläge.");
console.log(`  ${C.dim}${await skärm("01-start")}${C.av}`);
await spåraKort("laddning");

// Presentationsrundan lägger sig över allt vid första besöket och fångar varje
// klick (#ovl äter pointer events). Den är rätt beteende — men den är också det
// första en riktig kund möter, så den ska ses, inte hoppas förbi tyst.
if (await sida.locator("#ovl").isVisible().catch(() => false)) {
  const rubrik = (await sida.locator("#ovl").innerText().catch(() => "")).split("\n")[0];
  anteckna("ok", `Överlägg vid första besöket: "${rubrik.trim()}" — skärmbild 01b.`);
  console.log(`  ${C.dim}${await skärm("01b-overlagg")}${C.av}`);
  const hoppa = sida.locator("#ovl button").filter({ hasText: /hoppa över|✕/i }).first();
  if (await hoppa.count()) { await hoppa.click(); await sida.waitForTimeout(400); }
  else await sida.keyboard.press("Escape");
  if (await sida.locator("#ovl").isVisible().catch(() => false)) {
    anteckna("fel", "Överlägget gick inte att stänga — resten av portalen är oåtkomlig.");
  } else anteckna("ok", "Överlägget gick att stänga.");
  await spåraKort("stängt överlägg");
}

// ── 2. agentkort och byte ─────────────────────────────────────────────────
console.log(`${C.fet}\n2. Byta agent${C.av}`);
if (antalAgenter > 1) {
  const före = await sida.locator(".chat-title").first().textContent().catch(() => "");
  await sida.locator(".agent-item").nth(1).click();
  await sida.waitForTimeout(400);
  const efter = await sida.locator(".chat-title").first().textContent().catch(() => "");
  anteckna(före !== efter ? "ok" : "fel", `Rubriken byttes: "${(före || "").trim()}" → "${(efter || "").trim()}"`);
  console.log(`  ${C.dim}${await skärm("02-agent")}${C.av}`);
  await spåraKort("agentbyte");
} else anteckna("varning", "Bara en agent — hoppar över bytet.");

// ── 3. ett svar ───────────────────────────────────────────────────────────
console.log(`${C.fet}\n3. Ställa en fråga${C.av}`);
const composer = sida.locator(".composer-input").first();
if (await composer.count()) {
  await composer.fill("Vad borde jag prioritera den här veckan?");
  await sida.locator(".composer-send").first().click();
  try {
    await sida.waitForSelector(".msg-assistant .bubble", { timeout: 20000 });
    // Vänta tills strömmen står still — annars fotograferas ett halvskrivet
    // svar och skärmbilden ser ut som en avkapad bugg.
    let sist = -1, stilla = 0;
    for (let i = 0; i < 60 && stilla < 3; i++) {
      await sida.waitForTimeout(400);
      const n = ((await sida.locator(".msg-assistant .bubble").last().textContent()) || "").length;
      stilla = n === sist ? stilla + 1 : 0;
      sist = n;
    }
    const svar = (await sida.locator(".msg-assistant .bubble").last().textContent()) || "";
    const aiFel = nätfel.concat(konsolfel).some((f) => /api\/ai|50[023]|402/.test(f));
    if (svar.trim().length <= 40 && aiFel) {
      anteckna("varning", `Bara ${svar.trim().length} tecken och /api/ai svarade med fel — nyckeln i .dev.vars är ogiltig eller saknas. Resten av portalen går ändå att gå igenom.`);
    } else anteckna(svar.trim().length > 40 ? "ok" : "varning", `Svar på ${svar.trim().length} tecken.`);
    // Markdown ska renderas, inte visas som asterisker.
    const html = (await sida.locator(".msg-assistant .bubble").last().innerHTML()) || "";
    if (/\*\*/.test(svar) && !/<(strong|b)>/i.test(html)) anteckna("fel", "Markdown renderas inte — ** syns som tecken.");
    else anteckna("ok", "Markdown ser renderad ut.");
  } catch { anteckna("fel", "Inget svar inom 20 s. I demoläge betyder det att streamDemo inte kördes; mot riktig server att /api/ai inte svarade."); }
  console.log(`  ${C.dim}${await skärm("03-svar")}${C.av}`);
  await spåraKort("ett svar");
} else anteckna("fel", "Ingen composer — det går inte att skriva till teamet.");

// ── 4. arbetsytan ─────────────────────────────────────────────────────────
console.log(`${C.fet}\n4. Arbetsytan${C.av}`);
const knapparFöre = await sida.locator(".ws-btn").count();
anteckna(knapparFöre ? "ok" : "varning", `${knapparFöre} knappar i arbetsytan.`);
if (await finns(".ws-more")) {
  await sida.locator(".ws-more").first().click();
  await sida.waitForTimeout(500);
  const knapparEfter = await sida.locator(".ws-btn").count();
  anteckna(knapparEfter > knapparFöre ? "ok" : "varning", `Expanderad arbetsyta: ${knapparFöre} → ${knapparEfter} knappar.`);
  await spåraKort("expanderad arbetsyta");
  console.log(`  ${C.dim}${await skärm("04-arbetsyta")}${C.av}`);
} else anteckna(DEMO ? "varning" : "fel", "Ingen \"Visa hela arbetsytan\"-knapp.");

if (DEMO) {
  console.log(`  ${C.dim}Demoläget VISAR rutinlistan men bockar aldrig av den (routineDone är avstängd), och${C.av}`);
  console.log(`  ${C.dim}döljer streak, puls, sparad tid, provmånadskort, Utveckla teamet, sök, kvartalsöverblick${C.av}`);
  console.log(`  ${C.dim}och mappkoppling. P6, P4, OM5, KR3 och RE1 går alltså INTE att se i det här läget.${C.av}`);
}

// ── 5. de icke-demo-ytorna ────────────────────────────────────────────────
if (!DEMO) {
  console.log(`${C.fet}\n5. Ytorna som byggts utan ögon${C.av}`);

  // Rutinerna är egna knappar (.routine-item), inte arbetsyteknappar.
  const rutiner = await sida.locator(".routine-item").count();
  anteckna(rutiner ? "ok" : "varning", `${rutiner} veckorutiner i arbetsytan.`);
  if (rutiner) {
    const klara = await sida.locator(".routine-item.done").count();
    await sida.locator(".routine-item").first().click();
    await sida.waitForTimeout(600);
    const förifyllt = ((await sida.locator(".composer-input").first().inputValue().catch(() => "")) || "").trim();
    anteckna(förifyllt.length > 20 ? "ok" : "fel",
      `Rutinklick förifyllde composern med ${förifyllt.length} tecken.`);
    console.log(`  ${C.dim}${klara} rutiner står som klara i dag. P6-kvittot syns som "klar ✓" och ska överleva F5.${C.av}`);
    console.log(`  ${C.dim}${await skärm("05-rutin")}${C.av}`);
  }

  // KR3 / provmånadskortet: syns från dag 25 när planen är trial.
  // Kör satt-upp-lokalt.mjs med --plan trial --dagar 27 för att framkalla det.
  const kort = await sida.locator("#trial-card").count();
  console.log(`  ${C.dim}Provmånadskort (#trial-card): ${kort ? "visas" : "visas inte"} — kräver plan=trial och ≥25 dagar sedan created_at.${C.av}`);

  const ytor = [
    ["Utveckla teamet", ".ws-btn", "utveckla"],
    ["Sök i historiken", ".ws-btn", "sök"],
    ["Veckan som gick", ".ws-btn", "veckan"],
  ];
  for (const [namn, sel, ord] of ytor) {
    const knapp = sida.locator(sel).filter({ hasText: new RegExp(ord, "i") }).first();
    if (await knapp.count()) {
      await knapp.click();
      await sida.waitForTimeout(700);
      anteckna("ok", `${namn} öppnade utan att kasta.`);
      console.log(`  ${C.dim}${await skärm("05-" + ord)}${C.av}`);
      await sida.keyboard.press("Escape");
      await sida.waitForTimeout(300);
    } else anteckna("varning", `${namn} hittades inte i arbetsytan.`);
  }
  console.log(`  ${C.dim}Kvar att bedöma med ögon: bocka av en rutin och ladda om (P6 — kvittot ska ligga kvar),${C.av}`);
  console.log(`  ${C.dim}avsluta en grundagent (P4 — historiken ska komma tillbaka med agenten),${C.av}`);
  console.log(`  ${C.dim}och se att sparad tid räknar avbockade rutiner och inget annat (OM5).${C.av}`);
}

// ── 6. mobil ──────────────────────────────────────────────────────────────
console.log(`${C.fet}\n6. Mobil (390×844)${C.av}`);
await sida.setViewportSize({ width: 390, height: 844 });
await sida.waitForTimeout(600);
const bredd = await sida.evaluate(() => document.documentElement.scrollWidth);
anteckna(bredd <= 400 ? "ok" : "fel", `Dokumentbredd ${bredd} px — sidan ${bredd <= 400 ? "ryms" : "scrollar i sidled"}.`);
console.log(`  ${C.dim}${await skärm("06-mobil")}${C.av}`);
await sida.setViewportSize({ width: 1440, height: 900 });

// ── 7. de andra ytorna ────────────────────────────────────────────────────
console.log(`${C.fet}\n7. Övriga ytor${C.av}`);
for (const [namn, väg] of [["Hub", "/"], ["Builder", "/builder/"], ["Galleri", "/site/"], ["Bransch", "/verticals/?v=restaurang"]]) {
  const före = konsolfel.length;
  const svar = await sida.goto(bas + väg, { waitUntil: "networkidle" }).catch(() => null);
  await sida.waitForTimeout(400);
  const nya = konsolfel.length - före;
  anteckna(svar && svar.ok() && !nya ? "ok" : nya ? "varning" : "fel",
    `${namn} (${väg}): status ${svar ? svar.status() : "—"}${nya ? `, ${nya} nya konsolfel` : ""}`);
}

// ── sammanfattning ────────────────────────────────────────────────────────
// KR3: var forsvinner provmanadskortet?
if (kortSpår.some((k) => k.n)) {
  console.log(`${C.fet}
Provmånadskortet (#trial-card)${C.av}`);
  let förra = null, tappat = null;
  for (const k of kortSpår) {
    console.log(`  ${k.n ? C.grön + "finns " : C.röd + "borta "}${C.av}${C.dim}efter ${k.steg}${C.av}`);
    if (förra && förra.n && !k.n && !tappat) tappat = k.steg;
    förra = k;
  }
  if (tappat) {
    anteckna("fel", `KR3 reproducerad: kortet ritas vid boot och är borta efter "${tappat}". checkTrialNotice() anropas bara från boot (portal/app.js:1421) och ritar in i .ws, som refreshSidebar() bygger om.`);
  } else anteckna("ok", "Kortet överlevde hela genomgången.");
} else if (!DEMO) {
  console.log(`${C.dim}
Inget provmånadskort under körningen — kör satt-upp-lokalt.mjs med --plan trial --dagar 27 för att framkalla det.${C.av}`);
}

console.log(`${C.fet}\nKonsol och nät${C.av}`);
if (konsolfel.length) {
  console.log(`  ${C.röd}${konsolfel.length} konsolfel:${C.av}`);
  for (const f of [...new Set(konsolfel)].slice(0, 10)) console.log(`    ${C.dim}${f.slice(0, 200)}${C.av}`);
} else console.log(`  ${C.grön}Inga konsolfel.${C.av}`);
if (nätfel.length) {
  console.log(`  ${C.gul}${nätfel.length} misslyckade anrop:${C.av}`);
  for (const f of [...new Set(nätfel)].slice(0, 10)) console.log(`    ${C.dim}${f.slice(0, 200)}${C.av}`);
}

await webbläsare.close();
if (server) server.close();

const fel = fynd.filter((f) => f.nivå === "fel").length;
const varn = fynd.filter((f) => f.nivå === "varning").length;
console.log(`\n${fel ? C.röd + C.fet + fel + " fel" + C.av : C.grön + "Inga fel" + C.av}, ${varn} varning(ar). Skärmbilder i ${UT}`);
console.log(`${C.dim}Titta på bilderna. Skriptet ser att något RITADES — inte att det ser rätt ut.${C.av}`);
process.exit(fel ? 1 : 0);
