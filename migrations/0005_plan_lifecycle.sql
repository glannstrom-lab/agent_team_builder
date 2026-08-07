-- Pass 2 — planen får en livscykel.
-- Applicera lokalt:  npm run db:migrate:local
-- Applicera skarpt:  npm run db:migrate
--
-- Fram till nu kunde `teams.plan` bara skrivas EN gång: webhooken satte
-- 'trial' eller 'standard' vid köpet, och sedan aldrig mer. Spärrlistan i
-- functions/api/_plan.js läste 'expired' / 'cancelled' / 'refunded' — värden
-- ingen kod någonsin skrev. Följden var att 90 kr gav portalåtkomst i evighet
-- och att 290-nivån aldrig kunde säljas.
--
-- Två saker saknades i schemat för att kunna ändra det:
--
--  1. VILKET abonnemang teamet hör till. Stripes livscykelhändelser
--     (customer.subscription.deleted, invoice.payment_failed) bär ett
--     subscription-id, inte en session. Utan kolumnen går de inte att koppla
--     till ett team annat än via kunden — och en kund kan ha flera team.
--  2. NÄR planen senast ändrades. Inte för koden, utan för människan: när en
--     kund mejlar "vi blev utelåsta" är frågan alltid vilken händelse som
--     stängde dörren och när.
--
-- Provmånadens slutdatum får medvetet INGEN kolumn. Det räknas ur
-- teams.created_at + 30 dagar, exakt som portalen redan gör i
-- trialNoticeFor() (portal/app.js). Två sanningar om samma datum skulle glida
-- isär, och den som glider är alltid den kunden inte ser.

ALTER TABLE teams ADD COLUMN stripe_subscription TEXT;
ALTER TABLE teams ADD COLUMN plan_changed_at INTEGER;

-- Uppslag från Stripe-händelse till team sker på varje webhook. Utan index
-- blir de fulla tabellskanningar — billigt i dag, men det är den sortens sak
-- man inte upptäcker förrän det inte är billigt längre.
CREATE INDEX IF NOT EXISTS idx_teams_subscription ON teams(stripe_subscription);
CREATE INDEX IF NOT EXISTS idx_teams_customer ON teams(stripe_customer);
