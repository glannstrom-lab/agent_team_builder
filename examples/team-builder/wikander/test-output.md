# Team-builder Pipeline Test: Wikander Översättning

Full körning av team-builder-pipelinen för ett fiktivt soloföretag. Syftet är
att verifiera att kärnan producerar ett team som är omöjligt att förväxla med
ett annat soloföretags — och att den explicita "rör inte"-gränsen respekteras.

Läge: team-builder (läge A, intervju). Storlek: solo (1 person).

---

## 1. Intake-sammanställning

```
företagsnamn:       Wikander Översättning
bransch:            Frilansöversättning (teknik & marknad, EN↔SV)
storlek:            solo
antal_personer:     1
källa:              intervju
```

### Vad företaget gör
En solo frilansöversättare som översätter teknik- och marknadstext EN↔SV för
översättningsbyråer och direktkunder.

### Återkommande moment
Skriva offerter på inkommande förfrågningar. Själva översättningen (kärnan,
gör jag själv). Terminologi- och bakgrundsresearch inför uppdrag.
Korrektur/kvalitetsgranskning av egen text. Kundkommunikation och fakturering.

### Var det klämmer
Offerter och terminologiresearch äter tid från det betalda arbetet, och
kundmejl hopar sig.

### Befintliga verktyg och vanor
CAT-verktyg (Trados), Word, eget fakturasystem.

### Mål och ambition
Fler fakturerbara timmar genom att korta förarbetet.

### Avgränsningar
Rör inte den slutliga översättningens språkliga bedömning —
kvalitetsansvaret ligger hos översättaren.

---

## 2. Research: Wikander Översättning

### Körningsmetadata
- **Antal identifierade moment:** 7
- **Över ribban:** 3  |  **Under ribban:** 3
- **Källa intervju:** 6  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 1 moment
- **Språk:** Svenska

### Sammanfattning
Wikander Översättning är en enmansverksamhet där den fakturerbara kärnan —
själva översättningen — utförs av översättaren själv och uttryckligen ska
skyddas. Smärtan ligger inte i kärnan utan i *förarbetet* runt den: att skriva
offerter på varje inkommande förfrågan och att göra terminologi- och
bakgrundsresearch inför uppdrag, två moment som intake säger "äter tid från det
betalda arbetet". Därtill hopar sig kundmejl. Research identifierar tre kluster
över ribban (offerthantering, terminologi-/bakgrundsresearch, kundmejl) och tre
moment under ribban — varav två faller på den uttryckliga "rör inte"-gränsen
(själva översättningen och den språkliga kvalitetsgranskningen) och ett på låg
AI-lämplighet (fakturering i eget system). Värdet för ett agent-team ligger
helt i att korta förarbetet så att fler timmar kan läggas på det fakturerbara.

### Identifierade arbetsmoment

#### Moment 1: Skriva offerter på inkommande förfrågningar
- **Källa:** intervju
- **Frekvens:** Flera gånger i veckan (varje inkommande förfrågan)
- **Tidsåtgång:** Märkbar — intake: "äter tid från det betalda arbetet"
- **Smärta:** Hög (explicit kläm)
- **Felbenägenhet:** Medel (felräknad volym/ordpris eller missad leveranstid kostar direkt)
- **Ägare:** Översättaren (ensam)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** En offert är strukturerad text med tydlig input (förfrågan: språkpar, ordvolym, ämne, deadline) och tydlig output (pris, leveranstid, villkor). Det finns rätt/fel-kriterier (ordpris × volym, kapacitet). En agent kan ta en inkommande förfrågan och producera ett offertutkast mot översättarens egna prislistor och tidigare offerter. Översättaren godkänner och skickar.

#### Moment 2: Själva översättningen (EN↔SV teknik/marknad)
- **Källa:** intervju
- **Frekvens:** Dagligen — verksamhetens kärna
- **Tidsåtgång:** Merparten av veckan (det fakturerbara arbetet)
- **Smärta:** Låg (det här är inte det som klämmer — det är det man vill ha *mer* tid till)
- **Felbenägenhet:** Låg (översättarens spetskompetens)
- **Ägare:** Översättaren (ensam, uttryckligt)
- **AI-lämplighet:** **Låg** — uttryckligt avgränsat
- **Kontextprofil:** Brett
- **Notering:** **Under ribban — och en hård gräns.** Intake: "Rör inte den slutliga översättningens språkliga bedömning — kvalitetsansvaret ligger hos översättaren." Kärnan görs i Trados av översättaren själv. Ingen agent ska föreslås här. Värdet skapas genom att *frigöra* tid till det här momentet, inte genom att ta över det.

#### Moment 3: Terminologi- och bakgrundsresearch inför uppdrag
- **Källa:** intervju
- **Frekvens:** Inför varje uppdrag (flera ggr i veckan)
- **Tidsåtgång:** Märkbar — intake: "äter tid från det betalda arbetet"
- **Smärta:** Hög (explicit kläm)
- **Felbenägenhet:** Medel (fel term tidigt fortplantar sig genom hela leveransen)
- **Ägare:** Översättaren (ensam)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Bullrigt
- **Notering:** Att bygga en termlista EN↔SV och en bakgrundsbrief inför ett uppdrag är textanalys och strukturering — Claude-styrkor. Profilen är bullrig: researchen genererar många mellanartefakter (kandidattermer, källcitat, ämnesanteckningar) som inte bör äta upp huvudkontexten. Bra kandidat för en *isolerad* agent. Viktig nyans: agenten *föreslår* termval; den slutliga termbedömningen är en del av den språkliga bedömningen som översättaren äger.

#### Moment 4: Korrektur/kvalitetsgranskning av egen text
- **Källa:** intervju
- **Frekvens:** Efter varje uppdrag
- **Tidsåtgång:** Måttlig (del av leveranscykeln)
- **Smärta:** Okänd (nämns som moment men inte som kläm i "var det klämmer")
- **Felbenägenhet:** Medel
- **Ägare:** Översättaren (ensam)
- **AI-lämplighet:** **Låg–Medel** — krockar med "rör inte"-gränsen
- **Kontextprofil:** Brett
- **Notering:** **Under ribban.** Här går en knivskarp linje. *Mekanisk* kontroll (sifferöverensstämmelse käll↔mål, taggar/platshållare, dubbla mellanslag, termkonsekvens mot egen termlista) är AI-lämplig — men den *språkliga* kvalitetsgranskningen är uttryckligen översättarens kvalitetsansvar och får inte automatiseras. En granskningsagent skulle ständigt stöta i den gränsen, och den rent mekaniska resten är för tunn för en egen agent. Den mekaniska konsekvenskontrollen mot termlistan kan istället ligga hos terminologi-agenten. Se Avvisade i proposal.

#### Moment 5: Kundkommunikation (kundmejl)
- **Källa:** intervju
- **Frekvens:** Dagligen
- **Tidsåtgång:** Måttlig men kumulativ — intake: "kundmejl hopar sig"
- **Smärta:** Medel (explicit kläm: hopar sig)
- **Felbenägenhet:** Låg
- **Ägare:** Översättaren (ensam)
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Brett
- **Notering:** Kundmejl är ofta korta, återkommande typer: bekräfta uppdrag, fråga om deadline, leveransbesked, statusuppdatering. En agent kan triagera inkorgen och föreslå svarsutkast som översättaren granskar och skickar. "Rör inte" gäller den språkliga bedömningen av *översättningen*, inte kundkommunikation — så mejl är tillåtet. Bred profil: hör naturligt hemma hos den operativa partnern snarare än hos en smal specialist.

#### Moment 6: Fakturering
- **Källa:** intervju
- **Frekvens:** Veckovis/månadsvis (per avslutat uppdrag)
- **Tidsåtgång:** Låg
- **Smärta:** Låg (nämns men inte som kläm)
- **Felbenägenhet:** Låg–medel
- **Ägare:** Översättaren (ensam)
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Välavgränsat
- **Notering:** **Under ribban.** Sker i ett eget fakturasystem som en agent inte kan nå. Momentet är dessutom snabbt och regelstyrt för en människa. En agent "som hjälper med faktureringen" utan systemåtkomst blir teater. Möjlig framtida v2 om/när systemet exponerar export eller API.

#### Moment 7: Veckoprioritering — beläggning och uppdragsval
- **Källa:** implicit
- **Frekvens:** Löpande/veckovis
- **Tidsåtgång:** Diffus (sker mellan uppdragen)
- **Smärta:** Medel (implicit i målet)
- **Felbenägenhet:** Medel (säga ja till fel uppdrag = förarbete utan god marginal)
- **Ägare:** Översättaren (ensam)
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Brett
- **Notering:** Implicit men välgrundat: målet är "fler fakturerbara timmar genom att korta förarbetet", och översättaren balanserar ständigt inkommande förfrågningar mot pågående betalt arbete. Det här är ett operativt prioriteringsmoment — vilka förfrågningar ska besvaras/antas, och hur skyddas översättningstiden. Motiverar VD-agentens *operativa* jobb (se proposal). Inget eget specialistkluster.

### Kluster

#### Kluster A: Offerthantering — prioritet 1
- **Ingående moment:** Skriva offerter på inkommande förfrågningar (moment 1)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Den tydligaste vinsten. Hög frekvens (varje förfrågan), explicit kläm, hög AI-lämplighet och välavgränsad input/output. En agent som vänder förfrågan → offertutkast på minuter istället för att avbryta det betalda arbetet träffar målet "korta förarbetet" rakt på.

#### Kluster B: Terminologi- och bakgrundsresearch — prioritet 2
- **Ingående moment:** Terminologi- och bakgrundsresearch inför uppdrag (moment 3)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Den andra explicita klämen. Bullrig kontextprofil → motiverar en *isolerad* agent som producerar termlista + bakgrundsbrief utan att skräpa ner huvudkontexten. Levererar en startklar terminologigrund så att översättaren går direkt in i kärnarbetet i Trados. Termförslag, inte termbeslut — den språkliga bedömningen stannar hos människan.

#### Kluster C: Kundmejl-hantering — prioritet 3
- **Ingående moment:** Kundkommunikation/kundmejl (moment 5)
- **Samlad AI-lämplighet:** **Medel**
- **Notering:** Verklig men bred och lägre i värde än A och B. Bred kontextprofil och låg specialiseringsgrad → hör hemma hos den operativa partnern (VD-assistenten), inte i en egen smal specialist. Slås in i VD-assistentens roll i proposal-steget.

#### Under ribban
- **Själva översättningen (moment 2):** Verksamhetens kärna och en uttrycklig "rör inte"-gräns. Ingen agent. Hela teamets existensberättigande är att frigöra tid *till* det här momentet.
- **Korrektur/språklig kvalitetsgranskning (moment 4):** Den språkliga bedömningen är översättarens kvalitetsansvar (uttryckligt). Endast mekanisk konsekvenskontroll är AI-lämplig, och den är för tunn för en egen agent — läggs hos terminologi-agenten.
- **Fakturering (moment 6):** Eget fakturasystem utan agentåtkomst, låg smärta, snabbt för människan. Möjlig v2.

### Nedbrytning av toppkluster

#### Kluster A: Offerthantering

**Moment: Skriva offerter på inkommande förfrågningar**

Delsteg:
1. Läsa inkommande förfrågan och extrahera nyckeldata (språkpar, ordvolym, ämne/teknik vs marknad, källformat, önskad deadline)
2. Slå upp tillämpligt ordpris/radpris mot egen prislista och liknande tidigare offerter
3. Bedöma kapacitet/leveranstid mot pågående uppdrag
4. Formulera offerten (pris, leveranstid, villkor, eventuella förbehåll)
5. Skicka och följa upp

→ AI-lämplighet per steg:
  - Steg 1–2: **Hög** — extraktion och uppslag mot kända prisregler
  - Steg 3: Medel — kräver kännedom om aktuell beläggning (kommer från VD)
  - Steg 4: **Hög** — strukturerad textgenerering
  - Steg 5: Låg — översättaren godkänner och skickar

→ Vad en agent konkret kan göra: ta en klistrad/vidarebefordrad förfrågan, räkna fram pris och leveranstid mot översättarens egna prislistor och visa ett färdigt offertutkast (gärna i Word) med motivering för varje post. Översättaren justerar marginal/ton, godkänner och skickar.

#### Kluster B: Terminologi- och bakgrundsresearch

**Moment: Terminologi- och bakgrundsresearch inför uppdrag**

Delsteg:
1. Läsa källmaterial/uppdragsbeskrivning och identifiera ämnesområde och facktermer
2. Bygga en kandidattermlista EN↔SV för de centrala begreppen
3. Verifiera termval mot kundens eventuella tidigare leveranser, branschkällor och befintliga termbaser
4. Skriva en kort bakgrundsbrief om ämnet/produkten så översättaren snabbt får kontext
5. Exportera termlistan i ett format som kan läsas in i Trados-arbetet

→ AI-lämplighet per steg:
  - Steg 1–2: **Hög** — textanalys och termutvinning
  - Steg 3: Medel–hög — beror på tillgång till tidigare leveranser/källor
  - Steg 4: **Hög** — sammanfattande textproduktion
  - Steg 5: Medel — formatering; människan läser in i Trados

→ Vad en agent konkret kan göra: producera en startklar EN↔SV-termlista med källhänvisning per term plus en bakgrundsbrief på en sida, så att översättaren slipper bygga terminologigrunden manuellt och kan gå rakt in i kärnarbetet. Termförslagen är just förslag — den slutliga termbedömningen tillhör översättaren.

### Kontextfaktorer

1. **Solo, en enda flaskhals:** En person gör allt. Varje minut i förarbete är en minut bort från det fakturerbara. Teamet ska därför vara smalt och varje agent ska direkt korta förarbetet.
2. **Skyddad kärna:** Den fakturerbara kärnan (översättningen) och dess språkliga bedömning är uttryckligen utanför teamets räckvidd. Det formar hela designen: agenterna sitter *runt* kärnan, aldrig i den.
3. **Trados är navet:** Det betalda arbetet sker i Trados. Agenterna levererar in i den arbetsgången (termlistor, brief, offert) men opererar inte CAT-verktyget åt översättaren.
4. **Eget fakturasystem utan åtkomst:** Begränsar vad ekonomi-/administrativa agenter kan göra — fakturering hålls medvetet utanför.
5. **Två kundtyper:** Översättningsbyråer (ofta egna förfrågnings-/prismallar) och direktkunder (mer förklaring behövs). Offert- och mejlhanteringen behöver kunna anpassa ton efter mottagartyp.

### Osäkerheter och motsägelser

1. **Korrektur faller mellan stolarna:** Moment 4 nämns som ett återkommande moment men inte som en kläm, och dess AI-lämpliga del (mekanisk kontroll) krockar med den uttryckliga "rör inte"-gränsen. Research håller det under ribban men proposal bör bekräfta med översättaren att den mekaniska termkonsekvens-kontrollen får ligga hos terminologi-agenten.
2. **Prisdata saknas:** Offert-agenten förutsätter att översättaren har dokumenterade ordpriser/prislogik. Intake bekräftar inte att en sådan prislista finns nedskriven. Proposal bör fråga.
3. **Beläggningsöverblick:** VD:s operativa jobb (kapacitet/uppdragsval) bygger på att översättaren håller någon form av koll på pågående uppdrag och deadlines. Var den informationen finns (Trados, kalender, huvudet) är okänt och påverkar hur konkret VD-agenten kan arbeta.

---

## 3. Skalningsbeslut

```
Skalningsbeslut: 4 agenter (VD + VD-assistent + 2 specialister)
Motivering: Storlek solo → intervall 2–4. Research hittade 3 kluster över
ribban. Valde 4 för att de två högst prioriterade klustren (offerthantering,
terminologiresearch) motiverar var sin egen agent, medan det bredare
kundmejl-klustret slås in i VD-assistentens operativa roll i stället för en
femte agent som skulle spränga solo-taket.
```

---

## 4. Agentförslag: Wikander Översättning

Fyra agenter. Alla fyra finns för att frigöra tid till det fakturerbara
kärnarbetet — ingen av dem rör kärnan eller den språkliga bedömningen.

### VD — Beläggning och uppdragsval

**Jobb:** Skyddar översättarens fakturerbara timmar genom att varje vecka väga inkommande förfrågningar mot pågående uppdrag och säga vilka som ska besvaras, antas eller nekas — och i vilken ordning förarbetet ska göras.

**Motivering:** "Fler fakturerbara timmar genom att korta förarbetet" (mål) + "offerter och terminologiresearch äter tid från det betalda arbetet" → research-moment 7 (veckoprioritering, beläggning/uppdragsval). För en solo-verksamhet är VD operativ, inte strategisk: jobbet är konkret resursvägning, inte abstrakt riktning.

**Triggas av:** När flera förfrågningar konkurrerar om samma vecka, när översättaren är osäker på om ett uppdrag ska antas, vid veckans planering, eller när offert- och researchagenten kör samtidigt och prioritetsordning behövs.

**Rör inte:** Själva översättningen och den språkliga bedömningen (översättarens kvalitetsansvar). Fakturering i det egna systemet. Att skicka offerter eller kundmejl utan översättarens godkännande.

**Kapaciteter:**
- Väger inkommande förfrågningar mot aktuell beläggning och rekommenderar anta/neka/senarelägg
- Sätter veckans prioritetsordning mellan förarbete (offert, research) och betalt kärnarbete
- Fattar avgörande när offert-agenten och kundmejl-triagen pekar åt olika håll (t.ex. ny brådskande förfrågan vs. pågående leverans)
- Bevakar att förarbetet faktiskt krymper över tid (timmar in i offert/research vs. fakturerbara timmar ut)
- Flaggar uppdrag med dålig marginal eller orimlig deadline innan offert ens skrivs

**Föreslagna skills:** Inga (operativt prioriteringsarbete kräver ingen extern skill).

**Skalningsnot:** Solo-VD bär flera hattar — kapacitetsplanerare, prioriterare och beslutsfattare i ett. I ett större översättningsföretag hade beläggning legat hos en projektledare; här måste VD ha det konkreta jobbet, annars blir agenten teater.

### VD-assistent — Operativ partner och kundmejl-triage

**Jobb:** Översättarens dagliga arbetspartner: orienterar ("var ligger jag, vad är nästa steg"), och håller den hopande kundinkorgen i schack genom att triagera mejl och skriva svarsutkast.

**Motivering:** "Kundmejl hopar sig" (kläm) → research-kluster C (kundmejl), som medvetet slogs in här i stället för en egen agent (bred kontextprofil, lägre värde). VD-assistenten är enligt `docs/team-roles.md` den agent man pratar mest med — naturlig ägare av den breda, löpande kommunikationen.

**Triggas av:** När inkorgen hopar sig, när ett kundmejl behöver ett svarsutkast (uppdragsbekräftelse, deadline-fråga, leveransbesked, statusuppdatering), vid daglig avstämning, eller när översättaren vill veta vad som väntar.

**Rör inte:** Den språkliga bedömningen av översättningar. Prissättning i offerter (det är offert-agentens och VD:s domän). Att skicka mejl utan godkännande. Fakturering.

**Kapaciteter:**
- Triagerar inkorgen och markerar vad som brådskar vs. kan vänta
- Skriver svarsutkast för återkommande mejltyper, med ton anpassad efter byrå vs. direktkund
- Sammanfattar dagens/veckans läge: pågående uppdrag, väntande svar, kommande deadlines
- Hänvisar rätt: skickar offertfrågor till offert-agenten, terminologifrågor till research-agenten, prioritetskonflikter till VD
- Märker när ett mönster återkommer (t.ex. samma kundfråga om och om) och föreslår en mall eller `/update-team`

**Föreslagna skills:** Inga (mejltriage och orientering sker i text utan externt format).

**Skalningsnot:** Bär kundmejl-hatten som annars hade blivit en egen agent. I ett större team hade kundkommunikation kunnat brytas ut till en egen koordinator; för en solo räcker en bred operativ partner.

### Offert-agent

**Jobb:** Vänder en inkommande förfrågan till ett färdigt offertutkast — pris, leveranstid och villkor — mot översättarens egna prislistor och tidigare offerter.

**Motivering:** "Skriva offerter på inkommande förfrågningar" + "offerter ... äter tid från det betalda arbetet" → research-kluster A (prioritet 1, hög AI-lämplighet, välavgränsat). Den enskilt tydligaste vinsten för att korta förarbetet.

**Triggas av:** När en ny förfrågan kommer in (klistrad eller vidarebefordrad) och ett offertutkast behövs — typiskt flera gånger i veckan.

**Rör inte:** Själva översättningen. Att skicka offerten (översättaren godkänner och skickar). Slutgiltigt antagningsbeslut vid kapacitetskonflikt (det avgör VD).

**Kapaciteter:**
- Extraherar nyckeldata ur en förfrågan (språkpar, ordvolym, ämne, källformat, deadline)
- Räknar fram pris mot egen prislista/radpris och stämmer av mot liknande tidigare offerter
- Föreslår realistisk leveranstid (och flaggar till VD när beläggningen är oklar)
- Producerar ett färdigt offertutkast med motivering per post, i ton anpassad efter byrå vs. direktkund
- Lyfter förbehåll (oklart underlag, snäv deadline, ovanligt ämne) innan offerten går iväg

**Föreslagna skills:**
- docx — Offerter levereras formellt och översättaren arbetar redan i Word (intake: "Word"). Agenten kan leverera offertutkastet som ett färdigt Word-dokument redo att skicka.

**Skalningsnot:** Smal och vass med flit — den gör bara offert, inte kundmejl eller prissättningsstrategi. I en solo-verksamhet är just det här momentet frekvent och kostsamt nog att bära en helt egen agent.

### Terminologi- och bakgrundsresearcher

**Jobb:** Bygger en startklar EN↔SV-termlista och en kort bakgrundsbrief inför ett uppdrag, så att översättaren går direkt in i kärnarbetet i Trados.

**Motivering:** "Terminologi- och bakgrundsresearch inför uppdrag" + "terminologiresearch äter tid från det betalda arbetet" → research-kluster B (prioritet 2, hög AI-lämplighet, **bullrig** kontextprofil). Bullrigheten motiverar en *isolerad* agent som håller alla mellanartefakter (kandidattermer, källcitat) borta från huvudkontexten.

**Triggas av:** När ett nytt uppdrag är på väg in och terminologigrunden behöver byggas — särskilt vid tekniskt eller ämnestungt material.

**Rör inte:** Den slutliga termbedömningen och den språkliga bedömningen — agenten *föreslår* termer, översättaren *beslutar*. Själva översättningen i Trados.

**Kapaciteter:**
- Läser källmaterial/uppdragsbeskrivning och identifierar ämnesområde och facktermer
- Bygger en kandidattermlista EN↔SV med källhänvisning per term
- Skriver en bakgrundsbrief på en sida om ämnet/produkten för snabb kontext
- Kör mekanisk termkonsekvens-kontroll mot den egna termlistan i färdig text (den mekaniska resten av moment 4 — *inte* den språkliga granskningen)
- Exporterar termlistan i ett format som kan läsas in i Trados-arbetsgången

**Föreslagna skills:**
- file-reading — Källmaterial inför uppdrag kommer i blandade format (Word, PDF) från byråer och direktkunder; agenten behöver kunna öppna och extrahera termer ur dem för att bygga termlistan.

**Skalningsnot:** Isolerad med flit — den producerar mycket mellanmaterial som inte ska äta huvudkontexten. Bär också den mekaniska biten av korrektur (termkonsekvens) som annars hade blivit en egen, för tunn, granskningsagent.

---

## 5. Avvisade

### Kvalitetsgransknings-/korrekturagent
**Varför inte:** Seriöst påtänkt som egen agent — korrektur är ett uttryckligt återkommande moment och att korta det skulle också frigöra tid. Den faller ändå på den uttryckliga "rör inte"-gränsen: den slutliga språkliga bedömningen är översättarens kvalitetsansvar och får inte automatiseras. Det som *är* AI-lämpligt (mekanisk kontroll av siffror, taggar, termkonsekvens) är för tunt för en egen agent och läggs i stället hos terminologi-researchern. En egen granskningsagent skulle ständigt stöta i den skyddade gränsen — sämre design än att hålla den mekaniska resten där termlistan redan finns.

### Kundmejl-agent (egen specialist)
**Varför inte:** Verkligt kluster (mejl hopar sig) men bred kontextprofil och lägre värde än offert och research. Att ge den en egen agent hade krävt en femte agent och sprängt solo-taket (2–4). Slås i stället in i VD-assistentens operativa roll, där den löpande kommunikationen naturligt hör hemma.

### Faktureringsagent
**Varför inte:** Faktureringen sker i ett eget fakturasystem som en agent inte kan nå, smärtan är låg och momentet är snabbt och regelstyrt för en människa. En faktureringsagent utan systemåtkomst vore teater. Möjlig v2 om systemet exponerar export/API.

### Översättningsagent
**Varför inte:** Verksamhetens fakturerbara kärna och en uttrycklig "rör inte"-gräns. Hela teamets syfte är att frigöra tid *till* det här momentet — inte att ta över det.

---

## 6. Flaggat för användaren

- **Prislista saknas i intake** → Rekommendation: bekräfta att översättaren har dokumenterade ordpriser/prislogik som offert-agenten kan räkna mot. Utan den blir offertutkasten gissningar.
- **Mekanisk termkontroll vs. "rör inte"** → Rekommendation: bekräfta att den mekaniska konsekvenskontrollen (siffror, taggar, termkonsekvens mot egen termlista) får ligga hos terminologi-researchern, samtidigt som all *språklig* bedömning förblir översättarens.
- **Beläggningsöverblick okänd** → Rekommendation: klargör var info om pågående uppdrag/deadlines finns (Trados, kalender, annat), så VD-agentens kapacitetsvägning blir konkret i stället för abstrakt.

---

## 7. Divergens-självtest

Skulle exakt det här teamet passa ett annat soloföretag? Nej:

- VD:ns operativa jobb är *beläggning och uppdragsval för en översättare som
  väger förfrågningar mot pågående leveranser* — inte generisk prioritering.
- Offert-agenten räknar mot *ordpris/volym/språkpar* och levererar i Word —
  en offertlogik som är specifik för översättningsbranschen, inte vilken
  offert som helst.
- Terminologi-researchern bygger *EN↔SV-termlistor och bakgrundsbrief in i
  Trados-arbetsgången* med bullrig profil och isolerad design — det här är
  en översättarspecifik artefakt.
- Hela teamet är byggt *runt* en skyddad, icke rörbar kärna (själva
  översättningen och dess språkliga bedömning). Den gränsen syns i varje
  agents "Rör inte" och i två av tre avvisanden.

Teamet är omöjligt att förväxla med t.ex. en bokföringsbyrås eller en
e-handlares team.

---

## End of Test Output

**Genererad:** 2026-06-28 (simulerad)
**Kund:** Wikander Översättning (fiktiv)
**Pipeline:** team-builder (full körning, läge A intervju, solo)
**Status:** Alla steg genomförda för kvalitetsverifiering
</content>
</invoke>
