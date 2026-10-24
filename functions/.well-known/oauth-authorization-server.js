// GET /.well-known/oauth-authorization-server — OAuth-serverns metadata (RFC 8414).
// Plattformarna läser den för att hitta inloggning, token-slutpunkt och
// registrering. Innehållet bor i functions/api/_koppling.js (SP21).

import { authServerMetadata, jsonOut, preflight } from "../api/_koppling.js";

export const onRequestGet = ({ request }) => jsonOut(authServerMetadata(request));
export const onRequestOptions = () => preflight();
