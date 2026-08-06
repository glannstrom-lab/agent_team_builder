-- M2a-2 — köpflödet (Stripe Checkout + webhook).
-- Applicera lokalt:  npm run db:migrate:local
-- Applicera skarpt:  npm run db:migrate
--
-- Tabellerna finns sedan 0001_init.sql. Det som saknades var två saker som
-- 0001 inte kunde veta, eftersom konton inte fanns då:
--
--  1. VILKEN nivå som köptes. teams.tier är låst av en CHECK till
--     'self-serve' | 'managed' — arkitekturnivån, inte prisnivån. Både
--     provmånaden och köpet är 'self-serve', och utan en egen kolumn går det
--     inte att se vad kunden faktiskt betalat för. Det behövs för att veta när
--     en provmånad tar slut.
--  2. VEM som köpte. Sedan M3 levereras ett team till ett konto, inte till en
--     hemlig länk. Mejladressen kommer från Stripe vid betalningen och sparas
--     på utkastet, så att webhooken kan skapa kontot även om den kommer i
--     retry långt efter att kunden stängt fliken.

ALTER TABLE teams ADD COLUMN plan TEXT;          -- 'buy' | 'trial-byo' | (senare) 'trial-hosted' | 'sub-hosted'
ALTER TABLE pending ADD COLUMN plan TEXT;
ALTER TABLE pending ADD COLUMN email TEXT;

-- Uppslag från Stripes session till teamet sker på varje pollning från
-- aktiveringssidan. stripe_session är redan UNIQUE i teams (vilket ger både
-- index och idempotens vid webhook-retries), så bara pending behöver ett här.
CREATE INDEX IF NOT EXISTS idx_pending_created ON pending(created_at);
