# Mitt AI-team (agent-team-builder)

Publikt namn: **Mitt AI-team** — [mittaiteam.se](https://mittaiteam.se). Repot
och kärnverktyget behåller arbetsnamnet *agent-team-builder*.

Generera skräddarsydda team av Claude Code-subagents åt företag och projekt.
Ett verktyg för dig som bygger egna projekt, och ett verktyg för dig som
hjälper andra komma igång med AI.

## Snabbstart

1. Klona repot.
2. Öppna **det här repot** i Claude Code. Kommandona (`/build-team`,
   `/consult` …) och prompterna de läser ligger här — de finns inte i
   ditt målprojekt. Verktyget frågar var teamet ska skrivas
   (målprojektets `.claude/agents/`); ange sökvägen till ditt projekt.
3. Kör:
   - **`/build-team`** — om du bygger ett team för dig själv eller någon
     som redan kan Claude Code.
   - **`/build-team IKEA`** — om du vill generera ett team för ett existerande
     företag via dess namn (verktyget researchar företaget åt dig).
   - **`/update-team`** — om `.claude/agents/` redan finns och du vill
     uppdatera teamet istället för att skapa från början.
   - **`/consult`** — om du kör ett konsultuppdrag åt en kund som är ny på
     att bygga med AI.

## Vad du får

Ett `.claude/agents/`-bibliotek med 2–14 subagents skräddarsydda efter
verksamheten, inklusive alltid en VD och en VD-assistent. Plus mötesmallar
i `meetings/` och (i konsult-läget) ett första-projekt-dokument och en
överlämningsguide.

## Vad du inte får

- Ett generiskt "team-i-en-låda". Om output ser likadant ut oavsett input
  är verktyget trasigt.
- Ett hostat verktyg — i kärnan. Den körs via din egen Claude Code-installation
  och kräver ingen server. Ovanpå finns ett webblager
  (builder/galleri/portal/branscher) som körs i webbläsaren mot AI-proxyn
  `/api/ai`, samt ett tunt köp/leverans-lager (Cloudflare Pages Functions + D1)
  för konton, betalning och moln-sparade team.
- En AI-strategirapport. Verktyget producerar fungerande agent-team och
  pedagogiskt material, inte whitepapers.

## Mer

- `CLAUDE.md` — översikt över hur projektet är uppbyggt.
- `docs/team-builder.md` — detaljer om team-builder-läget.
- `docs/ai-consultant.md` — detaljer om konsult-läget.
- `examples/` — exempel-output för olika företagstyper.
- `docs/produktstrategi-sjalvbetjaning.md` — affärs-/produktstrategi och roadmap.
- `docs/m2-backend-spec.md` — spec för backend-lagret (Stripe + D1).

## Webbgränssnitt (valfritt)

Fyra statiska appar gör verktyget demobart och användbart för icke-tekniska
kunder, plus en hub som binder ihop dem:

- **`builder/`** — bygg ett team live i webbläsaren (kör den riktiga pipelinen).
- **`site/`** — galleri med fem exempel som visar hela processen, plus
  "En vecka med teamet" som visar vardagen. Här bor också designsystemet.
- **`portal/`** — kundportal där kunden chattar med sitt team. Arbetsytan
  (veckostart, rutiner, möten, delat minne) är det som skiljer den från en
  vanlig AI-chatt. Installerbar PWA.
- **`verticals/`** — branschlandningssidor, en live-demo per bransch.

Kör lokalt från repo-roten (`npm run dev` eller `python -m http.server 8420`)
och öppna `http://localhost:8420/`. Bygg/deploy till Cloudflare Pages med
`npm run build` / `npm run deploy`.

Builder och portal anropar `POST /api/ai`, som kör `openai/gpt-oss-120b` på vår
OpenRouter-nyckel. Kunden har ingen egen nyckel. Bygget är gratis och
obegränsat; portalen kräver ett köpt team. Demolägen (`?demo=1`) visar allt utan
konto, och galleriet kräver ingenting alls.

Vad som är kvar att bygga: **`docs/roadmap.md`** (arbetet, prioriterat) och
**`docs/lansering.md`** (hålen mellan löfte och leverans). Arkitekturen i
`CLAUDE.md`.
