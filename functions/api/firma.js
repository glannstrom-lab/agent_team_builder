// GET  /api/firma?team=<slug>  — allt teamet delar med kundens egen AI
// POST /api/firma              — spara minnet, eller spara/ta bort poster
//
// SP23 (2026-10-24). Portalens sida av det delade: företagsminnet, underlagen,
// organisationerna och kontakterna (functions/api/_firma.js). Plattformarna
// når samma sak via /mcp. Åtkomst som för jobben: inloggad, rad i
// team_access, plan igång (teamFör).
//
// POST-formerna:
//   { team, op: "minne", text, bas }                — bas = texten portalen senast såg
//   { team, op: "poster", poster: [{ typ, id, data }] } — data null = ta bort
// Flera poster i ett anrop: första synken flyttar upp allt som legat i
// webbläsaren, och det ska inte bli hundra anrop.

import { json, readJson } from "./auth/_lib.js";
import { teamFör } from "./jobb/index.js";
import { läsFirma, sparaMinne, sparaPost, raderaPost } from "./_firma.js";

const PER_ANROP = 100;

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "ingen databas" }, 500);
  const slug = new URL(request.url).searchParams.get("team") || "";
  const { svar, team } = await teamFör(env, request, slug);
  if (svar) return svar;
  return json(await läsFirma(env.DB, team.slug));
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "ingen databas" }, 500);
  const body = await readJson(request);
  const { svar, team } = await teamFör(env, request, String(body.team || ""));
  if (svar) return svar;

  if (body.op === "minne") {
    if (typeof body.text !== "string") return json({ error: "text saknas" }, 400);
    const r = await sparaMinne(env.DB, team.slug, { text: body.text, bas: typeof body.bas === "string" ? body.bas : null, av: "portal" });
    if (r.fel) return json({ error: r.fel }, 413);
    return json({ minne: { text: r.text } });
  }

  if (body.op === "poster") {
    const poster = Array.isArray(body.poster) ? body.poster : [];
    if (!poster.length) return json({ error: "inga poster" }, 400);
    if (poster.length > PER_ANROP) return json({ error: `högst ${PER_ANROP} poster per anrop` }, 413);
    const ut = [], fel = [];
    for (const p of poster) {
      if (!p || typeof p !== "object") { fel.push({ fel: "ogiltig post" }); continue; }
      const r = p.data === null
        ? await raderaPost(env.DB, team.slug, String(p.typ || ""), String(p.id || ""))
        : await sparaPost(env.DB, team.slug, String(p.typ || ""), String(p.id || ""), p.data, "portal");
      if (r.fel) fel.push({ typ: p.typ, id: p.id, fel: r.fel });
      else ut.push({ typ: p.typ, id: p.id });
    }
    return json({ sparade: ut, fel }, fel.length && !ut.length ? 400 : 200);
  }

  return json({ error: "okänd op" }, 400);
}
