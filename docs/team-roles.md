# Teamroller

Varje team har alltid en VD-assistent. **En separat VD-agent finns bara
från *litet* och uppåt** (3+ personer). Resten (0–12 specialister) bestäms
av research-steget.

## Kunden är VD:n i små firmor (beslut 2026-10-23, KA14)

I solo, mikro och personläget är kunden själv VD:n. Det är produktens
berättelse — "du är chefen", VD-kontoret är kundens rum — och det är också
det enda som stämmer: i en firma på en eller två personer finns ingen annan
som fattar besluten. En VD-agent där blev teater. Uppmätt 2026-09-26: alla
fyra simulerade team fick en, två av dem bar kundens eget namn ("Maria" hos
Maria), och ingen av kunderna använde den.

Prioriteringsmomenten försvinner inte — de byter form. **VD-assistenten
förbereder valen och kunden fattar dem.** Hon lägger fram alternativen,
vad vart och ett kostar i tid eller pengar, vad som får vänta och sin
rekommendation med skäl. Hon väljer aldrig själv.

## VD (CEO) — bara från *litet* och uppåt

Sätter riktning, prioriterar, fattar trade-off-beslut.

### Den avgörande regeln

**I ett litet företag (3–10) måste VD också ha ett konkret operativt jobb.**
Abstrakt strategi räcker inte. En VD som bara "ger strategiska råd" är
teater.

Konkreta operativa jobb för en VD i ett litet företag:

- Prioritera veckans tasks mellan personerna när det inte räcker till alla
- Hålla roadmap uppdaterad baserat på vad som faktiskt händer i projektet
- Fatta knop-beslut när två agenter ger motstridiga rekommendationer
- Läsa av när teamet glider bort från det som sades vara viktigt

För stora team får VD bara göra det en VD faktiskt gör: riktning och
trade-offs. Då är det operativa jobbet utfördelat på andra agenter.

Två mallar finns:

- `templates/team-builder/ceo-small.md` — operativ (litet)
- `templates/team-builder/ceo-large.md` — strategisk (medelstort, stort)

Ai-consultant-läget använder `templates/ai-consultant/ceo-beginner.md` för
nybörjarkunder, vilket är ännu mer operativ och ännu mer pedagogisk — men
också den bara från *litet* och uppåt.

## VD-assistent (Chief of Staff)

**Den agent användaren pratar mest med i det dagliga arbetet.**

Har två sammanflätade ansvar:

### Primärt: operativ arbetspartner

Förbereder användarens prioriteringar, sammanfattar, orienterar. "Var är
jag nu? Vad borde jag göra härnäst? Hur står det till?" Det här är det jobb
som gör att agenten används ofta nog för att den ska märka saker.

Jobbet byggs ur kundens **breda** moment — det som kräver kontext från
flera delar av verksamheten, faller mellan stolarna eller upptäcks för
sent — inte ur en mall (SP17, `prompts/shared/proposal.md` steg 2). I solo,
mikro och personläget bär hon också prioriteringsmomenten, i formen
*förbereda*: kunden väljer.

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

Allt utöver VD-assistenten (och VD:n, där en sådan finns). Bestäms av research-steget baserat på
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
- "Det här är ett beslut du ska fatta — här är alternativen och vad jag
  rekommenderar" (solo, mikro, personläget) eller "det här är ett beslut VD
  ska fatta, jag hämtar den" (från *litet* och uppåt)
- "Det här kan jag hantera själv"

Specialisterna pratar sällan med varandra direkt. De pratar via användaren
eller via VD-assistenten som sammanställer. Det undviker agent-till-agent-
teater och håller kontexten hos människan.
