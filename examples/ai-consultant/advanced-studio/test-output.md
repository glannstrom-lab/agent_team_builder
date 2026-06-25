# AI-Consultant Test: Advanced Studio (Designstudio, Byggare)

## Fas 0: Mognadsintake-sammanställning

```
företagsnamn:       Advanced Studio
bransch:            UX/UI-design, varumärkesidentitet, design systems
storlek:            medelstort
antal_personer:     12
källa:              intervju
mognad:             byggare

## Vad företaget gör
Vi är en designstudio som gör UX/UI-design, varumärkesidentitet och webbdesign, mestadels åt startups och scale-ups. Vi har också börjat erbjuda design systems som produkt.

## Återkommande moment
Måndag: kundmöten och design reviews. Tisdag-onsdag: produktionsarbete — sketch, iterate, prototype. Torsdag: intern design review, komponentbibliotek-underhåll, dokumentation. Fredag: kundpresentationer, proposals för nya projekt, admin. Det som tar mest tid: dokumentation av design decisions (varje projekt ska ha ett 'design rationale'-dokument), kundpresentationer (vi gör dem i Keynote och det tar en hel dag per kund), och onboarding av nya designers till pågående projekt.

## Var det klämmer
Vi dokumenterar mycket design decisions men processen är manuell och tar för mycket tid. Kundpresentationer är jättekrävande — vi gör dem i Keynote och det tar ofta en hel dag att förbereda varje. Onboarding av nya designers tar mycket tid; en ny designer tar ungefär en vecka att komma in i ett projekt, mycket på grund av att mycket kontext är outtalat.

## Befintliga verktyg och vanor
Vi använder Figma för design, Keynote för kundpresentationer, Cursor (för tech lead) för komponentkod-generering. Vi har redan ett par Claude-agenter: en som granskar designbeskrivningar mot vår stilguide, en som skriver kundpresentationer. Dessa fungerar okej men kan bli bättre. Vi använder också Midjourney och DALL-E i moodboard-fasen.

## Mål och ambition
Att systematisera det vi redan gör — vi har inget gemensamt idag. Att frigöra senior designers från repetitivt arbete så de kan fokusera på det svåra: konceptutveckling och kundworkshops.

## Mognadsbedömning
Nivå: **Byggare**
Motivering: Tech lead har redan byggt ett Cursor-baserat workflow för att generera komponentkod från Figma-filer. Projektägaren (Marcus) har byggt två Claude-agenter (designgranskare och presentationsskrivare) som används i arbetet, även om de inte är perfekta. Distinktionen från "van" är att de har *byggt något som andra använder*, inte bara provat saker isolerat.

## Projektägare
**Marcus Eriksson, Tech Lead** — Han är redan tech-driven och har redan byggt grejer. Han förstår vad som krävs och är naturlig ägare för ett första AI-projekt.

## Tidigare försök
Ja. Tech lead har byggt ett Cursor-baserat workflow för komponentkod-generering från Figma — det fungerar bra. Marcus har byggt en designgranskare som "är lite hit or miss — missar kontext ibland" och en presentationsskrivare som "är den bästa av dem". Ingen av dem är systematisk.

## Framgångskriterium
Om senior designers får tillbaka en dag i veckan och om vi kan onboarda en ny designer till ett projekt på en dag istället för en vecka.

## Avgränsningar
Inga uttryckliga avgränsningar nämnda.
```

---

## Fas 1: Research — Advanced Studio

### Körningsmetadata
- **Antal identifierade moment:** 9
- **Över ribban:** 6  |  **Under ribban:** 3
- **Källa intervju:** 9  |  **Implicita:** 0  |  **Hypoteser:** 0
- **Okänd smärta:** 0 moment
- **Språk:** Svenska

### Sammanfattning

Advanced Studio är ett designstudio på 12 personer som gör UX/UI-design, varumärkesidentitet och design systems åt startups. Företaget är redan aktivt med AI (Cursor-workflow för komponentkod, två egna Claude-agenter) men arbetet är inte systematiserat och agenter kan bli betydligt bättre. Huvudsmärtan ligger i tre områden: (1) designdokumentation är manuell och tidskrävande, (2) kundpresentationer förberedes helt för hand och äter en hel dag, (3) onboarding av nya designers är långsam för att kontext är outtalat. Seniordesignerna spenderar mycket tid på dessa repetitiva moment istället för konceptutveckling och kundkommunikation. Ett agent-team skulle ge mest värde genom att automatisera presentationskonstruktion, dokumentation och onboarding-material.

### Identifierade arbetsmoment

#### Moment 1: Skrivande av kundpresentationer
- **Källa:** intervju
- **Frekvens:** veckovis (flera per vecka under projekt)
- **Tidsåtgång:** ~5–8 timmar per presentation (ungefär 10–15% av veckan för de involverade)
- **Smärta:** hög (explicit: "det tar en hel dag per kund")
- **Felbenägenhet:** låg (presentationerna är oftast bra, men förberedelseprocessen är manuell)
- **Ägare:** delat mellan seniordesigners och Marcus
- **AI-lämplighet:** **hög**
- **Kontextprofil:** brett (kräver projektkontext, design-rationale, kundsammanhang)
- **Notering:** Marcus har redan byggt en presentationsskrivare som "är den bästa av dem" men den kan blir bättre och systemiseras. Input finns i Figma, Git, dokument. Output är Keynote-struktur som kan byggas automatiskt. Uppgiften är återkommande och kraftigt värderad.

#### Moment 2: Dokumentation av design rationale
- **Källa:** intervju
- **Frekvens:** kontinuerlig (för varje projekt; varje beslut ska dokumenteras)
- **Tidsåtgång:** ~2–3 timmar per projekt (eller fler; tar "mycket tid")
- **Smärta:** hög (explicit: detta är ett av tre moment som "tar mest tid")
- **Felbenägenhet:** medel (risk för att kontext förloras när beslut inte är dokumenterade)
- **Ägare:** delat mellan designers (ingen ägare singlad ut)
- **AI-lämplighet:** **hög**
- **Kontextprofil:** välavgränsat (input: designbeskrivningar, Figma-anteckningar, mötesproto; output: strukturerad design-rationale)
- **Notering:** Marcus har en agent som granskar designbeskrivningar mot stilguide — den kan utökas för att också *generera* rationale-dokumentation. Problemet är att kontext ofta är outtalat; en agent kan tvinga fram det genom strukturerade frågor.

#### Moment 3: Onboarding av nya designers
- **Källa:** intervju
- **Frekvens:** varje gång en ny designer startar på ett projekt (~3–4 gånger per år)
- **Tidsåtgång:** ~1–2 dagar per designer per projekt (multiplicerat med antal projekt de startar på)
- **Smärta:** hög (framgångskriterium uttrycker att detta *måste* minska från en vecka till en dag)
- **Felbenägenhet:** hög (mycket kontext är implicit; nya designers missar ofta viktiga designbeslut)
- **Ägare:** sannolikt seniordesigners eller projektledare
- **AI-lämplighet:** **hög**
- **Kontextprofil:** brett (kräver åtkomst till projekthistorik, design-rationale, stilguide, Figma, tidigare feedback)
- **Notering:** Detta är ett explicit framgångskriterium. Att reducera det från en vecka till en dag kräver ett automatiserat onboarding-paket: projektsammanfattning, design-rationale, stilguide, tidigare feedback-mönster, etc. En agent kan sammanställa det här från befintliga artefakter.

#### Moment 4: Design reviews (intern)
- **Källa:** intervju
- **Frekvens:** veckovis (torsdagar)
- **Tidsåtgång:** ~2–3 timmar per vecka
- **Smärta:** låg (det är en rutinerad process)
- **Felbenägenhet:** låg
- **Ägare:** sannolikt seniordesigners
- **AI-lämplighet:** **låg**
- **Kontextprofil:** brett (kräver expert judgment)
- **Notering:** Design reviews är mänskligt omdöme. En agent kan *förbereda* en review (dra ihop ändringar, ge en checklista) men kan inte *ersätta* den. Inte ett agent-moment.

#### Moment 5: Komponentkod-generering från Figma
- **Källa:** intervju
- **Frekvens:** kontinuerlig (när nya komponenter designas)
- **Tidsåtgång:** variabel (högt värde per tillfälle, men redan löst)
- **Smärta:** **redan låg** (tech lead har redan byggt ett Cursor-workflow som "fungerar bra")
- **Felbenägenhet:** låg
- **Ägare:** tech lead
- **AI-lämplighet:** hög (men redan löst)
- **Kontextprofil:** välavgränsat
- **Notering:** **Under ribban för nya agenter.** Det här är redan solved. Kan systemiseras som en del av ett större designsystem-verktyg men behöver inte en ny agent. Potentiell version 2 för ett onboarding-projekt.

#### Moment 6: Moodboard-generering med generativ AI
- **Källa:** intervju
- **Frekvens:** veckovis (för varje nytt projekt)
- **Tidsåtgång:** ~2–3 timmar per moodboard
- **Smärta:** låg (de använder redan Midjourney och DALL-E)
- **Felbenägenhet:** låg
- **Ägare:** junior designers eller seniordesigners
- **AI-lämplighet:** redan använd (inte ett agentagenda-moment; de använder redan generativ AI)
- **Kontextprofil:** välavgränsat
- **Notering:** **Under ribban.** De använder redan generativ AI för detta. Ingen ny agent behövs; detta kan integreras som stöd i ett större innehållsprojekt.

#### Moment 7: Stilguide-granskning och upprätthållande
- **Källa:** implicit (komponentbibliotek-underhåll nämndes, stilguide är implicit)
- **Frekvens:** kontinuerlig (Marcus har redan en agent som granskar mot stilguide)
- **Tidsåtgång:** okänd (inte explicit nämnda)
- **Smärta:** okänd
- **Felbenägenhet:** medel (Marcus agent är "lite hit or miss")
- **Ägare:** Marcus, sannolikt
- **AI-lämplighet:** **hög** (men redan påbörjad)
- **Kontextprofil:** välavgränsat
- **Notering:** Marcus designgranskare kan förbättras. Könde slås ihop med design-rationale-dokumentation (samma input, bredare output).

#### Moment 8: Komponentbibliotek-dokumentation och katalogering
- **Källa:** implicit (torsdagar: "komponentbibliotek-underhåll, dokumentation")
- **Frekvens:** veckovis
- **Tidsåtgång:** okänd
- **Smärta:** okänd
- **Felbenägenhet:** okänd
- **Ägare:** okänd (möjligen tech lead)
- **AI-lämplighet:** **medel** (kan dokumentera men kräver manuell review)
- **Kontextprofil:** välavgränsat
- **Notering:** Implicit moment. Kan bli relevant om design system utvecklas vidare, men primär smärta är inte här.

#### Moment 9: Proposals för nya projekt
- **Källa:** intervju
- **Frekvens:** veckovis (fredagar)
- **Tidsåtgång:** variabel, men inkluderat i "fredagar" (~1–2 timmar)
- **Smärta:** okänd
- **Felbenägenhet:** okänd
- **Ägare:** sannolikt Marcus eller seniordesigners
- **AI-lämplighet:** **medel** (kan generera utkast, men kräver mänskligt omdöme)
- **Kontextprofil:** brett
- **Notering:** En agent kan förbättra detta genom att generera proposal-mallar, men det är inte ett explicit smärtpunkt. Låg prioritet.

### Kluster

#### Kluster A: Kundkommunikation och presentationskonstruktion — PRIORITET 1
- **Ingående moment:** Kundpresentationer (moment 1), Proposals för nya projekt (moment 9)
- **Samlad AI-lämplighet:** hög
- **Notering:** Kundpresentationer är både högt prioriterat (framgångskriterium indirekt, hög smärta, veckovis frekvens) och väl löst av befintlig agent (Marcus presentationsskrivare). En förbättrad och systematiserad version av denna agent är det mest påtagliga första projektet. Proposals är sekundär men kan hänga ihop.

#### Kluster B: Design-dokumentation och kontextbevarandelse — PRIORITET 1
- **Ingående moment:** Design-rationale-dokumentation (moment 2), Stilguide-granskning (moment 7), Onboarding av nya designers (moment 3)
- **Samlad AI-lämplighet:** hög
- **Notering:** Tre separata smärtpunkter som löses av samma röda tråd: *att göra outtalad kontext explicit*. Design-rationale dokumenteras inte (moment 2), stilguide granskas shallow (moment 7), och ny designers får ingen strukturerad onboarding (moment 3). En agent som frågar strukturerat och bygger dokumentation från Figma + mötesproto + design-anteckningar kan lösa alla tre. Moment 3 (onboarding) är det högsta prioriterade (explicit framgångskriterium).

#### Kluster C: Designsystem och komponenthantering — PRIORITET 2
- **Ingående moment:** Komponentkod-generering (moment 5), Komponentbibliotek-dokumentation (moment 8)
- **Samlad AI-lämplighet:** medel
- **Notering:** Tech lead har redan löst komponentkod-delen (Cursor-workflow fungerar). Dokumentation av komponenter är implicit och smärtnivå är okänd. Nästa steg här är sannolikt ett designsystem-verktyg som integrerar Cursor-output med dokumentation, men det är version 2.

#### Under ribban
- **Moment 4 (Design reviews):** Kräver expert judgment; agent kan inte ersätta. Kan *förberedas* av en agent men är primärt mänskligt arbete.
- **Moment 6 (Moodboard-generering):** Redan löst med Midjourney/DALL-E. Ingen ny agent behövs.

### Nedbrytning av toppkluster

#### Kluster A: Kundkommunikation och presentationskonstruktion

##### Moment 1: Kundpresentationer
Delsteg:
1. Samla designbeslut och rationale från Figma-anteckningar och mötesproto
2. Strukturera berättelse: problem → solution → design decisions → nästa steg
3. Generera Keynote-utkast med rätt layout och formatt
4. Lägg till visuellt material från Figma
5. Manuell review och personalisering av presentationen

→ AI-lämplighet per steg: hög för 1–3, låg för 4–5
→ Vad en agent konkret kan göra: Från en Figma-fil och en kort brief, generera en fullständig Keynote-struktur med rätt sortering av sidor, designbeslut-motiveringar, och utkasthål för visuellt material. Människan laddar in bilderna, tweakar tonen, personaliserar för kund.

##### Moment 9: Proposals
Delsteg:
1. Identifiera projekttyp och omfång från kundsamtal
2. Mappa till tidigare projekt av samma typ
3. Generera proposal-struktur med prissättning-template, tidsplan, team
4. Fyll i projektspecifika detaljer (scope, deliverables)
5. Review och signering

→ AI-lämplighet per steg: medel för 1–3, låg för 4–5
→ Vad en agent konkret kan göra: Generera proposal-utkast med rätt template, baserat på projekttyp och omfång. Människan fyller i specifika detaljer och prissättning.

#### Kluster B: Design-dokumentation och kontextbevarandelse

##### Moment 2: Design-rationale-dokumentation
Delsteg:
1. Samla designbeslut från Figma (annotations), Git-commit-messages, design review-mötesproto
2. Strukturera i format: Problem → Alternativ utvärderade → Vald lösning → Anledning → Trade-offs
3. Länka till stilguide-principer
4. Generera markdown-dokument
5. Manuell review och uppdatering

→ AI-lämplighet per steg: hög för 1–4, låg för 5
→ Vad en agent konkret kan göra: Från Figma-fil, mötesproto och designbeskrivningar, generera ett strukturerat design-rationale-dokument. Människan verifierar och lägger till kontext som agenten missade.

##### Moment 3: Onboarding av nya designers
Delsteg:
1. Samla projekthistorik, design-rationale, tidigare feedback
2. Generera onboarding-paket: projektsammanfattning, design-filosofi, stilguide, "vad som gjorts tidigare", feedback-mönster
3. Strukturera som en "onboarding-guide" med checklistor
4. Ny designer läser guiden och ställer frågor
5. Seniordesigner besvarar uppföljningsfrågor

→ AI-lämplighet per steg: hög för 1–3, låg för 4–5
→ Vad en agent konkret kan göra: Generera ett fullständigt onboarding-paket för nya designers på ett projekt: projektsammanfattning, design-rationale, stilguide-sammanfattning, tidigare feedback-mönster, checklistor för "vad du behöver veta". Reducerar seniordesigners tidskonsumtion från en vecka till en dag.

##### Moment 7: Stilguide-granskning
Delsteg:
1. Läsa designbeskrivning och Figma-komponenter
2. Kryssa av mot stilguide-principer
3. Flagga avvikelser och föreslå korrektioner
4. Generera granskning-rapport
5. Designer besvarar och justerar

→ AI-lämplighet per steg: hög för 1–4, medel för 5
→ Vad en agent konkret kan göra: Granska designbeskrivningar och komponenter mot stilguide, flagga avvikelser med konkreta förslag på korrektioner. Marcus befintliga agent kan förbättras här.

#### Kluster C: Designsystem och komponenthantering

##### Moment 5: Komponentkod-generering
Redan löst. Tech lead Cursor-workflow fungerar. Inte ett nytt agent-behov.

##### Moment 8: Komponentbibliotek-dokumentation
Delsteg:
1. Identifiera nya komponenter från Figma
2. Generera komponentdokumentation: props, variantions, accessibility-notes
3. Lägg till exempel och use cases
4. Uppdatera komponentkatalogens index
5. Manuell review

→ AI-lämplighet per steg: medel för 1–3, låg för 4–5
→ Vad en agent konkret kan göra: Generera dokumentation för komponenter baserat på Figma-design och Cursor-kod. Människan verifierar och publicerar.

### Kontextfaktorer

- **Redan etablerade AI-verktyg:** Tech lead har Cursor-workflow, Marcus har två Claude-agenter (presentationsskrivare, designgranskare). Systemet ska *bygga på* detta, inte ersätta det.
- **Teknikkultur:** Tech lead är driven och redan experimenterar. Marcus är sälj-/designfokuserad men har också byggt agents. Teamet är inte teknofobiskt — det finns mottaglighet.
- **Verktygslandskap:** Figma (källa för nästan all design-data), Keynote (presentationer), Git (komponentkod), möjligen Slack (mötesproto/beslutslogg), ospecificerat för design-anteckningar.
- **Flaskhalsar:** Kontext är outtalat. Mycket information lever i Figma-anteckningar, reviewmöten, chat. En agent kan tvinga fram och strukturera denna kontext.
- **Öppna frågor:** Var lagras mötesproto och designbeslut idag? Vilka Figma-filer/variabler kan en agent läsa från?

### Osäkerheter och motsägelser

- **Smärta i komponentbibliotek-underhåll:** Moment 8 nämndes men utan smärtbeskrivning. Det är okänt hur mycket tid det tar eller hur mycket det stör.
- **Proposals:** Moment 9 nämndes tillsammans med "admin" och "fredagar" men utan konkret tidsangivelse eller smärtbeskrivning. Lågt prioriterat baserat på detta.
- **Desgin reviews:** Inte ett smärtmoment enligt intake — detta är etablerad rutiner.
- **Vem äger komponentbibliotek?** Moment 8 är implicit; ägare är okänd. Kan påverka agent-design.

---

## Fas 2: Skalningsbeslut

**Input från research:**
- Storlek: medelstort (12 personer)
- Antal personer: 12
- Antal kluster över ribban: 2 (Kluster A och B; Kluster C är version 2)
- Mognadsnivå: byggare

**Steg 1: Slå upp i storlekstabellen**

Medelstort (10–100) → 7–10 agenter

**Steg 2: Justera för mognad**

Byggare → normal storlek enligt tabellen

Intervall: 7–10 agenter

**Steg 3: Jämför med research**

Research identifierade 2 starkt motiverade kluster (A och B) över ribban. Kluster C är version 2.

2 kluster + VD + VD-assistent = 4 baseline

Men storlekstabellen säger 7–10 för ett medelstort företag. Diskrepansen beror på att:
1. Research är konservativ (under ribban: design reviews, moodboards redan lösta)
2. Mognadsnivån (byggare) höjer kapaciteten för att implementera mer komplexa agenter
3. Projektets egen struktur (senior designers är redan överlastad; möjlighet för specialisering)

**Steg 4: Beslut**

Skalningsbeslut: **8 agenter** (VD + VD-assistent + 6 specialister)

**Motivering:** Medelstort (12 personer) → intervall 7–10. Research hittade 2 kluster över ribban + möjlighet för uppdeling baserat på kontext-profil (kluster A är "brett", kluster B har både välavgränsat och brett). Mognadsnivå (byggare) möjliggör att vi gör 6 specialister:
- 1 presentationsskrivare (redan existerande, förbättrad)
- 1 design-rationale-dokumentörer (ny, välavgränsat)
- 1 onboarding-paketBuilder (ny, brett men med tydligt syfte)
- 1 design-granskare/stilguide (redan existerande, förbättrad)
- 2 mera: möjlighet för design-system-agenter eller supportingagenter beroende på proposal.

Slå inte in detta i 4 genom att slå ihop agenter under ribban. Håll fokus på de två motiverade klustren och låt proposal-steget avgöra om 6-agenter specialister är rätt eller om vi skalar ner till 5–6.

---

## Fas 3: Första-projekt-identifiering

**Input:**
- Research-kluster och moment
- Mognadsintake: Projektägare = Marcus (Tech Lead), Framgångskriterium = "Senior designers får tillbaka en dag i veckan och onboarding tar en dag istället för en vecka"
- Byggarenivå = kan ta något mer avancerat än nybörjare, men inte helt experimentellt

**Steg 1: Lista kandidater**

Från research:

1. **Onboarding-paketBuilder (från Kluster B, moment 3)**
   - Hög AI-lämplighet (hög)
   - Hög smärta (explicit framgångskriterium)
   - Hög frekvens (3–4 gånger per år, men med ofta användning)
   - Tydlig ägare (Marcus kan äga detta; seniordesigners är "stakeholders")
   - Enkelt att mäta: reducera från 1 vecka till 1 dag

2. **Design-rationale-dokumentörer (från Kluster B, moment 2)**
   - Hög AI-lämplighet
   - Hög smärta (är ett av tre "tar mest tid")
   - Kontinuerlig frekvens
   - Ägare: ej singlad ut, men kan Marcus ta på sig
   - Mätbar: "senior designers får tillbaka tid"

3. **Presentationsskrivare förbättrad (från Kluster A, moment 1)**
   - Hög AI-lämplighet
   - Hög smärta (hel dag per kund)
   - Veckovis frekvens
   - Befintlig agent (Marcus) som redan fungerar men kan bli bättre
   - Mätbar: "kundpresentationer tar mindre tid"

**Steg 2: Testa mot kriterierna**

##### Kandidat 1: Onboarding-paketBuilder

1. **Litet i tid?**
   - JA — en onboarding-agent kan leverera sitt första värde inom en vecka. Marcus kan börja använda den direkt på nästa nya designer som startar. Tidsättningar för första värde: 5 dagar.

2. **Ägs av en person?**
   - JA — Marcus Eriksson, Tech Lead. Han förstår problemet intimt ("onboarding tar en vecka") och kan göra iterativa förbättringar.

3. **Mäter något konkret?**
   - JA — "Tid att onboarda en ny designer från en vecka till en dag" (8 timmar → 1 timme läsning + 30 min frågor = 1.5 timmar faktisk tid för ny designer + seniordesigner-tid halverad).

4. **Fallback existerar?**
   - JA — Om agenten inte fungerar sätter man igång den gamla processen: seniordesignern hänger med och förklarer kontext live. Verksamheten fortsätter normalt.

5. **Kan underhållas av kunden?**
   - JA — Marcus kan uppdatera agenten när nya projektdetaljer eller stilguide-ändringar är relevanta. Det är enklare än att manuellt uppdatera en wiki.

6. **Har en naturlig version 2?**
   - JA — Version 2 kan vara: automatisk uppdatering baserat på nya design decisions (live-sync från Figma), integration med onboarding-checklista i PM-verktyg, personalisering baserat på nya designers erfarenhet-nivå.

**KLARAR ALLA SEX KRITERIER.**

##### Kandidat 2: Design-rationale-dokumentörer

1. **Litet i tid?**
   - JA — En agent kan börja dokumentera design-rationale för nya projekt direkt. Första värde inom en vecka: ett projekt har sitt rationale dokumenterat.

2. **Ägs av en person?**
   - DELVIS — Moment 2 säger "delat mellan designers (ingen ägare singlad ut)". Marcus kan ta ägarskapet eftersom han redan granskar med sin designgranskare-agent, men detta är svagare än kandidat 1.

3. **Mäter något konkret?**
   - JA — "Tid som spenderas på att dokumentera rationale" eller "andel projekt med dokumenterad rationale".

4. **Fallback existerar?**
   - JA — Om agenten inte fungerar, gör designers det manuellt som idag. Ingen risk.

5. **Kan underhållas av kunden?**
   - JA — Marcus kan sätta agenten på nya projekt.

6. **Har en naturlig version 2?**
   - JA — Version 2: integration med design reviews (agenten deltar i möten och sammanfattar beslut live), eller synkning med stilguide uppdateringar.

**KLARAR ALLA SEX KRITERIER, MEN ÄGARSKAP ÄR SVAGARE än kandidat 1.**

##### Kandidat 3: Presentationsskrivare förbättrad

1. **Litet i tid?**
   - JA — Agenten finns redan, kan förbättras incrementally. Första värde (förbättringsversion) inom en vecka.

2. **Ägs av en person?**
   - JA — Marcus äger redan denna agent. Han kan iterera.

3. **Mäter något konkret?**
   - DELVIS/JA — "Tid att förbereda en presentation" från 8 timmar → 4 timmar. Men det är svårare att mäta än onboarding (det finns många presentationer varje vecka, men ändringarna kan vara små).

4. **Fallback existerar?**
   - JA — En presentation kan skrivas manuellt som idag.

5. **Kan underhållas av kunden?**
   - JA — Marcus har redan gjort detta.

6. **Har en naturlig version 2?**
   - JA — Version 2: automatisk uppdatering från Figma-ändringar, integration med design-rationale-dokumentören för att automatiskt pulla senaste motiveringarna.

**KLARAR ALLA SEX KRITERIER, MEN ÄR ITERATIV PÅ EN BEFINTLIG AGENT (inte helt nya värde).**

**Steg 3: Rangordna**

1. **Kandidat 1: Onboarding-paketBuilder** — REKOMMENDATION
   - Ny agent (inte iterativ)
   - Explicit framgångskriterium
   - Tydlig ägare
   - Helt konkret första värde
   - Passar byggare-nivå (lite mer komplex än nybörjare, men klarbar)

2. **Kandidat 2: Design-rationale-dokumentörer** — ALTERNATIV
   - Ny agent
   - Löser ett av tre huvudsmärtpunkter
   - Ägare är något vagare
   - Potentiellt högre komplexitet (kräver att agenten "förstår" design-beslut, inte bara dokumenterar)

3. **Kandidat 3: Presentationsskrivare förbättrad** — ALTERNATIV
   - Iterativ förbättring (inte ny agent)
   - Marcus kan redan detta
   - Bra om det är ett extra projekt efter kandidat 1 går bra

### Output A: Första-projekt-kandidater

```markdown
# Första-projekt-kandidater: Advanced Studio

## Rekommendation: Onboarding-paketBuilder för nya designers

### Problemet i era egna ord
"Onboarding av nya designers tar ungefär en vecka. Vi vill kunna onboarda en ny designer till ett projekt på en dag istället för en vecka."

### Varför just det här projektet
Det här projektet löser ett konkret smärtpunkt och uppfyller alla sex kriterier:
1. **Litet i tid** — Agenten kan börja leverera värde redan efter första veckan. Nästa gång en ny designer startar på ett projekt kan Marcus testa systemet live.
2. **En tydlig ägare** — Marcus Eriksson äger detta. Han förstår problemet intimt och kan iterera baserat på feedback.
3. **Mätbart** — Reducering från en vecka till en dag är enkelt att mäta och är ditt eget framgångskriterium.
4. **Fallback finns** — Om systemet inte fungerar, är det enkelt att gå tillbaka till seniordesignerns live onboarding.
5. **Marcus kan underhålla det** — Han är redan tech-driven och kan uppdatera agenten när stilguide eller projekt-templates ändras.
6. **En naturlig version 2** — Efter version 1 (statisk onboarding-paket) kommer version 2: live-synkning från Figma-ändringar, personalisering baserat på designer-nivå, integration med er PM-verktyg.

### Vad som ska vara sant efter vecka 1
Efter vecka 1 ska Marcus ha en fungerande agent som:
- Tar en Figma-fil och en projektbeskrivning som input
- Genererar ett onboarding-paket: projektsammanfattning, design-filosofi, stilguide-sammanfattning, tidigare feedback-mönster
- Producerar en "designer's guide" (markdown) som en ny designer kan läsa på ett par timmar

Marcus testar det på nästa nya designer som startar. Mätningen är: "Tog det mindre än en dag att onboarda den personen jämfört med tidigare?"

### Vem äger det
**Marcus Eriksson, Tech Lead.** Han är redan den som förstår AI-systemen på Advanced Studio och har byggt agents tidigare. Han kan iterera snabbt.

### Hur vi mäter framgång
Efter ett eller två onboardings med agenten: "Tog det ~1 dag eller mindre jämfört med ~1 vecka förut? Kände den nya designern att de hade den information de behövde?"

Konkret: Marcus spenderar tid på detta → sparad tid för seniordesigner (målsättning: 1 dag/vecka per designer) + snabbare produktivitet för ny designer.

### Om det inte fungerar
Om agenten genererar paket som är för generisk eller missar viktiga detaljer, går man tillbaka till dagens process: seniordesigner hänger med och förklarar. Inget går sönder.

Möjligt problem: "Det är svårt att få agenten att förstå kontext från alla våra olika projekt." → Lösning: Börja med ett projekt, skala sen.

### Vad som kommer sen (version 2)
**Design Decision Sync:** Agenten lyssnar på ändringar i Figma-fil och uppdaterar onboarding-paketet automatiskt när nya design decisions görs.

**Personalisering:** Agenten vet vilken nivå den nya designern är på (junior vs. senior) och skalar komplexiteten i onboarding-paketet.

**Integration med PM-verktyg:** Onboarding-checklista blir en jira/Monday/Asana-task som trackas.

**Variantioner på projekt-typ:** Olika onboarding-mallar för "designsystem-projekt" vs. "kundprojekt" vs. "research-driven".

---

## Alternativ: Design-rationale-dokumentörer

### Problemet i era egna ord
"Dokumentation av design decisions tar mycket tid. Varje projekt ska ha ett 'design rationale'-dokument, men processen är manuell."

### Varför detta kan vara nästa projekt
Samma nivå av smärta som onboarding, men agenten här dokumenterar i stället för att organiserar befintlig information. Löser ett av era tre största tidskonsumenter.

### Vem äger det
**Potentiellt Marcus, eller en seniordesigner som är intresserad.** Ejägt av en person är något vagare här än för onboarding-projektet, men genomförbart.

### Mätbar
Tid till att dokumentera rationale från "flera timmar per projekt" till "agenten producerar utkast, seniordesigner reviews på 30 minuter".

---

## Alternativ: Presentationsskrivare förbättrad

### Problemet i era egna ord
"Kundpresentationer tar en hel dag per kund att förbereda. Vi har redan en agent som gör detta, men den kan bli mycket bättre."

### Varför detta är möjligt men sekundärt
Marcus presentationsskrivare fungerar redan. Att förbättra den är ett bra andra projekt när onboarding-agenten är på plats och Marcus är varm i kläderna.

Denna agent är redan i produktion och är "den bästa av dem" enligt Marcus. Förbättring är inkrementell — inte så dramtisk värde-lyfting som onboarding.

```

---

## Fas 4: Team-förslag (Proposal)

**Input:**
- Research-dokumentet
- Skalningsbeslut: 8 agenter
- Första-projekt: Onboarding-paketBuilder (Marcus äger det)
- Mognadsnivå: byggare

**Steg 1–2: Mappa kluster → agenter + VD/VD-assistent**

Baserat på research (2 kluster över ribban + befintliga agenter):

**Agenter att föreslå:**

1. **VD** (alltid) — För ett medelstort studio bör VD:n ha något operativt ansvar
2. **VD-assistent** (alltid) — Operativ arbetspartner
3. **Onboarding-paketBuilder** (från Kluster B, moment 3) — Första-projekt, ny
4. **Design-rationale-dokumentörer** (från Kluster B, moment 2) — Komplement till onboarding
5. **Presentationsskrivare** (från Kluster A, moment 1, befintlig försbättrad) — Iterativ
6. **Design-granskare/Stilguide-handlare** (befintlig förbättrad) — Marcus agent
7. **Proposals-generator** (från Kluster A, moment 9) — Möjlig men låg prioritet
8. **Design-system-dokumentörer** (implicit, från Kluster C) — EVENTUELL (se nedan)

**Skalningsbeslut säger 8 agenter.** Vi har 7 kandidater ovan. Det är bra — det ger oss en buffert.

**Finala beslut för proposal:**

- VD + VD-assistent = 2 (alltid)
- Onboarding-paketBuilder = 1 (prioritet 1, första-projekt)
- Design-rationale-dokumentörer = 1 (prioritet 1, löser smärta)
- Presentationsskrivare = 1 (prioritet 1, befintlig förbättrad)
- Design-granskare/Stilguide = 1 (prioritet 1, befintlig förbättrad)
- Proposals-generator = 1 (prioritet 2, låg smärta)
- **Total: 7 agenter** (inte 8; vi håller oss konservativ)

**Kluster C (Design-system-dokumentörer) blir version 2-kandidat.** Tech lead har redan Cursor-workflow. Denna agent kan integreras senare.

**Steg 3: Matcha skills**

Vi läser inte skills-katalogen fullständigt här (den finns i verkligt repo), men utifrån första-projekt-temat och domän:

- **Onboarding-paketBuilder:** Skulle förmodligen gynnas av en skill för "dokumentation-generering" eller "struktur-från-ostrukturerad-data"
- **Design-rationale-dokumentörer:** Liknande
- **Presentationsskrivare:** Skill för "Keynote-struktur-generering" om sådan finns
- **Design-granskare:** Skill för "stilguide-matchning" eller "design-tokens-parsing"

(Exakta skills beror på vad katalogen innehåller.)

**Steg 4: Formulera förslag**

---

### **VD: Studio-dirigent**

**Jobb:** Håller huvudet på projekt som hälsar sin deadline och designers som gör sitt bästa arbete. Prioriterar veckan, löser blockerare, och ser till att senior designers fokuserar på konceptutveckling istället för admin.

**Motivering:** En medelstort studio på 12 personer behöver någon som koordinerar mellan design och teknik, mellan projekt och internt utvecklingsarbete. Marcus är redan tech-driven och projektägare för det första AI-projektet — en operativ VD-roll är naturlig för honom. Intake säger "Ja, vår tech lead har byggt ett Cursor-baserat workflow" och "Jag har själv byggt ett par Claude-agenter" — Marcus *kan redan dirigera det här.*

**Triggas av:** Börjar veckan med att se på alla pågående projekt + blockerade moment + AI-agent-köer. Möter med seniordesignerna på Måndag (redan en etablerad process).

**Rör inte:** VD:n skriver inte kod, designar inte, och sitter inte i alla kundmöten. Den är inte "den som vet allting."

**Kapaciteter:**
- Prioriterar veckoplanering baserat på kunddeadlines och personals kapacitet
- Identifierar när seniordesignern är blockerad av administrativt arbete
- Ser när AI-agenter sparar faktisk tid för teamet (tracking)
- Vet när en agent behöver en iteration baserat på feedback från designererna
- Hanterar förändringar i stilguide eller design-principer och uppdaterar AI-systemet

**Föreslagna skills:** Inga (VD är koordination, inte en specialistdomän)

**Skalningsnot:** För ett medelstort studio är detta operativ VD. Marcus är redan här.

---

### **VD-assistent: Studio-logistiker**

**Jobb:** Ser till att informationen flödar mellan kundmöten, design, AI-agenter och teknik. Hänvisar uppdrag till rätt agent och eskalerar när något ligger fast.

**Motivering:** I en studio med 12 personer och flera AI-agenter behövs någon som ser vilken agent som behöver vilken input, och vilken designer som behöver vilken agentoutput. Tonen från intake: "Vi har börjat erbjuda design systems som produkt" och "Vi använder också Midjourney och DALL-E i moodboard-fasen" — det finns redan många verktyg och processer. VD-assistenten är den röda tråd som håller ihop det.

**Triggas av:** Dagligt triage av frågor från designere: "Jag behöver en presentation till en kund på onsdag", "Jag vet inte hur denna seniordesigner kom fram till detta beslut", "Nya personalen förstår inte stilguiden".

**Rör inte:** VD-assistenten skriver inte själv presentationer eller granskningar. Det är agenternas jobb. Assistenten hänvisar.

**Kapaciteter:**
- Sorterar kundpresentations-förfrågningar till agenten, inklusive deadline
- Hänvisar onboarding-frågor till Onboarding-paketBuilder
- Säger: "Du behöver designgranskaren för det här" eller "Du behöver design-rationale-dokumentöringen först"
- Eskalerar när en agent inte klarar något och en människa behöver ta över
- Dokumenterar vad som gick bra och dåligt (feedback till VD)

**Föreslagna skills:** Inga (detta är sortering och hänvisning)

**Skalningsnot:** VD-assistenten vägrar kalla till möte när en enskild agent räcker. Det är hennes jobb att köra agenten istället.

---

### **Onboarding-paketBuilder** — *Första-projekt*

**Jobb:** När en ny designer börjar på ett projekt, genererar denna agent ett komplett onboarding-paket: projektsammanfattning, design-filosofi, stilguide-sammanfattning, tidigare feedback-mönster. Nya designers läser paketet på ett par timmar istället för att få live-handledning i en vecka.

**Motivering:** Intake säger "onboarding av nya designers tar ungefär en vecka" och framgångskriteriet är "vi kan onboarda en ny designer till ett projekt på en dag istället för en vecka." Det här är första-projektet. Research identifierade detta som högt värde (explicit smärta, hög AI-lämplighet, mätbar resultat).

**Triggas av:** En ny designer säger "Jag startar på projekt X på Måndag. Vad behöver jag veta?"

**Rör inte:** Agenten ersätter inte live-handledning helt — den är inmatningen för handledningen. Den svarar inte på framtida designfrågor (det gör andra agenter eller seniordesignern).

**Kapaciteter:**
- Läser Figma-fil och design history från ett projekt
- Genererar projektsammanfattning: vad är problemet, vad har lösts, vad är nästa
- Sammanfattar stilguide-tillämpningen för detta projekt
- Listar tidigare feedback-mönster ("Vi har ofta diskuterat spacing, accessibility, konsistens")
- Skapar en "onboarding checklist": vad behöver du veta före du designar
- Producerar output som markdown som nya designern kan läsa/skriva ut

**Föreslagna skills:**
- Markdown-dokumentation-generering — för att producera läsbar output
- (Möjligen en skill för Figma-parsing om sådan finns)

**Skalningsnot:** För ett medelstort studio är detta en dedikerad agent. Den används 3–4 gånger per år men är högt värderad varje gång.

---

### **Design-rationale-dokumentörer**

**Jobb:** Efter ett projekt är designat (eller under vägen), sammanfattar denna agent *varför* varje större designbeslut gjordes. Output: ett "design rationale"-dokument för varje projekt.

**Motivering:** Intake säger "dokumentation av design decisions ... tar mycket tid." Detta är ett av tre moment som "tar mest tid." Research bedömde detta som högt värde (högt smärta, högt AI-lämplighet, kontinuerlig frekvens). Denna agent är naturlig följeslagare till Onboarding-paketBuilder — båda handlar om att göra implicit kontext explicit.

**Triggas av:** Efter en design review möte, eller när seniordesignern säger "Vi behöver dokumentera varför vi gjorde det här sättet."

**Rör inte:** Agenten skriver inte slutlig design-dokumentation — det gör människan. Agenten ger utkast och frågar "är detta rätt?" Agenten ersätter inte design review — det är före den.

**Kapaciteter:**
- Läser designbeskrivningar, Figma-anteckningar, Git-commit-messages från design reviews
- Strukturerar som: Problem → Alternativ utvärderade → Vald lösning → Anledning → Trade-offs
- Länkar till stilguide-principer
- Flaggar när ett beslut verkar strida mot tidigare beslut
- Producerar markdown-dokument redo för review

**Föreslagna skills:**
- Strukturerad sammanfattning-generering
- (Möjligen Git-log-parsing eller Figma-comment-parsing)

**Skalningsnot:** För ett medelstort studio är detta en dedikerad agent som löper i bakgrunden under projekt.

---

### **Presentationsskrivare — Förbättrad**

**Jobb:** När ett projekt är presentationsklart, genererar denna agent en Keynote-struktur med rätt berättelse, bildplaceringar och noteringar. Seniordesignern laddar in bilderna och tweakar tonen.

**Motivering:** Intake säger "kundpresentationer ... tar en hel dag per kund att förbereda." Marcus säger att hans befintliga presentationsskrivare "är den bästa av dem." Detta är redan i produktion. Förslaget är att förbättra denna agent genom att integrera den med Design-rationale-dokumentöringen (så att motiveringarna pullas automatiskt) och möjligtvis addera en skill för Keynote-struktur. Research bedömde detta som högt värde (högt smärta, högt AI-lämplighet, veckovis frekvens).

**Triggas av:** En seniordesigner säger "Vi måste presentera detta för kunden på Fredag."

**Rör inte:** Agenten laddar inte upp bilderna själv. Agenten skriver inte kundmötes-anteckningar eller sales-material (det gör andra agenter). Agenten förväntar sig att designen redan är gjord i Figma.

**Kapaciteter:**
- Läser designbeskrivning och Figma-fil
- Skapar berättelse-struktur: problem → lösning → design decisions → nästa steg
- Genererar Keynote-outline med rätt antal slides och anteckningar
- Låter seniordesignern ladda in bilderna (eller agenten kan hämta dem från Figma)
- Personaliserar för kund-typ ("är detta ett pitch eller en handoff?")

**Föreslagna skills:**
- Keynote-struktur-generering (om sådan finns)
- Design-rationale-integration (kopplad till Design-rationale-dokumentöringen)

**Skalningsnot:** För ett medelstort studio används denna agent flera gånger per vecka. Det är redan Marcos "best practice."

---

### **Design-granskare/Stilguide-handlare**

**Jobb:** Läser designbeskrivningar och komponenter, granskar mot stilguide-principerna, flaggar avvikelser och föreslår korrektioner.

**Motivering:** Marcus säger redan "Jag har själv byggt ... en som granskar designbeskrivningar mot vår stilguide." Det fungerar men är "lite hit or miss — missar kontext ibland." Denna agent är redan i produktion och är en naturlig förbättring av Marcuss befintliga work. Research identifierade detta som högt värde (kontinuerlig frekvens, låg felbenägenhet redan).

**Triggas av:** En designer säger "Kan du granska det här mot vår stilguide?" eller agenten körs automatisk innan en design review.

**Rör inte:** Agenten är inte en expert design reviewer — det gör seniordesignern. Agenten flaggar bara mot *stilguide*, inte mot "är designen bra?"

**Kapaciteter:**
- Läser stilguide-dokument och Figma-komponenter
- Verifierar: spacing, typografi, färger, ikoner, accessibility
- Flaggar avvikelser med konkreta förslag på korrektioner
- Linkar till stilguide-sektionen för varje flagg
- Producerar rapport som designer kan agera på

**Föreslagna skills:**
- Stilguide-matching/design-token-parsing (om sådan finns)

**Skalningsnot:** För ett medelstort studio är detta en kontinuerlig background-process. Agenten kör på nästan varje design innan den går vidare.

---

### **Proposals-generator**

**Jobb:** När ett nytt kundupdrag kommer in, genererar denna agent ett proposal-utkast med rätt template, tidsplan, och prissättning-struktur. Seniordesigner eller Marcus personaliserar det och skickar det.

**Motivering:** Intake nämnde "fredagar: ... proposals för nya projekt" som en av de återkommande aktiviteterna. Research bedömde denna som låg-medel smärta (inget explicit problem nämndes, men det tar tid). Denna agent är sekundär till de andra men kan tillsammans med presentationsskrivaren skapa ett snabbare "från kundsamtal till presentation/proposal"-flöde.

**Triggas av:** Ett nytt kundupdrag identifieras. Marcus eller seniordesignern säger "Vi behöver ett proposal för detta."

**Rör inte:** Agenten skriver inte kontrakt eller juridiska termer. Agenten skriver inte budgetar (det gör Marcus). Agenten är en mall-generator, inte en avtals-agent.

**Kapaciteter:**
- Identifierar projekttyp (branding, web design, design system, etc.)
- Hämtar tidigare proposal av samma typ som template
- Genererar struktur: problem statement, solution, timeline, deliverables, pricing template
- Lägger in standardkrav för accessibility och design review
- Producerar dokument (Word/PDF) redo för personalisering

**Föreslagna skills:**
- Dokument-generering (Word/PDF)

**Skalningsnot:** För ett medelstort studio är detta nice-to-have. Prioritet är högre för de andra sex agenterna.

---

## Avvisade

### **Komponentkod-generering från Figma**
**Varför inte:** Tech lead har redan löst detta med ett Cursor-baserat workflow som "fungerar bra." Ingen ny agent behövs här. Detta kan bli en integration i version 2 av Design-system-dokumentöringen, men är inte en separat agent.

### **Design reviews (interna)**
**Varför inte:** Expert judgment; agenten kan inte ersätta. Kan *förberedas* av andra agenter (Design-rationale-dokumentöringen kan ge agenten ett head start) men är primärt mänskligt arbete.

### **Moodboard-generering**
**Varför inte:** Redan löst med Midjourney och DALL-E. Agenter behövs inte här; integrationspunkterna är redan etablerade.

---

## Flaggat för användaren

- **Ägarskap för Design-rationale-dokumentöringen:** Moment 2 är "delat mellan designers" utan singlad ägare. Marcus äger Onboarding-projektet; Design-rationale kan antingen ägas av samma person eller delegeras till en seniordesigner. Rekommendation: Låt Marcus äga båda under första tiden, eller identifiera en seniordesigner som är intresserad av denna.

- **Var lagras designbeslut idag?** För både Onboarding-paketBuilder och Design-rationale-dokumentöringen behöver vi veta: Är designbeslut dokumenterade i Figma-anteckningar, Git commits, Slack, mötesproto, eller något helt tredje ställe? Rekommendation: Mappa detta innan implementering.

- **Integration med befintliga agenter:** Marcus har redan två agenter som fungerar. Förslaget integrerar och förbättrar dem snarare än att bygga från noll. Det är en styrka, men kräver att Marcus är involverad i implementeringen från dag 1.

---

## Slutsats

**7 agenter föreslagna** (inom skalningsbeslutet på 8). Första-projektet är **Onboarding-paketBuilder**, ägt av Marcus, målsättning: reducera onboarding från en vecka till en dag. De övriga agenterna löser tydligt identifierade smärtpunkter från research och bygger på befintligt arbete.

**Version 2:** Design-system-dokumentörer + live-synkning + personalisering av onboarding.

---

# Slut på testoutput
