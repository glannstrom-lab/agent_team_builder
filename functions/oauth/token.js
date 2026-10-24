// POST /oauth/token — löser in en engångskod eller förnyar en nyckel (SP21).
//
// Kroppen är form-urlencoded (RFC 6749 §4.1.3) — Claude skickar så, och en
// JSON-tolk här ger 415 och en koppling som aldrig blir klar. Felkoderna är
// RFC 6749:s egna: Claude förnyar bara om en död förnyelsenyckel ger
// `invalid_grant`, inte en egen kod.
//
// Förnyelsenyckeln roteras: den gamla raderas i samma svar som den nya ges.
// Det är OAuth 2.1:s krav för publika klienter — en stulen förnyelsenyckel
// blir värdelös så fort den rätta klienten använt sin.

import { sha256Hex, nowMs, timingSafeEqual } from "../api/auth/_lib.js";
import { issueTokens, pkceChallenge, redirectMatches, jsonOut, oauthError, preflight } from "../api/_koppling.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return oauthError("server_error", "databasen är inte kopplad", 500);

  let form;
  try { form = new URLSearchParams(await request.text()); } catch (_) { form = new URLSearchParams(); }
  const grant = form.get("grant_type");
  const clientId = form.get("client_id") || "";

  if (grant === "authorization_code") {
    const code = form.get("code") || "";
    const verifier = form.get("code_verifier") || "";
    const redirectUri = form.get("redirect_uri") || "";
    if (!code || !verifier) return oauthError("invalid_request", "code och code_verifier krävs.");

    const hash = await sha256Hex(code);
    const row = await db.prepare(
      "SELECT client_id, user_id, redirect_uri, code_challenge, scope, expires_at, consumed_at FROM oauth_codes WHERE code_hash = ?1"
    ).bind(hash).first();
    const t = nowMs();
    if (!row || row.consumed_at || row.expires_at < t) return oauthError("invalid_grant", "Koden är okänd, använd eller för gammal.");
    if (clientId && clientId !== row.client_id) return oauthError("invalid_grant", "Koden gavs till en annan klient.");
    if (!redirectMatches(row.redirect_uri, redirectUri)) return oauthError("invalid_grant", "redirect_uri stämmer inte.");
    if (!timingSafeEqual(await pkceChallenge(verifier), row.code_challenge)) return oauthError("invalid_grant", "PKCE stämmer inte.");

    // Förbruka koden i ett villkorat svep: två samtidiga inlösningar av samma
    // kod får inte båda lyckas.
    const used = await db.prepare(
      "UPDATE oauth_codes SET consumed_at = ?1 WHERE code_hash = ?2 AND consumed_at IS NULL"
    ).bind(t, hash).run();
    if (!used || !used.meta || used.meta.changes !== 1) return oauthError("invalid_grant", "Koden är redan använd.");

    return jsonOut(await issueTokens(db, { clientId: row.client_id, userId: row.user_id, scope: row.scope }));
  }

  if (grant === "refresh_token") {
    const refresh = form.get("refresh_token") || "";
    if (!refresh) return oauthError("invalid_request", "refresh_token krävs.");
    const hash = await sha256Hex(refresh);
    const row = await db.prepare(
      "SELECT client_id, user_id, scope, expires_at FROM oauth_tokens WHERE token_hash = ?1 AND kind = 'refresh'"
    ).bind(hash).first();
    if (!row || row.expires_at < nowMs()) return oauthError("invalid_grant", "Förnyelsenyckeln är okänd eller har gått ut.");
    if (clientId && clientId !== row.client_id) return oauthError("invalid_grant", "Nyckeln gavs till en annan klient.");
    const gone = await db.prepare("DELETE FROM oauth_tokens WHERE token_hash = ?1").bind(hash).run();
    if (!gone || !gone.meta || gone.meta.changes !== 1) return oauthError("invalid_grant", "Förnyelsenyckeln är redan använd.");
    return jsonOut(await issueTokens(db, { clientId: row.client_id, userId: row.user_id, scope: row.scope }));
  }

  return oauthError("unsupported_grant_type", "Bara authorization_code och refresh_token stöds.");
}

export const onRequestOptions = () => preflight();
