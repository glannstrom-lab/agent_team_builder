// Tester för planens livscykel — kör med `npm test`.
//
// Varför just de här: fram till 2026-08-07 fanns spärrlistan över avstängda
// planer i koden, men ingen kod skrev någonsin värdena. Regeln var alltså
// korrekt och verkningslös på samma gång, och det syntes inte någonstans —
// varken i gränssnittet, i testerna eller i loggen. Ett engångsköp på 90 kr
// gav portalåtkomst i evighet, vilket gjorde 290-nivån osäljbar.
//
// Felet gick inte att se genom att läsa någon enskild fil. Det bodde i
// avståndet mellan två: webhooken som skrev planen och proxyn som läste den.
// Testerna nedan står i det avståndet.

import { test } from "node:test";
import assert from "node:assert";
import {
  planState,
  wasEverPaid,
  TRIAL_DAYS,
  TRIAL_PLANS,
  PLANS_WITHOUT_PORTAL,
  PLAN_REASON,
} from "../functions/api/_plan.js";
import { subscriptionOf } from "../functions/api/stripe-webhook.js";
import {
  purchasedAt,
  withinWithdrawalWindow,
  WITHDRAWAL_DAYS,
} from "../functions/api/subscription/withdraw.js";

const NU = 1786000000000;            // fast klocka: testerna får aldrig bero på när de körs
const DAG = 86_400_000;
const dagarSedan = (n) => NU - n * DAG;

// ── provmånaden ───────────────────────────────────────────────────────────

test("en provmånad som pågår släpps igenom", () => {
  const p = planState({ plan: "trial", created_at: dagarSedan(3) }, NU);
  assert.equal(p.ok, true);
  assert.equal(p.expire, false);
  assert.equal(p.endsAt, dagarSedan(3) + TRIAL_DAYS * DAG);
});

test("provmånaden tar slut — det är hela poängen med passet", () => {
  const p = planState({ plan: "trial", created_at: dagarSedan(31) }, NU);
  assert.equal(p.ok, false, "31 dagar gammal provmånad ska vara slut");
  assert.equal(p.reason, "expired");
  assert.equal(p.expire, true, "raden ska skrivas om till 'expired'");
});

test("gränsen går exakt på dygn 30, inte 29 och inte 31", () => {
  const start = NU - TRIAL_DAYS * DAG;
  assert.equal(planState({ plan: "trial", created_at: start + 1 }, NU).ok, true, "en millisekund kvar = fortfarande igång");
  assert.equal(planState({ plan: "trial", created_at: start }, NU).ok, false, "exakt 30 dygn = slut");
});

test("det gamla provmånadsnamnet räknas också", () => {
  // "trial-byo" ligger på team som köptes före omläggningen 2026-08-06. Glöms
  // det bort får just de kunderna evig åtkomst — alltså precis den bugg som
  // passet finns för att laga, kvar för en delmängd.
  assert.equal(planState({ plan: "trial-byo", created_at: dagarSedan(31) }, NU).ok, false);
  assert.ok(TRIAL_PLANS.has("trial-byo"));
});

test("provmånad utan startdatum släpps igenom — hellre det än att låsa ute en som betalat", () => {
  for (const created of [null, 0, undefined]) {
    const p = planState({ plan: "trial", created_at: created }, NU);
    assert.equal(p.ok, true, "created_at: " + created);
    assert.equal(p.expire, false);
  }
});

// ── löpande och handupplagda ──────────────────────────────────────────────

test("ett abonnemang tar inte slut av sig självt, hur gammalt det än är", () => {
  const p = planState({ plan: "standard", created_at: dagarSedan(900) }, NU);
  assert.equal(p.ok, true);
  assert.equal(p.endsAt, null);
});

test("tomt plan-fält räknas som köpt — provision.mjs sätter inget", () => {
  for (const plan of [null, "", undefined]) {
    assert.equal(planState({ plan, created_at: dagarSedan(900) }, NU).ok, true, "plan: " + plan);
  }
});

// ── avstängda ─────────────────────────────────────────────────────────────

test("varje avstängt värde stänger dörren", () => {
  for (const plan of PLANS_WITHOUT_PORTAL) {
    const p = planState({ plan, created_at: dagarSedan(1) }, NU);
    assert.equal(p.ok, false, plan + " ska inte släppas igenom");
    assert.equal(p.reason, plan);
    assert.equal(p.expire, false, plan + " är redan skriven — skriv inte om den");
  }
});

test("varje avstängt värde har en förklaring en människa kan läsa", () => {
  // Loggen är det enda stället en människa ser varför en kund blev utelåst.
  // Ett värde utan text betyder ett supportärende som börjar med gissningar.
  for (const plan of PLANS_WITHOUT_PORTAL) {
    assert.ok(PLAN_REASON[plan], plan + " saknar förklaring i PLAN_REASON");
  }
});

test("spärrlistan innehåller past_due — annars fungerar en obetald faktura som betald", () => {
  assert.ok(PLANS_WITHOUT_PORTAL.has("past_due"));
});

// ── vägen tillbaka ────────────────────────────────────────────────────────

test("ett team som varit betalt går att fortsätta med", () => {
  // Styr vilken knapp den låsta vyn visar. Fel svar här betyder antingen att
  // en kund ombeds köpa något hon redan äger, eller att en utgången provmånad
  // saknar väg vidare — och då är utgången bara en stängd dörr.
  for (const plan of ["trial", "trial-byo", "standard", "buy", ...PLANS_WITHOUT_PORTAL]) {
    assert.equal(wasEverPaid(plan), true, plan + " har varit betalt");
  }
  for (const plan of [null, "", "nagot-annat"]) {
    assert.equal(wasEverPaid(plan), false, "plan: " + plan);
  }
});

// ── kopplingen till Stripe ────────────────────────────────────────────────

test("abonnemanget hittas i båda fakturaformaten", () => {
  // Stripe flyttade invoice.subscription till parent.subscription_details i
  // API-versionerna från 2025. Läser vi bara det ena formatet blir
  // invoice.payment_failed en händelse som tyst inte träffar något team — och
  // en obetald faktura ser då likadan ut som en betald.
  assert.equal(subscriptionOf({ subscription: "sub_gammal" }), "sub_gammal");
  assert.equal(
    subscriptionOf({ parent: { subscription_details: { subscription: "sub_ny" } } }),
    "sub_ny"
  );
  assert.equal(subscriptionOf({}), null);
  assert.equal(subscriptionOf(null), null);
  assert.equal(subscriptionOf({ subscription: null, parent: {} }), null);
});

// ── de två sanningarna om samma datum ─────────────────────────────────────

test("portalen och servern räknar provmånaden lika", async () => {
  // portal/app.js har en egen TRIAL_LENGTH_DAYS för kortet i arbetsytan, och
  // den kan inte importeras hit (webbläsarglobaler). Glider talen isär säger
  // kortet "fem dagar kvar" samma dag som spärren slår till, och kunden möts
  // av ett löfte och en stängd dörr på samma skärm.
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../portal/app.js", import.meta.url), "utf8");
  const m = /const TRIAL_LENGTH_DAYS = (\d+)/.exec(src);
  assert.ok(m, "TRIAL_LENGTH_DAYS hittades inte i portal/app.js");
  assert.equal(Number(m[1]), TRIAL_DAYS, "portalen och _plan.js måste vara överens om provmånadens längd");
});

// ── ångerrätten (BL2) ─────────────────────────────────────────────────────
//
// Samma fällatyp som resten av filen: villkoren har lovat 14 dagars ångerrätt
// hela tiden, men ingen kod räknade dagarna och ingen knapp fanns. Nu räknas
// de på två ställen — i rutten och i portalen — och de måste räkna likadant.
// Räknar portalen fel åt det generösa hållet visas en knapp som rutten
// avvisar; räknar den fel åt andra hållet döljs en rättighet kunden har.

test("fristen räknas från det senaste köpet, inte från när teamet byggdes", () => {
  const dag = 86400000;
  // Provmånad köpt för 40 dagar sedan, uppgraderad till standard i går.
  const rad = { created_at: NU - 40 * dag, plan_changed_at: NU - 1 * dag };
  assert.equal(purchasedAt(rad), NU - 1 * dag,
    "uppgraderingen är ett nytt avtal — fristen ska löpa från den, inte från bygget");
  assert.equal(withinWithdrawalWindow(rad, NU).open, true);
});

test("utan uppgradering gäller teamets egen startpunkt", () => {
  const rad = { created_at: NU - 3 * 86400000, plan_changed_at: null };
  assert.equal(withinWithdrawalWindow(rad, NU).open, true, "tre dagar in — fristen löper");
});

test("dag 15 är fristen ute", () => {
  const rad = { created_at: NU - 15 * 86400000 };
  assert.equal(withinWithdrawalWindow(rad, NU).open, false);
});

test("fristen är inkluderande ända fram till sista sekunden", () => {
  const rad = { created_at: NU - WITHDRAWAL_DAYS * 86400000 + 1000 };
  assert.equal(withinWithdrawalWindow(rad, NU).open, true, "en sekund kvar är fortfarande kvar");
});

test("utan startpunkt gissar vi inte", () => {
  // Team upplagda för hand med scripts/provision.mjs saknar tidsstämplar.
  // Att gissa "köpt i dag" hade gett evig ångerrätt; att gissa "köpt för länge
  // sedan" hade tagit bort den. Vi svarar nej och låter en människa avgöra —
  // rutten svarar i det läget med en väg till info@, inte med en stängd dörr.
  assert.equal(withinWithdrawalWindow({}, NU).open, false);
  assert.equal(purchasedAt(null), 0);
});

test("portalen och rutten räknar med samma antal dagar", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../portal/app.js", import.meta.url), "utf8");
  const m = /const WITHDRAWAL_DAYS = (\d+)/.exec(src);
  assert.ok(m, "WITHDRAWAL_DAYS hittades inte i portal/app.js — ångerknappen saknar frist");
  assert.equal(Number(m[1]), WITHDRAWAL_DAYS, "portalen och withdraw.js måste vara överens om fristen");
});

test("villkoren säger samma antal dagar som koden", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../villkor.html", import.meta.url), "utf8");
  assert.ok(src.includes(`ångra köpet inom ${WITHDRAWAL_DAYS} dagar`),
    "villkor.html §15 och koden säger olika om ångerfristen");
  // Och att knappen faktiskt är utpekad i villkoren: lagen vill ha den
  // lättåtkomlig, inte bara existerande.
  assert.ok(src.includes("Ångra köpet"), "villkoren nämner inte knappen");
});
