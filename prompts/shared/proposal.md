# Förslags-prompt

Tar output från research och skalning, producerar agent-förslag som
visas för användaren för godkännande innan generering.

## Input

Proposal-steget tar emot:

1. **Research-dokumentet** — kluster, prioriteringar, nedbrytning
2. **Skalningsbeslutet** — antal agenter (från `scale.md`)
3. **Skills-katalogen** — `skills-catalog.md` i repo-roten
4. **Intake-avgränsningar** — "rör inte"-svar från intake

## Ditt jobb

Omvandla research-kluster till konkreta agent-förslag. Varje kluster
över ribban *kan* bli en agent, men behöver inte. Du bestämmer vilka
kluster som motiverar en egen agent och vilka som bör slås ihop eller
hanteras av VD/VD-assistent.

VD och VD-assistent finns alltid. De räknas in i skalningsbeslutet.

## Steg

### 1. Mappa kluster → agenter

Gå igenom research-klustrena i prioritetsordning:

- **Kluster med hög AI-lämplighet och hög prioritet** → egen agent
- **Kluster med medel AI-lämplighet** → agent om skalningen tillåter,
  annars slå ihop med närliggande kluster
- **Kluster under ribban** → ingen agent. Nämn dem explicit som
  avvisade med motivering.

Antal agenter (inklusive VD och VD-assistent) får inte överstiga
skalningsbeslutet. Om research har fler kluster över ribban än vad
skalningen tillåter — slå ihop de minst distinkta.

### 2. VD och VD-assistent

VD och VD-assistent formuleras alltid, baserat på:

- **VD:** Om research identifierade prioriterings-/riktningsmoment,
  bygg VD:ns jobb på dem. Om inte, notera det och ge VD ett generiskt
  operativt jobb (för små team) eller rent strategiskt jobb (för
  stora team). Använd `ceo-small.md` eller `ceo-large.md` som mall.

- **VD-assistent:** Alltid operativ arbetspartner. Specificera vilka
  av teamets agenter den ska kunna hänvisa till. Använd
  `chief-of-staff.md` som mall.

### 3. Matcha skills

För varje föreslagen agent, gå igenom `skills-catalog.md` och fråga:
finns det en skill som direkt skulle göra den här agenten bättre,
baserat på ett konkret fynd från research?

- Max 3 skills per agent
- En motivering per skill, kopplad till ett specifikt moment eller
  delsteg från research
- Inga spekulativa kopplingar. Om motiveringen börjar med "kanske"
  — skippa.

### 4. Formulera förslag

Skriv varje agent i formatet nedan. Ordningen: VD först, VD-assistent
sedan, specialister i prioritetsordning.

## Output-format per agent

```markdown
### [Agentnamn]

**Jobb:** En mening som beskriver vad agenten gör i det dagliga.

**Motivering:** "[Citat eller referens från intake]" →
[Koppling till research-kluster och specifikt moment.]

**Triggas av:** [Typ av uppgift, fråga eller kommando som aktiverar
agenten. Konkret: "När användaren behöver skriva en produkttext"
inte "När det behövs innehåll".]

**Rör inte:** [Explicit avgränsning. Vad agenten medvetet inte gör,
även om det verkar närliggande.]

**Kapaciteter:**
- [verb + objekt, t.ex. "Skriver produkttexter i tre tonstilsvarianter"]
- [verb + objekt]
- [verb + objekt]
(3–6 stycken)

**Föreslagna skills:**
- [Skill-namn] — [motivering kopplad till specifikt fynd]
(0–3 stycken, eller "Inga" om ingen passar)

**Skalningsnot:** [För små team: vilka extra hattar bär agenten?
För stora team: vad gör den medvetet inte som en bredare agent
skulle göra?]
```

## Avvisade agenter

Lika viktigt som förslagna agenter. Lista varje kluster/moment som
*inte* blev en agent:

```markdown
## Avvisade

### [Kluster/moment-namn]
**Varför inte:** [Kort motivering — AI-lämplighet för låg,
frekvens för liten, redan hanteras av annan agent, etc.]
```

Minst en avvisning i en typisk körning. Om inget avvisas — ifrågasätt
om du har sänkt ribban.

## Osäkerheter från research

Om research-dokumentet har osäkerheter eller motsägelser — lyft dem
här med en kort rekommendation:

```markdown
## Flaggat för användaren

- [Osäkerhet] → Rekommendation: [fråga om X / bekräfta Y]
```

## Regler

1. **Varje agent motiveras med ett fynd.** Om du inte kan peka på
   ett konkret moment eller citat från intake/research — agenten
   ska inte finnas.

2. **Namn ska vara specifika.** "Innehållsskribent" slår
   "Textproduktions-agent". "Kundservice-triage" slår
   "Support-agent". Namnge efter vad agenten *gör*, inte vad
   den *är*.

3. **Skills motiveras separat.** En skill på en agent utan
   motivering är lika illa som en agent utan motivering.

4. **Respektera intake-avgränsningar.** Om användaren sa "rör inte
   kundkommunikation" — ingen agent får ha kundkommunikation i
   sina kapaciteter. Även om research säger att det vore värdefullt.

5. **Tentativa förslag för hypoteser.** Om en agents hela motivering
   vilar på `[hypotes]`-moment från research (läge B) — markera
   agenten som tentativ och säg det explicit.

6. **Kontextprofil påverkar agentdesign.** Moment med bullrig profil
   bör motivera en isolerad agent som inte delar kontext med andra.
   Moment med bred profil kan hanteras av VD-assistenten eller en
   agent med medvetet bred syn.

7. **Språk följer research.** Om research är på svenska, är
   förslaget på svenska.
