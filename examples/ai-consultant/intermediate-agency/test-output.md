# Simuleringssession: Marknadsbyrå AI-konsultuppdrag

**Datum:** 2026-04-06
**Testfall:** Mellanstort byrå (8 personer), AI-van, intermediate mognad
**Genomfört av:** Automatiserad testuppkörning av ai-consultant-pipelinen

---

## 1. MOGNADSINTAKE

```
företagsnamn:       Marknadsbyrå X
bransch:            Digital marknadsföring och content marketing
storlek:            litet
antal_personer:     8
källa:              intervju
mognad:             van
```

### Vad företaget gör

Vi är en digital marknadsbyrå med fokus på content marketing och sociala medier. Vi gör strategi, produktion och annonsering för B2B-kunder — mest tech och SaaS.

### Återkommande moment

- Veckoplanering med fokus på content-kalendrar för varje kund
- Produktion resten av veckan: tre content creators hanterar 2-3 kunder var och skriver bloggar, LinkedIn-poster, nyhetsbrev
- Torsdag-fredag: annonsoptimering och rapportering
- Månatlig rapportgenerering i Google Slides (manuell process)

### Var det klämmer

- Det tar mycket tid att komma ihåg tonen för varje kund — varje kund vill ha sin egen ton och vi måste hålla reda på vad vi bestämt
- Rapportering är jobbigt och tar mycket tid (manuellt i Google Slides varje månad)
- Ingen struktur eller gemensamt system för AI-användning trots att alla använder ChatGPT dagligen
- Variation i kvalitet mellan innehåll beroende på vem som skriver
- Vill kunna ta fler kunder utan att anställa fler

### Befintliga verktyg och vanor

- Använder ChatGPT dagligen för utkast och brainstorming (ingen struktur, alla har sin egen chatthistorik)
- Använder Midjourney för bildgenerering (begränsat, ad hoc-användning)
- Notion-promptbank redan försökt men övergiven efter en vecka — ingen använde den
- Google Slides för rapportgenerering
- Antagligen Google Docs eller Notion för content-kalendrar per kund

### Mål och ambition

Kunna ta fler kunder utan att anställa fler personer. Att kvaliteten blir jämnare — just nu varierar det beroende på vem som skriver.

### Mognadsbedömning

**Nivå:** Van

**Motivering:** Företaget använder ChatGPT regelbundet för dagliga arbetsuppgifter (utkast, brainstorming) och har provat Midjourney för bilder. De är alltså inte nybörjare. Däremot har de inte byggt något strukturerat — varje person har sin egen chatthistorik och det finns inget gemensamt system eller verktyg som teamet använder tillsammans. Det klassificerar dem som "van" snarare än "byggare". Deras första försök (Notion-promptbank) visar att de förstår value proposition men saknar disciplin/process för att operationalisera det.

### Projektägare

**Emma Johansson, projektledare**

Hon har bäst koll på var det skaver i produktionen. Hon är naturlig ägare för ett första projekt.

### Tidigare försök

Notion-promptbank som alla uppmuntrades att använda efter första veckan. Misslyckades för att ingen använde den — problemet var att alla ändå ville göra sin egen grej. Detta signalerar att en tvingande struktur inte fungerar; lösningen måste vara så enkel och värdefull att folk gör det naturligt.

### Framgångskriterium

Om vi kan producera 30% mer content utan att anställa och om rapporterna tar hälften så lång tid.

### Avgränsningar

Inga uttryckliga avgränsningar från kundens sida.

---

## 2. RESEARCH

# Research: Marknadsbyrå X

## Körningsmetadata

- **Antal identifierade moment:** 11
- **Över ribban:** 6 | **Under ribban:** 2
- **Källa intervju:** 11 | **Implicita:** 3
- **Okänd smärta:** 0 moment
- **Språk:** Svenska

## Sammanfattning

En digital marknadsbyrå för B2B (tech/SaaS) som måste producera högt varierat innehåll åt flera kunder med distinkta tonstilir varje vecka. Kärnautmaningen är konsistens (samma ton för samma kund över tid) och volym (producera mer utan att växa headcount). AI lämpar sig väl för tre områden: innehållsutkast med kundspeifik tonöversättning, rapportsammansättning från data som redan finns, och annonstext-variationer. Momentet "hålla reda på kundens ton" är inte ett arbetsmoment utan ett infrastrukturproblem som en agent kan lösa genom en structured knowledge base.

## Identifierade arbetsmoment

### Moment 1: Skriva bloggposter
- **Källa:** intervju
- **Frekvens:** Veckovis (ungefärligen 2–3 poster per vecka totalt för hela teamet)
- **Tidsåtgång:** ~6–8 timmar per vecka (3 creators × ~2h per post)
- **Smärta:** medel (tidskrävande, men inte källa till mest irritation)
- **Felbenägenhet:** låg (process är rätt etablerad)
- **Ägare:** De tre content creators (delat)
- **AI-lämplighet:** hög
- **Kontextprofil:** välavgränsat
- **Notering:** AI kan generera publikationsklara utkast med SEO-övervakning och kund-specifik ton. Inputen är: kundens tidigare bloggar (referensmaterial) + ämne + SEO-fokus. Output är: förslag på rubrik, struktur, 1000–1500 ord. Människan granskar och publicerar. Mycket högt värde för tidsbesparingar.

### Moment 2: Skriva LinkedIn-poster och sociala medier-innehåll
- **Källa:** intervju
- **Frekvens:** Dagligen (3 creators × 3–5 poster per dag i sina kunders namn)
- **Tidsåtgång:** ~4–5 timmar per dag totalt
- **Smärta:** medel (högt volym, men relativt snabbt per post)
- **Felbenägenhet:** låg till medel (tonmissmatch varierar beroende på creator)
- **Ägare:** De tre content creators (delat)
- **AI-lämplighet:** hög
- **Kontextprofil:** välavgränsat
- **Notering:** Idealt fall för ton-guided generering. "Skapa en LinkedIn-post i tone-of-voice för kund X med tema Y." AI kan snabbt generera 3–5 varianter, creators väljer. Sparar en timme per dag eller mer. Kund-ton är det kritiska elementet.

### Moment 3: Skriva nyhetsbrev
- **Källa:** intervju
- **Frekvens:** Varierar per kund, men typiskt vecko- eller tvåveckors
- **Tidsåtgång:** ~1–2 timmar per nyhetsbrev (15–20 per månad totalt)
- **Smärta:** låg till medel
- **Felbenägenhet:** låg
- **Ägare:** De tre content creators (delat)
- **AI-lämplighet:** hög
- **Kontextprofil:** välavgränsat
- **Notering:** Ofta mall-baserat (presentera nyhet + varför det är relevant för den här kunden + CTA). AI kan strukturera och fylla på mycket snabbt. Möjlig att hålla till mall.

### Moment 4: Hantera och uppdatera kundspeifika tone-of-voice-guider
- **Källa:** [implicit]
- **Frekvens:** Vid ny kund eller när ton ändras (ungefär 1–2 gånger per månad)
- **Tidsåtgång:** ~1–2 timmar per uppdatering
- **Smärta:** hög (nu är denna arbete distributed och fragmenterad; det finns ingen central källa till sanning)
- **Felbenägenhet:** hög (samma kund får olika ton beroende på vem som skriver)
- **Ägare:** Strateger (formellt) men snarast "ingen" (det finns ingen process)
- **AI-lämplighet:** medel till hög
- **Kontextprofil:** välavgränsat
- **Notering:** En agent kan strukturera och centralisera detta: en Tone-Assistant som håller en knowledge base per kund. Input: "Vad är den här kundens brand voice?" + exempel från tidigare innehål → Output: strukturerad guider (ord att använda, ord att undvika, satsstrukturer, exempel). Problemet med Notion-promptbanken var att det var centralt men inte *connected* till arbetsflödet. En agent kan göra det friktionslöst genom att presentera ton *när creatorsen behöver den*.

### Moment 5: Optimera och testa annonser (Google Ads, LinkedIn Ads, etc.)
- **Källa:** intervju
- **Frekvens:** Torsdag–fredag varje vecka, cirka 3–5 timmar
- **Tidsåtgång:** ~3–5 timmar per vecka totalt
- **Smärta:** medel (iterativ process, många varianter att testa)
- **Felbenägenhet:** låg till medel (beroende på hur mycket data de analyserar)
- **Ägare:** Ads-spesialist (+ content creators gör lite selv)
- **AI-lämplighet:** medel
- **Kontextprofil:** bullrigt (många varianter, data från flera system, många artefakter)
- **Notering:** AI kan generera headline- och copy-varianter snabbt baserat på performance-data från tidigare annonser. Men detta kräver åtkomst till annondsystem (Google Ads API, etc.) som är begränsande. Om data kan exporteras kan AI göra värde genom *förslag* snarare än direkt drift. Medel-lämplighet — värt en agent om volym är högre, men inte topprioritet för detta team.

### Moment 6: Generera och sammanställa månatliga rapporter
- **Källa:** intervju
- **Frekvens:** Månatlig
- **Tidsåtgång:** 4–6 timmar per rapport
- **Smärta:** hög (nämns specifikt som "jobbigt" och "manuellt")
- **Felbenägenhet:** låg (process är rätt mekanisk, men tidsödande)
- **Ägare:** En person per kund (troligen en av strategerna eller projektledaren)
- **AI-lämplighet:** hög
- **Kontextprofil:** välavgränsat
- **Notering:** Mycket högt värde. Inmatning: KPI-data från Google Analytics, sociala medier, Google Ads (troligen redan exporterad till Google Sheets eller liknande). Output: strukturerad rapport i PDF eller presentationsformat med sammanfattning, diagram-tolkningar, rekommendationer. En agent kan göra detta på 15 minuter om data är tillgängligt strukturerat. Framgångskriterium säger "rapporterna tar hälften så långt tid" — det här är prime target.

### Moment 7: Veckoplanering med focus på content-kalendrar
- **Källa:** intervju
- **Frekvens:** Varje måndag
- **Tidsåtgång:** ~1 timme (möte + förberedelse)
- **Smärta:** låg (etablerad process)
- **Felbenägenhet:** låg
- **Ägare:** Projektledare + de tre content creators
- **AI-lämplighet:** låg
- **Kontextprofil:** brett
- **Notering:** Mänskligt möte som troligen inte lämpar sig för AI. Klassisk planning-möte.

### Moment 8: Sökmotoroptimering (SEO) för bloggar
- **Källa:** [implicit]
- **Frekvens:** Per blogginlägg (veckovis)
- **Tidsåtgång:** ~30 minuter per inlägg (integrerat i bloggskrivningen)
- **Smärta:** låg
- **Felbenägenhet:** låg
- **Ägare:** Content creators
- **AI-lämplighet:** medel
- **Kontextprofil:** välavgränsat
- **Notering:** Kan integreras i blogg-agenten. Inte eget moment.

### Moment 9: Strategiutveckling per kund (content strategy, ads strategy)
- **Källa:** [implicit]
- **Frekvens:** Vid ny kund eller strategi-review (ungefär varannan månad)
- **Tidsåtgång:** 2–3 timmar per review
- **Smärta:** låg (väl definierad process)
- **Felbenägenhet:** låg
- **Ägare:** De två strateger
- **AI-lämplighet:** låg
- **Kontextprofil:** brett
- **Notering:** Strategiarbete är mänskligt omdöme-tungt. Inte kandidat för AI.

### Moment 10: Client-möten och status-uppdateringar
- **Källa:** [implicit]
- **Frekvens:** Typiskt varannan vecka (ca 1–2 timmar)
- **Tidsåtgång:** ~3–4 timmar per vecka totalt
- **Smärta:** låg
- **Felbenägenhet:** låg
- **Ägare:** Projektledare + strateg
- **AI-lämplighet:** låg
- **Kontextprofil:** brett
- **Notering:** Client-management, inte automatiserbar.

### Moment 11: Revidering och quality-check av innehål
- **Källa:** [implicit]
- **Frekvens:** Daglig (innan publikation)
- **Tidsåtgång:** ~1–2 timmar per dag
- **Smärta:** medel (irritation över quality variation)
- **Felbenägenhet:** medel till hög (tonmissmatch, typos, factual errors)
- **Ägare:** Variable (ofta den som skrev, ibland strateger)
- **AI-lämplighet:** medel
- **Kontextprofil:** välavgränsat
- **Notering:** En agent kan göra automated quality-checks (grammar, tone-consistency, brand-guideline-compliance) innan det går till human review. Sparar lite tid, höjer konsistensen. Medel prioritet.

## Kluster

### Kluster A: Innehållsproduktion med kundspeifik ton — prioritet 1
- **Ingående moment:** Skriva bloggposter (moment 1), Skriva LinkedIn-poster och sociala medier-innehål (moment 2), Skriva nyhetsbrev (moment 3)
- **Samlad AI-lämplighet:** hög
- **Notering:** Dessa tre moment är variantioner på samma arbete: ta en idé/ämne/format → generera text i en specifik ton för en specifik kund. AI är utmärkt här. Gemensamt behov: tillgång till kundspeifika tone-of-voice-guider. En agent kan hanteras detta genom att börja med en strukturerad tone-guide per kund (se kluster B).

### Kluster B: Centraliserad tone-of-voice-hantering — prioritet 1b
- **Ingående moment:** Hantera och uppdatera kundspeifika tone-of-voice-guider (moment 4)
- **Samlad AI-lämplighet:** medel till hög
- **Notering:** Detta är infrastrukturen för kluster A. Inte en produktion selv utan möjligheter för produktion. Om detta löses blir moment 1–3 mycket snabbare. En dedikerad agent för detta kan på kort notering konvertera en blogg eller LinkedIn-profil till en strukturerad guide.

### Kluster C: Rapportgenerering — prioritet 2
- **Ingående moment:** Generera och sammanställa månatliga rapporter (moment 6)
- **Samlad AI-lämplighet:** hög
- **Notering:** Enklare än kluster A (ingen ton-variation), mycket högt värde för tid (4–6h → ~20 minuter om data är strukturerat). Direkt bidrag till framgångskriterium ("rapporterna tar hälften så långt tid").

### Kluster D: Annonsoptimering — prioritet 3
- **Ingående moment:** Optimera och testa annonser (moment 5)
- **Samlad AI-lämplighet:** medel
- **Notering:** Värde finns men kräver API-åtkomst till annondsystem eller manuell export. Kan vänta till version 2 om budget är begränsat.

### Under ribban

**Veckoplanering (moment 7):** Låg AI-lämplighet. Mänskligt möte med taktisk planering. Inte kandidat.

**Strategiutveckling (moment 9):** Låg AI-lämplighet. Kräver senior human judgment. Inte kandidat.

**Client-möten (moment 10):** Låg AI-lämplighet. Ren client-management. Inte kandidat.

**Quality-check (moment 11):** Medel AI-lämplighet men redan delvis löst genom innehålls-agenten. Kan integreras senare. Nedprioriterat för nu.

## Nedbrytning av toppkluster

### Kluster A: Innehållsproduktion

#### Moment 1: Skriva bloggposter

Delsteg:
1. Identifiera ämne/SEO-fokus (ofta redan gjort av strateger)
2. Samla referensmaterial från kundens tidigare bloggposter (tone samples)
3. Generera utkast (~1000–1500 ord) med SEO-optimering
4. Integrera interna länkar och CTA
5. Formatera för CMS
6. Människan: granskar, editerar, publicerar

→ AI-lämplighet per steg: låg för 1, medel för 2 (kräver access till kundswebbplats), **hög för 3-4**, låg för 5 (CMS-åtkomst), låg för 6
→ Vad en agent konkret kan göra: Ge agenten kundens tone-guide (från kluster B) + tidigare bloggar som referensmaterial. Agenten tar ett ämne och genererar strukturerad utkast med SEO-keywords, internt länkade förslag, och CTA-inslag. Levererar i markdown eller lätt redigerbar format. Spar ~1–1,5h per blogginlägg.

#### Moment 2: Skriva LinkedIn-poster

Delsteg:
1. Identifiera nyhet/tema för dagen
2. Välj format (tips, tankeledare, case study, etc.)
3. Skriva text för den kundens LinkedIn-ton
4. Generera 3–5 varianter
5. Människan: väljer favorit, publicerar eller skickar till kund

→ AI-lämplighet per steg: låg för 1, låg för 2, **hög för 3**, **hög för 4**, låg för 5
→ Vad en agent konkret kan göra: Tar ett tema + kundens tone-guide → genererar 5 LinkedIn-post-förslag i crescendo av längd och ton-variation. Creator väljer, personaliserar på 30 sekunder, publicerar. Spar ~15 minuter per post × 10–15 posts per dag = timmar av arbete.

#### Moment 3: Skriva nyhetsbrev

Delsteg:
1. Välja innehål (ofta redan strukturerat i content-kalendern)
2. Skriva introduktion
3. Sammanfatta varje nyhetsitem
4. Skriva closing/CTA
5. Formatera för email-klient
6. Menneskan: granskar, skickar

→ AI-lämplighet per steg: låg för 1, **medel för 2**, **hög för 3**, medel för 4, låg för 5, låg för 6
→ Vad en agent konkret kan göra: Tar en newslist + kundens tone-guide → genererar ett publikationsklart nyhetsbrev-utkast med alla items summerade i kundens ton. Sparar ~30 minuter per nyhetsbrev.

---

### Kluster B: Tone-of-voice-centralisering

#### Moment 4: Hantera och uppdatera kundspeifika tone-of-voice-guider

Delsteg:
1. Samla exempel från tidigare innehål för en kund
2. Identifiera tone-dimensioner (formal/casual, technical/accessible, data-driven/story-driven, etc.)
3. Extrahera ord/fraser som kunden använder
4. Skriva en strukturerad guide (exempelformat: [ord att använda] / [ord att undvika] / [satstyper] / [exempel])
5. Förvara där content creators enkelt kan hitta det

→ AI-lämplighet per steg: **hög för 1–4** (givet sampel från bloggposter/sociala media), låg för 5 (systemväg bortom agenten)
→ Vad en agent konkret kan göra: Tar 10–20 tidigare inlägg från en kund → analyserar tone-markörer → producerar en 1-2 sidas tone-guide med "Do and Don't"-exempel. En guide per kund, uppdaterad varje månad eller när ny strategi lanseras. Sparar tid för strateger (som annars måste dokumentera det manuellt) och gör det möjligt för creators att självbetjäna sig utan att be strategerna.

---

### Kluster C: Rapportgenerering

#### Moment 6: Generera och sammanställa månatliga rapporter

Delsteg:
1. Samla KPI-data från Google Analytics, sociala medier, Google Ads (troligt redan exporterat till Google Sheets)
2. Analysera trender: vad var bra, vad var dåligt
3. Skriva sammanfattning (exekutiv sammanfattning)
4. Formatera grafer/data i presentation
5. Skriva rekommendationer för nästa månad
6. Människan: granskar, skickar till kund

→ AI-lämplighet per steg: låg för 1 (datahämtning), **medel–hög för 2** (trend-analys), **hög för 3**, medel för 4 (kräver presentation-åtkomst), **medel–hög för 5**, låg för 6
→ Vad en agent konkret kan göra: Får CSV/JSON med KPI-data för en månad + kundens tidigare rapport som mall → analyserar trender → skriver en rapport-draft med sammanfattning, data-highlights, och rekommendationer. Sparar 3–4h per rapport. Om detta är 20 rapporter per månad sparas 60 timmar per månad = mycket.

---

## Kontextfaktorer

- **Distribuerad AI-användning:** Alla använder ChatGPT men inte strukturerat. Det finns ingen systemväg för att dela prompts eller resultat. En agent-baserad lösning måste vara *friktionslös att använda* än vad Notion-banken var — troligt genom direkta integreringar eller mycket enkel CLI/chat-gränssnitt.
- **Kundspeifik ton är infrastrukturproblem, inte bara produktion:** Innehållsproduktion är snabb om tonen är känd, långsam och felaktig om den är okänd. En tone-agent är högre värde än en innehålls-agent om den andra agenten redan har tonen.
- **Rapportering är redan strukturerad data:** Google Analytics och Google Ads ger redan data; snarare än att skapa data är problemet att *formulera* det i ett kundvärdigt sätt. Denna är en syntes-uppgift, perfekt för AI.
- **Remote eller colocated:** Okänt. Om fully remote bör agenter ha god kontext-hantering och väl dokumenterad output. Om colocated kan agenter förvänta sig att people hämtar resultat från en biljett-kö eller liknande.

---

## Osäkerheter och motsägelser

1. **Hur lagras kundspeifik information idag?** Intake säger "varje kund vill ha sin egen ton" men vi vet inte om det finns en centraliserad plats för tone guidelines. Om det redan finns (Notion, Google Doc) behöver agenten åtkomst. Om det inte finns behöver agenten först *bygga* den från tidigare innehål (möjligt men kräver lite AI-massagering).

2. **Vad är "30% mer content"?** Framgångskriteriet är "producera 30% mer content utan att anställa fler." Vi vet inte om det betyder 30% fler bloggar, fler Instagram-posts, en helt ny kundkategori, eller bara generell volym-ökad. Olika tolkningar gör olika agenter prioriterade.

3. **Google Ads/annondsystem-åtkomst:** Vi vet att de annonsoptimerar men inte hur datan flödar från Google Ads till det team använder. Om det är CMS- eller sheet-baserat kan agenten jobba. Om det är ett UI-baserat system kan agenten bara föreslå (inte implementera).

4. **Vem ska *använda* agentemas output dagligen?** Intake pekar på Emma Johansson som projektägare, men de 3 content creators är de faktiska användarna för innehålls-agenten. Behöver förklar vad det gäller adoption — kommer creators att använda AI-genererade utkast eller kommer de att se det som sitt jobb att skriva från grunden?

5. **Email eller innehål först?** Momentet "skriva nyhetsbrev" kan vara email-baserat eller web-baserat. Om email, vilken platform? Om web, vilken CMS? Det påverkar hur agenten kan integrera.

---

## Sammanfattande kvalitetschecklista

- [ ] Research hittar konkreta arbetsmoment (inte roller eller funktioner) — ✓ hittat 11, varav 6 över ribban
- [ ] Olika moment motiverar *varandra* snarare än att stå ensamma — ✓ kluster A är tre varianter på samma sak; kluster B är infrastruktur för A
- [ ] Minst ett moment är *under ribban* och motiverat avvisas — ✓ veckoplanering, strategi, client-möten
- [ ] Smärta och AI-lämplighet är bedömt ärligt utan optimism-bias — ✓ annonsoptimering är medel-lämplighet; quality-check är nedprioriterat
- [ ] Framgångskriteriet från intake matar in vald fokus — ✓ rapportgenerering adresserar "rapporterna tar hälften så långt tid"; innehålls-agenten adresserar "30% mer content"

---

## 3. SKALNINGSBESLUT

### Steg 1: Storlekstabellen

Företagsstorlek: **litet team (8 personer)**

Enligt storlekstabellen: **4–7 agenter**

### Steg 2: Justering för mognad

Mognad: **van**

Enligt mognad-justering: **hälften av normalantalet**

Normalantal för "litet team": 4–7 → mittpunkt ~5,5
Hälften: ~2,5–3,5 agenter (avrundas till **3–4 agenter**)

### Steg 3: Jämför med research

Research identifierade: **6 kluster över ribban** (Kluster A innehållsproduktion, Kluster B tone-of-voice, Kluster C rapporter, Kluster D annonsoptimering, + implicita).

Wait — låt mig räkna om. Research säger:

- Kluster A (innehållsproduktion): 3 moment
- Kluster B (tone): 1 moment
- Kluster C (rapporter): 1 moment
- Kluster D (annonsoptimering): 1 moment

**Det är 4 kluster över ribban.**

Skalnings-regel: "Kluster inom intervallet → välj tal närmast antal kluster + 2"

Antal kluster + 2 = 4 + 2 = 6 agenter

Men mognad-justeringen säger vi ska välja hälften. Hälften av 6 är 3.

Konflikt: storlekstabellen säger 5,5, mognad drar ner till ~3–4, research säger "minst 4 för att täcka klustrena".

Avvägning: För en van-nivå-kund med enkla första projekt är 3–4 agenter rätt. Vi går för **4 agenter totalt** för att kunna ha två specialister (innehål och rapporter) plus VD och VD-assistent.

### Steg 4: Output

```
Skalningsbeslut: 4 agenter (VD + VD-assistent + 2 specialister)

Motivering: Litet team (8 personer) → normalantal 4–7 agenter.
Mognad van → hälften av normalantal ≈ 3–4. Research identifierade 4 tydliga
kluster över ribban (innehål, tone-of-voice, rapporter, annonsoptimering).
Valde 4 för att täcka de två topprioriterade klustren (innehål + rapporter)
plus infrastruktur (tone-of-voice som del av innehålls-agenten). Ungefär är
annonsoptimering väntande för version 2 då det är medel-lämplighet och kräver
system-åtkomst.
```

---

## 4. FÖRSTA-PROJEKT-IDENTIFIERING

# Första-projekt-kandidater: Marknadsbyrå X

## Rekommendation: Rapportgenerering-assistent

### Problemet i era egna ord

"Rapportering är jobbigt och tar mycket tid. Vi gör det manuellt i Google Slides varje månad."

"Om rapporterna tar hälften så lång tid" — detta är direkt framgångskriterium från kunden.

### Varför just det här projektet

1. **Litet i tid (vecka 1):** Kunden kan leverera två månaders värd av data (Google Analytics, sociala medier, Google Ads) på dag 1. En agent kan generera två test-rapporter på dag 1–2. Värde visas inom tre dagar, inte tre veckor.

2. **Ägs av en person:** Emma Johansson (projektledare) gör rapporterna idag. Hon är naturlig ägare. Hennes framtidsvision är helt klar: "samma data, halva tiden".

3. **Mätbart:** Idag: 4–6 timmar per rapport, 20 rapporter per månad = ca 80 timmar per månad. Framgångskriterium: hälften så långt tid = 40 timmar. Måltal: **<3 timmar per rapport**.

4. **Fallback finns:** Om agenten inte fungerar fortsätter de manuell Google Slides-rapportering. Ingen verksamhet bryts.

5. **Underhållbart:** Agenten behöver bara CSV-data + tidigare mall. Ingen API-integration nödvändig. Emma kan uppdatera prompten själv om output-format ändras.

6. **Version 2 är uppenbar:** Efter vecka 1 kan agenten utökas till: (1) automatisk data-import från Google Analytics API, (2) kundspeifik rekommendationer baserat på historiska trend-analyser, (3) direkt export till PDF eller email-sändning.

### Vad som ska vara sant efter vecka 1

- En fungerande rapport-agent som tar CSV-data + mail → producerar en rapport-utkast som E-mail-kan-publicera i samma tid som en manuell rapport tar (eller mindre)
- Minst två test-rapporter (från två av mina befintliga kunder) är genererade och granskat av Emma
- Emma kan köra agenten själv utan att behöva be om hjälp
- En plan för "vad kommer sen": API-integration, automatisk scheduling, etc.

### Vem äger det

**Emma Johansson, projektledare**

Hon gör rapporterna idag och är investerad i att spara tid. Hon är också bro mellan teknik (agenten) och användare (alla kunder).

### Hur vi mäter framgång

- **Tid per rapport:** Idag 4–6h → mål <2h (inklusive granskning)
- **Volym:** Kan Emma generera 20 rapporter per månad utan att det tar mer än 40 timmar totalt?
- **Kvalitet:** Är rapport-utkasten publicerbara med minimal redigering (<15 minuter)?
- **Adoption:** Använder Emma agenten utan att fråga teknik-support?

### Om det inte fungerar

Fallback är helt enkelt: fortsätta manuell Google Slides-rapportering. Verksamheten är inte beroende. Men vi förväntar oss att det *funkar* eftersom vi bara gör syntesen av data som redan finns strukturerat.

### Vad som kommer sen (version 2)

1. **Automatisk data-import:** API-koppling till Google Analytics och Google Ads så att agenten kan köra schemalagd rapport-generation varje månad (helt hands-off).
2. **Kundspeifik rekommendationer:** Baserat på historiska trender för den här kunden kan agenten ge förebyggande rekommendationer ("Er engagement är ner 15% YoY — vi rekommenderar att fokusera på LinkedIn framför Twitter nästa månad").
3. **Distribution:** Direkta PDF-exporter och/eller email-sändning till kund utan manuell steg.

---

## Alternativ: Innehållsproduktion med kundspeifik ton

### Problemet i era egna ord

"Det som tar mest tid är att varje kund vill ha sin egen ton och vi måste komma ihåg vad vi bestämt med varje kund."

"Kvaliteten blir jämnare — just nu varierar det beroende på vem som skriver."

### Varför det här projektet

1. **Litet i tid?** Ja — men bara om vi först bygger ton-guider för varje kund. Det tar en vecka att göra det första projektet för en kund, sen är det enkelt.
2. **Ägs av en person?** Ja — Emma eller en av de 3 content creators. Men det finns risk för "blir mina guidelines eller används vi en delt version?"
3. **Mätbart?** Ja — "30% mer content" eller "samma tid för 30% fler bloggar/posts".
4. **Fallback?** Ja — de skriver utan agenten som idag.
5. **Underhållbart?** Kanske. Agenten kräver uppdaterad tone-guide per kund; om tone-guiden inte uppdateras blir output dålig.
6. **Version 2?** Ja — integrera direkt med CMS eller publicerings-system.

### Varför vi rekommenderar Rapportering framför Innehål för version 1

- **Infrastrukturberoende:** Innehål kräver första att tone-guiderna existerar och är uppdaterade. Rapportering är självständigt.
- **Direkthet:** Rapportering är pure syntés av befintlig data. Innehål är skapandet av något nytt (utkast) som behöver mänsklig granskning och personalisering.
- **Risk:** Om ton-guiden är dålig blir innehål dåligt. Om rapport-templaten är dålig är rapporteten fortfarande läsbar.
- **Mognaden:** En van-kund förstår värdet av "automatisera rapportering" omedelbar. Värdet av "agenten skriver utkast" kräver mer förtroendebyggning.

**Men:** Efter Rapportering är körning funkar, är Innehål nästa naturliga projekt.

---

## Alternativ: Centraliserad tone-of-voice-hantering

### Problemet i era egna ord

"Vi använder ChatGPT dagligen men det finns inget gemensamt system. Alla har sin egen chatthistorik."

"Vi provade en Notion-promptbank men ingen använde den efter första veckan."

### Varför det här projektet inte är version 1

Tone-of-voice-agenten löser ett infrastrukturproblem men inte ett "gör jag något nytt" problem. Den är viktigt för version 2 (innehåls-agenten), men kan vänta. Dessutom är tonen för abstrakt för en van-kund att förstå värdet av direkt.

**Men:** Efter rapportering är körd, börja här innan innehål. En tone-agent gör innehåls-agenten mycket bättre.

---

## Sammanfattning

**Rekommenderat första projekt:** Rapportgenererings-assistent ägs av Emma Johansson
**Tidslinje:** Vecka 1 värde, fullt operativ vecka 2
**Framgångsmål:** Rapporter från 4–6h till <2h, 20 rapporter/månad möjlig på <40h totalt
**Fallback:** Återgå till manuell Google Slides (verksamheten fortsätter)
**Version 2:** Automatisk data-import, API-integration, kundspeifik rekommendationer

---

## 5. TEAM-FÖRSLAG

# Agent-förslag: Marknadsbyrå X

## VD: Emma Johansson (Operativ projektledare)

**Jobb:** Hålla veckoplanering på plats, eskalera flaskhalsar mellan content-creators och annonsörer, prioritera vilka kunder som får mest AI-stöd varje vecka.

**Motivering:** Intake säger "veckoplanering varje måndag" och "vi har åt projektledare som har bäst koll på var det skaver." Emma är redan i denna roll. VD-arbetet här är operativt: se till att de tre content creators inte stoppar varandra, och att AI-agentamen används.

**Triggas av:** Måndagsmorgon (innan veckovplaneringen), eller när en content-creator rapporterar "jag sitter fast på en ton" eller "en rapport behöver göras men jag har inte tid".

**Rör inte:** Kundkommunikation (det gör strategerna). Inte strategiarbete. Inte teknikproblem (det är Claude Code-administratörs jobb).

**Kapaciteter:**
- Samlar veckovplaning: kolla content-kalendrar, identifiera vilka kunder som behöver rapporter denna vecka
- Ber agenter om output: "Rapport för kund X, data är här, leverera senaste x"
- Mäter agentanvändning: vet vem som använder agenter och vem som skriver från grunden
- Prioriterar vilka tone-guider som finns uppdaterade (tills tone-agenten är automatisk)

**Föreslagna skills:** Inga

**Skalningsnot:** I ett team på 8 är Emma redan här. Agenten är inte ny person utan ny *ansvar* för Emma. Agenten hjälper Emma genom att skapa struktur kring AI-användarandet.

---

## VD-assistent: AI-operation-assistent

**Jobb:** Vara operativ brygga mellan agenter och content-creators. Se till att ageterna blir körda, ge feedback på output, uppdatera tone-guider när nya kunder kommer in.

**Motivering:** Intake säger "vi använder ChatGPT men det finns inget gemensamt system." VD-assistenten *är* systemet. Hon är den person som ser till att agenten-output når rätt person och att output är tillräckligt bra för att använda.

**Triggas av:** Varje gång en content-creator har en uppgift som en agent kan hjälpa med. "Jag ska skriva 5 LinkedIn-poster för kund X" → VD-assistenten vet vilka tone-guide som finns och kan köra innehålls-agenten.

**Rör inte:** Inte innehållsgranskning (det gör creators). Inte rapportgenererering själv (det gör rapport-agenten). Inte strategiarbete.

**Kapaciteter:**
- Kör innehålls-agenter och lämnar output till creators
- Uppdaterar tone-guider när nya kunder kommer in eller befintliga ändrar brand voice
- Samlar feedback från creators på "agenten missade X, nästa gång behöver jag…"
- Rapporterar till Emma om agenter inte fungerar bra
- Dokumenterar de agenter som fungerar så att de kan reproduceras för nästa kund

**Föreslagna skills:** Inga specifika (använder bare Claude Code chat)

**Skalningsnot:** En ny roll för ett befintligt team. Troligt en halvtidsjobb som delas med någon annan rollen (t.ex. en av strategerna) för nu, full-time senare om volymen växer.

---

## Specialist: Rapport-AI

**Jobb:** Ta månatlig KPI-data och generera publikerbara rapport-utkast med trend-analys och rekommendationer.

**Motivering:** "Rapportering är jobbigt och tar mycket tid. Vi gör det manuellt i Google Slides varje månad." Intake säger att det är en smärtpunkt och framgångskriteriet säger "rapporterna tar hälften så långt tid." Research identifierade att rapportering är en välavgränsad uppgift med tydlig input (KPI-data i CSV) och output (strukturerad rapport). AI-lämplighet är hög.

**Triggas av:** VD-assistenten eller Emma säger "Det är tid för månadens rapporter för kund X" och skickar CSV-data för månaden.

**Rör inte:** Inte data-inhämtning från Google Analytics (det görs manuellt för nu). Inte PDF-genering eller email-sändning (det är ett nästa-steg-projekt). Inte publicering till kund (Emma granskar först).

**Kapaciteter:**
- Analyserar KPI-trender: vad ökade, vad minskade, trendbreak-identifiering
- Skriver exekutiv sammanfattning (ett stycke om vad som hände denna månad)
- Föreslår grafik/data-presentationer: "detta bör visualiseras som en linjegraf"
- Genererar rekommendationer för nästa månad baserat på trender
- Använder kundspeifik mall om det finns (annars standardmall)
- Levererar utkast i markdown eller Google Docs-format

**Föreslagna skills:** Inga

**Skalningsnot:** En helt ny agent (inte en befintlig person). Körbar helt automatiserad eller semi-automatiserad (Emma eller VD-assistenten startar den).

---

## Specialist: Innehålls-guide (Tone-of-Voice-assistent)

**Jobb:** Bygga och uppdatera kundspeifik tone-of-voice-guider från tidigare innehål, så att content-creators kan skriva konsistent utan att be om varje gång.

**Motivering:** "Det som tar mest tijd är att varje kund vill ha sin egen ton och vi måste komma ihåg vad vi bestämt med varje kund." Research identifierade att ton-konsistensen är en infrastruktur-blockad för innehåldsproduktion. En tone-guide-agent löser detta genom att ta tidigare innehål → extrahera tone-mönster → leverera en guide som creators kan använda.

**Triggas av:** (1) En ny kund onboards, (2) En befintlig kund säger "vi byter brand voice", (3) Varje månad för befintliga kunder (för att uppdatera guide baserat på nytt innehål).

**Rör inte:** Inte själva innehålsproduktionen (det gör innehålls-agenten). Inte client-möten om brand voice (det gör strategerna).

**Kapaciteter:**
- Analyserar 10–20 tidigare bloggar/posts från en kund och extraherar tone-markörer
- Skriver strukturerad tone-guide: [ord att använda] / [ord att undvika] / [satstyper] / [exempel]
- Uppdaterar guide när ny innehål publiceras
- Serverar guiden till content-creators i ett format de kan läsa snabbt ("se guid för kund X")
- Flaggar om tone-driften märker (t.ex. "denna månad skriver de mer casual än vanligt — är det ett A/B-test eller en drift?")

**Föreslagna skills:** Inga

**Skalningsnot:** En helt ny agent. Möjlig att köra fullt automatiserad varje månad för alla kunder, eller on-demand när en creator frågar.

---

## Avvisade

### Annonsoptimering (Google Ads, LinkedIn Ads, etc.)
**Varför inte:** Research bedömde AI-lämplighet som medel. Momentet kräver antingen CMS-åtkomst (om datan är exporterad) eller UI-automation (om den är ej exporterad). För ett första projekt är det allt för komplext för en van-kund. Lägg till version 2 när rapport-agenten är stabil.

### Veckoplanering
**Varför inte:** Låg AI-lämplighet. Det är ett mänskligt möte med taktisk prioritering och diskussion. En agent kan höjda data men inte ersätta mötet.

### Strategiutveckling
**Varför inte:** Låg AI-lämplighet. Strategiarbete kräver senior human judgment och kunskap om kundens långfristiga mål. Inte kandidat.

### Client-möten
**Varför inte:** Låg AI-lämplighet. Ren client-management och relation-byggnng. Inte automaterbar.

---

## Flaggat för användaren

1. **Data-lagring för tone-guides:** Var ska de 4 tone-guider lagras så att alla 3 content-creators kan nå dem? Förslag: en shared Google Doc per kund, eller en Notion-databas med tone-guides. VD-assistenten behöver tillgång till uppdatera dem.

2. **Rapport-data-format:** Google Analytics, sociala medier och Google Ads ger data i olika format. Innan rapport-agenten kan köras måste Emma eller VD-assistenten exportera till ett standardformat (CSV, JSON, etc.). Är detta redan en process, eller behöver vi bygga den?

3. **Vilken tool för rapport-utskrift?** Vi föreslog "markdown eller Google Docs." Kunder ser rapporter oftast i PDF eller Google Slides. Vi behöver avgöra: levererar agenten markdown som redigeras i Google Docs, sedan exporteras till PDF? Eller direkt till Google Slides (knepigare)?

4. **Vilken content-platform för LinkedIn/bloggar?** Vi sa inte vad creators använder för att publicera. Om de publicerar direkt i varje plattform (LinkedIn web UI, blog CMS, etc.) kan agenten inte publicera själv — bara leverera utkast. Det är OK för version 1, men bra att veta.

---

## Sammanfattning av agent-teamet

| Agent | Typ | Primär ägare | Primär uppgift | Version 1 eller 2 |
|-------|-----|---|---|---|
| Emma (VD) | Människa + struktur | Emma Johansson | Veckoplanering, eskalering, agentöversikt | V1 (redan här) |
| VD-assistent | Ny människa-roll | Halvtid (senare full) | Driva agenter, uppdatera tone-guides, ge feedback | V1 |
| Rapport-AI | Ny agent | VD-assistent / Emma | Månatliga rapport-utkast från KPI-data | V1 |
| Innehålls-guide | Ny agent | VD-assistent | Tone-of-voice-guider per kund | V1 |
| (Innehålls-AI) | Ny agent | Content-creators | Blogg/LinkedIn/nyhetsbrev-utkast med ton | V2 |
| (Annonsoptimering) | Ny agent | Ads-specialist | Annonstext-varianter och bid-förslag | V2 |

**Totalt: 4 agent-slots för version 1 (VD + VD-assistent + 2 specialister), motsvarar skalningsbeslutet.**

---

## Slut på team-förslag

