// GET  /api/jobb?team=<slug>  — teamets jobb, för portalen
// POST /api/jobb              — lägg upp ett jobb åt en agent
//
// SP21 (2026-10-24). Jobben bor i D1 och inte i webbläsaren, för de ska nås av
// kundens egen AI via /mcp. Allt annat i portalen (samtal, minne, underlag)
// ligger kvar hos kunden — det här är den enda arbetsytan som delas.
//
// Åtkomst som överallt annars: inloggad, rad i team_access, plan igång.

import { json, readJson, sessionUser, randomHex, nowMs } from "../auth/_lib.js";
import { aktivaTeam, parseKlartNar } from "../_koppling.js";

export async function teamFör(env, request, slug) {
  const user = await sessionUser(env.DB, request);
  if (!user) return { svar: json({ error: "Logga in först." }, 401) };
  const team = (await aktivaTeam(env.DB, user.id)).find((t) => t.slug === slug);
  if (!team) return { svar: json({ error: "hittade inget team" }, 404) };
  return { user, team };
}

export function utJobb(r) {
  return {
    id: r.id, agentId: r.agent_id, title: r.title, brief: r.brief, kund: r.kund || "",
    klartNar: parseKlartNar(r.klart_nar), status: r.status, leverans: r.leverans || null,
    levereradVia: r.levererad_via || null, levereradAt: r.levererad_at || null,
    hamtadAt: r.hamtad_at || null, hamtadAv: r.hamtad_av || null,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "ingen databas" }, 500);
  const slug = new URL(request.url).searchParams.get("team") || "";
  const { svar, team } = await teamFör(env, request, slug);
  if (svar) return svar;
  const { results } = await env.DB.prepare(
    "SELECT * FROM jobs WHERE team_slug = ?1 AND status != 'avbruten' ORDER BY updated_at DESC LIMIT 200"
  ).bind(team.slug).all();
  return json({ jobb: (results || []).map(utJobb) });
}

const kort = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "ingen databas" }, 500);
  const body = await readJson(request);
  const { svar, user, team } = await teamFör(env, request, String(body.team || ""));
  if (svar) return svar;

  const agentId = kort(body.agentId, 64);
  if (!team.agents.some((a) => a.id === agentId)) return json({ error: "okänd agent" }, 400);
  const title = kort(body.title, 140);
  const brief = kort(body.brief, 8000);
  if (!title || !brief) return json({ error: "Jobbet behöver en rubrik och ett uppdrag." }, 400);
  const klartNar = (Array.isArray(body.klartNar) ? body.klartNar : [])
    .map((k) => kort(k, 300)).filter(Boolean).slice(0, 12);

  // Ett tak per team och dygn — ingen kostnad för oss per jobb, men tabellen
  // ska inte gå att fylla av en trasig klient.
  const t = nowMs();
  const räknat = await env.DB.prepare("SELECT COUNT(*) AS n FROM jobs WHERE team_slug = ?1 AND created_at > ?2")
    .bind(team.slug, t - 86_400_000).first();
  if (räknat && räknat.n >= 200) return json({ error: "För många nya jobb i dag." }, 429);

  const id = "job_" + randomHex(12);
  await env.DB.prepare(
    "INSERT INTO jobs (id, team_slug, agent_id, title, brief, kund, klart_nar, status, created_by, created_at, updated_at) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'oppen', ?8, ?9, ?9)"
  ).bind(id, team.slug, agentId, title, brief, kort(body.kund, 200) || null, JSON.stringify(klartNar), user.id, t).run();
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?1").bind(id).first();
  return json({ jobb: utJobb(row) }, 201);
}
