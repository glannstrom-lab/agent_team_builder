// Delade byggstenar mot Stripe. Inledande understreck = biblioteksfil, ingen
// route (samma konvention som auth/_lib.js).
//
// Ingen SDK. Stripes officiella bibliotek drar in ett beroende och en
// byggkedja för det som i praktiken är två formulärkodade POST:ar och en
// HMAC-kontroll. Web Crypto finns i Workers, så det räcker gott.

// Formulärkodning med Stripes hakparentessyntax: {line_items: [{price: "x"}]}
// blir line_items[0][price]=x. Skrivs ut för hand hos anroparen — en generisk
// serialiserare hade varit fyra rader kod och en dålig felutskrift.
export async function stripeCall(env, path, params, idempotencyKey, method) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY saknas");

  const headers = {
    authorization: "Bearer " + env.STRIPE_SECRET_KEY,
    "content-type": "application/x-www-form-urlencoded",
  };
  // Nätverket kan svika mellan vårt anrop och Stripes svar. Utan nyckel skapas
  // då en andra session vid omförsök, och kunden kan betala två gånger.
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

  // Metoden härleds normalt ur anropet: kropp = POST, ingen kropp = GET. Den
  // femte parametern finns för det enda undantaget — omedelbar avslutning av
  // ett abonnemang är DELETE /v1/subscriptions/:id hos Stripe, och den behövs
  // när en konsument utövar sin ångerrätt (functions/api/subscription/
  // withdraw.js). `cancel_at_period_end` duger inte där: ett ångrat köp ska
  // inte fortsätta löpa perioden ut.
  const res = await fetch("https://api.stripe.com/v1" + path, {
    method: method || (params ? "POST" : "GET"),
    headers,
    body: params ? new URLSearchParams(params).toString() : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = (data.error && data.error.message) || ("HTTP " + res.status);
    throw new Error("Stripe " + path + ": " + msg);
  }
  return data;
}

// ── signaturkontroll ──────────────────────────────────────────────────────
//
// Webhooken är en öppen endpoint som skapar konton och team. Utan den här
// kontrollen kan vem som helst som känner till adressen skicka in en påhittad
// "betalning" och få ut ett team gratis. Signaturen ÄR betalningsbeviset.
//
// Stripe skickar:  stripe-signature: t=1712345678,v1=<hex>,v1=<hex>
// Signerad text:   `${t}.${rå kropp}` — råa kroppen, inte omserialiserad JSON.
// Flera v1 kan förekomma när signeringshemligheten roteras; en träff räcker.

const TOLERANCE_S = 300; // 5 minuter, samma som Stripes egna bibliotek

export async function verifyStripeSignature(rawBody, header, secret, nowMsFn) {
  if (!header || !secret) return false;

  const parts = String(header).split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="));
  const sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;

  const timestamp = Number(t.slice(2));
  if (!Number.isFinite(timestamp)) return false;

  // Utan tidsfönster kan en avlyssnad giltig begäran spelas upp igen i
  // morgon. Idempotensen nedan gör det ofarligt i dag, men den försvaret
  // vill man inte vara ensam om.
  const now = Math.floor((nowMsFn ? nowMsFn() : Date.now()) / 1000);
  if (Math.abs(now - timestamp) > TOLERANCE_S) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp + "." + rawBody)
  );
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return sigs.some((s) => timingSafeEqual(s, expected));
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── nivåer ────────────────────────────────────────────────────────────────
//
// Priserna bor i Stripe, inte här. Det som bor här är kopplingen mellan en
// nivå och den miljövariabel som håller dess price-id — så att testläge och
// skarpt läge kan ha olika id:n utan att koden ändras.
//
// Två nivåer, inte fler (beslutat 2026-08-06). Engångsköpet av ett team är
// skrotat: vi har ingen molnstruktur för att underhålla team åt kunder, och
// "ert för alltid" är ett löfte utan drift bakom sig. Provmånaden är ett
// engångsbelopp som inte förnyas; standard är ett riktigt abonnemang.
//
// Läggs en nivå till här måste den gå att leverera samma dag. Testet i
// test/stripe.mjs fäller bygget om listan växer utan att någon tänkt efter.
export const TIERS = {
  "trial": { env: "STRIPE_PRICE_TRIAL", mode: "payment", label: "Provmånad" },
  "standard": { env: "STRIPE_PRICE_STANDARD", mode: "subscription", label: "Standard, löpande" },
};

// Slug på 22 base62-tecken ≈ 131 bitar slump. Måste matcha mönstret i
// api/teams/[slug].js ({22,64}).
// Rejection sampling, inte modulo: 256 är inte delbart med 62, så `b % 62`
// hade gjort de åtta första tecknen vanligare än de övriga. Samma resonemang
// som bakom generateCode() i auth/_lib.js.
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export function newSlug(length = 22) {
  const out = [];
  while (out.length < length) {
    const buf = new Uint8Array(length);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= 248) continue; // 248 = 62 * 4, allt däröver kastas
      out.push(ALPHABET[b % 62]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}
