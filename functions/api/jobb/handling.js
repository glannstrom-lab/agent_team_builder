// POST /api/jobb/handling  { team, id, handling, leverans? }
//
// handling: 'godkann'  — kunden godkänner leveransen (det enda sättet ett jobb
//                        blir klart; ingen plattform kan göra det)
//           'avbryt'   — jobbet stryks
//           'leverera' — portalen lämnar själv en leverans, t.ex. ett svar från
//                        agenten i chatten som kunden vill spara på jobbet
//           'oppna'    — en levererad leverans skickas tillbaka för omarbetning
// SP21 (2026-10-24).

import { json, readJson, nowMs } from "../auth/_lib.js";
import { LEVERANS_MAX } from "../_koppling.js";
import { teamFör, utJobb } from "./index.js";

const TILLÅTET = {
  godkann: ["levererad"],
  avbryt: ["oppen", "levererad"],
  leverera: ["oppen", "levererad"],
  oppna: ["levererad"],
};

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "ingen databas" }, 500);
  const body = await readJson(request);
  const { svar, team } = await teamFör(env, request, String(body.team || ""));
  if (svar) return svar;

  const handling = String(body.handling || "");
  if (!TILLÅTET[handling]) return json({ error: "okänd handling" }, 400);
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?1 AND team_slug = ?2").bind(String(body.id || ""), team.slug).first();
  if (!row) return json({ error: "hittade inget jobb" }, 404);
  if (!TILLÅTET[handling].includes(row.status)) return json({ error: "Jobbet kan inte det i sitt nuvarande läge." }, 409);

  const t = nowMs();
  let sats;
  if (handling === "godkann") {
    sats = env.DB.prepare("UPDATE jobs SET status = 'godkand', updated_at = ?1 WHERE id = ?2").bind(t, row.id);
  } else if (handling === "avbryt") {
    sats = env.DB.prepare("UPDATE jobs SET status = 'avbruten', updated_at = ?1 WHERE id = ?2").bind(t, row.id);
  } else if (handling === "oppna") {
    sats = env.DB.prepare("UPDATE jobs SET status = 'oppen', updated_at = ?1 WHERE id = ?2").bind(t, row.id);
  } else {
    const leverans = typeof body.leverans === "string" ? body.leverans.trim() : "";
    if (!leverans || leverans.length > LEVERANS_MAX) return json({ error: "Leveransen är tom eller för lång." }, 400);
    sats = env.DB.prepare(
      "UPDATE jobs SET leverans = ?1, levererad_via = 'portal', levererad_at = ?2, status = 'levererad', updated_at = ?2 WHERE id = ?3"
    ).bind(leverans, t, row.id);
  }
  await sats.run();
  const ny = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?1").bind(row.id).first();
  return json({ jobb: utJobb(ny) });
}
