# team-builder

Team-builder är det snabbare, teknikare-orienterade läget. Det förutsätter
att användaren vet vad en subagent är och kan läsa markdown-filer. Intake är
kort, pedagogiken är minimal, output är rå men välkommenterad.

## När man använder det

- Du bygger ett team åt ett eget projekt.
- Du hjälper en kollega eller vän som redan kör Claude Code.
- Du vill snabbt generera ett team för ett känt företag (t.ex. IKEA) som
  demo eller referens.

För kunduppdrag där användaren är ny på AI och behöver pedagogik — använd
`ai-consultant`-läget istället.

## Tre ingångslägen

### Läge A — Intervju

`/build-team` i användarens eget projekt. Systemet ställer 5–6 frågor (se
`prompts/team-builder/intake-interview.md`). Fråga 4 ("vilka 3 moment
återkommer oftast och tar mest tid") och fråga 5 ("var klämmer skon") är de
viktigaste — de ger research-steget bränsle.

### Läge B — Externt företag

`/build-team IKEA`. Systemet resonerar från publik kännedom om företaget.
Output märks tydligt som hypotes, inte diagnos. Om systemet inte känner till
företaget → falla tillbaka på läge A.

### Läge C — Uppdatering

Om `.claude/agents/` redan finns → `/update-team`. Systemet läser befintliga
agenter, frågar vad som har förändrats, och föreslår en diff. Default är
torrkörning; applicering kräver godkännande. Skriver aldrig över tyst.

## Flöde

```
Intake  →  Research  →  Skalning  →  Förslag  →  Bekräftelse  →  Generera
```

Research och skalning är gemensamma med ai-consultant-läget. Se
`prompts/shared/research.md` och `docs/scaling.md`.

## Output

Skrivs till användarens `.claude/agents/` i målprojektet:

- `ceo.md` — alltid
- `chief-of-staff.md` — alltid
- 0–12 specialistagenter beroende på storlek

Plus `meetings/` med de tre mötesmallarna (se `docs/meetings.md`).

Varje fil börjar med en kommentarblock som förklarar varför agenten finns,
kopplad till ett konkret intake-fynd. Är motiveringen svag — agenten borde
inte ha funnits där från början.

## Skillnader mot ai-consultant

| Aspekt              | team-builder           | ai-consultant              |
|---------------------|------------------------|----------------------------|
| Intake-längd        | 5–6 frågor             | Längre, inkluderar mognad  |
| Första projekt      | Inget eget steg        | Eget steg före team        |
| Pedagogik i output  | Minimal (kommentarer)  | Situerad, i varje fil      |
| Överlämning         | Inte aktuellt          | Explicit fas               |
| Skalning            | Storlek                | Storlek + mognad           |
| Tid att köra        | Minuter                | Del av ett uppdrag         |

## Kvalitetstest

Team-builder-läget är klart nog när:

- Tre företag i samma storleksklass ger tre meningsfullt olika team
- Läge A och läge B för samma företag ger liknande men inte identiska team
- Solo-team (2–4 agenter) och enterprise-team (10–14) är strukturellt olika
- Varje agent kan motiveras med ett konkret fynd
- `/update-team` föreslår diff utan att skrota befintligt
- Minst en föreslagen agent avvisas i en typisk körning
