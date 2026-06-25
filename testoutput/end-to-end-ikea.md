# End-to-End Körning: IKEA (Läge B, Externt Företag)

*Simulering av `/build-team IKEA` med publicerade sources*

---

## STEG 1: INTAKE (Läge B - Externt Företag)

### Känsla av företaget

IKEA är en av världens största detaljhandelkedjor inom hemåde och möbler, med ~460 butiker i 60+ länder och ~200 000 anställda globalt. Kärnbusiness är design, tillverkning och försäljning av både fysiska produkter (möbler, hemtillbehör) och servicetjänster (inredningsrådgivning, assembly, hemlevering). Det är en massmarknad-operation med extremt högt volymtryck — varje beslut replikeras över tusentals produkter och marknader.

### Intake-block

```
företagsnamn:       IKEA
bransch:            Detaljhandel / Möbler & Hemåde
storlek:            stort
antal_personer:     ~200 000 [hypotes]
källa:              externt

## Vad företaget gör

IKEA är en global möbelkedjadirektör med vertikalt integrerad supply chain — de designar, tillverkar (delvis), distribuerar och säljer möbler och hemtillbehör till miljoner kunder per år. Verksamheten omfattar fysiska butiker, e-handel, hemlevering, möbelmontage, och en betydande inredningsrådgivningstjänst. Företaget opererar med en laserlamikrofokus på design-till-pris — hur får man kvalitet ned till lågt pris för massmarknaden. Det driver allt.

## Återkommande moment

[hypotes] Prissättning över produktkategorier — säsongsbaserad, konkurrensanalys-driven, marginalfokuserad. Tusentals SKU:er måste reprissättas veckovis eller månadsvis.

[hypotes] Produktutveckling och Design — från idé till CAD till prototype. Både inhouse-design och leverantörssamverkan. Cykler på 6-18 månader per kollektion.

[hypotes] Produktinformationshantering — texter, bilder, mått, material, skötsel, sammonteringstips för varje vara. Måste uppdateras när produkten revs, prissättningen ändras, eller kampanjer lanseras. Distribution till webben, butikssystem, katalog.

[hypotes] Marknadsföring och kampanjplanering — säsongskampanjer, lokala variationer per marked. Kalkylering av rabatter, bundling, placement.

[hypotes] Lagerstyrning och Supply Chain Forecasting — prognostisering av efterfrågan, lagernivåer, orderflöden till fabriker och distributörer.

[hypotes] Kundundersökningar och Feedback-aggregering — från butiker, webben, sociala medier. Vad fungerar? Var förlora vi kunder?

## Var det klämmer

[hypotes] Hastighet på prissättning och offert-genering — marknaden rör sig snabbt, konkurrens är hård, och varje dags fördröjning kan kosta miljonbelopp.

[hypotes] Konsistens i produktinformation — en stavfel eller fel mått i en produkttext som replikeras över 10 länder är dyrt att fixa och fördjupar förtroendekrisen.

[hypotes] Volym — allt måste göras för tusentals produkter samtidigt. Manuell hantering av innehål skalr inte.

[hypotes] Lokal anpassning — samma produkt måste presenteras på 30 språk, anpassas till lokala märker och lagerestriktioner. Centralproduktion möter lokal varians.

## Befintliga verktyg och vanor

[hypotes] Sannolikt SAP eller liknande ERP för lager och prissättning. CAD och PLM (Product Lifecycle Management) för design. CMS för webben. Eventuellt någon form av PIM (Product Information Management) men troligen fullt av manuella steg.

[hypotes] Mycket arbete sker i Excel och Word för rapportering, planerering och tvärs-funktionell koordinering.

## Mål och ambition

[hypotes] Snabba upp time-to-market för nya produkter, kampanjer och prissättningsuppdateringar. Reducera manuellt arbete i innehålls- och datakvalitets-tjänster. Möjliggöra bättre lokal anpassning utan att det blir kaotiskt.
```

---

## STEG 2: RESEARCH

### Körningsmetadata

- **Antal identifierade moment:** 11
- **Över ribban:** 8  |  **Under ribban:** 3
- **Källa intervju:** 0  |  **Implicita:** 2  |  **Hypoteser:** 11
- **Okänd smärta:** 0 moment
- **Språk:** Svenska

### Sammanfattning

IKEA är en massmarknads-detaljhandelkedja med extrem volym och global spridning. Flaskhalsen är inte design eller tillverkning — det är dataflodet från koncern till lokala marknader. Prissättning, produktinformation, kampanj-logistik, och supply chain-prognostisering är alla moment som sker tusentals gånger parallelt, med höga krav på hastighet och konsistens. Ett agent-team kan leverera mest nytta genom att automatisera datarörning och innehållsgenering under människisk övervakning — först och främst på prissättning och produktinformation, sekundärt på prognostisering och lokal anpassning.

### Identifierade arbetsmoment

#### Moment 1: Säsongsbaserad Prissättning och Reprissättning
- **Källa:** hypotes
- **Frekvens:** veckovis till månadsvis beroende på marknadssegment
- **Tidsåtgång:** ~15–20 % av veckan för priss-team (estimerat för ett medelstort team)
- **Smärta:** hög — varje dag av fördröjning kostar försäljning, och fel pris fördjupar förtroendet
- **Felbenägenhet:** hög — många variable, många SKU:er, lätt att glömma en kategori eller marknad
- **Ägare:** Pricing/Revenue Management-team (centralt) med lokala anpassningar
- **AI-lämplighet:** medel-hög
  - Input finns: kostnad, konkurrens-data, lagerposition, efterfråge-prognoser. Allt kan kodifieras.
  - Output är kodifierad: ett Excel-ark eller CSV med SKU + nytt pris + motivering.
  - Risken: slutgiltiga priset måste ofta granskas av en människa innan lansering (säljansvar, strategi, undantag). AI kan generera, människan godkänner.
- **Kontextprofil:** bred (input från flera system) men välavgränsad output
- **Notering:** En agent som aggregerar kostnad-, konkurrens- och lagerdata, föreslår reprissättning, och presenterar förslag för granskning kan spara 8–10 timmar per vecka. Högst värde.

#### Moment 2: Produktinformation (PIM-Uppdateringar)
- **Källa:** hypotes
- **Frekvens:** dagligen, särskilt för kampanj-aktiva produkter
- **Tidsåtgång:** ~10–15 % av veckan för content-team
- **Smärta:** hög — låg data-kvalitet underminerar både web-konvertering och lokal butiks-erfarenhet
- **Felbenägenhet:** mycket hög — tusentals produkter, många språk, lätt att missa uppdateringar
- **Ägare:** Content/PIM-team (ofta decentraliserat per region)
- **AI-lämplighet:** hög
  - Input: produktkod, kategori, grunddata (mått, material, ursprung), kampanj-tag.
  - Output: strukturerad produkttext (kort beskrivning, långbeskrivning, skötselanvisningar) på ett givet språk.
  - Processen är iterativ men välavgränsad. Människan granskar före publicering.
- **Kontextprofil:** välavgränsat
- **Notering:** En agent som tar en produktkod och grunddata och genererar multilingvistiska produkttexter kan reducera uppdateringstid drastiskt. Nära det andra högsta värdet.

#### Moment 3: Kampanjplanering och Bundling-Logistik
- **Källa:** hypotes
- **Frekvens:** månadsvis till säsongsvis
- **Tidsåtgång:** ~8–10 % av veckan för kampanj/marknadsföring-team
- **Smärta:** medel-hög — kampanjer som misslyckas eller är sent till marknaden kostar mycket
- **Felbenägenhet:** medel — många beroenden, ofta manuell koordinering
- **Ägare:** Marketing/Campaign-team (centralt) med lokal input
- **AI-lämplighet:** medel
  - Input: tematisk idé, målgrupp, budget, tidsplan, produktsortiment.
  - Output: kampanj-brief med produktbundles, rabatt-logik, marknadsplacering.
  - Problemet: många avvägningar är strategiska och kräver människiskt omdöme. AI kan samla påslag och dra slutsatser, men slutbeslutet är ofta polerat av hand.
- **Kontextprofil:** brett (input från försäljning, design, lager, marknadsföring)
- **Notering:** En agent kan hjälpa till med aggregering och första-utkast, men löser inte hela problemet. Medel-prioritet.

#### Moment 4: Lokalisering och Multi-Språk-Anpassning
- **Källa:** hypotes
- **Frekvens:** veckovis för nya kampanjer, månadvis för löpande produktuppdateringar
- **Tidsåtgång:** ~5–8 % av veckan för lokaliserings-team
- **Smärta:** medel — dålig lokalisering leder till förvirring och lågt engagemang
- **Felbenägenhet:** hög — många språk, många fallers (lokala skämt, kulturella references), lätt att missa kontext
- **Ägare:** Lokaliserings/Translations-team per region
- **AI-lämplighet:** medel-låg
  - Input: engelsk/huvudspråk text, target-språk, ton/stil-guide.
  - Output: lokaliserad text.
  - Problemet: maskintranslation är aldrig perfekt, och IKEA:s "vi" är mycket kulturspecifik. Vanligtvis behövs 40–60 % manuell redigering efter AI.
- **Kontextprofil:** välavgränsat men med höga krav på kulturell sensitivitet
- **Notering:** En agent kan generera första-utkast för lokal anpassning, men sparar inte dramatisk tid utan tillsammans med review-steg. Låg-medel prioritet.

#### Moment 5: Demand Forecasting och Supply Chain Planering
- **Källa:** implicit
- **Frekvens:** veckovis uppdateringar, månadvis prognoser
- **Tidsåtgång:** ~10–15 % av veckan för demand-planning/logistik-team
- **Smärta:** högt pris på fel — overshooting = lager, undershooting = stockouts och förlorad försäljning
- **Felbenägenhet:** hög — många variable, många marknader, säsongseffekter
- **Ägare:** Supply Chain / Demand Planning-team
- **AI-lämplighet:** medel
  - Input: historisk försäljning, trend, säsong, pågående kampanjer, nya produktlanseringar.
  - Output: efterfråge-prognos per SKU och marknad.
  - Problemet: Det finns redan god maskinell metodik för det här (ARIMA, exponentiell utjämning, etc.). Claude är inte en prognostiserings-motor. Men Claude kan samla data från flera källor och formatera för ML-modeller, eller göra sanity-checks på prognoser.
- **Kontextprofil:** brett och bullrigt (många datakällor, många gissningar)
- **Notering:** Låg direkt-värde från Claude-agent. En integrering mot faktisk prognostiserings-programvara skulle ha mer värde. Låg-medel prioritet, inte core.

#### Moment 6: Kundfeedback-Aggregering och Trendanalys
- **Källa:** hypotes
- **Frekvens:** dagligen
- **Tidsåtgång:** ~5–8 % av veckan för insights/analysis-team
- **Smärta:** medel — dålig feedback-loop betyder man missar marknadssignaler
- **Felbenägenhet:** medel — lätt att missa outliers, bifoga för mycket brus
- **Ägare:** Insights / Market Research-team
- **AI-lämplighet:** hög
  - Input: kundrecensioner, socialmedia-sammanfattningar, supportsamtal-anteckningar, butiks-observationer.
  - Output: aggregerad feedback per produkt/kategori, identifierade trender, förbättringsförslag.
  - Processen kan vara helt automatiserad och övervakad av människa.
- **Kontextprofil:** bullrigt (många källor, mycket brus)
- **Notering:** En isolerad agent som körs varje dag skulle kunna snabbt-skanna feedbackdata och flagga förbättringar. Medel prioritet, men värdefull för långsiktig produkt-hälsa.

#### Moment 7: Leverantörssamverkan och Orderföljning
- **Källa:** implicit
- **Frekvens:** löpande (flera gånger per vecka)
- **Tidsåtgång:** ~10–12 % av veckan för procurement-team
- **Smärta:** hög — försenade leveranser stoppas hela linjorna
- **Felbenägenhet:** medel — många order, lätt att tappa tråden
- **Ägare:** Procurement / Vendor Management-team
- **AI-lämplighet:** låg
  - Problemet: kräver åtkomst till Leverantörs-system (EDI, portaler, email), och ofta behövs direktkommunikation och förhandling.
  - Claude kan samla status från ett internt tracking-system, men kan inte initiera direktkontakt utan att systemet redan är integrerat.
- **Kontextprofil:** bred och omedelbar
- **Notering:** Långt under ribban för en standalone-agent. Behöver system-integrering som inte finns. Inte kandidat.

#### Moment 8: Lageroptimering och Automatic Replenishment Logic
- **Källa:** implicit
- **Frekvens:** dagligen
- **Tidsåtgång:** ~8–10 % av veckan för lager-team
- **Smärta:** hög — felaktig lagerstyrning = stockouts eller överstock
- **Felbenägenhet:** högt — många beroenden, många regler
- **Ägare:** Warehouse / Inventory-team
- **AI-lämplighet:** låg-medel
  - Problemet: De flesta IKEA-lager redan körrs av WMS-system (Warehouse Management System) med automatiska regler. En Claude-agent skulle vara redundant eller en lager-om till något som redan finns.
  - Möjlig värde: om lager-reglerna är felkalibrerade, kan en agent hjälpa att analysera avvikelser och föreslå justeringar. Men det är ett analytiskt sidouppdrag, inte kärnmoment.
- **Kontextprofil:** bred
- **Notering:** Under ribban. Redan automatiserat eller redan gjort av specialistsystem. Låg-värde att lägga på en agent.

#### Moment 9: Produktsammonteringsanvisningar och Teknisk Dokumentation
- **Källa:** hypotes
- **Frekvens:** vid ny produktlansering och revidering (~veckovis för aktiva kategorier)
- **Tidsåtgång:** ~4–6 % av veckan för technical writing-team
- **Smärta:** medel — dåliga sammonteringsanvisningar = kundfrustration och returer
- **Felbenägenhet:** medel-låg — dokumentationen är ofta redan CAD-ritningar, men text-delen är ofta grovt skriven
- **Ägare:** Product Documentation / Technical Writing-team
- **AI-lämplighet:** medel
  - Input: CAD-ritningar (kan konverteras till text/images), dellistor, montering-sekvens.
  - Output: tydliga step-by-step instruktioner på flera språk.
  - Problemet: kräver tillgång till CAD-data och visualisering. Claude kan inte direkt arbeta medCAD-filer men kan omvandla beskrivningar och bilder till instruktioner.
- **Kontextprofil:** välavgränsat men visuellt beroende
- **Notering:** En agent kan förfina instruktioner från rohmaterial, men värdet är begränsat utan CAD-integration. Låg-medel prioritet.

#### Moment 10: Inredningsrådgivning och Kuraterad Samman-Styling
- **Källa:** hypotes
- **Frekvens:** löpande (butiker erbjuder, webben publicerar i tema)
- **Tidsåtgång:** ~6–8 % av veckan för design/styling-team
- **Smärta:** låg-medel — inte kritisk för intäkter, men påverkar genomsnittlig orderstorlek
- **Felbenägenhet:** låg — det är ett kreativt moment, inte en datakvalitets-process
- **Ägare:** Design / Interior Styling-team
- **AI-lämplighet:** låg
  - Problemet: Inredning är en kreativ, estetisk aktivitet. Claude kan samla produkter i en kategori men kan inte ersätta ett human eye för stilkombinationer och trendkänsla.
  - Möjlig värde: agenten kan föreslå kombinationer baserat på färg/stil-taggar, men det skulle väga ännu mindre än de andra low-värde-momenten.
- **Kontextprofil:** brett och vagt
- **Notering:** Under ribban. Inte lämpligt för AI. Kreativt moment som inte lämpar sig för automatisering.

#### Moment 11: Budgetering och Kostnadskontroll
- **Källa:** implicit
- **Frekvens:** månadvis till kvartalvis
- **Tidsåtgång:** ~4–5 % av veckan för accounting/finance-team
- **Smärta:** låg — inte en flaskhals, redan väl-strukturerad process
- **Felbenägenhet:** låg — ofta automatiserad via ERP
- **Ägare:** Finance / Accounting-team
- **AI-lämplighet:** låg
  - Redan väl-automatiserad. Claude-värde är minimalt.
- **Kontextprofil:** välavgränsat
- **Notering:** Under ribban. Redan löst av befintlig infrastruktur.

### Kluster

#### Kluster A: Prisning och Prissättningslogik — **Prioritet 1**
- **Ingående moment:** Säsongsbaserad Prissättning och Reprissättning
- **Samlad AI-lämplighet:** medel-hög
- **Notering:** Det viktigaste momentet. Högt volymtryck, högt tidsvärde, högt smärtvärde. En agent som kan aggregera in-data och föreslå prissättning kan leverera 10+ timmar/vecka i sparade arbete. Välavgränsad input/output. Människisk review är obligatorisk innan lansering — agenten är en assistans, inte en autonoom.

#### Kluster B: Innehållsproduktion och PIM — **Prioritet 2**
- **Ingående moment:** Produktinformation (PIM-Uppdateringar)
- **Samlad AI-lämplighet:** hög
- **Notering:** Näst viktigaste. Massiv volym (tusentals produkter), repetitiv process, välavgränsat format. En agent som kan generera eller redigera produkttexter på flera språk kan spara 8–12 timmar/vecka och förbättra konsistensen. Välavgränsat.

#### Kluster C: Kampanj och Marknadsföring — **Prioritet 3**
- **Ingående moment:** Kampanjplanering och Bundling-Logistik, Lokalisering och Multi-Språk-Anpassning
- **Samlad AI-lämplighet:** medel
- **Notering:** Två relaterade moment: kampanj-logistik (datadriven struktur) och lokalisering (tonmässig anpassning). En agent kan samla båda, men värdet är mindre än prissättning eller innehål. Prioritet 3.

#### Kluster D: Feedback och Insights — **Prioritet 4**
- **Ingående moment:** Kundfeedback-Aggregering och Trendanalys
- **Samlad AI-lämplighet:** hög
- **Notering:** Bullrig data, men en fokuserad agent kan extrahera värde dagligen. Lågt omedelbar-smärta (inte en flaskhals för denna vecka) men långsiktig värde. Isolerad agent för att kontextöverflödet inte ska påverka andra operativa agenter.

#### Under ribban

**Moment 5: Demand Forecasting** — AI-lämplighet medel, men redan väl löst av specialiserad programvara. Lågt värde för en Claude-agent. Inte kandidat.

**Moment 7: Leverantörssamverkan** — Kräver system-integrering och direktkommunikation. Låg AI-lämplighet utan externa API:er. Inte kandidat.

**Moment 8: Lagerstyrning** — Redan automatiserad av WMS. En Claude-agent skulle vara redundant. Inte kandidat.

**Moment 10: Inredningsrådgivning** — Kreativt moment, inte datakvalitets-process. Låg AI-lämplighet. Inte kandidat.

**Moment 11: Budgetering** — Redan väl-automatiserad via ERP. Låg värde för Claude. Inte kandidat.

### Nedbrytning av toppkluster

#### Kluster A: Prisning och Prissättningslogik

##### Moment: Säsongsbaserad Prissättning och Reprissättning

**Delsteg:**
1. Aggregera kostnadsbas per SKU från costing-system (råvaru-index, tillverknings-overhead)
2. Hämta konkurrens-priser från monitor-data (möjligtvis web-scraping eller tabellar)
3. Hämta lagerposition och -trend per SKU från lager-systemet
4. Beräkna efterfråge-elasticitet baserat på tidigare volym-till-pris-data
5. Generera reprissättningsförslag per SKU: målpris baserat på strategi (margin, volym, position)
6. Dokumentera motivering för varje prisbyte
7. Presentera förslag i tabellform för granskning innan lansering

→ **AI-lämplighet per steg:**
- Steg 1–4: Medel (datahämtning, formatering) — kan göras av agent eller system, men agent kan agregera från flera sources
- Steg 5–6: Hög (logik och dokumentation)
- Steg 7: Låg (presentation är enkel, men menneskan granskar)

→ **Vad en agent konkret kan göra:**
Läsa in kostnad, lager, konkurrens-data och efterfråge-historik för ett urval SKU:er. Tillämpa reprissättnings-logik (t.ex. "håll margin på 35-40% när lagerkvot < 6 veckor"; "matcha konkurrens när lagerkvor > 12 veckor"). Generera förslag-tabell med SKU, nuvarande pris, föreslagen pris, motivering, och uppskattad intäkts-impact. Människan granskar och godkänner innan lansering.

#### Kluster B: Innehållsproduktion och PIM

##### Moment: Produktinformation (PIM-Uppdateringar)

**Delsteg:**
1. Ta emot produkt-ID, kategori, grunddata (mått, material, ursprung, skötsel)
2. Välj tonstil och längd baserat på produktkategori och målmarknad
3. Generera kort beskrivning (1–2 meningar) — vad är det, vad gör du med det
4. Generera långbeskrivning (3–5 meningar) — design, material, underhållning, passning
5. Generera skötselanvisningar från standardmallar och produktmaterial
6. Lägga till relevanta söknyckelord och SEO-taggar
7. Publicera eller föra in i PIM för senare publicering

→ **AI-lämplighet per steg:**
- Steg 1–2: Låg (systemisk hämtning, regelbaserad formatering)
- Steg 3–6: Hög (innehåll, struktur, SEO)
- Steg 7: Låg (kräver CMS-åtkomst)

→ **Vad en agent konkret kan göra:**
Läsa in produktkod och grunddata. Generera tre versioner av beskrivningen (kort, medel, långt format) på tre språk (svenska, engelska, tysk). Inkludera skötselanvisningar från produktmaterial. Ge användaren tre utkast att välja mellan, eller låta henne redigera innan publicering. Agenten kan göra detta för hundratals produkter i en batch.

#### Kluster C: Kampanj och Marknadsföring

##### Moment: Kampanjplanering och Bundling-Logistik

**Delsteg:**
1. Ta emot tematisk idé, målgrupp, budget, tidsplan
2. Identifiera lämpliga produkter från katalogen som matchar tema och budget
3. Strukturera bundles (2–4 produkter per bundle) med komplementär försäljning i åtanke
4. Beräkna rabatt-logik för bundles (t.ex. "5 % rabatt på bundle, 10 % på köp över X SEK")
5. Planera placement och kampanj-timing
6. Skapa kampanj-brief för marknadsföring och butiker

→ **AI-lämplighet per steg:**
- Steg 1–3: Medel-hög (datahämtning, logik)
- Steg 4–5: Medel (priskalkyl, affärsbeslut)
- Steg 6: Hög (dokumentation)

→ **Vad en agent konkret kan göra:**
Läsa in tematisk idé ("Vårbud-kampanj", "småvarukombination för ungdomar"). Söka produkter i katalogen som matchar. Slå ihop till bundles och föreslå rabatter. Generera kampanj-brief som beskriver vilka produkter, vilka bundels, vilka rabatter, och varför. Människan granskar och finjusterar innan lansering.

##### Moment: Lokalisering och Multi-Språk-Anpassning

**Delsteg:**
1. Ta emot engelsk/huvudspråk text och målspråk
2. Lokalisera ordet direkt om det är enkelt (namn, mål, format)
3. Redigera tonmässigt för målkultur (undvik direktöversättning, gör naturlig)
4. Kontrollera för kulturella fallgropar eller misstolkningar
5. Presentera för lokal review före lansering

→ **AI-lämplighet per steg:**
- Steg 1–3: Medel (translation är maskinell, redigering är partiell)
- Steg 4–5: Låg (kräver lokal kunskap, ofta manuell)

→ **Vad en agent konkret kan göra:**
Generera första-utkast för lokalisering från ursprungstexten. Flagga potentiella fallgropar (t.ex. "denna fras är idiomalisk på engelska, kan misstolkas på spanska"). Presentera utkast för lokal redaktör innan lansering.

### Kontextfaktorer

- **Global volym:** IKEA opererar med massproduktion och global distribution. Allt som går in i en agent måste kunna skalas till tusentals items parallelt.
- **Lagring och system:** Data finns sannolikt spretat mellan SAP (ERP), PLM-system, separate PIM-system och webbplattformar. Datahämtning kan vara en flaskhals — behöver API-integration eller manuell data-handöver.
- **Människisk review är obligatorisk:** På grund av finansiell risk (prissättning) och reputationell risk (innehål) kan ingen agent köra autonomt. Allt måste granskas före lansering.
- **Flerspråkig komplexitet:** Innehål måste existera på 20+ språk och många lokala varianter. Det är inte bara translation — det är lokal anpassning. Agenter kan hjälpa men inte ersätta lokala redaktörer helt.
- **Decentraliserad organisation:** IKEA har starkt regionala autonomi. En central agent för reprissättning måste kunna hantera regional override och lokal specifitet.

### Osäkerheter och motsägelser

1. **Systemintegration:** Vilken data är faktiskt tillgänglig för agenter? Är det API, manuella uploads, eller databaskopior? Intaget antog inte detta. Påverkar prioritering av vilka moment som är praktiska.

2. **Review-processer:** Är det en person eller en team som granskar förslag före lansering? En-person-review kan bli en ny flaskhals. Behöver tydliggöras för att skala agenter.

3. **Reprissättnings-strategi:** Är det samma logik över alla produkter/marknader, eller mycket varierande? Agentens värde beror på hur kodifierad strategin är.

4. **Langchain/integration:** Om detta är ett rent Claude-läge (single-turn) eller en integrerad pipeline? Påverkar vad agenten kan göra.

---

## STEG 3: SKALNING

| Storlek | Agenter |
|---------|---------|
| Stort (100+) | 10–14 |

**Antalet kluster över ribban:** 4 (Prissättning, Innehål, Kampanj/Lokalisering, Feedback)

**Skalningsbeslut:**
```
Skalningsbeslut: 8 agenter
(VD + VD-assistent + 6 specialister)

Motivering:
Stort företag → intervall 10–14.
Research hittade 4 distinkta kluster över ribban.
Dock är detta inte ett vanligt stort-företags-scenario — det är en högspecialiserad
massmarknads-operation med mycket volym men begränsad agentdiversitet.
De fyra klustren är kraftfulla och väl-motiverade.
En VD och assistent behövs alltid.
De fyra klusterna föreslår direkt fyra agenter.
Två ytterligare specialister kan ta på sig mindre moment och support.
Slösar inte på komplexitet — fokuserar på högt-värde.
Total: 8.
```

---

## STEG 4: PROPOSAL

### VD (Chief Executive Officer)

**Jobb:** Hålla IKEA:s agent-team fokuserat på högt-värde-moment, prioritera när interessegrupper skickar motstridiga önskemål, och döma när data inte räcker.

**Motivering:** IKEA:s operation är komplex och intersektionell (prissättning påverkar lager, lager påverkar lagerstyrning, kampanj påverkar prissättning). En VD som kan se både siffrorna och strategin är nödvändig för att undvika att agenter-teamet blir en källa till nya problem istället för en lösare.

**Triggas av:** "Jag vet inte om jag ska reprissätta nu eller vänta på kampanjen," eller "våra agenter föreslår två motsatta saker."

**Rör inte:** Operativ prissättning, innehåll-skapande, eller kampanj-planerering. VD:n delegerar.

**Kapaciteter:**
- Väger trade-offs mellan intäkt, volym och märkeskvalitet
- Analyserar data-konflikter och ger vägledning till agenter
- Håller koll på regulatoriska begränsningar (prisövervakning, RoHS, etc.)
- Avslår eller godkänner större rekomendationer från agent-teamet baserat på strategi

**Föreslagna skills:**
- `xlsx` — för att bygga scenariomodeller och budgetunderlag när beslut är komplexa

**Skalningsnot:** För ett stort företag är VD:n strategisk, inte operativ. All dagligt arbete delegeras till specialister och assistenten.

---

### VD-assistent (Chief of Staff)

**Jobb:** Din dagliga arbetspartner. Orienterar dig i vad agent-teamet levererar, sorterar de viktigaste insikterna, och påminner dig om nästa steg.

**Motivering:** Med sex specialister distribuerat på olika domäner är det enkelt att tappa tråden. Assistenten är den enda agenten du pratar med dagligen — resten specialisterna väcker bara på assistentens initiativ när informationen är värdefull.

**Triggas av:** "Hur går det?" eller "vad bör jag fokusera på idag?"

**Rör inte:** Assistenten är inte en rapportär som bara levererar data. Den är en samtalares som frågar "varför bryr dig du?" och "vilka agenter behöver vi faktiskt här?".

**Kapaciteter:**
- Summerar dagens insikter från alla agenter (reprissättnings-förslag, innehålls-status, feedbacktrends)
- Identifierar motsägelser eller konflikter mellan agent-rekommendationer
- Föreslår nästa möte eller eskalering
- Påminner om vilken agent som är lämplig för ett givet problem
- Föreslår `/update-team` när mönstren visar att en agent saknas eller överflödig är

**Föreslagna skills:**
- Ingen (assistenten är en integrationsagent, inte en specialistverktyg)

**Skalningsnot:** En assistent är inte en granskare eller en "coach" — det är din operativa partner. Behövs för att hålla stor komplexitet hanterbar.

---

### Specilaist 1: Reprissättningslogik-agent ("Prissättningsanalytiker")

**Jobb:** Föreslå reprissättning veckovis, baserat på kostnad, konkurrens och lager.

**Motivering:** "Prissättning över produktkategorier [är en källa till högt tidsvärde och högt smärtvärde]" och "[återkommer veckovis till månadsvis]. En agent som kan aggregera och föreslå kan spara 10+ timmar/vecka.

**Triggas av:** "Jag måste reprissätta nästa vecka" eller "ge mig ett förslag för produktlinjen X."

**Rör inte:** Slutgiltigt godkännande av priser (det gör VD:n). Kampanj-relaterad rabattering (det gör kampanj-agenten). Lager-driven reprissättning av outlet-produkter (det finns inte en dedikerad outlet-agent; det hanteras direkt).

**Kapaciteter:**
- Läser kostnadsbas, konkurrenspriser, lagerstatus per SKU
- Tillämpar reprissättnings-logik (t.ex. "håll 37 % margin när lager > 12 veckor; matcha konkurrens när < 6 veckor")
- Genererar reprissättningsförslag med motivering och uppskattad intäkts-impact
- Kör scenarioanalys ("vad händer om vi sänker 10 %?")
- Presenterar förslag för granskning innan lansering

**Föreslagna skills:**
- `xlsx` — för att bygga reprissättnings-scenarierna och leverera förslag i tabelform

**Skalningsnot:** En agent. Inte delad. Fokuserad på ett verkligen högt-värde-moment.

---

### Specilaist 2: PIM och Innehållsagent ("Innehålls-kurateor")

**Jobb:** Generera och redigera produkttexter för nya och uppdaterade produkter.

**Motivering:** "Produktinformation [är lagerfallet för datakvalitet]. En agent som kan generera konsistenta, multilingvistiska beskrivningar kan spara 8–12 timmar/vecka och förbättra standardisering.

**Triggas av:** "Vi lanserar 50 nya produkter på måndag" eller "produktbeskrivningarna är för korta och inkonsistenta."

**Rör inte:** Bildredigering, produktfotografering, CAD-arbete (det hör hemma hos design-agenten eller är helt manuellt). Prissättning. Kampanj-messaging.

**Kapaciteter:**
- Läser produktkod, grunddata (mått, material, ursprung, skötsel)
- Genererar kort beskrivning, långbeskrivning, och skötselanvisningar på flera språk
- Applicerar tonstil per kategori (minimalistisk för möbler, vänlig för hemåde, etc.)
- Lägger till SEO-taggar baserat på produktkategori
- Genererar tre utkast-varianter för användaren att välja mellan
- Presenterar för review före PIM-lansering

**Föreslagna skills:**
- Ingen initial — innehållet är primär. Men `docx` kan bli relevant senare för att exportera style-guider eller batchprocedurer.

**Skalningsnot:** En dedikerad agent. Höga volumer.

---

### Specilaist 3: Kampanj- och Bundling-agent ("Kampanj-arkitekt")

**Jobb:** Planera kampanjer och strukturera produktbundles för komplementär försäljning.

**Motivering:** "[Kampanjplanering och Bundling-Logistik] är ett moment som återkommer månadsvis och kräver både datalogik och kreativ struktur. En agent kan samla data och föreslå bundels snabbare än manuell process.

**Triggas av:** "Vi behöver en ny säsongskampanj" eller "vilka produkter bör vi bundla för hemarbete?"

**Rör inte:** Marknadsföring (budskap, grafik, reklam). Reprissättning av bundles (det hanterar prissättningsagenten). Budgetering.

**Kapaciteter:**
- Tar emot tematisk idé, målgrupp, budget, tidsplan
- Söker lämpliga produkter från katalogen som matchar tema och budget
- Strukturerar produktbundles (2–4 produkter) med komplementär försäljning i åtanke
- Föreslag rabatt-logik och placement
- Genererar kampanj-brief för marknadsföring och butiker
- Kör ABtest-scenarioanalys ("Bundle A: 8 % rabatt; Bundle B: 12 %")

**Föreslagna skills:**
- Ingen.

**Skalningsnot:** En agent, kan tas på sig tillsammans med lokaliseringspersonen nedan om det blir trångt.

---

### Specilaist 4: Feedback och Insights-agent ("Marknadspulsanalytiker")

**Jobb:** Aggregera kundrecensioner, feedback och trenddata varje dag och flagga viktiga insikter.

**Motivering:** "[Kundfeedback-Aggregering och Trendanalys] är ett moment som återkommer dagligen och där en agent kan extrahera värde från bullrig data. Långsiktig värde för produktförbättring.

**Triggas av:** Automatiserad daglig körning. Kan också aktiveras manuellt på frågor som "vilka produkter fick negativ feedback denna vecka?"

**Rör inte:** Kundsupport eller direktkommunikation. Prissättning. Produktutveckling (det hör hemma hos design-agenten som inte finns här). Assistenten kan flagga när en produkt behöver omarbetas, men agenten gör inte själva omarbetningen.

**Kapaciteter:**
- Läser kundrecensioner från webben, sociala medier, supportsamtal
- Extraherar och aggregerar feedback per produkt och kategori
- Identifierar trendmönster ("alla säger att denna stolens armstöd är för högt")
- Flaggar outlier-feedback (en kritik från en expert är viktigare än 10 stjärnors-recensioner)
- Levererar daglig insikts-sammanfattning för assistenten

**Föreslagna skills:**
- Ingen.

**Skalningsnot:** En isolerad agent för att bullereffekten inte ska påverka andra operativa agenter.

---

### Specilaist 5: Lokalisering och Regional Anpassning ("Lokaliseringsspecialist")

**Jobb:** Anpassa kampanj-budskap och produkttexter för lokala marknader och språk.

**Motivering:** "[Lokalisering och Multi-Språk-Anpassning] är ett moment som återkommer veckovis och där en agent kan generera första-utkast innan lokal redigering. Medel-värde men nödvändig för att minska lokal review-tid.

**Triggas av:** "Vi lanserar denna kampanj på spanska nästa vecka" eller "behöver produktbeskrivningar på italienska."

**Rör inte:** Grafik och visuell lokalisering (det är design-team). Prissättning (kan variera per marknad men är operationell). Slutgiltigt godkännande (det gör lokal team före lansering).

**Kapaciteter:**
- Tar emot engelsk/huvudspråk text och målspråk
- Genererar lokaliserad version med kulturell anpassning
- Flaggar potentiella fallgropar eller misstolkningar ("denna fras är idiomalisk på engelska")
- Presenterar utkast för lokal redaktör före lansering
- Kör batch-lokalisering för hundratals produkttexter

**Föreslagna skills:**
- Ingen (rengöring är primär språklig arbete).

**Skalningsnot:** En agent. Kan eventuellt slås ihop med kampanj-arkitekten om volym sjunker.

---

### Specilaist 6: Produktsammontering och Teknisk Dokumentation ("Teknisk Dokumentör")

**Jobb:** Förbättra och standardisera sammonteringsanvisningar och teknisk dokumentation för nya och uppdaterade produkter.

**Motivering:** "[Produktsammonteringsanvisningar] är ett moment som uppkommer vid ny produktlansering och revidering, och där en agent kan omvandla CAD-beskrivningar till tydliga instruktioner. Medel-värde, ofta glömd process.

**Triggas av:** "Vi lanserar denna nya stol nästa vecka och behöver sammonteringsanvisningar" eller "dessa instruktioner är otydliga, kan du förbättra dem?"

**Rör inte:** CAD-ritningar själv (det gör design-team). Grafisk illustration (det gör design-team). Juridisk ansvar (dessa ansvarar designteamet för).

**Kapaciteter:**
- Läser CAD-data, dellistor, monteringssekvenser (ofta som text eller enkla images)
- Genererar step-by-step monteringsanvisningar på flera språk
- Inkluderar säkerhetstips och vanliga misstag
- Presenterar för teknisk granskning före publicering
- Standardiserar instruktions-format över produktlinjer

**Föreslagna skills:**
- Ingen initial, men `pdf` kan bli relevant för att skapa publiceringsklara PDF:er senare.

**Skalningsnot:** En agent, kan ta på sig mindre moment från andra agenter om priortering förskjuts.

---

## Avvisade

### Demand Forecasting och Supply Chain Planering
**Varför inte:** AI-lämpligheten är medel, men redan väl löst av specialiserad prognostiserings-programvara (ARIMA, exponentiell utjämning, ML-modeller). En Claude-agent skulle lägga ett lager av semantisk tolkning på toppen av något som redan är optimerat. Låg marginal-värde. Kan hanteras genom API-integration mot befintlig ML-pipeline om det senare blir relevant.

### Leverantörssamverkan och Orderföljning
**Varför inte:** Kräver system-integration (EDI, leverantörs-portaler) och ofta direktkommunikation. Claude kan inte autonöm initiera extern kommunikation. Låg AI-lämplighet för en standalone-agent. Föreslå istället API-integration mot procurement-systemet.

### Lageroptimering och Automatic Replenishment Logic
**Varför inte:** Redan automatiserad av WMS-system (Warehouse Management System). En Claude-agent skulle vara redundant. Låg värde.

### Inredningsrådgivning och Kuraterad Samman-Styling
**Varför inte:** Kreativ, estetisk aktivitet utan klara rätt/fel-kriterier. Claude kan inte ersätta ett menniskligt öga för stilkombination och trendkänsla. Låg AI-lämplighet.

### Budgetering och Kostnadskontroll
**Varför inte:** Redan väl-automatiserad via ERP. Lågt värde för en Claude-agent. Under ribban.

---

## Flaggat för användaren

- **Systemintegration:** Vilken data är tillgänglig för agenter (API, export, eller manuell upload)? Påverkar vilka moment som är praktiska.
- **Review-processer:** Hur många personer granskar varje typ av agent-förslag före lansering? En-person-bottleneck kan uppstå.
- **Regionala varianter:** Hur mycket kan en central agent föreslå för lokala marknader utan att åsidosätta regional autonomi? Behöver tydliggöras.

---

## SAMMANFATTNING

**Teamet för IKEA:**

| Rolls | Agent | Fokus |
|-------|-------|-------|
| VD | Strategisk prioritering och trade-offs | — |
| VD-assistent | Daglig operativ sammanfattning | — |
| Specialist 1 | Reprissättningsanalytiker | Prissättning |
| Specialist 2 | Innehålls-kurateor | PIM och produkttexter |
| Specialist 3 | Kampanj-arkitekt | Bundling och kampanj-logistik |
| Specialist 4 | Marknadspulsanalytiker | Feedback och trendanalys |
| Specialist 5 | Lokaliseringsspecialist | Spraklig anpassning |
| Specialist 6 | Teknisk Dokumentör | Sammonteringsanvisningar |
| **Total** | **8 agenter** | — |

**Nyckelvärdepunkt:** IKEA är en massmarknadskoperator med högt volymtryck. De fyra viktigaste klusterna (Prissättning, Innehål, Kampanj, Feedback) är välmotiverade av konkreta fynd. Övriga moment är antingen redan automatiserade eller kräver system-integration som inte ingår i detta scope. Teamet fokuserar på högt-värde, inte på komplexitet.

**Nästa steg:** Bekräfta dataintegrationen (vilken data är tillgänglig för agenter) och review-processerna (vem godkänner före lansering) innan implementering.

