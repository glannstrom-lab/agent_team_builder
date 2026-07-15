# ai-consultant

Ai-consultant-läget är för kunduppdrag. Målet är inte att leverera ett
agent-team åt en tekniker — det är att lära en mindre eller medelstor
verksamhet att se vilka problem som lämpar sig för AI och bygga skarpa små
verktyg mot dem. Leverabeln är **kompetens och ett fungerande första
projekt**, inte en rapport.

## Positionering

Du är en hands-on bygg-coach, inte en traditionell AI-strategikonsult. Ditt
värde är att du *bygger* tillsammans med kunden istället för att analysera
dem på avstånd. Verktyget ska stödja det arbetssättet, inte imitera McKinsey.

Konsekvens för tonen: allt material som kunden ser ska vara konkret och
problemorienterat. "Den här agenten finns för att ni sa att ni lägger tre
timmar i veckan på att sortera leads" är rätt. "Den här agenten använder en
ReAct-loop" är fel, även om det är sant.

## Kundens mognad är viktigare än storlek

Företagsstorlek säger dig *hur komplext* teamet kan vara. AI-mognad säger
dig *vad kunden kan ta emot just nu*. Mognaden är viktigare för
första-projekt-beslutet.

**AI-nybörjare** — har knappt provat AI, osäker på vad det faktiskt gör.
Hårt dämpat agentantal oavsett företagsstorlek (exakt regel:
`prompts/shared/scale.md` steg 2). Första projektet måste vara
litet nog att lyckas med på en vecka. Pedagogiken fokuserar på "vad är det
AI faktiskt gör här".

**AI-vana** — använder ChatGPT eller Claude regelbundet men har inte byggt
något. Dämpat agentantal (exakt regel: `prompts/shared/scale.md` steg 2 —
enda facit, siffror upprepas inte här). Pedagogiken fokuserar på
skillnaden mellan att *prompta*
och att *bygga* — varför ett agent-team är kvalitativt annorlunda än att
ha en chatt-flik öppen.

**AI-byggare** — har provat bygga själva, kanske lite halvdant, vill bli
bättre. Full skalningstabell enligt företagsstorlek. Pedagogiken fokuserar
på arkitektur, underhåll och hur man undviker att bygga skräp.

Se `docs/scaling.md` för exakt regel.

## Flöde

```
Mognadsintake
      │
      ▼
Research (delad med team-builder)
      │
      ▼
Skalning (mognadsjusterad, se scale.md)
      │
      ▼
Första-projekt-identifiering  ← egen fas, unik för konsult-läget
   (körs EFTER research — kandidaterna korskörs mot research-momenten)
      │
      ▼
Team-förslag (anpassat efter mognad)
      │
      ▼
Bekräftelse med pedagogiska förklaringar
      │
      ▼
Generera agent-team + första-projekt-brief
      │
      ▼
Arbeta tillsammans med kunden på första projektet
      │
      ▼
Överlämning med dokumentation
```

De två unika stegen — första-projekt-identifiering och överlämning — är
konsult-lägets hjärta. Allt annat kunde ha gjorts av team-builder med en
pedagogik-flagga.

## Första-projekt-identifieringen

Det här är det enskilt viktigaste steget och det som avgör om uppdraget
lyckas. Dåliga första projekt dödar AI-initiativ.

Kriterier (alla måste vara uppfyllda):

1. **Litet i tid.** Ska ge första värde inom en vecka.
2. **Ägs av en person.** Inte ett tvärfunktionellt projekt som kräver
   koordinering. En person känner igen problemet och kan prova lösningen.
3. **Mäter något konkret.** "Sparar X timmar per vecka" eller "minskar fel
   på Y", inte "förbättrar kvaliteten i allmänhet".
4. **Fallback existerar.** Om AI-lösningen inte fungerar ska verksamheten
   inte stå stilla. Kritiskt för förtroende på tidiga projekt.
5. **Kan underhållas av kunden.** Om bara du kan underhålla det har du
   byggt fel sak.
6. **Har en naturlig version 2.** När v1 funkar ska det vara uppenbart vad
   som kommer sen. Momentum.

Se `docs/first-project.md` för prompt och exempel.

**Regeln:** verktyget ska föreslå högst tre kandidater och rangordna dem.
Om ingen kandidat uppfyller alla sex kriterier → säg det uttryckligen och
gå tillbaka till mognadsintake. Ett uppdrag utan bra första projekt ska
inte starta.

## Agent-teamet i konsult-läget

Samma struktur som team-builder men med pedagogiska sektioner i varje fil:

- **Jobb** och **Motivering** som vanligt
- **Varför just denna agent för er** — refererar explicit till vad kunden
  sa i intake. "Ni nämnde att…"
- **Så här pratar ni med den** — konkreta exempel på hur kunden använder
  agenten dagligen.
- **När ni vill ändra den** — kort anvisning om vad man ändrar och var.

Det dubblar ungefär längden på varje agent-fil. Det är värt det — kunden
läser dessa sektioner när de är relevanta, inte som abstrakt kurs i förskott.

VD-assistenten har en extra roll i konsult-läget: den är också kundens
**guide till sitt eget team**. Den vet varför varje agent finns, kan förklara
det på kundens nivå, och påminner vänligt om vilken agent som är rätt för
en given uppgift. Det är viktigt för att kunden inte ska glömma bort
specialistagenterna och bara prata med VD-assistenten om allt.

## Överlämningsfasen

Någonstans slutar uppdraget. Då behöver kunden:

1. **Veta vad de har.** En kort inventering av teamet och varför det ser ut
   så det gör.
2. **Veta hur de ändrar det.** Konkreta exempel: "om ni vill lägga till en
   agent för X, gör så här".
3. **Veta när de ska ringa tillbaka.** Tecken på att projektet har växt ur
   sin nuvarande form. Det här är viktigt för både kunden och dig.
4. **Ha ett nästa steg i handen.** Det naturliga v2-projektet från punkt 6
   i första-projekt-kriterierna.

Se `templates/ai-consultant/handoff-document.md`.

## Vad verktyget inte gör

- **Prissättning.** Verktyget föreslår inte vad du ska ta betalt. Ditt jobb.
- **CRM.** Verktyget kommer inte ihåg kunder mellan uppdrag.
- **Automatisk mognadsbedömning.** Verktyget frågar rakt ut — "har ni byggt
  något själva med AI tidigare" — istället för att gissa från indirekta
  signaler. Snabbare och ärligare.
- **AI-teori i förskott.** All pedagogik är situerad i det kunden ser just
  nu. Verktyget producerar inte kurser.
- **`.docx`/`.pdf`-rapporter.** v1 producerar markdown. Krok finns för
  senare.

## Kvalitetstest

Konsult-läget är klart nog när:

- Verktyget frågar om AI-mognad före allt annat
- Tre fiktiva kunder i olika mognadsnivåer ger meningsfullt olika output
- Första projektet uppfyller alla sex kriterier i `docs/first-project.md`
- Pedagogiska sektioner är problemorienterade, inte tekniska
- En nybörjarkund får färre agenter än skalningstabellen för deras storlek
- Överlämningsdokumentet innehåller "när ringer ni tillbaka"
- Verktyget vågar avvisa ett uppdrag när inget bra första projekt finns
