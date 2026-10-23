// Skärmbilder och konsolkontroll för design/13-kontoren.html.
// Kör: node design/skisser-ut/13/skarmbilder.mjs
import { chromium } from "../../../node_modules/playwright/index.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const har = path.dirname(fileURLToPath(import.meta.url));
const sida = pathToFileURL(path.resolve(har, "../../13-kontoren.html")).href;
const browser = await chromium.launch();
const fel = [];
const fall = [
  ["desk", 1280, 800], ["mobil", 390, 780],
];
for (const [namn, w, h] of fall) {
  for (const niva of [1, 3]) {
    for (const rum of ["vd", "assistent"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") fel.push(`${namn} n${niva} ${rum}: ${m.text()}`); });
      p.on("pageerror", (e) => fel.push(`${namn} n${niva} ${rum}: ${e.message}`));
      p.on("requestfailed", (r) => fel.push(`${namn} n${niva} ${rum}: misslyckad ${r.url()}`));
      await p.goto(`${sida}?niva=${niva}&rum=${rum}`);
      await p.waitForLoadState("networkidle");
      await p.screenshot({ path: path.join(har, `${namn}-niva${niva}-${rum}.png`), fullPage: true });
      const bred = await p.evaluate(() => document.documentElement.scrollWidth);
      if (bred > w) fel.push(`${namn} n${niva} ${rum}: horisontell scroll ${bred}px`);
      await ctx.close();
    }
  }
}
// Interaktion: växeln, dörrarna, godkänn, anställ alla, kandidaten ur scen 12, mobilens planlista.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push("interaktion: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") fel.push("interaktion: " + m.text()); });
  await p.addInitScript(() => localStorage.setItem("atb_skiss_anstalld", JSON.stringify({ chef: "Åsa", firma: "Åsas Måleri <b>", namn: "Leila", avatarN: 11, gunnarN: 3, sparad: 1 })));
  await p.goto(sida);
  await p.click("#nastaKnapp");
  const rubrik = await p.textContent("#rubrik");
  const forifyllt = await p.inputValue("#skrivText");
  await p.fill("#skrivText", "Taket är 140 kvadrat.");
  await p.press("#skrivText", "Enter");
  await p.waitForTimeout(900);
  const repliker = await p.locator(".repl").count();
  await p.click(".vaxel [data-niva='3']");
  await p.click("#alla"); await p.click("#allaJa");
  await p.waitForTimeout(1600);
  await p.screenshot({ path: path.join(har, "desk-niva3-anstall-alla.png"), fullPage: true });
  const slackta = await p.locator(".rumknapp.slackt, .rumknapp.kanslas").count();
  await p.click(".rumknapp >> text=VD-kontoret");
  await p.click("#nastaKnapp");
  await p.click("[data-godkann='u-offert']");
  await p.screenshot({ path: path.join(har, "desk-niva3-godkant.png"), fullPage: true });
  const nasta = await p.textContent(".nasta h2");
  const firma = await p.textContent("#firmaTopp");
  // specialistrum och mötesrum
  await p.click(".rumknapp >> text=Bertil");
  await p.screenshot({ path: path.join(har, "desk-niva3-specialist.png"), fullPage: true });
  await p.click(".rumknapp >> text=Mötesrummet");
  await p.screenshot({ path: path.join(har, "desk-niva3-motesrum.png"), fullPage: true });
  console.log({ rubrik, forifyllt, repliker, slackta, nasta, firma });
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push("mobil: " + e.message));
  await p.goto(sida + "?niva=1");
  await p.click("#planknapp");
  await p.screenshot({ path: path.join(har, "mobil-niva1-planlistan.png"), fullPage: false });
  await p.click(".rumknapp >> text=VD-assistenten");
  const rubrik = await p.textContent("#rubrik");
  const oppen = await p.evaluate(() => document.getElementById("plan").classList.contains("oppen"));
  console.log({ mobilRubrik: rubrik, planOppenEfterKlick: oppen });
  await ctx.close();
}
await browser.close();
console.log(fel.length ? "FEL:\n" + fel.join("\n") : "Inga konsolfel, inga sidfel, ingen horisontell scroll.");
