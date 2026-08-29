// Tester för `_headers` — sajtens CSP och säkerhetsheaders.
//
// Varför de finns: filen hade noll tester, och den har redan burit två fel av
// den sort som inte syns. Det ena var `Cache-Control`, som stod där i månader
// utan att göra något (Cloudflare Pages äger den headern på statiska
// tillgångar och skriver över den) — och kommentaren intill påstod motsatsen,
// så koden ljög om sig själv. Det andra var `https://openrouter.ai` i
// connect-src, en godkänd destination att skicka data till som blivit död ett
// halvår tidigare.
//
// Gemensamt för båda: en CSP som är fel felar TYST. En blockering syns i
// besökarens konsol och ingen annanstans, och ett borttaget undantag märks
// först när något slutar fungera hos någon annan. Därför står varje rad här
// med sitt skäl — en post utan skäl är en post som nästa städning tar bort.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const RÅ = readFileSync("_headers", "utf8");

// Bara den första regeln (`/*`) — det är den enda som finns, och skulle någon
// lägga till en till ska testerna nedan fortsätta gälla den globala.
const CSP_RAD = RÅ.split("\n").find((r) => /^\s*Content-Security-Policy:/i.test(r));

test("_headers har en CSP alls", () => {
  assert.ok(CSP_RAD, "ingen Content-Security-Policy-rad i _headers");
});

const direktiv = Object.fromEntries(
  CSP_RAD.replace(/^\s*Content-Security-Policy:\s*/i, "")
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [namn, ...värden] = d.split(/\s+/);
      return [namn.toLowerCase(), värden];
    })
);

// ── det som aldrig får luckras upp ─────────────────────────────────────────

test("de fyra låsen står kvar", () => {
  // object-src: <object>/<embed> är den klassiska vägen förbi script-src.
  // base-uri: utan den kan en injicerad <base> peka om varje relativ URL på
  //   sidan, inklusive de versionsstämplade skripten.
  // frame-ancestors: portalen visar kundens data och får inte kunna ramas in.
  // default-src: golvet som gäller allt som inte har ett eget direktiv.
  assert.deepEqual(direktiv["object-src"], ["'none'"]);
  assert.deepEqual(direktiv["base-uri"], ["'none'"]);
  assert.deepEqual(direktiv["frame-ancestors"], ["'none'"]);
  assert.deepEqual(direktiv["default-src"], ["'self'"]);
});

test("connect-src är 'self' och inget mer", () => {
  // Snävades 2026-08-17: `https://openrouter.ai` var en kvarleva från när
  // kundens webbläsare pratade direkt med leverantören. Allt går till /api/ai
  // sedan 2026-08-06, och serverns anrop uppströms lyder inte under sidans CSP.
  // Lägg inte tillbaka något här utan en klient som bevisligen behöver det —
  // det här direktivet är hela svaret på "vart får sidan skicka data".
  assert.deepEqual(direktiv["connect-src"], ["'self'"],
    "connect-src har vidgats — vilken klient behöver det, och varför?");
});

test("kassan kan fortfarande ta emot formuläret", () => {
  // form-action 'self' ensamt hade brutit köpet: Stripe Checkout nås genom en
  // POST till checkout.stripe.com. Felet hade synts först när en kund
  // försökte betala.
  assert.ok(direktiv["form-action"].includes("https://checkout.stripe.com"),
    "form-action stänger ute Stripe Checkout — köpflödet går inte att slutföra");
});

// ── det som måste finnas för att mätningen ska kunna slås på (P1) ──────────

test("Cloudflare Web Analytics är inte utestängd av script-src", () => {
  // Värden står här FÖRE att mätningen är påslagen. Utan raden laddas beaconen
  // aldrig, och den som slog på knappen ser bara en tom panel — vilket är
  // omöjligt att skilja från "ingen trafik". Uppmätt 2026-08-29: påståendet i
  // ROADMAP.md att Web Analytics "kräver ingen CSP-ändring" stämmer inte.
  //
  // Ser den här raden onödig ut vid en städning: det är precis så den blir
  // borttagen, och då slutar mätningen tyst.
  assert.ok(direktiv["script-src"].includes("https://static.cloudflareinsights.com"),
    "script-src stänger ute beaconen — Web Analytics kan inte slås på");
});

// ── det som inte får komma tillbaka ────────────────────────────────────────

test("ingen Cache-Control i _headers", () => {
  // Uppmätt i produktion 2026-08-16: Cloudflare Pages äger Cache-Control på
  // statiska tillgångar och skriver över vad vi än sätter. En hel no-cache-
  // lista stod här och gjorde ingenting, medan kommentaren bredvid sa att den
  // skyddade mot inaktuella deployer. Färskheten ligger i build-dist.mjs
  // (`?v=<innehållshash>`). Kommer raden tillbaka är den inte bara verkningslös
  // — den får nästa läsare att tro att problemet är löst.
  const aktiv = RÅ.split("\n").filter((r) => !r.trim().startsWith("#"));
  assert.ok(!aktiv.some((r) => /cache-control/i.test(r)),
    "Cache-Control är tillbaka i _headers — den fungerar inte på Pages, se kommentaren i filen");
});

test("_headers följer faktiskt med till dist/", () => {
  // Headern gäller bara det som publiceras. Faller filen ur ITEMS levereras
  // sajten helt utan CSP, och ingenting säger ifrån.
  const dist = readFileSync("build-dist.mjs", "utf8");
  assert.ok(/ITEMS\s*=\s*\[[^\]]*"_headers"/s.test(dist),
    "_headers står inte i ITEMS i build-dist.mjs — sajten skulle levereras utan CSP");
});
