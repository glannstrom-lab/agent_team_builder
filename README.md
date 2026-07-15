# Agent Team Builder

Generera skräddarsydda team av Claude Code-subagents åt företag och projekt.
Ett verktyg för dig som bygger egna projekt, och ett verktyg för dig som
hjälper andra komma igång med AI.

## Snabbstart

1. Klona repot.
2. Öppna ditt målprojekt i Claude Code (inte det här repot — det här är
   verktyget, inte arbetsytan).
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
- Ett hostat verktyg. Allt körs via din egen Claude Code-installation.
- En AI-strategirapport. Verktyget producerar fungerande agent-team och
  pedagogiskt material, inte whitepapers.

## Mer

- `CLAUDE.md` — översikt över hur projektet är uppbyggt.
- `docs/team-builder.md` — detaljer om team-builder-läget.
- `docs/ai-consultant.md` — detaljer om konsult-läget.
- `examples/` — exempel-output för olika företagstyper.
