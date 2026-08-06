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
- ~~`portal/vendor/pdf.min.js` var **3.11.174 — CVE-2024-4367** (godtycklig JS via
  preparerad PDF).~~ **Åtgärdat:** 6.2.108 som ES-modul, `isEvalSupported: false`,
  verifierad riktig modulworker (inte tyst fallback till huvudtråden).
- ~~`portal/vendor/xlsx.full.min.js` var **0.18.5 — CVE-2023-30533**
  (prototypförgiftning). Stoppades **inte** av CSP:n.~~ **Åtgärdat:** 0.20.3.
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

### Grinden — STRUKEN 2026-08-06

Det här avsnittet föreslog en mekanisk spärr: ingen ny funktionskod i `portal/`,
`builder/` eller `verticals/` förrän `docs/kunder.md` hade en rad från ett riktigt
kundsamtal, med månadsmått (20 samtal, 3 demos, 1 offert) och en fast säljficka
i veckoschemat.

**Mikael har strukit den.** Den gäller inte, varken som regel i CLAUDE.md eller
som förslag att återkomma till. Texten är borttagen härifrån och ur CLAUDE.md
2026-08-06; det som står kvar är den här noteringen så att den som läser
dokumentet vet att grinden fanns och togs bort, inte att den glömdes.

`docs/kunder.md` finns kvar som logg över samtal och kunder — inte som villkor
för att få bygga.

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
**Vecka 0 genomförd samma dag (fyra byggagenter, strikt uppdelat filägarskap):**

- **Självhostade typsnitt.** `fonts/` med åtta woff2-subset; Google Fonts borta ur
  samtliga elva HTML-filer och ur CSP:n. Stänger den enda GDPR-risk projektet
  självt bär. Bonus: Archivo 700 fungerar nu (hotlänken saknade den vikten).
- **OG-taggar + delningsbild** (`og.png`) på hub, galleri, branscher och portal.
  Bilden visar personalliggaren med fyra anställda och ett avslag — produktens
  argument, inte en logotyp. Kollegadelning är huvudkanalen; förhandsvisningen
  var tom före idag.
- **Galleriet fick nav och CTA.** Utvecklarinstruktionen "/build-team" som sista
  rad i säljmaterialet är ersatt.
- **`scroll-margin-top`**, `sitemap.xml` (11 URL:er), `robots.txt`.
- **Riktiga demosvar.** 63 förskrivna svar över bokförings- och coachteamet, plus
  `why`/`starters`/`rejected`/`routines`/`job`/`capabilities` — schemat som
  saknades i alla fem teamfiler. "Därför detta team" visas nu i demon för första
  gången. Uppslaget kopplat in i `demoReply()`, med den gamla mallgeneratorn kvar
  som fallback; strömningstakten skalar efter svarslängd.
- **Säkerhetsposterna:** pdf.js 3.11.174 → 6.2.108 (CVE-2024-4367) med ES-modul
  och verifierad riktig worker, SheetJS 0.18.5 → 0.20.3 (CVE-2023-30533),
  `functions/_middleware.js` som stämplar säkerhetsheaders på `/api/*` och
  405:ar allt utom GET, service worker v8 med `res.ok`-kontroll och typsnitten
  i skalet. Filimport testad end-to-end med riktig PDF och riktigt kalkylark.
- **Utkast till `integritet.html`, `villkor.html` och `docs/pub-avtal-mall.md`** —
  med `noindex`, utkastruta och 28 beslutsmarkeringar. **Ligger medvetet utanför
  `build-dist.mjs` och sitemapen** tills besluten är fattade och en jurist läst
  dem.

## De tre besluten — fattade 2026-08-05

Planen kallade dem "tre beslut som blockerar allt annat". De är tagna:

1. **Enskild firma**, namn **Glänne & Söner**. Konsekvens som måste accepteras:
   personnumret *är* organisationsnumret, och momsreg.nr blir `SE`+pnr+`01`.
   Båda är lagkrav att publicera (8 § e-handelslagen) när verksamheten är
   momspliktig. Firmanamnet skyddar namnet, inte identiteten.
2. **B2B och privatpersoner.** Dyraste av de tre: drar in distansavtalslagen —
   14 dagars ångerrätt, priser inkl. moms, ARN, och ångerknapp i köpflödet
   så snart ett sådant byggs (lagkrav sedan 2026-06-19).
3. **Momsregistrerat.** Priser anges inkl. moms som huvudtal, med exkl.-talet
   utsatt för företagskunder.

### Prisstegen — beslutad, ersätter tabellen längre upp

Nyckeln är skiljelinjen, inte antalet användare. Belopp inkl. moms:

| Nivå | Pris | Skiljer sig genom |
|---|---|---|
| Bygg ditt team | 0 kr | Resultatsida, inget konto, ditt att ta med |
| Provmånad, egen nyckel | 90 kr | Full portal, kunden betalar sin förbrukning |
| Provmånad, utan nyckel | 190 kr | Allt ingår, tydligt tak |
| Köp teamet | 4 990 kr | Egen nyckel, inga fler avgifter |
| Vi kör det åt er | 490 kr/mån | Ingen nyckel, uppdateringar + support ingår |
| Team i molnet, flera användare | offert | Som idag |

Det tidigare förslaget hade 4 990 engång och 490/mån som samma sak (båda
"lokalt, egen nyckel, en användare") — break-even på tio månader, alltså en
uppmaning att välja abonnemanget och sluta i månad tre. Nu är valet *äga eller
slippa hålla i det*, vilket är ett val kunder kan.

**Kostnadsunderlaget:** en teamgenerering via OpenRouter + DeepSeek V4 Flash
($0,09/M in, $0,18/M ut) kostar ~$0,0045 — knappt 5 öre. Mätt mot faktiska
promptfiler: ~26 000 in, ~12 000 ut över fyra anrop. Ett portalsvar kostar ~1 öre.
En storanvändare i den nyckelfria provmånaden landar på ~26 kr mot 190 kr intäkt.
**På Sonnet blir samma användare ~1 000 kr.** Den nyckelfria nivån går alltså
bara ihop på en billig modell — modellvalet är en del av priset, inte en
inställning kunden får ändra.

### Vad som byggdes i samma pass

- **`villkor.html` och `integritet.html` färdigskrivna.** Alla 28
  beslutsmarkeringar stängda, utkastrutorna och `noindex` borta. Nya/ändrade
  avsnitt: nyckelfritt läge (villkor § 3 och integritet § 5), prislista i
  villkor § 4, konsumentavsnitt som riktig § 15, ångerrätt via mejl,
  bokföringslagens sju år för konsumentköp.
- **Två sanningsrättningar mot utkastet:** EU:s ODR-plattform är avvecklad och
  hänvisas inte längre till; påståendet "databasen ligger inom EU" är struket
  eftersom regionen inte går att utläsa ur `wrangler.toml` — kör
  `npx wrangler d1 info` och skriv in den verifierade regionen innan kunddata lagras.
- **Prislistan på hubben** ersatt enligt tabellen ovan. Bort: "Populärast" (ett
  faktapåstående om marknaden med noll kunder), "Vi sköter driften" (ingen drift
  finns i BYO), de två identiska 2 900-talen, och länken som sålde builder-
  åtkomst för 2 900 kr fast den var gratis.
- **Identitet i sidfoten** + "Vem står bakom" i kontaktsektionen. Sajten nämnde
  tidigare inte Mikael någonstans.
- **Publiceringsspärr i `build-dist.mjs`:** juridiksidorna kopieras till `dist/`
  först när `[FYLL I]` är borta. Spärren fäller inte bygget, den hoppar över
  sidorna och varnar — så orelaterade rättningar går fortfarande att deploya.
  Sitemap-posterna ligger färdigskrivna men bortkommenterade.

### Kvar innan något kan säljas

1. **Org.nr, momsreg.nr och adress** fylls i för hand på tre ställen
   (`villkor.html`, `integritet.html`, `index.html`). Tills dess är sajten
   fortfarande prislista utan villkor.
2. **En jurist bör läsa villkoren.** Texten är skriven mot rätt lagrum med
   källor i filhuvudet, men är inte granskad. Tyngst att få läst: § 10
   ansvarsbegränsning och § 15 ångerrätt vid påbörjad digital tjänst.
3. **Den nyckelfria nivån är inte byggbar än** — kräver `/api/chat` på vår
   nyckel med kvot- och takräkning. Sajten märker den "öppnar senare i höst".
   Att lägga in en egen nyckel i kundens webbläsare är ingen genväg: nyckeln
   blir läsbar. Kontextbudget-buggen (`portal/app.js:2684`) blir vår kostnad
   i det läget och måste fixas först.
4. **"Utveckla teamet" tappar sitt resultat.** Tillägg sparas bara i
   `localStorage` (`atb_teamext_<slug>`) — inte till mappen, inte till molnet.
   Rensad webbläsare eller ny dator = borta. Måste lösas innan någon betalar
   490 kr/mån för att "uppdateringar ingår".

- **Riktig kontaktväg:** info@mittaiteam.se satt upp via Cloudflare Email Routing
  (MX + SPF live, catch-all på, vidarebefordran till Gmail, leverans verifierad i
  Activity Log). Platshållaren `din@email.se` finns inte kvar någonstans i repot.
  Kvar på den punkten: DMARC-post, och möjligheten att svara *som* info@.

---

## Arbetspasset 5–6 augusti — vad som faktiskt hände

Det här avsnittet är tillagt i efterhand av samma pass som utförde arbetet.
Läs det som logg, inte som granskning.

### Besluten som fattades

- **Enskild firma Glänne & Söner**, B2B **och** privatpersoner, momsregistrerat.
- **Prisstegen:** 0 kr bygge → provmånad 90 kr med egen nyckel / 190 kr utan →
  köp 4 990 kr *eller* 490 kr/mån → flera användare på offert. Nyckeln är
  skiljelinjen, inte antalet användare.
- **En modell, inga alternativ:** `deepseek/deepseek-v4-flash` via OpenRouter.
  Anthropic-nycklar avvisas. Modellvalet bor i `atb-claude.js`; `stream()`
  ignorerar vad anropet än skickar med. $0,14/$0,28 per miljon tokens — ungefär
  åtta öre per genererat team, ett par öre per portalsvar.
- **Konton i stället för capability-URL.** Länken räckte kryptografiskt men inte
  operativt: den går inte att återkalla, den läcker via webbhistorik, och utan
  identitet går förbrukning inte att mäta per konto — vilket den nyckelfria
  nivån kräver för att kunna prissättas.

### Byggt

Juridik och identitet live (`villkor.html`, `integritet.html`, sidfoten).
Inloggning med engångskod: fem tabeller, fyra rutter, ingen lösenordshantering.
Portalen fick trekolumnslayout, konton, och sex nya branschteam — alla tolv
branschsidor har nu ett demoteam. `npm test` gick från noll tester till 43.

### Det viktigaste felet, och en rättelse av min egen diagnos

En VD-assistent ombads sammanfatta veckan och svarade med en komplett veckoplan:
namngivna kunder, klockslag, en konsultfirma som "hörde av sig för elva dagar
sedan", och meningen "jag har gått igenom kalendern". Ingenting av det fanns.

Jag skrev då i ett commit-meddelande att orsaken var promptdesign — att
`LEVERANS` krävde en ifylld artefakt medan förbudet mot att gissa låg som en
bisats i `ARBETSSÄTT`, och att kravet vann. **Den förklaringen är inte belagd.**
När samma prompt senare kördes mot DeepSeek med en riktig nyckel hittade den
inte på någonting — den bad om underlag. Troligare orsak: webbläsaren körde
gammal kod ur service worker-cachen och anropade fortfarande Anthropic med en
äldre nyckel. Det går inte att bevisa i efterhand.

Regeln mot påhitt står kvar i alla 60 agenter och i `proposal.md` ändå — en
prompt som håller på en modell men viker på en annan är inte robust — men
**motiveringen var en trovärdig historia jag aldrig testade**, och det är samma
fel som orsakade allt annat som gick snett under passet.

### Den dyraste lärdomen

Fyra fel hittades av ägaren på minuter, inte av mig på en dag: agentlistan visade
två agenter och en scrollista, texten var för svag, veckoplanen var påhittad, och
modellväljaren stod kvar med Sonnet 4.6 som "rekommenderad" trots att inget val
gick att använda.

Alla fyra syns bara om man **använder** produkten. Jag verifierade endpoints med
curl och rapporterade det som "testat"; jag kontrollerade att fälten fanns i
stället för att ställa frågan en gång. Startförslagen fyllde textrutan utan att
skicka — noll JS-fel, alltså osynligt för varje statisk granskning, och synligt
på tre sekunder för den som klickar.

**Regel härefter: rapportera aldrig "klart" om det som verifierats är API-lagret.
Kör användarens faktiska steg, inklusive knappen som måste tryckas.**

### Kvar

- `MAIL_PROVIDER=console` ligger i produktion — inloggningskoder skrivs i klartext
  till loggen. Ska bort samma dag en avsändare (Resend/Postmark + DNS) är uppsatt.
- Kassan finns inte. De första kunderna faktureras för hand.
- Nyckelfria nivåerna (190 kr, 490 kr/mån) kräver en proxy på egen nyckel med
  kvotmätning. Inte byggd. Sälj dem inte innan.
- Två kontrastmissar kvar på hubben: `.price-ribbon` (3,85:1) och "Avslag"
  (4,48:1). Bandet ska ändå bort — det påstår något om en marknad med noll kunder.
