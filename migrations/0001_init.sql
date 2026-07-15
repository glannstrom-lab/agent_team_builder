-- M2a — D1-schema (Cloudflare D1 / SQLite).
-- Applicera lokalt:  npx wrangler d1 migrations apply agent-team-builder --local
-- Applicera skarpt:  npx wrangler d1 migrations apply agent-team-builder --remote

CREATE TABLE IF NOT EXISTS teams (
  slug            TEXT PRIMARY KEY,   -- capability-slug (>=128 bitar slump, oguessbar)
  config          TEXT NOT NULL,      -- team-JSON, samma format som portal/teams/*.js (window.TEAM)
  tier            TEXT NOT NULL CHECK (tier IN ('self-serve','managed')),
  stripe_customer TEXT,
  stripe_session  TEXT UNIQUE,        -- kopplar checkout-session -> team; ger idempotens vid webhook-retries + uppslag i /api/checkout/status
  created_at      INTEGER NOT NULL    -- unix epoch (ms)
);

-- Tillfälliga utkast i väntan på betalning (Beslut A: bygg -> betala -> spara).
-- Städa bort poster äldre än 24h (görs i checkout/webhook eller schemalagt).
CREATE TABLE IF NOT EXISTS pending (
  id             TEXT PRIMARY KEY,    -- draftId
  config         TEXT NOT NULL,
  stripe_session TEXT,
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pending_session ON pending(stripe_session);

-- M2b (managed): förbrukning per team och period.
CREATE TABLE IF NOT EXISTS usage (
  slug       TEXT NOT NULL,
  period     TEXT NOT NULL,           -- 'YYYY-MM'
  input_tok  INTEGER NOT NULL DEFAULT 0,
  output_tok INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, period)
);
