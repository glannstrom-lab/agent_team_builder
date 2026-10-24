-- SP21 (2026-10-24) — jobb som kan göras i kundens egen AI, och kopplingen dit.
-- Applicera lokalt:  npm run db:migrate:local
-- Applicera skarpt:  npm run db:migrate
--
-- Mikael 2026-10-24: "jag vill ha en riktig koppling" — att ett jobb ska kunna
-- skickas till Claude och ChatGPT och leveransen komma tillbaka av sig själv.
-- Ledstången samma dag: "allt handlar om begriplighet och översikt nu, vi kan
-- inte konkurrera i funktionalitet med de stora AI-företagen." Plattformen gör
-- arbetet; portalen visar läget. Därför bor jobbet HÄR och inte hos dem.
--
-- Kopplingen är en MCP-server (/mcp) med en egen OAuth-server (/oauth/*).
-- Kunden lägger till "Mitt AI-team" som anpassad koppling i Claude eller
-- ChatGPT, loggar in med samma engångskod som i portalen, och plattformen kan
-- sedan lista jobben, hämta ett jobbkort och lämna en leverans.

-- ── Jobben ────────────────────────────────────────────────────────────────
-- Ett jobb är ett uppdrag åt en agent i ett team. Det skapas i portalen, görs
-- i portalen eller hos en plattform, och blir klart först när kunden godkänt
-- det — samma regel som trappan i spåret Firman växer.
--
-- status: 'oppen'      skapat, ingen har lämnat något
--         'levererad'  en leverans har kommit (från portalen eller en plattform)
--         'godkand'    kunden har godkänt leveransen
--         'avbruten'   kunden har strukit jobbet
-- Ingen 'pågår'-status: att en plattform läst kortet bokförs i hamtad_at, men
-- betyder inte att någon arbetar. En status som påstår mer än vi vet är värre
-- än ingen.
CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,           -- slumpat, aldrig löpnummer
  team_slug     TEXT NOT NULL REFERENCES teams(slug) ON DELETE CASCADE,
  agent_id      TEXT NOT NULL,              -- agentens id i teams.config
  title         TEXT NOT NULL,
  brief         TEXT NOT NULL,              -- uppdraget, i kundens ord
  kund          TEXT,                       -- vem jobbet är åt (organisation/kontakt), fritt
  klart_nar     TEXT NOT NULL DEFAULT '[]', -- JSON-lista med ja/nej-punkter
  status        TEXT NOT NULL DEFAULT 'oppen'
                CHECK (status IN ('oppen','levererad','godkand','avbruten')),
  leverans      TEXT,
  levererad_via TEXT,                       -- 'portal', 'claude', 'chatgpt' eller klientens namn
  levererad_at  INTEGER,
  hamtad_at     INTEGER,                    -- senast en plattform hämtade kortet
  hamtad_av     TEXT,
  created_by    TEXT REFERENCES users(id),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_team ON jobs(team_slug, status, updated_at);

-- ── OAuth: klienterna ─────────────────────────────────────────────────────
-- Claude och ChatGPT registrerar sig själva, antingen med Dynamic Client
-- Registration (RFC 7591, client_id slumpas här) eller med ett Client ID
-- Metadata Document (client_id är en https-adress som pekar på deras egen
-- beskrivning, som vi hämtar och sparar). Ingen klienthemlighet: båda är
-- publika klienter och skyddas av PKCE.
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id     TEXT PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('dcr','cimd')),
  client_name   TEXT,
  redirect_uris TEXT NOT NULL,              -- JSON-lista
  created_at    INTEGER NOT NULL
);

-- ── OAuth: engångskoderna ─────────────────────────────────────────────────
-- Koden som skickas tillbaka till plattformen efter samtycket. Lagras hashad,
-- lever i fem minuter och går bara att lösa in en gång.
CREATE TABLE IF NOT EXISTS oauth_codes (
  code_hash      TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri   TEXT NOT NULL,
  code_challenge TEXT NOT NULL,             -- PKCE S256
  scope          TEXT NOT NULL,
  resource       TEXT,
  expires_at     INTEGER NOT NULL,
  consumed_at    INTEGER
);

-- ── OAuth: nycklarna ──────────────────────────────────────────────────────
-- Åtkomstnyckel (en timme) och förnyelsenyckel (30 dagar, roteras vid varje
-- användning — OAuth 2.1 kräver det för publika klienter). Båda hashade, av
-- samma skäl som sessionerna: en läckt databas ska inte ge åtkomst.
--
-- Att en rad går att radera är hur kunden kopplar bort en plattform, och hur
-- en kollega som tas bort ur team_access tappar sin koppling: nyckeln bär
-- användaren, inte teamet, och åtkomsten slås upp i team_access vid varje
-- anrop.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  token_hash  TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('access','refresh')),
  client_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expiry ON oauth_tokens(expires_at);
