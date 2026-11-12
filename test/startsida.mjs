// Startsidan (index.html) — öppningsscenen.
//
// U1 (utveckla-projektet omg 1, 2026-11-12): två experter tryckte Enter på
// slutkortet, där kortet självt säger "klicka för att fortsätta", och hamnade
// i filmens början — sex minuter förlorade. Fokus låg på "Spela igen". De här
// proven läser källan; själva flödet klickades igenom med Playwright.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SIDA = readFileSync("index.html", "utf8");

test("U1: slutkortet lägger fokus på Fortsätt, aldrig på Spela igen", () => {
  assert.match(SIDA, /\$\("vidareLank"\)\.focus\(/, "fokus ska ligga på Fortsätt intervjun");
  assert.doesNotMatch(SIDA, /\$\("igen"\)\.focus\(/, "Spela igen får inte ta fokus — Enter startar då om filmen");
});

test("U1: film-tangenten släpper igenom Enter på en länk", () => {
  const rad = SIDA.split("\n").find((r) => r.includes('e.key === "Enter"') && r.includes("closest("));
  assert.ok(rad, "hittade inte film-tangentens villkor");
  assert.match(rad, /closest\("[^"]*\ba\b[^"]*"\)/, "länkar måste undantas, annars gör Enter på Fortsätt ingenting");
});

test("U1: Fortsätt står före Spela igen i tabbordningen", () => {
  const i = SIDA.indexOf('id="vidareLank"'), j = SIDA.indexOf('id="igen"');
  assert.ok(i > 0 && j > i, "Fortsätt ska komma före Spela igen");
});

test("U3: första vyn säger vad tjänsten gör", () => {
  assert.match(SIDA, /id="vadvigor"/);
  assert.match(SIDA, /offerter/);
});
