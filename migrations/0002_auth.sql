-- M3 — konton och inloggning (D1 / SQLite).
-- Applicera lokalt:  npm run db:migrate:local
-- Applicera skarpt:  npm run db:migrate
--
-- Beslutat 2026-08-05: alla som beställer får ett konto. Capability-URL:en
-- (0001_init.sql) räcker kryptografiskt men inte operativt — den går inte att
-- återkalla, den läcker via webbhistorik och vidarebefordrade mejl, och den
-- vet inte vem som är vem. Utan identitet går det heller inte att mäta
-- förbrukning per konto, vilket den nyckelfria nivån kräver för att kunna
-- prissättas.
--
-- Inga lösenord. Inloggning sker med en engångskod till e-posten. Det tar bort
-- lösenordslagring, återställningsflöde och kontokapning via återanvända
-- lösenord i ett svep, och lämnar e-post + tidsstämplar som enda personuppgift.

-- ── Konton ────────────────────────────────────────────────────────────────
-- email lagras normaliserad (trimmad, gemener) och är unik. Ingen profil,
-- inget namn, inget mer än vad inloggningen kräver — det som inte lagras
-- behöver varken skyddas eller gallras.
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,       -- slumpad, aldrig löpnummer (röjer kundantal)
  email       TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,       -- unix epoch (ms)
  last_login  INTEGER
);

-- ── Engångskoder ──────────────────────────────────────────────────────────
-- Koden lagras ALDRIG i klartext. En läckt databas ska inte ge inloggning.
-- code_hash = SHA-256 av koden + användarens e-post (saltar per konto så att
-- två samtidiga koder inte ger samma hash).
--
-- attempts finns för att en sexsiffrig kod annars är gissningsbar: utan
-- försöksräknare räcker en miljon anrop. Tre försök, sedan är koden bränd.
CREATE TABLE IF NOT EXISTS login_codes (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,       -- kort livslängd, ~10 min
  attempts    INTEGER NOT NULL DEFAULT 0,
  consumed_at INTEGER,                -- engångsbruk: satt = förbrukad
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_codes_email ON login_codes(email, created_at);
CREATE INDEX IF NOT EXISTS idx_codes_expiry ON login_codes(expires_at);

-- ── Sessioner ─────────────────────────────────────────────────────────────
-- Även sessionstoken lagras hashad, av samma skäl som koden. Kakan bär
-- klartexten, databasen bär bara hashen.
--
-- Att raden går att radera är hela poängen med att lämna capability-URL:en:
-- en anställd som slutar loggas ut genom att raden tas bort. En länk gick
-- inte att ta tillbaka.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  user_agent  TEXT                    -- endast för att kunden ska känna igen sin egen session
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- ── Vem når vilket team ───────────────────────────────────────────────────
-- Den här tabellen är det som gör "flera användare" säljbart: en plats är en
-- rad. Utan den är åtkomst en URL som alla delar, och då finns inget att ta
-- betalt per användare för.
--
-- role: 'owner' får bjuda in och stänga av, 'member' får använda teamet.
CREATE TABLE IF NOT EXISTS team_access (
  team_slug   TEXT NOT NULL REFERENCES teams(slug) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner','member')),
  invited_by  TEXT REFERENCES users(id),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (team_slug, user_id)
);
CREATE INDEX IF NOT EXISTS idx_access_user ON team_access(user_id);

-- ── Spärr mot utskicksmissbruk ────────────────────────────────────────────
-- Kodrutten skickar mejl till en adress som anges av den som ringer. Utan
-- spärr är den både en mejlbomb mot tredje part och ett sätt att bränna
-- avsändarens rykte. Räknas per e-post OCH per IP; båda behövs — den ena
-- stoppar riktade angrepp, den andra breda.
CREATE TABLE IF NOT EXISTS auth_throttle (
  bucket      TEXT PRIMARY KEY,       -- 'email:<adress>' eller 'ip:<adress>'
  count       INTEGER NOT NULL,
  window_at   INTEGER NOT NULL        -- start på innevarande fönster
);
