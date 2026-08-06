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
webbläsaren — i BYO-läget anger kunden sin egen nyckel: Anthropic (`sk-ant-`,
anropar `api.anthropic.com` direkt via `anthropic-dangerous-direct-browser-access`)
eller OpenRouter (`sk-or-`, OpenAI-kompatibelt API mot `openrouter.ai`, modellista
hämtas live från deras publika katalog). Leverantör detekteras på nyckelprefixet i
`atb-claude.js`; modellval sparas separat per leverantör.
Det finns ett valfritt, tunt köp/leverans-lager (Cloudflare Pages Functions + D1,
se `docs/m2-backend-spec.md`) för moln-sparade team — annars ingen backend.
Demolägen (`?demo=1`) låter både portal och builder visas helt utan nyckel.

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
  1–4, juli 2026): kostnad per svar, kom igång-checklista, puls-kort,
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
OpenRouter-nyckel (`OPENROUTER_KEY` som Pages-secret). Tre tak skyddar kassan:
per IP, per konto (1 000 svar/mån = villkorens fair use) och ett globalt
dygnstak. Förbrukningen bokförs i `ai_budget` och `ai_usage`
(`migrations/0004_ai_proxy.sql`) — antal och tokens, aldrig innehåll.
Nyckelvägen finns kvar i `atb-claude.js` men används inte av något
gränssnitt längre.

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

Ändras modellraden måste kostnadssiffrorna i `index.html` (`#forbrukning`)
och avsnitt 3–4 i `villkor.html` följa med. Nuvarande nivå: $0,037/$0,170 per
miljon tokens, vilket ger cirka 0,25 öre per svar och under 50 öre i månaden
för en normalanvändande kund.

**Konton (M3, 2026-08-05):** portalen har två dörrar. Exempelteamen nås som förut
med `?team=` i adressen; den nakna adressen frågar kontot först. Inloggning sker
med engångskod till mejlen — inga lösenord, alltså inget att läcka och inget
återställningsflöde. Fem tabeller i `migrations/0002_auth.sql`, fyra rutter under
`functions/api/auth/`, och `scripts/provision.mjs` som lägger upp en kund för hand
tills köpflödet finns. Capability-URL:en finns kvar men räcker bara för det som
säljs på kundens egen nyckel — utan identitet går förbrukning inte att mäta per
konto, vilket den nyckelfria nivån kräver.

**Portalens layout:** tre spalter på desktop — laget till vänster, chatten i
mitten, arbetsytan och sidfoten till höger. **Ändras `portal/app.js` måste `CACHE`
i `portal/sw.js` bumpas**, annars serverar service workern gammal kod hur mycket
som än deployas. Det gäller varje fil i `SHELL`, inklusive `atb-claude.js`.

Säkerhetsheaders/CSP sätts via `_headers` (kopieras till `dist/` vid bygge).

**Kör lokalt:** `python -m http.server 8420` från repo-roten (eller `npm run dev`),
öppna `http://localhost:8420/`. Builder och portal kräver http:// (inte file://),
och Buildern kräver att `prompts/` serveras. För att testa backend-lagret
(`/api/*` + D1) lokalt: `npm run db:migrate:local` och sedan `npm run dev:cf`
(Cloudflares emulator — den vanliga python-servern serverar inte `/api`).
Bygg/deploy: `npm run build` / `npm run deploy`.

**Stage 2-krok:** `prompts/shared/generate.md` (steg 7–8) genererar — när man
kör inifrån detta repo — även en portal-konfig (`templates/shared/portal-team.md`)
och en galleri-sida (`templates/shared/showcase-page.md`) per körning, så varje
ny kund dyker upp i både galleri och portal automatiskt.

## Repo-struktur

```
.
├── CLAUDE.md                       # Den här filen (paraply)
├── README.md                       # Kort intro för nya användare
├── skills-catalog.md               # Kurerad lista över kända Claude Skills
│
├── index.html                      # Säljsida + nav till apparna
├── avatars.js                      # Delad avatar-tilldelning (alla ytor)
├── atb-claude.js                   # Delad Claude-klient (builder + portal)
├── builder/                        # Builder-UI: bygg ett team live (+ demo-data.js,
│                                   #   survey-data.js = förvalsenkäten)
├── site/                           # Galleri + DESIGNSYSTEMET (showcase.css, laddas av
│                                   #   alla ytor utom portalen) + en-vecka.html + gallery.js
├── portal/                         # Kundportal: chatta med ett team (+ PWA: manifest/sw)
│   ├── avatars/                    # 25 agentporträtt (PNG)
│   ├── vendor/                     # pdf.js, mammoth, xlsx (filimport — räknas mot CSP)
│   ├── deadlines-se.js             # Svenska myndighetsdatum till årshjulet
│   └── teams/                      # En <slug>.js per kund + index.js (register)
├── verticals/                      # Branschlandningssidor (datadrivet, ?v=<slug>)
├── design/                         # Elva designskisser; variant 8 blev systemet.
│                                   #   Deployas inte — saknas medvetet i ITEMS
├── functions/                      # Cloudflare Pages Functions (/api/* — moln-team)
│                                   #   OBS: deployas från repo-roten, aldrig via dist/
├── migrations/                     # D1-schema (SQL) för köp/leverans-lagret
├── testoutput/                     # Råa pipeline-körningar (källmaterial, ej deployat)
│
├── build-dist.mjs                  # Bygger dist/ för Cloudflare Pages
├── wrangler.toml                   # Cloudflare-config (D1-bindning)
├── package.json                    # npm-scripts (build/serve/dev/dev:cf/db:migrate/deploy)
├── _headers                        # CSP + säkerhetsheaders (kopieras till dist/)
│
├── docs/                           # Djupare dokumentation per område
│   ├── team-builder.md             # Team-builder-lägets flöde och regler
│   ├── ai-consultant.md            # Ai-consultant-lägets flöde och regler
│   ├── scaling.md                  # Skalningsregler (storlek + mognad)
│   ├── team-roles.md               # VD, VD-assistent, specialisters roller
│   ├── meetings.md                 # Mötesfunktionen i detalj
│   ├── first-project.md            # Kriterier för ett bra första kundprojekt
│   ├── produktstrategi-sjalvbetjaning.md  # Affärs-/produktstrategi (roadmap)
│   ├── m2-backend-spec.md          # Spec för köp/leverans-lagret (Stripe + D1)
│   │
│   │                               # Daterade ögonblicksbilder (granskningar/research).
│   │                               # Läget de beskriver är alltid färskare i LÄGET nedan:
│   ├── lansering.md                # LEVANDE lista: vad som är kvar till lansering
│   ├── granskning-helhet-2026-08-05.md    # Sexagentsgranskning: kod, säkerhet,
│   │                               #   visuellt, kärna, affär, dokumentation
│   ├── granskning-kundresa-2026-07-16.md  # 30 punkter längs kundresan
│   ├── omvarldsresearch-2026-07-17.md     # Konkurrenter och marknad
│   ├── roadmap-anvandarvarde-2026-07-17.md # UX/retention, etapp 0–4 (byggd)
│   ├── simulering-forlag-slutsatser-2026-07-18.md # Halvårssimulering, förlagskund
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

> **LÄGET (2026-08-05) — läs `docs/granskning-helhet-2026-08-05.md` först.**
> Den filen är den enda som beskriver nuläget och planen; övriga daterade
> dokument är ögonblicksbilder från när de skrevs och ska inte läsas som plan.
>
> Kärnan (fas 1–3 nedan) är klar och bevisat divergerande — se `examples/`.
> Webblagret är brett byggt i förhållande till kundbasen: fyra omgångar
> funktioner i portalen, ingen betalande kund än, ingen kassa och ingen mätning.
> Väg in det när något ska prioriteras — men det är ingen spärr.
>
> **Struket 2026-08-06:** grindregeln som stod här (ingen funktionskod i
> `portal/`, `builder/` eller `verticals/` förrän `docs/kunder.md` hade en rad
> från ett riktigt kundsamtal) gäller inte längre, och inte heller säljmålen den
> hängde ihop med. Föreslå inte kundsamtal, kundlistor eller säljfickor som
> "nästa steg" — vad som byggs härnäst avgörs pass för pass av Mikael.
> `docs/kunder.md` finns kvar som logg, inte som grind.
>
> Skriv ingen ny daterad granskningsfil i `docs/`. Fyra på fyra månader räcker;
> nästa bedömning görs av en kund som betalar eller låter bli. Uppdatera
> lägesdokumentet i stället.
>
> Sista raden varje arbetspass: skriv nästa pass enda uppgift, en mening, här
> nedanför. Projektet arbetar i skurar (38 commits på sex dagar), så scopet
> måste laddas i förväg — annars väljs det som är roligast under första timmen.
>
> De tre besluten är tagna 2026-08-05: **enskild firma Glänne & Söner**, **B2B
> och privatpersoner**, **momsregistrerat**. Prisstegen är spikad (0 / 90 / 190 /
> 4 990 / 490 per mån / offert) och står i lägesdokumentet — prislistan i
> `index.html` och avsnitt 4 i `villkor.html` måste alltid ändras tillsammans.
>
> **Gjort 2026-08-06 (ett långt pass):**
> - **Avsändare:** Resend på mittaiteam.se (eu-west-1, DKIM+SPF verifierade,
>   MX på `send.` så Email Routing och info@ är orörda). Inloggningskoder mejlas
>   skarpt. Admin-nyckeln ligger i `.dev.vars.resend.admin` (gitignorerad).
> - **Kassan (M2a-2):** `/api/checkout`, `/api/stripe-webhook`,
>   `/api/checkout/status`, `portal/aktivera.html` och "Spara i molnet" i
>   Buildern. Leverans sker till ett **konto**, inte till en capability-URL —
>   `docs/m2-backend-spec.md` är överspelad på just den punkten. Verifierat hela
>   vägen i webbläsare med Stripes testkort.
> - **Rullande session:** en aktiv kund behöver aldrig en ny mejlkod.
> - **Förbrukning och nyckel:** `index.html#forbrukning` — vad DeepSeek V4 Flash
>   via OpenRouter kostar i månaden (2–4 kr vid normal användning) och fem steg
>   för att skaffa nyckeln. Länkas från Buildern och portalen. **Ändras modellen
>   måste den sektionen ändras med prislistan och villkoren.**
>
> **`docs/lansering.md` är listan över vad som är kvar** — levande dokument, inte
> en daterad granskning. Fyra blockerande hål: nyckeln krävs efter betalningen,
> flera användare går inte att sälja, den nyckelfria nivån finns inte, och det
> saknas självbetjänad väg ut.
>
> **Nästa pass:** stäng hål 1 i `docs/lansering.md` — nyckeln ska vara verifierad
> innan pengarna byter ägare, inte efter.
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
