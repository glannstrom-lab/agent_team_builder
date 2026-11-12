// Startsidan (index.html) — Huset.
//
// 2026-11-12 (Mikael: "bygg detta på riktigt, ordentligt och snyggt"):
// öppningsscenen ersattes av skissen design/omg2/e-huset.html (#start). De här
// proven läser källan; layouten provades med Playwright i tre bredder.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const SIDA = readFileSync("index.html", "utf8");
const STIL = (SIDA.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
const KROPP = SIDA.slice(SIDA.indexOf("<body"));

test("Huset: huset och de tre våningsskyltarna finns, och bilden ligger i bild/huset", () => {
  assert.match(KROPP, /<img[^>]+src="\/bild\/huset\/huset\.webp"/);
  assert.ok(existsSync("bild/huset/huset.webp"));
  for (const v of ["Våning 1", "Våning 2", "Våning 3"]) assert.ok(KROPP.includes(v), `${v} saknas`);
});

test("Huset: åtta rumskort, och varje rumsbild finns på disken", () => {
  const kort = [...KROPP.matchAll(/<li class="rumkort"><img src="\/(bild\/huset\/rum-[a-z]+\.webp)"/g)];
  assert.equal(kort.length, 8, "ett rum per jobb — åtta kort");
  for (const [, fil] of kort) assert.ok(existsSync(fil), `${fil} finns inte`);
  assert.equal(new Set(kort.map((k) => k[1])).size, 8, "samma rum två gånger");
});

test("Huset: Flytta in går till Builderns intervju, och de tre stegen står kvar", () => {
  const cta = [...KROPP.matchAll(/<a class="knapp"[^>]*href="([^"]+)"[^>]*>Flytta in — gratis<\/a>/g)];
  assert.ok(cta.length >= 2, "både heron och slutrutan ska ha knappen");
  for (const [, href] of cta) assert.equal(href, "/builder/?intervju=1");
  for (const s of ["Flytta in", "Inred", "Bygg ut", ">3+<"]) assert.ok(KROPP.includes(s), `steget ${s} saknas`);
});

test("Huset: nav och sidfot pekar rätt, och prislänken träffar ett id som finns i om.html", () => {
  assert.match(KROPP, /href="\/om\.html">Så funkar det</);
  assert.match(KROPP, /href="\/portal\/">Logga in</);
  const pris = KROPP.match(/href="\/om\.html#([\w-]+)">Priser</);
  assert.ok(pris, "Priser-länken saknas");
  assert.match(readFileSync("om.html", "utf8"), new RegExp(`id="${pris[1]}"`), "om.html saknar ankaret");
  for (const l of ["villkor.html", "integritet.html", "mailto:info@mittaiteam.se"]) assert.ok(KROPP.includes(`href="${l}"`), `sidfoten saknar ${l}`);
  assert.match(KROPP, /Andra projekt av Glänne &amp; Söner/);
});

test("Huset: inloggad besökare med team skickas fortfarande rakt till portalen", () => {
  assert.match(SIDA, /fetch\("\/api\/auth\/me"/);
  assert.match(SIDA, /location\.replace\("\/portal\/\?team=" \+ encodeURIComponent\(team\[0\]\.slug\)\)/);
  assert.match(SIDA, /setTimeout\(visa, 1500\)/, "sidan får aldrig stängas ute av en långsam API");
});

test("Huset: sidans bakgrund är bildernas, utan mix-blend-mode", () => {
  assert.match(STIL, /--bg:#FAF9F7/i);
  assert.match(STIL, /body\{[^}]*background:var\(--bg\)/);
  assert.doesNotMatch(SIDA, /mix-blend-mode/, "bilderna är ritade på sidans bakgrund — ingen blandning behövs");
});

test("Huset: inga mono-etiketter, och högst en överrad per avsnitt", () => {
  assert.doesNotMatch(STIL, /monospace|IBM Plex Mono|var\(--mono\)/, "inga mono-etiketter på startsidan");
  for (const avsnitt of KROPP.split(/<section\b/).slice(1)) {
    const n = (avsnitt.match(/class="ovre"/g) || []).length;
    assert.ok(n <= 1, `ett avsnitt har ${n} överrader`);
  }
});

test("Huset: öppningsscenen är borttagen från startsidan", () => {
  assert.doesNotMatch(SIDA, /Gunnar|akt-film|atb_scen/);
});
