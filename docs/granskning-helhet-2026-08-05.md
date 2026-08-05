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

## Nästa arbete

Rangordnat efter hur mycket det ökar chansen att någon betalar.

**1. Gör sajten kontaktbar, identifierbar och ärligt prissatt — ~1 dag.**
✅ *Kontaktvägen är klar sedan 2026-08-05:* info@mittaiteam.se via Cloudflare
Email Routing (gratis, vidarebefordran till Gmail, catch-all på), inlagd i
kontaktsektionen och sidfoten. Nästa steg där: DMARC-post saknas, och svar går
i dagsläget ut från privat Gmail-adress — vill du svara *som* info@ krävs
Google Workspace eller en SMTP-relä. Kvarstår i övrigt i det här steget: lägg till
"Vem står bakom" med namn, ort, orgnr och kontaktväg. Publicera `integritet.html`
och `villkor.html`. Antingen koppla kassa på 2 900-kortet eller byt CTA till
"Prova gratis under beta" — det senare tar en kvart och tar bort förtroendeskadan
omedelbart. Lägg in cookiefri analytics (kräver en rad i CSP:n) och OG-taggar med
delningsbild på hub, portal, galleri och branschsidor; kollegadelning är
huvudkanalen och förhandsvisningen är tom idag. Rätta också prisraden "Löpande
partner 2 900 kr/mån" — samma siffra som engångspriset, och löftet "vi sköter
driften av portalen" beskriver en drift som inte finns i BYO-läget.

**2. Riktiga demosvar + branschval från hubben — ~1 dag.**
Demon är den enda säljaren som jobbar när du inte gör det, och `demoReply()`
mallar fortfarande ihop svaret ur agentens tagline. Spela in 10–15 äkta svar per
demoteam via egen Claude Code (kostar noll) och lägg dem som uppslag i
`portal/teams/<slug>.js` med nuvarande funktion som fallback. Byt samtidigt
hubbens tre coachonline-CTA:er mot ett litet branschval, och lägg en köp-CTA i
demobannern. Regenerera teamfilerna i samma svep så att `why`/`starters`/
`rejected` kommer med — då tänds "Därför detta team", vilket är precis det
förtroendeargument steg 1 handlar om.

**3. Gör mobilen och galleriet användbara — ~1 dag.**
Halva besökarna är på mobil och där är produkten svårast att röra sig i: hubbens
navpunkter göms utan meny, portalens topbar har 19 px-kontroller, agentlistan
klipps mitt i ett kort, och galleriet — säljmaterialet — har varken nav eller
CTA och slutar med en utvecklarinstruktion. Lägg samtidigt in
`section[id] { scroll-margin-top: 84px }`; utan den hamnar varje ankarhopp bakom
den sticky headern. Billigt, och det är den yta som just nu ser mest halvfärdig ut.

**4. Stripe M2a-2 → M2a-4 — 2–3 dagar, blockerad tills Stripe-kontot finns.**
Kortaste vägen från arkitektur till första kronan: beslutet är taget,
capability-modellen specad, D1 och `/api/teams/:slug` live, utkastflödet finns.
Flytta upp till andraplats så snart kontot är öppnat.

**Parallellt, billigt och bör inte vänta:** självhosta typsnitten (stänger
GDPR-risken och gör påståendena sanna), uppgradera pdf.js och SheetJS, lägg
`functions/_middleware.js` som stämplar säkerhetsheaders innan M2a-2 ärver
nollan, och skriv de fyra node-testerna ovan — särskilt schematestet.

**Designskuld att beta av när ytorna ändå rörs:** byt de 150+ emojierna mot
enfärgade inline-SVG som ärver `currentColor`. Det är den enda återstående saken
som gör att det nya systemet ser halvfärdigt ut. Ta det ikonuppsättning för
ikonuppsättning i takt med att sidorna ändå redigeras — inte som eget projekt.

**Frys.** Funktionsarbete i `portal/` pausas tills någon betalat. Portalen är
redan djupare än vad noll kunder efterfrågar; varje ny funktion ökar
underhållsytan utan att flytta affären.

**Stryk ur planen:** RAG-trappan (M2b-4) — ingen har slagit i kontextbudgeten;
managed-nivån (M2b-1) som näraliggande punkt — dess pitch har urholkats av
mappstödet och ingen har sagt att de skulle betala för den; idékatalogens 13
obyggda idéer; fler galleri- och branschsidor (tolv landningssidor för noll
trafik är produktion utan distribution); fork C i sin nuvarande formulering
(blockerad per definition — antingen stryk eller definiera om till "två mallar
destillerade ur befintliga `examples/`"); och "tester/CI" som projekt — ersätt med
en manuell 30-minuterschecklista före varje deploy, plus de fyra node-testerna.

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
