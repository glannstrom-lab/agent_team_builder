// GET  /api/digest/prefs?slug=…   — läser kundens veckobrevsinställning
// POST /api/digest/prefs           — slår på/av och väljer veckodag
//
// Kräver inloggning OCH en rad i team_access, exakt som /api/teams/:slug: att
// känna slugen räcker inte, för då hade den som fått en delningslänk kunnat
// beställa mejl om någon annans team.
//
// Opt-in med flit: finns ingen rad skickas inget brev. Det är kunden som slår
// på det, inte vi som slår på det åt henne.

import { json, nowMs, sessionUser } from "../auth/_lib.js";

// Slugmönstret är samma som i teams/[slug].js — 22–64 base62.
const SLUG = /^[0-9A-Za-z]{22,64}$/;

// Avregistreringstoken: 32 base62-tecken ≈ 190 bitar. Rejection sampling, samma
// resonemang som newSlug i _stripe.js — `b % 62` hade gjort de första tecknen
// vanligare, och en token som går att gissa är en väg att avregistrera någon
// annan.
const ALFABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function nyToken(längd = 32) {
  const ut = [];
  while (ut.length < längd) {
    const buf = new Uint8Array(längd);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= 248) continue; // 248 = 62 × 4
      ut.push(ALFABET[b % 62]);
      if (ut.length === längd) break;
    }
  }
  return ut.join("");
}

// Åtkomsten: raden i team_access är sanningen.
async function harÅtkomst(db, userId, slug) {
  const r = await db.prepare(
    "SELECT 1 AS ok FROM team_access WHERE team_slug = ? AND user_id = ?"
  ).bind(slug, userId).first().catch(() => null);
  return !!(r && r.ok);
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!SLUG.test(slug)) return json({ error: "bad slug" }, 400);

  const user = await sessionUser(env.DB, request);
  if (!user) return json({ error: "login_required" }, 401);
  if (!(await harÅtkomst(env.DB, user.user_id, slug))) return json({ error: "no_access" }, 403);

  const rad = await env.DB.prepare(
    "SELECT active, weekday, last_sent_day FROM weekly_digest WHERE user_id = ? AND team_slug = ?"
  ).bind(user.user_id, slug).first().catch(() => null);

  return json({
    active: !!(rad && rad.active),
    weekday: (rad && rad.weekday) || 1,
    lastSent: (rad && rad.last_sent_day) || null,
    email: user.email, // så portalen kan visa VART brevet går
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: "bad json" }, 400); }

  const slug = String(body.slug || "");
  if (!SLUG.test(slug)) return json({ error: "bad slug" }, 400);
  const active = body.active ? 1 : 0;
  // 1 = måndag … 7 = söndag. Allt annat blir måndag; en klient som skickar
  // skräp ska inte kunna skriva ogiltiga värden till databasen (CHECK skulle
  // fånga det, men ett tydligt fel är bättre än ett avvisat INSERT).
  const weekday = Number(body.weekday) >= 1 && Number(body.weekday) <= 7 ? Number(body.weekday) : 1;

  const user = await sessionUser(env.DB, request);
  if (!user) return json({ error: "login_required" }, 401);
  if (!(await harÅtkomst(env.DB, user.user_id, slug))) return json({ error: "no_access" }, 403);

  const nu = nowMs();
  try {
    // Token sätts bara vid första skrivningen. Byts den varje gång slutar
    // avregistreringslänken i ett redan skickat brev att fungera — och den
    // länken är kundens väg ut, inte vår.
    await env.DB.prepare(
      "INSERT INTO weekly_digest (user_id, team_slug, weekday, active, token, created_at) VALUES (?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(user_id, team_slug) DO UPDATE SET active = excluded.active, weekday = excluded.weekday"
    ).bind(user.user_id, slug, weekday, active, nyToken(), nu).run();
  } catch (e) {
    console.error("[veckobrev] kunde inte spara inställning", String(e));
    return json({ error: "db" }, 500);
  }

  return json({ ok: true, active: !!active, weekday, email: user.email });
}
