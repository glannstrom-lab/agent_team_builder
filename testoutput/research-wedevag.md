# Research: Wedevåg Sweden AB

## Körningsmetadata
- **Antal identifierade moment:** 9
- **Över ribban:** 4  |  **Under ribban:** 5
- **Källa intervju:** 0  |  **Implicita:** 4  |  **Hypoteser:** 9
- **Okänd smärta:** 3 moment
- **Språk:** svenska

## Sammanfattning

Wedevåg Sweden AB tillverkar specialiserade verktyg för metallbearbetning med dragbrotschning som flaggskepp. Verksamheten består av tre huvudsakliga strömmar: legotillverkning (dragbrotschning, borrning, slipning), egenproduktion av kilspårbrotchar och försäljning av rotations- och specialverktyg. Verktygsservice är väsentlig — omslipning, centrumslipning och skärpning. Med 23 personer på en liten lokal operation är den största administrationen runt offerter, orderbehandling och dokumentation. Värdet för ett agent-team ligger i att automatisera den upprepade tekniska bedömningen (offertgenomgång), orderadministration och dokumentation — så att fler resurser kan fokuseras på produktion och service.

## Identifierade arbetsmoment

### Moment 1: Offertgenomgång och tidskalkyl för legojobb
- **Källa:** hypotes
- **Frekvens:** flera gånger per vecka
- **Tidsåtgång:** ~2–4 timmar per vecka (varierande beroende på komplexitet)
- **Smärta:** medel
- **Felbenägenhet:** medel (riskerar att missa toleranskrav, materialspecifika begränsningar)
- **Ägare:** teknisk personal / disponering (troligen samma person)
- **AI-lämplighet:** medel
- **Kontextprofil:** välavgränsat
- **Notering:** Varje offert kräver bedömning av material, toleranser, maskinval och tidsuppskattning. Input är oftast e-post eller ritning. Grunddata (materialtabeller, maskinkapacitet, ställtider) är stabil. En agent kan strukturera offertens information, föreslå maskinval baserat på material och toleranser, och ge en första tidsuppskattning — men slutbedömningen måste göras av tekniker. AI-lämplighet är medel (inte låg) eftersom det finns tydliga in/ut-format, det går att kodifiera materialegenskaper, och iteration kan ske med människor i loopen.

### Moment 2: Orderadministration för legojobb
- **Källa:** hypotes
- **Frekvens:** dagligen
- **Tidsåtgång:** ~2–3 timmar per dag
- **Smärta:** okänd
- **Felbenägenhet:** medel (riskerar duplicering, förlorade order, blandning av specifikationer)
- **Ägare:** orderadministratör / disponering
- **AI-lämplighet:** låg
- **Kontextprofil:** brett
- **Notering:** Innefattar mottagande av order från kunder (e-post, telefon, system), inmatning i ERP/affärssystem, uppdatering av status, kommunikation med produktion. Många integrationspunkter och systemkopplingar. En agent saknar åtkomst till ERP-systemet och kan därför inte direkt uppdatera order. Momenten kan *stödjas* av en agent (sammanställa order från olika kanaler, förberedande strukturering) men lämpar sig inte för en dedikerad agent. Hamnar under ribban.

### Moment 3: Produktionsplanering och schemaläggning
- **Källa:** hypotes
- **Frekvens:** dagligen, med veckoplaneringspulser
- **Tidsåtgång:** ~3–5 timmar per vecka (antagligen manuell process)
- **Smärta:** okänd
- **Felbenägenhet:** hög (riskerar flaskhalsar, dålig maskinutnyttjande, leveransfördröjningar)
- **Ägare:** disponering / produktionsledare
- **AI-lämplighet:** låg
- **Kontextprofil:** bullrigt
- **Notering:** Kräver realtidsöversikt av maskinkapacitet, pågående jobb, leveranstider, ställtider mellan jobben. Genererar många mellanliggande artefakter (uppdaterade schema, ändringar, reprioritieringar). AI kan inte automatisera denna uppgift utan systemintegrering och real-time-data. En agent kan eventuellt assistera med scenarioplanering (visa effekt av nya ordrar) men det är derivat av det verkliga problemet. Hamnar under ribban.

### Moment 4: Verktygsservice — mottagning, bedömning och dokumentation
- **Källa:** hypotes
- **Frekvens:** flera gånger i veckan
- **Tidsåtgång:** ~1–2 timmar per vecka (dokumentation)
- **Smärta:** okänd
- **Felbenägenhet:** medel (felaktiga skadebeskrivningar, fel ommonterings-instruktioner)
- **Ägare:** servicepersonal / verkstad
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** Service består av fysisk mottagning, visuell bedömning av slitagegrad, beslut om omslipning eller byte, mätning, och leveransdokumentation. Bedömningen kräver ögonmål av erfaren servicetekniker. Dokumentationen kan struktureras av en agent (skriva skadebeskrivning från fotografier eller muntlig rapport), men själva bedömningen är helt human. Låg AI-lämplighet och hamnar under ribban.

### Moment 5: Kvalitetskontroll och toleransmätning
- **Källa:** hypotes
- **Frekvens:** för varje tillverkade detalj/verktyg
- **Tidsåtgång:** signifikant del av produktionstiden
- **Smärta:** okänd
- **Felbenägenhet:** låg (om rutinen är etablerad)
- **Ägare:** operatör / QC-funktion
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** Denna uppgift är helt hands-on — fysisk mätning med kaliprar/mätinstrument, jämföring med ritningar, registrering av resultat. En agent kan möjligen formatera mätprotokoll eller generera rapporter från inmatade data, men mätningen själv kan inte automatiseras. Hamnar långt under ribban.

### Moment 6: Lagerhantering och orderadministration för standardverktyg
- **Källa:** hypotes
- **Frekvens:** veckovis eller efter behov
- **Tidsåtgång:** ~1–2 timmar per vecka
- **Smärta:** låg
- **Felbenägenhet:** låg
- **Ägare:** orderadministratör / försäljning
- **AI-lämplighet:** låg
- **Kontextprofil:** välavgränsat
- **Notering:** Spårning av lagernivåer för kilspårbrotchar och standardverktyg, svar på kundinquiries om lagerstatus och leveranstider, möjligt bestånd i lagersystem. En agent *kan* svara på enkla lagerfrågor om den har tillgång till lagersystemet (vilket är osäkert), men momenten är redan enkla för en människa och lämnar litet värde för en agent. Hamnar under ribban.

### Moment 7: Teknisk kundkommunikation — specifikations- och materialsamtal
- **Källa:** hypotes
- **Frekvens:** flera gånger per vecka
- **Tidsåtgång:** ~1–3 timmar per vecka
- **Smärta:** okänd
- **Felbenägenhet:** låg (det är en expert-konversation)
- **Ägare:** säljare / teknisk person
- **AI-lämplighet:** låg
- **Kontextprofil:** brett
- **Notering:** Denna kommunikation är helt expert-till-expert. Kunden ringer eller e-postar om toleranser, materialval, genomförbarhetsfrågor eller specialbehov. Svaren kräver djup branschkunskap och förståelse för enskilda kunders historia. En agent kan inte ersätta en erfaren säljare eller tekniker här. Kan potentiellt assistera med att förbered samtal eller dokumentera resultat, men det är stöd, inte huvuduppgift. Hamnar under ribban.

### Moment 8: Rapportgenerering och spårbarhetsdokumentation
- **Källa:** hypotes
- **Frekvens:** för varje legojobb och serviceuppdrag
- **Tidsåtgång:** ~1–2 timmar per vecka
- **Smärta:** medel
- **Felbenägenhet:** medel (missad spårbarhet, inkompletta rapporter)
- **Ägare:** administrativa personal
- **AI-lämplighet:** medel
- **Kontextprofil:** välavgränsat
- **Notering:** Tillverkningsindustrin kräver spårbarhetsdokumentation — vilken maskin användes, vid vilken tid, av vem, kvalitetsdata. En agent kan samla dessa data från olika källor (produktionslogg, QC-anteckningar, ordersystemet), formatera enligt mall, och producera spårningsrapporter. Input är strukturerad, output är mall-baserad. Medel AI-lämplighet. Över ribban.

### Moment 9: Uppdatering av processrutiner och procedurdokumentation
- **Källa:** [implicit]
- **Frekvens:** månatvis eller vid processförbättringar
- **Tidsåtgång:** ~1–2 timmar per månad
- **Smärta:** låg
- **Felbenägenhet:** låg
- **Ägare:** produktionsledare / VD
- **AI-lämplighet:** medel
- **Kontextprofil:** brett
- **Notering:** En liten tillverkning behöver hålla sina processer dokumenterade och uppdaterade för kvalitetssäkering och nya medarbetare. En agent kan assistera genom att strukturera ändringshistorik, skriva instruktioner utifrån beskrivningar från personal, formatera enligt ISO-krav. Medel lämplighet, men låg frekvens och låg smärta håller det under praktisk prioritet.

## Kluster

### Kluster A: Offertgenomgång och teknisk bedömning — prioritet 1
- **Ingående moment:** Moment 1 (offertgenomgång och tidskalkyl)
- **Samlad AI-lämplighet:** medel
- **Notering:** Varje offert för legojobb kräver upprepad teknisk bedömning — material, toleranser, maskinval, tidsuppskattning. Det är repetitivt och strukturerat (ofta e-postform eller ritning) men kräver sakkunskap. En agent kan ta första steget: tolka kundens behov, slå upp materialprofil, föreslå maskin och första tidskalkyl. Tekniker granskar och justerar. Värdet ligger i att spara tiden för experten från noll till första gissning.

### Kluster B: Rapportgenerering och administrationsstöd — prioritet 2
- **Ingående moment:** Moment 8 (rapportgenerering och spårbarhetsdokumentation)
- **Samlad AI-lämplighet:** medel
- **Notering:** En mycket konkret uppgift: samla data som redan finns dokumenterade, strukturera enligt mall, producera rapport. Input är ofta loggposter, QC-anteckningar, ordernummer. Output är standardrapport för spårning. En agent levererar detta snabbt och korrekt. Låg risk för fel (data finns redan), hög repetition, låg personlig bedömning krävs.

### Under ribban

**Moment 2 — Orderadministration för legojobb:** Bredt moment som kräver systemintegrering (ERP) som en agent inte kan nå. Kan stödjas men motiverar inte egen agent. Återkommer dagligen men är redan en etablerad rutin utan synlig smärta.

**Moment 3 — Produktionsplanering:** Bullrigt moment med realtids-krav, många uppdateringar, systemintegrering. AI-lämplighet låg utan tillgång till lagersystem och maskinövervakning. Smärta är okänd — kan vara låg, kan vara hög.

**Moment 4 — Verktygsservice:** Bedömningen är helt hands-on och kräver ögonmål från expert. Dokumentationsdelen kan stödjas men motiverar inte egen agent givet låg volym och låg automatiseringspotential.

**Moment 5 — Kvalitetskontroll:** Helt hands-on. Ingen agent kan ersätta fysisk mätning. Hamnar långt under ribban.

**Moment 6 — Lagerhantering standardverktyg:** Låg frekvens, låg smärta, redan enkelt för människa. Systemåtkomst osäker. Under ribban.

**Moment 7 — Teknisk kundkommunikation:** Expert-konversation. Kan stödjas med material, men kan inte automatiseras. Har lågt eller okänt värde för en dedikerad agent. Under ribban.

**Moment 9 — Procedurdokumentation:** [implicit] moment med låg frekvens och låg smärta. Över ribban endast potentiellt, men inte i praktisk prioritet.

## Nedbrytning av toppkluster

### Kluster A: Offertgenomgång och teknisk bedömning

#### Moment 1: Offertgenomgång och tidskalkyl för legojobb

Delsteg:
1. Mottar offertstförfrågan (e-post med ritning, eller text med specifikationer)
2. Extraherar nyckelinformation: material, toleranser, komplexitet, önskad leveranstid
3. Slår upp materialprofil (hårdhet, bearbetningsegenskaper, rekommenderad matningshastighet)
4. Baserat på material och toleranser — föreslår maskin(er) från parken (dragbrotsch för enkla, borr+slipning för komplicerade)
5. Uppskattar tidsåtgång per maskin baserat på komplexitet och material
6. Lägger till ställtid mellan maskiner
7. Summerar till total tidsuppskattning och möjlig leveranstid
8. Strukturerar offert-utgång (material, rekommenderad process, pris, leveranstid)

→ AI-lämplighet per steg:
- Steg 1–3: mycket högt (textanalys, strukturering)
- Steg 4–5: medel (materialkunskap kan kodifieras, men val mellan nära alternativ kräver judgment)
- Steg 6–7: högt (beräkning)
- Steg 8: högt (formatering)

→ Vad en agent konkret kan göra:
Motta e-postförfrågan och ritning, extrahera specifikationer, slå upp material och föreslå maskinsekvens med första tidsuppskattning och leveransdatum. Dokumentera förutsättningar för uppskattningen (vilka materialantaganden, vilka maskinkapaciteter användes). Tekniker granskar, kan justera maskinval eller tider, och skickar slutlig offert. Agenten sparar typiskt 20–30 minuter per offert för experten.

### Kluster B: Rapportgenerering och administrationsstöd

#### Moment 8: Rapportgenerering och spårbarhetsdokumentation

Delsteg:
1. Erhåller order-ID och jobbspecifikation (material, maskin, tidsfönster)
2. Slår upp motsvarande produktionslogg/tidlogg
3. Hämtar kvalitetsdata (mätresultat, inspektörs signering)
4. Dokumenterar vilken maskin användes, tid för bearbetning, operatör, QC-resultat
5. Formaterar enligt spårbarhetsmall (ofta ISO-krav eller kundens format)
6. Genererar spårningsrapport och arkiverar

→ AI-lämplighet per steg:
- Steg 1–3: högt (sökning, sammanställning från olika källor)
- Steg 4: medel (data finns, men kan behöva verifiering)
- Steg 5–6: högt (formatering, generering)

→ Vad en agent konkret kan göra:
Motta order-ID eller jobbnamn, hämta motsvarande poster från logg (tillhandahållen i strukturerad form), sammanställ spårningsrapport med maskin, tid, operatör och QC-resultat, formatera enligt mall och leverera publiceringsklart PDF eller dokument. Människan granskar och arkiverar. Sparar typiskt 15–20 minuter per rapport.

## Kontextfaktorer

1. **Systemintegrering okänd:** Intaket anger "troligen affärssystem/ERP, möjligt CAD/CAM". Detta är kritiskt för orderadministration och produktionsplanering. Utan specifik info om systemintegrering (API, export-format) kan ingen agent helt automatisera dessa. Proposal-steget bör klargöra.

2. **Material och maskinprofil:** Företaget arbetar med begränsad palette material (stål, aluminium, möjligen någon särsmälta) och ett känt maskinarkiv (dragbrotsch, borr, slipning, laser, blästring). Denna data kan kodifieras och utgör grunden för offertagen.

3. **Små team, breda roller:** Med 23 personer är funktioner överlappande — en person kan vara teknik, disponering, försäljning. Agenter måste förstå detta och inte förutsätta att en "orderadministratör" är en dedikerad roll.

4. **Tillverkningsstandard kräver spårning:** Branchen (verktyg för metallbearbetning) kräver dokumentation för kvalité och kundespecifika behov. Allt måste kunna spåras. Det ökar administrativ börda men också värdet av automatiserad rapportgenerering.

5. **Legotillverkning är kernverksamhet:** Inte bara egen produktion utan också beställningar från kunder. Detta gör offertgenomgången viktig och repetitiv.

## Osäkerheter och motsägelser

1. **Systemintegrering:** Intake säger "troligen ERP", men det är inte bekräftat. Vilken system, och har det API/export-funktioner? Kritiskt för orderadministration och produktionsplanering.

2. **Smärtpunkter inte kvantifierade:** Intaket säger "var det klämmer" är offerter, planering och dokumentation, men anger inte konkret hur mycket tid som går bort eller vad kostanden är. "Effektivisera" är målet, men ingen baslinjemätning finns.

3. **VD och strategiska prioriteringar:** Intaket säger målet är att "effektivisera det administrativa arbetet", men det är okänt vad VD:n faktiskt prioriterar — är det volymtillväxt, marginal, kundnöjdhet, eller minskning av personallast? Detta påverkar vilken agent-kombination som gör mest nytta.

4. **Befintlig automation eller verktyg:** Intake säger "okänt" för befintliga verktyg. Är det helt manuellt, eller finns redan någon automation? Finns makron i Excel, är det något hem-byggt skript?

5. **Konkurs och övergång 2022:** Företaget tog över efter Wedevåg Tools AB:s konkurs. Okänt hur mycket av tidigare process som kördes över, hur mycket är ad-hoc. Kan påverka hur genomlyftta rutiner är.

6. **Serviceföretag vs. tillverkningsföretag:** Intaket listar "verktygsservice" som en väsentlig del, men det är oklart hur stor del av resurser och omsättning som går där. Det påverkar vilka moment som är viktigast.
