-- 0007 — veckobrev: teamets veckostart i inkorgen.
--
-- Varför den finns: portalens hela retentionsmodell förutsätter att kunden
-- kommer ihåg att logga in. Vecka tre gör hon inte det — och ett verktyg med
-- veckorytm som bara finns när man aktivt söker upp det tappar vanan först och
-- abonnemanget sedan. Ett mejl på måndag morgon dyker upp oavsett.
--
-- Det finns också en affärsmekanik i det, från halvårssimuleringen: värdet
-- bevisas hos utföraren men beslutet fattas av köparen. Ett mejl syns för båda.
--
-- OPT-IN, ALLTID. Ingen rad här betyder inget utskick. Kunden slår på det själv
-- i portalen, och varje brev bär en avregistreringslänk som fungerar utan
-- inloggning — att kräva inloggning för att slippa ett mejl är att inte låta
-- kunden slippa det.
--
-- En rad per (användare, team): samma person kan ha två team, och två kollegor
-- på samma team kan vilja olika. Nyckeln är därför sammansatt, precis som i
-- team_access.

CREATE TABLE IF NOT EXISTS weekly_digest (
  user_id       TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_slug     TEXT    NOT NULL REFERENCES teams(slug) ON DELETE CASCADE,
  -- 1 = måndag … 7 = söndag (ISO). Kunden väljer; måndag är förvalt eftersom
  -- brevet handlar om veckan som börjar.
  weekday       INTEGER NOT NULL DEFAULT 1 CHECK (weekday BETWEEN 1 AND 7),
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  -- Avregistreringstoken. Slumpad och unik, så att länken i brevet inte avslöjar
  -- konto-id och inte går att gissa fram för någon annans adress.
  token         TEXT    NOT NULL UNIQUE,
  -- Vilket dygn brevet senast gick. Gör körningen idempotent: en cron som
  -- fyrar två gånger, eller ett omförsök efter ett halvt fel, skickar inte
  -- samma brev igen. Samma grepp som stripe_session ger i teams.
  last_sent_day TEXT,
  created_at    INTEGER NOT NULL,
  PRIMARY KEY (user_id, team_slug)
);

-- Körningen frågar alltid "vilka ska ha brev i dag?", alltså på weekday+active.
CREATE INDEX IF NOT EXISTS idx_digest_due ON weekly_digest (active, weekday);
-- Avregistreringen slår upp på token och inget annat.
CREATE INDEX IF NOT EXISTS idx_digest_token ON weekly_digest (token);
