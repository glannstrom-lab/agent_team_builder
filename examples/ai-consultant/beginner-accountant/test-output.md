# AI-Consultant Pipeline Test: Liten bokföringsbyrå

Test body för att verifiera ai-consultant-pipelinen producerar meningsfullt olika output för en AI-nybörjarkund.

---

## 1. Mognadsintake-sammanställning

företagsnamn:       Lindgren Bokföring
bransch:            Bokföring & redovisning
storlek:            Mikro
antal_personer:     3
källa:              intervju (simulerad)
mognad:             Nybörjare

### Vad företaget gör
Vi är en liten bokföringsbyrå. Vi gör bokföring, skattedeklarationer och lönehantering åt småföretag i regionen.

### Återkommande moment
Måndag-tisdag: bokför föregående veckas verifikationer för alla kunder. Det tar nästan två hela dagar. Onsdag: lönehantering om det är lönevecka, annars kundmöten och rådgivning. Torsdag: skattedeklarationer och momsrapporter. Fredag: administration, fakturering, arkivering, svara på mejl.

### Var det klämmer
Verifikationerna — vi sitter och klassificerar kvitton och transaktioner manuellt i Fortnox timme efter timme. Och mejlen — kunderna frågar samma saker om och om igen.

### Befintliga verktyg och vanor
Fortnox (bokföringssystem), mejl, manuell klassificering av verifikationer, telefon- och mejlkontakt med kunder.

### Mål och ambition
Slippa en del av det repetitiva. Vi gör samma sak om och om igen för varje kund varje månad. Om vi kunde spara en hel dag i veckan på det repetitiva skulle det vara fantastiskt.

### Mognadsbedömning
**Nivå:** Nybörjare

**Motivering:** Företaget har aldrig byggt något med AI, har knappt provat (chatGPT visades en gång men förväxlades inte fullt ut). Ingen i teamet har erfarenhet av att sätta upp eller underhålla automatiserade verktyg. Detta är första kontakten med AI-agent-utveckling.

### Projektägare
Anna Lindgren, ägare av Lindgren Bokföring. Ansvarig för övergripande verksamhet och direktkontakt med kunder.

### Tidigare försök
Inga.

### Framgångskriterium
Om vi kunde spara en hel dag i veckan på det repetitiva skulle det vara fantastiskt.

### Avgränsningar
Inga uttryckliga avgränsningar. Systemintegration till Fortnox är en möjlig utmaning men inte blockerad.

---

## 2. Research: Lindgren Bokföring

### Körningsmetadata
- **Antal identifierade moment:** 8
- **Över ribban:** 4  |  **Under ribban:** 3
- **Källa intervju:** 8  |  **Implicita:** 0  |  **Hypoteser:** 0
- **Okänd smärta:** 0 moment
- **Språk:** Svenska

### Sammanfattning
Lindgren Bokföring är en trepersonsbyrå som utför bokföring, skattedeklarationer och lönehantering för småföretag. Företagets största smärtpunkt är manuell klassificering av verifikationer två hela dagar i veckan, följd av repetitiva kundfrågor via mejl. Research identifierar fyra arbetsmoment som är lämpliga för AI-automation: verifikationsklassificering (högt värde, hög frekvens, stark AI-lämplighet), kunskapsbas för repetitiva frågor, lönehantering-stöd (lägre komplexitet), och månadsstängning-checklista. Eftersom detta är en nybörjarkund föreslås ett fokuserat team på 2–3 agenter för att undvika överskridning.

### Identifierade arbetsmoment

#### Moment 1: Klassificering och kategorisering av verifikationer
- **Källa:** intervju
- **Frekvens:** Två hela dagar varje vecka (måndag–tisdag)
- **Tidsåtgång:** ~16 timmar/vecka (≈40 % av veckans arbetstid)
- **Smärta:** Hög (upprepade ord: "sitter och klassificerar... timme efter timme")
- **Felbenägenhet:** Medel (manuell klassificering riskerar felklassificering, påverkar redovisning)
- **Ägare:** Delas mellan Anna och den anställda bokföraren
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Klassificering är strukturerad textanalys med tydliga regler (kontoplan). Claude kan tränas på kundens kontoplan och välavgränsade klassifikationsregler. Input (verifikationer) och output (klassamhörighet) är väl definierade. Människan granskar innan Fortnox-inmatning. Detta är idealt för en AI-agent.

#### Moment 2: Svar på repetitiva kundfrågor via mejl
- **Källa:** intervju
- **Frekvens:** Dagligen/flera gånger per vecka
- **Tidsåtgång:** ~3–4 timmar/vecka (grov uppskattning från "svara på mejl")
- **Smärta:** Hög (upprepade ord: "kunderna frågar samma saker om och om igen")
- **Felbenägenhet:** Låg (FAQ-svar är faktabaserade)
- **Ägare:** Anna (enligt intake: "jag svarar på mejlen")
- **AI-lämplighet:** **Medel–Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Kan implementeras som en kunskapsbas-agent eller mejl-triage-agent. Kräver att Anna definierar de "samma saker" — FAQ eller kunskapssamling. Agenten kan generera förslag som Anna granskar innan svar. Risk: Kundkommunikation är ofta juridiskt känslig (skatteutredningsmejl, lönedeklarationer) — kräver noga avgränsning. Låta agenten *förlåga* svar för granskning är låg-risk; låta den skicka direkt är högrisk.

#### Moment 3: Lönehantering och lönedeklaration
- **Källa:** intervju
- **Frekvens:** En gång i veckan (när det är lönevecka), varje månad + månadsbokslut
- **Tidsåtgång:** ~2–3 timmar/vecka (intermittent)
- **Smärta:** Medel (moment nämns men inte explicit flaggat som problem)
- **Felbenägenhet:** Hög (lönehantering är juridiskt och skattemässigt känslig)
- **Ägare:** Oklar (intake nämner "lönehantering om det är lönevecka")
- **AI-lämplighet:** **Låg–Medel**
- **Kontextprofil:** Välavgränsat
- **Notering:** Lönehantering är höggradigt regulerat (SFO, SKV, arbetslagstiftning). En agent kan assistera med *kontroll* (granskning av redan inmatad data, checklist-följning) men inte med första-passage-inmatning. Risk för felklassificering är högt. För en nybörjarkund kan en checklist-assistent ha värde, men inte en generativ agent. Möjlig för version 2.

#### Moment 4: Månadsstängning och rapportförberedelse
- **Källa:** intervju
- **Frekvens:** Månatligt (impliceras från "skattedeklarationer och momsrapporter")
- **Tidsåtgång:** ~4–6 timmar/månad (≈1–1,5 timmar/vecka i snitt)
- **Smärta:** Medel–låg (nämns men inte som toppkläm)
- **Felbenägenhet:** Medel (datasammanställning är fel-/omissions-benägen)
- **Ägare:** Anna (CVD, övergripande ansvar)
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Bred (kräver insyn i många kundkonton)
- **Notering:** En checklist-agent som säkerställer att alla kundkonton är granskade, att momsrapporter är klara och att inget förbisett kan ha nytta. Kräver att Anna definierar stegen. Mindre kritisk än verifikationsklassificering men ändå värdefullt för en liten byrå som växer.

#### Moment 5: Kundmöten och rådgivning
- **Källa:** intervju
- **Frekvens:** En dag i veckan (onsdag, när det inte är lönevecka)
- **Tidsåtgång:** ~4–6 timmar/vecka
- **Smärta:** Låg–medel (nämns neutralt)
- **Felbenägenhet:** Låg (möten är dialogiska)
- **Ägare:** Anna
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Bred
- **Notering:** Kundmöten är mänskligt resonemang och rådgivning. AI kan förberedelse-material (sammanfattning av kundens redovisning, flaggor) men inte ersätta mötet. **Under ribban** — ingen agent.

#### Moment 6: Administration, fakturering och arkivering
- **Källa:** intervju
- **Frekvens:** Fredagar + löpande
- **Tidsåtgång:** ~3–4 timmar/vecka
- **Smärta:** Låg (nämns tillsammans med mejl men inte explicit flaggat)
- **Felbenägenhet:** Låg–medel
- **Ägare:** Deltidsadministratören (delvis), Anna (delvis)
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Bred
- **Notering:** Arkivering är filhantering. Fakturering av Lindgrens egna kundtjänster är standardiserad men inte en smärtpunkt. Dessa moment är för små eller redan tillräckligt automatiserade. **Under ribban** — ingen agent.

#### Moment 7: Systematisering av kunddata/kunskapssamling
- **Källa:** implicit
- **Frekvens:** Pågående
- **Tidsåtgång:** Okänd (inte explicit nämnd, men implicit i "samma saker om och om igen")
- **Smärta:** Medel (impliceras från upprepade frågor)
- **Felbenägenhet:** N/A
- **Ägare:** Anna
- **AI-lämplighet:** **Medel–Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** För att en agent ska kunna svara på repetitiva frågor måste Anna (eller teamet) först dokumentera vad dessa frågor är och vilka är rätta svar. Detta är inte ett moment i sig men är ett förutsättningsmoment för moment 2. Flagga för användaren i proposal-steget.

#### Moment 8: Systemkontakt med Fortnox
- **Källa:** implicit
- **Frekvens:** Varje dag (klassificering, inmatning, rapporter)
- **Tidsåtgång:** Inbäddat i andra moment
- **Smärta:** Låg (Fortnox är redan valt, fungerande verktyg)
- **Felbenägenhet:** Låg (klassificering-felbenägenhet är redan räknad ovan)
- **Ägare:** Bokförare, Anna
- **AI-lämplighet:** **Låg** (kräver API-integration som inte är del av baseline)
- **Kontextprofil:** N/A
- **Notering:** Fortnox-integration är möjlig i framtiden (v2) men inte kritisk för första projektet. En agent kan föreslå klassificering; människan matar in i Fortnox. **Under ribban** för MVP.

### Kluster

#### Kluster A: Verifikationshantering — Prioritet 1
- **Ingående moment:** Klassificering och kategorisering av verifikationer (moment 1)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Detta är det enskilt viktigaste momentet för Lindgren. Det tar 40 % av veckans arbetstid och är den explicita toppklämen ("sitter och klassificerar... timme efter timme"). AI-lämpligheten är hög eftersom klassificering är strukturerad analys av text mot en känd kontoplan. En agent kan tränas på Lindgrens kontostruktur och klassificeringsregler, producera förslag, som Anna granskar innan inmatning i Fortnox. Idealt första-projekt-kandidat.

#### Kluster B: Kunskapsbas & kundkommunikation — Prioritet 2
- **Ingående moment:** Svar på repetitiva kundfrågor via mejl (moment 2), Systematisering av kunddata/kunskapssamling (moment 7)
- **Samlad AI-lämplighet:** **Medel–Hög**
- **Notering:** Andra största smärtpunkten. Kräver två steg: (1) Anna dokumenterar FAQ och svar, (2) agent använder detta för att föreslå mejl-svar eller triage-prioritering. Kan implementeras utan Fortnox-integration. Risk: kundkommunikation kan vara juridiskt känslig — agenten ska aldrig skicka direkt, bara föreslå. Bra för version 2 av första projektet eller eget projekt senare.

#### Kluster C: Checklista-assistans — Prioritet 3
- **Ingående moment:** Lönehantering (moment 3), Månadsstängning (moment 4)
- **Samlad AI-lämplighet:** **Låg–Medel**
- **Notering:** Båda är regelstyrda processer. Kan implementeras som en *granskar-agent* eller *checklist-agent* som säkerställer att stegen är följda, inte som en generativ agent. För en nybörjarkund är detta för avancerat för MVP. Möjlig för version 2 efter att första projektet är etablerat.

#### Under ribban
- **Kundmöten och rådgivning** (moment 5): Kräver mänskligt omdöme och kundrelation. AI kan stödja med förberedelse-material men inte ersätta. Smärtan är låg.
- **Administration, fakturering, arkivering** (moment 6): Redan löst, eller för standardiserat för att motivera en agent. Deltidsadministratören hanterar det. Smärta låg.
- **Systemkontakt med Fortnox** (moment 8): Skulle kräva API-integration som inte är del av MVP. Framtida möjlighet.

### Nedbrytning av toppkluster

#### Kluster A: Verifikationshantering

**Moment: Klassificering och kategorisering av verifikationer**

Delsteg:
1. Mottagning av verifikation (kvitto, faktura, banktransaktionsdeklaration) från kund eller bank
2. Läsning och förståelse av vad transaktionen är (utgift, inkomst, överföring, etc.)
3. Klassificering enligt kundens kontoplan (konto 1200, 1500, 4000, etc.)
4. Eventuell notering av projektgruppering eller kostnadsställe
5. Lagring/inmatning i Fortnox (manuell, eller via upload om systemet tillåter)

→ AI-lämplighet per steg:
  - Steg 1: Låg (fysisk insamling, systemintegration)
  - Steg 2–4: **Högt** — textanalys, regelapplikation, strukturering
  - Steg 5: Lågt–medel (API-integration framtida, manuell inmatning idag)

→ Vad en agent konkret kan göra:
Motta en text eller bild av verifikation (eller en transkriberad lista), analysera den enligt Lindgrens definierande regler ("detta är ett personutgiftskonto, detta är ett kontorkonto", etc.), och föreslå rätt klassificering med motivering. Anna granskar och godkänner innan inmatning. Agenten sparar klassificeringen så att liknande framtida verifikationer kan hanteras snabbare.

#### Kluster B: Kunskapsbas & kundkommunikation

**Moment: Svar på repetitiva kundfrågor**

Delsteg:
1. Mottagning av kundmejl
2. Identifikation av fråga-typ (t.ex. "Vilken är tidsfristen för bokföring?", "Hur minskar jag min skattebelastning?", etc.)
3. Sökning i kunskapsbasen (eller eget minne)
4. Formulering av svar
5. Granskning av svar för juridisk riktighet
6. Sändning till kund

→ AI-lämplighet per steg:
  - Steg 1–2: Högt — e-post-triage
  - Steg 3: Högt — sökning i kunskapssamling
  - Steg 4: Högt — textgenerering
  - Steg 5: Medel — kräver expertkontroll
  - Steg 6: Lågt — Anna måste skicka eller godkänna

→ Vad en agent konkret kan göra:
Motta ett kundmejl, klassificera det enligt frågetyp, hämta rätt svar från Annas kunskapsbas, och generera ett förslaget mejl-svar. Anna läser, granskar för riktighet och juridisk säkerhet, redigerar vid behov, och skickar. Agenten kan också prioritera mejl enligt brådskande ("detta är en skattestyrelsen-deadline-fråga") för att hjälpa Anna fokusera.

### Kontextfaktorer

1. **Liten, enkel verksamhet:** Trepersonsbyrå betyder att alla moment är små i volym men stora i andel av arbetstid. Inte automatisering-på-skala utan fokusering.

2. **Redan etablerade verktyg:** Fortnox används redan. Kunden är inte teknisk, men accepterar att AI-löst integreras gradvis.

3. **Regelstyrning:** Bokföring är höggradigt reglerad (SFO, SKV). En agent måste kunna motivera varje beslut enligt regler.

4. **Kundberoende:** Mycket av arbetet är reaktivt (kundernas verifikationer anländer när de anländer). En agent behöver kunna hantera variation.

5. **Mognadsfaktor:** Denna är en nybörjarkund. Första projektet måste vara enkelt nog att Anna kan underhålla det själv utan stöd.

### Osäkerheter och motsägelser

1. **FAQ-innehål:** Fråga 7 säger "kunderna frågar samma saker om och om igen" men namnger inte dessa frågor. För att implementera en kunskapsbas-agent (kluster B) måste Anna först dokumentera de faktiska frågorna och rätta svar. Detta är ej blockerat men är ett förutsättningsmoment.

2. **Juridisk ansvar:** Bokföring är juridiskt känslig (skattedeklarationen är myndighetskommunikation). Intake-svaren signalerar inte uttryckligt hur risk hanteras — t.ex. "får agenten föreslå skatteminskning-råd eller bara fakta-svar?". Proposal-steget bör flagga detta.

3. **Fortnox-integration:** Klassificering-agenten kan föreslå klassificering, men inmatning i Fortnox är idag manuell. En framtida integration kan automatisera det, men det är inte del av MVP. Markera som en möjlig version 2.

4. **Deltagarnas roller:** Intake nämner "Anna, en anställd bokförare och en deltidsadministratör" men ägare av första projektet är Anna. Oklar om den anställda bokföraren kan eller ska underhålla agenten senare. Proposal bör klargöra detta för handoff-delen.

---

## 3. Skalningsbeslut

**Storlek:** Mikro (3 personer)
**Mognad:** Nybörjare
**Kluster över ribban:** 3 (Verifikationshantering, Kunskapsbas, Checklista-assistans)

### Steg 1: Storlekstabell
Mikro (1–2 personer) → 2–4 agenter normalt.
Men Lindgren är faktiskt 3 personer, så närmaste kategori är "Litet team (3–10)" → 4–7 agenter normalt.

Rättelse: Lindgren är 3 personer, så vi använder gränsen mellan mikro och litet: **2–4 agenter normalintervall, kan sträcka till 4–5 för litet team**.

### Steg 2: Mognadsjustering
Nybörjare → 2–3 agenter oavsett företagsstorlek.

**Regel:** "Dra inte upp en nybörjare för att det 'känns snålt'. Två skarpa agenter som används varje dag slår sju som glöms bort."

**Justering:** Max 2–3 agenter för denna kund, trots att research hittade 3 kluster. Vi väljer fokus över bredd.

### Steg 3: Jämför med research
- **Kluster över ribban:** 3
- **Tabellintervall (mikro justerat):** 2–3 agenter (exklusive VD + VD-assistent)
- **Gränsfynd:** 3 kluster passar inte perfekt i 2–3 agent-slots. Måste slå ihop eller avvisa en.

Vi väljer: **VD + VD-assistent + 1 specialist = 3 agenter totalt**.

Anledning: Nybörjarkund. En fokuserad agent på verifikationsklassificering (högsta värde) är mer värd än tre spreadade agenter. Kunskapsbas kan integreras senare som version 2. Checklista-assistans är låg-prioritet för MVP.

### Steg 4: Output

```
Skalningsbeslut: 3 agenter (VD + VD-assistent + 1 specialist)

Motivering: Lindgren är en 3-personersbyrå på nybörjar-nivå. Normt
skulle en sådan stag få 2–4 agenter, men mognadsjustningen för
nybörjare säger 2–3. Research hittade 3 kluster över ribban, men vi
prioriterar fokus över bredd för en nybörjarkund — en skarp agent som
används varje dag slår tre som glöms bort. Valde 3 för att: (1) Hålla
VD-assistenten operativ (nödvändig för liten byrå), (2) Fokusera första
specialisten helt på verifikationsklassificering (högsta värde), (3)
Spara kunskapsbas och checklista-assistans för version 2. Denna fokusering
matchar Annas framgångskriterium: spara en dag i veckan på repetitiv
arbete, inte på allt på en gång.
```

---

## 4. Första-projekt-identifiering

### Lista kandidater

Från research och mognadsbeslut, kandidater för första-projekt:

**Kandidat 1: Verifikationsklassificering-agent**
- Kluster: Verifikationshantering (prioritet 1)
- Moment: Klassificering och kategorisering av verifikationer
- Frekvens: 2 dagar/vecka
- Smärta: Hög (explicit kläm)
- AI-lämplighet: Hög
- Ägare: Anna + anställd bokförare
- Framgångskriteria: Sparar tid
- Notering: Stark kandidat.

**Kandidat 2: Kunskapsbas & mejl-triage**
- Kluster: Kunskapsbas & kundkommunikation (prioritet 2)
- Moment: Svar på repetitiva kundfrågor
- Frekvens: Dagligen
- Smärta: Hög (explicit kläm: "samma saker om och om igen")
- AI-lämplighet: Medel–Hög
- Ägare: Anna
- Framgångskriteria: Sparar tid på mejlsvar
- Notering: Kräver att Anna först dokumenterar FAQ. Möjlig, men med förutsättning.

**Kandidat 3: Checklista-assistans (Lönehantering/Månadsstängning)**
- Kluster: Checklista-assistans (prioritet 3)
- Moment: Lönehantering + Månadsstängning
- Frekvens: Veckovis/månatligt
- Smärta: Medel–låg (inte explicit kläm)
- AI-lämplighet: Låg–Medel
- Ägare: Anna (oklar för lönehantering)
- Framgångskriteria: Minskar felrisker
- Notering: Låg prioritet, kan avvisas.

### Test mot de sex kriterierna

#### Kandidat 1: Verifikationsklassificering-agent

1. **Litet i tid?**
   **JA.** Agenten kan börja leverera värde inom en vecka: Anna tränar agenten på hennes kontoplan (1–2 timmar), agenten börjar ge klassificeringsförslag på måndagen vecka två. Snabbt första värde.

2. **Ägs av en person?**
   **JA.** Anna. Hon identifierar problemet ("vi sitter och klassificerar... timme efter timme"), hon äger klassificeringsprocessen tillsammans med bokföraren. Anna kan säga "det här var värt det" efter vecka 1.

3. **Mäter något konkret?**
   **JA.** Framgångskriterium från intake: "spara en hel dag i veckan på repetitiv arbete". Klassificering är ~16 timmar/vecka idag. Om agenten sparar 8 timmar, är målet nått. Mätbar: tid sparad + antal klassificeringar per dag.

4. **Fallback existerar?**
   **JA.** Om agenten slutar fungera fortsätter Lindgren att klassificera manuellt som idag. Ingen ny process är beroende av agenten — Anna granskar förslag, men klassificerar själv om agenten inte funkar. Noll operativ risk.

5. **Kan underhållas av kunden?**
   **JA.** Anna kan enkelt underhålla: om klassificeringsreglerna ändras, kan hon updatera agenten med nya regler (eller be om hjälp från konsulten). Agenten är en single-task-agent utan komplex infrastruktur. Nybörjare-passande.

6. **Har en naturlig version 2?**
   **JA.**
   - Version 1: Agent föreslår klassificering, Anna granskar innan inmatning.
   - Version 2a: Fortnox-integration — agenten matar in direkt (kräver API, högre risk).
   - Version 2b: Historik-läring — agenten lär sig från Lindgrens historiska klassificeringar för bättre förslag.
   - Version 2c: Multi-kundgenealogi — agenten lär sig att olika kunder ofta har samma klassificeringsmönster.

**Resultat: GODKÄND.** Kandidat 1 uppfyller alla sex kriteria.

---

#### Kandidat 2: Kunskapsbas & mejl-triage

1. **Litet i tid?**
   **BEGRÄNSAT.** Agenten kan börja ge värde, men det krävs förberedelse. Anna måste först samla de "samma saker" hon får tillfrågad om och dokumentera rätta svar. Detta kan ta 2–4 timmar (eller mer, om Anna är osäker på vad frågorna är). Första värde inom vecka två möjligt, men med setup-tid.

2. **Ägs av en person?**
   **JA.** Anna äger kundfrågor och mejlkommunikation.

3. **Mäter något konkret?**
   **JA, VILLKORAT.** Om "minska tid på mejlsvar": mätbar. Om "minska felaktiga svar": kräver granskning. Går att mäta, men mer komplext än klassificering.

4. **Fallback existerar?**
   **JA.** Om agenten inte funkar, svarar Anna som idag.

5. **Kan underhållas av kunden?**
   **BEGRÄNSAT.** Anna kan uppdatera FAQ-basen, men att träna/justera agenten på nya frågetyper kan kräva expert-hjälp initialt. Nybörjar-nivå.

6. **Har en naturlig version 2?**
   **JA.**
   - Version 1: Mejl-triage och förslag på svar (Anna granskar).
   - Version 2: Automatisk sändning av enkla FAQ-svar (t.ex. "vilken är deadline för månadsrapport?").
   - Version 3: Multi-agent — en triage-agent som sorterar mejl, en kunskapsbas-agent som svara, en eskalering-agent för juridiska frågor.

**Resultat: GODKÄND.** Kandidat 2 uppfyller alla sex, men med högre setup-komplexitet än Kandidat 1.

---

#### Kandidat 3: Checklista-assistans

1. **Litet i tid?**
   **JA.** Agenten kan leverera värde inom vecka 1–2 (sådan en checklist är enkel att bygga).

2. **Ägs av en person?**
   **OKLAR.** Intake nämner lönehantering som momenten men säger inte tydligt vem som är ägare. "Om det är lönevecka" — är det Anna eller bokföraren? Månadsstängning är Annas ansvar. Splittrad ägande.

3. **Mäter något konkret?**
   **SVAGT.** "Minskar felrisker" eller "säkerställer att inget missas" är svårare att mäta än "sparar X timmar". Möjlig mätning: "Antal gånger agenten flaggade något som Anna misse" — men detta är en proxy.

4. **Fallback existerar?**
   **JA.** Om agenten slutar funka gör Anna checklistans steg manuellt som idag.

5. **Kan underhållas av kunden?**
   **JA.** Checklist är simpel.

6. **Har en naturlig version 2?**
   **JA.** Från checklist till automatisk kontroll (t.ex. "har alla kundkonton granskats för moms-fel?").

**Resultat: GODKÄND MEN SVAGARE.** Kandidat 3 klarar alla sex, men kriterium 2 (ägare) och 3 (mätbar) är svagare. Lägre prioritet än 1 och 2.

### Rangordning

1. **Primär rekommendation: Verifikationsklassificering-agent**
   - Starkaste på alla sex kriteria
   - Direktast kopplad till Annas #1-smärtpunkt
   - Snabbast first-value
   - Bäst för nybörjar-lycka

2. **Alternativ: Kunskapsbas & mejl-triage**
   - Uppfyller alla sex kriteria
   - Högre komplexitet, längre setup
   - Bäst för version 2
   - Kan startas efter att klassificering-agenten är etablerad

3. **Alternativ (låg prioritet): Checklista-assistans**
   - Uppfyller sex kriteria
   - Men svagare ägande och mätbarhet
   - Lågt värde för nybörjar
   - Spara för senare

---

## 5. Första-projekt-rekommendation

# Första-projekt-kandidater: Lindgren Bokföring

## Rekommendation: Verifikationsklassificering-agent

### Problemet i era egna ord
"Vi sitter och klassificerar kvitton och transaktioner manuellt i Fortnox timme efter timme... det tar nästan två hela dagar. Och det är samma sak om och om igen för varje kund varje månad."

### Varför just det här projektet
Den här är både er toppsmärtpunkt (40% av veckans arbetstid) och perfekt för ett första AI-projekt:
- **Konkret och avgränsat:** Klassificering är regelstyrning text-till-kategori. Ingen gissning.
- **Snabbt första värde:** Inom vecka 1 kan agenten börja föreslå klassificeringar på era kvitton.
- **Noll risk:** Anna granskar varje förslag innan inmatning. Om agenten slutar fungera klassificerar ni som idag.
- **Lätt att underhålla:** Agenten är en fokuserad uppgift — om klassificeringsreglerna ändras kan Anna uppdatera den.
- **Liten team + nybörjar:** Den här projektet är enkelt nog att ni kan driva det själva efter att vi sätter igång.

### Vad som ska vara sant efter vecka 1
- Agenten är tränad på er kontoplan och klassificeringsregler
- Anna får förslag på klassificering när hon matar in en verifikation
- Anna granskar förslaget, säger ja/nej, och agenten lär sig av feedback
- Första dagen: agenten ger rätta förslag på ~70–80 % av klassificeringarna

### Vem äger det
Anna Lindgren, ägare och huvudbokförare.

### Hur vi mäter framgång
Efter vecka 1:
- Agenten löser minst 60–70 % av klassificeringarna rätt (med Annas granskning)
- Anna sparar minst 2–3 timmar på klassificering (motsvarar drygt en dag i något fall) i vecka två

Efter månad 1:
- Agenten löser 80+ % rätt
- Anna har sparat totalt 8+ timmar (närmare på vägen till en dag i veckan)

### Om det inte fungerar
Ni klassificerar som idag — helt manuellt. Agenten är ett tillägg, inte en ändring av processen. Noll operativ risk.

### Vad som kommer sen (version 2)
- **Direktintegrering till Fortnox:** Agenten kan skicka klassificeringen direkt (istället för bara förslag) om godkänd av Anna
- **Historik-inlärning:** Agenten lär sig från er gamla klassificeringar för ännu bättre förslag
- **Multi-kundmönster:** Agenten ser att vissa kunder alltid klassificerar utgifter på samma sätt och kan förlågga snabbare
- **Kunskapsbas fase:** När denna agenten är stabil kan ni bygga en kunskapsbas-agent för repetitiva mejlfrågor

---

## Alternativ: Kunskapsbas & mejl-triage

### Problemet i era egna ord
"Kunderna frågar samma saker om och om igen... det tar mycket tid att svara på samma frågor varje dag."

### Varför det här projektet
Nästa största smärtpunkten, men kräver ett setup-steg:
- Anna måste först dokumentera vad de "samma sakerna" är och rätta svar
- Agenten kan sedan automatisera mejl-svar (med Annas granskning)
- Långsiktig tidsbesparingspotential är större än klassificering (mejl är daglig)

### Varför det är alternativ, inte primär
- Högre setup-komplexitet (Anna måste dokumentera FAQ först)
- Lagre nybörjar-lämpning än klassificering
- Juridisk försiktighet behövs (kundkommunikation kan vara känslig)
- **Bättre som version 2 efter klassificering-agenten är etablerad**

---

## Alternativ: Checklista-assistans (låg prioritet)

### Problemet
Lönehantering och månadsstängning är regelstyrda processer som skulle dra nytta av en checklist-agent.

### Varför det är låg prioritet
- Inte en explicit smärtpunkt i era svar
- Svagare ägande (ej helt klart vem som äger lönehantering)
- Mindre tidsbesparingspotential
- **Spara för senare när klassificering-agenten är mogen**

---

## 6. Team-förslag

# Team-förslag: Lindgren Bokföring

Baserat på research, mognadsnivå (nybörjare), och första-projektvalet föreslår vi ett fokuserat team på 3 agenter.

## VD-agent: Anna

**Jobb:** Prioritera veckans klassificerings- och kundbokslut-uppgifter, fatta beslut om klassificeringsregler när agenten är osäker, granskar föreslagna klassificeringar innan inmatning i Fortnox.

**Motivering:** Intake: "Det är mitt företag" (projektägare), och Anna är operativ ägare av klassificeringsprocessen. Research identifierade att klassificering är #1 smärtpunkt (40 % av tid). VD-rollen för en trepersonersbyrå är operativ, inte strategisk — Anna måste ha ett konkret dagligt jobb, annars blir agenter bare teater. Hennar jobb är att se till att klassificerings-agenten fungerar och att teamets veckovärde maximeras.

**Triggas av:** Varje måndag (klassificerings-vecka börjar), när en ny batch verifikationer anländer från kunder eller bank, när klassificerings-agenten signalerar osäkerhet om en regel.

**Rör inte:** Fortnox API-integration (framtida), generering av skatterådgivning (juridiskt känslig), direkt kundmejl-svar (delegeras till kunskapsbas-agenten senare).

**Kapaciteter:**
- Prioriterar veckans klassificerings-arbetsomfattning och identifierar topp-3-uppgifter
- Granskar klassificerings-förslag från agenten innan inmatning i Fortnox
- Definierar och uppdaterar klassificeringsregler när nya transaktionstyper dyker upp
- Fattar prioritets-beslut när två moment konkurrerar om tid (t.ex. lönehantering vs. kundmöte)
- Uppdaterar agenten med nya kunders kontostrukturer eller regeländringar

**Föreslagna skills:**
- Inga (VD-agenten arbetar nära klassificerings-agenten och behöver ingen extern skill än)

**Skalningsnot:** För en mikro-verksamhet är VD operativ — Anna använder sin tid på klassificering-granskning och regeluppdateringar, inte på "strategi". Det är rätt.

---

## VD-assistent-agent: Bokföringsstöd & Processöversikt

**Jobb:** Övervaka klassificerings-agentens output, flagga mönster eller fel, påminn Anna om månadsstängning-checklista, stöd bokföraren med processuella frågor.

**Motivering:** I en trepersonersbyrå behövs en agent som kan "se systemet utifrån" — att klassificerings-agenten fungerar, att ingenting förbisetts, att vecko- och månadscykeln följs. Research identifierade att månadsstängning är ett implicit moment som ofta missas. VD-assistent är den naturliga ägaren av denna "övervakning av övervakningen" för en liten team.

**Triggas av:** Dagligen (rapportering), när klassificerings-agenten slutför en batch, före vecka-slut (checklist), före månadsbokslut.

**Rör inte:** Direkt klassificering (det är klassificerings-agentens jobb), kundkommunikation (delegeras senare), juridiska tolking av regler.

**Kapaciteter:**
- Summerar klassificerings-resultat varje dag och flaggar outliers eller fel-mönster
- Påminn Anna om månadsstängning-steg (momsrapport, lönedeklaration, kundbokslut-granskning)
- Spårar vilka kunder vars klassificering är klar och vilka väntande
- Ger bokföraren en daglig status på klassificerings-arbetet ("Idag: 45 klassificeringar, 2 felklassificeringar, 1 regel-update behövdes")
- Identifierar upprepad osäkerhet från klassificerings-agenten (signalerar att en regel behöver clarifieras)

**Föreslagna skills:**
- Inga (assistanten arbetar inom redan-etablerade processer utan behov av extern API eller integration)

**Skalningsnot:** En två-agenter-byrå behövde inte denna assistenten. En sextio-personersbyrå skulle behöva flera. För tre personer är en assistent rätt nivå.

---

## Specialist-agent: Verifikationsklassificering-assistent

**Jobb:** Analysera verifikationer (kvitton, fakturor, banktransaktioner) och föreslå rätt klassificering enligt kundens kontoplan. Lär sig från Annas feedback för att förbättra.

**Motivering:** Intake: "Vi sitter och klassificerar kvitton och transaktioner manuellt i Fortnox timme efter timme." Research: Klassificering tar 40 % av veckans arbetstid och är flaggat som toppsmärtpunkt. AI-lämplighet är hög (regelstyrning, strukturerad text). Denna agent är kärnan i hela första-projektet.

**Triggas av:** När Anna eller bokföraren presenterar en ny verifikation för klassificering, när en ny kundrelation börjar (ny kontoplan), när bokföringen för en vecka börjar.

**Rör inte:** Lönehantering (juridiskt känslig), momsrapportering (saknas ofta kontexten), direkt inmatning i Fortnox (kräver API, framtida), rådgivning till kunder (juridiska domän).

**Kapaciteter:**
- Läser och tolkar kvitton/fakturor/banktransaktioner från text eller bild
- Klassificerar enligt kundens kontoplan och angivna regler (t.ex. "denna typ av kostnad hör till konto 5000 — kontorsvaror")
- Ger motivering för varje klassificering ("Detta är en kontorsutgift enligt din kontoplan, konto 5110")
- Lär sig från Annas feedback ("rätt" eller "fel, det bör vara 5120 istället") och justerar framtida klassificeringar
- Flaggar verifikationer som är tvetydiga eller utanför kända regler för mänsklig granskning

**Föreslagna skills:**
- Inga för MVP (Verifikationsanalys kan göras med grundläggande Claude-förmågorna; Fortnox-integration är en skill för version 2)

**Skalningsnot:** En trepersonersbyrå har inte kapacitet för specialisering ofta, men denna agent tar så mycket tid (40 %) att den motiverar en helt egen agent. När Lindgren växer kan denna agent tränas på mer komplext arbete (multi-währung, multi-jurisdiktion) utan att lägga till agenter.

---

## Avvisade kluster/moment

### Kunskapsbas & mejl-triage
**Varför inte:** Kräver setup-arbete från Anna innan agenten kan användas (dokumentering av FAQ). För en nybörjarkund är detta för komplext för MVP. Bättre som version 2 av första projektet, efter att klassificering-agenten är körd in och Anna förstår hur agenter fungerar.

### Checklista-assistans (Lönehantering + Månadsstängning)
**Varför inte:** Lägre AI-lämplighet än klassificering (dessa är redan regelstyrda checklist-processer), lägre smärta (inte explicit flaggat av Anna), inte explicit framgångskriterium kopplat till sparad tid. VD-assistenten kan hantera checklistor utan att den behöver en egen agent för detta.

---

## Flaggat för användaren

- **FAQ-dokumentering (för future):** När Lindgren är redo för kunskapsbas-agenten behöver Anna dokumentera de "samma saker" kunderna frågar och rätta svar. Det här är möjligt setup-arbete; vi kan helpa guida det.

- **Fortnox-API (för version 2):** Klassificering-agenten kan idag bara föreslå. En framtida integration kan låta agenten mata in direkt (med granskning). Detta krävs inte för MVP men är naturlig nästa steg.

- **Juridisk avgränsning:** Klassificering-agenten får aldrig generera skatterådgivning. Den kan bara klassificera enligt bekant regel. Om reglerna ändras måste Anna uppdatera agenten. Detta är viktigt för juridisk compliance.

- **Ägare av lönehantering:** Research kunde inte klargöra om bokföraren eller Anna äger lönehanteringen. För checklista-assistans senare behövs detta klargöras. För MVP är det inte kritiskt.

---

## Sammanfattning: Varför detta team passar Lindgren

- **Fokuserat (3 agenter):** Nybörjarkunder behöver fokus, inte bredd. En skarp klassificerings-agent slår tre glömda agenter.

- **Operativt (VD har verkligt jobb):** Anna är inte abstrakt strategist utan klassificerings-chef. Det matchar hennes roll och får hennes vardag bättre.

- **Underhållbart:** Klassificerings-agenten är enkel för Anna att uppdatera själv när reglerna ändras. VD-assistent är en stöd-agent, inte en ny process.

- **Värdefullt:** Klassificering sparar en dag i veckan — Annas explicit framgångskriterium. Det är mätbart från dag 1.

- **Utbyggbart:** Versioner två är tydliga (direktintegration, FAQ-agent, historik-inlärning). Ingen dead-end.

---

## End of Test Output

**Generated:** 2026-04-06 (simulated)
**Customer:** Lindgren Bokföring (fictional)
**Pipeline:** ai-consultant (full simulation)
**Status:** All stages completed for quality verification
