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
- Instruktioner — bygg från research-nedbrytningen om den finns.
  Om research inte bröt ner VD-momentet (t.ex. för att det var
  implicit eller under ribban), bygg instruktioner från
  research-sammanfattningen, kontextfaktorer och skalningsbeslutet
  istället. VD behöver alltid instruktioner — de kan bara inte
  alltid byggas från nedbrytningen.

Skriv till `.claude/agents/ceo.md`.

### 3. Generera VD-assistent

Fyll i `chief-of-staff.md`:
- Lista teamets specialisters namn och domäner
- Definiera triage-reglerna: vilken typ av fråga → vilken agent
- Trösklar: vad hanterar VD-assistenten själv, vad eskaleras
  till VD, vad skickas till specialist
- Mötesfunktionen: integrera de tre mötesmallarna genom att
  specificera vilka av teamets agenter som typiskt deltar i varje
  mötestyp, och vilka typer av frågor som triggar ett möte vs.
  en direkt hänvisning till specialist
- Regeln "inte allt är ett möte" ska vara konkret: ge exempel
  på frågor i det här teamet som *inte* ska bli möten

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

### 6. Generera team-presentation (HTML)

Läs `templates/shared/team-presentation.md` — den specificerar design,
sektioner och regler för presentationen.

Skapa en single-file HTML som presenterar det genererade teamet visuellt.
All data kommer från proposal och research — inget fabricerat.

**Input du behöver:**
- Företagsnamn och bransch (från intake)
- Alla godkända agenter med jobb, kapaciteter och triggers (från proposal)
- Avvisade moment/kluster med motiveringar (från research)
- Eventuella skills per agent (från proposal)
- Källa (intervju/externt) — styr om hypotes-varning visas
- Körningsmetadata från research (antal moment, kluster, avvisade)

**Ai-consultant-läge:** Inkludera även sektion 7 (första-projekt) enligt
mallen, med data från första-projekt-briefen.

Skriv till `.claude/agents/team-presentation.html`.

### 7. Generera portal-konfiguration (om byggd i builder-repot)

> Detta och nästa steg gäller bara när körningen sker **inuti
> agent-team-builder-repot** (konsult-cockpiten med `portal/` och `site/`).
> Om de katalogerna inte finns — hoppa över steg 7–8.

Läs `templates/shared/portal-team.md`. Skapa `portal/teams/<slug>.js` som
sätter `window.TEAM` med en agent per godkänd agent (varje agent blir en
systemprompt byggd från jobb, kapaciteter, triggers och "Rör inte"). Lägg
till en rad i `portal/teams/index.js` (idempotent — uppdatera om slug finns).

`<slug>` = kebab-case av företagsnamnet, inga å/ä/ö.

### 8. Generera showcase-sida (om byggd i builder-repot)

Läs `templates/shared/showcase-page.md`. Skapa `site/<slug>.html` — en
scroll-story som visar hela processen (intake → research → skalning →
[första projekt] → team) med `showcase.css`. Använd `site/bonusloots.html`
som strukturell mall. Lägg till ett galleri-kort i `site/index.html`
(idempotent) och uppdatera hero-siffrorna där.

Sidans "Prova teamet live"-knapp länkar till `../portal/?team=<slug>`, så
showcase och portal pekar på samma kund.

### 9. Visa sammanfattning

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
- .claude/agents/team-presentation.html
[om byggd i builder-repot:]
- portal/teams/[slug].js          (+ rad i portal/teams/index.js)
- site/[slug].html                (+ kort i site/index.html)

Teamet har [antal] agenter. Prata med VD-assistenten för att
komma igång. Öppna team-presentation.html för en visuell
överblick av teamet.

[om portal/showcase genererades:]
Kunden kan nu nås i galleriet (site/index.html → [slug].html) och
i portalen (portal/?team=[slug]).
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

7. **Hypotes-varning för läge B.** Om `källa: externt` — lägg till
   en varningssektion i varje genererad agentfil, direkt efter
   kommentarblocket:

   ```markdown
   > ⚠ **Det här teamet vilar på hypoteser.** Det är byggt från publik
   > information om företaget, inte från intervju. Alla antaganden om
   > arbetsmoment, smärtpunkter och verktyg kan vara fel. Kör
   > `/update-team` efter att ha använt teamet en vecka för att
   > justera mot verkligheten.
   ```

8. **Agenter startar utan data.** Instruktioner som refererar till
   datakällor (materialtabeller, produktionsloggar, kundregister etc.)
   måste hantera att dessa inte finns dag 1. Skriv explicit:
   - Var agenten förväntar sig att hitta datan (filnamn, format)
   - Vad agenten ska göra om datan inte finns (be användaren
     komplettera, inte gissa)
   - Förslag på hur användaren kan skapa datakällan (t.ex. "skapa
     en fil `material.md` med era vanligaste material och deras
     egenskaper")
