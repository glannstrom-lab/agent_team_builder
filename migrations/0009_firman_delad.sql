-- SP23 (2026-10-24) — det kunden och hennes egen AI delar.
-- Applicera lokalt:  npm run db:migrate:local
-- Applicera skarpt:  npm run db:migrate
--
-- Mikael 2026-10-24: "claude och chatgpt behöver kunna komma åt allt på vår
-- sida, för användaren använder sig av både och och vill inte behöva skriva
-- samma saker till båda sidorna."
--
-- Fram till nu låg företagsminnet, underlagen och kundregistret bara i
-- kundens webbläsare (localStorage). Det gjorde dem osynliga för Claude och
-- ChatGPT, och det som plattformarna fick veta stannade där. Här blir de
-- delade: portalen läser och skriver dem via /api/firma, plattformarna via
-- /mcp, och båda ser samma sak.
--
-- Samtalen med agenterna ligger KVAR i webbläsaren. De är långa, personliga
-- och det plattformarna redan har på sin sida; det som ska delas är det man
-- annars hade fått skriva två gånger.
--
-- typ: 'minne'     företagsminnet — en enda post, id 'text', data {text}
--      'underlag'  ett inklistrat eller uppladdat dokument, data {title, text, on}
--      'org'       en organisation (kommun, förening, företag, privatperson), data {namn, typ, not}
--      'kontakt'   en människa, data {namn, roll, org, not} — org är en org-posts id
-- updated_by: 'portal', 'Claude', 'ChatGPT' eller 'AI' — så att portalen kan
-- säga varifrån något kom.
CREATE TABLE IF NOT EXISTS firma_poster (
  team_slug   TEXT NOT NULL REFERENCES teams(slug) ON DELETE CASCADE,
  typ         TEXT NOT NULL CHECK (typ IN ('minne','underlag','org','kontakt')),
  id          TEXT NOT NULL,
  data        TEXT NOT NULL,              -- JSON
  updated_at  INTEGER NOT NULL,
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (team_slug, typ, id)
);
