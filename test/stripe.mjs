// Tester för köpflödets kryptografi — kör med `npm test`.
//
// Varför just de här funktionerna: `/api/stripe-webhook` är öppen för hela
// internet och skapar konton och team. Signaturkontrollen ÄR betalningsbeviset.
// Går den sönder — en refaktor som råkar jämföra fel sträng, ett tidsfönster
// som tas bort, en tom hemlighet som passerar — kan vem som helst som känner
// till adressen beställa gratis, och ingenting i gränssnittet skulle visa det.
// Det är precis den sortens fel som inte upptäcks förrän någon utnyttjar det.
//
// Slug-generatorn testas för att den är det enda som skyddar ett moln-team som
// nås utan inloggning. En slug med för lite slump, eller med snedfördelade
// tecken, är en gissningsbar dörr till någon annans data.

import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { verifyStripeSignature, newSlug, TIERS } from "../functions/api/_stripe.js";

const SECRET = "whsec_testhemlighet_som_aldrig_anvants_skarpt";
const BODY = '{"id":"evt_1","type":"checkout.session.completed"}';

// Samma HMAC som Stripe räknar: hex av SHA-256 över `${t}.${rå kropp}`.
async function sign(body, secret, timestamp) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + "." + body));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const now = () => 1786000000000; // fast klocka: testerna får aldrig bero på när de körs
const nowSec = () => Math.floor(now() / 1000);

async function header(body = BODY, secret = SECRET, t = nowSec()) {
  return `t=${t},v1=${await sign(body, secret, String(t))}`;
}

test("giltig signatur släpps igenom", async () => {
  assert.equal(await verifyStripeSignature(BODY, await header(), SECRET, now), true);
});

test("ändrad kropp avvisas — det är hela poängen", async () => {
  const h = await header();
  const manipulerad = BODY.replace("evt_1", "evt_2");
  assert.equal(await verifyStripeSignature(manipulerad, h, SECRET, now), false);
});

test("fel hemlighet avvisas", async () => {
  assert.equal(await verifyStripeSignature(BODY, await header(), "whsec_nagot_annat", now), false);
});

test("för gammal tidsstämpel avvisas (uppspelningsskydd)", async () => {
  const gammal = nowSec() - 400; // toleransen är 300 s
  assert.equal(await verifyStripeSignature(BODY, await header(BODY, SECRET, gammal), SECRET, now), false);
});

test("tidsstämpel långt fram i tiden avvisas", async () => {
  const framtida = nowSec() + 400;
  assert.equal(await verifyStripeSignature(BODY, await header(BODY, SECRET, framtida), SECRET, now), false);
});

test("signatur inom toleransen släpps igenom", async () => {
  const nyss = nowSec() - 120;
  assert.equal(await verifyStripeSignature(BODY, await header(BODY, SECRET, nyss), SECRET, now), true);
});

test("flera v1 accepteras om en stämmer — hemligheten kan roteras", async () => {
  const t = nowSec();
  const giltig = await sign(BODY, SECRET, String(t));
  const h = `t=${t},v1=0000000000000000000000000000000000000000000000000000000000000000,v1=${giltig}`;
  assert.equal(await verifyStripeSignature(BODY, h, SECRET, now), true);
});

test("saknad eller trasig rubrik avvisas", async () => {
  for (const h of [null, "", "t=1", "v1=abc", "skräp", `t=inte-ett-tal,v1=abc`]) {
    assert.equal(await verifyStripeSignature(BODY, h, SECRET, now), false, `rubrik: ${h}`);
  }
});

test("tom hemlighet avvisas — annars vore osatt secret detsamma som öppen dörr", async () => {
  assert.equal(await verifyStripeSignature(BODY, await header(), "", now), false);
  assert.equal(await verifyStripeSignature(BODY, await header(), undefined, now), false);
});

test("slug matchar mönstret som /api/teams/:slug kräver", () => {
  const mönster = /^[A-Za-z0-9_-]{22,64}$/; // samma som functions/api/teams/[slug].js
  for (let i = 0; i < 200; i++) assert.match(newSlug(), mönster);
});

test("slugar upprepas inte", () => {
  const sedda = new Set();
  for (let i = 0; i < 2000; i++) sedda.add(newSlug());
  assert.equal(sedda.size, 2000);
});

test("slugens tecken är jämnt fördelade — ingen modulo-bias", () => {
  // 62 tecken, 22 per slug. Med 2000 slugar blir väntevärdet ~710 per tecken.
  // Modulo på 0–255 hade gett de åtta första tecknen ~33 % fler träffar; den
  // skevheten syns tydligt långt innan den här gränsen slår till.
  const räknare = new Map();
  for (let i = 0; i < 2000; i++) for (const c of newSlug()) räknare.set(c, (räknare.get(c) || 0) + 1);
  const värden = [...räknare.values()];
  assert.equal(räknare.size, 62, "alla 62 tecken ska förekomma");
  assert.ok(Math.max(...värden) / Math.min(...värden) < 1.5, "för ojämn fördelning: " + Math.max(...värden) + "/" + Math.min(...värden));
});

// ── prislistan på tre ställen (D6) ──────────────────────────────────────────
//
// Testet ovan kollade att nivåernas NAMN inte växer, men aldrig beloppen. Det
// är beloppen som står på tre ställen och som CLAUDE.md kräver ska ändras samma
// dag: prislistan i index.html, avsnitt 4 i villkor.html och `TIERS` här.
// Glider de isär ser kunden ett pris, villkoren ett annat, och kassan tar ett
// tredje — och det upptäcks av den som betalar.
//
// HTML-kommentarerna räknas bort. De innehåller med flit de STRUKNA beloppen
// ("190, 490 och engångsköpet på 4 990 UTGÅR — skriv inte tillbaka dem"), och
// utan strippning hade testet fällt på sin egen varningstext.
const utanKommentarer = (fil) => readFileSync(fil, "utf8").replace(/<!--[\s\S]*?-->/g, " ");

const GÄLLANDE = [/\b90 kr/, /\b290 kr/];
// Ordgränsen är inte pynt: "290 kr".includes("90 kr") är sant, så en naiv
// substrängsökning hade sett 90-nivån i varje omnämnande av 290.
const STRUKNA = [/\b190 kr/, /\b490 kr/, /\b4\s?990/];

for (const fil of ["index.html", "villkor.html"]) {
  test(`${fil} visar de gällande beloppen och inga strukna`, () => {
    const text = utanKommentarer(fil);
    for (const r of GÄLLANDE) assert.match(text, r, `${fil} saknar ${r}`);
    for (const r of STRUKNA) {
      assert.doesNotMatch(text, r, `${fil} visar en struken prisnivå (${r}) för kunden`);
    }
  });
}

test("builderns avslutsruta erbjuder exakt de nivåer kassan känner", () => {
  // PLANS i builder.js är det kunden klickar på; TIERS är det kassan
  // accepterar. En nivå i den ena men inte den andra ger antingen en knapp som
  // ger 400, eller en säljbar nivå ingen ser.
  const src = readFileSync("builder/builder.js", "utf8");
  const block = src.slice(src.indexOf("const PLANS = ["));
  const tiers = [...block.slice(0, block.indexOf("];")).matchAll(/tier:\s*"([^"]+)"/g)].map((m) => m[1]);
  const priser = [...block.slice(0, block.indexOf("];")).matchAll(/price:\s*"([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(tiers.sort(), Object.keys(TIERS).sort(), "PLANS och TIERS har glidit isär");
  assert.deepEqual(priser, ["90 kr", "290 kr/mån"], "beloppen i builderns prisruta har ändrats");
});

test("provmånaden är ett engångsköp och standard ett abonnemang", () => {
  // Kvittosidan (portal/aktivera.html) säger olika saker till kunden beroende
  // på det här, och sa fel åt båda innan 2026-08-16. Byts läget måste texten
  // där följa med.
  assert.equal(TIERS.trial.mode, "payment");
  assert.equal(TIERS.standard.mode, "subscription");
});

test("bara nivåer som går att leverera är köpbara", () => {
  // Stegen är 0 / 90 / 290 per månad (beslutad 2026-08-06). Engångsköpet är
  // skrotat: vi har ingen molnstruktur för att underhålla team, och "ert för
  // alltid" vore ett löfte utan drift bakom sig. Växer listan utan att någon
  // tänkt efter ska bygget gå rött, inte kassan öppna.
  assert.deepEqual(Object.keys(TIERS).sort(), ["standard", "trial"]);
  for (const [namn, spec] of Object.entries(TIERS)) {
    assert.ok(spec.env && spec.env.startsWith("STRIPE_PRICE_"), namn + " saknar prisvariabel");
    assert.ok(["payment", "subscription"].includes(spec.mode), namn + " har ogiltigt mode");
  }
});
