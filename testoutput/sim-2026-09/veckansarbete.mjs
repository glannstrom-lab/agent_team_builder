// Skärmbild av Veckans arbete i drift (RE5), som inloggad simuleringskund.
import { chromium } from "playwright";
import fs from "fs";
const s = JSON.parse(fs.readFileSync(process.env.SESS, "utf8"));
const team = JSON.parse(fs.readFileSync("testoutput/sim-2026-09/bygg2/team.json", "utf8"));
const nu = Date.now();
const hist = { [team.entryAgent]: [
  { role: "user", content: "Skriv ÄTA-sms till Karlssons", at: nu - 3600000 },
  { role: "assistant", content: "## ÄTA-bekräftelse\nHej Karlsson!…", at: nu - 3500000 },
] };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.addCookies([{ name: "atb_session", value: s.token, domain: "mittaiteam.se", path: "/", secure: true, httpOnly: true }]);
await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (_) {} }, ["atb_hist_" + s.slug, JSON.stringify(hist)]);
const p = await ctx.newPage();
const fel = [];
p.on("pageerror", (e) => fel.push(e.message));
await p.goto("https://mittaiteam.se/portal/?team=" + s.slug, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const stäng = await p.$("#ovl-close, .ovl-x, button[aria-label='Stäng']"); if (stäng) await stäng.click().catch(() => {});
const mer = await p.$("button:has-text('Visa hela arbetsytan')"); if (mer) { await mer.click(); await p.waitForTimeout(400); }
const sidorader = await p.$$eval(".ws button, .sidebar button", (bs) => bs.map((x) => x.textContent.trim()).filter(Boolean));
console.log("sidopanelen har 'Rapport till chefen':", sidorader.some((t) => /Rapport till chefen/.test(t)));
await p.click("text=Veckans arbete");
await p.waitForTimeout(600);
const knappar = await p.$$eval(".ovl button", (bs) => bs.map((x) => x.textContent.trim()));
console.log("i Veckans arbete:", knappar.filter((t) => /Rapport|levererat|Kvartalet|mejl/.test(t)).join(" | "));
await p.screenshot({ path: "testoutput/sim-2026-09/skarmbilder/veckans-arbete.png" });
await p.click("text=📣 Rapport till chefen");
await p.waitForTimeout(800);
console.log("rapporten öppnade något:", await p.evaluate(() => !!document.querySelector(".ovl") || document.querySelectorAll(".msg").length > 2));
console.log("sidfel:", fel.length ? fel.join(" | ") : "inga");
await b.close();
