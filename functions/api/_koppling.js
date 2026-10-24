// Kopplingen till kundens egen AI (SP21, 2026-10-24) — delade byggstenar för
// OAuth-servern (/oauth/*, /.well-known/*) och MCP-servern (/mcp).
// Filnamn med inledande understreck routas inte; det här är ett bibliotek.
//
// Varför den finns: Mikael 2026-10-24, "jag vill ha en riktig koppling" — ett
// jobb ska kunna göras i Claude eller ChatGPT och leveransen komma tillbaka av
// sig själv. Plattformen gör arbetet, portalen visar läget och kunden godkänner.
//
// Kraven kommer från Claudes dokumentation för anpassade kopplingar
// (claude.com/docs/connectors/building/authentication, läst 2026-10-24):
//  - en 401 med `WWW-Authenticate: Bearer resource_metadata="…"` startar
//    inloggningen; samma huvud på en 200 ignoreras
//  - `resource` i metadatan måste vara exakt den adress kunden skriver in
//  - PKCE med S256 på varje begäran, och metadatan ska säga det
//  - Client ID Metadata Document används bara om metadatan annonserar BÅDE
//    `client_id_metadata_document_supported` och "none" som autentisering vid
//    token-slutpunkten; annars faller Claude tillbaka på DCR
//  - token-slutpunkten tar form-urlencoded, /register tar JSON
//  - förnyelsenycklar roteras (publika klienter)
//  - återanrop: https://claude.ai/api/mcp/auth_callback, och för Claude Code
//    en loopback-adress på valfri port
// ChatGPT kör samma protokoll (OAuth med CIMD eller DCR), så en server räcker.

import { randomHex, sha256Hex, nowMs } from "./auth/_lib.js";
import { planState } from "./_plan.js";

export const SCOPE = "jobb";
// SP23: "firma" = minnet, underlagen och kunderna. Ett nytt samtycke ger
// båda; en nyckel från före SP23 bär bara "jobb" och når inte det nya förrän
// kunden kopplat om — hon sa ja till jobben, inte till minnet.
export const SCOPE_FIRMA = "firma";
export const BEVILJAT = SCOPE + " " + SCOPE_FIRMA;
export const harFirma = (vem) => !!vem && String(vem.scope || "").split(/\s+/).includes(SCOPE_FIRMA);
export const CODE_TTL_MS = 5 * 60 * 1000;                // engångskoden: fem minuter
export const ACCESS_TTL_MS = 60 * 60 * 1000;             // åtkomstnyckeln: en timme
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // förnyelsenyckeln: 30 dagar
export const CIMD_MAX_BYTES = 10_000;
export const LEVERANS_MAX = 200_000;                     // tecken

// ── adresser ──────────────────────────────────────────────────────────────

export const origin = (request) => new URL(request.url).origin;
export const resourceUrl = (request) => origin(request) + "/mcp";
export const resourceMetadataUrl = (request) => origin(request) + "/.well-known/oauth-protected-resource";

export function protectedResourceMetadata(request) {
  return {
    resource: resourceUrl(request),
    authorization_servers: [origin(request)],
    scopes_supported: [SCOPE, SCOPE_FIRMA],
    bearer_methods_supported: ["header"],
    resource_name: "Mitt AI-team",
  };
}

export function authServerMetadata(request) {
  const o = origin(request);
  return {
    issuer: o,
    authorization_endpoint: o + "/oauth/authorize",
    token_endpoint: o + "/oauth/token",
    registration_endpoint: o + "/oauth/register",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    client_id_metadata_document_supported: true,
    scopes_supported: [SCOPE, SCOPE_FIRMA],
    authorization_response_iss_parameter_supported: true,
    service_documentation: o + "/villkor.html",
  };
}

// ── svar ──────────────────────────────────────────────────────────────────

// Plattformarna anropar från sina servrar och behöver ingen CORS. Webbläsar-
// baserade verktyg (MCP Inspector) gör det, och inget av svaren bär kakor, så
// en öppen CORS kostar ingenting.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, mcp-protocol-version, mcp-session-id",
  "access-control-expose-headers": "www-authenticate, mcp-session-id",
  "access-control-max-age": "86400",
};

export function jsonOut(body, status = 200, extra = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...CORS,
      ...extra,
    },
  });
}

export const preflight = () => new Response(null, { status: 204, headers: CORS });

export function oauthError(error, description, status = 400) {
  return jsonOut({ error, error_description: description }, status);
}

// ── omdirigeringsadresser ─────────────────────────────────────────────────

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

// https till vilken värd som helst, eller http till loopback (Claude Code och
// andra lokala klienter, RFC 8252). Aldrig ett fragment, aldrig javascript:.
export function redirectOk(raw) {
  let u;
  try { u = new URL(String(raw)); } catch (_) { return false; }
  if (u.hash) return false;
  if (u.protocol === "https:") return true;
  return u.protocol === "http:" && LOOPBACK.has(u.hostname);
}

// Exakt match — utom för loopback, där porten byts per session och därför
// inte får ingå i jämförelsen (RFC 8252 §7.3; Claude kräver det även för
// "localhost").
export function redirectMatches(registered, given) {
  if (registered === given) return true;
  let a, b;
  try { a = new URL(registered); b = new URL(given); } catch (_) { return false; }
  if (a.protocol !== "http:" || b.protocol !== "http:") return false;
  if (!LOOPBACK.has(a.hostname) || a.hostname !== b.hostname) return false;
  return a.pathname === b.pathname && a.search === b.search;
}

// ── klienterna ────────────────────────────────────────────────────────────

function parseClient(row) {
  if (!row) return null;
  let uris = [];
  try { uris = JSON.parse(row.redirect_uris); } catch (_) { uris = []; }
  return { client_id: row.client_id, kind: row.kind, client_name: row.client_name || null, redirect_uris: uris };
}

export async function registerClient(db, body) {
  const uris = body && Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String) : [];
  if (!uris.length || uris.length > 10 || !uris.every(redirectOk)) {
    return { error: "invalid_redirect_uri", description: "redirect_uris måste vara 1–10 https-adresser eller loopback." };
  }
  const method = body.token_endpoint_auth_method || "none";
  if (method !== "none") {
    return { error: "invalid_client_metadata", description: "Bara publika klienter (token_endpoint_auth_method none) stöds." };
  }
  const name = typeof body.client_name === "string" ? body.client_name.slice(0, 100) : null;
  const client_id = "mat_" + randomHex(16);
  const t = nowMs();
  await db.prepare(
    "INSERT INTO oauth_clients (client_id, kind, client_name, redirect_uris, created_at) VALUES (?1, 'dcr', ?2, ?3, ?4)"
  ).bind(client_id, name, JSON.stringify(uris), t).run();
  return {
    client: {
      client_id,
      client_id_issued_at: Math.floor(t / 1000),
      client_name: name || undefined,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
  };
}

// Client ID Metadata Document: client_id ÄR en https-adress till klientens
// egen beskrivning. Den hämtas, kontrolleras och sparas, så att samtyckessidan
// kan visa ett namn och token-slutpunkten känna igen klienten. Hämtningen har
// tak på storlek och tid — adressen kommer från den som anropar.
export async function lookupClient(db, clientId, fetchImpl = fetch) {
  const id = String(clientId || "");
  if (!id) return null;
  const row = await db.prepare(
    "SELECT client_id, kind, client_name, redirect_uris FROM oauth_clients WHERE client_id = ?1"
  ).bind(id).first();
  if (row) return parseClient(row);
  if (!id.startsWith("https://")) return null;

  let doc;
  try {
    const res = await fetchImpl(id, {
      headers: { accept: "application/json", "user-agent": "MittAITeam-OAuth/1.0 (+https://mittaiteam.se)" },
      // "manual", inte "error": Cloudflare Workers kastar på redirect: "error"
      // (bara follow/manual stöds), och det kastet blev "Tjänsten som vill
      // koppla sig är okänd" för varje Claude-koppling i drift (2026-10-24).
      // En omdirigering ger ett svar som inte är ok och avvisas nedan — samma
      // effekt som "error" skulle ha haft.
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > CIMD_MAX_BYTES) return null;
    doc = JSON.parse(text);
  } catch (_) {
    return null;
  }
  // Dokumentet måste säga att det är det här client_id:t — annars kan vem som
  // helst peka på någon annans beskrivning.
  if (!doc || doc.client_id !== id) return null;
  const uris = Array.isArray(doc.redirect_uris) ? doc.redirect_uris.map(String).filter(redirectOk) : [];
  if (!uris.length) return null;
  const name = typeof doc.client_name === "string" ? doc.client_name.slice(0, 100) : null;
  await db.prepare(
    "INSERT OR REPLACE INTO oauth_clients (client_id, kind, client_name, redirect_uris, created_at) VALUES (?1, 'cimd', ?2, ?3, ?4)"
  ).bind(id, name, JSON.stringify(uris), nowMs()).run();
  return { client_id: id, kind: "cimd", client_name: name, redirect_uris: uris };
}

// Vad kunden ser: "Claude", "ChatGPT" — inte ett slumpat id. Värden på
// återanropsadressen avgör, för namnet i en DCR-registrering väljer klienten
// själv och kan vara vad som helst.
export function clientLabel(client, redirectUri) {
  let host = "";
  try { host = new URL(redirectUri || (client && client.redirect_uris[0]) || "").hostname; } catch (_) { /* */ }
  if (host === "claude.ai" || host.endsWith(".claude.ai")) return "Claude";
  if (host === "chatgpt.com" || host.endsWith(".chatgpt.com") || host.endsWith(".openai.com")) return "ChatGPT";
  if (LOOPBACK.has(host)) return (client && client.client_name) || "ett program på din dator";
  return (client && client.client_name) || host || "en okänd tjänst";
}

// ── PKCE ──────────────────────────────────────────────────────────────────

export async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  let s = "";
  for (const b of new Uint8Array(digest)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── engångskoder och nycklar ──────────────────────────────────────────────

export async function createCode(db, { clientId, userId, redirectUri, codeChallenge, scope, resource }) {
  const code = randomHex(32);
  await db.prepare(
    "INSERT INTO oauth_codes (code_hash, client_id, user_id, redirect_uri, code_challenge, scope, resource, expires_at) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
  ).bind(await sha256Hex(code), clientId, userId, redirectUri, codeChallenge, scope, resource || null, nowMs() + CODE_TTL_MS).run();
  return code;
}

export async function issueTokens(db, { clientId, userId, scope }) {
  const access = "mata_" + randomHex(32);
  const refresh = "matr_" + randomHex(32);
  const t = nowMs();
  const ins = "INSERT INTO oauth_tokens (token_hash, kind, client_id, user_id, scope, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)";
  await db.prepare(ins).bind(await sha256Hex(access), "access", clientId, userId, scope, t + ACCESS_TTL_MS, t).run();
  await db.prepare(ins).bind(await sha256Hex(refresh), "refresh", clientId, userId, scope, t + REFRESH_TTL_MS, t).run();
  return {
    access_token: access,
    token_type: "Bearer",
    expires_in: Math.floor(ACCESS_TTL_MS / 1000),
    refresh_token: refresh,
    scope,
  };
}

// Vem bär nyckeln? null om den saknas, är fel sort eller har gått ut.
export async function bearer(db, request) {
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  if (!m) return null;
  const row = await db.prepare(
    "SELECT t.user_id, t.client_id, t.scope, t.expires_at, u.email FROM oauth_tokens t " +
    "JOIN users u ON u.id = t.user_id WHERE t.token_hash = ?1 AND t.kind = 'access'"
  ).bind(await sha256Hex(m[1])).first();
  if (!row || row.expires_at < nowMs()) return null;
  return { userId: row.user_id, clientId: row.client_id, scope: row.scope, email: row.email };
}

// ── teamen och jobben ─────────────────────────────────────────────────────

// Team som användaren når OCH vars plan är igång. Samma regel som portalen:
// en spärrad plan ger inga jobb, varken i portalen eller via en plattform.
export async function aktivaTeam(db, userId, now = nowMs()) {
  const { results } = await db.prepare(
    "SELECT t.slug, t.config, t.plan, t.created_at FROM teams t JOIN team_access a ON a.team_slug = t.slug WHERE a.user_id = ?1 ORDER BY t.created_at DESC"
  ).bind(userId).all();
  const ut = [];
  for (const row of results || []) {
    if (!planState(row, now).ok) continue;
    let cfg = {};
    try { cfg = JSON.parse(row.config) || {}; } catch (_) { cfg = {}; }
    ut.push({
      slug: row.slug, company: cfg.company || "Teamet", agents: Array.isArray(cfg.agents) ? cfg.agents : [],
      routines: Array.isArray(cfg.routines) ? cfg.routines : [], entryAgent: cfg.entryAgent || null, createdAt: row.created_at,
    });
  }
  return ut;
}

export function parseKlartNar(raw) {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch (_) {
    return [];
  }
}

export const STATUS_TEXT = {
  oppen: "Öppen",
  levererad: "Levererad, väntar på godkännande",
  godkand: "Godkänd",
  avbruten: "Avbruten",
};
