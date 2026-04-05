# Research: Livsverket Förlag

## Körningsmetadata
- **Antal identifierade moment:** 10
- **Över ribban:** 5  |  **Under ribban:** 5
- **Källa intervju:** 7  |  **Implicita:** 3  |  **Hypoteser:** 0
- **Okänd smärta:** 0 moment
- **Språk:** svenska

## Sammanfattning

Livsverket Förlag ger ut 8–12 böcker per år inom självhjälp och personlig utveckling med ett team på sex personer. Verksamheten är starkt bundenmanus-driven — mottagandet, bedömningen och redigeringen av manus tar exponentiell tid relativt till publik volym (20 manus/månad, max 10 antas/år). Sekundära flaskhalsar ligger i marknadsföring (en person lägger 60% på sociala medier per bok), royalty-avräkningar (manuell Excel, veckolång process per kvartal) och multikanal-försäljningsdata som ligger splittrad över fyra system. Manushantering och ekonomi är där ett agent-team kan leverera störst värde — särskilt automatiserad initialbedömning av manus, struktur för marknadsformulering och royalty-beräkning.

## Identifierade arbetsmoment

### Moment 1: Manusläsning och initialbedömning
- **Källa:** intervju
- **Frekvens:** veckovis (kontinuerlig ström, ~20 manus/månad)
- **Tidsåtgång:** ~15–20% av redaktörens vecka
- **Smärta:** hög
- **Felbenägenhet:** medel (risk för att låta bra manus passera eller sitta länge på dåliga)
- **Ägare:** redaktör
- **AI-lämplighet:** medel
- **Kontextprofil:** välavgränsat
- **Notering:** Själva läsningen av 20 manus är tidsintensiv men AI kan hjälpa till med *initialbedömning* — sammanfattning, genreanalys, målgruppsmatch och preliminär ja/nej. Redaktören kan då fokusera på de 15–20 som är närmast antalet. Problem: AI kan inte säga "det här är ett bra självhjälpsmanus" utan kontext om Livsverkets katalog, målgrupp och tidigare succéer. Utan den kontexten är bedömningen skakig.

### Moment 2: Redigering och författarkommunikation
- **Källa:** intervju
- **Frekvens:** flera gånger per vecka (kontinuerlig under redigeringscykel)
- **Tidsåtgång:** ~25–30% av redaktörens vecka
- **Smärta:** hög
- **Felbenägenhet:** låg (processo är redan väl definierad)
- **Ägare:** redaktör
- **AI-lämplighet:** låg
- **Kontextprofil:** brett
- **Notering:** Detta är ett relationellt moment — det handlar om att förstå författarens intention, ge konstruktiv feedback, hålla deadlines. En agent kan assistera med att *strukturera* ett redaktörsbeslut i ett mejl (ordningsföljd av points, ton) men själva besluten måste redaktören ta. Att delegera detta till en agent riskerar att bryta förtroende mellan förlag och författare.

### Moment 3: Korrekturläsning
- **Källa:** intervju
- **Frekvens:** per bok före tryck (~10–12 böcker/år = 1–2 gånger/månad intensivt)
- **Tidsåtgång:** okänd (intake sa "tar för lång tid och vi missar ändå saker" men inte hur mycket tid)
- **Smärta:** medel-hög
- **Felbenägenhet:** hög (explicit nämnt att fel misses)
- **Ägare:** redaktör / oklar (kan även vara extern korrekturläsare)
- **AI-lämplighet:** medel
- **Kontextprofil:** välavgränsat
- **Notering:** AI kan göra ett första pass på stavning, grammatik, konsistens (namn, datum, stil). Det kan fånga många enkla fel och spara tid. Men slutkontroll måste göras av människa — juridisk precision krävs för självhjälpsböcker (påstår inte medicinska sanningar osv). AI-assistansen höjer snabbheten men ersätter inte mänsklig slutgranskning.

### Moment 4: Skrivande av baksidetexter och marknadsformulering
- **Källa:** intervju
- **Frekvens:** per bok (~10–12/år, ~1–2 gånger/månad)
- **Tidsåtgång:** ~8–10 timmar per bok (delat mellan redaktör och marknadsförare)
- **Smärta:** hög
- **Felbenägenhet:** medel (redaktör och marknadsförare "alltid har olika bild av vad boken handlar om")
- **Ägare:** redaktör + marknadsförare
- **AI-lämplighet:** hög
- **Kontextprofil:** välavgränsat
- **Notering:** Detta är textproduktion från välavgränsad input (manus, målgrupp, katalogens ton). AI kan skapa initiala versioner av baksidetext, pressmaterial, författarpresentation med givna stilriktlinjer. Redaktör och marknadsförare kan sedan revidera gemensamt utifrån ett starkt utkast istället för att starta från noll. Högt värde om man kan kodifiera Livsverkets "röst".

### Moment 5: Sociala medie-inlägg och marknadsföring
- **Källa:** intervju
- **Frekvens:** veckovis (löpande för varje bok i kampanj)
- **Tidsåtgång:** ~60% av marknadsförarens vecka
- **Smärta:** hög (den enda marknadsföraren investerar massiv tid)
- **Felbenägenhet:** låg (Instagram-posting är väl strukturerat)
- **Ägare:** marknadsförare
- **AI-lämplighet:** hög
- **Kontextprofil:** bullrigt
- **Notering:** Här ligger ännu större värde än baksidetexter. Massor av små artefakter (Instagram-captions, hashtag-strategier, mailchimp-innehål). AI kan generera 5–10 variationers initial-inlägg för varje bok, anpassade till tema och målgrupp, med Mailchimp-koppling. Marknadsföraren väljer ut vilket som passar bäst. Bullrig kontextprofil motiverar isolerad agent för att inte äta upp huvudkonversationens kontext.

### Moment 6: Royalty-avräkningar och ekonomi
- **Källa:** intervju
- **Frekvens:** kvartalsvis (4 gånger/år, intensivt)
- **Tidsåtgång:** ~1 vecka per kvartal (= ~5% årlig tidsinvestering men *mycket* komprimerad)
- **Smärta:** hög
- **Felbenägenhet:** medel (manuell Excel med olika villkor per författare = risk för fel)
- **Ägare:** ekonom (deltid)
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** Detta ser ut som ett AI-use-case men är det inte. Royalty-beräkningar är juridiskt bindande — varje nummer måste stämma exakt. Excel-format och "olika villkor per författare" betyder att en agent inte kan arbeta utan att ha programmatisk åtkomst till både försäljningsdata och avtalsvillkor. Utan systemintegration blir det teater. Långsiktigt: ett verkligt försäljningssystem (inte Excel) löser det här bättre än agent-assistans.

### Moment 7: Försäljningsdata-analys och konsolidering
- **Källa:** intervju
- **Frekvens:** månadsvis eller vid behov (oklar frekvens)
- **Tidsåtgång:** okänd
- **Smärta:** medel (de sa "vi har dålig koll")
- **Felbenägenhet:** okänd
- **Ägare:** oklar (troligen marknadsförare eller VD)
- **AI-lämplighet:** medel
- **Kontextprofil:** brett
- **Notering:** Data ligger splittrad över Adlibris, Bokus, egen WooCommerce-shop och direktförsäljning. En agent kan inte hämta data från dessa system utan API-integration. Men om data *exporteras* manuellt till CSV/Excel kan en agent konsolidera och analysera den, skapa rapporter och identifiera trender ("vilka böcker säljer bäst var"). Värde är medel tills systemintegration löses.

### Moment 8: Bokupplägg och formatering [implicit]
- **Källa:** implicit
- **Frekvens:** per bok (~1–2/månad)
- **Tidsåtgång:** ~5–10 timmar per bok
- **Smärta:** okänd
- **Felbenägenhet:** medel
- **Ägare:** formgivare (deltid)
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** Bokupplägg för tryck kräver layouterfarenhet och ögonmått. AI kan assistera med typsnittsrekommendationer eller sidbreddsberäkning men inte ersätta designern. Inte högprioritet.

### Moment 9: Inventeringshantering och lagerförvaltning [implicit]
- **Källa:** implicit
- **Frekvens:** enligt behov (mottagning av tryck, distribution)
- **Tidsåtgång:** okänd
- **Smärta:** okänd
- **Felbenägenhet:** låg
- **Ägare:** distribution/lager-person
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** Är förmodligen redan strukturerat. Ingen smärtsignal i intake. Låg prioritet.

### Moment 10: Order- och fakturahantering [implicit]
- **Källa:** implicit
- **Frekvens:** dagligen
- **Tidsåtgång:** ~10–15% av någons vecka
- **Smärta:** låg (ingår inte i de återkommande moment som tog tid)
- **Felbenägenhet:** låg
- **Ägare:** distribution/admin eller ekonom
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** E-handel via WooCommerce förmodligen redan automatiserad. Om inte — låg volym att automatisera. Inte prioritet.

## Kluster

### Kluster A: Manushantering — prioritet 1
- **Ingående moment:** Manusläsning och initialbedömning (moment 1), Redigering och författarkommunikation (moment 2), Korrekturläsning (moment 3)
- **Samlad AI-lämplighet:** låg-medel
- **Notering:** Dessa tre moment bildar redaktörens kärnarbete. AI kan hjälpa med två av tre: initialbedömning (förlånga manusfiltret) och korrekturläsning (första pass). Redigering måste redaktören göra själv. Tillsammans kan agenter spara 15–20% av redaktörens tid genom att ta de rutinmässiga delarna, men detta är inte ett slam dunk-fall för automatisering. Smärtan är hög men momentet är relationellt och kontextrikt.

### Kluster B: Marknadsföring och innehållsproduktion — prioritet 1
- **Ingående moment:** Skrivande av baksidetexter och marknadsformulering (moment 4), Sociala medie-inlägg och marknadsföring (moment 5)
- **Samlad AI-lämplighet:** hög
- **Notering:** Detta är det högsta värdeklustern. En agent kan generera baskopior för både baksidetext och sociala medie-inlägg per bok, spara marknadsföraren från att skriva från noll varje gång, och addera även redaktören genom att ge ett konsensus-förslag som båda kan revidera. Moment 5 är särskilt högt värde: 60% av en persons vecka på repetitiv textproduktion. Bullrig kontextprofil motiverar en isolerad agent.

### Kluster C: Ekonomi och administration — prioritet 2
- **Ingående moment:** Royalty-avräkningar och ekonomi (moment 6), Försäljningsdata-analys (moment 7)
- **Samlad AI-lämplighet:** medel (för moment 7 under kontrollerade villkor; låg för moment 6)
- **Notering:** Royalty-avräkningar är juridiskt bindande och lämpar sig inte för agent-assistans utan systemintegration. Försäljningsdata-analys däremot kan en agent göra om data exporteras manuellt — konsolidering, trendanalys, "vilka böcker säljer bäst per kanal" är textanalys. Tillsammans är värdet medel. Moment 6 borde inte bli en agent. Moment 7 kan — men enbart som rapportgenerator från exporterad data.

### Under ribban

- **Moment 8: Bokupplägg och formatering** — Formgivaren är deltid och intake signalerar ingen smärta här. Design är inte AI:s starkkort. Låg frekvens relativt till detaljkomplexitet. Inte agent-värt.

- **Moment 9: Inventeringshantering** — Ingen smärtsignal. Förmodligen redan automatiserad eller trivialt volym. Under ribban.

- **Moment 10: Order- och fakturahantering** — Låg smärta, låg volym (e-handeln förmodligen redan strukturerad). Under ribban.

- **Moment 2 (Redigering och författarkommunikation) som egen agent** — Relationellt, kräver redaktörens omdöme och författarförtroendet. Kan inte delegeras till agent. Måste redaktören göra. Notering: kan *assisteras* av agent i steg 4–5 (formulera mejlen) men inte ägas av agent.

## Nedbrytning av toppkluster

### Kluster B: Marknadsföring och innehållsproduktion

#### Moment 4: Skrivande av baksidetexter och marknadsformulering

Delsteg:
1. Läs manus och identifiera kärnbudskap, målgrupp, unik vinkel
2. Samla Livsverkets tidigare baksidetexter som stilreferenser
3. Skriv baksidetext-utkast (150–200 ord, Livsverkets ton)
4. Skriv pressmaterial-utkast (500 ord)
5. Skriv författarpresentation-utkast (100 ord)
6. Redaktör och marknadsförare läser och revidera gemensamt

→ AI-lämplighet per steg: Hög för 2–5. Steg 1 kräver manusläsning (agent kan). Steg 6 är rent mänsklig beslut.

→ Vad en agent konkret kan göra: Tar ett manus (Google Docs eller PDF), hämtar stilriktlinjer från tidigare böcker, genererar tre varianter av baksidetext + pressmaterial + författarpresentation. Presenterar alla tre för redaktör/marknadsförare att välja från och revidera. Sparar ~4–6 timmar per bok.

#### Moment 5: Sociala medie-inlägg och marknadsföring

Delsteg:
1. Planera kampanjkalendern för boken (vilka plattformar, när)
2. Samla boknökklar, målgrupp, hook
3. Skriv 5–10 Instagram-caption-varianter (olika längd, hook, CTA)
4. Generera hashtag-strategi och @-mentions
5. Skapa Mailchimp-kopior (nyhetsbrev-inlägg för boken)
6. Samla alla artefakter i ett dokument för marknadsföraren att välja från
7. Marknadsföraren publicerar via Instagram och Mailchimp

→ AI-lämplighet per steg: Hög för 3–6. Steg 1–2 är planering (agent kan assistera, människa bestämmer). Steg 7 är publicering (agent kan inte, kräver inloggning).

→ Vad en agent konkret kan göra: Tar bokparametrar (titel, tema, målgrupp, publikationsdatum), genererar 10 färdiga Instagram-captions, 20 hashtag-förslag, 1 Mailchimp-draft per bok per vecka under kampanjperioden. Marknadsföraren scrollar och väljer. Sparar ~10–15 timmar per bok-kampanj.

### Kluster A: Manushantering

#### Moment 1: Manusläsning och initialbedömning

Delsteg:
1. Manutet anländer per mail
2. Agent sammanfattar manus (500 ord): tema, målgrupp, unique selling point
3. Agent bedömer genre-passning mot Livsverkets katalog
4. Agent ger preliminär scoring: "Passa bra" / "Möjlig" / "Inte denna omgång" med motivering
5. Redaktören läser sammanfattningen och scoringen, bestämmer sig för att läsa fullt manus eller tacka nej

→ AI-lämplighet per steg: Medel för 2–4. Steg 1 är läsning (agent kan). Steg 2 är bedömning — här kommer problemet: utan kontext om Livsverkets tidigare succéer, målgrupp-profil och försäljningsdata är scoringen gissning. Agenten kan inte veta "det här är bra för oss".

→ Vad en agent konkret kan göra: Generera sammanfattning och genre-analys snabbt. Ge en helt preliminär "pass/möjlig/nej" som redaktören kan ignorera utan att det spelar roll. Värdet är lågt utan mer kontext från företaget.

#### Moment 3: Korrekturläsning

Delsteg:
1. Slutversions-manus anländer från redaktionen (Google Docs eller PDF)
2. Agent gör första-pass grammatik- och stavnings-granskning
3. Agent kontrollerar namn-konsistens (stavning av namn, titel-hantering)
4. Agent flaggar potentiella stiltöner-brister (om man kräver formell svenska, flagga slang osv)
5. Agent levererar rapport med flaggade problem
6. Redaktör granskar själv och gör slutkontroll före tryck

→ AI-lämplighet per steg: Hög för 2–4. Steg 1 och 6 är mänskliga. Steg 5 är bara rapportering.

→ Vad en agent konkret kan göra: Springer ett dokumentet igenom stavnings/grammatik/konsistens-checker, levererar en rapport. Minskar tid för mänsklig korrekturläsning från 4–5 timmar till 2–3 timmar per bok.

## Kontextfaktorer

1. **Utanförliggande författare:** Företaget arbetar med ett externt nätverk på ~30 författare, inte anställda. Detta betyder att all kommunikation måste gå via mejl och att feedback-loopar är långsammare än internt. Relevant för design av agent för författarkommunikation (kan inte ersätta redaktör för relation-building).

2. **Multikanal-försäljning:** Försäljning via fyra kanaler (Adlibris, Bokus, egen shop, direktförsäljning till bokhandlare) med data i fyra olika system. Systemintegration är långsiktig nödvändighet, men på kort sikt kan agenten enbart arbeta med *exporterad* data.

3. **Småskalig ekonomi:** Formgivare och ekonom är båda deltid, vilket indikerar att kostnadseffektivitet är kritisk. Denna faktor höjer värdet av att automera tidsslukande moment som sociala medie-texter (redan 60% av en persons tid).

4. **Redan etablerad teknik-stack:** Google Docs för manus, Gmail för Author-communication, Excel för ekonomi, Canva för enklare material, WordPress/WooCommerce egenväxat. Detta är inte en "vi använder inget"-situation. Agentintegrationen måste förhålla sig till dessa verktyg, särskilt Google Docs (manus) och Gmail (författarkommunikation).

5. **Växandeambition:** VD:n säger "vi vill ge ut fler böcker utan att anställa — kanske 15 per år istället för 10". Detta är ett 50% volymökning. Det kan inte ske genom att göra samma saker snabbare. Det kräver faktisk automatisering av de tidsslukande momenten (marknadsföring, manusflöde).

## Osäkerheter och motsägelser

1. **Korrekturläsnings-tid okänd.** Intake sa "tar för lång tid och vi missar ändå saker" men inte hur många timmar. Gissad bedömning på "4–5 timmar per bok" kan vara helt fel. Proposal-steget bör fråga.

2. **Försäljningsdata-analysen är svagt definierad.** De sa "vi har dålig koll på vilka böcker som säljer var" — men gör de någonsin systematisk rapportering, eller är det ad-hoc-frågor? Om ad-hoc är värdet lågt. Om systematisk kan en agent göra återkommande rapporter.

3. **Manusflödet är kaotiskt — men vad är problemet exakt?** Är det att de läser för mycket manus som de inte ska anta (då är bedömnings-filter värde), eller att goda manus glöms bort (då är tracking-system värde)? Intake tydliggör inte detta. Det påverkar hur en agent skulle hjälpa.

4. **Vem gör redigeringen?** Intake nämner "redaktör" men det kan vara en titel på samma person som är "förläggare/VD" eller en egen person. Oklar arbetsfördelning mellan VD och redaktör. Relevant för agent-design.

5. **Baksidetext/marknadsformulering-konflikten:** De sa "redaktören och marknadsföraren har alltid olika bild av vad boken handlar om". Är detta ett faktiskt motsägelse (de läser manus olika), eller är det ett kommunikationsproblem (de säger det inte högt)? Om det förra behövs ett riktigt köp-in från båda för en agent-utkast. Om det senare kan agenten faktiskt *lösa* det genom att presentera ett övertygande förslag från både perspektiv.
