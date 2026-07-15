# Team-builder pipeline-test: Lerverk

Test-körning för att verifiera att team-builder-pipelinen producerar ett
team som är specifikt för ett enskilt soloföretag (en keramiker), inte en
generisk solo-mall. Körning i läge A (intervju), storlek solo.

---

## 1. Intake-sammanställning

```
företagsnamn:       Lerverk
bransch:            Handgjord keramik — tillverkning och e-handel
storlek:            solo
antal_personer:     1
källa:              intervju

## Vad företaget gör
En solo keramiker som tillverkar och säljer handgjord keramik via egen
Shopify-webshop och 4–5 mässor per år.

## Återkommande moment
Fota och lägga upp nya produkter med säljande texter. Svara på kundmejl
(frakt, skötselråd, specialbeställningar). Skriva nyhetsbrev. Planera
mässor. Hålla koll på lager och material.

## Var det klämmer
Produkttexter och kundmejl tar kvällarna. Nyhetsbrevet blir sällan av.
Vet inte vad som faktiskt säljer.

## Befintliga verktyg och vanor
Shopify (webshop), Instagram, Mailchimp (nyhetsbrev).

## Mål och ambition
Få tillbaka kvällarna och sälja mer av rätt saker.

## Avgränsningar
Rör inte själva tillverkningen/hantverket.
```

*Ser det rätt ut? → Bekräftat, vi går vidare till research.*

---

## 2. Research: Lerverk

### Körningsmetadata
- **Antal identifierade moment:** 7
- **Över ribban:** 3  |  **Under ribban:** 3
- **Källa intervju:** 6  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 1 moment
- **Språk:** Svenska

### Sammanfattning
Lerverk är en soloverksamhet där en person både tillverkar keramiken och
driver hela e-handeln runt den. Tillverkningen är uttryckligt undantagen —
det är allt *runt* hantverket som tar kvällarna. Två moment äter kvällstid
direkt: säljande produkttexter till nya produkter och kundmejl om frakt,
skötselråd och specialbeställningar. Ett tredje moment, nyhetsbrevet,
"blir sällan av" — det är inte tidsåtgång utan uteblivet arbete som är
problemet. Bakom allt ligger en strategisk blind fläck: keramikern vet inte
vad som faktiskt säljer, trots att Shopify sitter på datan. Research pekar
ut tre kluster över ribban — butikstexter & nyhetsbrev, kundmejl, och
försäljningsinsikt — och tre moment under ribban där en agent vore teater
(fotografering, mässplanering, lager/material).

### Identifierade arbetsmoment

#### Moment 1: Skriva säljande produkttexter till nya produkter
- **Källa:** intervju
- **Frekvens:** Veckovis (löpande när nya pjäser blir klara)
- **Tidsåtgång:** En stor del av kvällarna — flaggat som en av två tidstjuvar
- **Smärta:** Hög ("produkttexter och kundmejl tar kvällarna")
- **Felbenägenhet:** Låg (texten blir snarare tråkig/sliten än felaktig)
- **Ägare:** Keramikern (allt görs av en person)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Ren textproduktion med tydlig input (vad pjäsen är, material,
  glasyr, storlek, känsla) och tydlig output (produkttext i butiksröst).
  Claude levererar utkast direkt; keramikern putsar och trycker publish.
  Fotot kan AI inte ta — men texten *runt* fotot är idealisk.

#### Moment 2: Fota nya produkter
- **Källa:** intervju
- **Frekvens:** Veckovis (ihop med moment 1)
- **Tidsåtgång:** Märkbar, men oklar andel
- **Smärta:** Låg–okänd (nämns ihop med texterna men det är texterna som pekas ut)
- **Felbenägenhet:** Låg
- **Ägare:** Keramikern
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** —
- **Notering:** Produktfotografering är ett fysiskt, visuellt hantverk. En
  Claude-agent kan varken ställa ljus eller trycka av. **Under ribban.**

#### Moment 3: Svara på kundmejl (frakt, skötselråd, specialbeställningar)
- **Källa:** intervju
- **Frekvens:** Dagligen / flera gånger i veckan
- **Tidsåtgång:** Andra tidstjuven på kvällarna
- **Smärta:** Hög ("kundmejl tar kvällarna")
- **Felbenägenhet:** Medel (specialbeställningar med pris/ledtid kan bli fel
  om de besvaras slarvigt; frakt- och skötselråd är mer rutin)
- **Ägare:** Keramikern
- **AI-lämplighet:** **Medel–Hög**
- **Kontextprofil:** Välavgränsat för frakt/skötsel, bredare för specialorder
- **Notering:** Två tredjedelar av mejlen är återkommande: fraktvillkor och
  skötselråd för keramik (diskmaskin, mikro, första användning, krackelyr).
  De har stabila, faktabaserade svar och passar en agent perfekt — som
  *utkast keramikern granskar*, aldrig autosvar. Specialbeställningar kräver
  mänskligt omdöme om pris och ledtid; där föreslår agenten struktur, inte beslut.

#### Moment 4: Skriva och skicka nyhetsbrev
- **Källa:** intervju
- **Frekvens:** Borde vara regelbundet (vecko-/månadsvis) — men uteblir
- **Tidsåtgång:** Låg i teorin, noll i praktiken (görs sällan)
- **Smärta:** Medel ("nyhetsbrevet blir sällan av" — uteblivet arbete, inte tidsåtgång)
- **Felbenägenhet:** Låg
- **Ägare:** Keramikern
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Det som stoppar nyhetsbrevet är troligen tröskeln att börja på
  tom sida, inte att skriva i sig. En agent som genererar ett färdigt utkast
  utifrån veckans nya pjäser och vad som säljer river den tröskeln. Mailchimp
  är redan på plats; agenten levererar texten, keramikern klistrar in och skickar.

#### Moment 5: Planera mässor
- **Källa:** intervju
- **Frekvens:** 4–5 gånger per år (sällan)
- **Tidsåtgång:** Okänd
- **Smärta:** **Okänd** (nämns som moment men inte flaggat som kläm)
- **Felbenägenhet:** Medel (logistik: vad packa, hur mycket lager, prislappar)
- **Ägare:** Keramikern
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Brett
- **Notering:** Lågfrekvent och brett. En agent skulle mest stå still mellan
  mässorna. Checklistor och packlistor inför en mässa kan VD-assistenten bära
  som en hatt när det väl är dags. **Under ribban som egen agent.**

#### Moment 6: Hålla koll på lager och material
- **Källa:** intervju
- **Frekvens:** Löpande
- **Tidsåtgång:** Låg–medel
- **Smärta:** Låg (nämns neutralt, inte flaggat som kläm)
- **Felbenägenhet:** Medel (att få slut på en glasyr eller en storsäljare)
- **Ägare:** Keramikern
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Brett
- **Notering:** Kräver realtidsåtkomst till Shopifys lagersaldo och keramikerns
  materialförråd — system en agent inte når i baslinjen. Att be en agent "ha
  koll" utan den åtkomsten vore teater. **Under ribban.** (Lagernivåer som
  *signal för vad som ska göras mer av* fångas i stället i moment 7.)

#### Moment 7: Förstå vad som faktiskt säljer
- **Källa:** implicit (från klämman "vet inte vad som faktiskt säljer" + målet
  "sälja mer av rätt saker")
- **Frekvens:** Borde vara veckovis/månadsvis — görs inte idag
- **Tidsåtgång:** Noll idag (uteblir)
- **Smärta:** Medel (en uttalad frustration, men inte en tidstjuv)
- **Felbenägenhet:** —
- **Ägare:** Keramikern
- **AI-lämplighet:** **Medel–Hög** (förutsatt en exporterad försäljningsfil)
- **Kontextprofil:** Brett / bullrigt
- **Notering:** Shopify innehåller redan svaret — vilka serier, glasyrer och
  prisklasser som säljer. Keramikern tittar bara aldrig. Om datan exporteras
  (CSV/Excel) kan en agent läsa den och peka ut vad som ska göras mer av, lyftas
  i nyhetsbrevet och tas med till mässan. Det här momentet driver de två målen
  ("sälja mer av rätt saker") och kopplar ihop de andra: vad man skriver text om,
  vad man pushar i nyhetsbrevet, vad man packar till mässan.

### Kluster

#### Kluster A: Butikstexter & nyhetsbrev — prioritet 1
- **Ingående moment:** Skriva produkttexter (1), Skriva nyhetsbrev (4)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Båda är textproduktion i Lerverks egen röst, båda har samma
  råmaterial (veckans nya pjäser, vad som säljer). Produkttexterna äter kvällar;
  nyhetsbrevet uteblir helt. Samma agent kan göra båda eftersom rösten och
  underlaget är gemensamt — skriver man en bra produkttext har man redan
  råmaterialet till nyhetsbrevet. Direkt koppling till målet "få tillbaka kvällarna".

#### Kluster B: Kundmejl — prioritet 2
- **Ingående moment:** Svara på kundmejl (3)
- **Samlad AI-lämplighet:** **Medel–Hög**
- **Notering:** Den andra kvällstjuven. Frakt och skötselråd är repeterbara och
  faktabaserade — idealiska för utkastsförslag. Specialbeställningar kräver
  keramikerns omdöme och hålls medvetet på "föreslå struktur, inte beslut"-nivå.
  Står ensamt som kluster eftersom kontexten (kundrelation, ton mot köpare)
  skiljer sig från den utåtriktade butiksrösten i kluster A.

#### Kluster C: Försäljningsinsikt — prioritet 3
- **Ingående moment:** Förstå vad som säljer (7)
- **Samlad AI-lämplighet:** **Medel–Hög** (kräver exportfil)
- **Notering:** Det enda klustret som är riktningsgivande snarare än
  producerande — det avgör *vad* de andra två klustren ska handla om. Bred,
  något bullrig analys (mycket mellandata i en försäljningsexport). Eftersom
  det styr prioriteringen passar det hos VD snarare än som en isolerad
  producerande specialist (se skalning och proposal).

#### Under ribban
- **Fotografering (moment 2):** Fysiskt, visuellt hantverk. AI kan inte fota.
- **Mässplanering (moment 5):** Lågfrekvent (4–5/år) och brett. En egen agent
  skulle stå still mellan mässorna; hanteras som hatt av VD-assistenten.
- **Lager & material (moment 6):** Kräver system-/förrådsåtkomst agenten inte
  har i baslinjen, och smärtan är låg. Signalvärdet fångas i kluster C.

### Nedbrytning av toppkluster

#### Kluster A: Butikstexter & nyhetsbrev

**Moment: Skriva produkttext till en ny pjäs**

Delsteg:
1. Ta emot fakta om pjäsen (typ, mått, glasyr, teknik, känsla/inspiration)
2. Skriva utkast i Lerverks butiksröst (varm, hantverksnära, inte reklamig)
3. Anpassa längd och ton till Shopify-produktsida
4. Föreslå en kortare variant för Instagram-bildtext
5. Keramikern putsar och publicerar i Shopify

→ AI-lämplighet per steg: hög för 1–4, låg för 5 (kräver Shopify-inloggning)
→ Vad en agent konkret kan göra: leverera en publiceringsklar produkttext plus
  en Instagram-variant, i en röst som är konsekvent över hela butiken. Människan
  trycker på knappen.

**Moment: Skriva nyhetsbrev**

Delsteg:
1. Samla veckans/månadens nya pjäser och vad som sålt bra (från kluster C)
2. Välja en hållning/tema för brevet (ny serie, mässa på gång, säsong)
3. Skriva utkast i Lerverks röst med tydlig ingress och avslut
4. Föreslå ämnesrad och en bild-/produkturval
5. Keramikern klistrar in i Mailchimp och skickar

→ AI-lämplighet per steg: hög för 1–4, låg för 5 (Mailchimp-utskick)
→ Vad en agent konkret kan göra: förvandla "tom sida på söndag kväll" till ett
  färdigt utkast med ämnesrad. Tröskeln som gör att brevet uteblir försvinner.

#### Kluster B: Kundmejl

**Moment: Besvara ett kundmejl**

Delsteg:
1. Läsa mejlet och avgöra typ (frakt / skötselråd / specialbeställning / annat)
2. För frakt & skötsel: hämta rätt fakta ur en liten kunskapsbas
3. Formulera ett svarsutkast i vänlig, personlig ton
4. För specialbeställning: strukturera frågorna keramikern behöver ställa
   (önskemål, antal, ledtid, prisindikation) — utan att utlova pris/leverans
5. Keramikern granskar, justerar, skickar

→ AI-lämplighet per steg: hög för 1–3, medel för 4, låg för 5 (utskick + beslut)
→ Vad en agent konkret kan göra: ge ett färdigt svarsutkast för de återkommande
  frågorna och ett välordnat underlag för specialbeställningar. Keramikern fattar
  alla beslut om pris och ledtid och skickar själv.

### Kontextfaktorer

1. **En person gör allt.** Det finns ingen att delegera till idag — varje agent
   måste spara keramikerns egen kvällstid, annars är den meningslös.
2. **Tillverkningen är helig.** Hantverket är uttryckligt undantaget. Inget i
   teamet får röra design, glasyrval eller produktionen — bara allt runtomkring.
3. **Datan finns redan, men används inte.** Shopify vet vad som säljer; keramikern
   tittar aldrig. Den enda saknade pusselbiten är en export och någon som läser den.
4. **Röst är en tillgång.** En keramiker säljer på personlighet och hantverk.
   Varje text-agent måste skriva i Lerverks röst, inte generisk e-handelssvenska.

### Osäkerheter och motsägelser

1. **Exportformat för försäljning:** Kluster C/försäljningsinsikt förutsätter att
   keramikern kan exportera en fil (CSV/Excel) från Shopify. Inte bekräftat i
   intake. Proposal bör flagga.
2. **Specialbeställningar — hur långt får agenten gå?** Intake säger "rör inte
   tillverkningen", men en specialbeställning *är* en beställning av nytt
   hantverk. Gränsen mellan att strukturera ett kundmejl och att utlova en pjäs
   behöver klargöras. Flaggas.
3. **Mässplaneringens smärta är okänd.** Momentet nämns men flaggas inte som
   kläm. Om det visar sig ta mycket tid kan bilden ändras — fråga vid behov.

---

## 3. Skalningsbeslut

```
Skalningsbeslut: 4 agenter (VD + VD-assistent + 2 specialister)
Motivering: Solo → intervall 2–4. Research hittade 3 kluster över ribban.
Valde 4 för att butikstexter+nyhetsbrev och kundmejl motiverar var sin
specialist, medan försäljningsinsikt blir VD:ns operativa jobb i stället för
en tredje specialist (solo-taket är 4).
```

---

## 4. Team-förslag: Lerverk

Fyra agenter. VD operativ (inte teater), varje specialist motiverad av ett
konkret fynd ur Lerverks vecka.

### Studiochefen

**Jobb:** Läser veckans/månadens Shopify-försäljning, avgör vad som faktiskt
säljer och beslutar vad Lerverk ska göra mer av, lyfta i nyhetsbrevet och packa
till nästa mässa — och prioriterar kvällen när allt inte hinns med.

**Motivering:** "Vet inte vad som faktiskt säljer" + målet "sälja mer av rätt
saker" → research-kluster C (Försäljningsinsikt, moment 7). Det här är det enda
riktningsgivande momentet och det styr vad de andra agenterna ska handla om.
Eftersom solo-taket är 4 agenter blir det VD:ns operativa jobb snarare än en
egen specialist. Det löser CEO-teater-problemet: Studiochefen har ett konkret,
återkommande jobb (läsa försäljning, peka ut storsäljare, prioritera kvällen),
inte abstrakt strategi.

**Triggas av:** När en försäljningsexport laddas upp, i veckostarten när
keramikern undrar "vad ska jag fokusera på", inför ett nyhetsbrev ("vad ska vi
lyfta?") och inför en mässa ("vad ska jag ta med mest av?").

**Rör inte:** Tillverkningen, designval och glasyrval (heligt, per intake). Tar
inte heller över själva skrivandet (det är Butiksskribentens jobb) eller mejlen.

**Kapaciteter:**
- Läser en Shopify-försäljningsexport och rangordnar serier/glasyrer/prisklasser
  efter vad som faktiskt säljer
- Pekar ut vad som ska göras mer av och vad som inte bär sin plats i butiken
- Prioriterar veckans kvällar när produkttexter, mejl och nyhetsbrev krockar
- Ger Butiksskribenten en kort brief: vad nästa nyhetsbrev ska lyfta
- Ger en packprioritering inför mässa baserad på vad som sålt

**Föreslagna skills:**
- **xlsx** — keramikern exporterar försäljningsdata från Shopify; agenten behöver
  läsa och räkna på Excel-/CSV-filen för att avgöra vad som säljer (research,
  moment 7). Direkt kopplat till det enda momentet som driver båda målen.

**Skalningsnot:** Bär flera hattar — strateg, försäljningsanalytiker och
veckoprioriterare i ett. I ett större företag hade analysen varit en egen
specialist; i ett soloföretag är det rätt att VD gör det själv och därmed har
ett konkret operativt jobb.

---

### Veckopiloten (VD-assistent)

**Jobb:** Keramikerns dagliga arbetspartner — hjälper avgöra vad som ska göras
ikväll, skickar rätt uppgift till rätt specialist, och håller ihop de sällsynta
men spretiga sakerna (som mässplanering) som inte motiverar en egen agent.

**Motivering:** Solo betyder att det inte finns någon att fråga "var är jag, vad
gör jag härnäst?". Research visar två kvällstjuvar (texter, mejl) plus ett brev
som uteblir — det är ett prioriteringsproblem lika mycket som ett produktionsproblem.
Veckopiloten är den agent keramikern pratar med först, som triagerar till
Studiochefen, Butiksskribenten eller Kundpost.

**Triggas av:** "Vad borde jag göra ikväll?", när en ny uppgift dyker upp och det
är oklart vilken agent som äger den, inför en mässa (packlista/checklista), och
när keramikern vill stämma av läget.

**Rör inte:** Fattar inga försäljnings- eller prisbeslut (det är Studiochefens
respektive keramikerns), skriver inte de färdiga texterna själv (hänvisar vidare).

**Kapaciteter:**
- Föreslår en kvällsplan utifrån vad som är mest akut (ny produkt väntar på text,
  kundmejl ligger obesvarat, dags för nyhetsbrev)
- Triagerar inkommande uppgifter till rätt agent och säger när ingen behövs
- Bygger och uppdaterar packlista/checklista inför en mässa (hatt för moment 5)
- Märker när keramikern glider bort från målen "tillbaka kvällarna" / "rätt saker"
- Äger mötesfunktionen och kallar bara till möte när en enskild agent inte räcker

**Föreslagna skills:**
- Inga (arbetet är orientering och triage, inget filformat eller integration krävs).

**Skalningsnot:** Bär mässplaneringen som en hatt i stället för att den blir en
egen (lågfrekvent) agent. Vägrar kalla till "möte" när det egentligen bara är en
fråga för Butiksskribenten eller Kundpost.

---

### Butiksskribenten (specialist)

**Jobb:** Skriver säljande produkttexter i Lerverks röst för nya pjäser och
levererar färdiga nyhetsbrevsutkast, så att kvällarna inte går åt till skrivande
och nyhetsbrevet faktiskt blir av.

**Motivering:** "Produkttexter ... tar kvällarna" och "nyhetsbrevet blir sällan
av" → research-kluster A (moment 1 + 4). Båda är textproduktion i samma röst med
samma råmaterial (veckans pjäser + vad som säljer från Studiochefen), därför en
agent och inte två. Den enskilt största tidsåtervinningen mot målet "få tillbaka
kvällarna".

**Triggas av:** När en ny pjäs ska upp i butiken och behöver text, när det är
dags för nyhetsbrev, och när en Instagram-bildtext behövs till en ny produkt.

**Rör inte:** Beslut om vad som ska göras mer av (Studiochefen), kundmejl (Kundpost),
och självklart inte tillverkningen. Trycker aldrig själv på publish/skicka.

**Kapaciteter:**
- Skriver produkttexter i Lerverks röst (varm, hantverksnära, inte reklamig) i
  längd anpassad för Shopify-produktsida
- Levererar en kortare Instagram-variant av samma text
- Skriver färdiga nyhetsbrevsutkast med ämnesrad utifrån veckans pjäser och
  Studiochefens brief om vad som ska lyftas
- Håller butiksrösten konsekvent över alla texter (en liten röst-/stilguide)
- Föreslår produktrubriker och ingresser som lyfter material och teknik

**Föreslagna skills:**
- Inga (ren textproduktion i markdown; keramikern klistrar in i Shopify/Mailchimp).

**Skalningsnot:** Bär både produkttext och nyhetsbrev — i ett större team hade de
varit två agenter (butikstext vs. e-postmarknadsföring). För Lerverk är det rätt
att slå ihop eftersom rösten och underlaget är gemensamt.

---

### Kundpost (specialist)

**Jobb:** Skriver svarsutkast på kundmejl om frakt och skötselråd, och strukturerar
underlag för specialbeställningar — så att kvällarnas mejlhög krymper utan att
keramikern tappar kontrollen över pris och löften.

**Motivering:** "Kundmejl ... tar kvällarna" → research-kluster B (moment 3). Frakt-
och skötselfrågor är återkommande och faktabaserade; en agent kan svara på dem som
granskningsbara utkast. Skötselråd för keramik (diskmaskin, mikro, första
användning, krackelyr) är just den sortens stabila kunskap en agent håller bättre
reda på än en trött keramiker klockan elva.

**Triggas av:** När ett kundmejl ska besvaras — särskilt frakt- och skötselfrågor —
och när en specialbeställningsförfrågan kommer in och behöver struktureras.

**Rör inte:** Skickar aldrig mejl själv (utkast bara), fattar inga beslut om pris,
ledtid eller om en specialbeställning ska accepteras — det är keramikerns. Rör inte
tillverkningen som en specialbeställning kan innebära.

**Kapaciteter:**
- Klassar inkommande mejl (frakt / skötselråd / specialbeställning / annat)
- Skriver svarsutkast i vänlig, personlig ton för de återkommande frågorna
- Håller en liten kunskapsbas: fraktvillkor och skötselråd för Lerverks keramik
- Strukturerar specialbeställningar till en checklista keramikern fyller i
  (önskemål, antal, ledtid, prisindikation) utan att utlova något
- Prioriterar mejlhögen så att brådskande (väntande beställning) hamnar överst

**Föreslagna skills:**
- Inga (textsvar i markdown; ingen integration mot mejlsystem i baslinjen).

**Skalningsnot:** Bär hela kundkommunikationen som en agent. I ett större team hade
frakt-FAQ, skötselråd och specialorder kunnat delas; för Lerverk räcker en, så
länge den håller sig till utkast och låter keramikern besluta och skicka.

---

## 5. Avvisade

### Försäljningsanalys-agent (seriöst påtänkt som egen agent)
**Varför inte:** Kluster C var en stark kandidat för en egen specialist — datan
finns och momentet driver båda målen. Men solo-taket är 4 agenter, och en
producerande agent (text eller mejl) sparar mer kvällstid direkt. I stället för
att stryka värdet flyttades analysen till Studiochefen som dennes operativa jobb.
Det är fyndet som räddar VD från att bli teater. Om Lerverk växer kan analysen
brytas ut till en egen agent via `/update-team`.

### Mässplaneringsagent
**Varför inte:** 4–5 mässor per år är för lågfrekvent för en egen agent — den
skulle stå still mellan mässorna. Smärtan är dessutom okänd (inte flaggad i
intake). Packlistor och checklistor hanteras av Veckopiloten som en hatt när det
väl är dags.

### Fotoassistent
**Varför inte:** Produktfotografering är fysiskt, visuellt hantverk. En Claude-agent
kan varken ljussätta eller fota. Texten *runt* fotot tar Butiksskribenten; själva
bilden ligger utanför vad någon agent kan göra.

### Lager- & materialbevakning
**Varför inte:** Kräver realtidsåtkomst till Shopifys lagersaldo och keramikerns
materialförråd — system agenten inte når i baslinjen — och smärtan är låg. Att
låtsas "ha koll" utan åtkomst vore teater. Signalvärdet (vad som ska göras mer av)
fångas redan av Studiochefen.

---

## 6. Flaggat för användaren

- **Exportformat för försäljning** → Bekräfta att du kan exportera en CSV/Excel-fil
  från Shopify. Studiochefens och xlsx-skillens värde står och faller med det.
- **Specialbeställningar vs. "rör inte tillverkningen"** → En specialbeställning är
  i praktiken en beställning av nytt hantverk. Bekräfta gränsen: Kundpost
  strukturerar förfrågan, men du beslutar om pjäsen, priset och ledtiden.
- **Mässplaneringens omfattning** → Säg till om mässplanering tar mer tid än det
  låter — då kan Veckopilotens hatt växa till en egen säsongsagent vid nästa
  `/update-team`.

---

## 7. Divergens-självtest

Skulle den här uppsättningen kunna klistras in hos ett annat soloföretag i samma
bransch och fortfarande passa? Nej:

- **Studiochefen** läser en *Shopify-försäljningsexport* och prioriterar utifrån
  vad keramikern uttryckligen inte vet ("vad som faktiskt säljer"). En agent som
  bara "ger strategiska råd" hade passat överallt — den här gör inte det.
- **Butiksskribenten** skriver i *Lerverks* hantverksröst och slår ihop produkttext
  och nyhetsbrev just för att de delar råmaterial här — inte en generisk content-agent.
- **Kundpost** bär en kunskapsbas om *skötselråd för keramik* (diskmaskin, mikro,
  krackelyr) och en specialbeställnings-checklista — det är keramikerns mejlhög,
  inte en allmän support-agent.
- **Mässplaneringen** är medvetet en hatt, inte en agent, för att Lerverk gör 4–5
  mässor om året. Ett annat företag med veckovisa events hade fått ett annat svar.

Teamet är format efter Lerverks vecka. Det är svårt att förväxla med någon annans.

---

## Slut på testkörning

**Genererad:** 2026-06-28 (simulerad)
**Företag:** Lerverk (fiktivt)
**Pipeline:** team-builder (läge A, intervju), solo
**Status:** Alla steg körda för kvalitetsverifiering
