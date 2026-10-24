# Roadmap

Från genomgången 2026-09-01 · sex parallella linser + egen verifiering.
Översikt: <https://claude.ai/code/artifact/08527a49-a84b-491f-98b0-c6561afdab4e>
(Förra rundorna: 2026-08-17 och 2026-08-15, egna dokument.)

> Den här filen är arbetslistan. `docs/roadmap.md` (passindelningen) och
> `docs/lansering.md` (hålen) står kvar och gäller fortfarande — det som är
> nytt eller ändrat sedan 2026-08-07 står här, med ID:n som används i
> commit-meddelanden.
>
> **Verifieringsgrad:** `mätt` = kört eller räknat. `läst i koden` = öppnad
> och kontrollerad rad, men inte exekverad.
>
> Nya ID:n från 2026-08-17 har tvåbokstavsprefix efter lins (`KA` kärnan,
> `KR` köpresan, `SE` synlighet, `TG` tillgänglighet, `DR` drift, `KL`
> klientkod, `BF` blindfläck) för att inte krocka med de gamla enbokstavs-ID:na.
> Prefixet `OM` (omvärld) tillkom 2026-08-18 med
> `docs/omvarldsresearch-2026-08-18.md`. `PR` (produktriktning) och `RE`
> (retention) tillkom 2026-09-01. Nummerserien fortsätter per prefix — nya
> ID:n återanvänder aldrig ett gammalt nummer, inte ens ett avbetat.

## Omläggning 2026-10-23 — tre ben och ett eget gränssnitt

> **Beslut, Mikael 2026-10-23**, efter omvärldsläget i oktober. Plattformarna har
> tagit "personlig assistent för småföretag": Claude for Small Business (tillägg
> till Cowork, ~43 färdiga arbetsflöden, QuickBooks/HubSpot/M365/Slack),
> ChatGPT Business med workspace agents (20–25 $/plats), Copilot Business med
> agentbygge på vanlig engelska och Copilot Cowork i allmän drift. Och
> "beskriv verksamheten → få ett team" finns redan: Taskades AI Team Generator,
> Relevance AI, Agentica (samma sex roller för alla — precis det kärnregeln
> förbjuder). **Att generera agenter är inte längre något att sälja.** Det som går
> att sälja är att veta *vilka* agenter just det här företaget ska ha, och att de
> har *rätt* om svenska regler.
>
> Behovet finns: Pax8 (okt 2026, 200 svenska småföretag) — 64 % lägger 3+ timmar
> i veckan på att granska och rätta AI-svar, 66 % har fått en högre AI-räkning än
> väntat, 70 % betalar mer för kontroll över datan. Svenska AI-konsulter tar
> 30–90 000 kr för en workshop och 60–180 000 för en förstudie. Vår egen
> simulering säger samma sak: kunderna värderar att teamet *redan känner
> verksamheten* och säger upp på *sakfel* — "annorlunda, inte bättre" än ChatGPT.
> Värdet sitter i innehållet, inte i skalet.
>
> **Projektets mål är från och med nu tre ben:**
> 1. **Konsultverktyget** — diagnosen och första projektet (mål 3 i `CLAUDE.md`).
> 2. **Teamet installerat i den AI kunden redan betalar för** — Claude, ChatGPT,
>    Copilot.
> 3. **Svenska regler som stämmer** — faktabasen ingen internationell aktör har.
>
> Plus ett fjärde, **som prövas och inte antas**: ett gränssnitt som är enklare
> och snyggare än plattformarnas tomma chattruta. Mikaels iakttagelse: "jag kan
> göra vad som helst i Claude Code, men snyggt och enkelt är det inte."
>
> **Det här besvarar OM1** (vägen "vi bygger teamet, du kör det var du vill") och
> gör **BF2** till en funktion i stället för en läcka. **PR1, PR5, PR7, PR8** hör
> hemma här nu. **Riv ingenting** (samma regel som PR2): portalen står kvar och
> underhålls för den som köper den — frågan är bara vad nästa timme läggs på.
>
> Nya prefix 2026-10-23: `OL` (omläggning) och `UX` (gränssnittet). Källor:
> svaret i sessionen 2026-10-23; Pax8 via
> <https://www.dagensinfrastruktur.se/2026/10/13/undersokning-fran-pax8-visar-att-svenska-smaforetag-utvecklar-ai-snabbare-an-de-hinner-styra-och-kontrollera-anvandningen/>,
> konsultpriser via <https://www.aikollegorna.se/insikter/ai-byraer-sverige-2026>
> (skriven av en konkurrent — läs med det i minnet).

> **Mikaels beslut 2026-10-23 (kväll):**
> 1. **KA14 — ja.** Kunden är VD:n. Ingen separat VD-agent i små firmor (solo,
>    mikro, personläget). VD-assistenten behövs: hon får storyn att rulla och
>    sammanfattar. Se KA14.
> 2. **SP14 — ja.** Nivå 1 är gratis: mötet, rekryteringsplanen och första
>    projektet som provanställning. Detta ersätter beslutet "noll provsvar" från
>    2026-08-06.
> 3. **SP18 — vänta.** Ingen lön och inga seniorer än. Produkten kör DeepSeek
>    ensam, och vi ser vad den räcker till. **UX2** byter därmed mål: inte att mäta
>    en bättre modell, utan att mäta hur långt DeepSeek bär den nya portalen.
> 4. **Trappans detaljer** lämnades till mig. Valt: nivå 5 har en examen (91 dagar
>    och 10 rutinveckor) som låser upp exporten; en rutin räknas när kunden
>    *bekräftat* den (SP19), och en bekräftad specialistrutin är en godkänd
>    leverans; befintliga kunder får **allt** upplåst, inte bara det de använt —
>    "ingen befintlig kund förlorar något" gäller det de sett (`upplast(…, { arv })`
>    i `portal/firman.js`, testat och mutationsprovat).
> 5. **Testundantaget** `VÄNTAR_PÅ_KLIENTEN` för intervjusteget godkänt.
> 6. **Nyckeln** fanns: den låg i `korsord/.dev.vars` (lånad därifrån, tak $10).
>    Kopierad till `.dev.vars` här och verifierad (200 från OpenRouter). Riktiga
>    byggen kan köras lokalt med `npm run dev:cf`.

### Ordningen

1. **OL4** — exporten till EN plattform. Utan den finns ben 2 inte, och ben 1 har
   inget att lämna över.
2. **OL8** — faktabasen följer med i exporten. Annars tappar ben 2 det enda som
   skiljer oss från att kunden skriver prompten själv.
3. **OL1** — konsultpaketet med pris, ovanpå de två.
4. **UX2 → UX4 → SP1–SP6** — gränssnittet som spåret *Firman växer* (ett steg i
   taget, nivåer som låser upp funktioner), men först när vi vet att modellen
   bär. Skisserna (UX4) kan göras redan nu.

### Ben 1 — konsultverktyget

- [ ] **OL1** **Konsultleveransen som ett paket med pris.** Allt tekniskt finns:
  `/consult`, `/handoff`, `prompts/ai-consultant/first-project.md`, konsult-läget
  i Buildern (`builder/builder.js:283`), `templates/shared/team-presentation.md`
  och `templates/ai-consultant/handoff-document.md` med "när ringer ni tillbaka".
  Det som saknas är ett erbjudande. Förslag: *Diagnos + skräddarsytt team +
  första projekt*, fast pris; leveransen är presentationen, teamet installerat i
  kundens AI (**OL4**) och en uppföljning efter 30 dagar. Marknaden tar 30 000+
  för mindre. **Priset är ditt** — och ändras det i `index.html` gäller
  samma-dag-regeln (`kopplad-andring`) · `läst i koden` · beslut; ~1 dag text och mall
- [ ] **OL2** **Buildern som mötesverktyg framför kunden, inte som formulär.**
  Konsult-läget kör pipelinen men ser ut som ett formulär. Ett presentationsläge:
  stor text, ett steg i taget, researchens fynd synliga när de kommer, avvisade
  agenter med skäl som ett eget ögonblick ("det här bygger vi INTE åt er, för
  att…"). Det är där kärnregeln blir synlig för den som betalar · `builder/` ·
  `läst i koden` · ~1–2 pass
- [ ] **OL3** = **PR5** (återförsäljarspåret — sälj verktyget till andra
  AI-konsulter). Först när **OL1** har sålts minst en gång; ett paket som inte
  bevisats går inte att licensiera · beslut

### Ben 2 — teamet i kundens egen AI

- [ ] **OL4** **Export per plattform — börja med en.** I dag ger
  `downloadConfig()` (`builder/builder.js:2110`) en JSON-fil som ingen kund kan
  använda. Behövs: per agent ett färdigt paket för plattformen — namn,
  instruktion, startförslag (`starters`), rutinerna och första projektet
  inskrivna i instruktionen, faktabasen som bifogad kunskapsfil (**OL8**).
  Kandidater: ChatGPT (egen GPT / workspace agent), Claude (projekt + en fil per
  agent, eller ett Cowork-tillägg om formatet är öppet), Copilot (agent-
  instruktion). Förslag: **ChatGPT först** — tre av fyra simulerade kunder hade
  den redan. **Kontrollera aktuellt format, teckentak och vad gratisnivån tillåter
  innan något byggs** — det ändras varje kvartal och inget av det är verifierat
  här. Lägg exportformaterna i `functions/api/_build.js` bredvid `TEAM_SCHEMA`,
  så att ett fält i schemat inte kan saknas i exporten (samma fälla som
  `starters` 2026-08-16) · `läst i koden` · ~1 pass per plattform
- [ ] **OL5** **Installationen som en guide, inte en fil.** Steg för steg med
  skärmbilder per plattform, på kundens språk, och en kontroll på slutet ("fråga
  agenten X — svarar den Y är det rätt installerat"). Arbetsledarläget (**PR1**)
  är samma leverans för den vars AI saknar agentstöd · `builder/` · ~1 pass
- [ ] **OL6** **Prismodell för ben 2.** Engångsköpet är hederligt igen, eftersom
  leveransen inte kräver drift av oss (**PR1**). Två frågor, båda dina: (a) vad
  kostar ett installerat team, (b) ska gratisbygget fortfarande visa hela teamet
  och exporten vara det betalda — det är **BF2**:s slutliga form. Prislistan i
  `index.html`, `villkor.html` §4 och `TIERS` i `functions/api/_stripe.js` ändras
  samma dag · beslut, sedan ~2–4 h
- [ ] **OL7** **Uppdatering som återkommande intäkt.** Teamet åldras med
  verksamheten och reglerna. `/update-team` gör diff utan att skrota; en
  halvårsvis omkörning plus nya årets regler (**OL10**) är skälet att betala igen
  utan att vi driftar någon chatt · `.claude/commands/update-team.md` · senare

### Ben 3 — svenska regler som stämmer

- [ ] **OL8** **Faktabasen ut ur portalen och in i leveransen.** `portal/fakta-se.js`
  (16 regler, kontrollerade mot primärkälla, 13-månadersvakt — **KA15**) når i
  dag bara portalens systemprompter. Gör den till ett dokument per bransch —
  regel, belopp, giltighetsår, källa — som följer med exporten som kunskapsfil
  och med konsultleveransen som bilaga. En källa, två utdata; testet fäller
  bygget om de skiljer sig · `portal/fakta-se.js`, `test/` · ~3 h
- [ ] **OL9** **Täckning per bransch, mätt mot simuleringens fel.** Varje sakfel i
  `testoutput/sim-2026-09/granskning-tre.md` ska ha en regel. Därefter branscherna
  i `verticals/` en i taget: hantverk (ROT, ÄTA, betalningsvillkor), redovisning
  (avdrag, momsdatum), skola (betygskriterier, Gy25), e-handel (distansavtal,
  ångerrätt), salong. Ingen regel utan källa och datum · `mätt` (felen) · ~2 h per bransch
- [ ] **OL10** **Årsskiftet som rutin.** Belopp ändras 1 januari (prisbasbelopp,
  ROT/RUT-tak, gåvogränser). En genomgång varje januari med källa per regel;
  vakten finns redan. Säljbart: "reglerna uppdateras varje år" är ett skäl till
  löpande betalning som ingen plattform erbjuder · rutin, ~1 dag/år
- **KA21** (Kontrollera mot källan) hör till det här benet och står kvar som
  lagad.

### Det fjärde — gränssnittet som är enklare än plattformarna (prövas)

> Iakttagelsen stämmer: plattformarna kan allt men visar en tom ruta, och det är
> samma hinder som **PR7** beskriver. Men ett eget gränssnitt konkurrerar bara om
> svaren bakom håller samma nivå, och portalen kör i dag en mindre modell än
> plattformarna gör. Därför är **UX2 en förutsättning, inte en sidoaffär.**
> Spänningen mot ben 2 är verklig: säljer vi installationen i kundens AI behöver
> portalen ett eget skäl att finnas. Det skälet är *enkelheten* — för den som
> inte har eller inte vill lära sig en AI-plattform.

- [ ] **UX1** = **PR7** **Uppdrag i stället för chatt.** 6–10 knappar per kund,
  genererade i bygget ur kundens vecka ("Skriv offert", "Svara på reklamation"):
  fält in, färdig text ut, faktaprofilen ifylld en gång (**KA16**). Riktningen i
  PR7 är härmed vald; omfattningen avgörs av **UX4** · beslut taget som riktning; flera pass
- [ ] **UX2** = **PR8** **Mät en bättre modell innan gränssnittet byggs om.**
  Kostnaden är inte hindret (Haiku ≈ 1,9 kr, Sonnet ≈ 3,8 kr per kund och månad
  enligt PR8). Kör simuleringen med samma personor och jämför. Ändras modellen
  gäller modellen-bor-på-tre-ställen (`atb-claude.js`, `functions/api/ai.js`,
  `functions/api/digest/run.js`) plus siffrorna i `index.html` och `villkor.html`
  · `mätt` (kostnaden) · ~1 pass
- [ ] **UX3** *(ersatt 2026-10-23 av spåret Firman växer, SP1–SP3: bantningen sker
  genom att funktionerna låses upp en i taget, inte genom att de göms bakom "Mer")*
  **Portalen bantas till en förstasida.** `portal/app.js` är 5 604
  rader och arbetsytan har ett dussin paneler. Inventera vad simuleringens kunder
  faktiskt använde; första skärmen blir veckans uppdrag plus en ruta, resten bakom
  "Mer". Göm, radera inte (PR2). Verifiera med `portal-med-ogon` · ~1–2 pass
- [ ] **UX4** **Skissa först, koda sen.** *(Skärpt 2026-10-23: skisserna gäller
  förstasidan på nivå 1 och nivå 3 i spåret Firman växer — ett steg i taget, inte
  en översikt.)* Tre skisser av förstasidan (det finns
  elva riktningar i `design/` att utgå från), prövade mot simuleringens fyra
  personor innan en rad i `portal/app.js` ändras · ~1 pass
- **Mätpunkt för hela benet:** ny simulering — snitt minst 4, minst två av fyra
  stannar, **och** en ny fråga i dagboken: "enklare eller krångligare än
  ChatGPT?". Svarar de krångligare är UX-benet fel, och då läggs timmarna på ben
  1–3.

### Spåret Firman växer — ett steg i taget i stället för en dashboard

> **Mikaels idé 2026-10-23:** gör portalen till ett spel där man levlar upp sitt
> företagande — "det blir lite unikt och roligt", och "mer tydligt ett steg i
> taget och inte så mycket dashboard".
>
> **Varför det håller.** (1) Det ger portalen ett eget skäl att finnas bredvid
> ben 2: plattformarna kan allt men har ingen progression, och ingen av de sju i
> funktionsjämförelsen har något liknande. Det går inte heller att exportera.
> (2) Det löser överlastningen: arbetsytan visar ett dussin paneler från dag ett;
> låses de upp en i taget blir första skärmen enkel av sig själv. (3) Halva
> mekaniken finns: mognadsnivåerna i `docs/scaling.md`, "Utveckla teamet" som
> anställer avvisade agenter, vecko-streaken, kom igång-listan, sparad tid och
> passerkorten. (4) Det är princip 10 (situerad pedagogik) gjord till produkt.
>
> **Reglerna, som skyddar mot att det blir fånigt:**
> - **Företaget levlar, inte personen.** Köparen betalar och kollegorna delar
>   samma nivå (via `teamstatus.json` när mappen är kopplad, som streaken i dag).
> - **Varje nivå kräver något som faktiskt hänt** — avbockade rutiner, godkända
>   utkast, ett möte som ledde till ett beslut. Inga poäng för att öppna sidan
>   eller chatta. Samma ärlighetsregel som **OM5**.
> - **Belöningen är en förmåga, inte en medalj** — en ny anställd, en ny funktion.
> - **Tonen är "firman växer"**, i personalliggarens språk, inte arkad. Inga
>   poängtavlor, inga XP-siffror. Den som vill ha allt direkt kan slå på "Visa
>   allt".
> - **Ingen befintlig kund förlorar något.** Nivån räknas fram ur historiken vid
>   första laddningen, och allt som redan används är upplåst.
>
> **Andra idén samma dag, som gör om början:** *"i stället för att man bygger ett
> helt team direkt tänker jag mig att allt börjar med ett videomöte med
> VD-assistenten och att alla agenter och funktioner läggs till en och en, så att
> kunden hinner bekanta sig. Nu är det en skärm med massa agenter och funktioner
> som blir rörigt."* Det betyder att även **agenterna** låses upp, inte bara
> funktionerna. Firman börjar med en enda anställd — VD-assistenten, som enligt
> princip 4 redan är den primära arbetspartnern — och teamet växer fram ur
> arbetet. Bygget planerar fortfarande hela teamet (research, skalning, förslag
> och avslag körs som i dag, så kärnregeln skyddas av samma pipeline), men
> resultatet presenteras som en **rekryteringsplan**, inte som en skärm full av
> agenter. Se **SP7–SP12**.
>
> **Trappan, andra utkastet** (prövas i UX4 och simuleringen innan den låses):
>
> | Nivå | Firman | Krävs för nästa | Låser upp |
> |---|---|---|---|
> | 1 | Första mötet | Första projektet påbörjat med VD-assistenten | Första specialisten (planens högst prioriterade) |
> | 2 | Första anställningen | En leverans från specialisten godkänd | Veckans rutiner, nästa specialist ur planen |
> | 3 | Rutinerna sitter | Rutiner avbockade tre veckor | Mötet med flera agenter, resten av planen |
> | 4 | Teamet samarbetar | Möte → beslut → rutin | Kedjor (**IK4**), utkast → godkänn → ut (**IK3**), rutiner som mejlas (**IK2**) |
> | 5 | Ni kan det här | Ett kvartal i gång | Exporten till egen AI (**OL4**), "Utveckla teamet" bortom planen |
>
> **Takten har ett golv.** Provmånaden är 30 dagar (`TRIAL_LENGTH_DAYS`), och
> kunden ska ha sett hela planen i arbete innan den tar slut. Når hon inte nästa
> nivå av sig själv föreslår VD-assistenten nästa anställning ändå, så att hela
> rekryteringsplanen är ombord senast dag 21. Och den som vill ha allt direkt
> kan välja "Anställ alla nu".
>
> Nivå 5 är examen: kunden har lärt sig arbetssättet och tar med sig teamet. Det
> knyter ihop spåret med ben 1 och 2 i stället för att konkurrera med dem.
>
> Nytt prefix 2026-10-23: `SP`. Ersätter **UX3**; styr **UX1** (uppdragen blir
> stegen) och **UX4** (skisserna gäller nivå 1 och 3).

- [ ] **SP1** *(logiken byggd 2026-10-23: `nastaSteg()` i `portal/firman.js`, testad i `test/firman.mjs`; inte inkopplad i app.js)* **Nästa steg — en sak att göra, inte en översikt.** Portalens
  startvy blir ett kort: "Ert nästa steg", med en handling och agenten som gör den.
  Chatten finns bakom, inte framför. En ren funktion `nastaSteg(tillstånd)` väljer
  ur: första projektet, en rutin som förfaller i dag, ett utkast att godkänna, ett
  möte att hålla, en avvisad agent att anställa. Läggs mellan `⟦AUTO-START⟧`-markörer
  i `portal/app.js` (eller i `portal/logik.js` om **DR12** hunnit före) och testas ur
  källan · `portal/app.js` · mätpunkt: personorna i simuleringen svarar ja på "visste
  du vad du skulle göra härnäst?" · ~1 pass
- [ ] **SP2** *(logiken byggd 2026-10-23: `nivaFor()` + `historikUr()` i `portal/firman.js`, 22 tester, fem mutationsprov; nivån räknas på en ny händelselogg `atb_firman_<slug>` eftersom portalen inte bokför verkliga händelser i dag, se SP19. Inte inkopplad)* **Nivåtrappan som ren logik.** `nivaFor(historik)` räknar nivå och
  vad som återstår till nästa ur det som redan bokförs: rutinloggen, streaken,
  leveranserna (RE5), mötena och — när IK3 finns — godkända utkast. Sparas i
  `teamExt` och speglas till `teamstatus.json`. Tester: att ingenting utom verkliga
  händelser flyttar nivån, och att en befintlig kund med historik hamnar på rätt
  nivå direkt · `portal/app.js` · mätpunkt: mutationsprov — en chatt utan leverans
  får aldrig höja nivån · ~3 h
- [ ] **SP3** **Upplåsningen styr vad som syns.** Arbetsytans paneler visas efter
  nivå; låsta funktioner syns som en rad — "låses upp när rutinerna suttit i tre
  veckor" — så att kunden vet att de finns och vad som krävs. "Visa allt" för den
  som vill. Det här är bantningen (ex-UX3), gjord utan att något göms permanent
  (PR2). Verifieras med `portal-med-ogon`, även mobilbredd, där ett steg i taget
  passar ännu bättre · `portal/app.js`, `portal/portal.css` · mätpunkt: förstasidan
  på nivå 1 har en handling ovanför vecket · ~1–2 pass
- [ ] **SP4** *(utvidgad 2026-10-23 av SP10: varje anställning, inte bara de tidigare avvisade, introduceras så här)* **Befordran som ett ögonblick.** När firman når en ny nivå: en scen,
  inte en notis. Den nya anställda presenteras med passerkort och porträtt
  (`.pbadge`, `avatars.js`), hämtad ur de tidigare avvisade förslagen med sitt
  ursprungliga skäl och varför det nu är dags. Det gör "Utveckla teamet" till en
  belöning och personalliggarens nej till ett "inte än" · `portal/app.js`,
  `avatars.js` · mätpunkt: personorna nämner befordran i dagboken · ~3 h
- [ ] **SP5** **Nivån syns för den som betalar.** Veckobrevet och månadsbrevet
  (**FS6**) säger "Firman nådde nivå 3: teamet samarbetar". Servern ser inte
  historiken, så portalen skickar upp nivån — ett heltal per team, inget innehåll.
  Liten men ny uppgift om kunden: en mening i `integritet.html`, som är din text ·
  `functions/api/digest/run.js`, `portal/app.js` · ~2 h + integritetsrad
- [ ] **SP6** **Mät om det är roligt eller barnsligt.** Två nya frågor i
  simuleringens dagbok: "kändes det roligt eller barnsligt?" och "visste du vad du
  skulle göra härnäst?". Redovisningsbyrån är det hårdaste testet — godtar hon det,
  godtar alla det. Svarar två av fyra "barnsligt" görs tonen om, inte mekaniken ·
  `testoutput/sim-2026-09/sim.mjs` · ~1 h
- [x] **SP7** *(byggd och driftsatt 2026-10-24: `renderMote()` i `builder/builder.js` — kandidaten från scenen, samma namn och porträtt, en fråga i taget mot steget `intervju`; scenens måndagssvar är första turen; intaget går rakt in i research via `intakeText`; formuläret finns kvar som "hellre kryssa". Provad i webbläsare mot riktig modell: 7–8 frågor, komplett intag, helt bygge. Fynd: mall-läckan "söndagskvällarna" ur `interview.md`s exempel — rättad. Kandidaten frågade samma sak om fakturan tre gånger trots regeln om en följdfråga per ämne — kvar att skärpa. Mätpunkten (KA7-jämförelse) är inte mätt)* **Första mötet med VD-assistenten är vägen in.** I dag börjar
  Buildern med ett formulär, en valbar enkät och högst två följdfrågor. I stället:
  ett mötesrum där VD-assistenten (porträtt ur `avatars.js`, stort) ställer en fråga
  i taget och kunden svarar med röst eller text. Dikteringen finns redan i Buildern
  (`builder/builder.js:328`). Mötet fyller samma intagskontrakt som formuläret i dag
  (`prompts/shared/research.md`, inklusive Avgränsningar), så research, skalning,
  förslag och avslag körs oförändrat efteråt. Enkäten blir ett val i mötet ("vill du
  hellre kryssa?") för den som har svårt att formulera sig. Löser samtidigt **KA7**
  på riktigt: en intervju ger två kunder i samma bransch olika intag, vilket en
  kryssenkät inte gör · `builder/`, `prompts/team-builder/intake-interview.md`
  (proceduren finns redan för `/build-team`) · mätpunkt: intagen från fyra personor i
  samma bransch skiljer sig mer än enkätvägens (mät som KA7: tecken som skiljer) · ~2 pass
- [ ] **SP8** *(serverdelen byggd 2026-10-23: `prompts/shared/interview.md`, steget `intervju` i `BUILD_STEPS`, tak 12 turer / 2 000 tecken per svar / 20 000 totalt / 3 072 tokens, kontroller i `ai.js`, nio tester, mutationsprovade. Testet "varje steg Buildern namnger" har ett tillfälligt undantag `VÄNTAR_PÅ_KLIENTEN` som fäller när builder.js börjar anropa steget. Klienten (SP7) återstår. Inte driftsatt)* **Intervjun under K4:s regler.** Den fria rutten tar i dag ett steg och
  **exakt ett** användarmeddelande — det är det som skiljer ett bygge från gratis
  chatt (`functions/api/_build.js`, `BUILD_STEPS`). En intervju är flera turer. Lösningen
  som håller regeln: ett nytt steg `intervju` där klienten skickar hela
  transkriptet som ETT meddelande och servern äger prompten (nästa fråga, eller
  "klart" plus färdigt intag). Tak på antal turer (t.ex. 12) och på tecken, eget
  `max_tokens`, samma IP-tak som bygget. Lägg stegnamnet i både `BUILD_STEPS` och
  `builder.js`, och prompten i `PROMPT_FILES` i `build-dist.mjs` — två tester fäller
  annars bygget (se K4 i `CLAUDE.md`, och skillen `kopplad-andring`) · `functions/api/_build.js`,
  `test/ai.mjs` · mätpunkt: test som visar att steget inte går att använda som
  allmän chatt (fel prompt in → fortfarande bara en intervjufråga ut) · ~3 h
- [ ] **SP9** *(byggd 2026-10-23 i båda ändar: `hiringPlan` i TEAM_SCHEMA + structurePrompt, `planBrister()` i Builderns kontroll, `stripTeam()` bär fältet, PORTAL_RULES punkt 4 och portal-team.md; portalen anställer en i taget (`teamExt.hired`), föreslår nästa, introducerar (SP10) och berättar för VD-assistenten vem som är anställd. Tre lokala byggen: planen kom ut och godkändes 3 av 3. Inte driftsatt)* *(logiken byggd 2026-10-23: `rekrytering()` och `anstallAlla()` i `portal/firman.js` med dag 21-golvet. Rekryteringsplanen bärs inte genom sammanställningen än: TEAM_SCHEMA saknar fält för turordning och skäl, och PORTAL_RULES punkt 4 skiljer inte anställda från väntande — samma kontrakt-regel, fältet läggs till ihop med läsaren i portalen)* **Teamet planeras helt men anställs ett i taget.** Buildern avslutas
  inte med alla agenter på en skärm utan med **rekryteringsplanen**: VD-assistenten
  börjar i dag, de andra står i turordning med skälet ur researchen ("Offertskrivaren
  — ni lägger sex timmar i veckan på offerter"), och de avvisade står överstrukna som
  i dag. Säljögonblicket och kärnregeln syns kvar; arbetsytan visar en anställd. I
  portalen: ett fält `hired` (eller ordning plus datum) i `teamExt`, samma väg som
  P4:s `retired`/`edits`, applicerat av `applyTeamExt()`. Befintliga kunder räknas
  som att alla är anställda · `builder/builder.js`, `portal/app.js` · mätpunkt:
  portalens första skärm har exakt en agent · ~1–2 pass
- [ ] **SP10** **Varje ny anställd introduceras i ett kort möte.** VD-assistenten
  presenterar kollegan: vem, varför (fyndet ur researchen) och ett första uppdrag
  som görs direkt, samma dag. Kunden lär känna agenten genom att använda den, inte
  genom att läsa ett kort. Utvidgar **SP4** · `portal/app.js` · mätpunkt: varje ny
  agent i simuleringen har gjort minst ett uppdrag inom två dagar efter anställningen
  · ~3 h
- [ ] **SP11** **Veckostarten blir veckomötet i samma rum.** Veckostarten finns i dag
  som en knapp i arbetsytan. Gör den till ett kort möte med VD-assistenten i samma
  mötesrum som det första mötet: förra veckan, den här veckans steg (**SP1**), och —
  när det är dags — nästa anställning. Ett återkommande ögonblick i stället för en
  panel bland andra · `portal/app.js` · mätpunkt: personorna håller veckomötet minst
  tre veckor av fyra · ~3 h
- [ ] **SP12** **Riktig röst och video kommer i den ordningen, och bara om det behövs.**
  "Videomöte" byggs i tre steg, och varje steg prövas innan nästa: (1) **mötesrummet**
  — porträtt, en fråga i taget, textning, diktering. Ingen ny infrastruktur. (2)
  **Syntetisk röst** för VD-assistenten — kräver en talleverantör, en ny secret, en
  vidgad `connect-src` i `_headers` (med test i `test/csp.mjs`) och en kostnad per
  minut som ska in i kronmätaren. Webbläsarens inbyggda svenska röst räcker inte för
  att låta som en kollega. (3) **Videoavatar** — dyrast och mest riskabelt för
  tonen; först om steg 2 visat att rösten bär. Beslutet om steg 2 och 3 är ditt ·
  `_headers`, `functions/api/` · mätpunkt: SP6:s fråga "roligt eller barnsligt?"
  efter steg 1 · steg 1 ingår i SP7
- [ ] **SP13** **Hemsidan är demot.** *Mikael 2026-10-23: "hemsidan vill jag göra som
  en demo och inte massa text och information. Kunden ska ledas in i systemet."*
  `index.html` är i dag 742 rader i elva avsnitt: säljtext, bevis, prislista, FAQ.
  I stället öppnar startsidan mötesrummet (**SP7**): VD-assistentens porträtt, en
  mening om vad som händer och första frågan direkt. Kunden går från hemsidan rakt in
  i sitt eget första möte och ser rekryteringsplanen växa fram (**SP9**) — det är
  demon, och den är kundens egen i stället för ett exempel. Det som står kvar som
  text flyttar till egna sidor bakom en diskret länk: priser, villkor, integritet,
  data och drift (**OM2**), skillnaden mellan tre team (**FS3**). Tre saker får inte
  försvinna i omläggningen: (a) priset och villkoren ska vara nåbara innan köpet
  (distansavtalslagen, se **BF4**), (b) prislistan i `index.html`, `villkor.html` §4
  och `TIERS` ändras fortfarande samma dag — flyttar listan till en egen sida flyttar
  regeln och testet i `test/stripe.mjs` med, (c) sökmotorerna behöver text att läsa,
  så sidorna bakom länkarna är riktiga sidor, inte borttagna. Branschsidorna
  (`verticals/`) blir samma mötesrum med branschen förifylld · `index.html`,
  `verticals/`, `test/stripe.mjs` · mätpunkt: en ny besökare i simuleringen har svarat
  på första frågan inom 30 sekunder från startsidan · ~2 pass efter SP7
- [ ] **SP14** *(beslutat 2026-10-23: ja, nivå 1 gratis. Genomförandet återstår)* **Det börjar kosta när kunden känt nyttan.** *Mikael 2026-10-23:
  "sen när den börjar känna nytta ska det börja kosta."* **Detta river ett beslut
  från 2026-08-06**: "noll provsvar" (att chatta med sitt eget team är det som säljs,
  så inget går gratis), som står i `CLAUDE.md` under *Noll provsvar* och *Betalväggen*.
  Det är ditt att riva, och det har följder:
  - **Var gränsen går.** Förslag: nivå 1 är gratis — mötet, rekryteringsplanen och
    första projektet med VD-assistenten. Betalningen kommer när första specialisten
    ska anställas (övergången nivå 1 → 2). Då har kunden fått en riktig leverans och
    vet vad hon betalar för.
  - **Taket.** Gratisfasen behöver ett eget tak per kund, inte bara per IP: t.ex.
    30 svar eller första projektet levererat, det som kommer först. Utan det är
    nivå 1 en gratis ChatGPT på vår nyckel. Taken i `functions/api/ai.js` och
    `ai_budget` får en tredje trafiktyp bredvid bygge och portal, med en egen
    dygnsrad som `build:global`, så att den inte kan svälta betalande kunder.
  - **K4.** Den fria rutten tar bara ett meddelande med en serverägd prompt — det
    var hela skyddet mot gratis chatt. Gratisfasen måste därför också gå på
    serverägd prompt: VD-assistentens systemprompt hämtas ur det sparade teamet på
    servern, aldrig ur klienten. Kräver att utkastet sparas serverside, alltså ett
    konto.
  - **Kontot kommer tidigt men inte först.** E-post efter mötet ("spara er plan och
    börja första projektet") — det löser **P2** (gratisbygget fångar ingen e-post)
    och gör taket per kund möjligt. Samma adress kan inte starta en ny gratisfas,
    vilket också stänger **KR4**:s mönster för gratisfasen.
  - **Provmånaden för 90 kr** behövs kanske inte längre: gratisfasen gör dess jobb.
    Då blir stegen 0 (nivå 1) / 290 kr/mån / offert. Prislistan, `villkor.html` §4 och
    `TIERS` ändras samma dag, och `TRIAL_LENGTH_DAYS` plus takt-golvet i trappan
    räknas om.
  - **Kostnaden** är liten men ska mätas: ett första projekt är ungefär 20–40 svar,
    alltså några kronor per kund som inte köper. Lägg den i kronmätaren
    (`npm run kostnad`) innan taket sätts — mät före spärren.
  · `functions/api/ai.js`, `functions/api/_plan.js`, `CLAUDE.md`, `villkor.html`,
  `index.html`, `functions/api/_stripe.js` · mätpunkt: andelen som betalar efter
  nivå 1, jämfört med andelen som köper efter dagens bygge · **beslut**; därefter ~2–3 pass
- [ ] **SP15** **Öppningsscenen.** *Mikael 2026-10-23: "en dramatisk öppningsscen,
  lite humor och lite drama — tidigare VD-assistent säger upp sig och
  anställningsintervjun efter en ny börjar. Börja med att man väljer bild och namn."*
  Skissen finns: `design/12-oppningsscen.html`
  (<https://claude.ai/artifact/Tx2WL7dyL8a22Gxh21ggwu>). Tre akter: (1) kunden väljer
  kandidatens porträtt och namn, plus sitt eget namn och firman; (2) Gunnar säger upp
  sig i mörkret, med ett val för kunden, passerkortet som stämplas "Slutat" och en
  dörr som smäller; (3) intervjun i dagsljus, där kandidaten säger att hen är en AI
  (EU AI Acts transparenskrav, gjort som en replik) och vänder på intervjun: "vad gör
  ni på en vanlig måndag?". Där tar **SP7** vid. *Ändrat samma dag (Mikael): andra
  scenen utspelar sig på VD-kontoret — kunden ringer kandidaten i ett videosamtal på
  datorn, och där börjar intervjun.* Gjort: datorn på skrivbordet, "Ring upp",
  signaler, och ett första skämt som också lär ut gränssnittet — mikrofonen är
  avstängd och kunden måste slå på den. Gunnars passerkort ligger kvar på bordet.
  Samtalsappen är generisk, inte Teams: vi får inte låna en annan produkts utseende. Djur- och robotporträtten får egna
  repliker. Ljudet är syntetiserat i webbläsaren tills riktigt material finns, och går
  att stänga av; "Hoppa till intervjun" finns hela tiden. Byggd som webbsida, inte i
  Remotion: scenen ska vara interaktiv och köras på hemsidan, och Remotion gör
  videofiler. Remotion passar däremot för en **trailer** till sociala medier, gjord
  ur samma manus. Kvar innan den går i drift: fonterna från `/fonts/` i stället för
  Google (CSP:n släpper inte in Google), porträttvägarna via `avatars.js`, och
  valet av kandidat sparat så att det följer med in i portalen (**SP9**) · mätpunkt:
  andelen som når intervjufrågan, mätt med P1 när den är påslagen · skiss gjord;
  ~1 pass till drift
- [ ] **SP16** *(skiss gjord 2026-10-23: `design/13-kontoren.html`, <https://claude.ai/artifact/KmhAPAnvnJnVThfs4dBLrD>; KA14 obesvarad)* **Kontoren är vyerna.** *Mikael 2026-10-23: "sen ska det finnas ett
  VD-kontor och ett kontor till VD-assistenten, detta ska vara vyer."* Portalen blir
  rum i stället för paneler — samma grepp som "värld och platser" i stället för en
  översikt:
  - **VD-kontoret** är kundens eget rum. Kunden är VD:n. Här ligger det som väntar på
    henne: nästa steg (**SP1**), utkast att godkänna (**IK3**), firmans nivå (**SP2**),
    Gunnars gamla passerkort på skrivbordet som en påminnelse om var det började.
  - **VD-assistentens kontor** är där man pratar: chatten, veckomötet (**SP11**),
    rekryteringsplanen (**SP9**) och introduktionen av nya kollegor (**SP10**).
  - **Varje ny anställd får ett eget rum** när hen anställs, så kontoret växer med
    nivåerna. En planritning över våningen ersätter agentlistan i vänsterspalten.
  **Följd för KA14:** om kunden själv är VD behövs ingen separat VD-agent i små
  firmor — hennes kontor är VD-kontoret. Det är just det KA14 föreslår, och det har
  väntat på ditt beslut eftersom "VD + VD-assistent finns alltid" är en designregel
  (`prompts/shared/proposal.md`, princip 3). Den här idén besvarar det i praktiken;
  bekräfta, så skrivs regeln om · `portal/app.js`, `portal/portal.css`,
  `prompts/shared/proposal.md` · mätpunkt: personorna hittar rätt rum utan att
  fråga · beslut (KA14) + ~2 pass, skiss först i `design/`

- [ ] **SP17** *(mall-läckan åtgärdad 2026-10-23: fredagsexemplet borta, ingen ordagrann fras på ≥5 ord delas mellan teamen. MEN överlappet blev sämre i tre körningar (mellan team 0,12 / 0,26 / 0,30, mot egna specialister 0,50 / 0,38 / 0,43 mot förra 0,15 / 0,19), spridningen mellan körningar är stor, och sista promptversionen är OPROVAD — emulatorn cachade den förra (`promptCache` i `_build.js`; starta om efter varje promptändring). Hos salongen lånar VD-assistenten specialistens blick. Fotografens VD-assistent fick ett påhittat namn, "Maria", i strid med namnregeln. Nästa steg: mät med flera körningar per version (t.ex. 3 × 3 byggen ≈ $0,90) i stället för en, `testoutput/sp9-2026-10-23/`)* *(provad i tre lokala byggen 2026-10-23, `testoutput/ka14-2026-10-23/`: mellan team max 0,15, mot egna specialister max 0,19 (baslinje 0,87). Bytprovet visar EN mall-läcka: fredagsraden "lägger fram nästa veckas tre möjliga jobb … — X väljer" kopieras ordagrant ur exemplet i `proposal.md` i alla tre, och perspektivet "helheten, det som faller mellan två moment" läser likadant. Skriv om exemplet och kör om de tre byggena (~$0,10))* *(punkt 1 och 4 gjorda 2026-10-23 i `prompts/shared/proposal.md` och båda `chief-of-staff.md` (nu skelett). Baslinje: VD-assistenternas perspektiv mellan team max 0,26, men mot egna specialister upp till 0,87 (läraren). Oprovat i riktigt bygge — nyckeln lokalt är ogiltig. Följer med: TEAM_SCHEMA/PORTAL_RULES (se SP9), `generate.md` steg 3, `docs/team-roles.md`)* **VD-assistenten görs om: från mall till huvudperson.** Kartlagt
  2026-10-23. I dag skapas VD-assistenten i samma bygge som alla andra, ur ett intag
  den själv aldrig deltog i, och den är teamets minst skräddarsydda agent:
  `proposal.md:50–80` ger VD:n fyra stycken om att jobbet ska byggas ur kundens
  beslutsmoment, VD-assistenten två rader och en mall (`chief-of-staff.md`).
  Porträttet sätts av `avatars.js` ur företagsnamnet; kunden väljer inte. I den nya
  idén är den huvudpersonen, så fyra ändringar:
  1. **Ett eget, skräddarsytt jobb** med samma krav som VD:ns: byggt ur kundens
     breda moment (`research.md` pekar redan dit, "en agent med bred syn"), vad den
     gör varje vecka just hos den här kunden, inte "operativ arbetspartner".
  2. **Två lägen, en person.** Före bygget är den *kandidaten* som intervjuar
     (**SP8**, serverägd prompt). Efter bygget får samma person sitt skräddarsydda
     jobb. Intervjun följer med in i hennes minne, så att hon minns vad kunden sa.
  3. *(gjord 2026-10-24: `sättKandidat()` i `structureTeam` ger VD-assistenten namnet och `avatarN`, flyttar en kollega som fått samma porträtt, och raderna `vd_assistentens_namn`/`kundens_namn` står i intaget så att proposal.md ser dem. Provat: "Sigge" #7, inget påhittat efternamn på ägaren. `test/mote.mjs`, mutationsprovad)* **Kundens val av namn och porträtt** från öppningsscenen (**SP15**) bärs in:
     namnet via `teamExt.edits` (finns, P4), porträttet via ett nytt fält
     (`avatarN` på agenten finns redan i `avatars.js`, som respekterar ett satt
     värde).
  4. **Namnregeln.** VD-assistenten får det personnamn kunden valde; specialisterna
     behåller jobbnamn tills varje ny anställd får sitt namn i introduktionen
     (**SP10**). Förbudet mot kundens eget namn står kvar.
  · `prompts/shared/proposal.md`, `templates/*/chief-of-staff.md`, `functions/api/_build.js`,
  `portal/app.js`, `avatars.js` · mätpunkt: kvalitet-team — VD-assistenternas
  instruktioner i tre team ur samma storleksklass överlappar under 0,70 · ~2 pass

- [ ] **SP18** **Lön i stället för krediter.** *(Parkerad 2026-10-23 av Mikael: ingen lön och inga seniorer än — DeepSeek ensam först.)* Mikael
  2026-10-23: bygget gratis på DeepSeek, gratis krediter att prova med, sedan välja
  modell och köpa krediter — och sedan: *"i stället för att ge teamet lön, så ger
  man dem krediter."* Krediter som mätare är det branschen klagar mest på (Sintra;
  Pax8: 66 % av svenska småföretag har fått en högre AI-räkning än väntat), men
  krediter som **lön** passar spelet och går att förstå för en arbetsgivare:
  - **Provanställning** = gratisfasen (**SP14**): VD-assistenten arbetar gratis
    under första projektet.
  - **Lönebudget** = abonnemanget: 290 kr/mån är teamets lönebudget. Ingen
    förbetald kassa — det håller villkor och ångerrätt enkla.
  - **Junior eller senior** ersätter modellvalet: en senior (bättre modell) kostar
    mer lön och anställs för roller som kräver det. Kunden behöver aldrig kunna
    modellnamn. Seniorlönen prissätts efter mätning (**UX2**): junior ≈ 2 öre per
    svar för oss, en Claude-modell 10–20 gånger mer.
  - **Övertid** när budgeten tar slut: VD-assistenten varnar i förväg, ingen slutar
    mitt i ett arbete, och kunden väljer att köpa till eller vänta till nästa månad.
  - **Lönebeskedet** i VD-kontoret en gång i månaden: lön per anställd bredvid
    avbockade rutiner och deras `timeEstimate` (samma ärlighetsregel som **OM5**).
    Det är **FS6** (värdet för den som betalar) i spelets språk. Aldrig en mätare
    under varje svar. Kronorna är en fördelning av priset, inte vår kostnad, och
    ska stå så.
  - **Modellbytet i frågan** (`deepseek/deepseek-v4-flash-0731`): produkten kör i
    dag `deepseek/deepseek-v4.1-flash`, där bygget är bevisat (KA9). V4 Flash föll
    på sammanställningssteget fyra av fyra gånger i augusti; byt inte innan en
    körning visat att 0731 klarar det. Modellen bor på tre ställen (se
    `kopplad-andring`).
  **Beslut:** (a) ingår lönebudgeten i 290 kr, (b) seniorer från början eller
  senare, (c) övertid att köpa eller vänta till nästa månad. Prislistan,
  `villkor.html` §4 och `TIERS` ändras samma dag · `functions/api/ai.js`
  (`ai_usage` per anställd), `functions/api/_stripe.js`, `portal/` · steg 1
  (lönebudget + lönebesked, utan påfyllning) ~2 pass; steg 2 (senior + övertid)
  efter beslut och UX2

- [ ] **SP19** *(byggd 2026-10-23: fem handlingar bokförs i `atb_firman_<slug>` (✓ Godkänn, ✓ Rutinen klar, ✓ Det här bestämde vi, ↻ Gör beslutet till en rutin, ✓ Första steget är gjort), speglas via teamstatus.json; firman.js inkopplad i index.html och sw.js SHELL. Provad i webbläsaren, `testoutput/sp19-2026-10-23/`. Nya kunder tar trappstegen i tur och ordning (genvägen till nivå 5 med "Visa allt" + ett möte är stängd, testad). Team utan hiringPlan är orörda. Inte driftsatt)* **Portalen bokför inte det trappan ska levla på.** Uppmätt 2026-10-23
  när nivålogiken skrevs: en "avbockad rutin" är en skickad chattfråga
  (`pendingRoutine`) eller en auto-körning; "leveranser" i Veckans arbete är alla
  svar; streaken flyttas av veckostart och möte (AI-anrop); möten sparar inget beslut;
  första projektet är "panelen öppnad". Inget av det är en verklig händelse enligt
  spårets egen regel. Fem uttryckliga handlingar ska skriva till `atb_firman_<slug>`:
  *påbörja första projektet*, *godkänn leverans* (= **IK3**), *rutin klar* (kundens
  bekräftelse, inte att prompten skickats), *mötesbeslut* och *rutin ur beslut*.
  Beskrivet överst i `portal/firman.js`. När filen kopplas in: lägg den i `sw.js`
  SHELL och versionsstämplingen i `build-dist.mjs` (`kopplad-andring`). **Beslut i
  agentens tolkningar:** nivå 5 "ett kvartal" blev en examen inom nivå 5 (91 dagar och
  10 rutinveckor); en avbockad specialistrutin räknas som godkänd leverans; befintliga
  kunder får upplåst det de *använt*, inte allt de sett — kan upplevas som förlust ·
  `portal/app.js`, `portal/firman.js` · ~1 pass

- [ ] **SP20** *(skiss gjord 2026-10-24: `design/14-vaningen.html`, <https://claude.ai/artifact/P6Ve8dwZwDptLpBX5hwxzg>)* **Våningen: projektet är enheten, inte chatten.** *Mikael 2026-10-24: "en design UI och UX som ett riktigt företag, designat som ett spel ... kontor som innehåller de aktuella arbetsuppgifterna, tydliga arbetsytor med pågående projekt. Det är det jag saknar på t.ex. Claudes program, det är bara massa projekt och en chatt, rörigt."* Vald stil (Mikael): **managementspel ovanifrån**, stramt och vuxet: en isometrisk våning i en mörk ram, medan rummen är papper (Personalen/Ljus). Bygger vidare på SP16:
  - **Våningen ersätter agentlistan.** Varje anställd har ett rum, och det som pågår syns som mappar på skrivbordet redan från våningen. En röd prick betyder att något väntar på kunden. Längst ner finns ett enda nästa steg.
  - **Projektet är ett nytt objekt.** Det har steg, en leverans, en "Klart när"-lista och ett eget samtal. Chatten hör till projektet, projektet till ett rum. Projektet blir klart först när kunden godkänt det, och det är samma händelse som SP19 bokför.
  - **Nivån syns som byggnad.** Ett låst rum är en ritning, ett rum som kan anställas blinkar, och en anställning bygger rummet. Pentryts whiteboard med veckans rutiner tänds på nivå 3.
  - **Öppet:** var projekten bor i teamkonfigen och `teamExt`, vem som startar dem (förslag: VD-assistenten ur rutinerna plus "+ Nytt projekt"), och om **kundpärmen** (ett lätt CRM byggt ur projekten, se nedan) ska med.
  - **Kunderna, en andra lins (Mikael 2026-10-24: "med CRM menar jag en extra nivå av begriplighet och översikt", "det är det man gör som företagare i B2B", "organisationer (kommuner, föreningar, företag osv) samt kontakter (människor)").** Byggd i skissen. Den har tre flikar: **Affärer** (en tavla från förfrågan till klart, med belopp, dagar utan svar och vem som gör nästa steg), **Organisationer** och **Kontakter** (roll, hur personen vill bli kontaktad, när ni senast hördes). Varje organisation öppnas som en pärm med affären, projekten på våningen, kontakterna och relationen över tid. Det finns inga formulär och ingen import, eftersom allt härleds ur projekten. Risk: kundens kunder är personuppgifter (PUB-avtal, `integritet.html`).
  - **Ledstången (Mikael 2026-10-24): "allt handlar om begriplighet och översikt nu, vi kan inte konkurrera i funktionalitet med de stora AI-företagen."** Varje vy ska vara en lins på arbete som redan sker. En ny funktion som plattformarna har eller kan få hör hemma hos dem (ben 2), inte här.
  - **Skicka jobbet till Claude eller ChatGPT** (skissen har knapparna på projektet). Det finns tre nivåer, se svaret 2026-10-24: (1) knappen ↗ under varje svar finns redan, men den är enkelriktad; (2) jobbkortet följer med ut, och leveransen klistras in i projektet för granskning; (3) en MCP-koppling där plattformen hämtar jobbet och lämnar leveransen själv. Nivå 3 kräver att plattformarnas aktuella stöd kontrolleras först (samma regel som OL4).
  · `portal/app.js`, `portal/portal.css`, `portal/firman.js`, `functions/api/_build.js` (TEAM_SCHEMA om projekt genereras) · mätpunkt: en simulerad kund hittar det som väntar på henne utan att fråga · skiss gjord; ~3 pass

- [x] **SP21** *(byggd 2026-10-24)* **Kopplingen: jobben görs i kundens egen Claude eller ChatGPT.** *Mikael 2026-10-24: "jag vill ha en riktig koppling".* Det är nivå 3 av de tre i SP20. Mitt AI-team är en MCP-server (`/mcp`) med en egen OAuth-server (`/oauth/authorize`, `/oauth/token`, `/oauth/register`, `/.well-known/*`). Kunden lägger till `https://mittaiteam.se/mcp` som anpassad koppling, loggar in med samma engångskod som i portalen och ser en samtyckessida som säger vad plattformen får och inte får göra.
  - **Tre verktyg och inga fler:** `lista_jobb`, `hamta_jobb` (med uppdraget, kunden, "Klart när" och agentens instruktion) och `lamna_leverans`. Plattformen kan inte godkänna, ta bort eller läsa samtal och minne. Ett jobb blir klart först när kunden godkänt det i portalen, och godkännandet bokförs som `leverans_godkand` i trappan (SP19).
  - **Jobben bor i D1** (`migrations/0008`), som den enda delen av arbetsytan som delas med servern. Portalen har panelen **📋 Jobben** (bara köpta team): lägga upp jobb, läsa leveranser, godkänna, skicka tillbaka eller stryka, plus rutan "Koppla din egen Claude eller ChatGPT". En leverans som väntar fyller nästa steg-kortets plats för utkast att godkänna (IK3).
  - **Kraven kommer från Claudes dokumentation** (läst 2026-10-24): 401 med `resource_metadata`, PKCE S256, CIMD och DCR, form-urlencoded token, roterade förnyelsenycklar, återanrop `https://claude.ai/api/mcp/auth_callback` och loopback utan port. Claude tar anpassade kopplingar på alla abonnemang (gratis: en). För ChatGPT går källorna isär; Business och Enterprise kan skriva tillbaka.
  - **Tester:** `test/koppling.mjs`, 18 st, mot en riktig SQLite byggd ur migrationerna (inte en låtsasdatabas). Både PKCE och åtkomstkontrollen är sabotageprovade. Flödet är kört mot emulatorn hela vägen, från samtycke till leverans som syns i portalen.
  - **Kvar:** koppla en riktig Claude mot drift, vilket bara Mikael kan göra med sitt konto. Därefter ChatGPT. `integritet.html` ska nämna att jobbkortet (uppdrag, kund, agentinstruktion) lämnas till plattformen kunden själv kopplat. Det är din text.
  · `functions/mcp.js`, `functions/oauth/*`, `functions/api/_koppling.js`, `functions/api/jobb/*`, `portal/app.js` (openJobs), `migrations/0008_jobb_och_koppling.sql`

- [x] **SP22** *(gjord 2026-10-24)* **Startsidan är scen 1, och demoteamen visas inte utåt.** *Mikael: "startsidan ska vara scen 1", "ta bort alla gamla demokonton … de får bygga sina egna, är metoden nu", "såvida jag inte har ett konto redan, då ska jag in direkt i kontoret".* `index.html` = öppningsscenen (SP15 skarp: lokala typsnitt, `/portal/avatars/`). Valen och måndagssvaret går via `atb_scen` in i Buildern. Inloggad med team leder till portalen. Den gamla säljsidan heter `om.html`. Galleriet och branschsidorna publiceras inte, och `_redirects` skickar deras adresser till `/`. Exempelteamen öppnas bara med `?intern=1`. **Kvar:** namnet och porträttet från scenen ska in i VD-assistenten (SP17 punkt 3 / SP9), och intervjun i Buildern ska fortsätta i scenens ton (SP7).

### Väntar på ElevenLabs

> Mikael 2026-10-23: "vi ska skapa bra material till det här senare i ElevenLabs,
> tills vidare får du göra vad du kan med dina egna resurser." Krediterna är slut
> sedan oktober. Tills de är påfyllda används syntetiserat ljud och text. Det som ska
> göras när de finns:

- [ ] **EL1** Gunnars röst och kandidatens röst (en per porträtt eller en neutral) till
  öppningsscenen (**SP15**), med textningen kvar för den som har ljudet av.
- [ ] **EL2** Ljudeffekter som ersätter de syntetiserade: dörrsmäll, lampa, stämpel,
  notis, kontorsbrus.
- [ ] **EL3** Musik: ett mörkt tema för uppsägningen och ett ljusare när intervjun börjar.
- [ ] **EL4** VD-assistentens röst i mötesrummet (**SP12** steg 2), om scenens röst bär.

### Det som pausas

- **Nya arbetsytefunktioner** (mapp, auto-rutiner, minne & underlag): underhåll,
  bygg inte ut — det är plattformarnas kärnfunktioner (**PR2**).
- **PR6** privatpersoner: ingen tid.
- **OM4** integrationer: följer av ben 2 — kunden får integrationerna av sin
  plattform (QuickBooks, HubSpot, M365 via Cowork, Slack via ChatGPT). **Bekräfta
  att det är bortvalet**, så stängs OM4.
- **OM3** (avslaget och mötet på framsidan) lever vidare som **OL2**.

## Funktionsplanen 2026-10-23 — försprånget och glappet

> Ur funktionsjämförelsen samma dag (16 funktioner mot Claude Cowork + Small
> Business, ChatGPT Business, Taskade, Sintra, Marblism, AI Kollegorna och
> Vorker): <https://claude.ai/artifact/MCjMqiSnZGsWhSjAyu7z12#funktioner>.
> Konkurrentrutorna är hämtade från deras egna sajter och hjälpsidor i oktober,
> bara Cowork och ChatGPT med officiell dokumentation. Rutor som inte gick att
> bekräfta står som `?` på sidan.
>
> **Två listor:** `FS` (försprång) = det bara vi har, gjort starkare och
> *synligare*. `IK` (ikapp) = det alla andra har och vi saknar. Planen följer
> omläggningen ovan, alltså med tre regler:
> 1. **Ett försprång räknas bara om det följer med teamet.** Allt vi är ensamma
>    om är innehåll, och innehåll går att exportera (ben 2). Mötet och
>    värdesiffrorna gör det inte i dag — därför **FS4**.
> 2. **Ett glapp som kundens plattform redan fyller byggs inte en gång till.**
>    Integrationer, kanaler och toppmodell får kunden av Claude/ChatGPT när
>    teamet installeras där. I portalen tas glappet bara igen där det går utan
>    ny infrastruktur (princip 8): med artefakter, mejl och den klocka som redan
>    finns (`worker-veckobrev/`).
> 3. **Varje punkt har en mätpunkt.** Försprång som inte syns för kunden i
>    nästa simulering räknas inte som förbättrade.
>
> Nya prefix 2026-10-23: `FS`, `IK`.

### Ordningen

1. **OM4** — bekräfta bortvalet av egna integrationer. Det avgör om IK1 är
   artefakter eller en riktig koppling. *Ditt beslut.*
2. **FS1 + FS2** — analysen och nejet syns för kunden. Det är skillnaden mot
   Taskade, och den kostar inget att visa.
3. **FS4** — mötet följer med exporten, samtidigt som **OL4**.
4. **IK3 + IK1** — utkast → godkänn → ut i kundens verktyg. Portalens aha-scen.
5. **IK2** — rutiner som körs utan att kunden loggar in.
6. **FS3, FS5, FS6, IK4, IK5, IK6** — i den ordning passen tillåter.

### Försprång — det bara vi har

- [ ] **FS1** **Analysen syns — och går att rätta — innan teamet byggs.**
  Researchsteget (`prompts/shared/research.md`) hittar arbetsmomenten i kundens
  vecka, men kunden ser bara resultatet: agenterna. Taskade bygger också ett team
  ur en prompt; skillnaden är analysen, och den är osynlig. Visa en läsbar
  sammanfattning efter researchsteget — "så här ser er vecka ut: de här momenten,
  det här klämmer" — med en rad per moment att stryka eller rätta innan förslaget
  körs. Rättelserna går in i förslagssteget. Ger bättre team (fel fångas före
  förslaget, inte efter) och är det första kunden ser av kärnregeln. Hör ihop med
  **OL2** (Buildern som mötesverktyg) · `builder/builder.js`, `prompts/shared/research.md` ·
  mätpunkt: i nästa simulering rättar minst en av fyra personor något, och teamet
  speglar rättelsen · ~1 pass
- [ ] **FS2** **Nejet följer med överallt.** Avvisade förslag med skäl står i
  dag i Builderns personalliggare och i "Utveckla teamet". De ska också stå (a) i
  exporten (**OL4**) som en fil "Det här byggde vi inte, och varför", (b) på
  framsidan med en riktig körning (= **OM3**, som står kvar med sitt ID), och
  (c) i konsultleveransen (**OL1**). Kontrollera samtidigt att **KA13** höll — att
  det som står under "Var det klämmer" aldrig avvisas — med en mätning över
  `examples/` och KA9-byggena, inte bara promptfixen · `builder/builder.js`,
  `index.html`, `test/examples.mjs` · mätpunkt: test som fäller bygget om ett
  klämmoment avvisas · ~3 h + OM3
- [ ] **FS3** **Divergensen som bevis på sajten.** Kärnregeln mäts sedan KA4
  (överlapp under 0,70) och KA9 (tre mikroföretag, max 0,24 mellan team), men
  kunden ser aldrig mätningen. En sida: tre företag i samma storleksklass —
  byggfirman, frisörsalongen, fotografen ur KA9 — med sina tre team bredvid
  varandra och siffran som visar hur olika de är. Ställer oss rakt mot Agentica
  och Sintra (samma roller för alla) utan att nämna dem. Använd skillen
  `kvalitet-team` för siffran, så den på sidan är den uppmätta · `site/`,
  `testoutput/sim-2026-09/ka9-*` · mätpunkt: siffran på sidan kommer ur
  `kvalitet-team`, inte ur handen · ~3 h
- [ ] **FS4** **Mötet följer med exporten.** Mötet är det enda försprånget som
  bara finns i portalen. Cowork-tillägg kan bära underagenter (enligt Anthropics
  supportsida: tillägg buntar skills, kopplingar och underagenter), alltså går
  mötet att leverera som en procedur: VD-assistenten frågar de valda agenterna var
  för sig och sammanställer enligt `templates/shared/meetings/`. För ChatGPT, där
  agenter inte anropar varandra, blir det en instruktion i VD-assistentens GPT som
  kör perspektiven i tur och ordning. **Formaten verifieras mot aktuell
  dokumentation innan något byggs**, samma regel som OL4 · `templates/shared/meetings/`,
  exportkoden från OL4 · mätpunkt: ett möte kört i den exporterade plattformen
  landar i rätt utdataformat · ~1 pass efter OL4
- [ ] **FS5** **Regelsvaren visar sin källa i svaret.** Faktabasen (**KA15**,
  **OL8–OL10**) gör svaren rätt, men kunden kan inte se skillnaden mot ChatGPT
  förrän något går fel. Märk varje svar som bygger på en regel ur
  `portal/fakta-se.js` med regel, år och länk — "Skatteverket, ROT 2026" — under
  svaret, där "Kontrollera mot källan" redan sitter. Samma märkning i exporten:
  kunskapsfilen säger åt plattformens modell att ange källan · `portal/app.js`,
  `portal/fakta-se.js` · mätpunkt: i nästa simulering har varje regelfråga en
  synlig källa, och ingen av personorna rapporterar ett regelfel · ~3 h
- [ ] **FS6** **Värdet når den som betalar, inte bara den som använder.**
  Halvårssimuleringen 2026-07-18 sa det redan: värdet bevisas hos utföraren,
  beslutet fattas av köparen. Sparad tid (**OM5**) och "Rapport till chefen"
  (**RE5**) finns, men bara i portalen och bara om utföraren skickar dem vidare.
  Ett månadsbrev till teamets ägare (köparen) med avbockade rutiner och deras
  `timeEstimate`, leveranserna per agent och en mening om vad som ligger och
  väntar — samma ärlighetsregler som OM5: bara avbockat räknas, ingenting
  uppskattas per svar. Byggs på veckobrevets klocka och tak. **Obs:** servern ser
  inte kundens historik (den ligger i webbläsaren), så antingen skickar portalen
  upp en sammanfattning med kundens samtycke, eller så säger brevet bara vad
  rutinerna är värda om de körs — samma uppdelning som veckobrevet har i dag.
  Valet är en integritetsfråga och därmed ditt · `functions/api/digest/run.js`,
  `portal/app.js` · mätpunkt: köparpersonan i nästa simulering nämner brevet när
  hon motiverar att fortsätta · beslut + ~1 pass

### Ikapp — det andra har och vi saknar

- [ ] **IK1** **Agenterna lämnar något i kundens egna verktyg.** Alla sju
  konkurrenter har integrationer; vi har noll. **Huvudsvaret är ben 2**: installerat
  i kundens Claude eller ChatGPT får teamet plattformens kopplingar (QuickBooks,
  HubSpot, M365, Gmail, Slack). **I portalen**, under förutsättning att **OM4**
  bekräftas som bortval av egna kopplingar: **PR4**:s läsbara artefakter — årshjulet
  och rutinerna som `.ics` (inga träffar på `.ics` i `portal/app.js` i dag), svar som
  mejlutkast (`mailto:` med ämne och text), tabeller som CSV, och en
  "kopiera som …"-knapp med format för det kunden sagt sig använda i intaget.
  Ingen OAuth, inga tokens, ingen drift · `portal/app.js`, `portal/deadlines-se.js` ·
  mätpunkt: minst två personor i nästa simulering använder en artefakt i sitt
  eget verktyg · beslut (OM4); ~4–8 h
- [ ] **IK2** **Rutiner som körs utan att kunden loggar in.** I dag körs rutinerna
  bara när portalen öppnas, och Cowork kör bara när datorn är på — ChatGPT, Sintra,
  Marblism, Vorker och AI Kollegorna kör i molnet. Klockan finns redan:
  `worker-veckobrev/` knackar varje timme, och `functions/api/digest/run.js`
  genererar och mejlar med teamets konfig, egna tak och opt-in. Utöka: kunden
  väljer en eller två rutiner som ska komma som mejl på sin dag ("Måndag 07:00:
  veckans offertuppföljning"). Opt-in per rutin, egen dygnsrad i `ai_usage` som
  `digest:global`, så att det inte kan svälta chatten. Samma gräns som veckobrevet:
  servern har konfig och minne om kunden kopplat det, inte historiken · `functions/api/digest/`,
  `migrations/` (en tabell för valen) · mätpunkt: en rutin mejlas tre veckor i rad
  utan att någon öppnat portalen; kostnaden syns i `npm run kostnad` · ~1–2 pass
- [ ] **IK3** **Utkast → godkänn → ut.** Marblism, Vorker, AI Kollegorna och
  Claude Small Business bygger sin aha-scen på att agenten föreslår och ägaren
  godkänner innan något skickas. Vi har inget som skickas och därför ingen sådan
  scen. Med **IK1** finns något: ett svar som är gjort för att lämna portalen får
  status *utkast / godkänt / skickat* i Veckans arbete, och "Godkänn" öppnar
  mejlutkastet eller laddar ner filen. Ger dessutom underlag till sparad tid utan
  att något uppskattas: ett godkänt utkast är en faktisk leverans · `portal/app.js`
  (Veckans arbete, RE5) · mätpunkt: personorna godkänner minst ett utkast per vecka
  · ~3 h efter IK1
- [ ] **IK4** **Kedjor mellan agenterna utan handpåläggning.** "→ Skicka vidare"
  finns (`portal/app.js:4326`) men kräver ett klick per steg. Marblism kedjar
  automatiskt (bloggtext → sociala inlägg). Låt en rutin ta "senaste leveransen från
  agent X" som underlag, så att skribentens nyhetsbrev blir sociala inläggets
  underlag nästa dag. Bygger på teamloggen (**RE8**), som redan vet vad varje agent
  levererat · `portal/app.js` (rutiner, `teamLogg`) · mätpunkt: en kedjad rutin
  körs i simuleringen och bygger på rätt leverans · ~3 h
- [ ] **IK5** **Data i EU — eller ett tydligt besked om varför inte.** AI Kollegorna
  säljer på dedikerad EU-drift; vi kör hos fem amerikanska leverantörer
  (`PROVIDER_ONLY`, `functions/api/ai.js:195`) med `data_collection: "deny"`.
  Utred om modellen (eller en likvärdig, se **UX2**) går att köra hos en leverantör
  med EU-drift via OpenRouter, och vad det kostar. Oavsett utfall: **OM2**:s sida om
  data och drift — vars text fortfarande säger `gpt-oss-120b` och därmed är
  inaktuell sedan modellbytet 2026-09-26 — skrivs med det som faktiskt gäller ·
  `functions/api/ai.js`, `integritet.html` · mätpunkt: sidan namnger
  leverantörerna och regionen, och ett test fäller bygget om `PROVIDER_ONLY` ändras
  utan att sidan följer med (lägg kopplingen i `kopplad-andring`) · ~2 h utredning +
  OM2
- [ ] **IK6** **En människa hjälper igång.** AI Kollegorna tar två veckor och en
  processgenomgång; Sintras mest citerade brist är att ingen hjälper till. Vi har
  konsultläget (**OL1**) för den som köper paketet, men inget för den som köper
  290-nivån. Billigaste vägen utan att binda din tid: en guidad första vecka i
  portalen (kom igång-listan finns — gör den till fem dagar med ett uppdrag per dag
  ur kundens egna rutiner). Dyrare vägen: ett bokningsbart samtal på 20 minuter i
  provmånaden. **Den dyrare vägen är din tid och därmed ditt beslut** ·
  `portal/app.js` (kom igång) · mätpunkt: färre personor ger upp vecka 1 · ~3 h
  eller beslut
- **Modellen** står redan som **UX2** (= PR8) och upprepas inte här.
- **Kanaler** (Slack, Teams): täcks av ben 2 — ChatGPT-agenter går att lägga i
  Slack. Ingen egen punkt.

## Nu — riktiga fel

> **Simuleringen 2026-09-26** (fyra kunder, fyra veckor i drift, gpt-oss-120b) gav
> punkterna KA11–KA18, RE7, DR14–DR16, PR7 och PR8. Alla fyra kunder sa upp,
> snittbetyg 2,6/5. Rapport: <https://claude.ai/artifact/8j1KdRrSj2wRGYHogjMUFe>,
> förslag: <https://claude.ai/artifact/VPZqX6932A9d8fLpYqLht1>, källmaterial och
> skript i `testoutput/sim-2026-09/`. Sakfelen är granskade mot transkript och
> primärkällor i `testoutput/sim-2026-09/granskning-tre.md`.

- [x] **KA11** *(lagad 2026-09-26: delad rubrikläsare sektionText() i DELAD-blocket godtar numrerade, versala, markdown- och engelska rubriker vid radbörjan; fem tester i test/teams.mjs kör kontrollen mot riktiga råsvar, mutationsprovade)* **Bygget fungerar inte i drift: Builderns kontroll fäller varje sammanställning.** `kontrolleraSystemprompter` kräver rubriken `DITT PERSPEKTIV` ordagrant (`perspektivText`, `indexOf`). gpt-oss följer promptens numrerade lista men skriver om rubrikerna, till exempel `2. Perspektiv:` och `4. Leverans:`. Uppmätt: 9 av 9 sammanställningar fälldes, för fyra olika kunder. En riktig kund får "Agenternas systemprompter blev ofullständiga" varje gång hon försöker igen. Verifieringen 2026-09-06 körde steget skarpt men aldrig kontrollen, och därför syntes felet inte. Fix, strukturell: låt `TEAM_SCHEMA` ge `perspective` och `delivery` som egna fält och bygg systemprompten i kod, så att rubrikerna aldrig beror på modellen. Snabbfix: acceptera rubrikvarianterna. Lägg till ett test som kör kontrollen mot ett riktigt råsvar (`testoutput/sim-2026-09/bygg/structure-raw.json`) · `builder/builder.js:1128-1137`, `:1192`, `functions/api/_build.js:107-117`, `:202` · `mätt` · ~1 h snabbfix / ~3 h strukturellt
- [x] **KA12** *(lagad 2026-09-26: resonemanget avstängt i bygget och under 2 500 tokens, se Driftsatt 2026-09-26)* **gpt-oss resonemang äter tokentaket, och tomma svar räknas som lyckade.** Det dolda resonemanget räknas mot `max_tokens`. Uppmätt: `clarify` (tak 300) gav 0 tecken i 4 av 13 körningar, och Buildern hoppade då tyst över följdfrågorna. `scale` (1 024) gav 0 tecken för redovisningsbyrån, så förslaget byggdes utan skalningsbeslut. Mötets perspektiv (600) gav 2 av 4 tomma och 2 avklippta på e-handelns möte (`reasoning_tokens` upp till 597 av 600), och mötesanteckningen (2 000) klipptes. Portalen räknar ett tomt eller vägrande perspektiv ("Jag kan inte hjälpa till med den begäran.") som lyckat. Fix: `reasoning: { effort: "low" }` eller tak med marginal för de fyra ställena i `ai.js`, och i portalen behandla tom text eller `finish: length` som misslyckat · `functions/api/_build.js:269-276`, `functions/api/ai.js:474`, `portal/app.js:5010-5030` · `mätt` · ~2 h
- [x] **KA13** *(promptfix 2026-09-26 i proposal.md: det som står under Var det klämmer eller Mål får aldrig avvisas, avgränsningen blir Rör inte. Obevisad tills en ny simulering körts)* **Bygget avvisar just det kunden säger att det klämmer mest på.** Läraren skrev att rättningen tar hennes helger. Agenterna "Bedömning & återkoppling" och "Utvecklingssamtal" avvisades, troligen på avgränsningen "AI ska inte sätta betyg". E-handelns första mål är att sänka returgraden, men ingen agent äger den, och kampanjplaneringen inför Black Week avvisades. Regeln om att minst en agent ska avvisas är rätt, men den träffar fel agent. Fix: i `proposal.md` får ett moment som står under "Var det klämmer" eller "Mål" inte avvisas. En avgränsning blir då ett villkor i agentens "Rör inte", inte ett skäl att stryka agenten. Lägg till ett test på `examples/` · `prompts/shared/proposal.md`, `testoutput/sim-2026-09/larare/team.json`, `ehandel/team.json` · `mätt` · ~2 h + ny simulering
- [ ] **KA14** *(beslutat 2026-10-23: ja — ingen separat VD-agent i solo, mikro och personläget; kunden är VD:n, VD-assistenten finns alltid. **Genomfört samma kväll, inte driftsatt:** `utanVdAgent()` i DELAD-blocket, `hållSkalningsTak`/`trimmaTeam`/`teamBrister` tar kärnan, scale/proposal/PORTAL_RULES/portal-team.md/mallar/docs omskrivna, kopplingen `vd-karna` i registret, 437 gröna. Skarpt provat lokalt i tre mikrobyggen (`testoutput/ka14-2026-10-23/`): ingen VD, Builderns kontroll godkänner alla tre, VD-assistenten mot egna max 0,19 (före 0,87 hos läraren), mellan team max 0,15. Kvar: fredagsraden ur proposal.md:s exempel kopierades ordagrant i tre av tre)* *(delvis 2026-09-26: proposal.md förbjuder kundens namn på agenter och döper VD-rollen till prioriterare i personläget. VD + VD-assistent är en designregel — "finns alltid" i proposal.md och princip 3 — och tas inte bort utan ditt beslut)* **Varje team fick en separat VD-agent, även där ingen VD finns.** Alla fyra team hade både VD-assistent och VD. Hos e-handeln heter VD-agenten "Maria" och hos byrån "Karin", alltså kunden själv. Läraren i personläget fick en VD. VD-agenten användes knappt. Det bryter mot designprincip 3 (operativt jobb) och mot skalningsreglerna för solo och mikro. Fix: i `scale.md`/`proposal.md` ska solo, mikro och personläget inte ha en separat VD-agent, och ingen agent får bära kundens namn. Kontrolleras i kod, i samma block som KA11 · `prompts/shared/scale.md`, `proposal.md`, `docs/team-roles.md` · `mätt` · ~1–2 h

- [ ] **KR4** Provmånaden kan köpas om varje månad — 90 kr i stället för 290, i all evighet. `startUpgrade` blockerar en ny provmånad på SAMMA slug ("sälja samma sak två gånger", `checkout.js:120-124`), men webhookens nytt-team-gren har ingen kundkontroll alls: den skapar team och kopplar till e-postadressen villkorslöst, oavsett hur många team adressen redan äger. Varken villkoren eller prislistan säger något om en provmånad per kund (noll träffar på båda ställena). Med gratis bygge och körningen kvar i webbläsaren är cykeln två klick i månaden; med kopplad mapp följer företagsminnet med. Samma felklass som pass 2 lagade, flyttad en nivå upp: provmånaden tar slut per *team*, inte per *kund*. Förslag: leverera ändå (betalt är betalt) men flagga raden och mejla `info@`; villkorsraden är din text · `functions/api/stripe-webhook.js:133-192`, `checkout.js:120-124`, `villkor.html:255` · `läst i koden` · ~2 h + villkorsrad
- [ ] **BF4** Villkoren visas aldrig före köpet — och §15 lovar ett samtycke som ingen kod inhämtar. Uppmätt: noll förekomster av "villkor" eller "ånger" i kundens gränssnitt genom hela köpflödet (Builderns avslut, kassan, `aktivera.html`); träffarna i `builder.js` är kodkommentarer. `checkout.js` sätter varken `consent_collection` eller `custom_text`. Samtidigt står i `villkor.html:539`: "Vi ber om det samtycket uttryckligen" — det finns ingen sådan fråga någonstans. Distansavtalslagen kräver information om ångerrätten INNAN avtalet ingås; utan den börjar fristen inte löpa, och ångerknappen (BL2) skyddar då inte mot en väsentligt längre frist än de 14 dagar koden räknar med. Fix: `consent_collection[terms_of_service]=required` i båda sessionsanropen + villkors-URL i Stripes dashboard (ditt steg). **Meningen i §15 är din text — jag har inte rört den** · `functions/api/checkout.js:83-96`, `:150-163`, `villkor.html:539-540` · `mätt` · ~1–2 h
- [x] **BF5** *(lagad 2026-09-26: functions/api/_gallring.js körs varje timme av /api/digest/run (samma klocka och hemlighet). Gallrar utgångna koder och sessioner, utkast över ett dygn, avslutade team över 90 dagar (och provmånader över 120), föräldralösa konton över 90 dagar, IP-rader över 30 dagar. Sex tester mot riktig SQLite med projektets migrationer. Torrkörning mot skarpa D1 före driftsättningen: 0 team och 0 konton gallras, 1 kod och 1 utkast. **Obs:** policyn säger koder gallras "inom minuter" — med timklockan blir det inom en timme; texten är din)* Integritetspolicyns fyra gallringslöften har ingen verkställare. Uppmätt med `grep -rn "DELETE FROM" functions/ scripts/`: repots enda `DELETE FROM users` ligger i kollega-borttagningen (`team/remove.js:71`), ingen rad raderar ur `teams`, inloggningskoderna förbrukas (`consumed_at`) men raderas aldrig, och `pending`-städningen körs bara när NÄSTA checkout råkar starta (`checkout.js:106-109`) — med få kunder alltså sällan eller aldrig. Dessutom ackumulerar `ai_usage` rader nycklade på `ip:<ip>` utan angiven lagringstid. Art. 13-information som inte stämmer är det första en granskande IT-leverantör kontrollerar. Fix: en `POST /api/underhall/gallring` som veckobrevs-workern anropar med samma `DIGEST_SECRET`-mönster — klockan finns redan, den knackar bara aldrig på någon städrutt · `integritet.html:374-407`, `functions/api/checkout.js:106-109`, `api/ai.js:426, 576` · `mätt` · ~4 h

## Sedan — skav som märks

> **Simuleringens andra körning (2026-09-26 kväll, DeepSeek + dagens fixar):** tre av fyra kunder stannar, mot noll av fyra. Snitt 3,1 / 3,1 / 2,9 / 2,8 mot 2,6 / 2,6 / 2,7 / 2,4. Läraren säger upp **bara** på grund av tomma svar (3,4 räknat på svaren som kom). Dagböcker i `testoutput/sim-2026-09/*2/`.

- [x] **KA20** *(lagad 2026-09-26, `6b60e2f9`)* **Ungefär 30 % av portalsvaren kom tomma** hos alla fyra kunder i andra körningen: strömmen stängdes efter ungefär en sekund utan ett tecken (`finish=null`), eller DeepSeek lade alla 4 096 tokens på resonemang (`finish=length`, 0 tecken) trots `effort: low`. Lagat: `strömSvar` i `ai.js` läser i förväg till första tecknet och gör om tomma strömmar, upp till tre gånger, innan kunden ser något (bokförs som `tomt_svar` i `ai_errors`). Resonemanget är avstängt i portalen också, och portalen sparar aldrig ett tomt svar. Tre tester, mutationsprovade. Sex provsvar i drift efteråt: 6 av 6 hela, på 1,2–3,6 s mot 6–37 s. **Alla fyra månadskörningar skedde före lagningen** · `mätt`
- [x] **KA21** *(lagad 2026-09-26, `93a37ebb`: knappen formulerar först en sökfråga på högst tolv ord (ett litet anrop utan webb) och får inte bekräfta mot källor som handlar om något annat. Skarpt provad på representationsfallet: sökfrågan "Skatteverket moms representation 300 kr per person" gav Skatteverkets sida om moms vid representation med regeln ordagrant, och kontrollen sa ärligt att den inte fann belägg för årtalet)* **Kontrollera mot källan träffar ibland fel sida.** Den 5/10 hittade den bara Skatteverkets sidor om privat deklaration och bekräftade då ett felaktigt momspåstående. Den 21/10 hittade samma knapp rätt sida och rättade. Hos läraren sa den att en felaktig tumregel om betygskriterier "håller". Sökningen byggs ur hela svaret; en kort, riktad sökfråga som modellen formulerar först (ett billigt anrop till) bör träffa bättre · `portal/app.js` (knappen), `functions/api/ai.js` (plugin) · `mätt` · ~2 h
- [x] **RE8** *(lagad 2026-09-26, `93a37ebb`: teamLogg() i systemFor — de andra agenternas tre senaste leveranser (datum + rubrik), nyast först, högst 1 500 tecken. Två tester; syns i drift: agenten hänvisade själv till "teamloggen 2026-10-05")* **Agenterna vet inte vad de andra gjort.** Hos alla fyra kunder: VD-assistenten trodde att nyhetsbrevet var oskrivet när skribenten redan gjort det, sa att "inga offerter har gått ut" efter två offerter, och planeraren planerade utifrån läget i vecka 1. Varje agent ser bara sitt eget samtal. Förslag: en kort teamlogg (senaste leveranser per agent, rubriker och datum — samma destillat som `digestMessage`) i varje systemprompt · `portal/app.js` (`systemFor`) · `läst i dagböckerna` · ~3 h

- [x] **KA19** *(lagad 2026-09-26, `57b3d13a`)* **Bygget levererade trasiga team när ett steg bröts.** Uppmätt i drift under simuleringens andra körning: strömmar som bröts utan finish_reason gav research på 719 tecken, en skalning på 0 och ett förslag på 23, och sammanställningen byggde ett "team" av två agenter som kontrollen godkände. Ett annat bygge fick fem agenter när skalningen beslutat fyra. Lagat en gång för alla: `kravSlut` i `atb-claude.js` gör ett avbrutet eller avkapat svar till ett fel som går att försöka om. `stegBrister()` och `teamBrister()` i DELAD-blocket underkänner för korta steg samt fel antal agenter i förslaget och i teamet. `medOmförsök()` gör om varje steg automatiskt upp till tre gånger innan kunden ser något, och sammanställningen görs om automatiskt i stället för att visa en knapp. Åtta tester med de riktiga trasiga byggena som fixturer; två mutationsprov. Simuleringens byggskript kör samma kontroll · `atb-claude.js`, `builder/builder.js` · `mätt` **Tillägg samma kväll:** fel antal agenter gick inte att lösa med omförsök — modellen gav fem mot beslutet fyra även med antalet uttryckligen i meddelandet. `trimmaTeam()` rättar det deterministiskt: VD, VD-assistent och de högst prioriterade specialisterna behålls, resten flyttas till de avvisade med skäl och deras rutiner till ingångsagenten. Två tester på det riktiga femagentsteamet.

- [x] **KA15** *(första versionen 2026-09-26: portal/fakta-se.js med 16 regler kontrollerade mot primärkälla — ROT, ROT i bostadsrätt, RUT, representation moms och inkomstskatt, påminnelseavgift, förseningsersättning, dröjsmålsränta, julgåva 600 kr 2026, friskvård, momsdatum, mobiltelefon, fast telefon, betalningsföreläggande, utvecklingssamtal/risk för F, betygsskalan. Följer med i varje instruktion med källan och regeln att rättelser mot listan inte godtas och rättelser som stämmer aldrig avvisas. Vakt: testet fäller bygget när filen är äldre än 13 månader. Verifieringen rättade tre fel i uppdraget: ROT är 30 % från 2026, julgåvan 600 kr, ingen "F-varning" i skollagen)* **Skarpt provad i drift (`0599ef6d`):** tre regelfrågor som gick fel i simuleringen — ROT för BRF (rätt, med Skatteverkets villkor för bostadsrättshavaren), påminnelseavgift (60 kr, avtalad i förväg, lagrum) och en FELAKTIG rättelse om julgåva 1 800 kr (avvisad: 600 kr 2026, med källa). 3 av 3 rätt. `mätt` *(skärpt 2026-09-26 kväll: DeepSeek gör det omvända mot gpt-oss — skribenten VÄGRADE två gånger en korrekt rättelse om moms på representation, trots att den stod i företagsminnet, och kallade den rätta regeln "den gamla". Båda modellerna faller alltså på regler, i var sin riktning. Faktabasen är enda vägen)* **Sakfel i regelfrågor utan förbehåll, och modellen godtar kundens felaktiga rättelser.** Verifierat mot transkript och primärkällor: ROT utlovat till en bostadsrättsförening, påminnelseavgiften kallad "lagstadgad, 100 kr" (högst 60 kr och bara om den avtalats, lag 1981:739), 50 % avdrag på representationslunch, en påhittad paragraf om moms på mobiltelefoner, betygsstegen "C-"/"E-" och påhittade betygskriterier. När kunden rättade fel (presentkort och julgåvans gräns, som är 600 kr för 2026) skrev modellen in rättelsen utan invändning. Den kände inte heller till Gy25. Detta går inte att prompta bort. Fix: en kontrollerad faktabas per bransch som regelsvar hämtas ur, med länk till källan, och annars "det här vet jag inte säkert". Se **PR7** · `testoutput/sim-2026-09/granskning-tre.md` · `mätt` · beror på PR7
- [x] **KA16** *(regeldelen gjord 2026-09-26: [fyll i: …] i PORTAL_RULES och portal-team.md. Faktaprofilen återstår (PR7))* **Påhittade uppgifter i texter som är gjorda för att skickas.** Samma påhittade telefonnummer (070-123 45 67) i två kundmejl, ett organisationsnummer med 556-prefix för en enskild firma, en e-postadress till en anställd, erbjudandet "10 % på nästa köp" och en kundworkshop som ingen bestämt. Platshållare i hakparentes används ojämnt. Fix: en faktaprofil per kund (timpris, prislista, organisationsnummer, kontakt, signatur) som alla agenter läser, plus en regel i `PORTAL_RULES` att saknade uppgifter alltid blir `[fyll i: …]` · `functions/api/_build.js` (`PORTAL_RULES`), portalens minne · `mätt` · ~3 h
- [x] **KA17** *(promptfix 2026-09-26: VIKTIGT i PORTAL_RULES och portal-team.md säger vad agenten kan och inte kan)* **Agenterna lovar förmågor de inte har, och löftena står redan i systemprompterna.** Word-dokument och PDF, "redo att laddas upp i Fortnox", en PowerPoint-slide, Outlook-regler som skickar på ett datum, "leverans inom 24 timmar", granskning enligt GDPR. Sammanställningen skriver in dem. Fix: en rad i `PORTAL_RULES` om vad agenten kan (text i chatten, inga filer, inga integrationer, inget minne mellan agenter), och en kontroll som letar efter löftesord · `functions/api/_build.js:107-117`, `testoutput/sim-2026-09/bygg/structure-raw.json` · `mätt` · ~1 h
- [x] **KA18** *(mätt om 2026-09-26 med DeepSeek och resonemanget avstängt: 0 tomma av 15. Ett tunt intag (frisörsalong, en rad per fält) gav två relevanta frågor 3 av 3 gånger; de utförliga simuleringsintagen gav OK, vilket är rätt. Felet var KA12, inte tröskeln)* **Följdfrågorna blir nästan aldrig ställda.** Även när taket räckte svarade `clarify` "OK" i 7 av 13 körningar, och riktiga frågor kom 2 gånger. Hybridintaget är i praktiken ett formulär. Rätta taket först (**KA12**) och mät sedan om. Blir det fortfarande "OK" behöver `CLARIFY_BAS` en lägre tröskel för att fråga · `functions/api/_build.js:86-101` · `mätt` · ~1 h efter KA12
- [x] **RE7** *(lagad 2026-09-26: veckostarten får förra veckans veckostart, datumen de närmaste tre veckorna ur årshjulet och myndighetsdatumen, och instruktionen att inte upprepa)* **Veckostarten är samma tabell varje vecka.** Alla fyra kunder rapporterade i stort sett identiska veckostarter fyra måndagar i rad. Momsdagen hos byrån och utvecklingssamtalsveckan hos läraren missades, fast båda stod i företagsminnet, som låg i systemprompten. Samma sjukdom som **RE4** (veckobrevet), men i portalen. Fix: skicka med förra veckans veckostart och en uttrycklig instruktion att inte upprepa den, plus veckans deadlines ur `portal/deadlines-se.js` och säsongen · `portal/app.js:4242-4254` · `mätt` · ~2 h
- [x] **DR14** *(stängd 2026-09-26 med modellbytet: nya siffror i index.html och villkor.html)* **gpt-oss kostar fyra gånger mer än sajten och villkoren säger.** OpenRouter listar i dag $0,15/$0,60 per miljon tokens. `index.html:505` och `:542`, `villkor.html` §3–4 och `CLAUDE.md:365` räknar med $0,037/$0,170, och `index.html:542` säger dessutom att "modellpriser har hittills bara sjunkit". Kostnaden är fortfarande liten (uppmätt ≈ 0,25 kr per kund och månad i simuleringen), men texten kunden läser stämmer inte. Rättas i samma pass som ett eventuellt modellbyte (**PR8**), som påverkar samma siffror · `index.html:505`, `:542`, `villkor.html` §3–4, `CLAUDE.md:365` · `mätt` · ~30 min
- [ ] **DR15** *(utrett 2026-09-26: mönstret är två gpt-oss-svar den 28 sep som bara är en inledning + `---` och sedan tar slut — 231 och 255 tecken, "Nedan svarar jag på dina två frågor." Troligen gpt-oss kanalformat, inte vår ström. Hände innan anropsloggen fanns, så finish-orsaken är inte mätt. Modellen är utbytt; bevaka med DeepSeek i nästa simulering innan något byggs)* **Svar som slutar mitt i ett ord utan att ha slagit i taket.** Redovisningsbyråns påminnelsesvar 2026-09-28 tog slut mitt i ett ord med `finish: stop`. Orsaken är inte undersökt. Kan vara strömningens avslut i `ai.js` eller leverantören (Cerebras) · `testoutput/sim-2026-09/redovisning/anrop.jsonl`, `functions/api/ai.js` · `mätt` (en gång) · ~1 h utredning
- [x] **DR17** *(lagad 2026-09-26: kopresan.mjs rensar kommentarer före matchningen och visar nu fem brott)* **Kontrollskriptet i skillen kundresa rapporterar KR6 som öppen fast den är lagad.** `kopresan.mjs` matchar ordet `kvittomejlet` i en kodkommentar i `portal/aktivera.html`. Det är samma fälla som det första KR3-testet gick i. Skriptet visar därför sex brott när de verkliga är fem. Fix: rensa bort kommentarer före matchningen (`utanKommentarer()` finns i `test/portal.mjs`) · `.claude/skills/kundresa/kopresan.mjs:94` · `mätt` · ~10 min
- [ ] **DR16** **Simuleringens fyra testteam ligger i den skarpa databasen.** Rader i `teams`, `users`, `team_access` och `sessions` med slug som börjar på `sim` och e-postadresser `sim-*@simulering.invalid`. De stör ingen kund men räknas i `ai_usage`. Ta bort dem, eller behåll dem som fixtur för nästa simulering. Säkerhetskopia före simuleringen: `backup/d1-remote-2026-09-26T10-56-00.sql` · `mätt` · beslut, ~10 min

- [x] **KR5** *(lagad 2026-09-26: aktivera.html skriver atb_last_run_purchased; Buildern visar Öppna portalen i köppanelen, återupptagningsrutan och avslutsrubriken, och glömmer markeringen när ett nytt bygge startar. Kundresans skript går från 5 till 3 brott)* Buildern säljer teamet en gång till — direkt efter att kunden köpt det. `clearRun()` anropas bara av "Släng den" (`builder.js:233`, `:886`) och `aktivera.html` rör aldrig `atb_last_run`. Kunden som just betalat och sedan klickar "Bygg ert team" möts av återupptagningsrutan och därefter av avslutets "Teamet finns bara i den här webbläsaren … byter du dator är det borta" — falskt för henne — plus en fungerande köpknapp för teamet hon redan äger (dubbeldebitering, två team, manuell återbetalning). Det är också bränslet till **KR4**. Fix: låt `aktivera.html` (samma origin) skriva `atb_last_run_purchased = slug` när statusrutten svarar klart · `builder/builder.js:218-235`, `:886`, `:1679-1698` · `läst i koden` · ~1–2 h
- [x] **KA7** *(lagad 2026-09-26: vid rent enkätintag krävs svar på båda följdfrågorna med minst 40 tecken, och svaren ekas in under Var det klämmer i intaget i stället för sist; två tester i test/intake.mjs)* Enkätvägens hela skydd är femton tecken. Grinden från 2026-08-17 håller (kontrollerat: rent kryssintag ger tvingande följdfrågor utan "hoppa över"), men `builder.js:851` kräver bara att ETT av två reservsvar är ≥15 tecken — det andra blir `"(inget svar)"`. Två kunder i samma bransch kan alltså skilja sig på ca 110 tecken av ~1 250, och researchsteget ska hitta hela verksamhetens särart i en enda mening — hos just den kund som valde kryssvägen för att hon har svårt att formulera sin verksamhet. Fix: kräv svar på båda frågorna (de mäter olika saker — veckan och skillnaden mot branschen) och höj golvet till ~40 tecken; eka in `intake.extra` under "Var det klämmer" i stället för sist som "Kompletterande svar" · `builder/builder.js:764`, `:849-857` · `mätt` · ~1 h
- [x] **KA8** *(lagad 2026-09-26: LEVERANS har samma innehållsgolv som perspektivet, via samma rubrikläsare)* Golvet skyddar PERSPEKTIV men inte LEVERANS. `kontrolleraSystemprompter` kräver att båda rubrikerna finns, men bara `DITT PERSPEKTIV` har ett innehållsgolv (`PERSPEKTIV_GOLV = 60`, `builder.js:1114`). En `LEVERANS`-rubrik med ingenting under passerar — och det är "Klart när"-punkterna under den som gör kvalitetschecklistans ja/nej-svarbara leveranser möjliga. Referensnivån är mätt: de kurerade teamens systemprompter ligger på 2 453–4 931 tecken, median 3 052. `lansering.md:45` säger att nuvarande modell ger 1 319 och att fixen är `minLength` i schemat — **den biter troligen inte**: OpenAI-stilens structured output ignorerar oftast `minLength`. Fix: `leveransText()` med eget golv i det delade blocket, så testerna kör samma kod som kunden. **Uppmätt igen 2026-09-26:** 18 agenter ur fyra byggen i drift har systemprompter på 928–1 676 tecken. Löses naturligt av den strukturella fixen i **KA11**, där fälten ges var för sig · `builder/builder.js:1114`, `:1192-1206` · `mätt` · ~2 h
- [x] **DR6** *(lagad 2026-09-26: sendMail bokför fel som ai_errors code mail; /api/health har checks.mejl och checks.hemligheter (sju driftsecrets, namn men aldrig värden))* Mejlvägen kan dö totalt medan `/api/health` säger 200. Inloggning sker med engångskod till mejlen — utskicket är alltså enskild felpunkt för ALL portalåtkomst. Men `sendMail` gör bara `console.error` + throw; ingenting bokförs i `ai_errors`, och hälsokontrollen tittar varken på mejlfel eller på om de övriga sju hemligheterna är satta. En roterad avsändarnyckel ger exakt B1-scenariot igen: produkten stum för nya inloggningar, hälsan grön, upptäckt när en kund hör av sig — via den kanal som inte fungerar. Frågan "kan vi upptäcka att en secret saknas?" har i dag svaret nej för 7 av 10 värden. Fix: boka `ai_errors` med kod `mail` i felgrenen (samma upsert finns i `ai.js:611`) + närvaro-booleaner i `health.js` · `functions/api/auth/_lib.js:266-294`, `api/health.js:44-79` · `läst i koden` · ~1–2 h
- [x] **DR8** *(lagad 2026-09-26: test/webhook.mjs, 36 tester mot riktiga onRequestPost med signerade händelser och en minnesdatabas som kastar vid okänd SQL; fem mutationsprov. **Fynd lagat samma dag:** invoice.paid öppnade även refunded — en omskickad faktura efter ångerknappen gjorde ett ångrat köp till gratis standard. Nu öppnas bara past_due och cancelled, och aldrig av en faktura betald före planens senaste ändring)* Betalningens livscykel har noll tester. Webhookens dispatcher har sex grenar; inget test kör `onRequestPost`. `test/plan.mjs:23` importerar bara hjälparen `subscriptionOf`, `test/stripe.mjs` testar signaturkontrollen i `_stripe.js`. Samma för `teams/[slug].js` — dörren varje betalande kund går genom — och för `checkout.js`. En regression här är per definition tyst: "uppsagd kund behåller åtkomst" märks aldrig; "invoice.paid öppnar inte en spärrad kund igen" märks som en arg kund veckor senare. Pass 2-dokumentationen varnar själv: "allt ser ut att fungera precis som förut". Selen finns: `test/ai.mjs` kör redan riktiga `onRequestPost` med stubbad D1 · `functions/api/stripe-webhook.js:40, 68-77`, `api/teams/[slug].js`, `api/checkout.js` · `mätt` · ~3 h
- [x] **DR9** *(lagad 2026-09-26: checks.ai_kostnad i /api/health, larm över 150 kr/dygn räknat med kronorFör(); per team finns kronmätaren (40 kr) sedan samma dag)* Kostnaden syns först när krediten är slut — alltså som driftstopp. Räknat på dagens tak och priser: värsta anrop på fria rutten ≈ 5 öre, dygnets tak sammantaget ≈ 200 kr. Men det finns inget globalt MÅNADSTAK (bara per team), så en uthållig skörd kostar ~6 000 kr/mån tills någon tittar i `ai_budget` för hand eller 402:an gör hälsan röd. **Instrumentet före ratten** (pass 3.2 i `docs/roadmap.md` är fortfarande öppen): en fjärde boolean `budget_ok` i `/api/health` — dygnets tokens ur `ai_budget` under en larmnivå — låter vakten från **DR7** fånga rusningen innan den blir ett stopp, utan att siffror läcker ur den öppna rutten. Taket sätts sedan, när kurvan är sedd · `functions/api/ai.js:55-99`, `api/health.js` · `mätt` · ~1 h
- [x] **DR10** *((a) lagad 2026-09-26 med modellbytet: test/klient.mjs kräver samma MODEL_ID på tre ställen. (b) lagad samma dag: checks.veckobrev i /api/health räknar aktiva prenumerationer på öppna team utan brev på åtta dagar)* Modellen bor på tre ställen och inget test håller ihop dem. `openai/gpt-oss-120b` står i `atb-claude.js:26`, `functions/api/ai.js:99` och `functions/api/digest/run.js:28`; noll träffar på strängen i `test/`. Dagen modellen byts uppdateras de två första i samma arbetsflöde och veckobrevet glöms — uppströms svarar 404, felet bokas i `ai_errors` som ingen läser, breven slutar komma. Veckobrevet saknar dessutom helt en "kom brevet fram?"-detektor: dör workern själv skrivs ingenting någonstans. Fix: (a) ett tio-minuters test som kräver att de tre strängarna är identiska; (b) hälsokontroll på prenumeranter vars dag passerat utan `last_sent_day`-uppdatering på >8 dagar · `atb-claude.js:26`, `functions/api/ai.js:99`, `api/digest/run.js:28` · `mätt` · ~1,5 h
- [x] **DR11** *(lagad 2026-09-26: test i test/klient.mjs läser ATBClaude.x och ATBAvatars.x ur sex konsumentfiler och kräver medlemskap i de riktiga exportobjekten; mutationsprovat)* Delningsytan mellan klientfilerna vaktas av ingenting. Allt som korsar filgränserna i webbläsaren går via `window.ATBClaude` (elva medlemmar) och `window.ATBAvatars` (tre). Kontraktet stämmer i dag — alla tio använda medlemmar finns i exportobjektet, kontrollerat — men inget test fäller den dag någon döper om eller stryker en export medan en konsument står kvar. Det är B1:s exakta form: felet finns bara i webbläsaren och syns bara i konsolen. Fix: ladda filerna med stubbat `window` (görs redan i `test/klient.mjs`), greppa `ATBClaude\.\w+` ur konsumenterna och kräv medlemskap i det riktiga exportobjektet — samma mönster som teamrutt-grinden i `test/teams.mjs` · `atb-claude.js:360`, `avatars.js:84` · `mätt` · ~1 h
- [x] **BF6** *(kodhalvan lagad 2026-09-26: navigator.storage.persist() vid laddning av köpta team. Safari-knuffen och meningen i integritetspolicyn återstår)* Kundens betalda arbetsprodukt ligger i vräkningsbar lagring. Chatthistorik, företagsminne, underlag, streak, tidsliggaren och `teamExt` bor alla i localStorage; noll träffar på `navigator.storage.persist()` i hela repot — lagringen är "best effort" och webbläsaren får vräka den. Safari raderar all skriptskrivbar lagring (localStorage OCH IndexedDB, inklusive mapp-handtagen) efter sju dagars användning utan besök, för allt som inte installerats som app. Produktens dokumenterade akilleshäl är att kunden uteblir i vecka tre — på iPhone betyder det att ett halvårs samtal, minne och just den sparade-tid-siffra som ska motivera förnyelsen kan vara borta när hon kommer tillbaka. Mappfunktionen, som är räddningen, finns bara i Chrome/Edge. Fix: anropa `persist()` vid inloggad boot (ignorera avslag tyst) + engångsnudge för Safari utan kopplad mapp + en mening i integritetspolicyn · `portal/app.js` (boot-vägen — inga persist-anrop finns) · `mätt` · ~1–2 h
- [ ] **BF7** Företagsköparen lockas med momsavdraget men får inget momsunderlag. `index.html:492` säljer aktivt på avdraget ("drar av momsen blir det 72 respektive 232 kr") och `villkor.html:234-235` anger exkl.-belopp — men checkout-anropet skickar varken `invoice_creation` eller `automatic_tax` (noll träffar i hela `functions/`). Stripes standardkvitto utan momsspecifikation duger inte som avdragsunderlag, och det första ett företag gör vid månadsbokslutet är att leta efter momsen. Fix: `invoice_creation[enabled]=true` + momsuppgifter på priserna i Stripe, eller en dokumenterad manuell fakturarutin (villkoren antyder redan "faktura på begäran" — då måste rutinen finnas). Kontrollera samtidigt som live-läggningen · `functions/api/checkout.js:83-96`, `index.html:492`, `villkor.html:234` · `mätt` · ~1–2 h
- [x] **BF8** *(lagad 2026-09-26: en stycke om adressen och länk till integritetspolicyn i inbjudan)* Inbjudningsmejlet till kollegan saknar all integritetsinformation. `POST /api/team/invite` skapar en `users`-rad för en tredje person på ägarens uppgift (`invite.js:84-90`). Mejlet hon får har inloggningsinstruktioner och "Var det här oväntat? Strunta då i mejlet" — men ingen länk till integritetspolicyn och ingen antydan om att adressen nu lagras. Struntar hon i mejlet ligger konto- och åtkomstraden ändå kvar (för evigt, se **BF5**). GDPR art. 14 kräver information senast vid första kontakten, och mejlet ÄR första kontakten. En rad räcker · `functions/api/auth/_lib.js:338-347` · `läst i koden` · ~15 min

- [ ] **BF2** Gratisbygget delar ut hela den betalda leveransen. `downloadConfig()` skriver `stripTeam(team)` till fil — inklusive varje agents fullständiga systemprompt — utan konto och utan betalning. Prompterna går att klistra in i gratis ChatGPT och köra löpande, vilket underminerar beslutet "noll provsvar" vars motivering är att det är teamet som säljs. Behöver ett medvetet beslut, inte en bieffekt. **Mindre akut sedan K4** (2026-08-29): prompterna går att ladda ner, men inte längre att KÖRA gratis hos oss · `builder/builder.js`, `index.html:604` · `läst i koden` · ~2–4 h
- [x] **BF3** *(stängd 2026-09-26: functions/prompts/[[path]].js svarar 404 utåt; /api/ai läser filerna via env.ASSETS. Verifierat i drift: research.md ger 404 och ett riktigt skalningssteg läste sin prompt. Reservvägen (självhämtning) stängs samtidigt, avsiktligt)* Fyra prompter ligger öppet på webben, inklusive den filen projektet självt kallar nyckelsteget. Uppmätt: `curl …/prompts/shared/research.md` ger 200 och 17 807 byte klartext. Skälet som fanns — Buildern måste kunna hämta dem klientsidan — **gäller inte längre sedan K4** (2026-08-29): det är servern som läser dem. Kvar står att `build-dist.mjs` kallar resten av `prompts/` "konsult-IP", en gräns som inte går att hålla samtidigt. Vägen är nu billigare än förut: filerna måste ligga i `dist/` för att `env.ASSETS` ska nå dem, men en Function på `/prompts/[[path]]` kan svara 404 utåt — ASSETS-läsningen går förbi Functions-routingen. Verifiera den ordningen innan du bygger på den · `build-dist.mjs:45-53`, `functions/api/_build.js` · `mätt` · ~30 min (acceptera) / ~2 h (stäng utåt)

## Framåt — utveckling

- [ ] **PR7** **Från AI-team till färdiga uppdrag.** Simuleringen visar var nyttan uppstod: när kunden gav underlaget och bad om en avgränsad text (mallar, policy, mejl). Den föll på öppna frågor, regler ur minnet, initiativ och teater. Den tomma chattrutan är samma hinder som gör ChatGPT krångligt för målgruppen. Förslaget: en assistent i gränssnittet; 6–10 uppdrag per kund, genererade i bygget ur kundens vecka (fält in, färdig text ut); en faktaprofil som fylls i en gång (**KA16**); regelsvar bara ur en kontrollerad faktabas (**KA15**); och initiativet via veckobrevet. Börja med hantverkare, där nyttan var störst och reglerna är få nog att kontrollera. Mät med en ny simulering: snitt minst 4 och minst två av fyra kunder stannar. Påverkar namnet "Mitt AI-team" och designspråket med personalliggaren. **Beslut, inte kod** · <https://claude.ai/artifact/VPZqX6932A9d8fLpYqLht1> · `mätt` (simuleringen) · beslut; flera pass
- [ ] **PR8** **Mät hur långt en bättre modell räcker innan ni bygger om.** Kostnaden är inte hindret. Med simuleringens förbrukning ger Claude Haiku 4.5 ≈ 1,9 kr och Claude Sonnet 5 ≈ 3,8 kr per kund och månad (19 respektive 38 kr vid tio gånger mer), mot priset 290 kr. `testoutput/sim-2026-09/jamfor.mjs` spelar om alla 93 loggade portalanrop och kör bygget mot valfri modell, med produktionens prompter och schema. Kör Haiku 4.5, en Gemini Flash och DeepSeek v4.1 flash. Därefter kan modellen väljas per steg, med den bästa för bygget, som körs en gång per kund. Kräver en giltig `OPENROUTER_KEY` i `.dev.vars`: den som ligger där är en platshållare på 19 tecken · `testoutput/sim-2026-09/jamfor.mjs`, `functions/api/ai.js:99`, `atb-claude.js:26`, `functions/api/digest/run.js:28` · `mätt` · ~1 h + några kronor

- [x] **PR3** *(se BF3 — generatorns prompter är stängda utåt, oberoende av OM1)* Generatorns prompter bör stängas oavsett hur **OM1** faller. **BF2** och **BF3** behandlas i dag som två varianter av samma läcka, men de har motsatt logik. *Output-IP* (kundens teamfil) KAN bli en funktion — det är kundens team, byggt ur kundens verksamhet, och det är precis vad OM1:s ena väg säljer. *Generator-IP* (`prompts/shared/research.md` m.fl.) kan aldrig bli det: det är receptet, inte kakan, och researchsteget är enligt CLAUDE.md nyckelsteget — alltså exakt den fil som gör påståendet "ingen konkurrent bygger teamet ur kundens verksamhet" sant. Uppmätt i dag: `dist/prompts/shared/research.md` = 17 807 byte, publikt, och ingen Function vaktar `/prompts/`. Poängen är prioriteringen: **BF3 hänger inte på OM1** och ska inte vänta på beslutet · `build-dist.mjs:49-58`, `functions/api/_build.js:259-266` · `mätt` · ~2 h
- [ ] **PR1** Arbetsledarläget ÄR "vi bygger teamet, du kör det var du vill" — färdigbyggt och osålt. `workstyle: "coach"` levererar brief + självbärande prompt + "Klart när"-checklista för kundens egen AI. Uppmätt: ordet "arbetsledar" ger **noll** träffar i `index.html`, `villkor.html`, `site/`, `verticals/`, `README.md`, `docs/roadmap.md` och `docs/lansering.md` — ett läge som besvarar det tyngsta konkurrenshotet finns i produkten men inte i erbjudandet. Det öppnar dessutom engångspriset igen med hederlig logik: 4 990 ströks för att ingen molnstruktur för underhåll finns, men den här leveransen kräver **ingen drift av oss**. Underlag till **OM1**, inte ett beslut · `builder/builder.js:288-292`, `functions/api/_build.js:286` · `mätt` · beslut; ~2–4 h text om vägen väljs
- [ ] **PR4** **OM4** har en tredje väg som inte står i beslutet: integration utan inloggning. Alternativ A (en riktig integration) har ingen vinnande ruta — Fortnox/Visma är Vorkers hemmaplan, kalender/Gmail är precis det plattformsbundlarna ger gratis, och OAuth-tokens är drift, alltså ett brott mot princip 8 på riktigt. Alternativ C: **läsbara artefakter**. Årshjulet och rutinerna som `.ics` (noll träffar på kalenderexport i repot i dag), svar som `mailto:`-utkast. Ger huvuddelen av känslan att agenten *gör* något i kundens verktyg, med noll serverinfrastruktur, noll tokens och noll biträdesavtal. En `.ics` med momsdatumen ur `portal/deadlines-se.js` är dessutom en delbar artefakt som marknadsför produkten själv · `portal/deadlines-se.js` · `mätt` · beslut; ~4–8 h om det väljs
- [ ] **PR2** Riktningsregel: lånad tid-inventeringen. Omvärldsresearchen säger att Cowork är "vår mappfunktion plus våra rutiner" men drar inte konsekvensen per funktion. **På lånad tid:** mappen på datorn (plattformens kärnfunktion, nativt och utan Chrome-begränsning), auto-rutinerna (våra körs bara vid sidöppning — strukturellt sämre och kan inte bli bättre utan serverkörning som bryter princip 8), minne & underlag (projektmetaforen finns nativt). **Inte på lånad tid:** genereringen, mötet, veckobrevet, det svenska. Regeln: pröva varje ny arbetsytefunktion mot "gör plattformen detta gratis inom ett år?" — ja → underhåll men bygg inte ut. **Riv ingenting** — etapp 1–4 är byggda och betalda; det här gäller nästa timme, inte förra · `docs/omvarldsresearch-2026-08-18.md:56-70` · `läst i koden` · riktning
- [ ] **PR5** Återförsäljarspåret är den enda raden i funktionsglappstabellen där bristen är text, inte infrastruktur. Rad 9 ("white-label för byråer") fick varken ID eller åtgärd. Allt tekniskt finns: multi-tenant-portalen (`portal/teams/<slug>.js`), `/consult` + handoff, `scripts/provision.mjs`, platshanteringen (P5). En svensk AI-konsult som vill leverera team till SINA kunder kan köras på dagens kod. Det som saknas är en sida — "offert" nämns i dag bara i en FAQ-rad om flera *användare* (`index.html:670`), inte flera *kunder*. Kanalen överlever kommoditiseringen: när plattformen ger bort körmiljön är skräddarsömmen det som återstår att sälja, och den säljs av någon som sitter hos kunden. Löser mänsklig onboarding på köpet. **Inte** fork A i `docs/produktstrategi-sjalvbetjaning.md` (Mikael som konsult) — det här är att sälja verktyget till andra konsulter · `index.html:670`, `.claude/commands/consult.md` · `läst i koden` · beslut först; v1 ~4 h
- [x] **RE2** *(lagad 2026-09-26: knappen ✗ Blev det fel? under varje svar; rättelsen blir en daterad rad i företagsminnet (alla agenter läser den), nytt svar begärs, och länk till agentens instruktion när felet återkommer. Svarsraden fick samtidigt ⋯ Mer för de mindre använda knapparna — tio på en rad flödade ut på mobil)* Ingen väg tillbaka där svaret blev fel — och det är där abonnemanget dör. Per-svar-knapparna (kopiera, ladda ner, fortsätt härifrån, kopiera prompten, spara lärdomar, skicka vidare) förutsätter alla att svaret var bra. När agenten svarar generiskt — det klassiska churn-ögonblicket — finns reparationsverktygen (företagsminnet, P4:s "ändra agentens instruktion" `:3167`) två–tre klick bort i en annan panel, utan skylt från felet. Kunden drar slutsatsen "AI funkar inte för oss", inte "jag borde öppna Utveckla teamet". Skräddarsömmen är hela produkten; ett generiskt svar är ett brutet kärnlöfte, och portalens enda synliga svar på det är ett mailto i "Tyck till". Fix: en knapp per assistentsvar — "Blev det fel? Lär teamet" → "Vad missade agenten?" → sparas som minnesrad + länk som öppnar P4-dialogen för just den agenten · `portal/app.js:3960-4031`, `:3084-3200` · `läst i koden` · ~3–4 h
- [x] **RE3** *(den billiga halvan lagad 2026-09-26: steget Få veckostarten som mejl i kom igång-listan, bockas av när kunden tagit ställning. Engångs-pulskortet efter vecka ett återstår (P3))* Veckobrevet erbjuds aldrig i det ögonblick kunden är mottaglig. Opt-in är rätt beslut, men enda vägen dit är knappen "✉️ Veckobrev" bland extras (`app.js:1525`). Uppmätt: **noll** omnämnanden i `portal/aktivera.html` och **noll** i `builder/builder.js`, och den står inte i kom igång-checklistans fem steg (`:1971-1980`). Projektets egen tes står i `digest/run.js:3-5`: "vecka tre kommer hon inte ihåg att logga in" — hela den utgående retentionmodellen förutsätter alltså att kunden själv hittar en inställning i en sidopanel med ~25 rader, INNAN vanan dör. Mellan köpet och provmånadskortet på dag 25 finns ingen yttre beröringspunkt alls. Fix: en kryssruta på `aktivera.html` eller i Builderns avslut ("Skicka teamets veckostart som mejl på måndagar?") som seedar `weekly_digest` — fortfarande opt-in, men ett klick i rätt ögonblick. Plus ett engångs-pulskort efter vecka ett. Detta är den billiga halvan av **P3** · `portal/app.js:1522-1525`, `:1971-1980`, `portal/aktivera.html` · `mätt` · ~2–4 h
- [x] **RE4** *(lagad 2026-09-26: datum och veckonummer, årshjulets händelser inom fyra veckor med dagar kvar, fokusagent och fokusrutin som roterar med veckan. Årsrytmen läste fält (note/what) som inte finns i schemat — rättat)* Veckobrevet får identisk indata varje vecka → samma brev varje måndag → kanalen dör av upprepning. `digestPrompt(cfg)` bygger enbart på `teams.config`: agentlista, rutinlista, årsrytm. **Inget datum, inget veckonummer, ingen variation** — modellen vet inte ens vilken dag det är, så årsrytmen listas utan tidsrelation och "tre veckor till mässan" kan aldrig sägas rätt. Ett brev som märkbart upprepar sig lär kunden att det är säkert att ignorera, vilket bränner opt-in:en permanent — värre än inget brev. Fix (ingen ny data behövs): skicka med datum + veckonummer, räkna ut närmaste säsongshändelse serversidan (samma logik som portalens puls), och instruera rotation ("lyft en annan agent/rutin än förra veckan"; veckonummer % antal agenter räcker). Konfigen bär material för 4–6 distinkta brev · `functions/api/digest/run.js:95-150` · `läst i koden` · ~2 h
- [x] **RE5** *(lagad 2026-09-26: Veckans arbete är navet — Rapport till chefen, Det här har jag levererat, Kvartalet och Få veckan som mejl är vägar vidare därifrån, två rader färre i sidopanelen. Klickad igenom i drift med Playwright)* Fyra rader i arbetsytan är samma logg i fyra kostymer — och bryggan till köparen saknar skylt. För en aktiv kund har sidopanelen ~25 interaktiva rader; fyra av dem (**📈 Veckans arbete**, **🏆 Kvartalet med teamet**, **📣 Rapport till chefen**, **🏅 Det här har jag levererat**) är fyra renderingar av samma lokala logg. P6:s hopfällning gäller bara före första chattraden; steady-state rördes medvetet inte, och det är det som nu konkurrerar ut sig självt. Samtidigt: halvårssimuleringens churn-mekanik (värdet bevisas hos utföraren, beslutet fattas av köparen) fick i OM5 svaret *siffror på fler ytor*, men leveransen till köparen är fortfarande "kopiera texten". Kedjan *bjud in köparen → köparen slår på veckobrevet → köparen ser värdet varje måndag* finns i sin helhet i koden (`weekly_digest` är per (user, team), migration 0007; platserna finns sedan P5) — ingen yta säger det. Fix: en yta där de tre andra blir knappar inuti Veckans arbete, veckobrevsreglaget läggs där (= **RE3**:s opt-in-skylt), plus en rad i delningsrutan · `portal/app.js:1517-1535`, `:3313`, `:3878-3892` · `läst i koden` · ~3 h
- [x] **RE6** *(lagad 2026-09-26: pulskortet och kvartalsöverblicken säger avklarade rutiner motsvarar, inte teamet har gjort)* Två ytor lovar mer än talet bär. Överallt annars står "avklarade rutiner **motsvarar** X manuellt arbete" med utskrivna förbehåll (`:2825`, `:3884`, `:3927`). Pulskortet (`:2711`) säger "**Teamet har gjort** X manuellt arbete i veckan" och kvartalsöverblickens etikett (`:3872`) "manuellt arbete **teamet gjort**" — men talet är tidsuppskattningen på rutiner *kunden* bockat av, ofta arbete hon gjort tillsammans med teamet. OM5:s eget resonemang gäller formuleringen lika mycket som siffran · `portal/app.js:2711`, `:3872` · `mätt` · ~10 min
- [x] **KA9** *(bevisad 2026-09-26 för DeepSeek V4.1 Flash: tre mikroföretag i samma storleksklass (byggfirma, frisörsalong, fotograf) byggda i drift. Specialisterna är verksamhetsspecifika — ÄTA-vakten, Luckfyllaren, Instagram-avlastaren, Säsongen. Perspektivöverlapp mellan teamen: medel 0,05, max 0,24 (två offertagenter) över 48 par; inom ett team max 0,29; tak 0,70. Råutdata i testoutput/sim-2026-09/bygg2, ka9-salong, ka9-fotograf. Strukturen är densamma (VD + VD-assistent + två specialister) — det är designregeln, inte en brist)* Kärnregeln är obevisad för den motor som säljs. Allt divergensbevis i repot är äldre än modellbytet 2026-08-06: `testoutput/` har som nyaste fil 2026-07-18 (DeepSeek-eran) och `portal/teams/` är handkurerat. Enda skarpa körningen efter K4 var **ett** `scale`-steg. Det finns alltså **noll artefakter från en hel gpt-oss-körning i repot**, samtidigt som sprintrutan säger "kärnan är bevisat divergerande — se examples/". Divergensen i det som FINNS är däremot stark och ska inte rivas upp: KA4:s mått körd tvärs över team ger 466 specialistpar med max 0,35, VD-assistenten över 14 team median 0,05 / max 0,26. Fix: när nyckeln finns — tre byggen i samma storleksklass, råutdata i `testoutput/`, perspektivmåttet tvärs över körningarna. **Skärper KA4 med en tvärkörningsdimension, ersätter den inte**. **Delvis besvarad 2026-09-26:** fyra hela gpt-oss-byggen ligger nu i `testoutput/sim-2026-09/*/bygge.json` och `team.json`. Namnen och uppdragen skiljer sig, men strukturen är nästan densamma: VD-assistent + VD + 2–3 specialister i alla fyra (**KA14**). Tre byggen i SAMMA storleksklass, som punkten kräver, återstår · `testoutput/` · `mätt` · ~1 h när nyckeln finns
- [x] **KA10** *(lagad 2026-09-26: skalningsTak() och hållSkalningsTak() i builder.js läser beslutet och skriver om det över tabellens tak eller när det saknas; fem tester i test/skalning.mjs. Simuleringsskripten gör likadant)* Skalningsbeslutet fattas men läses aldrig. `scale.md` levererar "Skalningsbeslut: N agenter" och `rensaSkalning()` (`builder.js:984`) plockar ut raden för visning — sedan läser ingen kod talet. `TEAM_SCHEMA` har `minItems: 2` utan tak, så sammanställningen kan leverera nio agenter åt ett soloföretag och passera varje grind. Checklistpunkterna "solo och enterprise är olika i struktur" och konsult-regeln "nybörjare får färre agenter" mäts av **noll** tester — `grep mognad test/` ger inga träffar, trots att exemplen bär 3/4/6 agenter för nybörjare/van/byggare, och `test/skalning.mjs` bara testar textstädningen. Fix: parsa talet och fäll sammanställningen vid avvikelse, i samma pass som `kontrolleraSystemprompter`; plus ett test på `examples/` som läser mognadsnivå + agentantal ur filerna · `builder/builder.js:984`, `:1192` · `mätt` · ~2 h
- [ ] **DR12** Snittet i `portal/app.js` (5 209 rader) går längs sömmar som redan finns. Kostnaden i dag: 160 toppnivåfunktioner i ett globalt scope, och testerna når filen enbart via `new Function` på tre markörblock (~180 av 5 209 rader) — varje ny testbar funktion kräver ett nytt markörpar, och ett flyttat block gör att testet tyst kör fel utsnitt. **Skärpning av pass 6-punkten**, med filens egna sektionsbanderoller som snitt: `portal/logik.js` (allt DOM-fritt — de tre markörblocken, `isoWeek`/`mondayMs`/`quarterOf`, `contextFor`, `trialNoticeFor`) så testerna importerar en riktig fil och markörregexen pensioneras; `portal/store.js` (lagringslagret, `idb*`, mappsynken, `teamExt` — där race-fynden bott); resten kvar i `app.js`. Skripten är klassiska, så toppnivådeklarationer delas över script-gränser: snittet är klipp-och-ordna, inte refaktorering. Enda fällan: inget i en tidigare fil får KÖRA något ur en senare vid laddning (boot sist). Två rader i `portal/index.html` + två i `sw.js`:s SHELL måste med i samma commit — bygget fäller om det glöms · `portal/app.js:448`, `:2334`, `:2515`, `:3244` · `mätt` · ~4–6 h
- [ ] **DR13** Backupen skyddar mot fel katastrof och kräver att någon minns den. Känt sedan tidigare ("flytta dem") — skärpningen är två automatiseringar. (a) **D1 Time Travel**: Cloudflare håller point-in-time-restore i upp till 30 dagar. Gäller det kontot är diskkatastrofen redan täckt utan en rad kod — verifiera en gång (`npx wrangler@4.123.0 d1 time-travel info agent-team-builder`) och skriv in kommandot i CLAUDE.md:s backup-avsnitt som **första** återställningsväg. *(Obekräftat mot kontot — går inte att verifiera offline.)* (b) En schemalagd GitHub-workflow (vecka) som kör `wrangler d1 export` och sparar dumpen som workflow-artefakt (90 dagars retention): off-disk, automatiskt, noll minne. Kräver `CLOUDFLARE_API_TOKEN` som GitHub-secret — skapa den med **enbart D1-läsrättighet**, så en läckt token inte kan röra Pages · `scripts/db-backup.mjs`, CLAUDE.md backup-avsnittet · `läst i koden` + obekräftat (a) · ~1 h
- [ ] **PR6** Privatpersonssegmentet möter plattformspriset rakt av — ge det inga fler timmar tills B2B har en betalande kund. Buildern bär ett fullt personläge (`audience === "person"`, egna formulärtexter och enkätgrenar). Men kalkylen skiljer sig: **företaget** på 290 kr jämför med Vorker ~650 och AI Kollegorna 4 900 — vi vinner. **Privatpersonen** på 290 kr jämför med de stora AI-abonnemangen kring 210–230 kr, som ger frontier-modeller, projekt, minne och (med Cowork) schemaläggning. Vi är dyrare än plattformen med en mindre modell, och det som skiljer oss (skräddarsydda *företags*-team, momsdatum, personalliggaren) väger lättast för just den köparen. **Riv inte läget** — det är byggt och kostar inget att stå kvar. Men ge det ingen egen marknadsföring och räkna inte in det i tillväxtantaganden. Alternativt: personläget är den bästa **PR1**-kandidaten, eftersom arbetsledarläge + engångspris passar en privatperson bättre än ett abonnemang · `builder/builder.js:136-196` · `läst i koden` · beslut

- [ ] **P1** Ingen mätning av var köpresan läcker. **Kodhalvan är gjord 2026-08-29, knappen är din.**
  Påståendet att Cloudflare Web Analytics "kräver ingen CSP-ändring" var fel — uppmätt samma dag:
  `script-src 'self'` stänger ute `https://static.cloudflareinsights.com`, och en CSP-blockering syns
  inte för den som slog på knappen: panelen står bara tom, vilket ser ut som "ingen trafik". Värden
  ligger nu i `_headers` med ett test som håller den kvar (`test/csp.mjs`, sju tester — filen hade
  inga alls). `connect-src` behövde INTE vidgas, men det är villkorat: beaconen väljer mottagare med
  `v.send.to || (v.version === undefined ? "https://cloudflareinsights.com/cdn-cgi/rum" : null)`
  (läst i `beacon.min.js`), så **automatic setup** i Pages-dashboarden skickar till samma origin och
  ryms i `'self'` — medan den manuella inklistrade snutten skickar till `cloudflareinsights.com` och
  skulle blockeras, tyst. Slå alltså på den automatiska. Kontrollerat i drift 2026-08-29: ingen beacon
  levereras i dag, alltså är mätningen inte påslagen. Kvar sedan: en mening i `integritet.html` om att
  besöksstatistik samlas in cookiefritt — din text · `_headers`, Cloudflare-dashboarden · `mätt` · ~10 min
- [x] **OM1** *(besvarad 2026-10-23 av Mikael: vi bygger teamet, kunden kör det i sin egen AI — se Omläggning 2026-10-23, OL4–OL6)* Hållningen till Claude Cowork och ChatGPT Agents är inte bestämd. Cowork (april 2026) ger filsystemsåtkomst, schemalagda uppgifter och bakgrundsarbete — vår mappfunktion plus våra rutiner — gratis på varje betald Claude-plan, och Small Business-bundlen (maj) lägger integrationer ovanpå. Antingen är svaret "vi bygger teamet, du kör det var du vill" — och då är **BF2** (gratisbygget delar ut systemprompterna) en *funktion* som ska säljas, inte en läcka — eller så ska läckan stängas. Det är ett och samma beslut, och Coworks existens gör att det ska fattas nu · `docs/omvarldsresearch-2026-08-18.md` · `mätt` · beslut, inte kod
- [ ] **OM2** Ingen sida säger var modellen körs eller vad som lagras. AI Kollegorna säljer 4 900 kr/mån delvis på "ingen data lämnar era lokaler"; vi kör OpenRouter → `openai/gpt-oss-120b` med geografin osagd. Samma sida täcker EU AI Acts transparenskrav (i kraft 2 augusti 2026, vi ligger i limited risk: kunden ska veta att motparten är AI) och tar bort deras enda övertag mot oss · `integritet.html`, `index.html` · `mätt` · ~2–4 h
- [ ] **OM3** De två sakerna ingen konkurrent har står längst ner respektive i en sidopanel. Att en agent får **nej** är motgiftet mot exakt den kritik Sintra och Marblism får ("starka utkast, inte utförande"), och **mötet** löser Sintras mest citerade brist (helpers kan inte dela kontext). Flytta båda till framsidan — och gör det med en riktig körning, alltså tillsammans med **KR2** · `index.html:145`, `:163`, `:216-218` · `mätt` · ~2–4 h ihop med KR2
- [ ] **OM4** Integrationsspåret är varken valt eller bortvalt. Alla konkurrenter har verktygsåtkomst (Lindy 5 000+, Vorker Fortnox/Visma, Marblism Gmail/WordPress) — våra agenter kan tala, deras kan göra. Antingen **en** integration väl gjord (kalender eller Gmail; Fortnox är Vorkers hemmaplan), eller sälj bortvalet explicit: "vi kopplas inte in i era system." Att inte välja är det enda som är fel · `docs/omvarldsresearch-2026-08-18.md` · `mätt` · beslut först
- [ ] **P2** Gratisbygget fångar ingen e-post — övergiven körning är borta för alltid · `builder/builder.js:1432-1493` · `läst i koden` · ~4 h
- [x] **P3** *(lagad 2026-09-26: functions/api/_provmanad.js mejlar teamets ägare när fem dagar återstår (dag 25), via veckobrevets timklocka men efter timgolvet — ett test hittade att den först låg före golvet och hade mejlat på natten. En gång per team (markering i ai_usage), omförsök nästa timme om mejlet fallerar. Fyra tester mot riktig SQLite. Skarpa D1 har i dag inga provmånader, så inget mejl gick ut vid driftsättningen)* Provmånaden har ingen utgående livlina utanför portalen · `functions/api/_plan.js:65-86` · `mätt` · ~6 h

## Driftsatt 2026-10-24

Pages `374122f0`, commit `ee5df78`, taggen `deploy-2026-10-24`. Migration 0008 körd skarpt efter `npm run db:backup` (186 kB). 498 gröna.

Med i deployen är allt från passen 2026-10-23 och 2026-10-24: KA14, SP1–SP3, SP8, SP9, SP17 (prompten), SP19 och **SP21 (kopplingen)**. **SP17 gick ut omätt på Mikaels uttryckliga order** ("commit, push, deploy"). Planen var att mäta VD-assistenten 3 × 3 innan drift. Glänne-bygget nedan visade samma namnfel som SP17 handlar om, så mätningen står kvar som nästa pass.

**Verifierat i drift efteråt (mätt):**
- `/api/health` friskt med sju sanna kontroller. `/`, `/portal/` och `/builder/` svarar 200, och en påhittad sida svarar 404.
- `/.well-known/oauth-authorization-server` och `oauth-protected-resource` (även `/mcp`-varianten) svarar 200 med JSON. Pages kör alltså funktioner under `.well-known`, vilket inte var känt i förväg.
- `POST /mcp` utan nyckel ger 401 med `WWW-Authenticate: Bearer resource_metadata=…`.
- Hela kedjan har körts skarpt mot Glänne & Söners riktiga team: DCR, samtycke, 303 till claude.ai, token, ett jobb skapat via `/api/jobb`, och sedan initialize, lista, hämta och lämna via `/mcp`, med portalen som visar "levererad · Claude". Kördes med en tillfällig session på Mikaels konto. Sessionen, provjobbet, klienten och nycklarna är raderade efteråt, och räkningen är 0/0/0/0.

**Glänne & Söner skarpt:** byggt med den riktiga pipelinen och dagens prompter (`testoutput/glanne-skarp-2026-10-24/`). Det har fyra agenter (VD-assistenten, Offert & uppföljning, Ekonomi-avstämning, Artikel & sökdata), ingen VD-agent enligt KA14, en rekryteringsplan och fem avvisade förslag. Teamet ligger på glannstrom@gmail.com som `jQ8FGFMvPN8BXR3HFBYosy`. Det gamla `glanne-soner` är orört.

**Fynd:**
- Modellen hittade på efternamnet "Mikael Glänne" i fyra systemprompter fast intaget säger Glännström. Det är rättat för hand före provisioneringen. Det är SP17-felet i skarp form.
- Radslut: Python på Windows skriver CRLF, och `test/portal.mjs` klipper funktioner på `"
}
"`. Tre tester föll i deployens egen testkörning, och grinden höll. Skriv filer med `newline=""` eller via Node.
- `wrangler d1 --remote` kräver Global API Key (`CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`). OAuth-inloggningen ger 7403.

**Andra deployen samma dag (Pages `7ed9160b`, taggen `deploy-2026-10-24b`): SP22.** Verifierat i drift: `/` är öppningsscenen och svarar 200. `/om.html` 308-omdirigeras till `/om`, som visar 290 kr. `/site/`, `/site/coachonline`, `/verticals/` och `/verticals/hantverkare` ger 301 till `/`. `/site/showcase.css` svarar 200 och en påhittad sida 404. Hälsan är frisk. I emulatorn: inloggad besökare på `/` hamnar i sitt team, `?team=coachonline` leder till `/`, och `?intern=1` öppnar demot.

**Kvar, och vems:** att koppla en riktig Claude till `https://mittaiteam.se/mcp` med sitt konto är Mikaels. ChatGPT likaså. Texten i `integritet.html` om jobbkortet till plattformen är Mikaels.

## Driftsatt 2026-09-26

**Modellbytet till `deepseek/deepseek-v4.1-flash`** (Mikaels beslut efter
simuleringen). Tre deployer samma dag: `085277b3` (commit `fd26ddf`, bytet,
leverantörslistan och kundtexterna), `98a3de72` (`272d4ad`, inget resonemang i
bygget) och `4f1e651f` (`6feb242`, JSON-läget väljer snabbaste leverantör, 150/170 s).
Taggen `deploy-2026-09-26`. Inga migrationer, inga nya secrets. 286 gröna.

- **PROVIDER_ONLY:** fem amerikanska leverantörer (DeepInfra, Together, Fireworks,
  Parasail, CoreWeave) med `data_collection: "deny"`. Modellen erbjuds även av
  DeepSeek själv, Alibaba, SiliconFlow och StreamLake i Kina; med den gamla
  `sort: "throughput"` utan lista hade kundfrågor kunnat gå dit. `integritet.html`
  namnger de fem. **Integritetspolicyn lovar att underbiträdesbyten meddelas i
  förväg.** Inga betalande kunder finns (Stripe i testläge), så löftet bryts inte
  i dag, men det gäller nästa byte.
- **Resonemanget:** avstängt i bygget och för anrop under 2 500 tokens
  (följdfrågor, skalning, mötesperspektiv, veckobrev). Detta lagar **KA12** för
  alla fyra ställena. Portalens långa svar körs på `effort: "low"`.
- **Kundtexterna:** `index.html#forbrukning` (nya kostnadssiffror, ≈ 2 öre per
  svar, under 4 kr i månaden normalt) och `villkor.html` §2–3. Detta stänger
  **DR14**. `test/klient.mjs` vaktar nu modellraden på tre ställen plus att
  villkoren, integritetspolicyn och startsidan namnger samma modell. Testet är
  mutationsprovat: fel modell i veckobrevet fäller det.

Verifierat i drift efteråt:

- `/api/health` 200 friskt. Hub, portal och builder 200. Okänd adress 404. Fria
  rutten utan `step` ger 400. `mätt`
- Ett portalsvar kom från `deepseek/deepseek-v4.1-flash` via **Together**, alltså
  inom listan. `mätt`
- **Ett helt bygge i drift gick igenom Builderns kontroll på första försöket**
  (`testoutput/sim-2026-09/bygg-ds/`): research 45 s, skalning 2 s, förslag 41 s,
  sammanställning 33 s, alltså cirka 2 minuter mot 28 s med gpt-oss.
  Systemprompterna blev 2 088–3 377 tecken (gpt-oss 928–1 477, handkurerade
  2 453–4 931). DeepSeek skriver rubriken `DITT PERSPEKTIV`, så **KA11 slår inte
  till med den här modellen**, men kontrollen är lika skör som förut. Laga den
  ändå. `mätt`
- Teamet för samma byggfirma blev märkbart skarpare: en egen BKR-våtrumsagent,
  en VD-agent med operativt jobb (KA14 mildrad men inte löst: VD-agenten finns
  fortfarande) och sex avvisade förslag med motivering. `mätt` (ett bygge)

**Fynd under deployen:**

- Första försöket, med resonemanget på för bygget: research och förslag slog i
  8 192 tokens (`finish: length`) efter 45–50 s, och sammanställningen gav 408
  på 60/110 s. Samma mönster som när DeepSeek V4 Flash valdes bort 2026-08-06.
- **Portalens svarstid är 6–37 s** med `effort: "low"` (tre omspelade anrop ur
  simuleringen, 483–3 001 resonemangstokens). gpt-oss låg på 1,2 s i median.
  Veckostarten tog 37 s innan första tecknet. **Ett beslut kvar:** stäng av
  resonemanget helt även i portalen (snabbt, okänd kvalitet) eller behåll det
  (långsamt). Mät med `jamfor.mjs` när en nyckel finns (**PR8**).
- Ett faktasvar i sak är fortfarande fel. På frågan om ROT för en BRF svarade
  modellen att föreningen kan få ROT för gemensamma utrymmen, vilket inte
  stämmer. **KA15** (faktabasen) gäller oavsett modell.

**Andra omgången samma dag** (`5306572b`, commit efter `6feb242`): KA11, KA8, KA13, KA14 (delvis), KA16 (regeln), KA17, RE7, RE6, KA12 i mötet, DR17, BF8. 292 gröna. Verifierat i drift med ett nytt bygge av lärarens team (`testoutput/sim-2026-09/larare-ds/`): **Rättningsmenyn** äger nu återkopplingen, med "Du läser aldrig elevtexter. Du sätter aldrig betyg." under VIKTIGT (KA13). VD-rollen heter **Veckans prioriteringar** (KA14, personläget), och löftesregeln står i systemprompten (KA17). `mätt`. **Nytt fynd:** teamet blev sex agenter för en person, medan skalningstabellen säger 2–4 för solo. Det är **KA10**: skalningsbeslutet läses aldrig av koden.

**Tredje omgången** (`459d536c`): tre funktioner på Mikaels beslut.
- **Kronmätaren**: `kronorFör()` i `functions/api/ai.js` räknar tokens (redan bokförda per team i `ai_usage`) och webbsökningar till kronor med det högsta leverantörspriset. Taket är 40 kr per team och månad, alltså 17 % av 232 kr exklusive moms. Över taket körs **sparläge**: inget resonemang och ingen webbsökning, men svaren fortsätter. Larm i loggen vid 30 kr. `npm run kostnad` visar mätaren per team. Skyddar också mot det **DR9** beskriver, per team. `mätt` (simuleringens team 0,49–0,74 kr)
- **Kontrollera mot källan**: en knapp under varje svar. `body.webb` slår på OpenRouters webbsökning (Exa, fem träffar), låst till elva myndighetsdomäner (`WEBB_DOMÄNER`). Bara portal, bara på kundens val. **Skarpt provad** på DeepSeeks felaktiga ROT-svar om en BRF: på 25 s hittade den båda felen och länkade fyra Skatteverket-sidor och riksdagen.se. Kostnad 16 öre. `mätt`
- **↗ ChatGPT / ↗ Claude** under varje svar: agentens instruktion, företagsminnet och svaret följer med förifyllt (`chatgpt.com/?q=`, `claude.ai/new?q=`). Över 7 000 tecken kopieras texten i stället. **Inte provad i webbläsare**, och Claudes `?q=` är obekräftad.
- Villkoren och integritetspolicyn nämner Exa som underbiträde när kunden väljer kontrollen. 299 gröna.

**Fjärde till sjunde omgången** (sista deployen `204437be`, taggen `deploy-2026-09-26b`): KA10, DR6, DR9, KR5, BF6, RE4, DR11, KA18, RE2, DR8, BF3/PR3, KA7, DR10, RE3 och BF5. 362 gröna (från 286 på morgonen).
- **Fynd som bara syntes i webbläsaren** (Playwright mot drift, inloggad simuleringskund): svarsknapparna ritades **ovanför** varje sparat svar. På dator doldes det, eftersom knapparna bara syns vid hovring, men på mobil har kunden sett dem så sedan länge. Lagat i `bubble()`; tio knappar på en rad fick samtidigt `⋯ Mer`. `mätt` (skärmbilder i `testoutput/sim-2026-09/skarmbilder/`)
- **Fynd i DR8:** `invoice.paid` öppnade ett ångrat köp igen som gratis standard. Lagat och mutationsprovat.
- **/api/health** har nu sju kontroller, alla gröna i drift: ai_nyckel, databas, ai_kredit, **hemligheter** (alla sju driftsecrets finns — det gick inte att se förut), **mejl**, **ai_kostnad** och **veckobrev**. `mätt`
- **/prompts/** svarar 404 utåt, och bygget läser dem fortfarande (riktigt skalningssteg i drift). `mätt`
- **Gallringen** torrkördes mot skarpa D1 innan den gick ut: 0 team och 0 konton gallras, 1 kod och 1 utkast. Säkerhetskopia `backup/` (80,4 kB). Första riktiga körningen sker vid nästa timslag. **Inte kontrollerad efteråt** — kör `SELECT COUNT(*) FROM login_codes WHERE expires_at < <nu>` om en timme; den ska vara 0.

Kvar: simuleringens fyra testteam i skarpa D1 (**DR16**), och en ny
månadssimulering med DeepSeek för att se om betygen rör sig.

## Driftsatt 2026-09-06

> Dagen har **två** driftsättningar. Den första (`6f1af73a`) är KA6 och
> skillsen; den andra (`69cffcc0`, taggen `deploy-2026-09-06b`) är KR3, RE1,
> KR6 och DR7. Båda står här, i ordning.

### Andra driftsättningen — `69cffcc0`, commit `f13c289`

Fyra punkter, **två av dem verifierade med ögon** i den lokala emulatorn innan
de gick ut. `Uploaded 4 files (99 already uploaded)`. Inga migrationer, inga
nya secrets, en ny fil under `.github/workflows/`.

- **KR3** — provmånadskortet ritas om när sidopanelen ritas om. Punkten sa tre
  anropsställen; uppmätt i webbläsare var kortet borta redan efter att
  presentationsrundan stängts, alltså innan kunden gjort någonting alls. Fixen
  (en rad sist i `refreshSidebar()`) täcker alla.
- **RE1** — "Veckan som gick" läser förra veckan. `isoWeek()` tar ett datum,
  `routVeckanSomGick()` frågar efter rätt veckonyckel, och svaret bär vilken
  vecka det gäller så texten slipper gissa.
- **KR6** — kvittosidan pekar på inloggningen i stället för på en länk som inte
  finns.
- **DR7** — vakten är CI:t: `.github/workflows/health.yml`, var femtonde minut.

Verifierat i drift efteråt:

- `/api/health` **200 friskt**, alla tre kontrollerna sanna. `mätt`
- Hub, portal, builder svarar 200; okänd adress **404**; `aktivera.html` ger 308
  till den extensionslösa adressen (Pages standard). `mätt`
- **Den publicerade `app.js?v=5e2b7686` innehåller både `routVeckanSomGick` och
  `checkTrialNotice();` i `refreshSidebar()`** — fixarna är alltså ute, inte
  bara committade. `mätt`
- Kvittosidan i drift säger "Logga in med adressen ni betalade med" på båda
  ställena, och den döda hänvisningen till kvittomejlet finns inte kvar i någon
  text kunden ser (bara i en kodkommentar som förklarar varför). `mätt`
- `health`-workflowen är registrerad hos GitHub. Dess tre kontroller kördes för
  hand mot produktionen samma dag; första schemalagda körningen är det riktiga
  kvittot.

**Verifieringen med ögon, och varför den bar:** fixturen från
`portal-med-ogon` (`--plan trial --dagar 27`) framkallade provmånadskortet, och
genomgången mätte det efter varje steg — kortet står nu kvar hela vägen. För RE1
sattes förra veckans rutinlogg och veckoliggare i webbläsaren, varpå pulskortet
sa *"Ny vecka — förra veckan gjorde teamet ≈ 4,5 timmar manuellt arbete"* och
underlaget som gick till teamet innehöll *"Avklarade rutiner förra veckan:
Veckoplan med VD, Veckans bloggpost"*. Exakt de 270 minuter som förut blev noll.

**Fynd om testerna själva:** det första KR3-testet passerade med fixen
borttagen. Det läste funktionens källtext och matchade **kommentaren** ovanför
anropet, som nämner funktionen vid namn. En vakt som läser källtext måste läsa
kod — `utanKommentarer()` i `test/portal.mjs` finns nu för det, och alla nio nya
tester är mutationsprovade.

### Första driftsättningen — Pages `6f1af73a`, commits `16939bb` (fem projekt-skills) och `893a6b4` (KA6).
Taggen `deploy-2026-09-06`. Wrangler rapporterade `Uploaded 0 files (103 already
uploaded)` — **inget statiskt innehåll ändrades**, hela passets kodändring ligger
i Functions-bundeln (`functions/api/_build.js`, en rad prompttext plus
kommentar). Inga migrationer, inga nya secrets, ingen ny rutt.

Verifierat i drift efteråt:

- `/api/health` **200 friskt**, alla tre kontrollerna sanna.
- Hub, portal, builder, galleri och branschsidor svarar 200; `villkor.html` ger
  308 till den extensionslösa adressen (Pages standard). Okänd adress → **404**.
- Fria rutten utan `step` → **400 `build_step_required`** med den svenska
  texten. K4-grinden står.
- **Ett riktigt sammanställningssteg kört skarpt mot produktionen** (fiktivt
  underlag, cykelverkstad i Umeå): 200, 8 310 tecken giltig JSON, fyra agenter,
  fyra rutiner, ett avvisat moment, en säsong — och **exakt 3 startförslag på
  var och en av de fyra agenterna**. Det är verifieringen av KA6: den ändrade
  prompttexten och `TEAM_SCHEMA` är överens i drift, inte bara i testet. `mätt`

**Push-glappet hade en orsak till, och den är stängd.** `main` hade **ingen
upstream konfigurerad** — `git push` utan argument avbröts med
"set-upstream"-uppmaningen och gjorde ingenting. `git log origin/main..main`
fungerade hela tiden (referensen fanns), så glappet var osynligt från den
kontrollen. Satt nu: `main` följer `origin/main`. CI-körningen på `893a6b4` gick
grön.

**Nytt i repot: `.claude/skills/` — fem procedurer som går att köra.**
`driftsatt` (den här kedjan), `kopplad-andring` (registret över filer som måste
ändras samma dag, 16 kopplingar), `kvalitet-team` (kärnregeln mätt, inklusive
överlapp *mellan* team), `portal-med-ogon` (Playwright, demo eller riktig
inloggad kund) och `kundresa` (köpkedjan länk för länk). De hittade tre saker
under sitt eget bygge:

- **KR3 är reproducerad i webbläsare** och är värre än punkten säger:
  provmånadskortet är borta redan när presentationsöverlägget (`#ovl`) stängs,
  alltså före de tre `refreshSidebar()`-anrop KR3 listar. Fixen är fortfarande
  en rad, men den måste täcka alla fyra. `mätt`
- **Varje moln-team ger två konsolfel vid laddning.** Portalen provar
  `teams/<slug>.js` innan den faller tillbaka på `/api/teams/:slug`
  (`portal/app.js:825`), så varje betalande kund får en 404 och ett MIME-fel i
  konsolen. Fallbacken är avsiktlig; bruset döljer riktiga fel vid felsökning
  hos en kund. `mätt`
- **`sektionText` på `LEVERANS` med `indexOf` klipper ut fel stycke** när ordet
  står i löpande text — uppmätt på `studio.js`. Det delade perspektivmåttet i
  `builder/builder.js` har samma svaghet för sin rubrik; den har inte slagit
  till, för "DITT PERSPEKTIV" sällan står i brödtext.

Kvar och Mikaels: Stripe live-nycklar (hål 0), Web Analytics med **automatic
setup**, och en uptime-vakt mot `/api/health` — eller **DR7**, som gör CI till
vakten utan nya konton.

## Driftsatt 2026-09-01

Pages `a125bc7a`, commit `dbde03b`. **Ingenting kundvänt ändrades** — wrangler
rapporterade `Uploaded 0 files (103 already uploaded)`, alltså byte-identiskt
innehåll. Passets enda kodändring är en kommentar i `build-dist.mjs`, och
`granskning/` står inte i ITEMS. Deployen kördes för att bekräfta att kedjan är
grön, inte för att skeppa något.

Verifierat i drift efteråt:

- `/api/health` **200 friskt**, alla tre kontrollerna sanna.
- Fria rutten utan `step` → **400 `build_step_required`** med den svenska
  texten. K4-grinden står.
- Hub, builder, portal och galleri svarar 200; `villkor.html` och
  `integritet.html` ger 308 till de extensionslösa adresserna som svarar 200
  (Pages standard, inget fel). Okänd adress → **404**.
- **BF3 bekräftad skarpt:** `prompts/shared/research.md` svarar 200 med
  17 807 byte klartext. Siffran i BF3 är alltså inte historisk — den gäller nu.

**Fynd under deployen, och det är det viktigaste i det här avsnittet:** `main`
låg **åtta commits före `origin/main`** — allt från `4fbaaae` (K4) till
`3533ad9`. Hela 2026-08-29-passet var alltså driftsatt sedan tre dagar utan att
någonsin ha pushats. Två följder: **CI hade inte kört på den kod som låg i
produktion** (workflowen triggar på push, deployen kräver ingen), och argumentet
i CLAUDE.md:s backup-avsnitt — att D1 är den enda datakällan som inte går att
återskapa, eftersom "koden, prompterna och besluten ligger i git" — förutsätter
en git som finns någon annanstans än på samma disk som `backup/`. Den
förutsättningen höll inte. Se **DR13**.

**Stängt samma dag:** `6bdc993..3533ad9` pushad, `origin/main..main` är tomt, och
CI-körningen på `3533ad9` gick **grön** (tester, bygge, `check-dist`) —
[run 33540117832](https://github.com/glannstrom-lab/agent_team_builder/actions/runs/33540117832).
Föregående körning var `6bdc993` den **18 augusti**: testsviten hade alltså inte
sett produktionskoden på två veckor. `npm run deploy` pushar fortfarande inte —
kör `git log --oneline origin/main..main` efter varje driftsättning.

## Dokumentationsfel — rättade 2026-09-01

Rättade direkt i filerna (rent git-träd före och efter; `npm test` 274 gröna,
`npm run check:dist` ren). Raderna står i terminalsvaret.

- `CLAUDE.md:210` sa "Taken har tester i `test/ai.mjs` (17 st)". Uppmätt i dag med `node --test test/ai.mjs`: **34**. Parentesen läses som nuläge, så siffran är nu daterad i stället för struken — filen har vuxit med K4.
- `CLAUDE.md:523` sa att migrationerna är `0001`–`0005`. Det finns **sju** (0006 `ai_errors`, 0007 `weekly_digest` — CLAUDE.md:s eget repo-träd listar dem). Rollback-resonemanget håller — `ALTER TABLE` finns bara i 0003 och 0005, kontrollerat — men intervallet fick nästa läsare att antingen kontrollera i onödan eller anta att 0006–0007 inte omfattas.
- `build-dist.mjs:50-52` sa "Buildern kör exakt dessa filer verbatim (builder/builder.js)". **Falskt sedan K4**: `builder.js` har noll `fetchPrompt`-anrop (enda träffen är kommentaren som förklarar att den är borta), och det är `functions/api/_build.js` som läser dem via `env.ASSETS`. Kommentaren pekade alltså ut fel läsare i själva filen som avgör vilka prompter som publiceras — och därmed BF3:s hela orsak.

**Väntar på ditt ok** (din text, inte min — därför oändrad):
`villkor.html:539-540` säger "Vi ber om det samtycket uttryckligen" om samtycket
till att ångerrätten upphör när tjänsten fullgjorts inom fristen. Uppmätt: ingen
sådan fråga ställs någonstans i köpflödet. Meningen är antingen ett löfte som
ska uppfyllas i koden (**BF4**) eller en mening som ska strykas — men vilken av
dem, och med vilken formulering, är ditt beslut.

## Dokumentationsfel — rättade 2026-08-17

Rättade direkt i `CLAUDE.md` (rent git-träd). Raderna står i terminalsvaret.

- Repo-trädet sa `test/ # node --test: teams.mjs + stripe.mjs + plan.mjs (69 tester)`. Det är sex filer och 120 tester; `scripts/` saknade `check-dist.mjs`; `ROADMAP.md` och `.github/workflows/test.yml` fanns inte i trädet alls.
- Sprintrutan sa "Testsviten är 69 gröna". Uppmätt i dag: 120 tester, varav en röd (se **DR1**).
- Sprintrutan sa "**Nästa pass:** pass 3.3 och 3.1" — båda gjorda 2026-08-16 som K1 och K3. Instruktionen skickade nästa session till arbete som redan var färdigt.

**Väntar på ditt ok** (kodkommentar, inte prosa — därför inte ändrad):
`builder/builder.js:1652-1656` säger att 190 kr och 490 kr/mån "kräver en proxy på vår nyckel med kvotmätning — den finns inte". Proxyn finns sedan 2026-08-06 (`functions/api/ai.js` + `ai_usage`), och nivåerna är strukna av ett annat skäl: ingen molnstruktur för underhåll. Skälet i kommentaren är alltså överspelat, men vilken formulering som ska stå där är ditt beslut.

## Dokumentationsfel — rättade 2026-08-15

Rättade direkt i filerna (rent git-träd). Raderna står i terminalsvaret.

- `CLAUDE.md` — påstod att nyckelvägen fanns kvar i `atb-claude.js` och i portalens `renderKeySetup()`. Ingetdera stämmer, och samma fil sa motsatsen några stycken tidigare.
- `docs/roadmap.md` pass 3.2 — "50 000 tecken" var fel; `MAX_INPUT_CHARS` har varit 200 000 i hela filens historik.
- `docs/roadmap.md` pass 5 — påstod att bara lyckade anrop bokförs; `bokför(null)` räknar upp `calls` även vid nätverksfel och HTTP-fel.
- `docs/roadmap.md` pass 5 — "sw.js står på v22" (den står på v26) och "fyra commits" (uppmätt: 18 av 37).
- `docs/roadmap.md` pass 6 — 429-fyndet är redan åtgärdat, och radnumren för nyckeltexten i `portal/app.js` pekar på annan kod i dag.

## Driftsatt 2026-08-29

Pages `6cb1cda5`, taggen `deploy-2026-08-29`. Fem commits: `4fbaaae` (K4),
`158ba3c` (KA4), `95853bd` (P6 + P1:s kodhalva), `c249d9d` (P4), `2b22452`
(OM5). Testsviten **274 gröna**, `check:dist` ren. **Inga migrationer, inga nya
secrets, ingen ny rutt** — därför inget att rulla tillbaka i schemat om koden
måste backas.

Verifierat i drift, inte antaget:

- **Det riskabla först.** `POST /api/ai` med `step: "scale"` och ett riktigt
  intake gick hela vägen: prompten lästes **serversidan** och svaret strömmade
  tillbaka från Cerebras. Det var K4:s enda öppna fråga — om `env.ASSETS` (eller
  reservvägen) bär i produktion — och den är nu besvarad med en körning, inte
  med en läsning.
- Fria rutten **utan** `step` → **400 `build_step_required`** med den svenska
  texten. Med historik (tre meddelanden) → **400**. Den gamla vägen tillbaka för
  uppsagda är alltså stängd skarpt.
- Portalanrop utan inloggning → **401 `login_required`**. `GET /api/ai` → 405.
- `/api/health` **200 friskt**, alla tre kontrollerna sanna.
- CSP:n i drift bär `script-src 'self' 'unsafe-inline'
  https://static.cloudflareinsights.com` — beaconen är alltså inte längre
  utestängd när knappen slås på.
- Portalens `app.js?v=37ce5315` innehåller alla tre nya blocken
  (`AUTO-START`, `EXT-START`, `TID-START`), `applyTeamExt` och `boot: true`.
  Builderns `builder.js` har **noll** `fetchPrompt`-anrop kvar (bara kommentaren
  som förklarar varför) och inget `TEAM_SCHEMA` — de bor på servern nu.
- Sidorna svarar: hub, builder, portal, galleri, `villkor`, `integritet`, och
  `prompts/shared/scale.md` (2 858 byte — prompterna måste ligga kvar publika
  för att `env.ASSETS` ska nå dem, se **BF3**). Okänd adress → **404**.

**Kvar som `läst i koden`, inte `mätt`:** allt kunden ser med ögonen. P6:s
puls-kort, P4:s ändra/avsluta-dialog och OM5:s timsiffra är verifierade med 48
enhetstester som kör den riktiga koden ur källan — men ingen har öppnat
portalen i en webbläsare på fem pass. Det kräver en giltig `OPENROUTER_KEY` i
`.dev.vars`; den lokala svarar "Missing Authentication header".

**Två steg som är dina, och som ingen kod kan göra:** slå på Cloudflare Web
Analytics med **automatic setup** (P1 — den manuella snutten blockeras av
`connect-src`), och peka en uptime-vakt mot `/api/health`.

## Driftsatt 2026-08-18

Pages `85463c90`, taggen `deploy-2026-08-18`. Tre commits: `e3b6ff5` (KR2),
`9fb3ff0` (P5 + BL2), `752aa96` (omvärldsresearch + dokumentation). Inga nya
migrationer, inga nya secrets. Testsviten **175 gröna**, `check:dist` ren.

Verifierat i drift, inte antaget: `/api/health` **200 friskt** med alla tre
kontrollerna sanna · `/api/subscription/withdraw` ger **405 på GET** och
`login_required` på POST utan session · `/api/team/members` ger 401 utan
session · startsidan visar Studiochefen, Veckopiloten, Butiksskribenten och
Kundpost (inga påhittade namn kvar) · `villkor.html` §15 pekar ut knappen och
nämner portalens sidfot · portalens `app.js` bär etiketterna *Kollegor / dela
team*, *Bjud in en kollega* och *Ångra köpet*.

**Mätfälla att inte gå i igen:** `curl https://mittaiteam.se/villkor.html` ger
**308 till `/villkor`** och en tom kropp. En kontroll utan `-L` ser då ut som en
misslyckad deploy av en sida som i själva verket är korrekt. Samma gäller
rimligen `integritet.html`.

**Kvar som `läst i koden`, inte `mätt`:** Stripe-grenen i `withdraw.js`
(`DELETE /subscriptions/:id`). Emulatorns testteam saknade
`stripe_subscription`, så grenen sprang aldrig — och den kan inte provas skarpt
utan ett riktigt abonnemang att avsluta. Det är den enda delen av dagens arbete
som inte körts.

**Öppen fråga till Mikael:** ångerknappen flyttar inga pengar — den stänger
åtkomsten och mejlar arbetsordern till `info@`. Ska återbetalningen automatiseras
i Stripe är det ett eget beslut, inte en bugg.

## Driftsatt 2026-08-17

Pages `0ce02f55`, worker `mittaiteam-veckobrev`, taggen `deploy-2026-08-17`.
Migration 0006 och 0007 körda skarpt, med säkerhetskopia före varje.

Verifierat i drift, inte antaget: okänd adress ger **404** (gav förut 200 +
startsidan), tolv branschsidor med egna titlar, sitemap 25 URL:er, tre
JSON-LD-block, `/api/health` **200 friskt** med alla tre kontrollerna sanna,
tre mikrofoner i builderns intag, `Granska mitt utkast` och `Veckobrev` i
portalens arbetsyta, veckobrevsrutten 401 utan hemlighet och 200 med, workerns
kedja hela vägen fram, `/avregistrera` 400 på trasig token och 200 på okänd,
`/api/digest/prefs` 401 utan session, och integritetspolicyns punkt 5 på plats.

**Ett steg återstår, och det är ditt:** en uptime-vakt mot
`https://mittaiteam.se/api/health` med larm till mejlen. Allt annat som byggdes
i dag är påslaget.

## Klart

- [x] **KR3** Provmånadskortet ritas om när sidopanelen ritas om — löst 2026-09-06.

  `checkTrialNotice()` anropades på exakt ett ställe: vid boot. Kortet den ritar
  hamnar i `.ws`, som byggs inuti `renderSidebar()`, och `refreshSidebar()` byter
  ut hela `.sidebar`. Kortet är portalens **enda väg från 90 till 290 kr inifrån
  produkten**, och det försvann vid första omritningen.

  **Värre än punkten sa, uppmätt i webbläsare:** kortet var borta redan efter att
  presentationsrundan stängts — den anropar `refreshSidebar()` när den lämnas, och
  den möter varje ny kund vid första besöket. Kunden hann alltså aldrig se kortet.

  Fixen är raden punkten föreslog, sist i `refreshSidebar()`; den täcker alla tre
  anropsställena. **Verifierat med ögon** mot lokal emulator med `--plan trial
  --dagar 27`: kortet står kvar genom hela genomgången och visar "3 dagar kvar"
  med rätt slutdatum · `portal/app.js:2264` · `mätt`

- [x] **RE1** "Veckan som gick" läser förra veckan i stället för en logg som just nollställts — löst 2026-09-06.

  `routLoad()` nollställer posten vid varje ISO-veckoskifte, och pulskortet visas
  exakt vid veckans **första** öppning — alltså precis när loggen ser tom ut.
  Återblicken rapporterade därför noll rutiner och noll sparad tid till en kund
  som kanske gjort allt.

  `isoWeek()` tar nu ett datum, och `routVeckanSomGick()` frågar efter
  föregående veckas nyckel: posten ligger orörd tills första avbockningen i den
  nya veckan skriver över den. Svaret bär **vilken** vecka det gäller, så texten
  säger "förra veckan" eller "denna vecka" i stället för att gissa. Är loggen
  redan överskriven bär veckoliggaren (`atb_sparad_`) minuterna vidare — en
  siffra utan lista är bättre än ingetdera.

  Pulskortet fick samma källa: vid veckans första öppning står det nu
  "Ny vecka — förra veckan gjorde teamet ≈ 4,5 timmar manuellt arbete" i stället
  för att tiga. **Verifierat med ögon**, och underlaget som gick till teamet
  fångades i klienten: *"Avklarade rutiner förra veckan: Veckoplan med VD,
  Veckans bloggpost"* — exakt de 270 minuter som förut blev 0 ·
  `portal/app.js:1933`, `:2395`, `:2820` · `mätt`

- [x] **KR6** Kvittosidan pekar på inloggningen i stället för på en länk som inte finns — löst 2026-09-06.

  Vid saknat kvitto-id sa sidan "gå tillbaka till kvittomejlet och följ länken
  därifrån". Stripes kvittomejl leder till Stripes egen kvittosida, inte till vår
  `success_url` — den länken finns inte. Och `stuck()` sa "ladda om / mejla oss"
  utan att nämna det som faktiskt fungerar: **leveransen sker i webhooken, inte i
  fliken.** Båda styckena pekar nu på inloggningen med adressen kunden betalade
  med, som primär knapp · `portal/aktivera.html:66`, `:105-111`

- [x] **DR7** Vakten är CI:t — löst 2026-09-06.

  `.github/workflows/health.yml` kör var femtonde minut och fäller på
  `/api/health` (som svarar 503 när tjänsten inte kan svara kunder), på
  startsidan, och på `/api/auth/me` som får svara 2xx eller 4xx men inte 5xx.
  GitHub mejlar repoägaren när en körning fäller. Noll nya konton, samma verktyg
  som `test.yml`. Alla tre kontrollerna körda för hand mot produktionen samma
  dag.

  **Vad den inte fångar, utskrivet i filen:** B1-scenariot. Det felet satt i
  klienten och `/api/health` svarade 200 hela tiden. Ett syntetiskt byggsteg vore
  nästa steg — det kostar pengar per körning, och beslutet är Mikaels.

- [x] **KA6** Prompten och schemat sa emot varandra om ANTALET startförslag — löst 2026-09-06.

  `PORTAL_RULES` punkt 9 beställde "2–4 korta exempeluppgifter", `TEAM_SCHEMA`
  hundra rader ner tvingade `minItems: 3, maxItems: 3`, och
  `templates/shared/portal-team.md:102` sa "EXAKT 3". Schemat vann, så utdatan
  blev ändå tre — felet syntes aldrig hos en kund. Det som kostade var att
  modellen fick motstridiga instruktioner i det steg som är dyrast att köra om,
  och att den tredje halvan (mallen för `/build-team`) speglas för hand.

  **Fixen är en rad; vakten är poängen.** Punkt 9 säger nu EXAKT 3. Två tester i
  `test/ai.mjs` läser den RIKTIGA systemprompten rutten skickar — via samma
  `uppström()`-hjälpare som resten av filen, inte ur en kopia:

  - *"prompten beställer inga antal som schemat förbjuder"* — generell. Plockar
    ut intervallen för `starters`, `triggers` och `routines` ur prompttexten och
    jämför mot schemats `minItems`/`maxItems`. Regeln är enkelriktad: allt
    prompten tillåter måste schemat tillåta. Snävare prompt än schema är i sin
    ordning (rutiner 3–5 mot `minItems: 3` utan tak), vidare är ett fel.
  - *"antalet startförslag säger samma sak på alla tre ställen"* — specifik.
    Täcker det schemat omöjligt kan täcka: mallen för `/build-team`, som läses
    av en människa och inte av valideringen.

  Båda mutationsprovade: prompten tillbaka till "2–4" fäller båda, mallen ändrad
  till 4 fäller den andra, och ett löst `maxItems` i schemat fäller den också.

  Hittat och lagat med skillen `kopplad-andring`, som skrevs samma dag —
  kopplingen `schema-prompt` är därmed inte längre en av de sex ovaktade.

- [x] **OM5** Sparad tid räknas — och syns där köparen tittar — löst 2026-08-29.

  Konkurrenterna säljer på sparad tid. Vi räknade den faktiskt redan, men bara
  på **ett** ställe: längst ner i "📈 Veckans arbete", en panel kunden måste
  öppna själv. Halvårssimuleringen säger varför det är fel plats — värdet bevisas
  hos utföraren, men beslutet att fortsätta betala fattas av någon som sällan
  loggar in.

  **Vad som räknas, och varför inte mer än så.** Bara `timeEstimate` på rutiner
  kunden faktiskt bockat av. `research.md` beställer den siffran som "minuter
  momentet brukar ta manuellt ENLIGT RESEARCHEN (null om researchen inte anger
  tid — hitta aldrig på)", alltså hämtad ur kundens egen beskrivning av sin
  vecka. Att lägga på en schablon per svar eller per möte hade varit att
  uppfinna exakt den siffra hela punkten går ut på att kunna stå för — och den
  som säljer på en påhittad timme får frågan en gång, och slutar betala när
  svaret inte håller. Rutiner utan uppskattning räknas inte, och **antalet skrivs
  ut i gränssnittet** i stället för att tigas ihjäl.

  Fyra ytor i stället för en: **puls-kortet** (det man möts av), **"Veckan som
  gick"** (siffran med i underlaget, med instruktion att inte räkna om den),
  **kvartalsöverblicken** — inklusive den delbara texten, som är själva den rad
  köparen läser — och panelen som redan hade den.

  Kvartalet krävde en egen **veckoliggare** (`atb_sparad_<slug>`, 26 veckor):
  `routLoad()` nollställs varje ISO-vecka, så kvartalsvyn hade annars kunnat
  visa högst en veckas siffra, alltså just den som är för liten för att övertyga
  någon om ett år till. Liggaren **räknar om** veckan i stället för att räkna
  upp den — körs bokföringen två gånger blir svaret detsamma.

  **Veckobrevet fick en annan siffra, med flit.** Rutten har `teams.config` och
  ingenting annat — historiken och avbockningarna bor i kundens webbläsare — så
  servern kan omöjligt veta vad som gjorts. Brevet säger därför vad rutinerna är
  värda *om de körs*, och prompten säger uttryckligen: nämn den en gång, som vad
  som ligger och väntar, aldrig som något som redan är sparat. Under en halvtimme
  utelämnas siffran helt; saknas uppskattningar står ingenting. Ett veckobrev som
  hittar på en timme är värre än ett utan.

  Tio tester i `test/portal.mjs` och fem i `test/digest.mjs`, mest om vad
  siffran INTE innehåller — det är där den spricker. Mutationsprovat: en
  schablon för rutiner utan tid → tio röda; golvet borttaget i brevet → två röda.

  **Inte kört i webbläsare** (femte passet i rad, se skulden i sprintrutan).

- [x] **P4** Grundteamets agenter går att ändra och avsluta — löst 2026-08-29.

  Tillägget var enkelriktat: kunden kunde LÄGGA TILL agenter, aldrig röra dem
  som kom med bygget. En agent som formats för ett arbetsmoment kunden slutat
  med — eller som fått fel ton, fel namn, fel blick — stod kvar i vänsterspalten
  för alltid, och enda utvägen var en ny Builder-körning. Fel utväg av två skäl:
  den kostar ett nytt bygge, och den slänger historiken.

  `teamExt` bär nu tre saker till, alla frivilliga och alla borttagbara:

  - **`retired`** — grundagenter kunden ställt åt sidan. Det är *avsluta*, inte
    radera: historiken ligger kvar under agentens id, och "Ta tillbaka" ger både
    agenten och samtalet tillbaka. En raderad agent hade tagit med sig ett
    halvårs anteckningar utan att kunden visste att hon förlorade dem. En
    *tillagd* agent tas däremot bort på riktigt — den har ingen originalversion
    att återvända till, och därför står det olika ord på de två knapparna.
  - **`edits`** — namn, raden om vad agenten gör, och systemprompten.
    Originalet skrivs aldrig över; ändringen är ett lager, och "Återställ" tar
    bort lagret i stället för att skriva tillbaka en text vi inte har kvar. En
    instruktion kortare än 40 tecken avvisas: en tömd systemprompt gör agenten
    till en vanlig chatt utan perspektiv, alltså precis det teamet finns för att
    inte vara.
  - **`entry`** — vem som leder veckostart, möten och veckobrev. Sätts
    automatiskt när ingångsagenten avslutas. Utan den raden hade portalen
    laddat med en `entryAgent` som inte finns och fallit tillbaka på "första i
    listan", vilket är slumpen och inte ett val. Bekräftelserutan säger vem som
    tar över *innan* kunden klickar ja, och den räknas av samma funktion som
    själva avslutet (`extEntryEfter`) — annars säger dialogen ett namn och
    portalen väljer ett annat.

  Allt bor i samma tillägg som de tillagda agenterna: localStorage, och med
  kopplad mapp även `team-tillagg.json`. Mappsynken slogs ihop till samma
  `applyTeamExt()` som laddningsvägen — förut hade de var sin sammanslagning,
  alltså två sanningar om samma sak. `retired` är union över datorer (ett avslut
  gjort på kontoret ska gälla hemma), medan en lokal `edits`-post vinner över
  filens: den som just skrivit om en systemprompt ska inte få den överskriven av
  en äldre version.

  **Sextusen tester syns inte i en webbläsare, så det här testades i stället:**
  `applyTeamExt` körs ur källan (`⟦EXT-START⟧`/`⟦EXT-SLUT⟧`) mot **varje riktig
  teamkonfig i `portal/teams/`**, med varje agent avslutad en i taget — 14 filer,
  och kravet är att teamet aldrig blir tomt och att `entryAgent` alltid pekar på
  någon som finns. Plus fallen som inte finns i repot: ett team utan
  `always`-agent, ett tillägg som pekar på id:n som försvunnit ur grundkonfigen
  (ny Builder-körning), och en dubblett som försöker skriva över en grundagent.
  Mutationsprovat: skyddet mot tomt team borttaget → rött; entry-lagningen
  borttagen → rött.

  **Inte kört i webbläsare.** UI-delen (dialogen, knapparna) är verifierad
  statiskt — bland annat att `btn-ghost` inte finns i `portal/portal.css` och
  att `.doc-del` är en 36 px ikonknapp som hade klippt ordet "Avsluta". Båda
  rättade innan commit, men ingen har sett dialogen rita upp sig.

- [x] **P6** Auto-körda rutiners "ligger klar"-bevis överlever en omladdning — löst 2026-08-29.

  `autoDelivered` var en modulvariabel, alltså tom vid varje sidladdning. Följden
  var värre än ett borttappat kort, för `routineMarkDone()` körs i samma
  andetag: kortet *"✅ X ligger klar hos Y — läs"* försvann vid F5,
  tabbåterställning eller nästa öppning av PWA:n — och kortet *"📌 Idag: X"* kom
  inte tillbaka i stället, eftersom rutinen redan var avbockad. Arbetet var
  alltså gjort och betalt, låg färdigt längst ner i en agents historik, och
  portalen sa ingenting om det. Just den effekten — "teamet har redan jobbat när
  jag kommer på måndagen" — är hela skälet till att auto-rutiner finns.

  Kvittot ligger nu i localStorage bredvid rutinloggen, med samma slug-nyckling.
  Två regler tar bort det: **läst** (kunden har öppnat agentens samtal, alltså
  sett svaret) och **föråldrat** (äldre än sju dagar — en auto-rutin är
  veckovis, så därefter har nästa körning lagt ett nytt svar under det gamla).
  Samma etikett igen ersätter det gamla kvittot i stället för att lägga sig
  bredvid.

  **Fällan på vägen, som hade flyttat buggen i stället för att laga den:**
  sidan väljer agent åt kunden vid varje laddning (`selectAgent` i `renderApp`).
  Om det räknats som "öppnat samtalet" hade ett svar hos ingångsagenten —
  alltså det vanligaste fallet, måndagsbriefen — kvitterats som läst innan
  kortet ens visats. Boot-anropet bär därför `{ boot: true }` och kvitterar
  ingenting; varje annat anrop är en kund som navigerat dit.

  `test/portal.mjs` är ny (åtta tester) och kör blocket ur `portal/app.js`
  mellan `⟦AUTO-START⟧`/`⟦AUTO-SLUT⟧` i stället för en kopia. Den täcker
  omladdningen, läskvittot, dubbletten, sjudagarsgränsen, trasigt lager,
  demoläget — och att skrivningen, läsningen och boot-flaggan faktiskt är
  inkopplade. `portal/app.js` hade fram till nu noll tester, trots att B1 låg
  precis där.

  **Inte kört i webbläsare.** Verifieringen är statisk (`node --check`,
  källkoppling i test) plus enhetstesterna. En auto-rutin kräver ett riktigt
  AI-anrop, och den lokala nyckeln är ogiltig.

- [x] **KA4** Perspektiven mäts, inte bara räknas — löst 2026-08-29.

  Kvalitetschecklistan säger "två agenter i samma team delar inte perspektiv".
  Kontrollen var närvaro: `kontrolleraSystemprompter()` och golvet i
  `test/teams.mjs` letade efter rubriken `DITT PERSPEKTIV`. Två agenter kunde
  alltså bära exakt samma text under rubriken och passera överallt. Det är den
  enda raden i checklistan som direkt bär projektets existensberättigande —
  samma input får inte ge samma output — och en kontroll som bara räknar
  rubriker är sämre än ingen, för den ser ut som ett skyddsnät.

  Måttet är en **överlappskoefficient på innehållsord**: andelen av det mindre
  ordförrådet som också finns i det andra perspektivet. Jaccard valdes bort —
  den döljer en kort dubblett bakom en lång text. Stoppord och ord under fyra
  tecken räknas inte, annars lyfter "och att för av" varje par mot varandra.

  **Taket 0,70 är mätt, inte gissat.** 108 agentpar i `portal/teams/`: median
  0,12 · p90 0,23 · p99 0,36 · max 0,42 (`konsult.js`, förslag~erfarenhetsbank).
  37 par i `examples/`: median 0,14 · max 0,38. Dessutom ett golv på 60 tecken
  under rubriken — kortaste riktiga sektionen i repot är 148, och utan golvet
  hade en tom rubrik jämförts med en annan tom rubrik och bedömts som "olika".

  Måttet ligger i `builder/builder.js` mellan markörerna `⟦DELAD-START⟧` och
  `⟦DELAD-SLUT⟧`, körs vid generering (`kontrolleraSystemprompter` fäller
  körningen), och **hämtas ur källan** av `test/teams.mjs` och
  `test/examples.mjs`. Testerna kör alltså samma kod som kunden möter; en kopia
  i testet kunde blivit mildare än den som faktiskt kör — samma fälla som
  prompten och schemat gick i två gånger.

  Fyra grindar, inte en: att måttet känner igen en dubblett (identisk text ger
  1,0; ett omskrivet ord räcker inte för att slippa undan), att det släpper
  igenom två riktiga olika perspektiv, att en tom rubrik fälls, och att
  `kontrolleraSystemprompter` faktiskt **anropar** måttet. Dessutom ett test som
  fäller om något par i repot passerar 0,55 — under taket, men långt över allt
  som finns i dag, så en glidning märks medan den som lade till teamet minns
  varför.

  Mutationsprovat: `perspektivLikhet` som alltid svarar 0 fäller ett test, och
  ett bortkopplat anrop fäller ett annat.

- [x] **K4** Den fria rutten är ett bygge, inte en chatt — löst 2026-08-29.

  Hålet hade två halvor, och den andra var den kommersiella. Rutten tog emot
  vilken systemprompt som helst utan slug, utan konto och utan betalning: dels
  gick den att använda som gratis chatbot på vår nyckel, dels kunde en kund vars
  provmånad eller abonnemang tagit slut ta sin nedladdade teamkonfig — som
  innehåller varje agents fullständiga systemprompt (**BF2**) — utelämna slugen
  och fortsätta använda teamet. Betalväggen gällde bara den som lämnade kvar
  slugen i anropet, alltså bara den ärliga kunden.

  Rättningen är strukturell och inte en kontroll: **klienten skickar ingen
  systemprompt till den fria rutten längre.** Den skickar `step` — ett namn ur
  `BUILD_STEPS` — och servern hämtar prompten själv ur `prompts/` (`env.ASSETS`,
  med självhämtning som reserv). Dessutom tar den fria rutten **exakt ett
  användarmeddelande**: ett byggsteg har aldrig fler, en chatt har alltid fler.
  Steget äger också `max_tokens` och schemat; klientens siffror läses inte.
  Kvar som möjlig utdata: byggets egna mellandokument och ett team-JSON.

  På vägen flyttade tre saker ur `builder/builder.js` till `_build.js`:
  `PORTAL_RULES`, `CLARIFY_PROMPT` och `TEAM_SCHEMA`. Det är inte bara en flytt
  — CLAUDE.md kallade prompten och schemat "ETT kontrakt i två filer" och
  räknade upp två tillfällen då de glidit isär (`starters`/`routines`, sedan
  `firstProject`/`seasons`/`triggers`). Nu står beställningen och schemat i
  samma fil. Alla fyra varianter av sammanställningsprompten (läge × arbetssätt)
  jämfördes byte för byte mot den gamla klientkoden före flytten, och
  `TEAM_SCHEMA` deep-equal-jämfördes.

  Grindarna, båda i `test/ai.mjs`: ett stegnamn i `builder.js` som saknas i
  `BUILD_STEPS` fäller bygget (annars 400 för alla i drift), och en prompt-fil
  som faller ur `PROMPT_FILES` i `build-dist.mjs` gör det också (annars 503 på
  just det steget — och för `first-project.md` bara i konsult-läget, alltså
  precis den sorts fel som får ligga i veckor).

  Portalen är orörd: den skickar `system` som förut och gatas av slug plus
  inloggning. Demoläget rör aldrig rutten — varje anropsställe i `portal/app.js`
  ligger bakom en `state.demo`-spärr, kontrollerat.

  **Vad detta INTE gör:** **BF2** står kvar. Systemprompterna går fortfarande
  att ladda ner gratis ur Buildern; de går bara inte längre att köra hos oss.
  Om de ska sluta delas ut är ett eget beslut, och det hänger ihop med **OM1**.

- [x] **KR2** "Beviset" har en körning bakom sig — löst 2026-08-18. Under
  rubriken *Ingen av dem är påhittad* stod fyra påhittade namn
  (Vera/Ester/Sixten/Malte, hämtade ur `design/`-skisserna) med lerverk-exemplets
  form och andra namn. Det var den enda ytan på sajten utan täckning, och den
  hette "Beviset".

  Nu står **Lerverk** där — en riktig körning ur
  `examples/team-builder/lerverk/test-output.md`: Studiochefen, Veckopiloten,
  Butiksskribenten och Kundpost, med "Klart när"-raderna hämtade ur körningen.
  Avslagen växte från två påhittade till körningens **fyra riktiga**, och de är
  vassare än de uppfunna: fotoassistenten föll för att en agent varken kan
  ljussätta eller fota, lagerbevakningen för att "låtsas ha koll utan åtkomst
  vore teater", och försäljningsanalytikern var en *stark* kandidat som föll på
  solo-taket — hens jobb flyttades till VD:n i stället för att strykas, vilket
  är precis fyndet som räddar VD-rollen från att bli teater.

  En rad ovanför tabellen säger vem kunden är och vad körningen gjorde: sju
  arbetsmoment kartlagda, tre över ribban, fyra agenter, fyra nej.

  Grinden: `test/examples.mjs` läser namnen ur `index.html`s passerkort och
  kräver att var och en finns i en fil under `examples/`. Skrivs avsnittet om
  med nya påhittade namn faller bygget — provat genom att byta tillbaka ett av
  de gamla namnen och se testet fälla.

- [x] **P5** Kollegor har en väg in — löst 2026-08-18. Rutterna
  `functions/api/team/{invite,members,remove}.js` skrevs i M3 och stod därefter
  oanropade. Följden var att den knapp som såg ut att dela teamet —
  delningslänken — ger mottagaren en **låst vy**, och att det riktiga svaret
  ("mejla oss") krävde att vi är vakna.

  Sidfotsknappen heter nu **Kollegor / dela team** och öppnar en ruta där
  platserna listas överst, med adressfält och bort-knapp per rad; länken och
  teamfilen ligger kvar under en egen rubrik som det de faktiskt är — teamet som
  läsbart dokument. Rutan visas bara för ägaren, och vi frågar inte om det:
  `/api/team/members` svarar 404 på allt annat, och då faller gränssnittet
  tillbaka på mejltexten i stället för att visa en tom ruta.

  **Verifierat i emulatorn** (`wrangler pages dev` mot lokal D1, riktig
  inloggning med engångskod): medlemslistan, inbjudan (`ok:true, mailed:true`),
  listan igen med två rader, borttagning, och att `agare@…` inte kan ta bort sig
  själv. Testrader städade efteråt.

  Grinden mot att det upprepas: `test/teams.mjs` läser **katalogen**
  `functions/api/team/` och kräver att varje rutt där nämns i `portal/app.js`.
  Nästa rutt någon lägger till omfattas utan att någon behöver minnas det.
  Grinden är provad röd (en tom `zzzprov.js` i katalogen fällde den med rätt
  meddelande) — ett test som inte kan bli rött är en kommentar.

- [x] **BL2** Ångerrätten är en knapp — löst 2026-08-18. `villkor.html` bar sin
  egen anteckning om att en ångerknapp måste finnas i samma gränssnitt den dag
  ett köpflöde med direktbetalning byggs. Kassan byggdes 2026-08-06; knappen
  fanns inte förrän nu.

  Ny rutt `functions/api/subscription/withdraw.js`, medvetet skild från
  uppsägningen: **uppsägning = sluta framåt** (teamet perioden ut, inga pengar
  tillbaka), **ångerrätt = köpet görs ogjort** (åtkomsten upphör nu, pengarna
  tillbaka). Samma rutt med en flagga hade förr eller senare pekat fel.

  Fristen är 14 dagar från det **senaste** köpet — `purchasedAt()` tar
  `max(created_at, plan_changed_at)`, så en uppgradering från provmånad startar
  en ny frist i stället för att kunden ska ha ångerrätt räknad från den dag hon
  byggde teamet. `/api/auth/me` bär därför ett tredje tal (`planChangedAt`), och
  portalen räknar med samma formel; tre tester i `test/plan.mjs` fäller bygget
  om rutten, portalen och villkorstexten glider isär.

  Ordningen inuti rutten är vald och inte slumpad: Stripe först (`DELETE
  /subscriptions/:id` — därför en femte parameter `method` i `stripeCall`),
  planen sedan, mejlet sist. Faller Stripe avbryts hela anmälan, för det
  omvända hade gett en kund utan tjänst som ändå debiteras. Faller mejlet står
  det i svaret — anmälan är redan registrerad.

  **Ingen kod flyttar pengar.** Rutten stänger dörren och mejlar oss;
  återbetalningen görs för hand inom fristen. Att automatisera en oåterkallelig
  utbetalning är ett större beslut än att stänga en dörr.

  **Verifierat i emulatorn:** GET mot rutten ger 405, POST utan session 401,
  ett 20 dagar gammalt team ger `window_closed`, ett färskt ger `withdrawn` →
  `teams.plan = 'refunded'` i D1 → `/api/teams/:slug` går från 200 till
  `plan_ended`, och en andra anmälan ger `nothing_to_withdraw`.

- [x] **BL3** Konkurrensbilden är inte längre förbigången — löst 2026-08-18 med
  `docs/omvarldsresearch-2026-08-18.md`, en uppföljning på en månad av
  `omvarldsresearch-2026-07-17.md`. Punkten formulerades som "aikollegorna.se
  leder med EU-drift", och det stämmer (4 900 kr/mån, dedikerad hårdvara hos
  kunden, "ingen data lämnar era lokaler") — men det var inte det tyngsta
  fyndet.

  **Tyngst är att det största hotet inte är en konkurrent utan plattformsägaren.**
  Claude Cowork ger filsystemsåtkomst, schemalagda uppgifter och
  bakgrundsarbete gratis på varje betald Claude-plan, och Small
  Business-bundlen lägger integrationer ovanpå. Det är vår mappfunktion plus
  våra rutiner, från Anthropic, för ~210 kr/mån.

  Näst tyngst: **Vorker.ai har lämnat väntelistan** (€25/€59 per månad i beta,
  Fortnox- och Visma Spiris-integrationer, engelskspråkig sajt) — fönstret som
  förra researchen kallade "öppet men inte länge" är alltså i färd med att
  stängas på integrationssidan, men står fortfarande vidöppet på
  skräddarsöm och språk: **ingen konkurrent genererar teamet ur kundens egen
  verksamhet.** Sintra säljer 12 fasta helpers, Marblism 6, AI Kollegorna 3,
  Vorker 1.

  Fem drag ligger som **OM1–OM5** ovan.

- [x] **SE1** Tolv branscher har tolv riktiga sidor — löst 2026-08-17. Uppmätt
  före och efter i webbläsare **med JavaScript avstängt** (det en sökmotor utan
  rendering ser): **0 tecken innehåll före, 1 640 efter.** Med JS på: samma h1,
  samma agentkort, inga konsolfel, och sidan ritas *inte* om till galleriet.

  Sidorna renderas med **klientens egen `renderSingle()`**, körd i Node med ett
  stubbat `window`/`document`. Det är hela poängen: ett andra, handskrivet
  HTML-bygge hade blivit ett andra ställe där layouten kan glida, och den fällan
  har projektet redan gått i (`PORTAL_RULES` mot `portal-team.md`). Ändras
  branschsidan i `app.js` följer de tolv statiska sidorna med automatiskt.

  Filnamnet är `verticals/<slug>.html`, alltså samma katalognivå som
  `index.html` — då gäller varje relativ länk oförändrat. `<base href>` hade
  varit alternativet men CSP:n sätter `base-uri 'none'`. `getV()` känner nu igen
  branschen ur **sökvägen** också, annars hade `boot()` ritat om den statiska
  sidan till galleriet. Sitemapen skrivs vid bygget på en markör (13 → 25 URL:er)
  och gallerikorten pekar på de nya adresserna. Grind i `check-dist.mjs`: varje
  bransch måste ha både en sida och en sitemap-rad — provad genom att ta bort en.

  Att lägga till en bransch är därmed fortfarande **en** ändring: ett objekt i
  `verticals.js`.

- [x] **K2** Anropet räknas innan pengarna spenderas — löst 2026-08-17.
  Bokföringen är delad i två steg: `räkna(1, null)` **före** uppströms och
  väntad på, tokens efteråt med `räkna(0, used)` så anropet inte räknas
  dubbelt. Reservationen är **fail-closed** — går den inte att skriva svarar
  rutten 503 och inget anrop går uppströms.

  **Fönstret är krympt, inte borta,** och det står i koden: kvar är glappet
  mellan sista takläsningen och skrivningen, alltså två DB-anrop i stället för
  hela genereringstiden. Att stänga det helt kräver `allowAttempt`-greppet
  (`RETURNING calls` per tak i stället för att läsa först) — fyra rader i två
  tabeller, och de befintliga taktesterna stubbar SELECT-vägen, så det är en
  ombyggnad. Att det får vänta beror på att `allowAttempt` redan är atomär och
  bara släpper 24 anrop per kvart och IP på den fria rutten; överskridandet
  begränsas därmed till dem som råkar ligga i millisekundglappet, och kostnaden
  för det är ören.

  Två tester mäter **garantin, inte implementationen**: att räkningen är skriven
  när `fetch` körs (stubben ögonblicksbildar skrivningarna just då), och att
  inga pengar spenderas när räkningen inte går att skriva.

- [x] **KA5** Skalningssteget kan inte längre läcka tankekedja — löst
  2026-08-17. `scale.md` skrev "räkna tyst" och motiverade det med att Buildern
  visar steget live för kunden, men koden visade vad som än kom.
  `rensaSkalning()` plockar ut de två beställda raderna och är **strikt mot brus,
  förlåtande mot format**: hittas inget `Skalningsbeslut:` visas råtexten, för
  ett beslut som inte når kunden är värre än ett beslut med brus omkring. Den
  rensade texten går också vidare till proposal-steget — nästa steg ska läsa vad
  som beslutats, inte tvekan. Sju tester, valda efter vad en modell faktiskt gör.

- [x] **BL4** Backup av D1 — löst 2026-08-17. `npm run db:backup` exporterar till
  `backup/` (git-ignorerad; `-- --local` för emulatorns kopia). Skriptet avbryter
  om exporten saknar `users`, `teams` eller `team_access` — en export som
  "lyckades" men är tom är värre än ingen, för den ser ut som ett skyddsnät.
  Provat mot lokala D1 (4,3 kB, alla tre tabellerna), och grinden provad genom
  att kräva en tabell som inte finns.

  **Två fel på vägen, båda värda att minnas:** `spawnSync` startade aldrig
  wrangler på Windows utan `shell: true`, och felmeddelandet blev därför "inte
  inloggad" trots att samma kommando kört för hand fungerade — ett meddelande som
  pekade helt fel håll. Och kommandot byggs nu som *en* sträng för att slippa
  nodes DEP0190-varning vid varje körning; en backup-rutin ska inte se orolig ut.

  **Kopiorna ligger på samma disk som repot.** De skyddar mot en trasig
  migration, inte mot en trasig disk. Skriptet säger det, men flytta dem.

- [x] **D3** Något som kan larma — löst 2026-08-17. `GET /api/health` svarar
  **200 när tjänsten kan svara kunder, 503 när den inte kan**: nyckeln finns,
  D1 svarar, och inget kreditfel de senaste tjugo minuterna. **Inget AI-anrop** —
  en vakt som pollar var femte minut hade kostat pengar dygnet runt. Bara
  booleaner i svaret: rutten är öppen (en vakt kan inte logga in) och antal anrop
  per dygn är affärsinformation.

  Underlaget är nya `ai_errors` (migration 0006): dygn, felkod, antal, senaste
  tidpunkt. Inget innehåll, ingen fråga, inget kund-ID — samma linje som
  `ai_usage`. `/api/ai` skriver dit vid uppströmsfel, nätfel och tömd kredit.

  Åtta tester prövar varje felläge **och motproven**: att ett *gammalt*
  kreditfel ger 200 (en rutt som stannar röd när felet är löst gör att larmet
  ignoreras nästa gång), att saknad tabell ger `null` och inte "friskt", och att
  svaret inte läcker nycklar eller siffror. Ett test i `test/ai.mjs` fångade att
  jag skickade `bokförFel` in i `httpFel` men aldrig använde den — rutten hade
  svarat 503 utan att lämna ett spår. SQL:en är provad mot den riktiga tabellen
  i lokala D1, inte bara mot stubben.

  **Driftsatt och migrerat 2026-08-17.** Deploy `c98ecac7`; migration 0006 körd
  skarpt efter en säkerhetskopia med `npm run db:backup` (20,5 kB, med
  `users`/`teams`/`team_access` verifierade). `ai_errors` finns med både
  primärnyckelindex och `idx_ai_errors_last_at`, och `/api/health` gick från
  `ai_kredit: null` till `ai_kredit: true` — alltså från "okänt" till en riktig
  kontroll. Alla tre kontrollerna är nu skarpa.

  **Ett steg återstår, och det är ditt:** peka en uptime-vakt mot
  `https://mittaiteam.se/api/health` med larm till mejlen. Rutten svarar rätt —
  men tills någon lyssnar finns spåret utan att någon tittar, vilket var exakt
  läget när B1 låg stum i tio dagar.

- [x] **SE5** Strukturerad data finns — löst 2026-08-17. Tre block på startsidan:
  `Organization`, `Product` med tre `Offer` (0/90/290 SEK) och `FAQPage`.
  **FAQ:n är genererad vid bygget** ur de synliga `<details>`-blocken
  (`fyllFaqSchema` i `build-dist.mjs`), inte handskriven: Google kräver att
  markupen matchar det besökaren ser, och sex handkopierade svar i samma fil som
  originalet hade glidit isär vid första omformuleringen. Källfilen bär en tom
  markör, så det finns ingenting att hålla synkroniserat.

  Grinden i `scripts/check-dist.mjs` (CI + bygge + deploy) fångar båda
  felmoderna: JSON som inte tolkar, och markup som inte matchar sidans text.
  **Den första versionen av grinden godkände sig själv** — den sökte frågorna i
  hela dokumentet, alltså även inne i sitt eget JSON-LD, och var grön oavsett
  vad den synliga texten sa. Upptäcktes bara genom att ett svar ändrades med
  flit. Nu klipps schemablocken bort ur höstacken först. Mutationstestad i båda
  riktningarna.

  **Dessutom, hittat i samma svep:** `connect-src` i `_headers` släppte
  fortfarande igenom `https://openrouter.ai` — en kvarleva från nyckelvägen.
  Klienten känner ingen leverantörs-URL sedan 6 augusti och serverns anrop lyder
  inte under sidans CSP, så undantaget var dött men stod kvar som en godkänd
  destination att skicka data till. Nu `'self'` och inget mer.

- [x] **KR1** Branschsidorna leder till bygget — löst 2026-08-17. Noll träffar
  på `builder` i hela `verticals/` tidigare: nav-CTA:t var "Priser", knapparna
  var demo, priser och "boka samtal", och sidfoten hade inga länkar alls. Nu
  fyra vägar per branschsida — nav, hero (primärknapp, med demon som
  andrahandsval, samma ordning som på startsidan), avslutet och sidfoten.
  Etiketten är utan branschnamn med flit: namnen är "Bokföringsbyrå" och
  "Coach / soloföretagare", så interpolation gav obegriplig svenska. Verifierat
  i webbläsare på både galleri- och branschvyn.

- [x] **KA2** `triggers` når kunden — löst 2026-08-17. `stripTeam()` bär fältet,
  portalen visar det som **"Vänd dig hit när"** på agentkortet, och
  `portal-team.md` beskriver det. Kapaciteterna säger vad agenten *kan*;
  triggers säger *när* — den svårare frågan för en kund med sex agenter. De 14
  incheckade teamfilerna saknar fältet och visar då inget alls; nya byggen får
  det. Två tester mäter från båda sidor: att `stripTeam` bär vidare varje fält
  portalen läser, och att portalen faktiskt **visar** triggers (etikett, chips
  och stil) — en läsning utan utskrift är samma dödfält ett steg längre fram.

- [x] **DR3** Alla åtta Pages-secrets plus D1-bindningen står i `CLAUDE.md`,
  med vad som händer om var och en uteblir — 2026-08-17. Prisnycklarna läses
  **dynamiskt** via `TIERS[...].env` och syns därför inte om man greppar efter
  `env.STRIPE_PRICE`; det är utskrivet. Ingen `.dev.vars.example`:
  `.gitignore` täcker `.dev.vars.*`, så filen hade blivit osynlig för git.

- [x] **DR4** `docs/vendor-versioner.md` — 2026-08-17. pdf.js **6.2.108** och
  SheetJS **0.20.3**, båda ur filernas egna versionsströmmar. mammoth är
  **inte** fastställd (bundlens versionssträngar hör till dess beroenden) och
  det står utskrivet i stället för gissat. Filen ligger i `docs/`, inte i
  `portal/vendor/`, eftersom allt under `portal/` publiceras — BL1:s poäng var
  att sluta publicera arbetsanteckningar.

- [x] **DR5** Noten om att kod och schema rullas tillbaka **ihop** står i
  `CLAUDE.md` — 2026-08-17. Så länge migrationerna bara lägger till kolumner är
  en ren kodrollback ofarlig; den dag en migration tar bort något koden läser
  blir den en tyst krasch i drift.

- [x] **TG5** "Får plats i minnet"-pricken har `role="img"` + `aria-label` —
  2026-08-17. Förklaringen låg bara i ett `title` på en icke-fokuserbar `span`,
  som varken nås med tangentbord eller på touch. Pricken avgör om agenten
  faktiskt *vet* vad som står i dokumentet.

- [x] **KA1 + KA3** Enkätvägen kan inte längre bygga på enbart kryssval — löst
  2026-08-17. Enkäten står kvar; det är fritexten som blivit obligatorisk när
  den är det enda som saknas. `enkatBaradIntake()` är sant när inget fritextfält
  bär minst 15 tecken ("nej" och "vet ej" är inte beskrivningar), och i
  personläget mäts `role`/`workplace`/`expectations` i stället för
  verksamhetens fält — annars hade en ifylld roll inte räknats.

  Är intaget bara kryss får `CLARIFY_PROMPT` veta det, med instruktionen att
  **aldrig** svara "OK". Faller anropet, eller svarar det "OK" ändå, tar
  `ENKAT_RESERVFRAGOR` över. **Det är den viktigaste raden i ändringen:** den
  gamla koden startade pipelinen direkt i båda fallen, alltså exakt på det
  underlag som inte gick att bygga på. I tvingande läge finns ingen "Hoppa
  över", och rutan säger varför i klartext — kunden valde enkäten för att det
  är svårt att formulera verksamheten, och att bara spärra knappen hade lästs
  som att formuläret krånglar.

  `test/intake.mjs` (6 tester) mäter **två** saker, och skillnaden är poängen:
  att rent enkätintag fortfarande är oskiljbart (en egenskap hos fasta listval,
  inte en bugg att koda bort) och att koden **vet** det, så att grinden slår
  till. Mutationstestat i båda riktningarna: sänks tröskeln till 1 tecken
  faller ett test, tas grinden bort helt faller tre. Verifierat i webbläsare:
  ingen "Hoppa över", blockering med `role="alert"`, pipelinen startar inte.

- [x] **TG1 + TG2 + TG4** Portalen går att använda med tangentbord och
  skärmläsare — löst 2026-08-17. Inloggningens båda steg har kopplade,
  visuellt dolda etiketter (ny `.vh`; formgivningen har ingen plats för synliga,
  och ledtexten säger redan vad som ska skrivas) och felraden har `role="alert"`
  — "Koden gick inte att verifiera" hände tidigare helt tyst. `openOverlay()`
  sätter nu `role="dialog"`, `aria-modal` och `aria-labelledby`, flyttar fokus
  in, fångar Tab och återställer fokus vid stängning; det gäller alla ~15 rutor
  på en gång. Etiketterna i builderns följdfrågor och portalens "Utveckla
  teamet" är kopplade till sina fält.

  Verifierat i webbläsare mot två rutor: rollerna sitter, titeln nås via
  `aria-labelledby`, **25 Tab-tryck lämnar aldrig rutan**, Escape stänger, och
  fokus kommer tillbaka till exakt den knapp som öppnade. Kontrastfärgen mätt
  live: `rgb(143, 63, 34)`.

- [x] **KL3** Avkapade svar syns för kunden — löst 2026-08-17. `finish_reason`
  lästes ingenstans, så ett svar som slog i tokentaket renderades och sparades
  som färdigt. Parsern läser det nu och anropar `opts.onTruncated`; portalen
  lägger en tydlig rad i själva svaret, så varningen följer med i historik,
  kopiering och nedladdning.

- [x] **Klientkodens första tester** (`test/klient.mjs`, 7 st) — 2026-08-17.
  6 540 rader webbläsarkod hade noll, och det var precis där B1 låg i tio dagar.
  Filen laddas med stubbad `window` och stubbad `fetch`. Täckningen är vald
  efter vad som faktiskt gått sönder: strömning + förbrukning, avkapat svar,
  **motprovet** att ett normalt avslut inte varnar, en chunk delad mitt i en
  JSON-rad, felram mitt i strömmen, och att anropet går till `/api/ai` med
  sessionen — aldrig direkt till en leverantör, vilket var vad nyckelvägen
  gjorde. Mutationstestat: tas `finish_reason`-raden bort faller två av dem.

- [x] **SE3 + SE4** Delade länkar ser ut som något — löst 2026-08-17. De fem
  case-sidorna och `builder/index.html` hade bara `<title>`; nu har de
  metabeskrivning, canonical och Open Graph, med egen text per sida (Lindgren är
  nya på AI, Ordrum hade spridd ChatGPT, IKEA är läge B utan intervju, Advanced
  Studio hade redan byggt själv). `villkor.html` och `integritet.html` har fått
  canonical, och `portal/aktivera.html` `noindex` — den nås bara med ett
  `session_id`. Alla canonicals står nu i den form produktionen faktiskt
  serverar: `en-vecka.html` pekade ut sin egen `.html`-adress, som svarar 308.

- [x] **DR2** Arbetet finns utanför datorn — löst 2026-08-17. `git push origin
  main`: `657c29b..a3e1950`, alltså 69 commits, varav 52 från de senaste elva
  dagarna. CI:t från 16 augusti har därmed fått sin första körning. Taggvanan
  är inte påbörjad — den hör till nästa deploy.

- [x] **DR1** Facit komplett i alla sex exempel — löst 2026-08-17. Lerverks fyra
  agenter har nu Perspektiv, Leverans och "Klart när", skrivna ur det exemplets
  egen research: Studiochefen ser sortimentet mot försäljningssiffrorna,
  Veckopiloten ser kvällens timmar, Butiksskribenten ser pjäsen genom ögonen på
  någon som inte kan hålla den, och Kundpost ser mejlet som ett löfte som är på
  väg att avges. Fyra åtskilda perspektiv, inte en mall fyra gånger — och varje
  block hänvisar uttryckligen till en annan agent i teamet, som i de fem övriga
  exemplen. **120 tester gröna.**

- [x] **BF1** Deploy kör testsviten först — löst 2026-08-17. `npm test &&` ligger
  allra först i `deploy`-scriptet, före bygget, så en röd svit stoppar
  driftsättningen i stället för att upptäckas efteråt. Skälet står i en
  `//deploy`-nyckel i `package.json` intill wrangler-noten: CI triggar på push,
  deploy kräver ingen push, och de två var därför frånkopplade. Sviten tar under
  en sekund — det finns ingen anledning att ta bort raden.

- [x] **KL1** Kapplöpningen vid dubbelklick — löst 2026-08-17. Fixad tvärtom mot
  vad punkten föreslog, och det var viktigt: att flytta spärren *upp* hade lagt
  `state.streaming = true` före ett `await` som ligger **utanför**
  `try/finally`, så ett fel i filläsningen hade låst skrivrutan för resten av
  sessionen — en dubbeldebitering utbytt mot en död ruta. Eftersom allt mellan
  spärrkontrollen och flaggan är synkront räckte det att flytta
  `refreshFolder()` **in** i try-blocket, där `finally` alltid återställer.
  Verifierat med ett skript som räknar `await` mellan spärren och flaggan i båda
  funktionerna: **0 i submitMessage, 0 i runMeeting.** Kunden ser dessutom sitt
  eget meddelande direkt nu, medan filerna läses.

- [x] **KL2** "Rensa samtal" kan inte längre äta upp ett betalt svar — löst
  2026-08-17. Två lager: knapparna "Rensa samtal" och "Töm allt" vägrar medan
  ett svar strömmar och säger varför, och de fyra pusharna som sker *efter* ett
  await går genom en ny `pushHistory()` som återskapar arrayen om den försvunnit.
  Samma princip som filens egna AbortError-grenar redan följde ("behåll det som
  kom; det är betald output"). Provat headless: gamla vägen kastar
  `TypeError: Cannot read properties of undefined (reading 'push')`, nya behåller
  svaret.

  **Hittat på vägen:** `wipe.title` sa fortfarande "Tar bort **nyckel**,
  chatthistorik och team-utkast". Det finns ingen nyckel att ta bort sedan
  2026-08-06 — R2/R3/R5 missade en tooltip. Rättad.

- [x] **TG3** Felröd text klarar AA på inloggningsskärmen — löst 2026-08-17.
  `.setup-err` använder nu den mörkare rosten `#8F3F22` (**6,15:1** mot sanden)
  i stället för `--red` (**4,20:1**), med kontrastvärdena och skälet i en
  kommentar intill, som filen redan gör på två andra ställen.

  **Rättelse av punkten:** `builder/builder.css:34` togs inte med. Den regeln är
  **död** — `setup-err` har noll användningar i `builder.js` sedan nyckelskärmen
  försvann. Den och `.buy-keygate-err` är kandidater för borttagning, men det är
  städning av annat slag och görs inte tyst.

- [x] **SE2** Okända adresser ger 404, inte startsidan — löst 2026-08-17. Ny
  `404.html` i `ITEMS`; Cloudflare Pages serverar den för omatchade sökvägar och
  sätter rätt statuskod. Sidan ligger i designsystemet, visar vilken adress som
  saknades (`textContent`, aldrig `innerHTML` — sökvägen kommer från
  adressfältet), har `noindex` och tre vägar vidare, med Buildern som
  primärknapp. Renderad i 1000 px och 360 px: inga konsolfel, ingen horisontell
  scroll. `check-dist` grön med 60 stämplade referenser.

- [x] **B1** `openrouter is not defined` — löst 2026-08-16. Förgreningen mot
  Anthropic-format togs bort helt: `/api/ai` skickar uppströmsbytena vidare
  orörda (`functions/api/ai.js:599`) och uppströms är OpenRouter, så det finns
  ett format att läsa. `portal/sw.js` bumpad till v27 — utan den hade fixen
  inte nått någon som redan öppnat portalen. Verifierat med en stubbad SSE:
  strömmad text, tokenförbrukning, chunk delad mitt i en JSON-rad, felram
  mitt i strömmen och 402 från betalväggen. 69 tester gröna.

  **Buggen låg i produktion i tio dagar** (6–16 aug) och sänkte en demo för
  en vän. Den var känd och uppmätt sedan 15 aug, uppskattad till fem minuter,
  och blev ändå liggande under sex punkter med lägre insats. Ett fel som gör
  produkten stum lagas samma pass som det hittas — det köar inte.

- [x] **C4** `examples/` var facit utan det facit ska visa — löst 2026-08-16.
  Samtliga sex exempel saknade **Perspektiv** och **"Klart när"** helt, och
  fyra av dem saknade Leverans. Prompterna hade skärpts medan facit stod kvar,
  vilket är den tystaste sortens fel: CLAUDE.md skickar varje ny läsare — och
  varje ny modell — dit för att se vad output ska likna.

  Alla **24 agentblock** i de sex exemplen har nu Perspektiv, Leverans och
  "Klart när", skrivna var för sig ur respektive exempels egen research. Inte
  en mall kopierad 24 gånger: perspektiven är åtskilda *inom* varje team, för
  det är hela poängen med sektionen — Studiochefen ser sortiment mot
  försäljning där Veckopiloten ser kvällens timmar, offertagenten ser
  omfattning där researchern ser fackspråkets fällor.

  Nytt `test/examples.mjs` håller ribban: antalet Perspektiv, Leverans och
  "Klart när" måste matcha antalet agenter i varje fil. Provat mot ett
  borttaget avsnitt — testet fäller. 120 tester gröna.

  **Rättelse 2026-08-17: fem av sex, inte sex av sex.**
  `examples/team-builder/lerverk/test-output.md` har 4 agentblock men 0
  Perspektiv, 0 Leverans och 0 "Klart när" — de fem andra exemplen är
  kompletta (uppmätt per fil). "120 tester gröna" gällde alltså inte den
  commit som skrev det; testet fäller på lerverk. Kvar som **DR1** ovan.
  Att testet skrevs samtidigt är det som gjorde felet synligt — golvet
  fungerade, det var facit som inte hann med.

- [x] **C6** Inget golv på systemprompternas innehåll — löst 2026-08-16.
  `TEAM_SCHEMA` garanterade att fältet `system` fanns och var en sträng, men
  inte vad som stod i den. Uppmätt: två av fjorton teamfiler saknade
  `DITT PERSPEKTIV` i **samtliga** agenter, och ingenting sa ifrån.

  Golvet ligger nu på två ställen. `kontrolleraSystemprompter()` i
  `builder/builder.js` fäller sammanställningen med ett läsbart fel och samma
  retry-väg som redan fanns; ett test i `test/teams.mjs` håller det som redan
  ligger i repot till samma ribba, så handskrivet och nygenererat bedöms lika.

  Golvet kräver `DITT PERSPEKTIV` och `LEVERANS`, inte alla tio sektionerna i
  `PORTAL_RULES`. Perspektivet är det som gör att två agenter med närliggande
  uppgifter svarar olika — utan det går kvalitetschecklistans "två agenter i
  samma team delar inte perspektiv" inte att uppfylla ens i teorin. Leveransen
  bär "Klart när"-punkterna. De övriga gör svaret bättre; de två gör det till
  ett team. Ett golv som kräver allt hade gjort bygget ostabilt av kosmetiska
  skäl, och ett golv som aldrig fäller är ingen kontroll utan en förhoppning.

  `accountant.js` (3 agenter) och `coachonline.js` (4) är kompletterade för
  hand — med **olika** perspektiv per agent, eftersom sju likalydande stycken
  hade varit samma fel i ny förpackning. Testet skrevs först och fällde på
  exakt de två filerna innan de lagades. 112 tester gröna.

- [x] **K5** `allowAttempt` hade en kapplöpning — löst 2026-08-16. SELECT följt
  av UPDATE lämnade ett fönster där två samtidiga anrop båda läste samma värde,
  båda bedömde sig som tillåtna, och taket överskreds. Inte teoretiskt: taken
  finns för trafik som kommer många samtidigt, och ett skript skickar sina
  anrop parallellt — precis då kontrollen behövde hålla.

  Nu gör en enda `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` hela jobbet;
  räkningen och beslutet kan inte glida isär för de är samma sats. Fönstret
  nollställs i ett CASE-uttryck, och `window_at` flyttas medvetet **inte** fram
  vid varje träff — annars kunde den som fortsätter knacka hålla sitt eget
  fönster öppet i evighet. Funktionen är dessutom fail-closed: uteblir svaret
  stänger den, för det är inloggning och kassa den skyddar.

  **Verifierat mot riktig databas, i två steg.** Åtta nya tester kör mot
  `node:sqlite` (D1 *är* SQLite), och satsen provades sedan mot den skarpa D1:n
  med en engångshink — den returnerade `{count: 2}`, alltså både RETURNING och
  uppräkningsgrenen. Utan den kontrollen hade ett D1 som inte stödjer RETURNING
  blockerat varje anrop till hela tjänsten. Testraden är borttagen.

- [x] **R8** Builderns nedladdning — löst 2026-08-16. Buildern hade en egen
  trerading som varken kopplade in `<a>` i dokumentet eller fördröjde
  `revokeObjectURL`; portalen hade lagat båda och skrivit ner varför.
  Implementationen bor nu i `atb-claude.js`, som båda ytorna redan laddar, så
  det finns en version att laga i stället för två att glömma.

- [x] **C5** `portal-team.md` mot `builder.js` — löst 2026-08-16. Kvar sedan
  förra rundan: mallen beskrev fortfarande att kunden klistrar in en egen
  Anthropic-nyckel och pratar direkt mot Claude, och att auto-rutiner kostar på
  "kundens nyckel". Dessutom saknade agent-exemplet `job`, `capabilities` och
  `starters` — de tre fält portalens agentkort byggs av, alltså det som skiljer
  portalen från en tom chattruta. Mallen har nu en uttrycklig notis om att den
  speglar `stripTeam()` för hand.

- [x] **C2** Personläget gick inte att nå från `/build-team` — löst 2026-08-16.
  `research.md` har ett helt läge för när teamet byggs åt *en person i sitt
  jobb* i stället för åt en verksamhet, men `intake-interview.md` frågade
  aldrig, så `/build-team` kunde inte producera det kontraktet. Webb-Buildern
  hade läget; kommandot hade det inte. Följden var att en anställd som ville ha
  ett team runt sin egen vecka fick ett byggt runt arbetsgivarens
  organisationsschema — precis den generiska output projektet finns för att
  undvika. Intervjun har nu en **fråga 0** (verksamhet eller person?), två
  följdfrågor för personläget (roll i egna ord, vad omgivningen bedömer på),
  och output-formatet finns i två varianter som speglar `research.md` exakt —
  inklusive att `storlek` står på `solo` oavsett hur stor arbetsplatsen är.

- [x] **C3** `proposal.md` tillät generisk VD-output — löst 2026-08-16. Punkten
  sa att om research inte hittade prioriteringsmoment fick VD ett *generiskt*
  operativt eller strategiskt jobb. Det gjorde undantaget till en genväg förbi
  kärnregeln, och VD är den agent som är lättast att fylla med branschklichéer
  — alltså den vanligaste anledningen till att två kunder får team som liknar
  varandra. Nu står motsatsen: inga funna prioriteringsmoment betyder att
  research inte är klar, med konkreta anvisningar om var besluten faktiskt
  fattas (vad som prioriteras bort när veckan inte räcker, vem som avgör vilken
  kund som får vänta). Filen hämtas live av Buildern, så ändringen gäller båda
  vägarna samtidigt.

- [x] **D1** Ingen CI — löst 2026-08-16. `.github/workflows/test.yml` kör
  testsviten och bygget vid push och pull request. Bygget är inte pynt: det
  fäller om `index.html` länkar till juridiksidor som inte publiceras, och om
  SHELL-/CACHE-raden i `portal/sw.js` skrivits om i en form versionsstämplingen
  inte känner igen. Deployar inte — det vore ett större beslut än att köra
  tester. **Börjar gälla när repot pushas: origin ligger 63 commits efter.**

- [x] **Ny kontroll: `scripts/check-dist.mjs`** (2026-08-16) — verifierar att
  varje stämplad URL pekar på en fil som finns, att hashen stämmer med
  innehållet, att ingen lokal js/css-referens är ostämplad, och att service
  workerns SHELL begär samma URL:er som sidorna. Körs av CI **och** av
  `npm run deploy`, så en trasig stämpling aldrig når produktion. Provad mot
  båda felmoderna: den fäller på fel hash och på en avstämplad referens.

- [x] **D4** `npx --yes wrangler` opinnat — löst 2026-08-16. Pinnat till
  4.123.0, versionen alla deployer hittills är gjorda med. Verktyget rör
  produktionen (deploy, D1-migrationer, emulatorn), och att hämta "vilken
  version som råkade vara ute i dag" är en förändring i driften som inte syns
  i något commit.

- [x] **D6** Prislistetestet kollade namn, aldrig belopp — löst 2026-08-16.
  Nya tester läser de **kundsynliga** beloppen i `index.html` och
  `villkor.html` (HTML-kommentarerna borträknade, eftersom de med flit
  innehåller de strukna nivåerna som varning) och kräver att 90 och 290 finns
  och att 190, 490 och 4 990 inte gör det. Dessutom att builderns `PLANS` och
  kassans `TIERS` inte glidit isär, och att provmånaden är `payment` medan
  standard är `subscription` — det senare styr vad kvittosidan säger till
  kunden. Ordgränser i regexen, för `"290 kr".includes("90 kr")` är sant.

- [x] **BL1** Arbetsanteckningar publicerades — löst 2026-08-16. 21,2 kB
  HTML-kommentarer strippas nu ur `dist/`: strukna prisnivåer med belopp, vad
  vi inte kan leverera och varför, vad ett bygge kostar oss i ören, och
  anteckningar om konkurrenter — allt läsbart med "visa källkod" på
  mittaiteam.se. Källfilerna behåller allt; bara den publicerade kopian städas.
  Bygget kontrollerar först att ingen `<script>`/`<style>` innehåller `<!--`
  eller `-->`, så strippningen inte kan kapa mitt i kod.

  **JS-kommentarerna (97 kB) lämnas kvar, medvetet.** Att ta bort dem kräver
  en riktig tokeniserare — en regex bryter på `https://` och på `//` inuti
  strängar — och en minifierare gör den driftsatta koden oläsbar. Det priset
  är för högt här: felsökningen av B1 byggde på att hämta den skarpa filen och
  läsa den. Konsekvensen att leva med är att klientkoden är offentlig läsning,
  vilket den är i vilket fall.

- [x] **K3** Byggtrafik kunde stänga ute betalande kunder — löst 2026-08-16.
  Det globala dygnstaket (4 000) delades av allt, och bygget är gratis,
  anonymt och obegränsat — alltså den trafik som kan explodera. En dag med
  ovanligt många byggen hade gett betalande kunder 503 till midnatt. Fel kund
  att svika: den som bygger gratis kan komma tillbaka i morgon.

  Bygget har nu en egen andel, 2 500 av 4 000, bokförd på raden `build:global`
  i `ai_usage` — ingen migration behövdes. Portalen har därmed alltid minst
  1 500 svar kvar. Det globala taket gäller fortfarande alla: når vi 4 000 är
  tjänsten nere för allihop, vilket är avsiktligt.

  Både grinden **och** bokföringen är byggda — ett tak som läser en siffra
  ingen skriver är inget tak, vilket är exakt vad planens livscykel led av
  före 2026-08-07. Fem nya tester täcker båda, inklusive det som är hela
  poängen: en betalande kund når fram när byggets tak är fullt.

- [x] **C1** Strikt schema mot prompt — löst 2026-08-16. `additionalProperties:
  false` betyder att ett fält som saknas i schemat inte är valfritt utan
  **förbjudet**, så de fält prompten beställde kunde modellen inte leverera hur
  tydligt den än blev tillsagd. Följderna var tysta och gick åt två håll:
  `seasons` saknades i **alla** genererade teamfiler (portalens årshjul var
  permanent tomt), `firstProject` gick inte att producera (konsult-lägets
  🎯-panel kunde aldrig fyllas trots att first-project-steget kördes och
  betalades), och `triggers` gjorde "Triggas av"-chipsen döda. Omvänt krävde
  schemat ett toppnivå-`why` som ingen prompt definierade och ingen kod läste —
  modellen tvingades hitta på det.

  Lagat i **båda** riktningarna: de tre fälten tillagda i schemat (nullbara
  eller tomma där det är rimligt — inget `minItems` som beställer just de
  påhittade datum prompten förbjuder), `why` borttaget ur schemat, `scaling`
  borttaget ur prompten (lästes av ingen; skalningsbeslutet finns redan som
  eget steg). Prompten fick också en `TRIGGERS`-instruktion — nyckeln fanns i
  schemablocket utan att någonstans förklaras.

  Verifierat **skarpt** mot `/api/ai` i strict-läge med schemat extraherat ur
  `builder.js`: `seasons` kommer tillbaka ifylld, `firstProject`-nyckeln finns
  (null i team-builder-läget), `triggers` genereras per agent, `why` och
  `scaling` är borta, och golven för `starters`/`routines`/`rejected` håller.

- [x] **K1** Teckentaket gick att kliva förbi — löst 2026-08-16. Två vägar, inte
  en: `content` som **array** mättes som `String([...])` = `"[object Object]"`,
  femton tecken oavsett nyttolast; och en array med tusentals meddelanden med
  tom `content` summerades till noll. Båda gick vidare orört uppströms, på vår
  räkning. Lagat genom att validera **formen** i stället för att bara mäta
  bättre: `content` måste vara en sträng, `role` normaliseras till
  `user`/`assistant`, `MAX_MESSAGES = 200`, och det som skickas uppströms är
  vårt eget objekt — aldrig klientens. `functions/api/ai.js`.

- [x] **R1** Kvittosidan bad om en OpenRouter-nyckel som inte finns längre —
  löst 2026-08-16. Rättat i samma svep: sidan påstod också "engångsbetalning,
  inget abonnemang" åt alla, vilket är fel för den som just tecknat Standard.
  `/api/checkout/status` returnerar nu `plan`, och texten säger sant per nivå.

- [x] **R2 / R3 / R5** All kvarvarande nyckeltext i kundytorna — löst
  2026-08-16. Branschsidorna ("kör på er egen AI-nyckel"), portalens "Töm
  allt" och meta-beskrivningar, `site/en-vecka.html`s jämförelsetabell,
  delningsrutans "mottagaren använder sin egen nyckel" (som dessutom lovade
  åtkomst den inte ger), samt fem påståenden i galleriet om att motorn är
  "Claude". Kundcitatet i `site/studio.html:72` står kvar — där är Claude
  kundens eget verktyg, inte vår motor.

- [x] **R6** FAQ sålde ett "konsultpaket" utanför prislistan — löst 2026-08-16.
  Ersatt med det som faktiskt finns: gratis bygge, och offert för det större.

- [x] **R7** Tio olika tidsangivelser för ett bygge — löst 2026-08-16. De mätte
  **två olika saker** och blandades: körningen (28 s uppmätt) och totaltiden
  inklusive formuläret. Nu skilda genomgående — "under en minut" om körningen,
  "en kvart" om kundens totala tidsåtgång.

- [x] **C7** `team.language` hårdkodad — löst 2026-08-16. Fältet låg på **två**
  ställen (`structureTeam` och `stripTeam`, där det senare är det som faktiskt
  når konfigen) och lästes av noll rader kod. Borttaget i stället för
  omskrivet, med mallen uppdaterad — samma sortis dödfält som `defaultModel`,
  som låg kvar i mallen och pekade ut en Claude-modell.

- [x] **D5 + D2** Cachningen — löst 2026-08-16, **men diagnosen i D5 var fel**.
  Punkten sa "no-cache åt JS men inte åt CSS". Sanningen, uppmätt i
  produktion: **Cloudflare Pages äger `Cache-Control` på statiska tillgångar
  och skriver över den.** Varken CSS *eller* JS fick no-cache — hela listan i
  `_headers` hade aldrig gjort någonting, inte heller raderna som lades in
  långt tidigare för `atb-claude.js` och `portal/app.js`.

  Att reglerna träffade bevisades genom att lägga en egen header
  (`X-Regeltest`) på samma sökväg och deploya: den kom fram, `Cache-Control`
  gjorde det inte. Det är alltså inte `_headers` som är trasig och inte
  mönstren — det är just den headern som Pages inte släpper fram.

  Det gjorde saken värre än att bara sakna skyddet: kommentaren i `_headers`
  lovade att applagret alltid revalideras, så en deploy såg ut att nå kunden
  direkt medan den i själva verket kunde ta fyra timmar. Det är samma fyra
  timmar som gjorde B1 svår att lita på som lagad.

  Fixen ligger nu där den fungerar oavsett headers: `build-dist.mjs` sätter
  `?v=<innehållshash>` på varje js/css-referens i HTML **och** i service
  workerns SHELL, med samma URL:er på båda ställena. HTML levereras av Pages
  med `max-age=0, must-revalidate` (också uppmätt), så den nya URL:en når
  besökaren direkt. 58 referenser verifierade mot filernas faktiska innehåll,
  bygget är deterministiskt över två körningar, och alla sju portal-URL:er
  svarar 200 skarpt.

  **Det löste D2 på köpet:** cachenamnet i `portal/sw.js` får en hash av hela
  SHELL vid bygget (`atb-portal-v28-ff211dc2`), så bumpen är inte längre ett
  minneskrav. Bygget avbryter om SHELL- eller CACHE-raden skrivs om i en form
  det inte känner igen, i stället för att gissa.

  **Inte åtgärdat:** `portal/teams/<slug>.js` laddas dynamiskt från JS och
  versionsstämplas inte — en uppdaterad teamkonfig kan nå kunden upp till fyra
  timmar sent. Sällsynt, men det är kvar.

- [x] **Tester för `/api/ai`** (2026-08-16) — rutten hade noll, trots att den
  är den enda filen där en manipulerad klient kan kosta oss pengar. 12 tester
  i `test/ai.mjs` kör den **riktiga** `onRequestPost` med stubbad databas och
  stubbad uppström. Testsviten: 81 gröna.
