# Ai-consultant-körning: Marknadsbyrå X

Skarp körning av ai-consultant-pipelinen för en fiktiv marknadsbyrå på
mognadsnivå "van". Verifierar att pipelinen producerar ett team som är
omöjligt att förväxla med ett annat företags — även inom samma bransch.

**Datum:** 2026-07-15 (regenererad mot promptversion 2026-07-15)
**Testfall:** Marknadsbyrå, 8 personer, mognadsnivå van
**Pipeline:** ai-consultant — mognadsintake → research → skalning →
första projekt → team-förslag

---

## 1. Mognadsintake

```
företagsnamn:       Marknadsbyrå X
bransch:            Digital marknadsföring och content marketing (B2B)
storlek:            litet
antal_personer:     8
källa:              intervju
mognad:             van

## Vad företaget gör
Digital marknadsbyrå med fokus på content marketing och sociala medier.
Strategi, produktion och annonsering för B2B-kunder — mest tech och SaaS.
Åtta personer: byråchefen (grundare), projektledaren Emma Johansson, två
strateger, tre content creators och en annonsspecialist.

## Återkommande moment
Måndagar: veckoplanering med content-kalendrar för varje kund. Tisdag till
onsdag: produktion — de tre content creators hanterar 2–3 kunder var och
skriver bloggar, LinkedIn-poster och nyhetsbrev. Torsdag–fredag:
annonsoptimering och rapportarbete. Varje månadsskifte: en rapport per kund,
byggd för hand i Google Slides.

## Var det klämmer
"Det som tar mest tid är att varje kund vill ha sin egen ton och vi måste
komma ihåg vad vi bestämt med varje kund." Rapporteringen är "jobbig och
manuell" — 4–6 timmar per kund och månad i Google Slides. Alla använder
ChatGPT dagligen men var för sig, utan gemensamt system. Kvaliteten varierar
beroende på vem som skriver.

## Befintliga verktyg och vanor
Google Workspace (Docs, Sheets, Slides, Gmail). Notion för content-kalendrar
och kunddokument. ChatGPT (var sin licens, egna chatthistoriker). Midjourney
för bilder, ad hoc. Google Analytics, Google Ads och LinkedIn Campaign
Manager för annonser och mätning. Mailchimp för kundernas nyhetsbrev.
De flesta kunders bloggar ligger i WordPress.

## Mål och ambition
Ta fler kunder utan att anställa fler. Jämnare kvalitet — "just nu varierar
det beroende på vem som skriver". Efter en månad: "om vi producerar runt 30 %
mer content med samma personer och månadsrapporterna tar halva tiden".

## Mognadsbedömning
Nivå: van
Motivering: Alla åtta använder ChatGPT dagligen för utkast och brainstorming,
så nybörjare är de inte. Följdfrågan ställdes ("har ni skapat något som andra
i teamet använder?") — svaret var nej: var och en har sin egen chatthistorik,
och det enda gemensamma försöket (en promptbank i Notion) övergavs efter en
vecka. De har provat mycket men byggt inget. Det är definitionen av "van".

## Projektägare
Emma Johansson, projektledare. Hon har bäst koll på var det skaver i
produktionen och gör merparten av månadsrapporterna själv idag.

## Tidigare försök
En promptbank i Notion som alla uppmuntrades att använda. Övergiven efter en
vecka — ingen gick dit. Kundens egen analys: "alla ville ändå göra sin egen
grej". Slutsatsen är att en lösning måste ligga i själva arbetsflödet, inte
bredvid det.

## Framgångskriterium
"Om vi producerar runt 30 % mer content med samma personer och
månadsrapporterna tar halva tiden."

## Avgränsningar
Inget AI-genererat material går till kund utan att en människa har granskat
det. Kundkontakten och strategiarbetet sköter strategerna själva.
```

*Ser det rätt ut? → Bekräftat innan research kördes.*

---

## 2. Research: Marknadsbyrå X

### Körningsmetadata
- **Antal identifierade moment:** 8
- **Över ribban:** 3  |  **Under ribban:** 2
- **Källa intervju:** 7  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 3 moment
- **Språk:** Svenska

### Sammanfattning
Marknadsbyrå X producerar innehåll åt 7–9 B2B-kunder i veckan, där varje kund
ska ha sin egen ton — och just tonen är byråns dyraste huvudvärk: den bärs i
huvudet på den som skriver, vilket ger både tidsspill ("komma ihåg vad vi
bestämt") och ojämn kvalitet. Den andra uttalade smärtan är månadsrapporterna,
som byggs för hand i Google Slides på 4–6 timmar per kund. Research
identifierar tre kluster över ribban: innehåll i rätt kundton (störst volym,
hög AI-lämplighet), månadsrapportering (tydligast mätbar vinst, direkt kopplad
till framgångskriteriet) och annonsvariation (medel lämplighet, beroende av
systemåtkomst). Avgränsningen att en människa alltid granskar innan något går
till kund gäller alla förslag: agenter levererar utkast, aldrig publiceringar.

### Identifierade arbetsmoment

#### Moment 1: Skriva bloggposter åt kunder
- **Källa:** intervju
- **Frekvens:** Veckovis (2–3 poster per vecka totalt över kunderna)
- **Tidsåtgång:** ~6–8 timmar per vecka (tre creators, ~2 h per post)
- **Smärta:** Medel (intake: "kvaliteten varierar beroende på vem som skriver")
- **Felbenägenhet:** Medel — tonmissar är den vanliga felkällan
- **Ägare:** De tre content creators (delat)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Idealfall om kundens ton finns dokumenterad: ämne +
  tonguide in, utkast på 1 000–1 500 ord ut. Publiceringen i WordPress
  förblir manuell — människan granskar och publicerar.

#### Moment 2: Skriva LinkedIn-poster åt kunder
- **Källa:** intervju
- **Frekvens:** Dagligen (flera poster per creator och dag)
- **Tidsåtgång:** ~3–4 timmar per dag totalt
- **Smärta:** Medel (samma kvalitetsvariation som bloggarna)
- **Felbenägenhet:** Medel — kort format gör tonmissar extra synliga
- **Ägare:** De tre content creators (delat)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Hög volym, kort format — AI kan generera 3–5 varianter per
  ämne som creatorn väljer bland och justerar. Utan dokumenterad kundton
  blir det dock bara snabbare produktion av samma ojämnhet.

#### Moment 3: Skriva nyhetsbrev åt kunder
- **Källa:** intervju
- **Frekvens:** Varje eller varannan vecka per kund
- **Tidsåtgång:** ~1–2 timmar per nyhetsbrev
- **Smärta:** Okänd (nämns som moment, flaggas inte särskilt)
- **Felbenägenhet:** Låg — ofta mallstyrt
- **Ägare:** De tre content creators (delat)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Mallstyrd struktur (nyhet + relevans + CTA) gör detta till
  den enklaste texttypen att utkast-stödja. Utskicket sker i Mailchimp och
  förblir manuellt.

#### Moment 4: Hålla reda på varje kunds ton
- **Källa:** intervju
- **Frekvens:** Löpande — aktualiseras vid varje text och varje ny kund
- **Tidsåtgång:** Svår att mäta; kostnaden syns som omskrivningar och frågor
- **Smärta:** **Hög** (intake: "det som tar mest tid är att varje kund vill ha
  sin egen ton och vi måste komma ihåg vad vi bestämt med varje kund")
- **Felbenägenhet:** **Hög** — samma kund får olika röst beroende på skribent
- **Ägare:** Formellt strategerna, i praktiken ingen — det finns ingen process
- **AI-lämplighet:** **Medel–Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Inte ett produktionsmoment utan ett infrastrukturproblem:
  kunskapen om varje kunds röst är odokumenterad och personburen. AI är bra
  på precis den omvandlingen — destillera 10–20 publicerade texter till en
  strukturerad tonguide. Löses detta blir moment 1–3 både snabbare och
  jämnare.

#### Moment 5: Sammanställa månadsrapporter i Google Slides
- **Källa:** intervju
- **Frekvens:** Månadsvis, en rapport per kund (7–9 stycken)
- **Tidsåtgång:** 4–6 timmar per rapport → grovt 30–45 timmar per månad
- **Smärta:** **Hög** (intake: "jobbig och manuell"; halva tiden är uttalat
  framgångskriterium)
- **Felbenägenhet:** Låg — mekaniskt men tidsödande
- **Ägare:** Emma Johansson gör merparten själv
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Datan finns redan (Google Analytics, Google Ads, LinkedIn
  Campaign Manager); problemet är att *formulera och paketera* den. Ren
  syntesuppgift: siffror in, sammanfattning + tolkning + rekommendationer
  ut. Direkt träff på framgångskriteriet.

#### Moment 6: Optimera och variera annonser
- **Källa:** intervju
- **Frekvens:** Torsdag–fredag varje vecka
- **Tidsåtgång:** ~3–5 timmar per vecka
- **Smärta:** Okänd (listas som moment, flaggas inte som kläm)
- **Felbenägenhet:** Låg–medel
- **Ägare:** Annonsspecialisten
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Bullrigt (många varianter, data ur tre system)
- **Notering:** AI kan snabbt generera rubrik- och copyvarianter utifrån
  vad som presterat, men optimeringen sker i annonssystem som en agent inte
  når. Värdet finns i förslagsledet, inte i driften — och smärtan är inte
  uttalad.

#### Moment 7: Veckoplanering med content-kalendrar
- **Källa:** intervju
- **Frekvens:** Varje måndag
- **Tidsåtgång:** ~1–2 timmar (möte + förberedelse)
- **Smärta:** Okänd (etablerad rutin, inte flaggad)
- **Felbenägenhet:** Låg
- **Ägare:** Emma + creators + strateger
- **AI-lämplighet:** **Låg** som möte — men momentet bär byråns
  prioriteringsbeslut
- **Kontextprofil:** Brett
- **Notering:** Mötet ska inte bli en agent. Men det är här byråns vecka
  prioriteras: vilka kunder får vems timmar, och var spricker "fler kunder
  utan att anställa"? Ett operativt prioriteringsmoment — flaggas som
  VD-krok. Underlaget kan förberedas; beslutet är mänskligt.

#### Moment 8: Slutgranskning innan något går till kund
- **Källa:** `[implicit]` — följer av kvalitetsklämmen och avgränsningen
- **Frekvens:** Dagligen
- **Tidsåtgång:** ~1 timme per dag totalt, uppskattat
- **Smärta:** Medel (kvalitetsvariationen är en uttalad kläm)
- **Felbenägenhet:** Medel — tonmissar slinker igenom utan facit
- **Ägare:** Varierar — ofta den som skrev, ibland en strateg
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Välavgränsat
- **Notering:** Granskningen är uttryckligen fredad ("inget går till kund
  utan att en människa har granskat det"). Det agentbara — ett facit att
  granska mot — täcks redan av moment 4. **Under ribban.**

### Kluster

#### Kluster A: Innehåll i rätt kundton  — prioritet 1
- **Ingående moment:** Hålla reda på varje kunds ton (moment 4), Skriva
  bloggposter (moment 1), Skriva LinkedIn-poster (moment 2), Skriva
  nyhetsbrev (moment 3)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Momenten hänger ihop i en kedja: tonen är infrastrukturen,
  texterna är produktionen. Utan dokumenterad ton blir AI-utkast bara
  snabbare ojämnhet; med den träffas bägge målen ("30 % mer content" och
  "jämnare kvalitet") samtidigt. En agent här bygger tonguider ur publicerat
  material och skriver utkast mot dem.

#### Kluster B: Månadsrapportering  — prioritet 2
- **Ingående moment:** Sammanställa månadsrapporter (moment 5)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Enklare än kluster A (ingen tonvariation — rapporterna går i
  byråns egen röst), tydligast mätbar vinst: 4–6 timmar per rapport idag,
  halva tiden som uttalat framgångskriterium, en enda ägare (Emma). Datan
  finns redan strukturerad i tre system; uppgiften är syntes och paketering.

#### Kluster C: Annonsvariation  — prioritet 3
- **Ingående moment:** Optimera och variera annonser (moment 6)
- **Samlad AI-lämplighet:** **Medel**
- **Notering:** Värde i förslagsledet (copyvarianter utifrån vad som
  presterat), men driften sker i system agenten inte når och smärtan är
  inte uttalad. Står svagt som egen agent — vägs i proposal-steget.

#### Under ribban
- **Veckoplaneringen** (moment 7): Mänskligt möte. Prioriteringsinnehållet
  lyfts som VD-krok, men mötet blir aldrig en agent.
- **Slutgranskningen** (moment 8): Uttryckligen fredad — människan granskar.
  Det agentbara (ett facit att granska mot) täcks av kluster A.

### Nedbrytning av toppkluster

#### Kluster A: Innehåll i rätt kundton

**Moment: Hålla reda på varje kunds ton**

Delsteg:
1. Samla 10–20 publicerade texter per kund (bloggar, poster, nyhetsbrev)
2. Destillera tonmarkörer: ord att använda och undvika, meningsrytm,
   formell/ledig, typiska öppningar
3. Skriva en tonguide på 1–2 sidor per kund med gör/gör inte-exempel
4. Uppdatera guiden när en kund tillkommer eller byter riktning

→ AI-lämplighet per steg: hög för 1–4 — men lärdomen från promptbanken
  gäller: guiden måste komma till skribenten, inte tvärtom
→ Vad en agent konkret kan göra: bygga och underhålla en tonguide per kund
  och alltid skriva sina egna utkast mot den, så att guiden används varje
  gång utan att någon behöver leta upp den.

**Moment: Skriva bloggposter / LinkedIn-poster / nyhetsbrev**

Samma kedja för alla tre texttyperna: ämne ur content-kalendern (mänskligt
val) → tonguide + senaste publicerade texter in → utkast med
faktakollspunkter utmärkta → creatorn granskar, justerar och publicerar
(fredat). AI-lämpligheten är hög i mittstegen, låg i ändarna.
→ Vad en agent konkret kan göra: leverera granskningsklara utkast i rätt
  kundton. Creatorn går från blankt dokument till redigering — det är där
  30 %-målet hämtas hem.

#### Kluster B: Månadsrapportering

**Moment: Sammanställa månadsrapporter**

Delsteg:
1. Exportera månadens siffror ur de tre systemen (görs manuellt idag)
2. Jämföra mot föregående månad och mot kundens mål: vad rörde sig, varför
3. Skriva sammanfattning, tolkningar och rekommendationer för nästa månad
4. Bygga presentationen i Google Slides enligt kundens rapportmall
5. Emma granskar och skickar

→ AI-lämplighet per steg: låg för 1 (systemåtkomst), hög för 2–3, medel–hög
  för 4 (givet mall), låg för 5 (fredad granskning)
→ Vad en agent konkret kan göra: ta emot exporterna + förra månadens
  rapport som mall och leverera ett granskningsklart utkast —
  sammanfattning, trendtolkning, rekommendationer, sidstruktur. Emma går
  från byggare till granskare; 4–6 timmar blir realistiskt 1–2.

### Kontextfaktorer

1. **AI-användningen är utbredd men privat.** Åtta personer, åtta
   chatthistoriker, noll delad struktur. Teamets uppgift är inte att införa
   AI — den är att göra AI-användningen *gemensam och konsekvent*.
2. **Notion-promptbankens haveri är designfacit.** Lösningar som ligger
   bredvid arbetsflödet dör. Agenterna måste bära sin kunskap själva.
3. **Tonen är infrastruktur, inte produktion.** Snabbt när tonen är känd,
   långsamt när den är okänd — tonarbetet är en förutsättning för
   volymmålet.
4. **Rapportdatan finns redan.** Problemet är inte att skapa data utan att
   formulera den kundvärdigt. Ren syntesuppgift — AI:s hemmaplan.
5. **Avgränsningen styr all agentdesign.** Mänsklig slutgranskning och
   strategiägd kundkontakt betyder: varje agent levererar utkast och
   underlag, ingen agent publicerar eller kommunicerar med kund.
6. **Veckoplaneringen är byråns prioriteringsmoment.** "Fler kunder utan
   att anställa" avgörs i praktiken där — det motiverar en operativ
   VD-agent snarare än en strategisk.

### Osäkerheter och motsägelser

1. **Var bor tonbesluten idag?** Intake säger att man "måste komma ihåg
   vad vi bestämt med varje kund" — men inte var besluten antecknas (mejl?
   möten? huvuden?). Bekräfta att publicerat material speglar det man
   bestämt innan tonguider byggs av det.
2. **Vad betyder "30 % mer content" konkret?** Fler bloggar, fler poster,
   fler kunder på samma bemanning? Bör preciseras innan effekten mäts.
3. **Exportformat för rapportdatan.** De tre systemen exporterar olika. Ett
   överenskommet format behövs (kalkylblad per system räcker) — finns en
   exportrutin idag eller skapas den i första projektet?
4. **Adoption hos de tre creators.** Emma äger projektet, men creators är
   innehållsstödets dagliga användare. Utgår de från utkast, eller ser de
   det som sitt hantverk att skriva från blankt papper? Tidigare mönster
   ("alla ville göra sin egen grej") gör frågan verklig.

---

## 3. Skalningsbeslut

```
Skalningsbeslut: 4 agenter (VD + VD-assistent + 2 specialister)
Motivering: Litet team (8 personer) → intervall 4–7, justerat till 3–4 för
mognadsnivå van. Research hittade 3 kluster över ribban. Valde 4 så att de
två högst prioriterade klustren (innehåll i rätt kundton respektive
månadsrapportering) får var sin specialist, medan annonsvariation skjuts
till en senare version — medel lämplighet, ej uttalad smärta.
```

---

## 4. Första-projekt-identifiering

Körs efter research och korskörs mot de sex kriterierna i
`docs/first-project.md`. Alla sex måste vara uppfyllda — inte fem.

Tre moment kvalificerade sig för prövning: månadsrapporterna (hög smärta,
en ägare, uttalat framgångskriterium), tonguide för en pilotkund
(infrastrukturen bakom kluster A) och LinkedIn-utkast för en creators kunder
(högst frekvens i vardagen).

### Test mot de sex kriterierna

```
Kandidat: Månadsrapport-utkast (kluster B)

1. Litet i tid?      Ja — förra månadens data finns; två testrapporter
                     genereras och granskas inom en vecka.
2. Ägs av en person? Ja — Emma Johansson, som gör rapporterna idag.
3. Mätbart?          Ja — 4–6 timmar per rapport idag, mål under 2.
4. Fallback?         Ja — rapporterna byggs för hand som förut.
5. Underhållbart?    Ja — exporter + mallrapport in; Emma kan själv
                     justera mall och instruktioner.
6. Version 2?        Ja — fler kunder, sedan tonguide-projektet, sedan
                     automatiserad datahämtning.
```

```
Kandidat: Tonguide för en pilotkund (kluster A, infrastrukturdelen)

1. Litet i tid?      Ja — en kund, guide byggd ur publicerat material på
                     dagar, användbar vid nästa text.
2. Ägs av en person? Ja med reservation — naturlig ägare är en strateg,
                     men intake pekade bara ut Emma. Behöver utses.
3. Mätbart?          Ja, men mjukare — tonrelaterade omskrivningar
                     före/efter, tid från utkast till godkänt.
4. Fallback?         Ja — man fortsätter komma ihåg tonen som idag.
5. Underhållbart?    Ja — guiden är text, uppdateras vid riktningsbyte.
6. Version 2?        Ja — guider för alla kunder, sedan utkast skrivna
                     direkt mot guiderna.
```

```
Kandidat: LinkedIn-utkast för en creators kunder (kluster A, produktion)

1. Litet i tid?      NEJ — utan tonguide blir utkasten generisk text som
                     creatorn ändå skriver om. Kräver infrastrukturen först.
2. Ägs av en person? Ja — en utpekad creator.
3. Mätbart?          Ja — poster per vecka, tid per post.
4. Fallback?         Ja — skriva som idag.
5. Underhållbart?    Ja, givet att tonguiderna underhålls.
6. Version 2?        Ja — fler format, fler creators.
```

LinkedIn-kandidaten faller på kriterium 1 och stryks: den är rätt projekt,
men i fel ordning. Den blir naturlig version 2 efter tonguiderna.

Rangordning: månadsrapport-utkastet klarar alla sex utan reservation och
träffar framgångskriteriet ordagrant; tonguiden klarar alla sex men med
svagare ägarskap och mjukare mätbarhet — starkt andra projekt.

### Rekommendation: Månadsrapport-utkast

#### Problemet i era egna ord
"Rapporteringen är jobbig och manuell — 4–6 timmar per kund och månad i
Google Slides." Och framgångskriteriet: "om månadsrapporterna tar halva
tiden."

#### Varför just det här projektet
Ni promptar redan varje dag — det här projektet visar skillnaden mellan att
prompta och att bygga. En chattflik hjälper den som sitter i den, just då,
och glömmer allt till nästa gång. Det här är i stället ett system: agenten
kan er rapportmall, era kunder och ert upplägg, månad efter månad, utan att
någon klistrar in samma instruktioner igen. Datan finns redan, uppgiften är
ren syntes, och det finns exakt en ägare. Ingen annan kandidat träffar ert
framgångskriterium lika ordagrant.

#### Vad som ska vara sant efter vecka 1
- Två testrapporter (två olika kunder, förra månadens data) är genererade,
  granskade av Emma och bedömda mot de riktiga rapporterna
- Emma kan köra agenten själv, från export till utkast, utan hjälp
- Tiden per rapport är mätt, så att nästa månads siffra går att jämföra

#### Vem äger det
Emma Johansson, projektledare. Hon gör rapporterna idag, känner igen
problemet och kan avgöra själv om utkasten håller.

#### Hur vi mäter framgång
- **Tid per rapport:** 4–6 timmar idag → under 2 timmar inklusive granskning
- **Månadsvolym:** alla kunders rapporter klara utan kvälls- eller
  helgarbete vid månadsskiftet
- **Kvalitet:** utkastet kräver justering, inte omskrivning — under 30
  minuters redigering per rapport

#### Om det inte fungerar
Rapporterna byggs för hand i Google Slides, precis som idag. Ingen kund
märker något, ingenting i verksamheten står stilla.

#### Vad som kommer sen (version 2)
Först fler kunder in i samma flöde. Sedan tonguide-projektet (alternativet
nedan), som låser upp innehållsutkasten. Längre fram: automatiserad
datahämtning i stället för manuella exporter.

### Alternativ: Tonguide för en pilotkund

**Problemet i era egna ord:** "Det som tar mest tid är att varje kund vill
ha sin egen ton och vi måste komma ihåg vad vi bestämt med varje kund."

Välj en kund med mycket publicerat material, destillera en tonguide på 1–2
sidor, och låt alla tre creators skriva mot den i två veckor. Mät antalet
tonrelaterade omskrivningar. Klarar alla sex kriterierna, men ägarskapet
(en strateg) behöver utses och mätbarheten är mjukare än rapportprojektets.
Rekommenderas som projekt två — det är förutsättningen för att
innehållsutkasten ska ge verklig effekt.

---

## 5. Agentförslag: Marknadsbyrå X

Fyra agenter: en operativ VD byggd kring måndagsprioriteringen, en
VD-assistent som daglig arbetspartner, och två specialister mot de två
dyraste klustren.

En sak innan agenterna, eftersom ni redan är vana ChatGPT-användare: idag
promptar åtta personer var för sig. Det ni får här är byggda agenter — var
och en bär sin egen kunskap (er rapportmall, era kunders tonguider, er
veckorytm) så att ingen behöver återuppfinna sin prompt varje morgon. Er
Notion-promptbank dog för att den låg bredvid arbetet; agenterna är gjorda
för att ligga *i* arbetet.

### VD – Beläggningschefen

**Jobb:** Förbereder måndagens prioritering: vilka kunder får vems timmar
den här veckan, och var spricker "fler kunder utan att anställa" först.

**Motivering:** "Ta fler kunder utan att anställa fler" är byråns uttalade
mål, och research flaggade veckoplaneringen som momentet där det målet
avgörs i praktiken — tre creators timmar ska räcka till 7–9 kunder, varje
vecka. För ett företag med åtta anställda måste VD-agenten vara operativ:
den förbereder verkliga beslut om verkliga timmar.

**Perspektiv:** Ser byrån som ett fast antal creator-timmar som flera kunder
gör anspråk på samtidigt, och tittar på var det brister först. Där
Trafikledaren ser vad som faller mellan stolarna ser den här agenten
kapaciteten som en vägg man går in i — och utgår från att målet "fler kunder
utan att anställa" alltid spricker på en specifik person i en specifik vecka,
inte på byrån som helhet. Därför är frågan aldrig "har vi tid?" utan "vems tid,
vilken vecka?".

**Triggas av:** Måndagsmorgon inför veckoplaneringen, när en ny kund är på
väg in och kapaciteten ska bedömas, eller när två kunders deadlines krockar
om samma creators tid.

**Leverans:** En veckofördelning per creator, med var kapaciteten spricker och
vad som föreslås göras åt det.

Klart när:
- Fördelningen bygger på uppgivna åtaganden och tillgänglig tid — inget antaget om vem som hinner vad
- Konflikter är utpekade med person och vecka, inte som en allmän varning om hög belastning
- Varje konflikt har ett förslag: flytta, omfördela, eller säga till kunden
- Det framgår vad ett nytt kunduppdrag skulle tränga undan, om ett sådant är på väg in
- Rekommendationen är en och motiverad, inte en uppräkning av möjligheter

**Rör inte:** Strategiarbetet och kundkontakten (strategernas, enligt
avgränsningen). Fattar inte besluten — förbereder dem; måndagsmötet är
människornas.

**Kapaciteter:**
- Sammanställer ett veckounderlag: beläggning per creator, leveranser per
  kund, var det är trångt
- Flaggar när en ny kund inte ryms i befintlig kapacitet — innan offerten
  skrivs, inte efter
- Föreslår omprioriteringar när deadlines krockar, med synliga avvägningar
- Följer "fler kunder utan att anställa"-målet över tid: hur många kunder
  per creator klarar byrån nu jämfört med i våras?

**Föreslagna skills:** Inga.

**Skalningsnot:** Bär både kapacitetsplanering och måluppföljning — två
hattar som i en större byrå vore en produktionschef och en controller. Här
är det medvetet en operativ VD.

---

### VD-assistent – Trafikledaren

**Jobb:** Den agent byrån pratar med dagligen: vad är läget, vad är nästa
steg, och vilken agent ska ta vilken uppgift.

**Motivering:** "Alla använder ChatGPT dagligen men var för sig, utan
gemensamt system." VD-assistenten är det gemensamma systemet i praktiken —
en enda ingång som vet vilka agenter som finns och vem som bör göra vad. På
en byrå heter den rollen trafikledare: dirigerar flödet utan att själv
producera.

**Perspektiv:** Ser byrån som många parallella kunduppdrag med varsin
deadline, och tittar på överlämningarna — särskilt vid månadsskiftet, när
rapporter, fakturaunderlag och nya innehållsplaner infaller samtidigt. Där
kapacitetsagenten ser timmarna ser Trafikledaren vad som ligger och väntar på
någon annan, och utgår från att i en byrå som växer utan att anställa är det
inte arbetet som tappas utan överlämningen mellan två personer som båda tror
att den andra tagit vid.

**Triggas av:** Daglig avstämning, veckans check-in, när någon i teamet
inte vet vilken agent som ska ta en uppgift, eller när något är på väg att
falla mellan stolarna vid ett månadsskifte.

**Leverans:** Ett läge per kund med öppna punkter, ägare och nästa steg.

Klart när:
- Varje punkt har en namngiven ägare, eller står uttryckligen som utan ägare
- Det som väntar på någon annan är utmärkt som blockerat, med vem det väntar på
- Månadsskiftets fasta moment är med när de närmar sig, med datum där de går att härleda
- Inget kundnamn, deadline eller leverans är uppfunnen för att göra bilden komplett
- Nästa steg är EN sak per punkt, inte en lista att välja ur

**Rör inte:** Producerar inte innehåll och bygger inte rapporter (det gör
specialisterna). Fattar inte prioriteringsbeslut (VD förbereder,
människorna beslutar). Kommunicerar aldrig med kund.

**Kapaciteter:**
- Kör check-ins och håller en leverans-checklista per kund
  (kalender → utkast → granskat → publicerat)
- Pekar rätt: "det där är en fråga för Månadsrapportören" — så att teamet
  slipper hålla reda på vem som gör vad
- Bevakar månadsskiftet: påminner om exporter och rapporter innan Emma
  behöver jaga dem
- Samlar teamets feedback på agentutkasten ("Kundröstaren missade att kund
  X aldrig använder utropstecken") och för in den där den hör hemma
- Äger mötesfunktionen och kallar bara till möte när en enskild agent inte
  räcker

**Föreslagna skills:** Inga.

**Skalningsnot:** Bär också adoptionsbevakningen — ser vilka agenter som
faktiskt används och föreslår justeringar när mönstret är tydligt. I ett
större team vore det en egen utvärderingsroll.

---

### Kundröstaren

**Jobb:** Håller en tonguide per kund, byggd ur kundens publicerade
material, och skriver innehållsutkast — blogg, LinkedIn, nyhetsbrev — som
alltid går genom rätt guide.

**Motivering:** "Det som tar mest tid är att varje kund vill ha sin egen
ton och vi måste komma ihåg vad vi bestämt med varje kund" — plus
"kvaliteten varierar beroende på vem som skriver". Tonen är infrastrukturen
bakom hela kluster A: dokumenteras den blir alla tre texttyperna både
snabbare och jämnare. Guiden och utkasten ligger i samma agent med avsikt —
det var separationen som dödade promptbanken.

**Perspektiv:** Ser varje text som skriven i någon annans röst, och tittar på
vad som skulle avslöja att den inte är det. Där rapportagenten ser kundens
siffror ser den här agenten kundens språk — och utgår från att en byrå tappar
förtroende inte på svaga texter utan på texter som låter som byrån i stället
för som kunden. Därför är tonguiden viktigare än den enskilda texten: den är
det enda som gör att fyra creators kan skriva åt samma kund utan att det hörs
vem som höll i pennan.

**Triggas av:** När en creator ska skriva åt en kund ("blogg för kund X om
deras nya integration"), när en ny kund tas in och guiden ska byggas, eller
när en kund byter riktning och guiden ska uppdateras.

**Leverans:** Ett innehållsutkast som följer kundens tonguide — eller en
uppdaterad tonguide byggd ur kundens publicerade material.

Klart när:
- Utkastet är skrivet mot en namngiven tonguide, och det framgår vilken
- Inga påståenden om kundens produkt, kunder eller resultat som inte finns i underlaget
- Tonguiden vilar på citerade exempel ur kundens eget material, inte på omdömen som "professionell men personlig"
- Guiden säger också vad kunden ALDRIG säger — det är det som gör den användbar för någon som inte känner kunden
- Utkastet går till granskning som det står, utan kvarvarande luckor som inte är utmärkta som frågor

**Rör inte:** Publicerar aldrig — allt är utkast tills en människa har
granskat (avgränsningen). Väljer inte ämnen (content-kalendern är teamets).
Skriver inget som går direkt till kund.

**Kapaciteter:**
- Destillerar en tonguide per kund ur 10–20 publicerade texter: ord att
  använda och undvika, meningsrytm, gör/gör inte-exempel
- Skriver bloggutkast (1 000–1 500 ord) i kundens ton, med
  faktakollspunkter utmärkta för creatorn
- Genererar 3–5 LinkedIn-varianter per ämne att välja bland och justera
- Skriver nyhetsbrevsutkast enligt kundens Mailchimp-mall
- Flaggar tondrift: "kund X:s tre senaste poster är märkbart ledigare än
  guiden — medvetet eller dags att uppdatera?"

**Exempel**

> **Creator:** "LinkedIn-post för kund X om deras nya Fortnox-integration."
>
> **Kundröstaren:** "Tre varianter i X:s ton — saklig, inga utropstecken,
> alltid kundnytta före funktion. Variant 2 är kortast och passar deras
> mönster bäst. Faktakoll: jag har antagit att integrationen är dubbelriktad
> — stäm av det innan publicering."

**Föreslagna skills:** Inga — allt arbete är text, och källmaterialet är
redan publicerat innehåll.

**Skalningsnot:** Bär två hattar — tonbibliotekarie och utkastskribent —
som i ett större team vore en brand manager och flera copywriters.
Ihopslagna för att mognadstaket kräver det, och för att kombinationen är
poängen: guiden används automatiskt varje gång.

---

### Månadsrapportören

**Jobb:** Tar månadens KPI-exporter och en tidigare rapport som mall, och
levererar granskningsklara rapportutkast med sammanfattning, trendtolkning
och rekommendationer.

**Motivering:** "Rapporteringen är jobbig och manuell — 4–6 timmar per
kund och månad i Google Slides", och framgångskriteriet säger halva tiden.
Välavgränsat med hög AI-lämplighet: datan finns redan i de tre systemen,
uppgiften är att formulera och paketera den. Detta är också det
rekommenderade första projektet, med Emma som ägare.

**Perspektiv:** Ser varje siffra som något kunden ska kunna fatta ett beslut
på, och tittar på vad talet betyder snarare än vad det är. Där tonguiden ser
kundens röst ser rapportagenten kundens resultat — och utgår från att en
månadsrapport som bara redovisar utfall är den vanligaste anledningen till att
en byrå uppfattas som en leverantör i stället för en rådgivare. En förändring
utan förklaring är inte en insikt, och en rekommendation utan siffra bakom sig
är en gissning.

**Triggas av:** Månadsskiftet — Emma eller Trafikledaren lämnar över
månadens exporter per kund, agenten levererar utkast kund för kund.

**Leverans:** Ett granskningsklart rapportutkast per kund: sammanfattning,
trendtolkning och rekommendationer.

Klart när:
- Varje tal kommer ur den överlämnade exporten — inget avrundat, uppskattat eller kompletterat
- Varje förändring har en föreslagen förklaring, eller står uttryckligen som oförklarad
- Rekommendationerna är kopplade till en specifik siffra i rapporten
- Jämförelseperioden är utskriven, så att en säsongseffekt inte läses som en trend
- Utkastet följer den tidigare rapportens struktur, så att kunden känner igen sig
- Det som saknas i underlaget står som en lucka, inte som en nolla

**Rör inte:** Hämtar inte data själv (exporterna görs manuellt tills vidare
— medveten version 2). Skickar aldrig något till kund; Emma granskar varje
rapport (avgränsningen). Sätter inte kundens mål eller strategi.

**Kapaciteter:**
- Läser månadens exporter och jämför mot föregående månad och kundens mål
- Skriver sammanfattningen: vad rörde sig, varför, och vad det betyder för
  kunden
- Formulerar rekommendationer för nästa månad utifrån trenderna
- Bygger rapportutkastet enligt kundens befintliga rapportmall, sida för
  sida
- Flaggar avvikelser som förtjänar ett samtal snarare än en slide ("kund Y:s
  konverteringar föll 40 % — det bör strategen ringa om, inte rapportera")

**Föreslagna skills:**
- **xlsx** — KPI-exporterna landar som kalkylblad; agenten behöver läsa och
  räkna på dem direkt. Motiverat av rapportmomentets delsteg 1–2.
- **pptx** — rapporterna lever i Google Slides idag; pptx-utkast kan öppnas
  och färdigställas direkt där, så att Emma redigerar i stället för att
  bygga om. Motiverat av "manuellt i Google Slides varje månad".

**Skalningsnot:** Medvetet smal — gör en sak (rapportsyntes) hela vägen. Det
är första projektet, och ett smalt, mätbart uppdrag är vad som bygger
förtroendet resten av teamet ska stå på.

---

## 6. Avvisade

### Annonsvariations-agent
**Varför inte:** Seriöst påtänkt som tredje specialist — annonsarbetet
återkommer varje vecka och copyvarianter är en rimlig AI-uppgift. Den föll
på två saker: mognadstaket (van → 4 agenter totalt) rymmer bara de två
högst prioriterade klustren, och driften sker i annonssystem agenten inte
når, så värdet stannar i förslagsledet. Intake flaggade heller aldrig
annonserna som en kläm. Naturlig kandidat när teamet utvärderas.

### Egen agent per texttyp (blogg / LinkedIn / nyhetsbrev)
**Varför inte:** Tre texttyper kunde blivit tre agenter, men de delar exakt
samma förutsättning — kundens tonguide — och att splittra dem hade
återskapat dagens problem (samma kund, olika röster) fast mellan agenter i
stället för mellan människor. Ihopslagna i Kundröstaren.

### Veckoplanerings-agent
**Varför inte:** Mötet är människornas — taktisk prioritering och
diskussion. Underlaget är däremot VD-agentens jobb, så funktionen finns
kvar utan att mötet automatiseras.

### Slutgransknings-agent
**Varför inte:** Uttryckligen fredat i intake: inget går till kund utan
mänsklig granskning. Det agentbara — ett facit att granska mot — levereras
redan av Kundröstarens tonguider. Listas för att visa att avgränsningen
respekterats.

---

## 7. Flaggat för användaren

- **Var bor tonbesluten idag?** → Rekommendation: bekräfta att publicerat
  material speglar det ni faktiskt bestämt med varje kund, innan
  Kundröstaren bygger guider av det. Om viktiga tonbeslut bara finns i
  mejl eller huvuden — samla dem först.
- **"30 % mer content" behöver preciseras** → Rekommendation: bestäm om det
  betyder fler leveranser per kund eller fler kunder på samma bemanning.
  Det avgör hur effekten ska mätas och vilken agent som bär målet.
- **Exportrutin för rapportdatan** → Rekommendation: enas om ett format
  (ett kalkylblad per system räcker) som del av första projektets vecka 1.
- **Adoption hos creators** → Rekommendation: låt en creator vara med och
  forma Kundröstarens första tonguide. Er promptbank dog för att den
  infördes uppifrån — låt den som ska använda agenten äga en bit av den.

---

## 8. Divergens-självtest

Skulle den här uppsättningen kunna klistras in hos en annan marknadsbyrå
och fortfarande passa? Nej:

- **Kundröstaren** är byggd kring den här byråns specifika problem — en
  röst per kund, buren i huvudet på tre olika skribenter — och kring
  lärdomen från deras havererade Notion-promptbank. En byrå som marknadsför
  sitt *eget* varumärke har en enda röst och skulle aldrig få den agenten.
- **Månadsrapportören** utgår från exakt deras rapportrutin: Google Slides,
  4–6 timmar per kund, Emma som ägare, och ett framgångskriterium som
  ordagrant säger halva tiden.
- **VD:n** är byggd kring "fler kunder utan att anställa" och
  måndagsplaneringens kapacitetsklämma — inte en generisk strateg.
- Jämfört med de andra konsult-exemplen: bokföringsbyrån fick
  verifikationsklassificering och mejltriage, designstudion fick
  onboarding-paket och designrationale. Samma pipeline, tre företag, tre
  team som inte går att byta med varandra.

Teamet är knutet till Marknadsbyrå X:s egna fynd och ska vara omöjligt att
förväxla med ett annat företags — även en annan byrås.

---

**Genererad:** 2026-07-15 (simulerad körning, regenererad mot promptversion 2026-07-15)
**Företag:** Marknadsbyrå X (fiktivt)
**Pipeline:** ai-consultant — full körning (intake → research → skalning → första projekt → förslag)
**Status:** Alla steg genomförda för kvalitetsverifiering
