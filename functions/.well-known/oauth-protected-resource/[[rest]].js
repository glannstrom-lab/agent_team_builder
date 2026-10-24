// GET /.well-known/oauth-protected-resource[/mcp] — MCP-serverns metadata (RFC 9728).
// [[rest]] fångar både den nakna adressen och /mcp-varianten, som klienter
// provar när 401-svaret saknar pekare. Se functions/api/_koppling.js (SP21).

import { protectedResourceMetadata, jsonOut, preflight } from "../../api/_koppling.js";

export const onRequestGet = ({ request }) => jsonOut(protectedResourceMetadata(request));
export const onRequestOptions = () => preflight();
