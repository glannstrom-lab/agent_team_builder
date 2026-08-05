# Helhetsgranskning 2026-08-05 — läget, fynden och nästa arbete

> **Det här är projektets lägesdokument.** Övriga daterade filer i `docs/` är
> ögonblicksbilder från när de skrevs. Motsäger de den här filen vinner den här.
>
> Metod: sex parallella granskare, en per lana — kod & arkitektur, säkerhet &
> integritet, visuellt & UX, kärnan (prompts/mallar), produkt & affär,
> dokumentation. Ingen av dem fick ändra filer. Fynden nedan är verifierade mot
> koden; där något bara är misstänkt står det uttryckligen.

## Sammanfattning

Kärnan är färdig och håller. Tre solo-körningar i samma storleksklass ger inte
tre namnbyten utan tre olika **topologier** — var det tredje klustret tar vägen
skiljer sig (VD hos Lerverk, hopslagning hos Norrskenspodden, annan hopslagning
hos Wikander), och VD:ns operativa jobb är konkret och olikt i 6 av 6 exempel.
Projektets enda överordnade regel uppfylls alltså. Men **beviset är självrättat**:
divergenstestet i `proposal.md` låter samma modell både skriva och godkänna, och
alla sex exempel passerar sitt eget prov.

Problemet ligger inte i kärnan utan i förhållandet mellan bygge och affär.
Portalen är 2 776 rader med fyra omgångar funktioner ovanpå en kundbas på noll,
medan de billigaste konverteringskritiska sakerna står orörda sedan
kundresegranskningen i juli — och de fyra som fortfarande bryter kedjan är exakt
de fyra som inte går att lösa genom att skriva JavaScript: kontaktvägen är en
platshållare, priser visas utan köpväg, demon avslöjar sig på fråga två, och det
finns ingen mätning alls. **Noll betalande kunder, noll analytics, ingen kassa.**

Tre systemfel förstärker varandra:

1. **Producent och konsument har inget kontrakt.** Buildern producerar ett rikt
   teamschema; de fem incheckade demoteamen ligger kvar på ett äldre. Ingen
   validering finns, så inkompatibiliteten syns inte — den yttrar sig som att
   knappen "Därför detta team" aldrig visas i någon demo.
2. **Marknadsföringen lovar mer än arkitekturen.** Arkitekturen är genuint
   integritetsvänlig, men tre påståenden på sajten var osanna som formulerade.
3. **Ingenting mäts och ingenting testas.** Tre leveransomgångar i rad avslutas
   med "webbläsartest återstår", och repot har noll tester.

## Fynd per lana

### Kod & arkitektur

**P0**

- `portal/app.js:2684` — **ingen kontextbudget för chatthistoriken.** Underlagen
  har en budget (`DOC_BUDGET`), samtalet har ingen: hela historiken (upp till 60
  meddelanden) skickas varje gång. Efter ~30 turer växer kostnaden per fråga
  linjärt tills anropet spräcker modellfönstret. Slår rakt mot löftet "kostar
  bara ören". Åtgärd: rullande fönster + destillat av det äldre, samma mönster
  som `distillDoc` redan använder.
- `portal/teams/*.js` — **alla fem inbyggda team saknar halva schemat.** Inget
  har `starters`, `why`, `rejected`, `divergence` eller `seasons`; bara
  coachonline har `routines`. Konsekvens: "Därför detta team" (produktens
  förtroendeargument) visas aldrig, årshjul och växtväg är inerta, starter-chips
  faller tillbaka på en generisk mening. Åtgärd: regenerera via
  `templates/shared/portal-team.md` + en `validateTeam()` som varnar i konsolen.
- `builder/builder.js:901` — **demoläget skriver över kundens riktiga utkast.**
  Autosparningen är skyddad med `if (!state.demo)`, knappen "Prova teamet live"
  är det inte. `verticals/app.js:152` löser samma problem korrekt med egen nyckel.
- `portal/app.js:1486–1516` — **auto-rutiner kör okontrollerat parallellt** med
  användarens chatt: sätter aldrig `state.streaming`, skickar ingen `signal`, går
  inte att stoppa. Två samtidiga betalda anrop.
- `portal/sw.js:35` — **service workern cachar även misslyckade svar** (ingen
  `res.ok`-kontroll). En 404 blir permanent för PWA-användaren. Cachen trimmas
  aldrig.

**P1 (urval)** — markdown-renderaren saknar kodblock trots att arbetsledarlägets
huvudleverans *är* ett kodblock (`app.js:2073` mot `builder.js:716`);
`syncStatusToFolder` och `saveMemory` serialiseras inte (kapplöpning mot
`teamstatus.json` och `minne.md`, trots att `archiveChain` redan löst mönstret);
61 tomma `catch` gör lagringsfel osynliga; `lastCallCost` är en global som
auto-rutiner klobbar; modell-dropdownen kan visa en annan modell än den som
betalas; `extractJson` är duplicerad teckenidentiskt i builder och portal trots
att `atb-claude.js` finns just för sådant; ingen lockfil och `npx --yes wrangler`
mot produktionsdatabasen.

**Strukturell rot:** `portal/app.js` är en monolit där allt delar ett globalt
`state` plus ett dussin fria modulvariabler. Nästan alla P0/P1 ovan är
kapplöpningar mellan samtidiga skrivare, inte logikfel. Tre riktade ingrepp ger
mest tillbaka: ett litet persistenslager (`store.get/set` med felräknare), ett
`team-schema.js` med `validateTeam()` som både Buildern och portalen kör, och
serialiserade köer för alla asynkrona skrivare. Först därefter är en
moduluppdelning meningsfull.

**Billigast att testa först** (går utan browser-runner, `node --test`, noll
beroenden): `avatars.js`, `extractJson`, `buildIntakeBlock`, ett schema-test som
laddar varje `portal/teams/*.js` och verifierar fälten portalen använder — det
sista hade fångat P0-fyndet ovan direkt.

### Säkerhet & integritet

Arkitekturen är genuint integritetsvänlig: nyckeln loggas aldrig, felmeddelanden
läcker den inte, markdown-renderaren är textnodsbaserad och därmed XSS-fri,
SQL:en är parametriserad, och `connect-src`-låsningen stänger utflödet. Det som
skaver är löftena och tre tekniska skulder.

**P0 — åtgärdat i den här omgången.** Tre påståenden på sajten var osanna som
formulerade: "er data lämnar aldrig er webbläsare" (den gör den, i varje anrop —
det är hela produkten), "inga sparade samtal" (inget hos oss; allt hos kunden,
permanent, i klartext) och GDPR-svaret som gällde båda prisnivåerna men bara
beskrev BYO-läget — i den hostade varianten är vi uppenbart personuppgiftsbiträde
och biträdesavtal krävs. Texterna är omformulerade så att de är lika starka och
sanna. **Kvar:** sajten saknar helt integritetspolicy och villkor.

**P1**

- **Google Fonts hotlinkas från varje sida** — besökarens IP till Google (USA)
  utan samtycke och utan policy. Det är den enda konkreta GDPR-risken vi själva
  bär, och den motsäger "inga personuppgifter hos oss". Åtgärd: självhosta de
  fyra typsnitten (~200 kB woff2) och ta bort `fonts.*` ur `_headers`.
- `portal/vendor/pdf.min.js` är **3.11.174 — CVE-2024-4367** (godtycklig JS via
  preparerad PDF, fixad i 4.2.67). Sannolikt bruten av att CSP:n saknar
  `'unsafe-eval'`, men skyddet är oavsiktligt. Sätt även `isEvalSupported: false`.
- `portal/vendor/xlsx.full.min.js` är **0.18.5 — CVE-2023-30533**
  (prototypförgiftning, fixad i 0.19.3). Stoppas **inte** av CSP:n.
- **HSTS saknades** — åtgärdat i den här omgången, tillsammans med
  `form-action 'self'` (utan den kan injicerad HTML exfiltrera nyckeln via ett
  formulär, förbi `connect-src`).
- **CSP:n ger noll XSS-skydd**, bara exfiltreringsskydd: `script-src` har
  `'unsafe-inline'`. Det behövs bara för fyra små inline-snuttar — flyttas de
  till `.js`-filer blir CSP:n riktig.

**P2** — nyckeln ligger i localStorage i klartext (acceptabelt, men tipset om
spend limit bör flyttas till nyckelrutan); delningslänkar (`#cfg=`) är
attackerarstyrda systemprompter som laddas utan varning; "Utveckla teamet" sparar
LLM-genererade systemprompter beständigt utan att visa `system` i
förhandsvisningen; `_headers` gäller inte Functions-svar (så `/api/*` går ut utan
CSP och `nosniff`, och HEAD faller tillbaka på den statiska sidan); ingen rate
limiting på `/api/*`; capability-sluggen läcker till våra egna loggar eftersom
portalen alltid provar den statiska filen först.

### Kärnan (prompts och mallar)

**P0**

- **Fem agentmallar saknar Perspektiv, Leverans och "Klart när" helt** —
  `templates/team-builder/{ceo-small,ceo-large,chief-of-staff}.md` och
  `templates/ai-consultant/{ceo-beginner,chief-of-staff}.md`. `agent-base.md` har
  dem och `proposal.md` kräver dem per agent, men VD och VD-assistent kommer
  systematiskt utan — exakt de två agenter som redan är mest mallade. (Verifierat:
  0 träffar i alla fem.)
- **`examples/` ligger under den ribba prompterna kräver.** Noll träffar på
  Perspektiv/"Klart när" i alla sex exempel, medan färsk `testoutput/` har dem.
  Den som regenererar mot exemplen backar formatet.
- **Buildern kör proposal utan skills-katalogen och kastar sedan skillsen** —
  `proposal.md` anger `skills-catalog.md` som input, `builder.js:628` skickar den
  inte, och render-schemat har inget `skills`-fält.

**P1 (urval)** — Buildern kör första projektet *efter* proposal, tvärtemot
konsultflödet där det ska forma teamet; `intake-update.md` tappar Avgränsningar,
alltså kundens "rör inte"-gränser, vid varje `/update-team`; `starters` finns i
Buildern och i portalen men inte i `portal-team.md`; divergenstestet bör göras
falsifierbart (tvinga fram vilken agent som skulle strykas för närmaste
konkurrent); `scale.md` bör tvinga fram *sammansättningen*, inte bara antalet, så
att "4 agenter" tre gånger inte läses som samma team.

**Kvalitetschecklistan** i CLAUDE.md hålls på 9 av 16 punkter. Håller inte:
"Leverans med Klart när" (0/6 exempel), "två agenter delar inte perspektiv"
(otestbart — fältet finns inte i exemplen). Obevisat: solo vs enterprise-struktur
(enda stora körningen ligger i `testoutput/`, inte `examples/`, och är full av
stavfel), mötesformat (ingen mötesoutput finns någonstans), `/update-team` (ingen
uppdateringskörning finns).

### Visuellt & UX

Granskat genom att faktiskt rendera alla ytor i Chrome, desktop (1400×1000) och
mobil (390×844), inklusive portalens overlays. Kontroll först: `portal.css` är
token-för-token identisk med `showcase.css`, `builder.css` ärver rätt, och det
finns inga kvarvarande indigo-värden utanför `design/`. **Designbytet är
genomfört, inte påklistrat** — det som återstår är kanter.

**P0**

- ~~`index.html:484` — "Boka ett samtal" går till `mailto:din@email.se`. Alla tre
  priskorten leder hit. Sajtens enda betalväg är död.~~ **Åtgärdat 2026-08-05:**
  riktig adress info@mittaiteam.se, i kontaktsektionen och sidfoten. Knappen
  heter numera "Mejla oss" — den låtsades vara en kalenderbokning.
- `site/index.html` — **galleriet har varken nav eller CTA.** Sidan har exakt sex
  länkar, alla showcase-kort, och avslutas med "Kör det själv i Claude Code:
  `/build-team`" — en utvecklarinstruktion som sista rad i säljmaterialet.
  Besökaren kan inte ta sig till hubben, Branscher eller Priser. Alla andra ytor
  har `.hubnav`.
- **Portalens mobila topbar har 19×22 px kontroller** (hamburgare 19×22,
  stjärnknapp 17×16, "Anslut" 35×14) — under en femtedel av 44×44-minimum, på
  portalens primära navigation.

**P1** — hubbens mobilnav gömmer "Så funkar det", "Branscher" och "Exempel" med
`.hideable` utan att ersätta dem med en meny, så hela vertikalspåret saknar
ingång från mobil; portalens mobildrawer klipper agentlistan mitt i ett kort
(190 px hög, 292 px innehåll, ingen scrollindikator) och blir värre för
åttaagentsteam; **emoji är fortfarande hela ikonsystemet** (68 i `verticals.js`,
33 i `builder.js`, 21 i `index.html`, m.fl.) och de färgklickarna är det enskilt
största som skaver mot "inga gradienter, typografin bär"; Veckostart klistrar in
den tekniska prompten som en 250 px mörk användarbubbla — kunden ser sin egen
maskinprompt; `/verticals/` har 113 px hög header på mobil med CTA:n på egen rad;
`?v=<slug>`-sidornas H1 är helt i ockra (3,44:1, blekt och bryter mönstret);
kort-CTA:er är inte bottenjusterade i någon kortrad (priskorten löser det redan —
kopiera mönstret); **`scroll-margin-top` finns inte någonstans** i repot, så varje
ankarhopp lägger målet under den sticky headern; demoläget murar igen "Håll ett
möte", alltså just den funktion som skiljer portalen från en vanlig chatt; och
portalens arbetsyteknappar ligger under 44 px rakt igenom (34/28/22/19 px).

**P2** — "Populärast"-bandet 3,85:1; `.fit.med` använder `--amber` som i praktiken
är en dubblett av `--accent` och ger 3,86:1 i 10,5 px (byt till `--accent-2` eller
stryk token); ~200 px död yta i högra BYO/managed-kortet; företagsminnets
instruktioner bor i en `placeholder` som försvinner när kunden börjar skriva;
"Veckans arbete" säger "Inget loggat än" efter en genomförd veckostart; de två
2 900-priserna ser lika dyra ut vid skumläsning; och mobila sidlängder på
14 202 px (hubben, ~17 skärmar) utan någon navigering att orientera sig med.

**Helhetsintryck:** typografin, sand/papper-skiktningen och personalliggaren bär
det nya idiomet övertygande på desktop. Mobilen och portalens arbetsyta har inte
fått samma omsorg, och de kvarvarande emojierna drar ner ett annars stramt uttryck.

### Produkt & affär

Lovat mot byggt, kortversionen: M2a-1 är byggt och i drift; M2a-2…4 (kassan) är
inte påbörjade och blockerade på Stripe-kontot; roadmap etapp 0–4, förlags-P1 och
idékatalogens topp 5 är byggda men självdeklarerade — "webbläsartest återstår"
står kvar i alla tre. Av kundresegranskningens sex P0-punkter är en åtgärdad.

**Största risken:** hela byggkapaciteten går till produktdjup för en användarbas
på noll, medan tändning (kassa), bränsle (trafikmekanik) och instrumentering
(analytics) saknas. Den akuta underrisken är förtroendeskada: tre priser utan
köpväg, en kontaktknapp som öppnar `din@email.se`, ingen identitet, ingen
integritetspolicy — samtidigt som fyra av tolv branschsidor riktar sig till
reglerade yrken. Prisuppgift utan köpväg och avsaknad av identitetsuppgifter är
dessutom svaga punkter mot e-handelslagens informationskrav.

### Dokumentation

Åtgärdat i den här omgången (se sista avsnittet). Kvarstående: portalavsnittet i
CLAUDE.md är nu uppdaterat men bör hållas i tre lager (samtal / arbetsyta /
ackumulering) när nästa funktion tillkommer; `docs/` innehåller sex daterade
ögonblicksbilder som delvis motsäger varandra — den här filen ersätter dem som
plan, och de bör läsas som historik.

## Planen: 30 dagar till första kunden

> Reviderad 2026-08-05 efter fyra specialistgranskningar (pris, distribution,
> juridik, sekvensering). Den tidigare listan var **hundra procent utbudssida** —
> fyra steg som alla förbättrade sajten, och inte en rad om vem som skulle få veta
> att den finns. En sajt som ingen besöker, förbättrad, är fortfarande en sajt som
> ingen besöker.

### Det som ändrade planen

**Git säger vad som faktiskt händer:** 38 commits på **sex arbetsdagar** utspridda
över fyra månader, 32 av dem på tre dagar i juli. Det här är inte någon som bygger
lite för mycket varje dag — det är någon som är tyst i veckor och sedan levererar
en hel roadmap på ett dygn. Månadens utfall avgörs alltså under **första timmen av
nästa skurdag**. Ett veckoschema är fel medicin; skuren måste laddas i förväg.

**Första kunden behöver ingen kassa.** Handsålt uppdrag: 15–25 samtal, stängs på
veckor, marginalkostnad noll (levereras via `/build-team` på Max), faktureras från
enskild firma, portalen handprovisioneras på tio minuter. Självbetjäning: kräver
trafik som inte finns, 50–100 kvalificerade besökare per försäljning, från en
anonym sajt utan referenser. Och det handsålda uppdraget är dessutom det enda som
**deponerar den vertikala mallen** som produktstrategin själv kallar bränslet och
som är blockerad tills ett riktigt uppdrag finns. Att sälja för hand är alltså
inte ett avsteg från självbetjäningsstrategin — det är dess enda genomförbara
första steg.

**Den starkaste säljhävstången ligger utanför repot:** Region Örebro läns
*Konsultinsats* betalar **50 %, max 150 000 kr, uttryckligen för att köpa in extern
kompetens** — och Lindesberg ligger i stödområdet. Ett paket på 14 900 kr kostar
kunden 7 450 kr. Det förvandlar "för dyrt" till "när ansöker vi".
⚠️ Ring 019-602 10 00 och bekräfta att 2026 års medel finns kvar **innan** något
lovas en kund.

### Tre beslut som blockerar allt annat

Ingen policytext, inget pris och ingen kassa kan skrivas färdigt innan de är
fattade. Alla tre tar en eftermiddag.

1. **Enskild firma eller AB?** En enskild näringsidkare har inget separat
   organisationsnummer — personnumret *är* identitetsbeteckningen, och lagen om
   elektronisk handel kräver att det publiceras tillsammans med adress. AB ger eget
   orgnr och ingen personuppgift i sidfoten.
2. **B2B-only eller får konsumenter köpa?** B2B-only fäller distansavtalslagen,
   ångerrätten, den obligatoriska ångerknappen (krav sedan 2026-06-19) och kravet
   på pris inklusive moms — i ett svep. En halvtimmes text.
3. **Momsregistrering eller 120 000-undantaget?** Avgör om "priser exkl. moms" ens
   är en tillåten formulering.

### Priset — förslag som väntar på beslut

Marknaden är kluven i två fack: självbetjäning **250–700 kr/mån** (Vorker ~285 kr
i beta, Bokio 249, Fortnox 349) och människodriven leverans **5 000–60 000 kr
engång**. Dagens prislista sitter i glappet där ingen köpare har ett mentalt fack.

Och köpknappen för "Bygg själv 2 900 kr" länkar till `builder/` — den **ger bort
produkten gratis**. Grinden går inte att bygga i efterhand: buildern och portalen
är statiska filer på kundens nyckel. Enda tekniskt äkta betalgrinden är
moln-sparat team + delbar länk, och den servern finns redan.

| Nivå | Förslag | Kommentar |
|---|---|---|
| Prova själv | **0 kr**, beta-märkt | Rättar en osanning i stället för att lösa den |
| Pilotplats | **4 900 kr, 3 platser** | Mot skriftlig case-rätt. Betald pilot konverterar 60–80 % till full affär, gratis pilot under 10 % |
| Uppstart | **7 900–14 900 kr** | Höj när tre riktiga case ligger i galleriet. Med regionstöd halveras kundens kostnad |
| Team i molnet | **299 kr/mån** | Först när någon efterfrågat det |

Bort oavsett beslut: *"Vi sköter driften av portalen"* (ingen drift finns i BYO),
*"Populärast"* på ett paket med noll kunder (faktapåstående om marknaden), och de
två identiska 2 900-talen.

### Veckorna

**Vecka 0 — ~6 timmar, före all trafik.** "Vem står bakom" med namn, ort och
kontaktväg (sajten nämner idag inte Mikael någonstans — noll träffar på Lindesberg,
Glänne eller orgnr). Bokningslänk i stället för enbart `mailto:`. Riktiga demosvar
för **ett** demoteam — det i branschen där listan är tyngst. OG-bild för den enda
länk som faktiskt klistras in. Självhosta typsnitten (en timme, stänger den enda
GDPR-risk du själv bär, och är ett säljargument mot reglerade yrken). Cookiefri
analytics. **Köp API-credits för 200 kr** — utan dem kan du inte visa din egen
produkt live, och det står ingenstans i någon tidigare plan.

**Vecka 1 — öppna dörrarna, bygg ammunition.** Ring näringslivsutvecklaren i
Lindesberg (0581-810 94) — kommunen kartlägger just nu kompetensbehoven hos företag
med 5–30 anställda, vilket är bokstavligen det du säljer. Ring regionen om stödet.
Skriv **listan: 40 namngivna företag**, sorterade A (jag känner dem) / B (ett steg
bort) / C (kalla), i de fyra branscher där demoteam finns. Kör sedan `/build-team`
mot de tio första A-företagen — ett färdigt team per företag, ~30 min styck.

**Vecka 2 — första vågen.** Kontakta de tio med det färdiga teamet bifogat: *"Jag
har byggt ett AI-team åt er. Fyra roller, och två som verktyget sa nej till."*
Hyperriktade utskick med en specifik trigger svarar 15–25 % mot 2,1 % för
massutskick — det färdigbyggda teamet *är* triggern. Kör fem kontakter **utan**
förbyggt team som kontrollgrupp; det är den mest värdefulla data 30 dagar kan ge.

**Vecka 3 — byråer och scen.** Redovisningsbyråer, med Srf-vinkeln i stället för
AI-vinkeln: branschen pratar själv om att gå "från tid till värde". Sälj till dem
som kunder först — partnerpitchen kräver bevis som inte finns än. Boka höstens
scener (näringslivsfrukost, Rotary Lindesberg har talarplats varje måndag) med ett
föredrag bara du kan hålla: *"Jag byggde AI-team åt tolv företag i Bergslagen.
Fyra saker fungerade, sju var teater."* Avslagen är det enda i erbjudandet ingen
konkurrent säger.

**Vecka 4 — konvertera och skörda.** Målet är **10 samtal**, inte 10 kunder.
Leverera för hand, fakturera, och skörda den vertikala mallen ur uppdraget.

### Grinden

Frysningen i förra versionen hade tre undantag i samma dokument — det är en önskan,
inte en frys. Den här är mekanisk och står i CLAUDE.md:

> Ingen ny funktionskod i `portal/`, `builder/` eller `verticals/` committas förrän
> `docs/kunder.md` har en ny rad med datum, namn och utfall från ett riktigt samtal.

Den fungerar för att den är binär, för att varje session kan kontrollera den innan
den börjar bygga, och för att den vänder beroendet: bygget blir belöningen för
säljandet.

**Månadens mått är samtal, inte commits:** 20 samtal, 3 demos, 1 offert ute till
4 september. Slutar månaden med tolv commits och noll samtal har den misslyckats,
oavsett vad som byggdes.

**Rytmen:** tisdag 08:30–09:15 säljficka (enda tillåtna output: skickade
meddelanden eller bokade samtal), torsdag 08:30–08:50 uppföljning. Byggdagen börjar
inte förrän veckans säljficka är gjord — inte som moral, som sekvens. Byggandet
belönar sig självt, säljandet gör det inte.

### Stryk

Självbetjäningsnivån som **aktivt arbetsprogram**, inklusive Stripe M2a-2…4 — det
är 2 900-kortet som tvingar fram kassan, som tvingar fram konverteringsoptimerad
demo, som tvingar fram mobilfixar, i tjänst av ett köp ingen kan ledas fram till.
Handprovisionera de fem första. De åtta branschsidorna utan demoteam (de skickar
trafik till ingenting). Fler galleri- och landningssidor. SEO som 30-dagarsåtgärd —
1,74 % av nya sidor når topp 10 inom ett år; gör sitemap och robots på en halvtimme
och förvänta avkastning månad 6–12. RAG-trappan och managed-nivån. Idékatalogens
13 obyggda idéer. Emoji→SVG som eget projekt. **Och: fler helhetsgranskningar.**
Fyra på fyra månader räcker — nästa bedömning görs av en kund som betalar eller
inte gör det.

**Undantagen som köps in när något annat ändå görs** (~20 min tillsammans):
versionshöj pdf.js och SheetJS, självhosta typsnitten, lägg
`functions/_middleware.js`. Kontextbudget-buggen fixas dagen kund ett börjar föra
långa samtal — men publicera inget kostnadslöfte innan dess.

## Åtgärdat i den här omgången

- Tre osanna integritetspåståenden på hubben omformulerade; GDPR-svaret
  villkorat till BYO-läget med biträdesavtal nämnt för den hostade nivån.
- `_headers`: `Strict-Transport-Security` och `form-action 'self'` tillagda.
- CLAUDE.md: designsystemet dokumenterat, arbetsledarläget dokumenterat,
  portalens fyra funktionsomgångar och `?team=__link` inskrivna, "kan inte glida
  isär" kvalificerat, repo-trädet kompletterat (`design/`, `vendor/`,
  `deadlines-se.js`, `survey-data.js`, `en-vecka.html`, alla 13 docs-filer),
  statusblocket ersatt med ett läge daterat idag.
- README: OpenRouter, galleriets vardagscase, portalens arbetsyta.
- `docs/m2-backend-spec.md`: det felaktiga "enhetstestad" rättat till manuell
  verifiering; klar-status och headers-luckan inskrivna.
- `docs/produktstrategi-sjalvbetjaning.md`: 9 → 12 branscher, fork C:s blockering
  uttalad, pekare hit.
- `docs/granskning-kundresa-2026-07-16.md` och
  `docs/simulering-forlag-slutsatser-2026-07-18.md`: statusblock så att de inte
  läses som öppna listor.
- `docs/team-roles.md`: Perspektiv och Leverans/"Klart när" inskrivna i
  specialistreglerna.
- `.claude/commands/{build-team,consult}.md`: Stage 2-kroken (portal-konfig +
  galleri-sida) tillagd — den saknades, så en session som följde kommandot hoppade
  över den.
- `build-dist.mjs`: kommentaren nämner `design/` så utelämnandet syns som avsikt.
- **Riktig kontaktväg:** info@mittaiteam.se satt upp via Cloudflare Email Routing
  (MX + SPF live, catch-all på, vidarebefordran till Gmail, leverans verifierad i
  Activity Log). Platshållaren `din@email.se` finns inte kvar någonstans i repot.
  Kvar på den punkten: DMARC-post, och möjligheten att svara *som* info@.
