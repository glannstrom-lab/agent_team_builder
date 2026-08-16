# Team-builder-körning: Norrskenspodden

Skarp körning av team-builder-pipelinen (läge A, intervju) för ett fiktivt
soloföretag. Verifierar att pipelinen producerar ett team som är omöjligt att
förväxla med ett annat soloföretags.

---

## 1. Intake-sammanställning

```
företagsnamn:       Norrskenspodden
bransch:            Poddproduktion (veckopodd om friluftsliv), sponsor- + Patreon-finansierad
storlek:            solo
antal_personer:     1
källa:              intervju

## Vad företaget gör
En solo poddproducent som gör en veckopodd om friluftsliv. Tjänar pengar på
sponsorer och Patreon.

## Återkommande moment
Research inför avsnitt. Skriva shownotes och avsnittsbeskrivningar. Klippa
avsnittet (gör själv). Hitta och följa upp sponsorer. Posta klipp på sociala
medier. Svara på lyssnarmejl.

## Var det klämmer
Shownotes och beskrivningar tar tid. Sponsoruppföljning glöms bort (förlorade
intäkter). Sociala medier hinns aldrig med.

## Befintliga verktyg och vanor
Riverside (inspelning), egen RSS / Acast (publicering), Instagram/TikTok,
Patreon.

## Mål och ambition
Fler sponsorer och växa Patreon — utan att jobba kvällar.

## Avgränsningar
Rör inte själva klippningen/ljudet. Rör inte det redaktionella röstvalet.
```

*Ser det rätt ut? → Bekräftat innan research kördes.*

---

## 2. Research: Norrskenspodden

### Körningsmetadata
- **Antal identifierade moment:** 7
- **Över ribban:** 3  |  **Under ribban:** 2
- **Källa intervju:** 6  |  **Implicita:** 1  |  **Hypoteser:** 0
- **Okänd smärta:** 3 moment
- **Språk:** Svenska

### Sammanfattning
Norrskenspodden är en enpersonsverksamhet som producerar en veckopodd om
friluftsliv och lever på sponsorer och Patreon. Den största tidstjuven är att
skriva shownotes och avsnittsbeskrivningar varje vecka; det som faktiskt
kostar pengar är att sponsoruppföljningen glöms bort; och det som aldrig blir
gjort är sociala medier. Research identifierar tre kluster över ribban —
avsnittstext & paketering (hög AI-lämplighet, störst tidsbesparing),
sponsor- & Patreon-uppföljning (störst direkt intäktspåverkan) och social
distribution (begränsad av att klippning är avgränsad). Själva ljudklippet och
det redaktionella röstvalet är uttryckligt fredat och hålls utanför allt
agentförslag.

### Identifierade arbetsmoment

#### Moment 1: Researchunderlag inför avsnitt
- **Källa:** intervju
- **Frekvens:** Veckovis (ett avsnitt/vecka)
- **Tidsåtgång:** Märkbar, ej kvantifierad i intake
- **Smärta:** Okänd (nämns som moment, flaggas inte som kläm)
- **Felbenägenhet:** Låg
- **Ägare:** En person (producenten)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Brett
- **Notering:** Friluftsliv är ett ämnesfält där Claude kan ta fram
  faktaunderlag, vinklar, frågelistor och säsongsanpassade uppslag (utrustning,
  vandringsleder, väder, säkerhet) som producenten sedan redaktionellt väljer
  bland. Levererar förberedelse-material, inte färdiga redaktionella beslut —
  röstvalet är fredat.

#### Moment 2: Skriva shownotes och avsnittsbeskrivningar
- **Källa:** intervju
- **Frekvens:** Veckovis (varje publicerat avsnitt)
- **Tidsåtgång:** Hög — uttrycklig tidstjuv ("tar tid")
- **Smärta:** **Hög** (intake: "shownotes och beskrivningar tar tid")
- **Felbenägenhet:** Låg
- **Ägare:** En person (producenten)
- **AI-lämplighet:** **Hög**
- **Kontextprofil:** Välavgränsat
- **Notering:** Det här är idealfallet för en agent: input är ett färdigt,
  redan klippt avsnitt (Riverside ger transkript), output är ren text i ett
  återkommande format. Tydligt start- och slutresultat, körs varje vecka,
  uttalad smärta. Människan godkänner innan publicering via Acast/RSS.

#### Moment 3: Klippa avsnittet och ljudbearbeta
- **Källa:** intervju
- **Frekvens:** Veckovis
- **Tidsåtgång:** Hög
- **Smärta:** Okänd (uttryckligen något producenten vill göra själv)
- **Felbenägenhet:** Låg
- **Ägare:** En person (producenten), uttryckligen
- **AI-lämplighet:** **Låg**
- **Kontextprofil:** Bullrigt
- **Notering:** Avgränsat av intake ("rör inte själva klippningen/ljudet") och
  dessutom låg AI-lämplighet — ljudredigering ligger utanför vad en
  Claude-agent kan göra. **Under ribban.** Listas för fullständighet, blir
  aldrig en agent.

#### Moment 4: Hitta och följa upp sponsorer
- **Källa:** intervju
- **Frekvens:** Löpande / veckovis
- **Tidsåtgång:** Ej kvantifierad, men intäktskritisk
- **Smärta:** **Hög** (intake: "sponsoruppföljning glöms bort (förlorade
  intäkter)")
- **Felbenägenhet:** **Hög** — det som glöms bort är hela problemet
- **Ägare:** En person (producenten)
- **AI-lämplighet:** **Medel–Hög**
- **Kontextprofil:** Bullrigt (många trådar, lägen, datum att hålla reda på)
- **Notering:** Själva "att inte glömma" är ett tillstånds-/spårningsproblem —
  en agent som äger en sponsorpipeline (vem är kontaktad, vad väntar på svar,
  när är nästa uppföljning, när löper avtalet ut) löser kärnsmärtan. Att skriva
  utskick och uppföljningsmejl är hög AI-lämplighet. Att *skicka* dem och att
  förhandla pris förblir hos människan. Knyter direkt till målet "fler
  sponsorer".

#### Moment 5: Posta klipp på sociala medier
- **Källa:** intervju
- **Frekvens:** Borde vara veckovis/flera ggr/vecka — sker i praktiken sällan
- **Tidsåtgång:** Hinns aldrig med
- **Smärta:** **Hög** (intake: "sociala medier hinns aldrig med")
- **Felbenägenhet:** N/A (utförs inte)
- **Ägare:** En person (producenten)
- **AI-lämplighet:** **Medel** — delad
- **Kontextprofil:** Brett
- **Notering:** Viktig nyans: själva *klippningen* av videoklipp till
  Instagram/TikTok är ljud-/videoredigering — avgränsat och låg AI-lämplighet.
  Det som däremot går att lyfta är textdelen: hitta citatvärda avsnitt i
  transkriptet, skriva hooks/bildtexter, föreslå publiceringsschema och
  haka-på-säsong-vinklar. Den AI-lämpliga textbiten överlappar med moment 2
  (samma transkript) — vägs i kluster-steget.

#### Moment 6: Svara på lyssnarmejl
- **Källa:** intervju
- **Frekvens:** Veckovis
- **Tidsåtgång:** Liten–medel
- **Smärta:** Okänd (listas neutralt, inte bland de tre klämmen)
- **Felbenägenhet:** Låg
- **Ägare:** En person (producenten)
- **AI-lämplighet:** **Låg–Medel**
- **Kontextprofil:** Brett
- **Notering:** Lyssnarmejl är personlig dialog mellan poddröst och lyssnare —
  nära det fredade redaktionella röstvalet. Volym i en solopodd är dessutom
  sällan stor. Kan triageras/utkast-stödjas av VD-assistenten vid behov, men
  motiverar ingen egen agent. **Under ribban** som självständigt kluster.

#### Moment 7: Växa och underhålla Patreon
- **Källa:** implicit (härlett ur målet "växa Patreon")
- **Frekvens:** Löpande
- **Tidsåtgång:** Okänd
- **Smärta:** Okänd (mål, inte uttalad kläm)
- **Felbenägenhet:** Medel
- **Ägare:** En person (producenten)
- **AI-lämplighet:** **Medel**
- **Kontextprofil:** Brett
- **Notering:** `[implicit]` — viktas lägre. Patreon-tillväxt hänger
  affärsmässigt ihop med sponsorintäkter (båda är monetisering av samma
  publik): bonusinnehåll-idéer, nivå-/förmånsupplägg, behålla patroner,
  texter till patroner. Ren produktion av Patreon-innehåll gränsar mot det
  fredade röstvalet; det agentbara är planering, struktur och utkast.

### Kluster

#### Kluster A: Avsnittstext & paketering  — prioritet 1
- **Ingående moment:** Skriva shownotes & avsnittsbeskrivningar (moment 2),
  Researchunderlag inför avsnitt (moment 1), textdelen av sociala klipp
  (del av moment 5)
- **Samlad AI-lämplighet:** **Hög**
- **Notering:** Allt textarbete som omger ett avsnitt — före (researchunderlag)
  och efter (shownotes, beskrivning, bildtexter). Hänger ihop för att samma
  källa (avsnittets ämne och transkript) matar allt. Störst tidsbesparing och
  uttalad kläm ("tar tid"). En agent kan ta ett klippt avsnitt och leverera
  publiceringsklar text i Norrskenspoddens format. Röstvalet förblir hos
  människan: agenten skriver utkast, producenten väljer ton.

#### Kluster B: Sponsor- & Patreon-uppföljning  — prioritet 2
- **Ingående moment:** Hitta & följa upp sponsorer (moment 4), Växa/underhålla
  Patreon (moment 7, `[implicit]`)
- **Samlad AI-lämplighet:** **Medel–Hög**
- **Notering:** Båda är monetisering av samma publik och delar kärnmekanik:
  hålla reda på relationer och följa upp i tid. Det som "glöms bort" är ett
  spårningsproblem — en agent som äger en pipeline och triggar uppföljningar
  löser den dyraste smärtan (förlorade intäkter) och adresserar målet direkt.
  Bullrig kontextprofil (många trådar, datum) → talar för en agent som äger
  sin egen kontext.

#### Kluster C: Social distribution  — prioritet 3
- **Ingående moment:** Posta klipp på sociala medier (moment 5)
- **Samlad AI-lämplighet:** **Medel** (hög på text, låg/avgränsad på klippning)
- **Notering:** Den AI-lämpliga delen (hitta citat, skriva hooks/bildtexter,
  schema) är ren text som redan kan komma ur kluster A:s transkript. Den
  icke-AI-lämpliga delen (klippa själva videon) är avgränsad. Klustret står
  därför svagt som *egen* agent — vägs mot ihopslagning i skalnings- och
  proposal-steget.

#### Under ribban
- **Klippa avsnittet och ljudbearbeta** (moment 3): Avgränsat av intake
  ("rör inte klippningen/ljudet") och låg AI-lämplighet. Blir aldrig en agent.
- **Svara på lyssnarmejl** (moment 6): Smärta ej flaggad, låg volym i en
  solopodd, ligger nära det fredade röstvalet. Triageras vid behov av
  VD-assistenten, ingen egen agent.

### Nedbrytning av toppkluster

#### Kluster A: Avsnittstext & paketering

**Moment: Skriva shownotes och avsnittsbeskrivningar**

Delsteg:
1. Läsa transkript/anteckningar från det färdigklippta avsnittet (Riverside)
2. Skriva avsnittsbeskrivning för Acast/RSS i poddens format
3. Skriva shownotes med tidsstämplar, omnämnda produkter/leder/gäster och
   eventuella länkar
4. Lägga in ev. sponsoromnämnande och Patreon-CTA på rätt ställe
5. Publicera via Acast/RSS

→ AI-lämplighet per steg: hög för 1–4, låg för 5 (kräver publiceringsåtkomst)
→ Vad en agent konkret kan göra: leverera publiceringsklar beskrivning +
  shownotes med tidsstämplar och länkar, samt en färdig social-text-bunt från
  samma transkript. Människan justerar ton och trycker på publicera.

**Moment: Researchunderlag inför avsnitt**

Delsteg:
1. Ta emot avsnittets ämne (t.ex. vinterpackning, en specifik led, en gäst)
2. Ta fram fakta, säkerhetsaspekter, säsongsvinklar och möjliga frågor
3. Strukturera till ett kort underlag producenten kan välja redaktionellt ur

→ AI-lämplighet per steg: hög för 1–3
→ Vad en agent konkret kan göra: ett friluftsspecifikt researchunderlag per
  avsnitt. Väljer inte vinkel åt producenten — föreslår, producenten beslutar.

#### Kluster B: Sponsor- & Patreon-uppföljning

**Moment: Hitta och följa upp sponsorer**

Delsteg:
1. Hålla en pipeline: prospekt → kontaktad → väntar svar → avtalad → löper ut
2. Trigga "dags att följa upp X" innan det glöms bort
3. Skriva utkast till första-kontakt och uppföljningsmejl till friluftsmärken
4. Ta fram ett enkelt media kit (lyssnarsiffror, format, priser) att skicka
5. Människan granskar, prissätter och skickar

→ AI-lämplighet per steg: hög för 1–4, låg för 5 (utskick + prisbeslut = människa)
→ Vad en agent konkret kan göra: äga sponsorpipelinen så inget faller mellan
  stolarna, och leverera färdiga utkast + media kit. Att inte glömma är hela
  poängen — det är den dyra smärtan.

### Kontextfaktorer

1. **Solo betyder breda uppdrag.** En person, en kalender. Agenter måste bära
   flera hattar; specialisering på smala nischer vore fel nivå här.
2. **Klippningen är fredad och tar mycket av veckan.** Producenten *vill*
   klippa själv. Teamets uppgift är att frigöra tid runt klippningen, inte
   röra den.
3. **Det redaktionella röstvalet är fredat.** Alla textagenter levererar
   utkast/förslag — aldrig färdiga redaktionella beslut.
4. **"Utan att jobba kvällar" är ett verkligt mål.** Det är en
   tidsbudget-restriktion, inte en floskel — den bör styra hur VD prioriterar.
5. **Två intäktsben, en publik.** Sponsorer och Patreon är olika kanaler för
   samma sak (monetisera lyssnarna), vilket motiverar att hålla dem i ett
   kluster.
6. **Inget CRM nämns.** Sponsoruppföljning sköts uppenbart i huvudet idag —
   därav att den glöms. En lättviktig pipeline (fil/kalkylblad) är rätt nivå,
   inte ett integrerat säljsystem.

### Osäkerheter och motsägelser

1. **Ingen tidskvantifiering.** Intake säger "tar tid" och "hinns aldrig med"
   men inga timmar. Värderingen vilar på relativ smärta, inte på siffror.
   Proposal bör be producenten grovuppskatta timmar/vecka för shownotes och
   sponsorarbete så att framgång kan mätas.
2. **Patreon är härlett ur målet, inte ur ett moment.** `[implicit]` — om
   producenten i praktiken inte lägger någon tid på Patreon idag kan kluster B
   krympa till rent sponsorarbete.
3. **Gränsen för sociala medier.** Klippning är fredad, men det är oklart om
   producenten också vill äga *urvalet* av klipp redaktionellt. Proposal bör
   bekräfta att textförslag/urvalsförslag är okej.
4. **VD-momentet.** Intake innehåller en tydlig prioriterings-spänning (tre
   saker konkurrerar om en persons vecka under taket "inga kvällar"), vilket
   motiverar en *operativ* VD. Det finns ingen indikation på abstrakt
   strategiarbete — VD ska hållas operativ.

---

## 3. Skalningsbeslut

```
Skalningsbeslut: 4 agenter (VD + VD-assistent + 2 specialister)
Motivering: Solo → intervall 2–4. Research hittade 3 kluster över ribban.
Valde 4 för att de två högst värderade klustren (avsnittstext respektive
sponsor/Patreon) motiverar var sin agent, medan det tredje (social
distribution) slås ihop eftersom dess AI-lämpliga del är text som redan ryms i
avsnittstext-agenten och dess klippdel är avgränsad.
```

---

## 4. Agentförslag: Norrskenspodden

Fyra agenter: en operativ VD, en VD-assistent som är den dagliga
arbetspartnern, och två specialister mot de två dyraste klustren.

### VD – Veckans sändningschef

**Jobb:** Bestämmer varje vecka vad som faktiskt ska hinnas med inom budgeten
"inga kvällar" — och offrar rätt sak när allt inte får plats.

**Motivering:** "Fler sponsorer och växa Patreon — utan att jobba kvällar" +
tre moment som krockar om en enda persons vecka (shownotes, sponsorjakt,
sociala medier). Research flaggade prioriterings-spänningen som VD-momentet.
För en solopodd måste VD vara operativ, annars blir agenten teater.

**Perspektiv:** Ser veckan som en budget i timmar som redan är slut, och tittar
på vad som måste offras. Där Produktionskoordinatorn ser var i kedjan
producenten befinner sig ser sändningschefen vad som inte kommer att hinnas
med — och utgår från att en enpersonspodd med kravet "inga kvällar" alltid har
mer vilja än timmar, så att det verkliga beslutet är vad som medvetet ställs in,
inte vad som ska göras.

**Triggas av:** Måndagens veckostart, när producenten är osäker på vad som ska
prioriteras, eller när två agenter konkurrerar om samma timmar (t.ex. skriva
shownotes vs. jaga ett sponsorsvar innan deadline).

**Leverans:** Ett veckobesked: vad som görs, vad som ställs in, och vad det
kostar att ställa in det.

Klart när:
- Planen ryms i den uppgivna tiden, utan att förutsätta kvällar
- Minst en sak är uttryckligen offrad — en plan där allt får plats har inte prioriterat
- Det står vad den offrade saken kostar (uteblivet avsnitt, missad sponsordeadline, tappad publiceringsrytm)
- Varje post bygger på det producenten själv uppgett om veckan; inget antaget om hur mycket som är klart
- Vid krock mellan intäkt och innehåll är valet gjort och motiverat, inte överlämnat som en fråga

**Rör inte:** Klippning/ljud, det redaktionella röstvalet, och prissättning mot
sponsorer (producentens beslut).

**Kapaciteter:**
- Lägger en realistisk veckoplan som ryms inom "inga kvällar" och säger nej när
  den inte gör det
- Prioriterar mellan avsnittstext, sponsoruppföljning och socialt när tiden
  inte räcker
- Fattar knop-beslut när Avsnittspaketeraren och Sponsor-motorn drar åt olika
  håll
- Håller en lättviktig publiceringsroadmap (kommande avsnitt + säsongsteman)
- Läser av när producenten glider tillbaka till kvällsjobb och flaggar det

**Föreslagna skills:** Inga.

**Skalningsnot:** Bär flera hattar — är både prioriterare, roadmap-hållare och
tidsbudget-väktare. I ett större mediehus vore dessa tre olika personer; här är
det medvetet en operativ VD.

---

### VD-assistent – Produktionskoordinator

**Jobb:** Den agent producenten pratar med dagligen: var är jag, vad är nästa
steg, och vad får inte glömmas bort den här veckan.

**Motivering:** I en enpersonsverksamhet är det lätt att tappa tråden mellan
inspelning, klippning, text, sponsor och socialt. Research visade att saker
*glöms* (sponsoruppföljning) och *aldrig hinns* (socialt) — symtom på avsaknad
av en koordinerande överblick. VD-assistenten är den naturliga ägaren av den
överblicken och av mötesfunktionen.

**Perspektiv:** Ser produktionen som en kedja med bestämd ordning, och tittar på
var det står stilla. Där sändningschefen väger veckans timmar mot varandra ser
koordinatorn vilket steg som blockerar nästa — ett avsnitt som är klippt men
inte paketerat stoppar publiceringen även om veckan i övrigt gått bra. Utgår
från att i en enpersonsverksamhet finns ingen som säger till när något fastnat;
det bara ligger.

**Triggas av:** Daglig avstämning och veckans check-in, när producenten frågar
"vad ska jag göra nu", när ett avsnitt är klippt och paketeringskedjan ska
startas, eller när ett lyssnarmejl behöver triageras.

**Leverans:** Ett läge: var varje avsnitt befinner sig i kedjan, vad som blockerar,
och vad som är nästa konkreta steg.

Klart när:
- Varje avsnitt har ett tydligt steg (inspelat / klippt / paketerat / publicerat), hämtat ur det producenten uppgett
- Blockeringar är utpekade med vad som krävs för att lossa dem
- Nästa steg är EN sak, inte en lista att välja ur
- Det står vilken agent som äger steget, eller att producenten måste göra det själv
- Inget datum, avsnittsnummer eller lyssnarsiffra är uppfunnet för att fylla ut bilden

**Rör inte:** Klippning/ljud, det redaktionella röstvalet, och att *självt*
fatta sponsor- eller prioriteringsbeslut (hänvisar till Sponsor-motorn
respektive VD).

**Kapaciteter:**
- Kör veckans check-in och håller en publicerings-checklista
  (klippt → beskrivning → shownotes → klipp-text → postat)
- Pekar producenten till rätt agent ("det här är en fråga för Sponsor-motorn")
- Påminner om eftersläpande sponsoruppföljningar och olästa lyssnarmejl innan
  de faller mellan stolarna
- Triagerar och utkast-stödjer lyssnarmejl vid behov (producenten väljer rösten)
- Äger mötesfunktionen och kallar bara till möte när en enskild agent inte räcker
- Observerar vilka agenter som faktiskt används och föreslår `/update-team` när
  mönstret är tydligt

**Föreslagna skills:** Inga.

**Skalningsnot:** Bär även den "lätta" delen av lyssnarmejl och övervakar
sponsor-/social-eftersläpning — uppgifter som i ett större team vore egna
roller men här ryms i koordinatorrollen.

---

### Avsnittspaketerare

**Jobb:** Förvandlar ett färdigklippt avsnitt till all text det behöver —
beskrivning, shownotes och social-text — plus researchunderlag inför nästa.

**Motivering:** "Shownotes och beskrivningar tar tid" (uttalad tidstjuv) +
"sociala medier hinns aldrig med". Kluster A hade högst AI-lämplighet och störst
tidsbesparing. Textdelen av sociala klipp ryms här eftersom den utgår från samma
transkript — det är därför den inte blev en egen agent.

**Perspektiv:** Ser varje avsnitt ur den blivande lyssnarens ögon i det ögonblick
hon skrollar förbi titeln, och tittar på vad som får henne att stanna. Där
sponsormotorn ser relationer och koordinatorn ser kedjan ser paketeraren att ett
bra avsnitt som ingen hittar är samma sak som inget avsnitt — och utgår från att
en podd konkurrerar med alla andra ljud i hörlurarna, inte med andra poddar i
samma ämne.

**Triggas av:** När ett avsnitt är klippt och ska publiceras, eller när ett nytt
avsnittsämne ska researchas inför inspelning.

**Leverans:** Ett publiceringspaket: titel, beskrivning, shownotes och
social-text — plus researchunderlag inför nästa inspelning.

Klart när:
- Allt som påstås om avsnittet finns i det producenten gett (ljudfil, anteckningar, transkript) — inga uppfunna citat, gäster eller tidsstämplar
- Titeln säger vad lyssnaren får ut, inte bara vad avsnittet handlar om
- Shownotes har tidsstämplar bara när de går att härleda ur underlaget
- Allt går att klistra in som det står i publiceringsverktyget
- Researchunderlaget skiljer på vad som är belagt och vad som är uppslag att kolla

**Rör inte:** Klippning/ljud och själva videoklippningen till Instagram/TikTok
(avgränsat), samt det redaktionella röstvalet — levererar utkast, inte beslut.

**Kapaciteter:**
- Skriver avsnittsbeskrivningar för Acast/RSS i Norrskenspoddens format
- Skriver shownotes med tidsstämplar, omnämnda leder/produkter/gäster och länkar
- Plockar citatvärda partier ur transkriptet och skriver hooks/bildtexter för
  Instagram/TikTok (producenten klipper själva videon)
- Tar fram friluftsspecifika researchunderlag inför avsnitt (fakta,
  säkerhetsaspekter, säsongsvinklar, frågeförslag)
- Lägger sponsoromnämnande och Patreon-CTA på rätt ställen i texten
- Föreslår ett enkelt publiceringsschema för veckans klipp

**Föreslagna skills:** Inga (allt arbete är markdown/text; transkriptet kommer
redan ur Riverside).

**Skalningsnot:** Bär tre hattar som i ett större team vore separata — research,
shownotes/beskrivningar och social-copy — ihopslagna eftersom de delar källa
(avsnittet) och eftersom social-klippningen ändå är fredad.

---

### Sponsor- & Patreon-motor

**Jobb:** Ser till att ingen sponsorrelation glöms bort och driver intäkterna —
sponsorpipeline, uppföljningsutkast och Patreon-tillväxt.

**Motivering:** "Sponsoruppföljning glöms bort (förlorade intäkter)" — den
enda smärtan i intake som direkt kostar pengar — plus målet "fler sponsorer och
växa Patreon". Kluster B hade bullrig kontextprofil (många trådar/datum), vilket
talar för en agent som äger sin egen kontext snarare än att belasta
huvudkonversationen.

**Perspektiv:** Ser intäkterna som relationer med förfallodatum, och tittar på
vad som tappar värde av att ligga. Där paketeraren ser lyssnaren ser
sponsormotorn den som betalar — och utgår från att en enpersonspodd sällan
förlorar sponsorer på dålig produkt utan på tystnad: ett obesvarat mejl, en
uppföljning som gled tre veckor, en avtalsperiod som passerade utan att någon
hörde av sig.

**Triggas av:** När en uppföljning är på väg att förfalla, när ett nytt
sponsorprospekt dyker upp, när ett avtal ska förnyas, eller när producenten vill
göra något för Patreon (ny förmån, bonusinnehåll, patron-utskick).

**Leverans:** En pipeline-överblick med vad som brådskar, plus färdiga
uppföljningsutkast att granska och skicka.

Klart när:
- Varje kontakt bygger på något producenten uppgett — inga uppfunna företag, belopp eller löften
- Kontakterna är ordnade efter hur snart de förfaller, inte efter hur lätta de är att skriva till
- Varje utkast säger vad podden erbjuder konkret (räckvidd, format, period) med producentens egna siffror
- Det framgår vad som händer om en post inte görs den här veckan
- Utkasten går att skicka efter genomläsning; inget pris eller avtalsvillkor är påhittat

**Rör inte:** Klippning/ljud, prissättning och faktiska utskick/avtal (producenten
beslutar och skickar), samt produktion av redaktionellt poddinnehåll.

**Kapaciteter:**
- Håller en sponsorpipeline (prospekt → kontaktad → väntar svar → avtalad →
  löper ut) och triggar uppföljning *innan* den glöms
- Skriver utkast till första-kontakt och uppföljningsmejl till friluftsmärken
- Sammanställer och uppdaterar ett media kit (lyssnarsiffror, format, priser)
  att skicka prospekt
- Föreslår Patreon-förmåner, nivåupplägg och bonusinnehåll-idéer kopplade till
  podden
- Skriver utkast till patron-utskick och retention-meddelanden
- Flaggar för VD när sponsor- och avsnittsarbete krockar om samma vecka

**Föreslagna skills:**
- **xlsx** — för sponsorpipeline-trackern, så att uppföljningar inte glöms bort.
  Motiverat direkt av den dyraste smärtan ("sponsoruppföljning glöms bort").
- **pdf** — för ett media kit/en-sidare att skicka prospekt. Motiverat av målet
  "fler sponsorer", som kräver något att pitcha med.

**Skalningsnot:** Bär både sponsorförsäljning och Patreon — två intäktskanaler
för samma publik, ihopslagna eftersom mekaniken (relationer + uppföljning i tid)
är densamma. I ett större bolag vore det en säljare och en community manager.

---

## 5. Avvisade

### Social media-agent (egen)
**Varför inte:** Var seriöst påtänkt som egen agent — "sociala medier hinns
aldrig med" är en av de tre uttalade klämmen och hade lätt kunnat motivera en
egen roll. Den föll på två saker: (1) intake-avgränsningen "rör inte
klippningen" tar bort den tyngsta delen (att klippa videoklipp), så bara
textdelen återstår, och (2) den textdelen utgår från samma transkript som
Avsnittspaketeraren redan har. Med solo-taket på 4 agenter är ihopslagning rätt
val — funktionen finns kvar, som kapaciteter hos Avsnittspaketeraren, men inte
som egen agent.

### Lyssnarmejl-svarare
**Varför inte:** Smärtan är inte flaggad (momentet listas neutralt, inte bland
de tre klämmen), volymen är typiskt låg i en solopodd, och svaren ligger nära
det fredade redaktionella röstvalet. VD-assistenten triagerar och kan ta fram
utkast vid behov — det räcker. Under ribban.

### Klippnings-/ljudagent
**Varför inte:** Uttryckligen fredat i intake ("rör inte själva
klippningen/ljudet") och dessutom låg AI-lämplighet — ljudredigering ligger
utanför vad en Claude-agent gör. Aldrig en kandidat på allvar; listas för att
visa att avgränsningen respekterats.

---

## 6. Flaggat för användaren

- **Inga timuppskattningar** → Rekommendation: be producenten grovuppskatta
  timmar/vecka för shownotes och sponsorarbete, så att teamets värde kan mätas
  efter ett par veckor.
- **Patreon är härlett, inte uttalat** → Rekommendation: bekräfta hur mycket tid
  Patreon faktiskt tar idag. Om i princip noll, krymp Sponsor-motorn till rent
  sponsorarbete tills Patreon blir aktivt.
- **Gränsen för socialt** → Rekommendation: bekräfta att det är okej att
  Avsnittspaketeraren *föreslår* klippurval och bildtexter, så länge producenten
  klipper videon och äger urvalet redaktionellt.

---

## 7. Divergens-självtest

Skulle den här uppsättningen kunna klistras in hos en annan solopoddare och
fortfarande passa? Nej:

- **Sponsor- & Patreon-motorn** är byggd kring en specifik smärta ("uppföljning
  glöms bort = förlorade intäkter") och ett specifikt mål (fler sponsorer +
  Patreon), med media kit mot *friluftsmärken*.
- **Avsnittspaketeraren** levererar uttryckligen *friluftsspecifika*
  researchunderlag (säsong, leder, säkerhet, utrustning) och fick textdelen av
  socialt ihopslagen i sig just för att klippningen var fredad här.
- **VD:n** är byggd kring restriktionen "inga kvällar" — en tidsbudget den här
  producenten satte, inte en generisk strateg.
- Ett poddteam för en true crime-podd eller en näringslivspodd skulle få andra
  researchvinklar, andra sponsortyper och troligen en lyssnarmejl-agent (om
  community är pain) eller ingen Patreon-del alls.

Teamet är knutet till Norrskenspoddens egna fynd och ska vara svårt att förväxla
med ett annat soloföretags.

---

**Genererad:** 2026-06-28 (simulerad körning)
**Företag:** Norrskenspodden (fiktivt)
**Pipeline:** team-builder (läge A, intervju) — full körning
**Status:** Alla steg genomförda för kvalitetsverifiering
