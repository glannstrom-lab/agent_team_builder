-- Vi kör AI:n på vår nyckel (beslutat 2026-08-06).
-- Applicera lokalt:  npm run db:migrate:local
-- Applicera skarpt:  npm run db:migrate
--
-- Fram till nu betalade kunden sin egen förbrukning med en egen API-nyckel,
-- och då behövde ingen räkna. Nu är förbrukningen vår kostnad, och det som
-- inte mäts går inte att sätta ett tak för. Två tabeller, för de svarar på
-- olika frågor:
--
--   ai_budget  — "vad kostar hela tjänsten i dag?" Ett dygn per rad. Skyddar
--                kassan mot att någon skriptar bygget: taket är globalt och
--                slår till oavsett hur många konton eller IP-adresser som
--                används. Utan den är en öppen rutt på vår nyckel en öppen kran.
--
--   ai_usage   — "hur mycket har det HÄR kontot använt den här månaden?"
--                Det är den som gör fair use möjlig att hävda, och som senare
--                gör det möjligt att prissätta en nivå per förbrukning i
--                stället för per gissning.
--
-- Frågornas innehåll lagras aldrig. Bara antal och tokens — det är allt som
-- behövs för att räkna, och allt vi vill ansvara för när vi är biträde.

CREATE TABLE IF NOT EXISTS ai_budget (
  day        TEXT PRIMARY KEY,           -- 'ÅÅÅÅ-MM-DD' i UTC
  calls      INTEGER NOT NULL DEFAULT 0,
  input_tok  INTEGER NOT NULL DEFAULT 0,
  output_tok INTEGER NOT NULL DEFAULT 0
);

-- subject: 'user:<id>' för inloggade, 'anon' för bygget (som är öppet med
-- flit — att kräva konto för att få se vad produkten gör vore att sätta
-- tillbaka exakt den tröskel vi just tagit bort).
CREATE TABLE IF NOT EXISTS ai_usage (
  subject    TEXT NOT NULL,
  period     TEXT NOT NULL,              -- 'ÅÅÅÅ-MM'
  calls      INTEGER NOT NULL DEFAULT 0,
  input_tok  INTEGER NOT NULL DEFAULT 0,
  output_tok INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subject, period)
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_period ON ai_usage(period);
