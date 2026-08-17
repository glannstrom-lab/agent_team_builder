-- 0006 — fel som lämnar ett spår någon kan läsa.
--
-- Varför den finns: en bugg gjorde produkten stum i tio dagar (6–16 augusti
-- 2026) utan att något larm gick, och den sänkte en demo. Enda spåret var
-- `console.error` i en Pages Function, som bara syns i
-- `wrangler pages deployment tail` medan någon aktivt tittar. Krediten hos
-- OpenRouter kan ta slut klockan 03 och portalen svara 503 till varje betalande
-- kund fram till morgonen — och den enda som upptäcker det är kunden.
--
-- Tabellen är avsiktligt mager: dygn, felkod, antal och när det senast hände.
-- INGET innehåll, ingen fråga, inget kund-ID. Samma linje som ai_usage och
-- ai_budget: vi bokför att något hänt och hur mycket, aldrig vad. Det som
-- behövs för att `/api/health` ska kunna säga "tjänsten står stilla" och för
-- att en morgon efteråt gå att rekonstruera.
--
-- `last_at` är millisekunder sedan epok (samma som nowMs() i auth/_lib.js), inte
-- ett datum: hälsokontrollen behöver veta om felet hände för två minuter sedan
-- eller i går morse, och en dygnsrad kan inte svara på det.

CREATE TABLE IF NOT EXISTS ai_errors (
  day     TEXT    NOT NULL,            -- 'ÅÅÅÅ-MM-DD' i UTC, som ai_budget
  code    TEXT    NOT NULL,            -- 'service_down' | 'upstream' | 'network'
  count   INTEGER NOT NULL DEFAULT 0,
  last_at INTEGER NOT NULL DEFAULT 0,  -- ms sedan epok
  PRIMARY KEY (day, code)
);

-- Hälsokontrollen frågar alltid "har det hänt något nyligen?", alltså på
-- last_at. Utan index blir det en full scan så fort tabellen har några
-- hundra rader, och hälsokontrollen är det enda som pollas ofta.
CREATE INDEX IF NOT EXISTS idx_ai_errors_last_at ON ai_errors (last_at);
