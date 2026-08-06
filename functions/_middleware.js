// Middleware för Pages Functions.
//
// Varför den finns: `_headers` gäller bara *statiska* svar. Allt som svaras av
// functions/ (dvs `/api/*`) gick tidigare ut helt utan CSP, nosniff och
// referrer-policy. Dessutom kör Pages bara `onRequestGet` för GET — en HEAD
// eller POST mot `/api/teams/:slug` föll ned till den statiska asset-servern
// och svarade `200 text/html`, vilket ser ut som ett fungerande API-svar.
//
// Middlewaren gör därför två saker, och **bara** för `/api/*`:
//   1. begränsar metoder per känd API-väg (405 med `Allow:` för övriga)
//   2. stämplar säkerhetsheaders på svaret
//
// Allt annat (hub, portal, builder, galleri) passerar orört vidare till
// asset-servern så att `_headers` fortsätter äga sajtens CSP. Rör man den
// regeln riskerar man att skriva över sidornas CSP med API-varianten nedan.

// Låst API-profil: JSON-svar behöver ingenting hämtas, laddas eller bäddas in.
const API_SECURITY_HEADERS = {
  "content-security-policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "cross-origin-resource-policy": "same-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
};

// Metodregler för kända API-vägar. En väg som saknas här metodbegränsas inte
// (nya endpoints slutar alltså inte fungera för att någon glömt listan) — men
// den får fortfarande säkerhetsheaders och html-spärren längre ner.
const METHOD_RULES = [
  // GET /api/teams/:slug — read-only capability-URL (M2a-1).
  { match: /^\/api\/teams\/[^/]+\/?$/, allow: ["GET"] },
  // Inloggning (M3). request och verify tar emot data och måste vara POST;
  // me är en ren läsning. Att låsa metoderna här gör att en felskriven
  // klient får 405 i stället för att falla ned på asset-servern.
  { match: /^\/api\/auth\/request\/?$/, allow: ["POST"] },
  { match: /^\/api\/auth\/verify\/?$/, allow: ["POST"] },
  { match: /^\/api\/auth\/logout\/?$/, allow: ["POST"] },
  { match: /^\/api\/auth\/me\/?$/, allow: ["GET"] },
  // Köpflödet (M2a-2). Webhooken är POST-only med flit: en GET mot den från
  // en nyfiken skanner ska inte ens nå signaturkontrollen.
  { match: /^\/api\/checkout\/?$/, allow: ["POST"] },
  { match: /^\/api\/checkout\/status\/?$/, allow: ["GET"] },
  { match: /^\/api\/stripe-webhook\/?$/, allow: ["POST"] },
];

export async function onRequest(context) {
  const { request, next } = context;
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/")) return next();

  const rule = METHOD_RULES.find((r) => r.match.test(path));
  if (rule && !rule.allow.includes(request.method)) {
    // HEAD hamnar här med flit — endpointen är GET-only. Kroppen sätts till
    // null för HEAD: ett HEAD-svar får aldrig ha en kropp.
    return apiError(405, "metoden stöds inte", request.method === "HEAD", {
      allow: rule.allow.join(", "),
    });
  }

  let res;
  try {
    res = await next();
  } catch (_) {
    return apiError(500, "internt fel", request.method === "HEAD");
  }

  // Skyddsnät: om ingen Function matchade vägen serverar asset-servern
  // index.html med status 200. Under /api/ är det alltid fel svar.
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html")) {
    return apiError(404, "okänd endpoint", request.method === "HEAD");
  }

  return secure(res);
}

function apiError(status, message, headless, extra = {}) {
  return secure(new Response(headless ? null : JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  }));
}

function secure(res) {
  const out = new Response(res.body, res);
  for (const key in API_SECURITY_HEADERS) out.headers.set(key, API_SECURITY_HEADERS[key]);
  return out;
}
