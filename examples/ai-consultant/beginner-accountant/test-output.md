# Ai-consultant pipeline-test: Lindgren Bokföring

Testkörning för att verifiera att ai-consultant-pipelinen producerar ett
team och ett första projekt som är specifika för en enskild nybörjarkund
(en liten bokföringsbyrå), inte en generisk konsultmall. Körning i
konsult-läget, storlek litet, mognad nybörjare.

**Regenererad 2026-07-15 mot promptversion 2026-07-15.**

---

## 1. Mognadsintake-sammanställning

```
företagsnamn:       Lindgren Bokföring
bransch:            Bokföring och redovisning
storlek:            litet
antal_personer:     3
källa:              intervju
mognad:             nybörjare

## Vad företaget gör
En liten bokföringsbyrå med tre personer. Gör bokföring,
skattedeklarationer och lönehantering åt småföretag i regionen.

## Återkommande moment
Måndag–tisdag: bokför föregående veckas verifikationer för alla kunder —
tar nästan två hela dagar. Onsdag: lönehantering om det är lönevecka,
annars kundmöten och rådgivning. Torsdag: skattedeklarationer och
momsrapporter. Fredag: administration, fakturering, arkivering och mejl.

## Var det klämmer
Verifikationerna — "vi sitter och klassificerar kvitton och transaktioner
manuellt i Fortnox timme efter timme". Och mejlen — "kunderna frågar
samma saker om och om igen".

## Befintliga verktyg och vanor
Fortnox (bokföring och lön), Outlook för mejl, telefon, Excel för
avstämningar. Kunderna skickar kvitton och fakturor som PDF eller
mobilfoto. Banktransaktioner hämtas som filexport (CSV/Excel) från
bankerna. Deklarationer lämnas via Skatteverkets e-tjänster.

## Mål och ambition
Slippa en del av det repetitiva — "vi gör samma sak om och om igen för
varje kund varje månad". Värt det = en sparad dag i veckan.

## Mognadsbedömning
Nivå: nybörjare
Motivering: Ingen i teamet har byggt något med AI. En person provade
ChatGPT en gång för att formulera ett kundmejl, men resultatet blev för
allmänt hållet och användes inte. Skillnaden mellan "provat i en
chattflik" och "byggt något andra använder" är tydlig här: inget har
byggts. Detta är första kontakten med AI som arbetsverktyg.

## Projektägare
Anna Lindgren, ägare. Sköter kundkontakt, deklarationer och en stor del
av verifikationsarbetet. Utpekad utan tvekan: "det blir jag".

## Tidigare försök
Ett: ChatGPT-testet ovan. Det övergavs för att svaret lät som en broschyr,
inte som byrån.

## Framgångskriterium
"Om vi kunde spara en hel dag i veckan på det repetitiva skulle det
vara fantastiskt."

## Avgränsningar
Det som skickas till Skatteverket — deklarationer och momsrapporter —
skriver och skickar byrån själv. Inget AI-genererat får gå direkt till
myndigheter. Inga mejl skickas till kunder utan att en människa läst dem.
```

*Ser det rätt ut? → Bekräftat, vi går vidare till research.*

---

## 2. Research: Lindgren Bokföring

### Körningsmetadata
- **Antal identifierade moment:** 7
- **Över ribban:** 2  |  **Under ribban:** 4
- **Källa intervju:** 6  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 3 moment
- **Språk:** Svenska

### Sammanfattning
Lindgren Bokföring är en trepersonsbyrå där veckan har en fast rytm:
verifikationer i början, lön eller kundmöten i mitten, deklarationer på
torsdagar och administration på fredagar. Två moment pekas uttryckligen
ut som smärta: den manuella konteringen av verifikationer (nästan två
hela dagar varje vecka) och kundmejlen där samma frågor återkommer.
Research hittar två kluster över ribban — verifikationshantering och
återkommande kundfrågor — och fyra moment under ribban där en agent
antingen vore teater (Fortnox-inmatning, fakturering) eller där
resultatet måste vara exakt rätt varje gång (lön, deklarationer).
Deklarationerna är dessutom uttryckligen undantagna i intake.

### Identifierade arbetsmoment

#### Moment 1: Kontera och bokföra veckans verifikationer
- **Källa:** intervju
- **Frekvens:** Veckovis (måndag–tisdag, varje vecka)
- **Tidsåtgång:** Nästan två hela dagar — den enskilt största posten i veckan
- **Smärta:** Hög ("timme efter timme", "samma sak om och om igen")
- **Felbenägenhet:** Medel (felkontering upptäcks ofta först vid avstämning
  eller bokslut)
- **Ägare:** Delas mellan Anna och den anställda bokföraren
- **AI-lämplighet:** **Hög** — för förslagsdelen, inte inmatningen
- **Kontextprofil:** Välavgränsat
- **Notering:** Kärnan i momentet är att läsa en verifikation (kvitto,
  faktura, banktransaktion) och avgöra vilket konto den hör till enligt
  kundens kontoplan. Det är strukturerad texttolkning mot kända regler —
  precis vad en agent gör bra. Input finns redan i format Claude kan läsa
  (PDF, foto, CSV-exporter). Själva inmatningen i Fortnox förblir manuell
  och mänskligt granskad, vilket är rätt i en reglerad bransch.

#### Moment 2: Svara på återkommande kundfrågor via mejl
- **Källa:** intervju
- **Frekvens:** Dagligen
- **Tidsåtgång:** Del av fredagarna plus löpande insprängt under veckan
- **Smärta:** Hög ("kunderna frågar samma saker om och om igen")
- **Felbenägenhet:** Medel (ett slarvigt svar om moms eller frister kan
  ställa till det för kunden)
- **Ägare:** Anna
- **AI-lämplighet:** **Medel–Hög**
- **Kontextprofil:** Välavgränsat för rutinfrågorna, bredare för
  rådgivningsfrågor
- **Notering:** Frågorna som återkommer (frister, milersättning, vad som
  är avdragsgillt, hur kvitton ska skickas in) har stabila svar och passar
  utkastsförslag — aldrig autosvar, per intake-avgränsningen. Haken: ingen
  har skrivit ner vilka frågorna och de rätta svaren är. Se moment 7.

#### Moment 3: Lönehantering
- **Källa:** intervju
- **Frekvens:** Vissa onsdagar (lönevecka) + månadsvis deklaration
- **Tidsåtgång:** En dag de veckor det är aktuellt
- **Smärta:** **Okänd** (nämns neutralt, flaggas inte som kläm)
- **Felbenägenhet:** Hög (fel lön eller fel arbetsgivardeklaration slår
  direkt mot kundens anställda och mot Skatteverket)
- **Ägare:** Oklart — intake säger inte om Anna eller bokföraren äger det
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Välavgränsat men känsligt
- **Notering:** Resultatet måste vara exakt rätt varje gång, och Fortnox
  Lön sköter redan beräkningarna. Det en agent möjligen kan bidra med är
  en kontrollchecklista — men smärtan är okänd och ägaren oklar.
  **Under ribban.**

#### Moment 4: Skattedeklarationer och momsrapporter
- **Källa:** intervju
- **Frekvens:** Veckovis (torsdagar) med månadstoppar
- **Tidsåtgång:** Ungefär en dag i veckan
- **Smärta:** **Okänd** (nämns neutralt)
- **Felbenägenhet:** Hög (myndighetskommunikation)
- **Ägare:** Anna
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Välavgränsat men undantaget
- **Notering:** Uttryckligen avgränsat i intake: inget AI-genererat får gå
  till myndigheter. Dessutom ett moment där resultatet måste vara exakt
  rätt varje gång. **Under ribban** — och ska så förbli oavsett vad en
  framtida körning hittar.

#### Moment 5: Kundmöten och rådgivning
- **Källa:** intervju
- **Frekvens:** Onsdagar (när det inte är lönevecka)
- **Tidsåtgång:** Ungefär en dag varannan vecka
- **Smärta:** **Okänd** (nämns neutralt)
- **Felbenägenhet:** Låg
- **Ägare:** Anna
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Brett
- **Notering:** Mötet är mänskligt omdöme och relation. En agent kan på
  sikt förbereda underlag, men smärtan är inte flaggad och värdet
  spekulativt. **Under ribban.**

#### Moment 6: Fakturering, administration och arkivering
- **Källa:** intervju
- **Frekvens:** Fredagar + löpande
- **Tidsåtgång:** Del av fredagen
- **Smärta:** Låg (nämns i förbifarten; deltidsadministratören bär det
  mesta)
- **Felbenägenhet:** Låg
- **Ägare:** Deltidsadministratören, delvis Anna
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Brett
- **Notering:** Byråns egen fakturering är standardiserad i Fortnox och
  arkiveringen är filhantering. Inget här motiverar en agent.
  **Under ribban.**

#### Moment 7: Dokumentera de återkommande kundfrågorna `[implicit]`
- **Källa:** implicit (följer av moment 2: "samma saker om och om igen"
  finns i huvudet på Anna, inte på papper)
- **Frekvens:** Engångsinsats + löpande påfyllning
- **Tidsåtgång:** Ett par timmar initialt
- **Smärta:** Medel (indirekt — det är frånvaron av listan som gör att
  mejlen tar tid)
- **Felbenägenhet:** Låg
- **Ägare:** Anna
- **AI-lämplighet:** **Medel–Hög** (agenten kan bygga listan ur exempel)
- **Kontextprofil:** Välavgränsat
- **Notering:** Förutsättningsmoment för moment 2. Ingen svarsbank utan
  att någon först skriver ner frågorna och byråns svar. Klustras med
  moment 2.

### Kluster

#### Kluster A: Verifikationshantering — prioritet 1
- **Ingående moment:** Kontera veckans verifikationer (1)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Den uttalade toppsmärtan och den största tidsposten:
  nästan två dagar varje vecka, "timme efter timme". Konteringen är
  regeltolkning mot en känd kontoplan — en agent kan föreslå konto med
  motivering, människan granskar och bokför i Fortnox. Direkt kopplat
  till framgångskriteriet "spara en hel dag i veckan".

#### Kluster B: Återkommande kundfrågor — prioritet 2
- **Ingående moment:** Svara på kundfrågor (2), Dokumentera frågorna (7)
- **Samlad AI-lämplighet:** **Medel–Hög**
- **Notering:** Den andra uttalade klämman. Kräver två steg: först en
  nedskriven svarsbank (moment 7), sedan utkastsförslag på inkommande
  mejl. Per intake-avgränsningen skickas inget utan mänsklig läsning.
  Hänger ihop som kluster eftersom svarsbanken är råmaterialet till
  utkasten.

#### Under ribban
- **Lönehantering (moment 3):** Måste vara exakt rätt varje gång, okänd
  smärta, oklar ägare. Fortnox Lön räknar redan.
- **Deklarationer och moms (moment 4):** Uttryckligen undantaget i intake
  plus myndighetskommunikation.
- **Kundmöten (moment 5):** Mänskligt omdöme, okänd smärta.
- **Fakturering/administration (moment 6):** Låg smärta, redan löst av
  deltidsadministratören och Fortnox.

### Nedbrytning av toppkluster

#### Kluster A: Verifikationshantering

**Moment: Kontera veckans verifikationer för en kund**

Delsteg:
1. Samla ihop underlaget: kvitton/fakturor (PDF eller foto från kunden)
   och bankens transaktionsexport (CSV/Excel)
2. Tolka varje post: vad är det för transaktion, vem är motparten,
   vad avser den?
3. Välja konto enligt kundens kontoplan (t.ex. 5810 biljetter,
   5910 annonsering, 4010 varuinköp)
4. Notera eventuellt kostnadsställe eller projekt
5. Mata in i Fortnox och stämma av mot bankkontot

→ AI-lämplighet per steg: låg för 1 (fysisk insamling), hög för 2–4
  (tolkning och regeltillämpning), låg för 5 (kräver Fortnox-åtkomst
  och mänskligt ansvar)
→ Vad en agent konkret kan göra: ta emot underlaget, gå igenom post för
  post och leverera en färdig konteringslista med föreslaget konto och
  en kort motivering per post — plus en flaggad lista över de poster den
  är osäker på. Människan granskar, rättar och bokför. Varje rättelse
  skrivs in i byråns regelbok så att samma fråga inte återkommer.

#### Kluster B: Återkommande kundfrågor

**Moment: Besvara ett återkommande kundmejl**

Delsteg:
1. Läsa mejlet och avgöra frågetyp (frist, avdrag, milersättning,
   "hur skickar jag in kvitton", övrigt)
2. Slå upp byråns svar i svarsbanken
3. Formulera ett svarsutkast i byråns ton
4. Anna läser, justerar och skickar

→ AI-lämplighet per steg: hög för 1–3, låg för 4 (mänsklig läsning är
  ett intake-krav)
→ Vad en agent konkret kan göra: förvandla "samma fråga för femtionde
  gången" till ett färdigt utkast på trettio sekunder. Förutsätter att
  svarsbanken byggts först (moment 7).

### Kontextfaktorer

1. **Reglerad bransch.** Varje kontering måste kunna motiveras. En agent
   som föreslår utan motivering är oanvändbar här — motiveringen är en
   del av leveransen, inte en bonus.
2. **Tre personer, tre olika roller.** Anna (ägare/kundkontakt),
   en bokförare, en deltidsadministratör. Det som byggs måste passa in i
   den befintliga arbetsdelningen, inte rita om den.
3. **Underlaget kommer i blandade format.** Kvitton som PDF och mobilfoto,
   bankdata som CSV/Excel. Agenten måste klara båda vägarna in.
4. **Nybörjarmognad.** Allt som byggs måste kunna underhållas av Anna
   själv efter uppdraget. Ingen del av lösningen får kräva en tekniker.

### Osäkerheter och motsägelser

1. **Vem äger lönehanteringen?** Intake säger "lönehantering om det är
   lönevecka" utan ägare. Spelar ingen roll för första projektet men
   behöver klargöras innan något byggs nära lön.
2. **De återkommande frågorna är odokumenterade.** Kluster B förutsätter
   att Anna kan lista de vanligaste frågorna och byråns svar. Inte
   bekräftat i intake. Proposal bör flagga.
3. **Volym per kund okänd.** "Nästan två dagar" totalt — men inte hur
   många kunder eller verifikationer det fördelas på. Påverkar hur
   mätningen av sparad tid läggs upp.
4. **Inga uttryckliga prioriteringsmoment i intake.** Veckan har fast
   rytm och Anna fördelar arbetet, men inget riktningsmoment flaggades.
   Noteras för VD-utformningen i proposal i stället för att hittas på.

---

## 3. Skalningsbeslut

```
Skalningsbeslut: 3 agenter (VD + VD-assistent + 1 specialist)
Motivering: Litet team (3 personer) ger normalt 4–7 agenter, men
nybörjarnivån sätter ett hårt tak på 2–3 — och taket vinner. Research
hittade 2 kluster över ribban; verifikationsklustret får den enda
specialistplatsen medan kundfrågeklustret skjuts till en framtida
version i stället för att pressas in i ett nybörjarteam.
```

---

## 4. Första-projekt-identifiering

Tre kandidater prövades mot de sex kriterierna i `docs/first-project.md`.
Alla sex måste vara uppfyllda — inte fem.

### Kandidat 1: Konteringshjälp för verifikationerna

```
Kandidat: Verifikationshantering (kluster A)

1. Litet i tid?      ja — Anna lämnar kontoplan och en bunt exempel
                     dag 1; agenten ger konteringsförslag på riktiga
                     verifikationer redan samma vecka
2. Ägs av en person? ja — Anna, utpekad projektägare, gör själv
                     momentet varje måndag
3. Mätbart?          ja — timmar på måndag–tisdag före och efter, mot
                     kriteriet "spara en hel dag i veckan"
4. Fallback?         ja — agenten föreslår bara; slutar den fungera
                     konterar byrån manuellt precis som idag
5. Underhållbart?    ja — underhållet är att fylla på regelboken när
                     ett förslag rättas, vilket Anna gör i klartext
6. Version 2?        ja — fler kunder, historikjämförelser, och på
                     sikt Fortnox-koppling
```

**Klarar alla sex.**

### Kandidat 2: Svarsbank för kundmejlen

```
Kandidat: Återkommande kundfrågor (kluster B)

1. Litet i tid?      ja, med förbehåll — Anna måste först skriva ner
                     de vanligaste frågorna och svaren (ett par
                     timmar); värde inom en vecka är möjligt men
                     inte lika omedelbart
2. Ägs av en person? ja — Anna äger mejlen
3. Mätbart?          ja — tid per besvarat rutinmejl
4. Fallback?         ja — Anna svarar själv som idag
5. Underhållbart?    ja — svarsbanken är en lista Anna fyller på
6. Version 2?        ja — sortering av inkorgen, fler frågetyper
```

**Klarar alla sex, men svagare på kriterium 1** — setup-steget gör
första värdet långsammare än kandidat 1.

### Kandidat 3: Kontrollchecklista för lön och månadsavslut

```
Kandidat: Lönehantering + månadsmoment (under ribban i research)

1. Litet i tid?      ja — en checklista är snabb att bygga
2. Ägs av en person? NEJ — intake kunde inte klargöra om Anna eller
                     bokföraren äger lönehanteringen
3. Mätbart?          nej — "färre missar" saknar baslinje; ingen vet
                     hur många missar som görs idag
4. Fallback?         ja
5. Underhållbart?    ja
6. Version 2?        ja
```

**Faller på kriterium 2 och 3 — inte en kandidat.** Stryks utan
rangordning.

### Rangordning

1. **Konteringshjälpen** — starkast på alla sex, direkt kopplad till
   toppsmärtan och till framgångskriteriet, och momentet ligger mitt i
   Annas egen vecka.
2. **Svarsbanken** — godkänd men med setup-tröskel. Bättre som version 2,
   när Anna redan sett hur en agent fungerar i vardagen.

---

## 5. Första-projekt-rekommendation: Lindgren Bokföring

## Rekommendation: Konteringshjälpen

### Problemet i era egna ord
"Vi sitter och klassificerar kvitton och transaktioner manuellt i
Fortnox timme efter timme. Vi gör samma sak om och om igen för varje
kund varje månad."

### Varför just det här projektet
Det är er största tidspost — nästan två dagar varje vecka — och samtidigt
den enklaste sortens uppgift att lämna över: att titta på en transaktion
och avgöra vilket konto den hör till, enligt regler ni redan kan utantill.
Agenten gör grovjobbet och motiverar varje förslag; ni behåller
granskningen och bokföringen. Ingenting i er process behöver ändras för
att prova.

### Vad som ska vara sant efter vecka 1
- Byråns kontoplan och era vanligaste konteringsregler finns nedskrivna
  i en regelbok som agenten arbetar utifrån
- Anna har kört minst en riktig kundbunt genom agenten och fått en
  konteringslista med motiveringar att granska
- De förslag Anna rättade har skrivits in i regelboken, så att samma
  fel inte kommer tillbaka

### Exempel — så ser det ut i praktiken

Du: "Här är förra veckans bankexport för Bergs Måleri plus tolv kvitton.
    Kontera."

Agenten: "Klart — 34 poster konterade med motivering, se listan. Tre
         poster är jag osäker på: Swish-insättningen på 4 200 kr saknar
         underlag, och två kvitton från Biltema kan vara antingen
         förbrukningsmaterial (5460) eller reparation (5170) beroende
         på vad de avser. Vill du avgöra?"

### Vem äger det
Anna Lindgren, ägare. Hon gör momentet själv varje måndag och märker
direkt om agenten sparar tid eller inte.

### Hur vi mäter framgång
Måndag–tisdag är idag nästan två hela dagar. Vi klockar
verifikationsarbetet en vanlig vecka före start, och sedan varje vecka
under första månaden. Målet är ert eget kriterium: en sparad dag i
veckan på det repetitiva. Delmål efter månad 1: konteringen tar högst
en dag i stället för två.

### Om det inte fungerar
Ni konterar manuellt precis som idag. Agenten föreslår bara — den rör
aldrig Fortnox — så det finns ingen process som går sönder när den
stängs av.

### Vad som kommer sen (version 2)
- **Svarsbanken för kundmejlen** — er andra kläm ("samma saker om och
  om igen") byggs när konteringen sitter och frågelistan är nedskriven
- **Historikjämförelse** — agenten jämför mot hur samma motpart
  konterats tidigare hos samma kund
- **Fortnox-koppling** — längre fram kan förslagen föras in direkt,
  fortfarande med er granskning. Den här delen är mer avancerad; den
  gör vi i så fall tillsammans.

---

## Alternativ: Svarsbank för kundmejlen

### Problemet i era egna ord
"Kunderna frågar samma saker om och om igen."

### Varför det är alternativ, inte primärt
Projektet klarar alla sex kriterier men kräver ett setup-steg:
frågorna och byråns svar finns idag bara i Annas huvud och måste
skrivas ner innan agenten kan göra nytta. Det gör första värdet
långsammare än konteringshjälpen. Rätt läge att bygga det är när
konteringshjälpen rullar och känns självklar — då finns både vanan
och frågelistan.

---

## 6. Team-förslag: Lindgren Bokföring

Tre agenter — nybörjartaket är ett hårt tak, och två skarpa agenter som
används varje måndag slår sju som glöms bort. VD:n har ett operativt
jobb, inte en strategiroll.

### Byråchefen (VD)

**Jobb:** Äger byråns konteringsregelbok — avgör de regelfrågor
Konteringshjälpen flaggar som osäkra, skriver in besluten så att de
gäller nästa gång, och prioriterar veckans kundbuntar när allt inte
hinns med.

**Motivering:** "Vi gör samma sak om och om igen för varje kund varje
månad" → research-kluster A. Det som gör konteringen långsam är inte
bara volymen utan att samma bedömningar görs om från början varje gång.
Regelboken är byråns samlade omdöme i skriven form, och någon måste äga
den. Intake innehöll inga uttryckliga prioriteringsmoment (flaggat i
research), så VD:n får ett konkret operativt jobb i stället för en
påhittad strategiroll — för en trepersonsbyrå vore abstrakt strategi
ren teater.

**Triggas av:** När Konteringshjälpen flaggar en osäker post, när en ny
kund med ny kontoplan tas in, i veckostarten när kundbuntarna ska
prioriteras, och när en rättelse ska bli en regel.

**Rör inte:** Deklarationer, momsrapporter och all myndighetskontakt
(uttryckligen undantaget i intake). Ger ingen skatterådgivning. Skriver
inte kundmejl.

**Kapaciteter:**
- Avgör flaggade konteringsfrågor och formulerar beslutet som en regel
  i regelboken
- Håller regelboken per kund: kontoplan, återkommande motparter,
  specialfall
- Prioriterar veckans kundbuntar när måndag–tisdag inte räcker
- Fångar upp mönster i rättelserna ("den här regeln missförstås ofta —
  skriv om den")

**Föreslagna skills:**
- Inga (regelboken är klartext i markdown; inget filformat eller
  integration krävs).

**Skalningsnot:** I en större byrå hade regelboken varit en egen
kvalitetsfunktion. Här är den VD:ns operativa jobb — det är fyndet som
räddar VD-agenten från att bli teater.

---

### Veckolotsen (VD-assistent)

**Jobb:** Annas dagliga arbetspartner — håller ordning på var varje
kund befinner sig i veckorytmen, skickar rätt uppgift till rätt agent,
och bär checklistorna för de sällsynta momenten (lönevecka,
månadsavslut) som inte motiverar egna agenter.

**Motivering:** Byråns vecka har fast rytm (måndag–tisdag verifikationer,
onsdag lön eller möten, torsdag deklarationer, fredag administration)
och tre personer som delar på den. Det som behövs är inte fler händer
utan överblick: vilka kundbuntar är klara, vad väntar, vad är på väg att
missas. Veckolotsen är den agent Anna pratar med först.

**Triggas av:** "Var står vi?", när en ny uppgift dyker upp och det är
oklart vem som äger den, inför lönevecka och månadsavslut
(checklisthattarna), och när Anna vill stämma av läget.

**Rör inte:** Konterar inte själv (Konteringshjälpens jobb), fattar inga
regelbeslut (Byråchefens), skriver inget som går till kunder eller
myndigheter.

**Kapaciteter:**
- Håller status per kund: väntar på underlag / hos Konteringshjälpen /
  granskad / bokförd
- Föreslår dagens ordning utifrån vad som är mest akut
- Bär checklistan för lönevecka och månadsavslut som en hatt — utan att
  röra själva lönekörningen
- Märker när veckan glider ("torsdag och två kundbuntar kvar — vill du
  omprioritera?")
- Äger mötesfunktionen och vägrar kalla till möte när en fråga hör
  hemma hos en enskild agent

**Föreslagna skills:**
- Inga (orientering och triage; ingen integration krävs).

**Skalningsnot:** Checklisthattarna fångar värdet ur två moment under
ribban (lön, månadsavslut) utan att de blir egna agenter.
Klargörs ägarfrågan för lönehanteringen kan hatten växa vid en
framtida `/update-team`.

---

### Konteringshjälpen (specialist)

**Jobb:** Läser kundens underlag — kvitton och fakturor som PDF eller
foto, bankexporter som CSV/Excel — och levererar en konteringslista med
föreslaget konto och motivering per post, plus en flaggad lista över
osäkra poster.

**Motivering:** "Vi sitter och klassificerar kvitton och transaktioner
manuellt i Fortnox timme efter timme" → research-kluster A, toppsmärtan
och nästan två dagar i veckan. Hög AI-lämplighet: tolkning av
transaktioner mot en känd kontoplan, med granskningsbara förslag i
stället för egna beslut. Kärnan i första projektet.

**Triggas av:** När en kundbunt är komplett och ska konteras, när en
enstaka krånglig verifikation behöver ett andra öga, och när Byråchefen
uppdaterat regelboken och gamla flaggor ska omprövas.

**Rör inte:** Matar aldrig in något i Fortnox. Rör inte lön,
deklarationer eller moms. Gissar inte när regelboken tiger — osäkra
poster flaggas till Byråchefen i stället.

**Kapaciteter:**
- Tolkar kvitton och fakturor ur PDF och mobilfoton
- Läser bankens transaktionsexporter och matchar poster mot underlag
- Föreslår konto per post enligt kundens kontoplan och regelboken, med
  en rads motivering ("Biltema, skruv och lim → 5460
  förbrukningsmaterial enligt regel R14")
- Flaggar poster utan underlag eller utan träff i regelboken
- Sammanställer allt till en granskningsklar konteringslista per kund

**Föreslagna skills:**
- **pdf-reading** — kunderna skickar kvitton och fakturor som PDF och
  mobilfoto (intake, fråga 8); agenten måste kunna läsa ut belopp,
  motpart och innehåll ur dem, även skannade.
- **xlsx** — bankernas transaktionsexporter kommer som CSV/Excel
  (intake, fråga 8); agenten läser dem och lämnar konteringslistan i
  samma format så att den är lätt att pricka av mot Fortnox.

**Skalningsnot:** Bär hela verifikationsflödet ensam. I en större byrå
hade tolkningen (läsa underlag) och konteringen (välja konto) kunnat
delas på två agenter; för tre personer är en rätt, så länge den håller
sig till förslag.

---

## 7. Avvisade

### Svarsbanken (seriöst påtänkt som egen agent)
**Varför inte:** Kluster B klarade sex-kriterietestet och var en stark
kandidat till egen agent — men nybörjartaket är 2–3 agenter totalt, och
taket vinner. Konteringen sparar mer tid per vecka och kräver ingen
setup, så den fick specialistplatsen. Svarsbanken är utpekad version 2:
när konteringshjälpen sitter och Anna skrivit ner frågelistan byggs den
via `/update-team`. Värdet är inte struket, bara köat.

### Kontrollchecklista för lön och månadsavslut
**Varför inte:** Föll redan i första-projekt-testet på kriterium 2
(ingen klar ägare) och 3 (ingen mätbar baslinje), och lön är dessutom
ett moment där resultatet måste vara exakt rätt varje gång. Det
checklistevärde som finns bär Veckolotsen som en hatt.

### Deklarations- och momsagent
**Varför inte:** Uttryckligen undantaget i intake — inget AI-genererat
går till myndigheter. Avvisas oavsett research-fynd; avgränsningen är
absolut.

### Fortnox-inmatare
**Varför inte:** Kräver systemåtkomst som inte finns i baslinjen. En
agent som "sköter Fortnox" utan att kunna nå Fortnox vore teater.
Möjlig i en senare version, då tillsammans och med bibehållen
granskning.

---

## 8. Flaggat för användaren

- **Bankexporterna** → Bekräfta att ni kan ta ut transaktionerna som
  CSV/Excel från era kunders banker. Konteringshjälpens xlsx-flöde
  hänger på det.
- **Vem äger lönehanteringen?** → Klargör om det är Anna eller
  bokföraren innan Veckolotsens lönecheckhatt börjar användas.
- **Börja samla kundfrågorna redan nu** → Varje gång en fråga känns
  igen: skriv upp den och svaret på en lista. Det är hela förarbetet
  för svarsbanken i version 2, och det kostar en minut i taget.
- **Volym per kund** → Räkna antal verifikationer en typisk måndag
  innan start, så att mätningen av sparad tid får en riktig baslinje.

---

## 9. Divergens-självtest

Skulle den här uppsättningen kunna klistras in hos en annan liten
bokföringsbyrå och fortfarande passa? Nej:

- **Byråchefens** operativa jobb är regelboken — vald för att intake
  visade att smärtan sitter i återupprepade bedömningar ("samma sak om
  och om igen för varje kund varje månad") och för att intake saknade
  prioriteringsmoment att bygga på. En byrå med andra klämmor hade gett
  VD:n ett annat jobb.
- **Konteringshjälpen** är byggd runt exakt Lindgrens väg in: kvitton
  som PDF och mobilfoto plus bankexporter i CSV/Excel — därav just
  pdf-reading och xlsx. En byrå där underlaget redan flödar digitalt
  genom Fortnox hade inte fått de skillsen, kanske inte ens agenten.
- **Svarsbanken avvisades** — hos en byrå på van- eller byggarnivå hade
  den fått plats i teamet direkt. Här sköt nybörjartaket den till
  version 2. Mognaden, inte bara branschen, formade teamet.
- **Deklarationerna är orörbara** per Lindgrens uttryckliga avgränsning
  — en byrå utan den avgränsningen hade åtminstone fått ett
  underlagsförslag prövat mot ribban.
- **Veckolotsens hattar** (lönevecka, månadsavslut) speglar Lindgrens
  faktiska veckorytm måndag–fredag, inte en generisk byråkalender.

Teamet är format efter Lindgrens vecka och mognad. Det är svårt att
förväxla med någon annans.

---

## Slut på testkörning

**Genererad:** 2026-07-15 (simulerad; regenererad mot promptversion 2026-07-15)
**Företag:** Lindgren Bokföring (fiktivt)
**Pipeline:** ai-consultant (mognadsintake → research → skalning → första projekt → förslag), litet, nybörjare
**Status:** Alla steg körda för kvalitetsverifiering
