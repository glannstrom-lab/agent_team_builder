# Personuppgiftsbiträdesavtal — mall

> **Internt arbetsmaterial. Publiceras inte.** Det här är ett utkast, inte ett
> juristgranskat avtal. Läs det med en jurist innan det skickas till en kund
> första gången. Därefter kan det återanvändas.
>
> **När behövs det?** När vi behandlar personuppgifter *för kundens räkning*.
> Två fall i dag:
>
> 1. **Moln-sparat team** — kundens teamkonfiguration ligger i vår D1-databas.
>    I dag är `functions/api/teams/[slug].js` bara läsning, så vi tar inte emot
>    något. Den dag skrivning införs (Stripe-steget) blir det här avtalet skarpt.
> 2. **"Vi bygger åt er"** — konsultuppdrag där vi hanterar kundens material,
>    dokument eller kundregister som underlag i arbetet.
>
> **När behövs det inte?** I BYO-läget, när kunden kör portalen med sin egen
> API-nyckel. Då passerar ingenting oss, och vi är varken ansvariga eller
> biträde. Kundens AI-leverantör är kundens eget biträde, under kundens eget
> avtal. Skicka inte det här avtalet i onödan — det skapar en roll vi inte har,
> och roller går inte att ta tillbaka i efterhand.
>
> Källa för innehållskraven: artikel 28.3 GDPR samt IMY:s vägledning
> (`imy.se` → Dataskydd → Personuppgiftsansvariga och personuppgiftsbiträden →
> Personuppgiftsbiträdesavtal, och "Att tänka på som personuppgiftsbiträde").
> Kontrollerat 2026-08-05.

---

## Personuppgiftsbiträdesavtal

**Mellan**

| | |
|---|---|
| **Personuppgiftsansvarig** ("Kunden") | [FÖRETAGSNAMN], org.nr [NR], [ADRESS] |
| **Personuppgiftsbiträde** ("Leverantören") | [FIRMANAMN — beror på beslutet enskild firma/AB], org.nr [NR], [ADRESS] |

Kontaktperson hos Kunden: [NAMN, E-POST]
Kontaktperson hos Leverantören: Mikael Glänne, info@mittaiteam.se

Avtalet gäller från [DATUM] och så länge huvudavtalet mellan parterna gäller.
Vid motstridighet mellan detta avtal och huvudavtalet har detta avtal företräde
i frågor om behandling av personuppgifter.

---

### 1. Bakgrund och roller

Leverantören tillhandahåller Kunden [BESKRIV TJÄNSTEN: moln-lagring av
teamkonfiguration / uppdrag att ta fram AI-team]. Inom ramen för det behandlar
Leverantören personuppgifter för Kundens räkning.

Kunden är personuppgiftsansvarig och bestämmer ändamål och medel för
behandlingen. Leverantören är personuppgiftsbiträde och behandlar uppgifterna
endast enligt Kundens dokumenterade instruktioner.

Detta avtal utgör Kundens dokumenterade instruktion. Ytterligare instruktioner
lämnas skriftligen till Leverantörens kontaktperson.

Leverantören ska underrätta Kunden om en instruktion enligt Leverantörens
uppfattning strider mot dataskyddsförordningen eller annan tillämplig
dataskyddsreglering.

Behandlar Leverantören uppgifter för egna ändamål utanför Kundens instruktion
är Leverantören personuppgiftsansvarig för just den behandlingen.

---

### 2. Föremålet för behandlingen (art. 28.3)

| | |
|---|---|
| **Föremål** | [T.ex. lagring och tillgängliggörande av Kundens teamkonfiguration] |
| **Varaktighet** | Så länge huvudavtalet gäller, plus [90] dagar |
| **Art och ändamål** | Lagring, åtkomstkontroll, säkerhetskopiering, felsökning och support |
| **Typ av personuppgifter** | [T.ex. namn, e-postadress, befattning och uppgifter om Kundens medarbetare som förekommer i rollbeskrivningar och underlag] |
| **Kategorier av registrerade** | [T.ex. Kundens medarbetare och kontaktpersoner] |
| **Känsliga uppgifter (art. 9/10)** | Behandlas inte. Kunden ska inte överföra sådana uppgifter till tjänsten. Behöver Kunden det krävs skriftlig överenskommelse i förväg och en särskild bedömning. |

Denna tabell ersätts av bilaga 1 om behandlingen är mer omfattande.

---

### 3. Leverantörens åtaganden

Leverantören ska:

1. behandla personuppgifter endast enligt Kundens dokumenterade instruktioner,
   inklusive vid överföring till tredje land, om inte unionsrätt eller svensk rätt
   kräver annat — i så fall informeras Kunden innan behandlingen, om det inte är
   förbjudet enligt den lagen;
2. säkerställa att alla personer som får tillgång till uppgifterna har åtagit sig
   att iaktta konfidentialitet eller omfattas av lagstadgad tystnadsplikt;
3. vidta lämpliga tekniska och organisatoriska säkerhetsåtgärder enligt artikel 32
   — se avsnitt 4;
4. respektera villkoren för att anlita underbiträden — se avsnitt 5;
5. med lämpliga åtgärder hjälpa Kunden att svara på begäran från registrerade om
   deras rättigheter, och utan onödigt dröjsmål vidarebefordra sådana begäranden
   som kommer direkt till Leverantören;
6. hjälpa Kunden att fullgöra skyldigheterna i artiklarna 32–36, alltså säkerhet,
   incidentanmälan, information till registrerade och konsekvensbedömning;
7. underrätta Kunden **utan onödigt dröjsmål och senast inom 24 timmar** efter att
   ha fått kännedom om en personuppgiftsincident, med den information Kunden
   behöver för sin anmälan till IMY;
8. vid avtalets slut, enligt Kundens val, radera eller återlämna samtliga
   personuppgifter och radera befintliga kopior, om inte lagring krävs enligt lag;
9. ge Kunden tillgång till den information som behövs för att visa att
   skyldigheterna i artikel 28 fullgörs, och möjliggöra och medverka vid
   granskningar och inspektioner — se avsnitt 7;
10. föra register över behandlingen enligt artikel 30.2.

---

### 4. Säkerhetsåtgärder

Leverantören tillämpar minst följande, med hänsyn till behandlingens art och
risknivå:

- **Kryptering under överföring.** All trafik går över HTTPS med HSTS.
- **Åtkomstkontroll.** Åtkomst till lagrade uppgifter är begränsad till de
  personer hos Leverantören som behöver den. I dag är det en person.
- **Åtkomst via oåtkomlig länk.** Ett moln-sparat team nås via en slumpad
  identifierare på minst 128 bitar entropi, som inte går att gissa och som inte
  indexeras.
- **Åtskillnad.** Varje kunds konfiguration lagras separat och nås bara med rätt
  identifierare.
- **Loggning.** Åtkomst och fel loggas hos underbiträdet som levererar
  infrastrukturen.
- **Säkerhetskopiering** enligt underbiträdets rutiner.
- **Sårbarhetshantering.** Beroenden ses över löpande och uppdateras vid kända
  sårbarheter.

Åtgärderna kan ändras över tid, men skyddsnivån får inte försämras.

---

### 5. Underbiträden

Kunden lämnar härmed ett **allmänt skriftligt förhandstillstånd** för Leverantören
att anlita underbiträden, på villkoren i detta avsnitt.

Godkända underbiträden vid avtalets ingående:

| Underbiträde | Roll | Behandlingens plats |
|---|---|---|
| Cloudflare, Inc. | Webbhotell, databas (D1), e-postvidarebefordran, skydd mot överbelastning | EU med möjlig support från tredje land |
| Google LLC | E-postbrevlåda dit korrespondens vidarebefordras | EU/USA |

**Anthropic PBC och OpenRouter, Inc. är inte Leverantörens underbiträden.**
När Kunden använder portalen med egen API-nyckel går anropen direkt från Kundens
webbläsare till den leverantör Kunden själv har avtal med. Leverantören är inte
part i det förhållandet. Kunden ansvarar för att teckna nödvändigt
personuppgiftsbiträdesavtal direkt med sin AI-leverantör.

> Skulle Leverantören i framtiden anropa en AI-leverantör från egen server, för
> Kundens räkning, blir den leverantören ett underbiträde och ska föras in i
> tabellen ovan innan behandlingen börjar.

Leverantören ska:

- teckna avtal med varje underbiträde som ålägger underbiträdet minst samma
  skyldigheter som Leverantören har enligt detta avtal;
- underrätta Kunden skriftligen minst **30 dagar** innan ett underbiträde läggs
  till eller byts ut;
- ge Kunden rätt att invända mot ändringen inom den tiden. Kvarstår invändningen
  efter att parterna försökt hitta en lösning får Kunden säga upp den berörda
  tjänsten utan kostnad, med återbetalning av eventuell förskottsbetald avgift för
  tid efter uppsägningen;
- förbli fullt ansvarig gentemot Kunden för underbiträdets behandling.

---

### 6. Överföring till tredje land

Personuppgifter behandlas inom EU/EES. Sker överföring till land utanför EU/EES
ska den vila på en giltig grund enligt kapitel V i dataskyddsförordningen — beslut
om adekvat skyddsnivå eller EU-kommissionens standardavtalsklausuler tillsammans
med en bedömning av behovet av kompletterande skyddsåtgärder.

Leverantören ska på begäran redovisa vilken grund som tillämpas för respektive
underbiträde.

---

### 7. Granskning

Kunden har rätt att en gång per år, och därutöver vid misstanke om brist eller
efter en incident, kontrollera att Leverantören följer detta avtal.

Granskning sker efter skriftlig begäran minst 30 dagar i förväg, under kontorstid
och utan att onödigt störa verksamheten. Leverantören får först uppfylla
begäran genom att lämna dokumentation, svar på frågeformulär eller intyg från
underbiträden. Räcker det inte får granskning ske på plats eller genom en
oberoende granskare som parterna enas om.

Kunden står för sina egna kostnader. Leverantörens kostnader för granskning
utöver den årliga ersätts av Kunden, om granskningen inte visar på en brist.

Den som granskar ska ha undertecknat sekretessförbindelse och får inte vara
konkurrent till Leverantören.

---

### 8. Ansvar

Vardera parten ansvarar för skada som orsakats av att den brutit mot detta avtal
eller mot dataskyddsförordningen. Ansvarsfördelningen följer artikel 82.

Ansvarsbegränsningen i huvudavtalet gäller även detta avtal, utom där tvingande
rätt säger annat.

Har en part fått betala hela ersättningen till en registrerad får den kräva
tillbaka den del som motsvarar den andra partens ansvar.

---

### 9. Avtalstid och upphörande

Avtalet gäller så länge Leverantören behandlar personuppgifter för Kundens
räkning.

Vid upphörande ska Leverantören inom [30] dagar, enligt Kundens skriftliga val,
radera eller återlämna samtliga personuppgifter och radera kopior. Har Kunden
inte meddelat något val inom fristen raderas uppgifterna.

Radering behöver inte ske i den utsträckning lagring krävs enligt lag, till
exempel bokföringslagen. I så fall fortsätter avtalets skyldigheter att gälla för
den kvarvarande behandlingen.

Leverantören ska på begäran skriftligen bekräfta att radering har skett.

---

### 10. Underskrifter

| Kunden | Leverantören |
|---|---|
| Ort och datum: | Ort och datum: |
| Underskrift: | Underskrift: |
| Namnförtydligande: | Namnförtydligande: Mikael Glänne |

---

## Att fylla i innan avtalet skickas

- [ ] Kundens firmanamn, organisationsnummer, adress och kontaktperson
- [ ] Leverantörens firmanamn och identitetsnummer — beror på beslutet enskild
      firma eller AB
- [ ] Vilken tjänst avtalet gäller (avsnitt 1)
- [ ] Tabellen i avsnitt 2: typ av uppgifter och kategorier av registrerade, med
      Kundens egna ord
- [ ] Bekräfta vilken region D1-databasen faktiskt ligger i innan avsnitt 5 och 6
      skickas till någon
- [ ] Kontrollera att underbiträdeslistan stämmer med vad som körs i produktion
- [ ] Fristerna inom hakparentes: 90 dagars lagring, 30 dagars radering,
      24 timmars incidentavisering — lova inte kortare än du kan hålla

## Öppna frågor

- **Incidentfristen på 24 timmar** är strängare än vad artikel 33.2 kräver
  ("utan onödigt dröjsmål"). Den är satt för att Kunden ska hinna med sina egna
  72 timmar. Bedöm om den är realistisk för en enmansverksamhet innan den lovas.
- **Granskningsrätten** kostar tid vid ett skarpt utfall. Alternativet är att
  begränsa den till dokumentation och frågeformulär, vilket större kunder ofta
  inte accepterar.
- **Standardavtalsklausuler för Cloudflare och Google** finns i deras egna
  villkor. Länkarna bör läggas in som bilaga innan avtalet används skarpt.
