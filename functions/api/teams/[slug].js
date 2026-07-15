// GET /api/teams/:slug
// Returnerar ett moln-sparat team (JSON) som portalen laddar via capability-URL.
// Del av M2a-1. Kräver D1-bindningen DB (se wrangler.toml + migrations/0001_init.sql).
// Cloudflare Pages Functions: filnamnet [slug].js ger den dynamiska route-parametern.

export async function onRequestGet(context) {
  const { params, env } = context;
  const slug = (params.slug || "").trim();

  if (!slug) return json({ error: "saknar slug" }, 400);
  // Moln-team får capability-slugs på ≥128 bitar slump (~22 base62-tecken, se
  // spec §5). Inbyggda exempel ("coachonline" etc.) serveras statiskt från
  // portal/teams/<slug>.js och når aldrig hit, så minlängden bryter inget.
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(slug)) return json({ error: "ogiltig slug" }, 400);
  if (!env || !env.DB) return json({ error: "ingen databas konfigurerad" }, 500);

  let row;
  try {
    row = await env.DB.prepare("SELECT config FROM teams WHERE slug = ?1").bind(slug).first();
  } catch (e) {
    return json({ error: "databasfel" }, 500);
  }

  if (!row || !row.config) return json({ error: "hittade inget team" }, 404);

  // config är redan en JSON-sträng (window.TEAM-formatet) — skicka rakt igenom.
  return new Response(row.config, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
