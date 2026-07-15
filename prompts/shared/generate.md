# Genereringsprompt

Skriver ut godkända agent-förslag som faktiska `.md`-filer i
målprojektets `.claude/agents/`. Sista steget i pipeline:n.

## Input

1. **Godkänt förslag** — output från proposal, efter användarens OK
2. **Research-dokumentet** — för att fylla i instruktionssektionerna
3. **Rätt mall:**
   - Team-builder: `templates/shared/agent-base.md` som grund,
     `templates/team-builder/ceo-small.md` eller `ceo-large.md` för
     VD, `templates/team-builder/chief-of-staff.md` för VD-assistent
   - Ai-consultant: `templates/ai-consultant/agent-pedagogical.md`
     som grund (byggs i fas 3)

## Ditt jobb

Ta varje godkänd agent från proposal och skriv en komplett `.md`-fil
som kan placeras i `.claude/agents/` och användas direkt.

## Steg

### 1. Skapa `.claude/agents/` om den inte finns

```bash
mkdir -p .claude/agents
```

### 2. Generera VD

Välj `ceo-small.md` eller `ceo-large.md` baserat på skalningsbeslut:
- ≤4 agenter totalt → `ceo-small.md`
- ≥5 agenter totalt → `ceo-large.md`

Fyll i alla platshållare med data från proposal och research:
- Jobb-meningen från proposal
- Kapaciteter — komplettera mallens grund med research-specifika
- Instruktioner — bygg från research-nedbrytningen

Skriv till `.claude/agents/ceo.md`.

### 3. Generera VD-assistent

Fyll i `chief-of-staff.md`:
- Lista teamets specialisters namn och domäner
- Definiera triage-reglerna: vad → vilken agent
- Anpassa mötesfunktionens deltagarlista till det faktiska teamet

Skriv till `.claude/agents/chief-of-staff.md`.

### 4. Generera specialister

För varje specialist i proposal:
- Använd `agent-base.md` som skelett
- Fyll i alla sektioner från proposal-data
- **Instruktionssektionen** är den viktigaste — bygg den från
  research-nedbrytningen (delsteg, AI-lämplighet per steg, vad
  agenten konkret ska göra)
- Inkludera skills med motivering
- Sätt samverkan relativt till VD och VD-assistent

Filnamn: kebab-case av agentnamnet.
"Innehållsskribent" → `innehallsskribent.md`
"Kundservice-triage" → `kundservice-triage.md`

### 5. Generera mötesmallar

Kopiera och anpassa mallarna i `templates/shared/meetings/` till
det specifika teamet:
- `project-review.md` — lista vilka agenter som deltar
- `specific-improvement.md` — anpassa exemplen till teamets domäner
- `whats-next.md` — referera till teamets specialister

Skriv till `.claude/agents/meetings/`.

### 6. Visa sammanfattning

Efter generering, visa användaren:

```
Genererade filer:
- .claude/agents/ceo.md
- .claude/agents/chief-of-staff.md
- .claude/agents/[specialist-1].md
- .claude/agents/[specialist-2].md
- .claude/agents/meetings/project-review.md
- .claude/agents/meetings/specific-improvement.md
- .claude/agents/meetings/whats-next.md

Teamet har [antal] agenter. Prata med VD-assistenten för att
komma igång.
```

## Regler

1. **Skriv inte över befintliga filer tyst.** Om `.claude/agents/`
   redan finns och innehåller filer — fråga användaren. Om det är
   en uppdatering (läge C), visa diff istället för att skriva.

2. **Varje fil ska kunna läsas fristående.** En människa som öppnar
   `innehallsskribent.md` ska förstå vad agenten gör, varför den
   finns, och hur den samverkar med teamet — utan att behöva läsa
   andra filer.

3. **Kommentarblocket är obligatoriskt.** Varje fil börjar med en
   HTML-kommentar som förklarar varför agenten finns, kopplad till
   intake-fyndet.

4. **Instruktioner är inte proposal-texten kopierad.** Proposal
   beskriver agenten *för användaren*. Instruktioner beskriver
   agentens jobb *för agenten*. Ton och detalj skiljer sig.

5. **Filnamn på engelska eller samma språk som output.** Kebab-case.
   Inga specialtecken i filnamn (inga å, ä, ö).

6. **Språk i filerna följer intake.** Om intake var på svenska, är
   agentfilernas innehåll på svenska.
