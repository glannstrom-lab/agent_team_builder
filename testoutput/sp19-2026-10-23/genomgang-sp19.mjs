// SP19 + SP9 med ögon (2026-10-23). Kör mot en redan startad `npm run dev:cf`.
//
//   node testoutput/sp19-2026-10-23/genomgang-sp19.mjs <cookie-utan-plan> <cookie-med-plan>
//
// Fixturerna (lokala D1) lades upp med satt-upp-lokalt.mjs:
//   sp19UtanPlanKallarenNord01  — restaurang, utan hiringPlan
//   sp19PlanprovRonnbergsBygg01 — hantverkare + hiringPlan (offert, ata, vd)
// Chatten används för tre–fyra svar och ett möte (~en handfull öre).

import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const UT = dirname(fileURLToPath(import.meta.url));
const BAS = "http://localhost:8788";
const [COOKIE_UTAN, COOKIE_PLAN] = process.argv.slice(2);
const UTAN = "sp19UtanPlanKallarenNord01";
const PLAN = "sp19PlanprovRonnbergsBygg01";
const MÖTE = process.argv.includes("--mote");

const fynd = [];
const ok = (t) => { fynd.push(["ok", t]); console.log("  ✔ " + t); };
const fel = (t) => { fynd.push(["fel", t]); console.log("  ✖ " + t); };
const kolla = (v, t) => (v ? ok(t) : fel(t));

const bläsare = await chromium.launch();

async function öppna(cookie, slug, viewport) {
  const ctx = await bläsare.newContext({ viewport });
  await ctx.addCookies([{ name: "atb_session", value: cookie, domain: "localhost", path: "/", httpOnly: true }]);
  const sida = await ctx.newPage();
  const konsol = [];
  sida.on("console", (m) => { if (m.type() === "error") konsol.push(m.text()); });
  sida.on("pageerror", (e) => konsol.push("pageerror: " + e.message));
  sida.on("dialog", (d) => d.accept());
  await sida.goto(`${BAS}/portal/?team=${slug}`, { waitUntil: "networkidle" });
  await sida.waitForSelector(".agent-item", { timeout: 20000 });
  await sida.waitForTimeout(900);
  // Presentationen öppnas av sig själv vid första besöket och äter klicken.
  if (await sida.$("#ovl")) { await sida.keyboard.press("Escape"); await sida.waitForTimeout(300); }
  return { ctx, sida, konsol };
}
const skott = (sida, namn, full = false) => sida.screenshot({ path: join(UT, namn + ".png"), fullPage: full });
const logg = (sida, slug) => sida.evaluate((s) => JSON.parse(localStorage.getItem("atb_firman_" + s) || "null"), slug);

async function skickaOchVänta(sida, text) {
  const före = await sida.$$eval(".msg-assistant .msg-actions", (n) => n.length);
  if (text != null) await sida.fill("#composer-input", text);
  await sida.press("#composer-input", "Enter");
  await sida.waitForFunction((n) => document.querySelectorAll(".msg-assistant .msg-actions").length > n, före, { timeout: 150000 });
  await sida.waitForTimeout(400);
}

// ── (a) team utan plan: exakt som förut ───────────────────────────────────
console.log("\n(a) befintligt team utan hiringPlan");
{
  const { ctx, sida, konsol } = await öppna(COOKIE_UTAN, UTAN, { width: 1440, height: 900 });
  await skott(sida, "a1-utan-plan-desktop");
  kolla((await sida.$$(".agent-item")).length === 4, "alla fyra agenterna i laget");
  kolla(!(await sida.$(".next-card")), "inget 'Ert nästa steg'-kort");
  kolla(!(await sida.$(".plan-list")), "ingen 'Kommer enligt planen'");
  kolla(!(await sida.$(".ws-locked")), "inga låsta paneler");
  kolla(!!(await sida.$(".intro-card")), "kom igång-listan står kvar som förut");
  kolla(!!(await sida.$("text=Håll ett möte")), "Håll ett möte finns");
  kolla((await logg(sida, UTAN)) === null, "ingen firman-logg skapas för ett team utan plan");
  kolla(konsol.filter((k) => !/404|MIME|teams\/sp19/.test(k)).length === 0, "inga konsolfel (utöver den kända 404:an för moln-team): " + konsol.join(" | "));
  await ctx.close();
}

// ── (b)(c) team med plan ──────────────────────────────────────────────────
console.log("\n(b) team med hiringPlan");
const { ctx, sida, konsol } = await öppna(COOKIE_PLAN, PLAN, { width: 1440, height: 900 });
await skott(sida, "b1-plan-start");
kolla((await sida.$$(".agent-item")).length === 1, "bara VD-assistenten i laget");
kolla((await sida.$$(".plan-item")).length === 3, "tre 'kommer enligt planen'");
const planText = await sida.$eval(".plan-list", (n) => n.innerText);
kolla(/sex timmar i veckan på offerter/.test(planText), "skälet ur planen syns");
kolla(/Kommer när: första projektet påbörjat/.test(planText), "villkoret för nästa anställning syns: " + planText.split("\n").find((r) => /Kommer när/.test(r)));
const kort = await sida.$eval("#nasta-steg-ws", (n) => n.innerText);
kolla(/Kom i gång/.test(kort), "nästa steg = kom i gång med första projektet");
kolla(/nivå 1 av 5/.test(kort), "nivån visas i ord");
kolla(!!(await sida.$(".ws-locked")), "låsta paneler ritas med villkor");
kolla(!(await sida.$(".intro-card")), "kom igång-listan ersatt av kortet");
const l0 = await logg(sida, PLAN);
kolla(l0 && l0.start > 0 && l0.handelser.length === 0, "firman-loggen startad, tom");

console.log("\n(c) godkänn → nivå 2 → anställning → introduktion");
await sida.click("#nasta-steg-ws .next-act");
const förifyllt = await sida.inputValue("#composer-input");
kolla(/första projekt/.test(förifyllt), "kortets handling förifyller samtalet med VD-assistenten");
await skickaOchVänta(sida, "Vi kör igång vårt första projekt: offerterna. Svara kort, högst fem rader: vad är första steget?");
await skott(sida, "c1-svar-med-godkann");
const godk = sida.locator(".msg-assistant .act-ok", { hasText: "Godkänn" }).last();
kolla(await godk.count() > 0, "✓ Godkänn finns under svaret");
await godk.click();
await sida.waitForTimeout(500);
let l = await logg(sida, PLAN);
kolla(l.handelser.some((e) => e.typ === "leverans_godkand" && e.agentId === "vd-assistent"), "leverans_godkand bokförd från vd-assistent");
kolla(!!(await sida.$(".msg-stamp")), "'✓ Godkänd' står kvar under svaret");
const kort2 = await sida.$eval("#nasta-steg-ws", (n) => n.innerText);
kolla(/nivå 2 av 5/.test(kort2), "nivån gick till 2: " + kort2.replace(/\n/g, " / "));
kolla(/anställa Offertskrivaren/.test(kort2), "nästa steg = anställa Offertskrivaren");
await skott(sida, "c2-niva2-dags-att-anstalla");

await sida.click("#nasta-steg-ws .next-act");
await sida.waitForSelector("#ovl");
await skott(sida, "c3-forslag-anstallning");
await sida.click("#ovl .btn-primary");
await sida.waitForTimeout(400);
await skott(sida, "c4-introduktion");
kolla(/Välkommen, Offertskrivaren/.test(await sida.$eval("#ovl-title", (n) => n.textContent)), "introduktionen öppnas efter anställningen");
await sida.click("#ovl .btn-primary");
await sida.waitForTimeout(400);
kolla((await sida.$$(".agent-item")).length === 2, "Offertskrivaren står i laget");
const uppdrag = await sida.inputValue("#composer-input");
kolla(uppdrag.length > 10, "första uppdraget förifyllt: " + uppdrag.slice(0, 80));
await skickaOchVänta(sida, uppdrag + " (Svara kort, högst sex rader.)");
await sida.locator(".msg-assistant .act-ok", { hasText: "Godkänn" }).last().click();
await sida.waitForTimeout(500);
l = await logg(sida, PLAN);
kolla(l.handelser.some((e) => e.typ === "leverans_godkand" && e.agentId === "offert"), "specialistens leverans godkänd");
const kort3 = await sida.$eval("#nasta-steg-ws", (n) => n.innerText);
kolla(/nivå 3 av 5/.test(kort3), "nivån gick till 3");
await skott(sida, "c5-niva3");

console.log("\n(c) rutin klar");
const rutin = sida.locator(".routine-item").first();
kolla(await rutin.count() > 0, "rutinerna upplåsta på nivå 3");
await rutin.click();
await sida.waitForTimeout(300);
const rp = await sida.inputValue("#composer-input");
await skickaOchVänta(sida, rp.replace(/\[fyll i[^\]]*\]/g, "inga just nu") + "\n\n(Svara kort, högst fem rader.)");
const rk = sida.locator(".msg-assistant .act-ok", { hasText: "Rutinen klar" }).last();
kolla(await rk.count() > 0, "✓ Rutinen klar finns under rutinens svar");
const lFöre = (await logg(sida, PLAN)).handelser.filter((e) => e.typ === "rutin_klar").length;
kolla(lFöre === 0, "att skicka rutinen bokförde ingen rutin_klar");
await rk.click();
await sida.waitForTimeout(500);
l = await logg(sida, PLAN);
kolla(l.handelser.filter((e) => e.typ === "rutin_klar").length === 1, "rutin_klar bokförd först vid kundens bekräftelse");
const kort4 = await sida.$eval("#nasta-steg-ws", (n) => n.innerText);
kolla(/två veckor till/.test(kort4), "trappan säger vad som återstår: " + kort4.split("\n").pop());
await skott(sida, "c6-rutin-klar");

if (MÖTE) {
  console.log("\n(c) möte → beslut → rutin (via Visa allt)");
  await sida.click("text=Anställ alla nu");
  await sida.waitForTimeout(400);
  kolla((await sida.$$(".agent-item")).length === 4, "Anställ alla nu: fyra i laget");
  await sida.click(".ws-showall");
  await sida.waitForTimeout(300);
  await sida.click("text=Håll ett möte");
  await sida.fill("#ovl textarea", "Ska vi höja timpriset med 5 % från januari? Svara kort.");
  await sida.click("#ovl .btn-primary");
  await sida.waitForFunction(() => [...document.querySelectorAll(".act-ok")].some((b) => /bestämde vi/.test(b.textContent)), null, { timeout: 240000 });
  await sida.locator(".act-ok", { hasText: "bestämde vi" }).last().click();
  await sida.fill(".beslut-form input", "Vi höjer timpriset med 5 % från 1 januari");
  await sida.click(".beslut-form .act-ok");
  await sida.waitForTimeout(400);
  await skott(sida, "c7-motesbeslut");
  await sida.locator(".act-ok", { hasText: "Gör beslutet till en rutin" }).last().click();
  await sida.click("#ovl .btn-primary");
  await sida.waitForTimeout(500);
  l = await logg(sida, PLAN);
  kolla(l.handelser.some((e) => e.typ === "mote_beslut"), "mote_beslut bokfört");
  kolla(l.handelser.some((e) => e.typ === "rutin_ur_beslut"), "rutin_ur_beslut bokfört");
  kolla(!!(await sida.$('.routine-item[data-label^="Vi höjer timpriset"]')), "rutinen ur beslutet står bland rutinerna");
  await skott(sida, "c8-rutin-ur-beslut");
}
console.log("\n  händelseloggen:", JSON.stringify((await logg(sida, PLAN)).handelser.map((e) => e.typ + (e.agentId ? "@" + e.agentId : ""))));
kolla(konsol.filter((k) => !/404|MIME|teams\/sp19/.test(k)).length === 0, "inga konsolfel: " + konsol.join(" | "));
await ctx.close();

// ── (d) mobil 390 px ──────────────────────────────────────────────────────
console.log("\n(d) mobil 390 px");
for (const [cookie, slug, namn] of [[COOKIE_PLAN, PLAN, "d1-mobil-plan"], [COOKIE_UTAN, UTAN, "d2-mobil-utan-plan"]]) {
  const m = await öppna(cookie, slug, { width: 390, height: 844 });
  await skott(m.sida, namn);
  const bredd = await m.sida.evaluate(() => document.documentElement.scrollWidth);
  kolla(bredd <= 390, `${slug}: ingen sidledsrullning (${bredd} px)`);
  if (slug === PLAN) {
    kolla(await m.sida.isVisible("#nasta-steg-main"), "kortet syns ovanför samtalet på mobil");
    await m.sida.click(".mb-home");
    await m.sida.waitForTimeout(400);
    await skott(m.sida, "d3-mobil-drawer", true);
  } else kolla(!(await m.sida.$("#nasta-steg-main")), "inget kort på mobil för team utan plan");
  kolla(m.konsol.filter((k) => !/404|MIME|teams\/sp19/.test(k)).length === 0, "inga konsolfel på mobil: " + m.konsol.join(" | "));
  await m.ctx.close();
}

await bläsare.close();
const antalFel = fynd.filter((f) => f[0] === "fel").length;
console.log(`\n${fynd.length - antalFel} ok, ${antalFel} fel`);
process.exit(antalFel ? 1 : 0);
