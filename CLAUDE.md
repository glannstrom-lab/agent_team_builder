# Agent Team Builder

> **Publikt namn:** webblagret heter utåt **Mitt AI-team** (mittaiteam.se,
> beslutat 2026-07-16). "Agent Team Builder" är repots/kärnans arbetsnamn.

Ett Claude Code-projekt för att generera skräddarsydda team av subagents åt
företag och projekt. Verktyget har två lägen:

- **`team-builder`** — för dig själv och för tekniska användare som vet vad
  de håller på med. Snabb intake, direkt till team-generering.
- **`ai-consultant`** — för kunduppdrag där du hjälper mindre eller
  medelstora företag komma igång med AI. Lägger till ett första-projekt-steg
  och pedagogiska lager ovanpå samma kärna.

De två lägena delar research-motor, skalningsregler, mötesfunktion och
agent-format. Ungefär 70% är gemensamt. Läs den här filen först, sen
`docs/team-builder.md` eller `docs/ai-consultant.md` beroende på vad du
jobbar på.

## Börja här

Om du (människa eller Claude) precis har öppnat projektet:

1. Läs den här filen en gång — den tar fem minuter.
2. Titta i `examples/` för att se vad output ska likna.
3. För att utveckla systemet: se **Nuvarande sprint** längst ner.
4. För att köra systemet: `/build-team` (team-builder) eller `/consult`
   (ai-consultant) i målprojektet.

## Den enda regeln som betyder mest

**Om output ser likadant ut oavsett input är projektet trasigt.**

Tre olika företag ska ge tre meningsfullt olika team — inte bara olika namn
på samma roller. Det här är inget mjukt ideal; det är projektets
existensberättigande. Varje designval i alla filer finns för att skydda den
regeln.

## De två lägena i en bild

```
                 ┌────────────────────┐
                 │  Delad kärna       │
                 │                    │
                 │  • Research        │
                 │  • Skalning        │
                 │  • Agent-format    │
                 │  • Skills-katalog  │
                 │  • Mötesfunktion   │
                 │  • Principer       │
                 └─────────┬──────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐       ┌────────▼────────┐
     │  team-builder   │       │  ai-consultant  │
     │                 │       │                 │
     │ Kort intake     │       │ Mognadsintake   │
     │ Direkt team     │       │ Första projekt  │
     │ Min. pedagogik  │       │ Pedagogiskt     │
     │                 │       │ Överlämning     │
     └─────────────────┘       └─────────────────┘
```

## Designprinciper (gäller båda lägena)

1. **Konkreta arbetsmoment, inte roller.** Research identifierar vad som
   görs i veckan, inte vilka titlar branschen har.
2. **Skala efter storlek och (för konsult-läget) mognad.** Små team eller
   AI-nybörjare → färre agenter, bredare uppdrag. Se `docs/scaling.md`.
3. **VD måste ha ett operativt jobb.** För solo-projekt räcker inte abstrakt
   strategi — då blir agenten teater. Den här regeln är den näst viktigaste
   efter "output ska vara olika".
4. **VD-assistenten är den primära arbetspartnern.** Se `docs/team-roles.md`.
5. **Varje agent ska kunna motiveras med ett konkret fynd.** Ingen motivering,
   ingen agent. Samma ribba för skills.
6. **Editerbar av människa.** All output är markdown tänkt att läsas och
   justeras för hand.
7. **Idempotent uppdatering.** Att köra igen skrotar aldrig befintligt arbete.
8. **Noll infrastruktur i kärnan.** Genereringen sker via användarens egen
   Claude Code, och BYO-läget + galleriet i webblagret är rena statiska filer
   utan server. Det finns ett *valfritt, tunt* köp/leverans-lager (Cloudflare
   Pages Functions + D1) för moln-sparade team — det rör inte kärnan, men
   webblagret är alltså inte längre kategoriskt "ingen databas". Se
   **Webbgränssnitt** och `docs/m2-backend-spec.md`.
9. **Språk följer input.** Pratar användaren svenska, svarar systemet på
   svenska. Pratar de engelska, engelska. Enkel regel, lätt att glömma.
10. **(Konsult-läget) Pedagogik är situerad.** Förklara det som händer framför
    kunden, just nu, i deras eget projekt. Inte AI-teori i förskott.

## Webbgränssnitt (valfritt lager ovanpå kärnan)

Fyra statiska webbappar + en hub gör verktyget demobart och användbart för
icke-tekniska kunder. De delar designsystemet `site/showcase.css` och kör i
webbläsaren, men **AI-anropen går till `POST /api/ai` på vår nyckel** — det
finns inget BYO-läge längre, och `api.anthropic.com` är borta ur CSP:n.
Köp/leverans-lagret (Cloudflare Pages Functions + D1) sköter konton, betalning
och moln-sparade team; kärnan är fortfarande serverlös.
Demolägen (`?demo=1`) låter både portal och builder visas utan konto.

**Portalens tre dörrar (2026-08-06):** *demoteam* — exempelteamen i
`portal/teams/index.js` och `?team=__vertical` — öppnas alltid i demoläge, utan
konto och utan anrop, eftersom de finns för att titta på. *Köpta team* hämtas
via `/api/teams/:slug`, som kräver inloggning och en rad i `team_access`; når
konfigen fram är teamet betalt. *Allt annat* — Builder-utkast (`__draft`) och
delningslänkar (`__link`) — möts av `renderLocked()`: teamet är byggt men inte
aktiverat, med vägen till köpet. **Ingen nyckelruta finns kvar någonstans**, och
`atb-claude.js` har bara en väg: `/api/ai`. Den gamla grenen som gick direkt
till leverantören när en nyckel låg i localStorage är borttagen — så länge den
fanns kvar var köpgrinden valfri.

**Designsystemet** (`site/showcase.css`, bytt 2026-08-05) heter *Personalen /
Ljus*: sand `#F1ECE3`, papper `#FCFAF6`, bläck `#1E1913` och ockra `#A9741F`
som accent (`--accent-2 #8A5C14` för liten text mot ljus botten), 6 px radie,
1 px linjer, inga gradienter och inget glow. Archivo i display, Karla i
brödtext, IBM Plex Mono i etiketter. Primärknappen är solid bläck, inte
accentfärgad. Portalen (`portal/portal.css`) och Buildern (`builder/builder.css`)
har egna filer men **samma tokennamn** — ändra tokens på ett ställe och det slår
igenom överallt. Nav (`.hubnav`/`.stepnav`) och sälj-knappar (`.btn-lg`) bor i
designsystemet, inte i sidornas inline-CSS; sälj-varianten heter
`.btn-lg.btn-ghost` för att inte krocka med builderns egen `.btn-ghost` på
knappelement. Bärande grepp: agenterna presenteras som anställda — passerkort
med porträtt (`.pbadge`/`.rack`) och en personalliggare (`table.liggare`) där
avvisade förslag står kvar överstrukna. Det gör regeln om att minst en agent
ska få nej synlig i designen. Elva alternativa riktningar finns kvar som
skisser i `design/` (deployas inte).

- **Hub** (`index.html`) — front-dörr och säljsida som navigerar till de fyra.
- **Builder** (`builder/`) — bygg ett team live framför en kund. Kör den
  **riktiga pipelinen** i webbläsaren: hämtar `prompts/shared/research.md`,
  `scale.md`, `proposal.md` (+ `ai-consultant/first-project.md`) live och kör
  dem verbatim, steg för steg, plus ett avslutande sammanställningssteg som
  formaterar förslaget till render-JSON + portal-systemprompter (ändrar inget
  innehåll). Intaget är ett strukturerat frågeformulär (mappar till
  intake-kontraktet i `research.md`, inkl. Avgränsningar) följt av max två
  AI-följdfrågor — hybrid av formulär och intervju. Dessutom en **valbar
  förvalsenkät** (`builder/survey-data.js`): bransch, kunder, arbetsmoment
  (tvåklick = tidstjuv ⏱), verktyg, mål m.m. som rena kryssval — den som har
  svårt att formulera sin verksamhet kan bygga helt utan fritext. Körningar
  persisteras per steg (`atb_last_run`) och kan återupptas efter fel/F5. Eftersom den hämtar
  filerna live följer den alltid de underhållna prompterna — Builder och
  `/build-team` kan inte glida isär **i research, skalning och förslag**.
  Sammanställningssteget (`PORTAL_RULES` i `builder.js`) och arbetsledarläget
  bor däremot bara i webblagret och speglar `templates/shared/portal-team.md`
  för hand — ändras den ena måste den andra följa med.
  **Arbetsledarläge** (`workstyle: "coach"`): kunden som redan betalar för egen
  AI får arbetspaket i stället för färdigt innehåll — brief, en självbärande
  prompt i kodblock, "Klart när"-checklista och erbjudande om granskning.
  Finns bara i webblagret, inte i `/build-team`.
- **Galleri** (`site/`) — `index.html` + scroll-stories (fem i dagsläget;
  täcker inte alla `examples/` — team-builder-exemplen lerverk/
  norrskenspodden/wikander saknar sidor än) som visar hela processen, plus
  `site/en-vecka.html` ("En vecka med teamet") som är ett vardagscase snarare
  än en processberättelse. Säljmaterial. Statiskt, ingen nyckel.
- **Portal** (`portal/`) — där kunden använder sitt team: arbetsyta med
  agentkort ("det här kan jag hjälpa dig med" + klickbara startförslag,
  `starters` i teamkonfigen), markdown-renderade svar, persistent
  chatthistorik per team (localStorage, "Rensa samtal"/"Töm allt"),
  stoppknapp för strömning. **Arbetsytan** (det som skiljer portalen från en
  vanlig AI-chatt): *Veckostart* (ett klick → ingångsagenten föreslår veckans
  fokus), *Veckans rutiner* (`routines` i teamkonfigen — stående uppgifter med
  dagmarkering, öppnar rätt agent förifylld), *Håll ett möte* (oberoende
  perspektiv från valda agenter → ingångsagenten sammanställer till
  mötesanteckning; tre mötestyper speglar `templates/shared/meetings/`),
  *Minne & underlag* (delat företagsminne + inklistrade dokument med på/av
  per underlag, injiceras i alla agenters systemprompt — projekt-metaforen à
  la ChatGPT Projects), *Första projektet* (`firstProject` i konfigen,
  konsult-läget) samt kopiera/ladda ner-knappar per svar. **Mapp på datorn**
  (M1.5, Chrome/Edge): kunden kopplar en lokal mapp via File System Access —
  `.md`/`.txt` blir underlag, `minne.md` är företagsminnet, svar sparas till
  `från-teamet/`; handtag i IndexedDB, localStorage förblir fallback. Mapp i
  OneDrive/Dropbox ger kunden synk/delning via egen infra, och `teamstatus.json`
  i mappen gör status delad mellan kollegor. **Ackumulering över tid** (etapp
  1–4, juli 2026): kom igång-checklista, puls-kort,
  vecko-streak, "Veckan som gick", auto-körda rutiner, minnesförslag med
  godkännande, sök i historik + arkiv till mappen, "Utveckla teamet" (växtväg
  via tidigare avvisade agenter), Dela & exportera team, kvartalsöverblick,
  filimport (PDF/Word/xlsx/csv via `portal/vendor/`), svenska myndighetsdatum
  (`portal/deadlines-se.js`), diktering och seasons-årshjul. Multi-tenant via
  `?team=<slug>` → `portal/teams/<slug>.js`; utan parameter visas en
  kundväljare; `?team=__draft` öppnar ett Builder-utkast, `?team=__vertical` en
  branschdemo (egen localStorage-nyckel — kan inte skriva över utkast),
  `?team=__link` ett team som delats via länk (`#cfg=` i fragmentet, når aldrig
  servern) eller teamfil. Installerbar **PWA** (`manifest.webmanifest`, `sw.js`).
- **Branscher** (`verticals/`) — datadrivna branschlandningssidor
  (`?v=<slug>` från `verticals.js`); varje bransch har en live-demo utan nyckel.

**Vår nyckel, inga kundnycklar (2026-08-06):** kunden har aldrig en egen
API-nyckel. Allt går genom `POST /api/ai` (`functions/api/ai.js`) på vår
OpenRouter-nyckel (`OPENROUTER_KEY` som Pages-secret). **Fem tak**
skyddar kassan: per IP och kvart (24 bygge / 90 portal), per IP
och dygn för bygget (200), per **team** och månad (1 000 = villkorens fair use)
och ett globalt dygnstak (4 000). Förbrukningen bokförs i `ai_budget` och
`ai_usage` (`migrations/0004_ai_proxy.sql`) — antal och tokens, aldrig innehåll.
**Det femte taket** (2026-08-16) är byggets egen andel av dygnet: 2 500 av de
4 000, bokförd på raden `build:global` i `ai_usage`. Utan den delade gratis,
anonym byggtrafik hink med betalande kunder, och en dag med ovanligt många
byggen kunde stänga portalen för dem som betalat — nu finns alltid minst 1 500
svar kvar åt portalen. Taken har tester i `test/ai.mjs` (17 st); rutten hade
noll fram till 2026-08-16, trots att den är den enda filen där en manipulerad
klient kan kosta oss pengar.
Nyckelvägen är borta: `renderKeySetup()` finns inte längre i portalen, och
`atb-claude.js` har bara `/api/ai`.

**Hela listan över vad som måste vara satt i drift** (åtta Pages-secrets plus en
bindning). Den fanns tidigare bara utspridd i källkoden, vilket gjorde en
återuppsättning till en läsövning i `functions/`:

| Namn | Läses av | Uteblir den |
|---|---|---|
| `DB` (bindning, `wrangler.toml`) | allt under `/api/` | inget svarar |
| `OPENROUTER_KEY` | `api/ai.js` | tydligt 503 till kunden |
| `STRIPE_SECRET_KEY` | `api/_stripe.js` | kastar explicit |
| `STRIPE_WEBHOOK_SECRET` | `api/stripe-webhook.js` | webhooken avvisar allt |
| `STRIPE_PRICE_TRIAL` | `TIERS` i `_stripe.js` | provmånaden går inte att köpa |
| `STRIPE_PRICE_STANDARD` | `TIERS` i `_stripe.js` | standard går inte att köpa |
| `MAIL_PROVIDER` | `api/auth/_lib.js` | ingen inloggningskod skickas |
| `MAIL_API_KEY` | `api/auth/_lib.js` | kastar explicit |
| `MAIL_FROM` | `api/auth/_lib.js` | kastar explicit |
| `DIGEST_SECRET` | `api/digest/run.js` + cron-workern | veckobrevet skickas inte (rutten svarar 503) |

Prisnycklarna läses **dynamiskt** via `TIERS[...].env`, så de syns inte om man
greppar efter `env.STRIPE_PRICE`. Inget av värdena havererar tyst — men listan
finns inte någon annanstans, så den här tabellen är återställningsplanen.
Lägg inte en `.dev.vars.example` i roten: `.gitignore` täcker `.dev.vars.*`, så
filen hade blivit osynlig för git.

**Ett svarsformat, ingen förgrening (lagat 2026-08-16).** `/api/ai` skickar
uppströmsbytena vidare orörda (`functions/api/ai.js:599`) och uppströms är
OpenRouter — alltså är OpenAI-SSE (`choices[0].delta.content`) det enda format
klienten kan möta, och proxyns egna felramar (`{error:{message}}`) läses av
samma gren. Lägg inte tillbaka en förgrening här utan att först ge den något
att förgrena på: städningen 6 augusti (`916166e`) tog bort variabeln
`openrouter` men lämnade raden som läste den, och i tio dagar kastade **varje
strömmat svar** ett `ReferenceError` innan första tecknet nådde skärmen — i
både builder och portal. Ingen märkte det, för inget test rör klienten och
ingen felövervakning finns (`ROADMAP.md`, D3).

**Betalväggen (2026-08-06):** rutten har två trafikslag och skillnaden mellan
dem är hela affären. *Bygget* är gratis, obegränsat och anonymt — säljargumentet.
*Portalen* kräver inloggning och en rad i `team_access`, annars 402
`purchase_required`. Skillnaden avgörs i D1 mot `teams.plan`, aldrig av en flagga
klienten sätter: en klient som utelämnar slugen får byggets villkor, inte gratis
portalsvar. Slugen bärs som modultillstånd i `atb-claude.js` (`setTeam()`), inte
av sju anropsställen i portalen.

**Noll provsvar (beslut 2026-08-06).** Inte fem, som en tidigare spec sa. Att
chatta med sitt eget team är det som säljs — vore det gratis vore köpet valfritt.
Den som vill se portalen först tittar på ett demoteam. Därför finns heller ingen
"prova teamet live"-knapp: villkoret sägs i stället *före* köpet, i Builderns
avslut och i portalens låsta vy.

**Ingen kostnadsvisning för kunden (2026-08-06).** Kronbeloppet under varje svar
är borttaget, liksom hela prisberäkningen och modellkatalogen i klienten. Det var
en BYO-funktion: när kunden betalade sin egen förbrukning hade hon rätt att se
den. Med AI:n inkluderad i ett fast pris är samma siffra brus, och den inbjuder
till frågan "varför debiteras jag?". Förbrukningen bokförs serversidan i
`ai_usage`/`ai_budget` — det är vår sida av affären, inte kundens.

**Planen har en livscykel (2026-08-07):** reglerna för vad `teams.plan` betyder
bor i `functions/api/_plan.js` — en ren funktion `planState(rad, nu)` som både
`/api/ai` och `/api/teams/:slug` frågar, så att de inte kan komma till olika
slutsatser om samma rad. **Provmånaden är 30 dagar räknade ur
`teams.created_at`**, kontrollerad lat (ingen cron): första gången någon knackar
på efter utgången skrivs `expired` till raden. Samma tal, 30, står i portalens
`TRIAL_LENGTH_DAYS` — ett test fäller bygget om de glider isär, för det är
kortet i arbetsytan som annars säger "fem dagar kvar" samma dag som spärren
slår till. `stripe-webhook.js` är numera en dispatcher:
`customer.subscription.deleted` → `cancelled`, `invoice.payment_failed` (bara
när Stripe gett upp, dvs `next_payment_attempt` är null) → `past_due`,
`invoice.paid` → öppnar igen om raden var spärrad, `charge.refunded` → `refunded`
på engångsplaner. **De fyra händelserna måste vara påslagna i Stripes
dashboard** — annars körs koden aldrig och allt ser ut att fungera som förut.

**Att stänga en dörr kräver att en annan öppnas.** `POST /api/checkout` tar
numera `{ tier, slug }` och uppgraderar ett team kunden redan äger: samma slug,
samma konfiguration, ny plan. Utan den vägen vore provmånadens slut en
återvändsgränd — enda sättet att fortsätta hade varit att bygga om teamet från
början, och den kunden köper inte 290-nivån. `POST /api/subscription/cancel`
gör motsvarande åt andra hållet (`cancel_at_period_end` hos Stripe), så att
"uppsägningsbart när som helst" i prislistan är sant och inte betyder "när vi
läser mejlen".

**Prisstegen är tre nivåer (2026-08-06):** 0 kr bygga · 90 kr provmånad ·
290 kr/mån standard · offert för flera användare. Engångsköpet på 4 990 och
nivåerna 190/490 är strukna — ingen molnstruktur för underhåll finns, och
"ert för alltid" vore ett löfte utan drift bakom sig. **Prislistan i
`index.html`, avsnitt 4 i `villkor.html` och `TIERS` i
`functions/api/_stripe.js` måste alltid ändras samma dag** (ett test i
`test/stripe.mjs` fäller bygget om nivålistan växer).

**En modell, inga alternativ (bytt 2026-08-06):** hela produkten kör
`openai/gpt-oss-120b` via OpenRouter. Valet bor i `atb-claude.js` och i
`functions/api/ai.js`, och `stream()` ignorerar vilken modell anropet än
skickar med.

Bytet från `deepseek/deepseek-v4-flash` gjordes efter mätning över hela
pipelinen med samma underlag: **9,1 s mot 241 s och 0,025 kr mot 0,076 kr per
bygge.** DeepSeek klarade dessutom inte att producera ett stort nästlat
JSON-dokument — sammanställningssteget föll 0 av 4 gånger, och varken högre
tokentak, `response_format`, `require_parameters` eller avstängt resonemang
hjälpte. Felen varierade mellan körningar, så inläsningen gick inte att laga.

**Sammanställningssteget använder ett riktigt JSON-schema i strict-läge**
(`TEAM_SCHEMA` i `builder/builder.js`), inte bara `json_object`. Skillnaden
är avgörande: `json_object` garanterar syntax, inte innehåll — utan schema
utelämnade modellen `starters` och `routines`, alltså portalens agentkort och
veckorutiner. Med `required` och `minItems` kan den inte göra det.

**Baksidan av strict: fält som saknas i schemat kan inte genereras alls** —
`additionalProperties: false` gör dem inte valfria utan förbjudna. Det slog till
en gång (lagat 2026-08-16): prompten beställde `firstProject`, `seasons` och
`agents[].triggers` utan att de fanns i `TEAM_SCHEMA`, så de kom aldrig
tillbaka — konsult-lägets 🎯-panel kunde inte produceras trots att
first-project-steget kördes och betalades, och `seasons` saknades i alla
genererade teamfiler, vilket lämnade portalens årshjul permanent tomt. Omvänt
krävde schemat ett toppnivå-`why` som ingen prompt definierade, så modellen
tvingades hitta på det.

**Prompten och `TEAM_SCHEMA` är ETT kontrakt i två filer** (`builder.js`,
schemablocket i `structureTeam()` respektive konstanten längre ner). Ändras det
ena måste det andra följa med, i **båda** riktningarna: ett fält som beställs men
inte står i schemat kommer aldrig tillbaka, och ett fält som krävs i schemat men
inte beställs blir påhittat. Lägg inte till något i schemat utan en läsare i
koden — det var så `language` och `defaultModel` blev dödfält. Samma fällatyp som
`starters`-fyndet; den har nu slagit till två gånger.

Ändras modellraden måste kostnadssiffrorna i `index.html` (`#forbrukning`)
och avsnitt 3–4 i `villkor.html` följa med. Nuvarande nivå: $0,037/$0,170 per
miljon tokens, vilket ger cirka 0,25 öre per svar och under 50 öre i månaden
för en normalanvändande kund.

**Konton (M3, 2026-08-05):** portalen har två dörrar. Exempelteamen nås som förut
med `?team=` i adressen; den nakna adressen frågar kontot först. Inloggning sker
med engångskod till mejlen — inga lösenord, alltså inget att läcka och inget
återställningsflöde. Fem tabeller i `migrations/0002_auth.sql`, fyra rutter under
`functions/api/auth/`, och `scripts/provision.mjs` som lägger upp en kund för
hand. Köpflödet finns sedan 2026-08-06 (`functions/api/checkout.js`,
`checkout/status.js`, `stripe-webhook.js`, `migrations/0003_commerce.sql`).
Capability-läsningen är stängd: `/api/teams/:slug` kräver inloggning och slår upp
åtkomsten i `team_access`, så en borttagen rad stänger dörren i samma sekund.
Platsrutterna (`functions/api/team/{invite,members,remove}.js`) fick ett
gränssnitt 2026-08-18: portalens sidfotsknapp **Kollegor / dela team** listar
platserna, bjuder in på adress och tar bort. Ett test i `test/teams.mjs` läser
katalogen `functions/api/team/` och fäller bygget om en rutt där saknar
anropare i `portal/app.js` — rutterna stod oanropade i månader medan
delningslänken, som ligger närmast till hands, gav mottagaren en låst vy.

**Ångerrätten är en knapp sedan 2026-08-18** (`functions/api/subscription/
withdraw.js`). Skillnaden mot uppsägningen är hela poängen: uppsägning gäller
framåt och kunden behåller teamet perioden ut; ångerrätten gör köpet ogjort —
abonnemanget avslutas direkt hos Stripe (`DELETE /subscriptions/:id`, därför
femte parametern `method` i `stripeCall`), `teams.plan` blir `refunded`, och
kvitto mejlas till både kunden och `info@`. **Ingen kod flyttar pengar** —
återbetalningen görs för hand inom fristen. Fristen är 14 dagar räknade från
det *senaste* köpet (`purchasedAt()` tar `max(created_at, plan_changed_at)`, så
en uppgradering från provmånad startar en ny frist), och samma tal står i
portalens `WITHDRAWAL_DAYS` och i `villkor.html` §15 — tre tester i
`test/plan.mjs` fäller bygget om de glider isär.

**Portalens layout:** tre spalter på desktop — laget till vänster, chatten i
mitten, arbetsytan och sidfoten till höger.

**Cachningen sköter sig själv sedan 2026-08-16 — och `_headers` gör det inte.**
Uppmätt i produktion: Cloudflare Pages **äger `Cache-Control` på statiska
tillgångar** och skriver över den, så hela `no-cache`-listan som stod i
`_headers` hade aldrig gjort någonting. Övriga headers därifrån (CSP, HSTS,
X-Frame-Options) fungerar — det var därför felet överlevde så länge. Färskheten
ligger nu i `build-dist.mjs`, som sätter `?v=<innehållshash>` på varje
js/css-referens i HTML **och** i `portal/sw.js`s SHELL, med samma URL:er på båda
ställena. `CACHE` får en hash av hela SHELL vid bygget, så **bumpen är inte
längre ett minneskrav** — talet i källfilen är kvar som läsbar generation och
gäller vid lokal körning. Bygget avbryter om SHELL- eller CACHE-raden skrivs om
i en form mönstret inte känner igen. Sätt inte tillbaka `Cache-Control` i
`_headers`; det ser ut att fungera och gör det inte.

Säkerhetsheaders/CSP sätts via `_headers` (kopieras till `dist/` vid bygge).

**Kör lokalt:** `python -m http.server 8420` från repo-roten (eller `npm run dev`),
öppna `http://localhost:8420/`. Builder och portal kräver http:// (inte file://),
och Buildern kräver att `prompts/` serveras. För att testa backend-lagret
(`/api/*` + D1) lokalt: `npm run db:migrate:local` och sedan `npm run dev:cf`
(Cloudflares emulator — den vanliga python-servern serverar inte `/api`).
Bygg/deploy: `npm run build` / `npm run deploy`. **`npm run deploy` kör
testsviten först** (sedan 2026-08-17) — CI triggar på push, deploy kräver ingen
push, och utan den raden var de två skyddsnäten helt frånkopplade från det enda
stället som betyder något.

**Veckobrev (byggt 2026-08-17):** teamets veckostart som mejl på den dag kunden
väljer. Skälet är retention: portalen förutsätter att kunden kommer ihåg att
logga in, och vecka tre gör hon inte det. Ett brev dyker upp oavsett — och
enligt halvårssimuleringen bevisas värdet hos utföraren medan beslutet fattas av
köparen, så ett mejl syns för båda.

**Opt-in, alltid.** Ingen rad i `weekly_digest` (`migrations/0007`) betyder inget
utskick. Kunden slår på det i portalen (`✉️ Veckobrev` i arbetsytan →
`/api/digest/prefs`), och varje brev bär en avslagslänk som fungerar **utan
inloggning** — att kräva inloggning för att slippa ett mejl är att inte låta
kunden slippa det.

Delarna, och varför de ligger där de ligger:

- **`functions/api/digest/run.js`** gör allt arbete: väljer mottagare, kollar
  planen (ett veckobrev till en spärrad kund är att sälja på fel sätt), kollar
  taken, genererar, mejlar, och märker dygnet som avklarat först när brevet
  gått. `last_sent_day` gör körningen idempotent — samma grepp som
  `stripe_session` ger i `teams`.
- **`worker-veckobrev/`** är bara en klocka. Pages Functions kan inte
  schemaläggas; Cron Triggers finns bara på Workers. Workern har **ingen
  D1-bindning** med flit: den enda rättighet den har är att knacka på rutten med
  `DIGEST_SECRET`. Den kör **varje timme**, och rutten har ett **timgolv på 06
  UTC** — så en misslyckad körning tas igen nästa timme i stället för nästa
  vecka, utan att någon väcks klockan ett på natten.
- **`functions/avregistrera.js`** ligger **inte** under `/api/`, och det är
  ingen slarv: `_middleware.js` byter ett HTML-svar under `/api/` mot 404
  (riktigt för ett JSON-API). Upptäckt i emulatorn — rutten uppdaterade raden
  medan svaret ersattes med 404. `mittaiteam.se/avregistrera` läser dessutom
  bättre i ett mejl.

Kostnaden bokförs som allt annat: `ai_budget`, teamets månadsrad (samma fair use
som chatten) och en egen dygnsrad `digest:global` med eget tak på 200 — samma
resonemang som byggets tak i K3, så att breven inte kan svälta betalande kunders
chatt.

**Ännu inte gjort:** `integritet.html` säger inget om veckobrevet. Adressen
lagras redan för inloggningen, men "vi skickar ett återkommande mejl om du ber
om det" är en egen behandling och bör stå där. Det är din text, inte min.

**Felövervakning (D3, byggd 2026-08-17):** `GET /api/health` svarar **200 när
tjänsten kan svara kunder och 503 när den inte kan**. Den kontrollerar tre
saker — att `OPENROUTER_KEY` finns, att D1 svarar, och om det kommit ett
kreditfel (402 från OpenRouter) den senaste tjugo minuterna. Den gör **inget
AI-anrop**: en vakt som pollar var femte minut hade kostat pengar dygnet runt.
Svaret innehåller bara booleaner — rutten är öppen, eftersom en hälsokontroll
bakom inloggning är en hälsokontroll ingen vakt kan använda, och antal anrop per
dygn är affärsinformation.

Underlaget kommer från nya tabellen `ai_errors` (`migrations/0006_ai_errors.sql`):
dygn, felkod, antal och när det senast hände. Inget innehåll, ingen fråga, inget
kund-ID — samma linje som `ai_usage`. `/api/ai` skriver dit vid uppströmsfel,
nätfel och tömd kredit. Utan den skrivningen hade hälsokontrollen bara
kontrollerat att nyckeln finns.

**Migrationen är körd skarpt 2026-08-17** och verifierad: `ai_errors` finns med
sitt index, och `/api/health` svarar `{"ok":true,"checks":{"ai_nyckel":true,
"databas":true,"ai_kredit":true}}` — `ai_kredit` gick från `null` (tabellen
saknades) till `true`. En säkerhetskopia togs före migrationen med
`npm run db:backup` (20,5 kB).

**Ett steg återstår, och det är ditt:** peka en gratis uptime-vakt
(UptimeRobot, Cloudflare Health Check, Better Stack) mot
`https://mittaiteam.se/api/health` med larm till mejlen. Rutten svarar redan
rätt — men tills någon lyssnar finns spåret utan att någon tittar, vilket var
exakt läget när B1 låg stum i tio dagar.

**Backup av D1:** `npm run db:backup` (lägg till `-- --local` för emulatorns
kopia) exporterar databasen till `backup/`, som är git-ignorerad. Skriptet
avbryter om exporten saknar `users`, `teams` eller `team_access` — en export som
"lyckades" men är tom är värre än ingen, för den ser ut som ett skyddsnät. D1 är
den **enda** datakällan i systemet som inte går att återskapa: koden,
prompterna och besluten ligger i git, men konton, betald åtkomst och planstatus
finns bara där. **Kopiorna ligger på samma disk som repot** — de skyddar mot en
trasig migration, inte mot en trasig disk. Flytta dem någon annanstans.

**Rulla tillbaka kod och schema tillsammans.** Pages har rollback i sin
dashboard, men migrationerna (`migrations/0001`–`0005`) är enkelriktade: det
finns inga down-skript, och `ALTER TABLE ADD COLUMN` i 0003 och 0005 är inte
idempotenta om de körs om för hand. Att rulla tillbaka *bara* koden går bra så
länge migrationerna bara lägger till kolumner — extra kolumner ignoreras. Den
dag en migration *tar bort* något koden fortfarande läser blir en ren
kodrollback en tyst krasch i drift. Rör aldrig det ena utan att veta var det
andra står.

**Stage 2-krok:** `prompts/shared/generate.md` (steg 7–8) genererar — när man
kör inifrån detta repo — även en portal-konfig (`templates/shared/portal-team.md`)
och en galleri-sida (`templates/shared/showcase-page.md`) per körning, så varje
ny kund dyker upp i både galleri och portal automatiskt.

## Repo-struktur

```
.
├── CLAUDE.md                       # Den här filen (paraply)
├── README.md                       # Kort intro för nya användare
├── ROADMAP.md                      # Arbetslistan med ID:n (från genomgångarna)
├── skills-catalog.md               # Kurerad lista över kända Claude Skills
├── .github/workflows/test.yml      # CI: kör testsviten och bygget vid push/PR
│
├── index.html                      # Säljsida + nav till apparna
├── villkor.html                    # Allmänna villkor (prislista i avsnitt 4)
├── integritet.html                 # Integritetspolicy
├── og.png / sitemap.xml / robots.txt
├── fonts/                          # Självhostade woff2 + fonts.css
├── avatars.js                      # Delad avatar-tilldelning (alla ytor)
├── atb-claude.js                   # Delad AI-klient (builder + portal)
├── builder/                        # Builder-UI: bygg ett team live (+ demo-data.js,
│                                   #   survey-data.js = förvalsenkäten)
├── site/                           # Galleri + DESIGNSYSTEMET (showcase.css, laddas av
│                                   #   alla ytor utom portalen) + en-vecka.html + gallery.js
├── portal/                         # Kundportal: chatta med ett team (+ PWA: manifest/sw)
│   ├── aktivera.html               # Kvittosida efter Stripe-betalningen
│   ├── avatars/                    # 25 agentporträtt (PNG)
│   ├── vendor/                     # pdf.js, mammoth, xlsx (filimport — räknas mot CSP)
│   │                               #   Versioner + CVE-rutin: docs/vendor-versioner.md
│   │                               #   (i docs/ för att inte publiceras med dist/)
│   ├── deadlines-se.js             # Svenska myndighetsdatum till årshjulet
│   └── teams/                      # En <slug>.js per kund + index.js (register)
├── verticals/                      # Branschlandningssidor (datadrivet, ?v=<slug>)
├── design/                         # Elva designskisser; variant 8 blev systemet.
│                                   #   Deployas inte — saknas medvetet i ITEMS
├── functions/                      # Cloudflare Pages Functions (/api/* — moln-team)
│                                   #   OBS: deployas från repo-roten, aldrig via dist/
│                                   #   avregistrera.js ligger UTANFÖR /api/ (HTML-svar)
├── worker-veckobrev/               # Klockan för veckobrevet (egen Worker, cron)
│                                   #   Deployas separat: se index.js
├── migrations/                     # D1-schema (SQL): init, auth, commerce, ai_proxy,
│                                   #   plan_lifecycle, ai_errors, weekly_digest
├── test/                           # node --test: teams, stripe, plan, ai, throttle,
│                                   #   examples, klient, intake, health, skalning,
│                                   #   digest (166 tester)
├── scripts/                        # provision.mjs — lägg upp en kund för hand
│                                   #   check-dist.mjs — kontrollerar versionsstämplingen
├── testoutput/                     # Råa pipeline-körningar (källmaterial, ej deployat)
│
├── build-dist.mjs                  # Bygger dist/ för Cloudflare Pages (dist/ är ignorerad)
├── wrangler.toml                   # Cloudflare-config (D1-bindning)
├── package.json                    # npm-scripts (build/serve/dev/dev:cf/db:migrate/deploy/test)
├── _headers                        # CSP + säkerhetsheaders (kopieras till dist/)
│
├── docs/                           # Djupare dokumentation per område
│   ├── team-builder.md             # Team-builder-lägets flöde och regler
│   ├── ai-consultant.md            # Ai-consultant-lägets flöde och regler
│   ├── scaling.md                  # Skalningsregler (storlek + mognad)
│   ├── team-roles.md               # VD, VD-assistent, specialisters roller
│   ├── meetings.md                 # Mötesfunktionen i detalj
│   ├── first-project.md            # Kriterier för ett bra första kundprojekt
│   ├── produktstrategi-sjalvbetjaning.md  # Affärsstrategi. OBS: bygger på BYO,
│   │                               #   som är skrotat 2026-08-06
│   ├── m2-backend-spec.md          # Spec för köp/leverans-lagret. Överspelad på
│   │                               #   leveransväg, /api/chat och prissteg
│   ├── pub-avtal-mall.md           # Avtalsmall. Underbiträdesavsnittet är fel
│   ├── kunder.md                   # Logg, inte grind (se Nuvarande sprint)
│   │
│   │                               # ── DE TVÅ LEVANDE ────────────────────────
│   ├── roadmap.md                  # LEVANDE: arbetet i prioriterad ordning
│   ├── lansering.md                # LEVANDE: hålen mellan löfte och leverans
│   │
│   │                               # Daterade ögonblicksbilder. Läget de beskriver
│   │                               # är alltid färskare i de två levande ovan:
│   ├── granskning-helhet-2026-08-05.md    # Sexagentsgranskning: kod, säkerhet,
│   │                               #   visuellt, kärna, affär, dokumentation
│   ├── granskning-kundresa-2026-07-16.md  # 30 punkter längs kundresan
│   ├── omvarldsresearch-2026-07-17.md     # Konkurrenter och marknad
│   ├── omvarldsresearch-2026-08-18.md     # Uppföljning: funktionsglappet mot
│   │                               #   konkurrenterna (OM1–OM5 i ROADMAP.md)
│   ├── roadmap-anvandarvarde-2026-07-17.md # UX/retention, etapp 0–4 (byggd)
│   ├── simulering-forlag-slutsatser-2026-07-18.md # Halvårssimulering, förlagskund
│   ├── rollspel-foretag-2026-08-06.md     # Rollspelad kundresa, redovisningsbyrå
│   ├── rollspel-privatperson-2026-08-06.md # Rollspelad kundresa, livscoach
│   └── idekatalog-anstalld-smaforetagare-2026-07-18.md # Idébank (topp 5 byggd)
│
├── .claude/
│   └── commands/
│       ├── build-team.md           # /build-team [företagsnamn?]
│       ├── update-team.md          # /update-team (båda lägena)
│       ├── consult.md              # /consult — startar ai-consultant-läget
│       └── handoff.md              # /handoff — avslutar ett konsultuppdrag
│
├── prompts/
│   ├── shared/                     # Prompts som används av båda lägena
│   │   ├── research.md             # Nyckelsteget — lägg tid här
│   │   ├── scale.md                # Välj antal agenter
│   │   ├── proposal.md             # Format för agent-förslag
│   │   └── generate.md             # Skriv ut agent-filer
│   │
│   ├── team-builder/
│   │   ├── intake-interview.md     # Kort intake för tekniska användare
│   │   ├── intake-external.md      # Läge B: externt företag via namn
│   │   └── intake-update.md        # Läge C: diff mot befintligt team
│   │
│   └── ai-consultant/
│       ├── maturity-intake.md      # Fråga om AI-mognad och kontext
│       ├── first-project.md        # Identifiera första-projekt-kandidat
│       ├── pedagogy.md             # Regler för den pedagogiska tonen
│       └── handoff.md              # Överlämningsläget vid uppdragets slut
│
├── templates/
│   ├── shared/
│   │   ├── agent-base.md           # Grundskelett som båda lägena bygger på
│   │   ├── team-presentation.md    # Fristående HTML-presentation per team
│   │   ├── portal-team.md          # Genererar portal-konfig (Stage 2-krok)
│   │   ├── showcase-page.md        # Genererar galleri-sida (Stage 2-krok)
│   │   └── meetings/
│   │       ├── project-review.md
│   │       ├── specific-improvement.md
│   │       └── whats-next.md
│   │
│   ├── team-builder/
│   │   ├── ceo-small.md            # Operativ VD för små team
│   │   ├── ceo-large.md            # Strategisk VD för stora team
│   │   └── chief-of-staff.md
│   │
│   └── ai-consultant/
│       ├── agent-pedagogical.md    # Agent-mall med pedagogiska sektioner
│       ├── ceo-beginner.md         # VD-mall för AI-nybörjarkunder
│       ├── chief-of-staff.md       # Kundanpassad VD-assistent
│       ├── first-project-brief.md  # Mall för första-projekt-dokumentet
│       └── handoff-document.md     # Mall för överlämningsdokumentet
│
└── examples/
    ├── team-builder/               # Tre solo-körningar — bevisar att samma
    │   ├── lerverk/                # storleksklass ger olika team:
    │   ├── norrskenspodden/        # keramik / podd / översättning,
    │   └── wikander/               # alla solo, helt olika specialister
    │
    └── ai-consultant/
        ├── beginner-accountant/    # Liten bokföringsbyrå, AI-nybörjare
        ├── intermediate-agency/    # Marknadsbyrå som provat ChatGPT
        └── advanced-studio/        # Designstudio som börjat bygga
```

## Nuvarande sprint

> **LÄGET (2026-08-06) — två levande dokument, läs dem i den här ordningen:**
> **`docs/roadmap.md`** (arbetet, prioriterat) och **`docs/lansering.md`** (hålen
> mellan löfte och leverans). Övriga daterade filer i `docs/` är ögonblicksbilder
> från när de skrevs och ska inte läsas som plan — inklusive
> `granskning-helhet-2026-08-05.md`, som var lägesdokument fram till nu.
>
> Kärnan (fas 1–3 nedan) är klar och bevisat divergerande — se `examples/`.
> Kassan, kontona, AI-proxyn och förbrukningsmätningen finns sedan 2026-08-06
> och är verifierade skarpt. Testsviten är 120 tester. Det som saknas är en
> betalande kund — och en fungerande väg fram till första svaret.
>
> **Sammanfattning av sjuagentsgranskningen 2026-08-06:** kedjan gick sönder
> mellan betalning och första svar — omläggningen till "vår nyckel" hade aldrig
> genomförts i portalen, och den gamla nyckelvägen var en genväg förbi
> betalväggen. **Det är åtgärdat samma kväll** (pass 1 i `docs/roadmap.md`,
> verifierat i webbläsare). Kvar som tyngsta fynd: **provmånaden kan aldrig ta
> slut**, eftersom ingen kod skriver `expired`/`cancelled` till `teams.plan` och
> webhooken bara lyssnar på `checkout.session.completed`. Allt med filrader i
> `docs/roadmap.md`.
>
> **Struket 2026-08-06:** grindregeln som stod här (ingen funktionskod i
> `portal/`, `builder/` eller `verticals/` förrän `docs/kunder.md` hade en rad
> från ett riktigt kundsamtal) gäller inte längre, och inte heller säljmålen den
> hängde ihop med. Föreslå inte kundsamtal, kundlistor eller säljfickor som
> "nästa steg" — vad som byggs härnäst avgörs pass för pass av Mikael.
> `docs/kunder.md` finns kvar som logg, inte som grind.
>
> Skriv ingen ny daterad granskningsfil i `docs/`. Fem på fyra månader räcker;
> nästa bedömning görs av en kund som betalar eller låter bli. Uppdatera de två
> levande dokumenten i stället.
>
> Sista raden varje arbetspass: skriv nästa pass enda uppgift, en mening, här
> nedanför. Projektet arbetar i skurar (35 commits på sex dagar), så scopet
> måste laddas i förväg — annars väljs det som är roligast under första timmen.
>
> De tre besluten är tagna 2026-08-05: **enskild firma Glänne & Söner**, **B2B
> och privatpersoner**, **momsregistrerat**. Prisstegen är **0 / 90 / 290 /
> offert** (se avsnittet "Prisstegen är tre nivåer" ovan — den gäller; en äldre
> femstegslista stod här tidigare och var fel). Prislistan i `index.html`,
> avsnitt 4 i `villkor.html` och `TIERS` i `functions/api/_stripe.js` ändras
> alltid samma dag.
>
> **Två beslut kvar** (utskrivna i `docs/roadmap.md`): om capability-läsningen
> ska dö helt, och var "Utveckla teamet" ska spara. De två första är fattade
> 2026-08-06: **noll provsvar** och **ingen live-provning av eget team**.
>
> **Pass 2 är gjort och driftsatt 2026-08-07** — planen har en livscykel (se
> avsnittet ovan). Migration 0005 körd skarpt, koden deployad (commit `a50ecf3`),
> webhook-endpointen uppgraderad till fem händelsetyper.
>
> **Fynd på vägen, nu hål 0 i `docs/lansering.md`: hela Stripe-uppsättningen kör
> i TESTLÄGE.** `/api/checkout` mot mittaiteam.se returnerar `cs_test_…`, och
> produktionen accepterar testlägets webhook-hemlighet — alltså är Pages-secrets
> testnycklar. Kassan fungerar men tar inga pengar; ett riktigt kort avvisas.
> "Verifierat skarpt 2026-08-06" betydde verifierat mot den riktiga deployen i
> testläge, vilket är en teknisk verifiering men inte en kommersiell. Bara Mikael
> kan stänga det: aktivera Stripe-kontot, skapa priserna i live-läge, byta fyra
> Pages-secrets och ge live-endpointen samma fem händelsetyper.
>
> **Pass 3.3 och 3.1 är gjorda 2026-08-16** — teckentaket som gick att kringgå
> (K1) och byggets eget dygnstak (K3). Kassan är alltså inte längre den
> oskyddade flanken. Arbetslistan med ID:n bor i `ROADMAP.md` i roten;
> vad som tas härnäst avgörs pass för pass av Mikael.
>
> **Det går parallellt med Mikaels enda uppgift**, som ingen kod kan göra åt
> honom: aktivera Stripe-kontot och byta till live-nycklar (hål 0 i
> `docs/lansering.md`). Börja inte ett pass med att föreslå det — det är
> noterat, det är hans, och det står inte i vägen för något som byggs härnäst.
>
> **Passet 2026-08-18 är driftsatt** (Pages `85463c90`, taggen
> `deploy-2026-08-18`). Tre punkter avbetade — **P5** platser för kollegor,
> **BL2** ångerknappen, **KR2** startsidans bevis — plus omvärldsresearchen
> (**BL3**, ny fil i `docs/`, drag som **OM1–OM5**). Testsviten är **175
> gröna**. Inga nya migrationer, inga nya secrets. Ny rutt:
> `functions/api/subscription/withdraw.js`. Verifieringen i drift står i
> `ROADMAP.md` under *Driftsatt 2026-08-18*.
>
> **Nästa pass enda uppgift:** ta **K4** — bygg-rutten är en oautentiserad
> LLM-proxy och en väg tillbaka för uppsagda (`functions/api/ai.js:252-293`,
> ~4–6 h) — om inte Mikael först fattar Cowork-beslutet, som avgör BF2, BF3 och
> OM1 på en gång.
>
> Fas 1–3 nedan står kvar som historik över hur kärnan byggdes.

Bygg i den här ordningen. Hoppa inte över steg.

### Fas 1: Delad kärna (team-builder är facit)

1. **`prompts/shared/research.md`** — nyckelsteget. Om research inte hittar
   konkreta arbetsmoment faller allt annat. Skriv först och testa isolerat.
2. **`prompts/team-builder/intake-interview.md`** — matar research.
3. **`prompts/shared/proposal.md`** + **`templates/shared/agent-base.md`** —
   så att output kan skrivas.
4. **`.claude/commands/build-team.md`** — ihop end-to-end. (Planen nämnde
   även en `PROMPT.md`; den behövdes aldrig och finns inte.)
5. **Testa mot coachonline, ikea, ett tredje.** Om output inte är
   meningsfullt olika → tillbaka till steg 1.

### Fas 2: Resten av team-builder

6. Läge B (externt företag) via `prompts/team-builder/intake-external.md`
7. Mötesmallar i `templates/shared/meetings/`
8. Läge C (uppdatering) via `prompts/team-builder/intake-update.md`

### Fas 3: Ai-consultant-läget

9. **`prompts/ai-consultant/maturity-intake.md`** — fråga om AI-mognad
10. **`prompts/ai-consultant/first-project.md`** — nyckelsteget för konsult.
    Lika viktigt som research-steget var för team-builder. Lägg tid här.
11. **`prompts/ai-consultant/pedagogy.md`** — ton och språkregler
12. **`templates/ai-consultant/agent-pedagogical.md`** — pedagogisk mall
13. **`.claude/commands/consult.md`** — sätt ihop
14. **Testa mot tre fiktiva kunder** i `examples/ai-consultant/`. Samma
    kvalitetstest: meningsfullt olika output, konkreta första projekt som
    uppfyller kriterierna i `docs/first-project.md`.
15. **`templates/ai-consultant/handoff-document.md`** — sist, efter att
    resten fungerar.

Gå inte vidare till fas 2 förrän fas 1 passerar kvalitetstestet. Gå inte
vidare till fas 3 förrän fas 2 gör det.

## Kvalitetschecklista (båda lägena)

**Delat:**

- [ ] Tre företag i samma storleksklass ger tre meningsfullt olika team
- [ ] Solo-team och enterprise-team är uppenbart olika i *struktur*
- [ ] Varje agent kan motiveras med ett konkret fynd
- [ ] Varje föreslagen skill kan motiveras med ett konkret fynd
- [ ] Varje agent har en Leverans med "Klart när"-punkter som går att
      svara ja/nej på
- [ ] Två agenter i samma team delar inte perspektiv
- [ ] VD-agenten i ett solo-projekt har ett operativt jobb
- [ ] VD-assistenten vägrar kalla till möte när en enskild agent räcker
- [ ] Varje möte landar i sitt definierade output-format
- [ ] Minst en föreslagen agent avvisas i en typisk körning
- [ ] `/update-team` föreslår diff utan att skrota befintligt

**Specifikt för ai-consultant:**

- [ ] Verktyget frågar om AI-mognad innan det föreslår något
- [ ] Första projektet uppfyller alla kriterier i `docs/first-project.md`
- [ ] Pedagogiska sektioner är konkret problemorienterade, inte tekniska
- [ ] En kund på AI-nybörjarnivå får färre agenter än skalningstabellen
      föreslår för deras företagsstorlek
- [ ] Överlämningsdokumentet innehåller "när ringer ni tillbaka"

## Öppna frågor

- Ska ai-consultant-läget generera `.docx`/`.pdf` direkt via skills, eller
  bara markdown? → Markdown i v1 med krok för senare.
- Metadata i genererade filer (`generated_at`, `generator_version`)? → Git
  räcker tills det inte gör det.
- Lokal skills-scan utöver katalogen? → Efter v1.
- Återanvändning av mönster över kunduppdrag (utan att lagra kunddata)? →
  Besvarad: det är kärnan i vertikal-spåret (fork C) i
  `docs/produktstrategi-sjalvbetjaning.md` — team-mallar per bransch.
- Ska team-builder och ai-consultant kunna kombineras — dvs ett konsult-
  uppdrag som slutar i ett team-builder-genererat team? → Förmodligen ja
  naturligt, eftersom de delar kärna, men implementera inte som eget flöde.

## Varför det här projektet finns

Tre samtidiga mål som råkar lösas av samma arkitektur:

1. **Eget behov.** Du hoppar mellan projekt och vill ha skräddarsydda team
   per projekt utan att handgöra prompts varje gång.
2. **Lärprojekt.** Du vill bygga intuition för vad multi-agent-arkitektur
   faktiskt tillför och var gränserna går. Verktyget genererar många team
   över tid, vilket ger dig data.
3. **Konsultverktyg.** Du lär ut arbetssättet — att se vilka problem som
   lämpar sig för AI och bygga skarpa små verktyg mot dem — till små och
   medelstora företag. Verktyget är hur du gör det skalbart.

Mål 3 är det som gör projektet långsiktigt viktigt. Mål 1 är hur du testar
det dagligen. Mål 2 är hur du blir bättre på det.
