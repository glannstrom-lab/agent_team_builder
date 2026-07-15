# AI-consultant Pipeline Test: Advanced Studio (designstudio, byggare)

Full körning av ai-consultant-pipelinen för en fiktiv designstudio på
byggarnivå. Verifierar att konsult-läget hanterar en kund som redan byggt egna
AI-verktyg: full skalningstabell, tekniskt djärvare första projekt, pedagogik
på byggarnivå (arkitektur och underhåll, inte grunder).

Läge: ai-consultant (intervju). Storlek: medelstort (12 personer). Mognad: byggare.

> **Regenererad 2026-07-15 mot promptversion 2026-07-15.** Samma fiktiva kund
> som tidigare körning (Advanced Studio, Marcus Eriksson), men flödet följer
> de nuvarande prompterna: mognadsintake med fråga 8–9, tyst skalning,
> första-projekt efter research, divergens-självtest i förslaget.

---

## 1. Mognadsintake-sammanställning

```
företagsnamn:       Advanced Studio
bransch:            Designstudio (UX/UI, varumärkesidentitet, design systems)
storlek:            medelstort
antal_personer:     12
källa:              intervju
mognad:             byggare

## Vad företaget gör
Vi är en designstudio som gör UX/UI-design, varumärkesidentitet och webbdesign,
mestadels åt startups och scale-ups. Vi har också börjat erbjuda design systems
som produkt.

## Återkommande moment
Måndag: kundmöten och design reviews. Tisdag–onsdag: produktionsarbete — skissa,
iterera, prototypa. Torsdag: intern design review, komponentbiblioteks-underhåll,
dokumentation. Fredag: kundpresentationer, proposals för nya projekt, admin.
Det som tar mest tid: dokumentation av designbeslut (varje projekt ska ha ett
"design rationale"-dokument), kundpresentationer (vi gör dem i Keynote och det
tar en hel dag per kund), och onboarding av nya designers till pågående projekt.

## Var det klämmer
Vi dokumenterar mycket designbeslut men processen är manuell och tar för mycket
tid. Kundpresentationer är jättekrävande — en hel dag per kund. Onboarding av
nya designers tar mycket tid; en ny designer behöver ungefär en vecka för att
komma in i ett projekt, mycket för att kontexten är outtalad.

## Befintliga verktyg och vanor
Figma (all design), Keynote (kundpresentationer), Cursor (Marcus, för
komponentkod), Git/GitHub, Slack, Midjourney och DALL-E (moodboard-fasen).
Två egna Claude-agenter byggda av Marcus: en som granskar designbeskrivningar
mot stilguiden ("lite hit or miss — missar kontext ibland") och en som skriver
kundpresentationer ("den bästa av dem"). Designbeslut bor spritt:
Figma-kommentarer, Slack-trådar och folks huvuden.

## Mål och ambition
Att systematisera det vi redan gör — vi har inget gemensamt i dag. Att frigöra
senior designers från repetitivt arbete så de kan fokusera på det svåra:
konceptutveckling och kundworkshops. Värt det efter en månad om seniorerna får
tillbaka en dag i veckan.

## Mognadsbedömning
Nivå: byggare
Motivering: Marcus har byggt ett Cursor-baserat arbetsflöde för komponentkod
från Figma och två Claude-agenter som kollegorna använder dagligen —
kvalitativt skilt från att bara ha "provat".

## Projektägare
Marcus Eriksson, tech lead. Har byggt studions befintliga AI-verktyg och är
naturlig ägare för det första projektet.

## Tidigare försök
Ja. Cursor-arbetsflödet fungerar bra. Designgranskaren är "lite hit or miss —
missar kontext ibland". Presentationsskrivaren är "den bästa av dem". Inget av
det är systematiserat — varje verktyg lever sitt eget liv.

## Framgångskriterium
"Om senior designers får tillbaka en dag i veckan och om vi kan onboarda en ny
designer till ett projekt på en dag i stället för en vecka."

## Avgränsningar
Inga uttryckliga avgränsningar.
```

Storleksmappning: 12 personer → bandet 10–100 → **medelstort**.

---

## 2. Research: Advanced Studio

### Körningsmetadata
- **Antal identifierade moment:** 10
- **Över ribban:** 4  |  **Under ribban:** 3
- **Källa intervju:** 9  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 2 moment
- **Språk:** Svenska

### Sammanfattning
Advanced Studio (12 personer) har redan byggt egna AI-verktyg men saknar
gemensam struktur. De tre uttalade klämmorna — manuell rationale-dokumentation,
kundpresentationer som tar en hel dag, veckolång onboarding — har en gemensam
rot: designbeslut är outtalade och spridda i Figma-kommentarer, Slack-trådar
och huvuden. Ett agent-team gör mest nytta genom att göra den kontexten
explicit en gång och återanvända den i presentationer, onboarding och
granskning — och genom att uppgradera de två befintliga agenterna.

### Identifierade arbetsmoment

#### Moment 1: Kundpresentationer i Keynote
- **Källa:** intervju  |  **Frekvens:** veckovis (fredagar, ofta flera i intensiva skeden)
- **Tidsåtgång:** "en hel dag per kund" (explicit)  |  **Smärta:** hög (explicit kläm)
- **Felbenägenhet:** låg  |  **Ägare:** seniordesignern på respektive projekt
- **AI-lämplighet:** **hög**  |  **Kontextprofil:** brett
- **Notering:** Den befintliga presentationsskrivaren är "den bästa av dem" men
  arbetar fristående — mycket av dagen går åt till att mata den med projektets
  designbeslut för hand.

#### Moment 2: Dokumentation av design rationale
- **Källa:** intervju  |  **Frekvens:** kontinuerligt (varje projekt)
- **Tidsåtgång:** en av de tre största tidstjuvarna  |  **Smärta:** hög (explicit kläm)
- **Felbenägenhet:** medel (odokumenterade beslut = förlorad kontext senare)
- **Ägare:** delat mellan designers — ingen utpekad
- **AI-lämplighet:** **hög**  |  **Kontextprofil:** välavgränsat
- **Notering:** Att strukturera beslut (problem, alternativ, val, motivering,
  trade-offs) är en Claude-styrka. Kruxet: källmaterialet ligger spritt — en
  agent kan fråga fram det som saknas i stället för att designern minns i efterhand.

#### Moment 3: Onboarding av nya designers till pågående projekt
- **Källa:** intervju  |  **Frekvens:** vid varje ombemanning (exakt frekvens okänd)
- **Tidsåtgång:** ~1 vecka per designer och projekt (explicit)
- **Smärta:** hög (explicit kläm + eget framgångskriterium: en dag, inte en vecka)
- **Felbenägenhet:** hög (outtalad kontext — nya designers missar tidigare beslut)
- **Ägare:** seniordesignern på projektet (den vars tid äts upp)
- **AI-lämplighet:** **hög**  |  **Kontextprofil:** bullrigt
- **Notering:** Ett onboarding-paket sammanställer sådant som redan finns men är
  svåråtkomligt. Den bullriga profilen motiverar en *isolerad* agent.

#### Moment 4: Stilguide-granskning av designbeskrivningar
- **Källa:** intervju (befintlig agent)  |  **Frekvens:** löpande, inför reviews
- **Tidsåtgång:** måttlig — agenten gör jobbet, men träffarna måste dubbelkollas
- **Smärta:** medel (explicit irritation: "lite hit or miss — missar kontext ibland")
- **Felbenägenhet:** medel  |  **Ägare:** Marcus (agenten), designerna (användningen)
- **AI-lämplighet:** **hög**  |  **Kontextprofil:** välavgränsat
- **Notering:** Hit-or-miss beror sannolikt på arkitekturen, inte uppgiften:
  agenten bedömer varje beskrivning isolerat, utan projektets beslutshistorik.
  Samma input som moment 2 — de hör ihop.

#### Moment 5: Proposals för nya projekt
- **Källa:** intervju  |  **Frekvens:** veckovis (fredagar)
- **Tidsåtgång:** okänd  |  **Smärta:** okänd (nämns utan klagan)
- **Felbenägenhet:** låg  |  **Ägare:** oklart — sannolikt Marcus eller seniorerna
- **AI-lämplighet:** medel  |  **Kontextprofil:** brett
- **Notering:** Samma berättelselogik som en kundpresentation — kan dela agent
  med moment 1, men smärtan är inte belagd och får inte driva agentvalet.

#### Moment 6: Komponentbiblioteks-underhåll och dokumentation
- **Källa:** intervju (torsdagsrutinen)  |  **Frekvens:** veckovis
- **Tidsåtgång:** okänd  |  **Smärta:** okänd
- **Felbenägenhet:** medel (inaktuell dokumentation smyger sig på)
- **Ägare:** oklart — möjligen Marcus
- **AI-lämplighet:** medel  |  **Kontextprofil:** välavgränsat
- **Notering:** Kan växa när design systems-produkten växer, men intaket säger
  inget om att det klämmer i dag. Svagt underlag.

#### Moment 7: Intern design review
- **Källa:** intervju (torsdagar)  |  **Frekvens:** veckovis  |  **Tidsåtgång:** ~2–3 h
- **Smärta:** låg (etablerad rutin)  |  **Felbenägenhet:** låg  |  **Ägare:** seniorerna
- **AI-lämplighet:** **låg**  |  **Kontextprofil:** brett
- **Notering:** **Under ribban.** Designbedömning är mänskligt omdöme. En agent
  kan *förbereda* en review, men förberedelsen täcks av dokumentationsklustret.

#### Moment 8: Komponentkod-generering från Figma
- **Källa:** intervju  |  **Frekvens:** löpande  |  **Tidsåtgång:** variabel
- **Smärta:** låg — redan löst ("fungerar bra")  |  **Felbenägenhet:** låg  |  **Ägare:** Marcus
- **AI-lämplighet:** hög, men redan tillgodosedd  |  **Kontextprofil:** välavgränsat
- **Notering:** **Under ribban.** Cursor-arbetsflödet fungerar; en ny agent
  vore dubblering.

#### Moment 9: Moodboards med generativ AI
- **Källa:** intervju  |  **Frekvens:** per nytt projekt  |  **Tidsåtgång:** ett par timmar
- **Smärta:** låg — redan löst med Midjourney/DALL-E  |  **Felbenägenhet:** låg
- **Ägare:** designerna  |  **AI-lämplighet:** redan tillgodosedd  |  **Kontextprofil:** välavgränsat
- **Notering:** **Under ribban.** Etablerat arbetssätt, ingen kläm — och
  bildgenerering är inte en Claude-agents jobb.

#### Moment 10: Prioritering mellan kundprojekt och produktsatsning
- **Källa:** implicit  |  **Frekvens:** veckovis/löpande  |  **Tidsåtgång:** diffus
- **Smärta:** medel (implicit i målet: seniortiden ska räcka till både
  kundleveranser och design systems-produkten, och gör det inte i dag)
- **Felbenägenhet:** medel (fel avvägning = produktsatsningen svälter)
- **Ägare:** oklart — ledningsfråga
- **AI-lämplighet:** medel  |  **Kontextprofil:** brett
- **Notering:** Implicit men välgrundat: produktlinjen konkurrerar om samma
  seniortid som kundprojekten. Prioriteringsmoment som motiverar VD-agentens
  jobb (research-regel 6) — inget specialistkluster.

### Kluster

#### Kluster A: Kundpresentationer och proposals — prioritet 1
- **Ingående moment:** Kundpresentationer (moment 1), proposals (moment 5)
- **Samlad AI-lämplighet:** **hög**
- **Notering:** Störst löpande tidsvinst: en hel dag per kund, varje vecka.
  Samma berättelselogik för presentation och proposal, och en befintlig omtyckt
  agent att bygga vidare på. Proposals-delen är obelagd smärta — sekundär.

#### Kluster B: Designbesluts-dokumentation och stilguide-granskning — prioritet 2
- **Ingående moment:** Rationale-dokumentation (moment 2), stilguide-granskning (moment 4)
- **Samlad AI-lämplighet:** **hög**
- **Notering:** Två moment, samma rot: outtalad kontext. Dokumenteras besluten
  löpande får granskningen den kontext som i dag saknas — den arkitektoniska
  fixen för "hit or miss". Klustret är dessutom råvaruleverantör till kluster A
  (motiveringar i presentationer) och C (beslutshistorik i onboarding-paket).

#### Kluster C: Projekt-onboarding — prioritet 3
- **Ingående moment:** Onboarding av nya designers (moment 3)
- **Samlad AI-lämplighet:** **hög**
- **Notering:** Lägre frekvens än A och B, men bär kundens eget
  framgångskriterium och har den tydligaste mätningen. Bullrig profil →
  isolerad agent. Stark första-projekt-kandidat trots prioritetsordningen.

#### Kluster D: Komponentbiblioteks-dokumentation — prioritet 4
- **Ingående moment:** Komponentbiblioteks-underhåll (moment 6)
- **Samlad AI-lämplighet:** medel
- **Notering:** Över ribban men med svagast underlag: okänd smärta, oklar
  ägare. Proposal-steget bör pröva hårt om detta motiverar en egen agent i dag.

#### Under ribban
- **Intern design review (moment 7):** mänskligt omdöme; förberedelsen täcks av kluster B.
- **Komponentkod-generering (moment 8):** redan löst med Cursor-arbetsflödet.
- **Moodboards (moment 9):** redan löst med Midjourney/DALL-E.

### Nedbrytning av toppkluster

#### Kluster A: Kundpresentationer och proposals

**Moment 1: Kundpresentationer i Keynote**

Delsteg:
1. Samla projektets läge: vad har gjorts sedan sist, vilka beslut har fattats och varför
2. Bygga berättelsestruktur: utgångsläge → problem → riktning → beslut → nästa steg
3. Skriva sidplan med talarstöd per sida och markerade hål för visuellt material
4. Lägga in det visuella materialet från Figma
5. Finputsa ton och hålla presentationen

→ AI-lämplighet per steg: hög för 1–3 (förutsatt att besluten finns
  dokumenterade — annars blir steg 1 manuell arkeologi), låg för 4–5
→ Vad en agent konkret kan göra: leverera ett presentationsutkast med
  berättelsestruktur, talarstöd och beslutsmotiveringar hämtade ur projektets
  rationale-dokument. Designern lägger in bilderna och håller mötet.

#### Kluster B: Designbesluts-dokumentation och stilguide-granskning

**Moment 2: Dokumentation av design rationale**

Delsteg:
1. Fånga beslut när de fattas (design reviews, Slack-diskussioner, Figma-kommentarer)
2. Strukturera: problem → alternativ som prövades → val → motivering → trade-offs
3. Ställa riktade frågor om det som saknas i stället för att gissa
4. Skriva in i projektets rationale-dokument
5. Designern granskar och godkänner

→ AI-lämplighet per steg: hög för 1–4, låg för 5
→ Vad en agent konkret kan göra: hålla rationale-dokumentet levande under
  projektets gång i stället för att det skrivs i efterhand från minnet.

**Moment 4: Stilguide-granskning** — samma agent, andra riktningen: med
beslutshistoriken som kontext granskas nya designbeskrivningar mot både
stilguiden och projektets tidigare val.

#### Kluster C: Projekt-onboarding

**Moment 3: Onboarding av nya designers**

Delsteg:
1. Samla projektets underlag: brief, rationale-dokument, Figma-struktur, kundfeedback
2. Sammanställa projektsammanfattning: problem, riktning, gjort, nästa steg
3. Lista de avgörande designbesluten med motivering och källa
4. Producera ett läsbart paket plus en frågelista till seniorn för luckorna
5. Den nya designern läser och ställer frågor; seniorn svarar på det som återstår

→ AI-lämplighet per steg: hög för 1–4, låg för 5
→ Vad en agent konkret kan göra: bygga ett projektspecifikt onboarding-paket på
  timmar i stället för att en senior ägnar en vecka åt muntlig överföring.

### Kontextfaktorer

1. **Befintliga verktyg ska uppgraderas, inte dubbleras** — två hemmabyggda
   Claude-agenter och ett Cursor-arbetsflöde finns redan.
2. **Figma är källan, Keynote är leveransformatet** — agenterna läser från det
   ena hållet och levererar mot det andra; ingen agent opererar verktygen.
3. **Designbesluten ligger spritt** — den gemensamma roten till alla tre
   klämmorna; dokumentationsklustret blir navet.
4. **Byggarnivån tillåter beroenden mellan agenter** — Marcus kan koppla
   agenter till varandra; teamet kan designas som en kedja, olämpligt hos en
   nybörjare.
5. **Produktsatsningen konkurrerar om seniortiden** — varje frigjord
   seniortimme har en uppenbar mottagare.

### Osäkerheter och motsägelser

1. **Var lagras designbesluten i praktiken?** Vilka källor en agent faktiskt kan
   läsa måste mappas innan kluster B implementeras.
2. **Ägare för rationale-dokumentationen saknas** — "delat mellan designers".
3. **Proposals (moment 5) och komponentbiblioteket (moment 6)** har okänd
   smärta och får inte driva agentval förrän kunden bekräftat att de klämmer.
4. **Ombemanningsfrekvensen är okänd** — påverkar hur ofta onboarding-agenten
   används och när mätpunkten kommer.

---

## 3. Skalningsbeslut

```
Skalningsbeslut: 6 agenter (VD + VD-assistent + 4 specialister)
Motivering: Medelstort (10–100) → intervall 7–10; mognad byggare → ingen
dämpning. Research hittade 4 kluster över ribban — färre än tabellens
minimum, och då har research rätt: beslutet sänks till kluster + 2 = 6.
Att 12 personer ligger i botten av medelstort-bandet gör diskrepansen
väntad snarare än oroande.
```

---

## 4. Första-projekt-identifiering

### Steg 1: Kandidater

Ur research-klustren, prövade mot ägare (Marcus) och framgångskriteriet:
**Onboarding-paketbyggare** (kluster C — bär kundens eget framgångskriterium),
**Rationale-dokumenterare** (kluster B — hög smärta, kontinuerlig frekvens),
**Presentationsbyggare 2.0** (kluster A — störst löpande tidsvinst, befintlig
agent att utgå från).

### Steg 2: Test mot de sex kriterierna

```
Kandidat: Onboarding-paketbyggare

1. Litet i tid?      Ja — paketet byggs och testas inom en vecka på ett
                     pågående projekt: en designer som redan kan projektet
                     läser och stryker det som är fel. Första värde utan
                     att vänta på nästa ombemanning.
2. Ägs av en person? Ja — Marcus Eriksson. Han bygger, seniorerna levererar underlag.
3. Mätbart?          Ja — tid till produktiv ny designer: en vecka → en dag.
                     Kundens eget framgångskriterium, binärt avläsbart.
4. Fallback?         Ja — fungerar paketet inte onboardar seniorn muntligt som i dag.
5. Underhållbart?    Ja — Marcus underhåller redan två agenter; paketmallen är en
                     promptfil han äger.
6. Version 2?        Ja — automatisk uppdatering när rationale-dokumenten växer;
                     personalisering efter erfarenhetsnivå.
```

```
Kandidat: Rationale-dokumenterare

1. Litet i tid?      Ja — första projektets beslut dokumenteras inom en vecka.
2. Ägs av en person? NEJ — momentet är "delat mellan designers", ingen utpekad
                     ägare. Marcus äger tekniken men inte arbetssättet; att
                     dokumentera beslut kräver att den som fattade dem deltar.
3–6.                 Prövas inte — kriterium 2 fällde kandidaten.
```

Rationale-dokumenteraren utgår som första projekt (men kvarstår som teamagent —
ägarfrågan flaggas i förslaget).

```
Kandidat: Presentationsbyggare 2.0

1. Litet i tid?      Ja — nästa fredagspresentation är ett skarpt test.
2. Ägs av en person? Ja — Marcus äger agenten sedan tidigare.
3. Mätbart?          Ja, men trubbigt — "en hel dag → en halv" kräver att man
                     skiljer agentens bidrag från vana och svårighetsgrad.
4. Fallback?         Ja — dagens agent och dagens manuella process finns kvar.
5. Underhållbart?    Ja — det är redan Marcus agent.
6. Version 2?        Ja — proposals-stöd och automatisk hämtning ur
                     rationale-dokumenten.
```

### Steg 3: Rangordning

1. **Onboarding-paketbyggare** — rekommendation. Nytt värde (inte inkrementell
   förbättring), kundens eget framgångskriterium, binär mätning. Tekniskt det
   djärvaste av de tre — paketet aggregerar flera källor — men det är precis
   vad byggarnivån tillåter: hos en nybörjarkund hade vi valt det enklare.
2. **Presentationsbyggare 2.0** — alternativ. Störst löpande tidsvinst men
   inkrementell och svårare att mäta rent.

### Output A: Första-projekt-kandidater

# Första-projekt-kandidater: Advanced Studio

## Rekommendation: Onboarding-paketbyggare

### Problemet i era egna ord
"En ny designer behöver ungefär en vecka för att komma in i ett projekt,
mycket för att kontexten är outtalad."

### Varför just det här projektet
Det bär ert eget framgångskriterium — en dag i stället för en vecka — och är
den av era tre stora tidstjuvar som har tydligast ägare och skarpast mätning.
Rätt svårighetsgrad också: ett snäpp djärvare än ett typiskt första projekt,
men ni har redan byggt och driftat egna agenter.

### Vad som ska vara sant efter vecka 1
Ett komplett onboarding-paket finns för ett pågående projekt: sammanfattning,
avgörande beslut med motiveringar, stilguide-tillämpning, frågelista. En
designer som redan kan projektet har granskat paketet och strukit det som är
fel — kvalitetstestet innan en verklig ombemanning.

### Vem äger det
Marcus Eriksson, tech lead. Han bygger och underhåller; seniordesignern på
pilotprojektet levererar underlag och granskar.

### Hur vi mäter framgång
Vid nästa ombemanning: var den nya designern produktiv efter en dag i stället
för en vecka, och hur många timmar la seniorn på muntlig överföring?

### Om det inte fungerar
Seniorn onboardar muntligt som i dag — ingenting står stilla. Vanligaste
felläget, att paketet blir generiskt, hanteras genom att börja med ett enda
projekt och iterera där.

### Vad som kommer sen (version 2)
Paketet slutar vara en ögonblicksbild: när rationale-dokumenteraren är i drift
uppdateras det löpande ur samma källa. Därefter personalisering efter den nya
designerns erfarenhetsnivå.

---

## Alternativ: Presentationsbyggare 2.0

### Problemet i era egna ord
"Vi gör dem i Keynote och det tar en hel dag per kund."

### Varför det är alternativ, inte rekommendation
Störst löpande tidsvinst, och er befintliga presentationsskrivare — "den bästa
av dem" — är en fungerande grund. Men förbättringen är inkrementell och
mätningen mjukare. Rätt som projekt två, när rationale-dokumenten börjat ge
den kontext som gör uppgraderingen möjlig.

*(Den tredje kandidaten, rationale-dokumentationen, föll på ägarkriteriet men
återkommer som teamagent nedan, med ägarfrågan flaggad.)*

---

## 5. Team-förslag: Advanced Studio

Fem agenter — ett under skalningsbeslutets sex. Det femte specialistutrymmet
lämnas medvetet tomt: kandidaten som stod närmast (komponentbiblioteks-
dokumenteraren) saknar belagd smärta — hellre fem motiverade agenter än sex
där den sjätte vilar på en gissning. Arkitekturen är en kedja:
rationale-dokumenteraren gör outtalad kontext explicit; presentationsbyggaren
och onboarding-paketbyggaren konsumerar den.

### VD — Portföljprioritering: kundprojekt mot produktsatsning

**Jobb:** Väger varje vecka kundprojektens deadlines mot design
systems-produktens utvecklingsbehov och avgör var seniortiden ska ligga — och
följer upp att AI-satsningen faktiskt ger seniorerna en dag i veckan tillbaka.

**Motivering:** "Att frigöra senior designers från repetitivt arbete så de kan
fokusera på det svåra" + "vi har börjat erbjuda design systems som produkt" →
research-moment 10. Två verksamheter konkurrerar om samma tolv personer.

**Triggas av:** Veckoplaneringen (måndagar), när kundprojekt och produktarbete
krockar om samma senior, samt månadsuppföljning av framgångskriteriet.

**Rör inte:** Designbeslut i enskilda projekt (designernas domän). Agenternas
prompter och underhåll (Marcus). Skriver inga presentationer eller proposals.

**Kapaciteter:**
- Väger kundprojektens deadlines mot produktsatsningens behov och föreslår
  veckans fördelning av seniortid
- Flaggar när produktsatsningen svälter för att kundprojekt äter allt
- Följer upp framgångskriteriet: får seniorerna tillbaka en dag i veckan?
- Rekommenderar när en agent ska itereras eller avvecklas, baserat på
  VD-assistentens sammanställda användningsbild

**Föreslagna skills:** Inga — prioriteringsarbetet sker i text som redan finns.

**Skalningsnot:** Medelstort företag → strategisk VD (genereras från
team-builder-mallen `ceo-large.md`, eftersom kunden är byggare) — men med ett
konkret veckojobb, portföljavvägningen, så rollen inte blir teater.

### VD-assistent — Ingång och agentväxel

**Jobb:** Den designerna pratar med först: tar emot behov, hänvisar till rätt
specialist, håller lägesbilden och samlar teamets återkoppling på agenterna
till Marcus.

**Motivering:** "Att systematisera det vi redan gör — vi har inget gemensamt i
dag." Verktygen finns; det som saknas är en gemensam ingång. Utan den
fortsätter var och en att prompta i sin egen flik.

**Triggas av:** "Jag behöver en presentation till torsdag", "hur onboardar jag
Sara på appen-projektet?", daglig avstämning.

**Rör inte:** Skriver inte själv presentationer, rationale eller
onboarding-paket. Fattar inte portföljbeslut (VD). Ändrar inte i agenternas
prompter (Marcus).

**Kapaciteter:**
- Hänvisar rätt: presentationsbehov → presentationsbyggaren, ombemanning →
  onboarding-paketbyggaren, beslut som bör sparas → rationale-dokumenteraren
- Sammanfattar läget: pågående projekt, kommande presentationer, vem som
  onboardas var
- Samlar designernas återkoppling på agentoutput till Marcus som underhållsunderlag
- Vägrar kalla till möte när en direkt hänvisning räcker — "granska det här mot
  stilguiden" är ett agentjobb, inte ett möte

**Föreslagna skills:** Inga — växelfunktionen är hänvisning och sammanställning i text.

**Skalningsnot:** I ett team med tre specialister och två uppgraderade
hemmabyggen är växeln skillnaden mellan ett system och sex flikar.

### Onboarding-paketbyggare — *första projektet*

**Jobb:** Bygger ett projektspecifikt onboarding-paket — sammanfattning,
avgörande beslut med motiveringar, stilguide-tillämpning, frågelista — så att
en designer som bemannas på ett projekt är produktiv efter en dag i stället
för en vecka.

**Motivering:** "En ny designer behöver ungefär en vecka för att komma in i
ett projekt, mycket för att kontexten är outtalad" + framgångskriteriet
"onboarda en ny designer till ett projekt på en dag" → research-kluster C.

**Triggas av:** Ett projekt bemannas om eller får en ny designer — eller när
paketet för ett pågående projekt behöver uppdateras.

**Rör inte:** Ersätter inte seniorens frågestund — paketet är underlaget till
den, inte hela onboardingen. Svarar inte på löpande designfrågor efter dag 1.
Fattar inga designbeslut.

**Kapaciteter:**
- Läser projektets underlag: brief, rationale-dokument, Figma-kommentarer,
  exporterad kundfeedback
- Sammanställer projektsammanfattning: problem, riktning, gjort, nästa steg
- Listar de avgörande designbesluten med motivering och källhänvisning
- Producerar ett läsbart paket i markdown plus en frågelista till seniorn för
  det som saknas — den gissar inte i luckorna

**Föreslagna skills:**
- file-reading — underlaget kommer i blandade format (kundbriefs som PDF,
  dokument, exporter); agenten behöver kunna öppna och extrahera ur dem.

**Skalningsnot:** Isolerad med flit — den tuggar mycket råmaterial per körning
(bullrig profil) och ska inte dela kontext med de andra. Dag 1 finns få
rationale-dokument; då bygger den av det som finns och redovisar luckorna som
frågor.

### Rationale-dokumenterare — teamets nav

**Jobb:** Fångar designbeslut medan projektet pågår — problem, alternativ, val,
motivering, trade-offs — och granskar nya designbeskrivningar mot stilguiden
med beslutshistoriken som kontext.

**Motivering:** "Vi dokumenterar mycket designbeslut men processen är manuell
och tar för mycket tid" + designgranskaren är "lite hit or miss — missar
kontext ibland" → research-kluster B. Momenten delar input och löser varandra:
löpande dokumentation ger granskningen den kontext den i dag saknar.

**Triggas av:** Efter design reviews (torsdagar), när ett större beslut fattas,
eller när en designbeskrivning ska granskas mot stilguiden.

**Rör inte:** Fattar inga designbeslut. Bedömer inte om designen är *bra* —
det gör den interna reviewn. Skriver ingen kundtext.

**Kapaciteter:**
- Strukturerar beslut: problem → alternativ → val → motivering → trade-offs
- Ställer riktade frågor om det som saknas i stället för att gissa
- Granskar designbeskrivningar mot stilguiden med beslutshistoriken som kontext
- Flaggar när ett nytt beslut motsäger ett tidigare dokumenterat
- Håller projektets rationale-dokument levande — samma dokument som
  presentationsbyggaren och onboarding-paketbyggaren läser

**Föreslagna skills:** Inga — arbetet sker i text och markdown rakt av.

**Skalningsnot:** Ersätter Marcus fristående designgranskare i stället för att
leva bredvid den. En agent med två sammanvuxna jobb slår två som delar samma
input — städning i det befintliga, inte tillbyggnad.

### Presentationsbyggare 2.0

**Jobb:** Vänder ett projektläge till ett presentationsutkast —
berättelsestruktur, sidplan, talarstöd och beslutsmotiveringar hämtade ur
rationale-dokumenten — så att en hel dags förberedelse krymper rejält.

**Motivering:** "Vi gör dem i Keynote och det tar en hel dag per kund" + den
befintliga presentationsskrivaren är "den bästa av dem" → research-kluster A.
Uppgraderingen är arkitektonisk: agenten kopplas till rationale-dokumenten så
att motiveringarna hämtas i stället för att matas in för hand varje gång.

**Triggas av:** En kundpresentation ska fram (typiskt fredagsarbetet), eller —
efter bekräftad smärta — ett proposal-utkast för en ny förfrågan.

**Rör inte:** Väljer inte det visuella uttrycket — bilder ur Figma läggs in av
designern. Skickar inget till kund. Skriver inte pris eller villkor i proposals.

**Kapaciteter:**
- Bygger berättelsestruktur: utgångsläge → problem → riktning → beslut → nästa steg
- Genererar sidplan med talarstöd per sida och markerade hål för visuellt material
- Hämtar beslutsmotiveringar ur projektets rationale-dokument
- Anpassar ton efter mottagare: pitch för ny kund respektive avstämning i
  pågående projekt

**Föreslagna skills:**
- pptx — ni bygger i Keynote, som öppnar .pptx-filer; agenten kan leverera ett
  färdigt utkast som fil i stället för en textdisposition att klistra om.

**Skalningsnot:** Behåller det som fungerar — logiken i Marcus befintliga agent
blir grunden — och lägger det nya (rationale-kopplingen, filleveransen) ovanpå.

---

## 6. Avvisade

### Komponentbiblioteks-dokumenterare
**Varför inte:** Seriöst påtänkt som teamets sjätte agent — klustret ligger
över ribban och skalningsbeslutet gav utrymme. Den föll på fyndkravet: smärtan
är okänd och ägaren oklar. Naturlig version 2-kandidat när design
systems-produkten växer och momentet får en ägare.

### Design review-agent
**Varför inte:** Designbedömning är mänskligt omdöme som inte kan kodifieras.
Förberedelsen täcks redan av rationale-dokumenteraren.

### Komponentkod-agent
**Varför inte:** Redan löst — Cursor-arbetsflödet "fungerar bra". En agent här
vore dubblering av ett fungerande verktyg.

### Moodboard-agent
**Varför inte:** Redan löst med Midjourney/DALL-E, och bildgenerering är fel
jobb för en Claude-agent. Ingen kläm, inget fynd.

---

## 7. Flaggat för användaren

- **Var lagras designbesluten i praktiken?** → Rekommendation: mappa källorna
  (Figma-kommentarer, Slack-export, dokument) med Marcus innan
  rationale-dokumenteraren byggs.
- **Rationale-dokumentationen saknar ägare** → Rekommendation: utse en ägare av
  arbetssättet, skild från Marcus som äger tekniken.
- **Proposals-momentets smärta är obelagd** → Rekommendation: bekräfta att
  fredagens proposals faktiskt klämmer innan proposal-läget aktiveras.
- **Ombemanningsfrekvensen är okänd** → Rekommendation: räkna efter hur ofta
  projekt fått ny bemanning senaste året — det sätter mätpunkten.

---

## 8. Pedagogisk kalibrering (byggarnivå)

Kunden är byggare — genereringen tonas därefter:

- **Ingen nybörjarpedagogik.** Inga förklaringar av vad en agent eller prompt
  är. Kundens egen jargong (design rationale, design systems) behålls.
- **Fokus på arkitektur:** materialet förklarar *kedjan* — navet och dess två
  konsumenter — eftersom det är den kunskap Marcus behöver för att bygga vidare.
- **Fokus på underhåll:** varje agentfil pekar ut vad Marcus underhåller
  (prompter, källkopplingar) och vad designerna äger (rationale-innehållet).
- **Undvika skräp:** de två hemmabyggda agenterna ersätts ordnat i stället för
  att få syskon — och ett agentutrymme lämnas tomt hellre än fylls utan fynd.
- **Mallval vid generering:** VD från team-builder-mallen `ceo-large.md`
  (byggare + medelstort), VD-assistent från konsult-lägets `chief-of-staff.md`,
  specialister från `agent-pedagogical.md`. Mötesmallar koncisa, utan pedagogik.

---

## 9. Divergens-självtest

Skulle exakt det här teamet kunna klistras in hos ett annat företag — eller
ens en annan designstudio? Nej:

- **Teamet är en kedja byggd kring en specifik rot:** outtalade designbeslut
  spridda i Figma-kommentarer, Slack-trådar och huvuden.
  Rationale-dokumenteraren som nav med två konsumenter är ett svar på just den
  diagnosen, inte en branschmall.
- **Två agenter är uppgraderingar av kundens egna byggen** — Marcus
  designgranskare och presentationsskrivare. Det förslaget går inte att ge
  någon som inte redan byggt dem.
- **VD:ns jobb är studions egen avvägning:** kundprojekt mot den nystartade
  design systems-produkten, med kundens eget mått (en seniordag i veckan) som
  uppföljning.
- **Jämfört med de andra konsult-exemplen:** Lindgren Bokföring fick 3 agenter
  kring verifikationsklassificering (nybörjartak), marknadsbyrån fick 4 kring
  rapportering och tone-of-voice (van, halverad skala). Advanced Studio fick
  5 av 6 möjliga, ett tekniskt djärvare första projekt och en kedjearkitektur
  — olika struktur, inte bara olika namn.

---

## End of Test Output

**Genererad:** 2026-07-15 (simulerad; regenererad mot promptversion 2026-07-15)
**Kund:** Advanced Studio (fiktiv)
**Pipeline:** ai-consultant (full körning: mognadsintake → research →
skalning → första-projekt → team-förslag)
**Status:** Alla steg genomförda för kvalitetsverifiering
