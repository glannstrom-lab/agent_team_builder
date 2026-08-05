# Teamroller

Varje team innehåller alltid två fasta agenter: VD och VD-assistent. Resten
(0–12 specialister) bestäms av research-steget.

## VD (CEO)

Sätter riktning, prioriterar, fattar trade-off-beslut.

### Den avgörande regeln

**För små team måste VD också ha ett konkret operativt jobb.** Abstrakt
strategi räcker inte. En solo-VD som bara "ger strategiska råd" är teater.

Konkreta operativa jobb för en solo-VD:

- Prioritera veckans tasks när användaren är osäker
- Hålla roadmap uppdaterad baserat på vad som faktiskt händer i projektet
- Fatta knop-beslut när två agenter ger motstridiga rekommendationer
- Läsa av när användaren glider bort från det den sa var viktigt

För stora team får VD bara göra det en VD faktiskt gör: riktning och
trade-offs. Då är det operativa jobbet utfördelat på andra agenter.

Två mallar finns:

- `templates/team-builder/ceo-small.md` — operativ
- `templates/team-builder/ceo-large.md` — strategisk

Ai-consultant-läget använder `templates/ai-consultant/ceo-beginner.md` för
nybörjarkunder, vilket är ännu mer operativ och ännu mer pedagogisk.

## VD-assistent (Chief of Staff)

**Den agent användaren pratar mest med i det dagliga arbetet.**

Har två sammanflätade ansvar:

### Primärt: operativ arbetspartner

Hjälper användaren prioritera, sammanfatta, orientera sig. "Var är jag nu?
Vad borde jag göra härnäst? Hur står det till?" Det här är det jobb som
gör att agenten används ofta nog för att den ska märka saker.

### Sekundärt: håller teamet relevant

Som en biprodukt av det dagliga arbetet observerar VD-assistenten vilka
agenter som faktiskt används, vilka som inte gör det, och när användaren
pratar om saker som inget i teamet täcker. Lyfter detta *när det blir
relevant* — inte ständigt, och inte som ett separat granskningsjobb.
Föreslår `/update-team` när mönstret är tydligt.

Det här är skillnaden mellan en agent man verkligen pratar med och en som
är en granskare som aldrig används. VD-assistenten är en medarbetare som
råkar ha granskning som biuppdrag, inte tvärtom.

### Mötesfunktionen

VD-assistenten äger också mötesfunktionen — triagen, inramningen och
körningen av de tre mötestyperna. Se `docs/meetings.md`.

### Extra roll i ai-consultant-läget

För kundteam är VD-assistenten också **kundens guide till sitt eget team**.
Den vet varför varje agent finns, kan förklara det på kundens nivå, och
påminner vänligt om vilken agent som är rätt för en given uppgift. Det är
viktigt för att kunden inte ska glömma bort specialistagenterna och bara
prata med VD-assistenten om allt.

## Specialister

Allt utöver VD och VD-assistent. Bestäms av research-steget baserat på
konkreta arbetsmoment som identifierats i intake.

**Regler:**

- Varje specialist måste motiveras av ett fynd
- Ingen specialist ska överlappa för mycket med en annan
- För små team: slå ihop hellre än att dela upp
- För stora team: dela upp hellre än att slå ihop
- Specialister får inte bara vara "research-agent" eller "writer-agent" —
  de ska ha ett jobb som är specifikt för det här företaget
- Varje specialist har ett eget **Perspektiv** (blicken den resonerar från)
  och en **Leverans** med "Klart när"-punkter som går att svara ja/nej på.
  Två agenter som delar perspektiv är samma agent. Sektionerna finns i
  `templates/shared/agent-base.md` och byggs in i portalens systemprompter —
  utelämnas de blir agenten en generalist med nytt namn.

## Hur agenterna samverkar

Användaren pratar primärt med VD-assistenten. VD-assistenten kan säga:

- "Det här är en fråga för specialist X, prata direkt med den"
- "Det här kräver ett möte — ska jag kalla teamet?"
- "Det här är ett beslut VD ska fatta, jag hämtar den"
- "Det här kan jag hantera själv"

Specialisterna pratar sällan med varandra direkt. De pratar via användaren
eller via VD-assistenten som sammanställer. Det undviker agent-till-agent-
teater och håller kontexten hos människan.
