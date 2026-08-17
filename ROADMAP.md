# Roadmap

Från genomgången 2026-08-17 · sju parallella linser + egen verifiering.
Översikt: <https://claude.ai/code/artifact/2b4f7c0a-db8d-4387-9f4f-c5dbb73dd77b>
(Förra rundan: 2026-08-15, samma dokument.)

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

## Nu — riktiga fel

- [ ] **P5** "Kopiera delningslänk" ger mottagaren en låst vy — texten är rättad, men vägen in för en kollega saknas fortfarande gränssnitt (`functions/api/team/invite.js` finns, oanropad) · `portal/app.js:2756` · `läst i koden` · ~1–2 h

## Sedan — skav som märks

- [ ] **BF2** Gratisbygget delar ut hela den betalda leveransen. `downloadConfig()` skriver `stripTeam(team)` till fil — inklusive varje agents fullständiga systemprompt — utan konto och utan betalning. Prompterna går att klistra in i gratis ChatGPT och köra löpande, vilket underminerar beslutet "noll provsvar" vars motivering är att det är teamet som säljs. Behöver ett medvetet beslut, inte en bieffekt · `builder/builder.js:1765-1772`, `index.html:604` · `läst i koden` · ~2–4 h
- [ ] **BF3** Fyra prompter ligger öppet på webben, inklusive den filen projektet självt kallar nyckelsteget. Uppmätt: `curl …/prompts/shared/research.md` ger 200 och 17 807 byte klartext. Buildern måste kunna hämta dem klientsidan, så exponeringen har ett skäl — men `build-dist.mjs` säger att resten av `prompts/` är "konsult-IP", och den gränsen går inte att hålla samtidigt · `build-dist.mjs:45-53` · `mätt` · ~30 min (acceptera) / ~1 dag (serverside)
- [ ] **BL2** Ångerrätten saknar knapp — kodens egen TODO, vars villkor nu inträffat · `villkor.html:508-514` · `läst i koden` · ~1–2 h
- [ ] **K4** Bygg-rutten är en oautentiserad LLM-proxy och en väg tillbaka för uppsagda · `functions/api/ai.js:252-293` · `läst i koden` · ~4–6 h

## Framåt — utveckling

- [ ] **KA4** "Två agenter delar inte perspektiv" kontrolleras bara som närvaro. Både `kontrolleraSystemprompter()` och golvet i `test/teams.mjs` kollar att rubriken `DITT PERSPEKTIV` finns — aldrig att innehållet under den skiljer sig mellan agenterna. Kravet är formulerat som mätbart men mäts inte · `builder/builder.js:993-1020`, `test/teams.mjs:100-113`, `test/examples.mjs:52-61` · `mätt` · ~3–4 h
- [ ] **KR2** "Beviset" är den enda ytan utan en riktig körning bakom sig. Hero säger "Ingen av dem är påhittad" och personalliggaren visar fyra anställda med status "I tjänst"; namnen Vera/Ester/Sixten/Malte finns bara i `design/`-skisserna och i `index.html`, och innehållet är lerverk-exemplets form med andra namn. Sex riktiga körningar ligger i `examples/` — anspråket går att göra sant billigt · `index.html:145`, `:163`, `:216-218` · `läst i koden` · ~15 min–1 h
- [ ] **P1** Ingen mätning av var köpresan läcker. Kontrollerat igen 2026-08-17: de enda träffarna på `gtag`/`analytics` i repot är en **CSS-klass** som heter `.gtag`. Cloudflare Web Analytics är gratis, cookiefri och kräver ingen CSP-ändring · `index.html` (inga taggar) · `mätt` · ~20 min–1 h
- [ ] **P6** Auto-körda rutiners "ligger klar"-bevis överlever inte en omladdning · `portal/app.js:2242` · `läst i koden` · ~2 h
- [ ] **BL3** Konkurrensbilden är förbigången: aikollegorna.se leder med EU-drift · `docs/omvarldsresearch-2026-07-17.md` · `mätt` · ~2 h
- [ ] **P2** Gratisbygget fångar ingen e-post — övergiven körning är borta för alltid · `builder/builder.js:1432-1493` · `läst i koden` · ~4 h
- [ ] **P4** Grundteamets agenter går att lägga till, aldrig redigera eller avsluta · `portal/app.js:2617-2691` · `läst i koden` · ~5 h
- [ ] **P3** Provmånaden har ingen utgående livlina utanför portalen · `functions/api/_plan.js:65-86` · `mätt` · ~6 h

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

## Klart

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
