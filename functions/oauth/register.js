// POST /oauth/register — Dynamic Client Registration (RFC 7591), SP21.
//
// ChatGPT och äldre klienter registrerar sig här; Claude föredrar CIMD och
// kommer oftast inte hit. Registreringen ger bara ett id — ingen åtkomst. Den
// kommer först när en inloggad kund säger ja på samtyckessidan.
//
// Spärren räknas per IP och är generös med flit: plattformarnas servrar delar
// få adresser, och en för snäv spärr stänger ute alla deras kunder samtidigt.

import { allowAttempt, clientIp } from "../api/auth/_lib.js";
import { registerClient, jsonOut, oauthError, preflight } from "../api/_koppling.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return oauthError("server_error", "databasen är inte kopplad", 500);
  if (!(await allowAttempt(env.DB, "dcr:" + clientIp(request), 300))) {
    return oauthError("temporarily_unavailable", "För många registreringar. Försök igen om en kvart.", 429);
  }
  let body;
  try { body = await request.json(); } catch (_) { body = null; }
  if (!body || typeof body !== "object") return oauthError("invalid_client_metadata", "Kroppen måste vara JSON.");
  const out = await registerClient(env.DB, body);
  if (out.error) return oauthError(out.error, out.description);
  return jsonOut(out.client, 201);
}

export const onRequestOptions = () => preflight();
