// Skärmbild av svarsraden i portalen, i drift, som inloggad simuleringskund.
import { chromium } from "playwright";
import fs from "fs";
const s = JSON.parse(fs.readFileSync(process.env.SESS, "utf8"));
const team = JSON.parse(fs.readFileSync("testoutput/sim-2026-09/bygg/team.json", "utf8"));
const hist = { [team.entryAgent]: [
  { role: "user", content: "Skriv ett kort sms till familjen Karlsson om ÄTA för fuktskadan.", at: Date.now() - 60000 },
  { role: "assistant", content: "Hej Karlsson!\n\nVid rivningen hittade vi en fuktskada i bjälklaget vid golvbrunnen. Att åtgärda den kostar cirka 18 000 kr inkl. moms före ROT.\n\nSvara **OK** så går vi vidare.\n\n/Jonas, Bergströms Bygg", at: Date.now() - 50000 },
] };
const b = await chromium.launch();
const fel = [];
for (const [namn, vp] of [["desktop", { width: 1400, height: 900 }], ["mobil", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, ...(namn === "mobil" ? { hasTouch: true, isMobile: true } : {}) });
  await ctx.addCookies([{ name: "atb_session", value: s.token, domain: "mittaiteam.se", path: "/", secure: true, httpOnly: true }]);
  await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); localStorage.setItem("atb_intro_seen", "1"); } catch (_) {} }, ["atb_hist_" + s.slug, JSON.stringify(hist)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(namn + ": " + e.message));
  p.on("console", (m) => { if (m.type() === "error") fel.push(namn + " konsol: " + m.text().slice(0, 150)); });
  await p.goto("https://mittaiteam.se/portal/?team=" + s.slug, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const ovl = await p.$(".ovl-close, .ovl .close, button[aria-label='Stäng']"); if (ovl) await ovl.click().catch(() => {});
  await p.waitForTimeout(500);
  const acts = await p.$$(".msg-actions");
  const knappar = acts.length ? await acts[acts.length - 1].$$eval("button", (bs) => bs.map((x) => x.textContent.trim())) : [];
  console.log(namn, "knappar:", knappar.join(" | "));
  const rad = acts.length ? acts[acts.length - 1] : null;
  if (rad) { const box = await rad.evaluate((e) => e.closest(".msg, .row, div").getBoundingClientRect().toJSON()); console.log(namn, "radens höjd:", Math.round(box.height), "px"); }
  const bubbla = await p.$$(".msg");
  if (namn === "desktop" && bubbla.length) await bubbla[bubbla.length - 1].hover();
  const mer = await p.$$("button:has-text(\"⋯ Mer\")"); if (mer.length) await mer[mer.length - 1].click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `testoutput/sim-2026-09/skarmbilder/svarsrad-${namn}.png`, fullPage: false });
  await ctx.close();
}
await b.close();
console.log("fel:", fel.length ? fel.join("\n  ") : "inga");
