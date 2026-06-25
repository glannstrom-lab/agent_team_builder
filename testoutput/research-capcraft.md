# Research: CapCraft

## Körningsmetadata
- **Antal identifierade moment:** 8
- **Över ribban:** 4  |  **Under ribban:** 2
- **Källa intervju:** 7  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 1 moment
- **Språk:** Svenska

## Sammanfattning

CapCraft är ett tvåpersonersföretag som säljer tryckta kepsar online genom Shopify plus sociala medier. En person hanterar allt digitalt (webshop, marknadsföring, kundservice), den andra design och produktion. Två klara flaskhalsar möter båda personerna: innehållsproduktion tar oproportionerligt mycket tid (textskrivning, bildtagning, sociala inlägg) och kundservice är ineffektiv utan system (mejl-baserad, 2–3 dagars svar). Tredje problemet är blindhet för vad som faktiskt säljer. Ett agent-team kan leverera mest värde på dessa två områden: automatisera innehållsproduktion (bilder och texter) och strukturera kunddata för insikt. Operativ orderhantering lämpar sig för AI men är redan tillräckligt liten för mikrostorlek.

## Identifierade arbetsmoment

### Moment 1: Skriva och publicera produkttexter
- **Källa:** intervju
- **Frekvens:** Veckovis (nya produkter regelbundet)
- **Tidsåtgång:** ~3–4 timmar per vecka
- **Smärta:** Hög (uttryckligt: "texterna blir likadana hela tiden, jag vet inte hur jag ska göra dem intressanta")
- **Felbenägenhet:** Låg (texterna är korrekta, bara enformiga)
- **Ägare:** Digital-personen
- **AI-lämplighet:** Hög
- **Kontextprofil:** Välavgränsat
- **Notering:** Användaren har redan Shopify-produkterna och upplagsbilder; en agent kan ta denna input och generera varierande, säljande texter. Output är markdown/html som personen kan review före publicering.

### Moment 2: Produktbildtagning och -redigering
- **Källa:** intervju
- **Frekvens:** Veckovis (nya produkter)
- **Tidsåtgång:** ~3–4 timmar per vecka
- **Smärta:** Hög (uttryckligt: "jag lägger typ halva veckan på att göra produktbilder och skriva texter — det är liksom aldrig klart")
- **Felbenägenhet:** Låg
- **Ägare:** Digital-personen (fotografering), Design-personen (grafik)
- **AI-lämplighet:** Låg
- **Kontextprofil:** Välavgränsat
- **Notering:** Claude kan inte fotografera eller generera fotorealistiska produktbilder. Kan potentiellt hjälpa med redigering av redan tagna bilder (bakgrund, ljus, färgtemperatur) men detta är mindre värdefullt än textgenerering. Hamnar under ribban i första hand.

### Moment 3: Skapa och schemalägga sociala medier (Instagram/TikTok)
- **Källa:** intervju
- **Frekvens:** 3–4 inlägg per vecka
- **Tidsåtgång:** ~4–5 timmar per vecka
- **Smärta:** Medel (uttryckligt: "Att komma på vad vi ska posta och sen göra det tar oväntat lång tid", plus osäkerhet om effekt)
- **Felbenägenhet:** Medel (visuellt innehål kan missa, timing kan vara dålig)
- **Ägare:** Digital-personen
- **AI-lämplighet:** Medel
- **Kontextprofil:** Brett
- **Notering:** En agent kan generera idéer för inlägg, skriva captions och föreslå timing baserat på Instagram-insikter. Själva den visuella kreationen (bildmontage, video) kräver separat arbete. AI kan integrera med Shopify-data för att lyfta aktuella produkter.

### Moment 4: Besvara kundfrågor och kundservice via mejl
- **Källa:** intervju
- **Frekvens:** Dagligen (cirka 1 timme varje morgon)
- **Tidsåtgång:** ~5 timmar per vecka
- **Smärta:** Hög (uttryckligt: "Jag hinner inte svara alla kunder samma dag, vissa väntar typ 2–3 dagar")
- **Felbenägenhet:** Låg (standard svar på standard frågor)
- **Ägare:** Digital-personen
- **AI-lämplighet:** Hög
- **Kontextprofil:** Välavgränsat
- **Notering:** De flesta kundmejl är repetitiva: "var är mitt paket", returfrågör, storleksfrågör. Agent kan klassificera inkommande mejl, föreslå svar, och eskalera de få som behöver personligt omdöme. Kräver Gmail-integration.

### Moment 5: Uppdatera webshop (produkter, priser, utgångna)
- **Källa:** intervju
- **Frekvens:** Månadsvis
- **Tidsåtgång:** ~1–2 timmar per månad
- **Smärta:** Låg
- **Felbenägenhet:** Medel (priser kan matas in fel, utgångna produkter glömmas)
- **Ägare:** Digital-personen
- **AI-lämplighet:** Låg
- **Kontextprofil:** Välavgränsat
- **Notering:** Kräver direkttillgång till Shopify-admin. Claude kan inte logga in eller manipulera system direkt. Kan förbereda en checklista eller en CSV med de nya produkterna, men själva update-steget måste personen göra. Lämpar sig dåligt för agent.

### Moment 6: Analysera försäljningsdata och produktprestanda
- **Källa:** intervju
- **Frekvens:** [implicit] Bör göras minst veckovis, men görs inte systematiskt idag
- **Tidsåtgång:** okänd (görs inte idag; potentiella 1–2 timmar per vecka)
- **Smärta:** Hög (uttryckligt: "Vi har ingen aning om vilka kepsar som säljer bäst eller varför — vi gissar bara")
- **Felbenägenhet:** Medel (lätt att missa trender eller missfortolka data)
- **Ägare:** Digital-personen (och idealt VD-nivå beslut tillsammans)
- **AI-lämplighet:** Hög
- **Kontextprofil:** Välavgränsat
- **Notering:** Shopify-data finns redan strukturerad. Agent kan pullas data varje vecka, identifiera trender (bästa produkter, kampanjer som konverterar, sesongsmönster), och presentera i ett dashboard eller rapport. Kräver Shopify API-åtkomst men är helt görbar.

### Moment 7: Leverantörkommunikation (tryckleverantör)
- **Källa:** intervjo
- **Frekvens:** [implicit] Varje gång en ny design ska tryckas (~1 gång per vecka)
- **Tidsåtgång:** ~1 timme per vecka
- **Smärta:** Okänd
- **Felbenägenhet:** Medel (beställningsdetaljer kan missas)
- **Ägare:** Design-personen (huvudsakligt), Digital-personen (för orderbekräftelser)
- **AI-lämplighet:** Låg
- **Kontextprofil:** Brett
- **Notering:** Hanteras via mejl idag. Det finns ingen angivet möjlighet för API. Agent kan spara tid på att formattera order-mejl och track bekräftelser, men den faktiska designöverläggningen och tryckspecifikationerna kräver expert-omdöme. Gränsen mellan vad agenten kan automatisera och vad som behöver mänsklig granskning är diffus.

### Moment 8: [implicit] Orderhantering och lagerstyrning
- **Källa:** implicit
- **Frekvens:** Dagligen
- **Tidsåtgång:** ~1–2 timmar per dag
- **Smärta:** Okänd
- **Felbenägenhet:** Medel
- **Ägare:** Förmodligen delat mellan digital-personen (Shopify) och design-personen (lagerstatus)
- **AI-lämplighet:** Medel
- **Kontextprofil:** Brett
- **Notering:** Inte explicit nämnd i intake men är implicit i "två personer driver allt" och försäljning via Shopify. Shopify-orders måste flagga produktion och lagernivåer. Kan hanteras delvis av agent (pull order, förbered produktions-checklist) men mycket av detta finns redan i Shopify-workflow.

## Kluster

### Kluster A: Innehållsproduktion  — prioritet 1
- **Ingående moment:** Produkttexter, Sociala medier, [och potentiellt bildbehandling]
- **Samlad AI-lämplighet:** Hög (för texter och idéer), Låg (för fotografering)
- **Notering:** Dessa tre moment tar tillsammans ~8–9 timmar per vecka från en person. Textskrivning och sociala medier lämpar sig väl för AI; bildtagning inte alls. En agent kan skapa en veckoplan för sociala medier, skriva produkttexter, och generera caption-idéer. Bilderna och design måste fortfarande göras manuellt.

### Kluster B: Kundservice & Kommunikation  — prioritet 2
- **Ingående moment:** Mejl-svar, Leverantörkommunikation
- **Samlad AI-lämplighet:** Hög (för mejl), Låg (för designspecifikationer)
- **Notering:** Mejl-svaren är repetitiva och tar 5h/vecka. En agent kan klassificera inkommande mejl, föreslå svar-mallar och eskalera. Leverantörkommunikationen är mer komplex och bör inte delegeras helt.

### Kluster C: Affärsinsikt & Data  — prioritet 3
- **Ingående moment:** Försäljningsanalys
- **Samlad AI-lämplighet:** Hög
- **Notering:** Just nu är detta ett "under-moment" — det görs inte alls. Men företaget flaggade detta explicit som ett smärtpunkt. En agent kan implementera detta närmast från ingenting: veckorapport på försäljningsdata, trendanalys, produktrekommendationer.

### Under ribban

**Produktbildtagning (Moment 2):** Kräver fotografi och redigering av fotorealistiska bilder. Claude kan inte fotografera och kan endast göra begränsad bildbehandling. Lämpar sig inte för agent i praktiken, även om det tar mycket tid.

**Webshop-uppdatering (Moment 5):** Är redan en liten månadlig uppgift (~1–2 timmar). Kräver direkttillgång till Shopify-admin som Claude inte kan få. Hamnar under tröskeln för agent-värde.

## Nedbrytning av toppkluster

### Kluster A: Innehållsproduktion

#### Moment: Skriva produkttexter

Delsteg:
1. Identifiera ny produkt (design-fil från design-personen, eller lista från planering)
2. Hämta produktspecifikation (storlek, material, färger, target-audience)
3. Söka precedent-texter för samma produkttyp för tonsmak
4. Skriva ny text med fokus på unikhet och säljargument
5. Lägg till SEO-nyckelord och formatera för Shopify
6. Publicera i webshop

→ AI-lämplighet per steg: Låg för 1–2 (kräver input från människor), Hög för 3–5 (textproduktion), Låg för 6 (kräver CMS-åtkomst)

→ Vad en agent konkret kan göra: Förlita sig på att personen matar in namn och specifikation på nya produkter. Agent skriver tre olika textvarianter (säljfokus, informativ, casual), vardera 150–200 ord, med inbyggd SEO. Personen väljer eller blandar, sedan kopierar till Shopify själv.

#### Moment: Skapa och schemalägga sociala medier

Delsteg:
1. Identifiera veckoplanering-instick (nya produkter, kampanjmål, datum)
2. Generera ideér för 3–4 inlägg (tema, format, CTA)
3. Skriva caption och hashtags för varje
4. Rekommendera tidpunkt baserat på audience-data
5. Förbereda en content calendar (text format)
6. Skapa visuellt innehål (ofta ett montage av redan tagna bilder)
7. Publicera på Instagram/TikTok

→ AI-lämplighet per steg: Hög för 1–5 (planering, texter, timing), Låg för 6 (design/redigering), Låg för 7 (kräver API-åtkomst eller manual publicering)

→ Vad en agent konkret kan göra: Generera en veckoplan med 4 post-idéer med captions och hashtags, tidpunkts-förslag, och kopplingar till aktuell inventering. Föreslå även om teman passar till kommande vecka. Personen förbereder bilderna, uploadar, och justerar timing vid behov.

### Kluster B: Kundservice & Kommunikation

#### Moment: Besvara kundfrågor via mejl

Delsteg:
1. Läsa inkommande mejl från Gmail
2. Klassificera mejlet (orderbekräftelse, returfrågör, storleksfrågör, komplaint, etc.)
3. För vanliga typer: generera svarsmall baserat på FAQ
4. För ovanliga: flagga för mänsklig läsning
5. Skicka svar
6. Uppdatera ärendehistorik

→ AI-lämplighet per steg: Hög för 1–3, Låg för 5–6 (kräver Gmail-API och mänsklig verifik före sändning)

→ Vad en agent konkret kan göra: Läsa inkommande mejl, klassificera, och för de 80 % vanligaste fallen (returnering, orderbekräftelse, leveransfrågor, storleksbyte) föreslå ett utkastsvar som personen granskar och skickar. Automatisera inte själva sändningen; låt personen ha kontroll.

#### Moment: Leverantörkommunikation

Delsteg:
1. Design-person färdigställer ny design
2. Konvertera specifikation (färg, tryckposition, mängd) till order-format
3. Mailar leverantören med detaljer
4. Väntar på bekräftelse
5. Track produktion
6. Motta godkänd preview före tryckning

→ AI-lämplighet per steg: Låg för 1–3 (kräver expertbedömning av tryckspecifikationer), Låg för 4–6 (väntan och granskning)

→ Vad en agent konkret kan göra: Mycket begränsat utan att skada kvaliteten. Kan förbereda en order-checklista baserat på tidigare beställningar, men själva specifikationen måste design-personen godkänna. **Hamnar under ribban.**

### Kluster C: Affärsinsikt & Data

#### Moment: Analysera försäljningsdata

Delsteg:
1. Hämta rapporter från Shopify (antal sålda per produkt, intäkt, konverteringsgrad)
2. Jämför vecka mot vecka (trend)
3. Identifiera bästa- och sämst-presterande produkter
4. Analysera vilka kampanjer/kanaler som driver försäljning
5. Notera sesongsmönster
6. Generera rekommendationer för nästa vecka (vilka produkter att fokusera på, vilka kanaler att invest mer i)

→ AI-lämplighet per steg: Hög för 1–6 (databearbetning, trendanalys, rekommendationer)

→ Vad en agent konkret kan göra: Veckovis rapport (auto-pull från Shopify API eller CSV-export): vilka produkter såldes, vilka kanaler (webshop vs. Instagram vs. annat) driven försäljning, vad är trenderna jämfört med förra veckan, och rekommendation om vad som bör prioriteras. Personerna använder detta för att fatta beslut nästa vecka.

## Kontextfaktorer

1. **Mikroföretag, två personer, redan distribuerade över två roller.** Om en agent ska implementeras måste det inte förstärka redan overloaded-personen utan snarare ge båda personen luft.

2. **Teknologistacken är enkelt och redan etablerat:** Shopify, Gmail, Canva, Instagram, TikTok. Inget eget system. Detta gör att agent-integrationer kan byggas på API (Shopify, Gmail) eller manuell CSV-export.

3. **Ingen formell ärendesystem eller CRM.** Kunddata ligger i mejl och Shopify. En agent kan börja strukturera detta via veckovisa rapporter men kan inte skapa ett helt nytt system åt dem.

4. **Design-personen är inte nämnd som involverad i det digitala.** Risk för silos: digital-personen kan känna att hen inte kan delegera bildtagning till en agent för att design-personen redan är understaffad.

5. **Ambition är begränsad och realistisk:** "Hantera fler produktlanseringar" och "förstå vad som säljer". Inte "bli en miljardföretag". Detta betyder att ett agent-team på 2–3 agenter sannolikt räcker.

## Osäkerheter och motsägelser

1. **Tidsåtgång för bildtagning är diffus.** Intake säger "halva veckan" (dvs 20h) men också "3–4 timmar på texter". Om det är totalt 40 timmar/vecka är bildtagning 20h, om det är totalt 30h är det proportionen olika. Behöver förtydligande.

2. **Ingen data på vad "Instagram-innehål ger något" betyder för dem.** De säger de inte vet om Instagram driver försäljning. Kan vara att det är värdelöst för dem, eller att de bara saknar insikt. En agent för försäljningsanalys skulle svara detta snabbt.

3. **Leverantörkommunikation är opreciserad.** Är det e-postbaserat, eller använder de ett plattform? Hur ofta sker det? Är specifikationen redan dokumenterad eller måste den manuellt sammanställas varje gång?

4. **Ingen nämning av tidsbudget eller faktisk veckoarbete.** Hur många timmar per vecka arbetar de tillsammans? Om de jobbar 50h/vecka tillsammans och 8–9h går till textarbete och sociala medier, så är det 16–18 procent. Men vi vet inte baslinen.

5. **Design-personen och Digital-personen — är det två helt skilda personer eller kan de ta över varandra?** Intake nämner en person för design/produktion och en för webshop/mark. Men det finns implicit-moment (Moment 8: orderhantering) där det är oklart.
