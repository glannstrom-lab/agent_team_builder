# Roadmap — vad som byggs härnäst och varför

> **Levande dokument.** Stryk rader när de är gjorda, lägg till när något nytt
> hittas. Skillnaden mot `docs/lansering.md`: den listar *hålen* mellan löfte
> och leverans, den här listar *arbetet* i den ordning det ger mest.
>
> Underlag: sju parallella granskare 2026-08-06 (kod & arkitektur, säkerhet,
> kärnan, produkt & affär, dokumentation, kundresa & UX, tester & drift). Ingen
> fick ändra filer. Varje fynd nedan är verifierat i koden — där något bara är
> misstänkt står det utskrivet.

## Det som granskningen egentligen visade

Omläggningen 2026-08-06 — "kunden har aldrig en egen API-nyckel" — genomfördes
i servern och i Buildern, men **aldrig i portalen**. Det är inte ett fynd bland
andra; det är förklaringen till nästan hela listan. Sajten säljer nyckelfritt,
villkoren lovar nyckelfritt, `/api/ai` är byggt nyckelfritt, och sedan möts den
betalande kunden av en ruta som ber om en OpenRouter-nyckel.

Fyra granskare hittade det oberoende av varandra, från fyra håll. En halv
omläggning är värre än ingen: den gamla vägen finns kvar som en genväg förbi
allt det nya, inklusive betalväggen.

**Kedjan går sönder mellan betalning och första svar.** Allt före den punkten
fungerar och är verifierat skarpt. Allt efter den punkten är obrukbart. Ordningen
nedan följer den insikten: laga kedjan först, skydda kassan sedan, förbättra
kvaliteten därefter.

---

## Pass 1 — Laga kedjan mellan betalning och första svar ✅ GJORT 2026-08-06

Genomfört samma kväll som granskningen. Sammanfattning av vad som ändrades:

- `portal/app.js` — nyckelgrinden borta; `renderKeySetup` ersatt av
  `renderLocked` (byggt team, inte aktiverat → köp); `resetKey` och alla
  "Byt API-nyckel"-knappar borta; de fyra funktionsgrindarna på `state.apiKey`
  släppta; demoteam öppnas i demoläge automatiskt; en kvarglömd `atb_api_key`
  städas bort ur webbläsaren vid start.
- `atb-claude.js` — nyckelvägen borttagen, `/api/ai` är enda vägen. Serverns
  429-text vinner nu över klientens generiska ("vänta en minut" sades även när
  månadens tak var nått).
- `builder/builder.js` — "Prova teamet live" borta; nyckelkoden
  (`renderKeySetup`, `buildKeyGate`, `checkApiKey`, `saveVerifiedKey`) raderad;
  demots köppanel leder till ett eget bygge utan nyckelgrind; nytt stycke i
  avslutet som säger att portalen öppnas av köpet.
- `portal/sw.js` — `CACHE` bumpad till v23.

Verifierat i webbläsare, inte bara i API-lagret: fyra portalflöden inklusive en
planterad nyckel i localStorage (förblir låst), samt Builderns resultatvy.
`npm test` 56/56, `npm run build` grönt.

Kvar från passet: `portal/aktivera.html:81` (säljer in nyckelkravet efter
betalningen) och nyckeltexten på branschsidorna — flyttat till pass 6.

Originalbeskrivningen står kvar nedan som underlag.

### 1.1 Ta bort nyckelrutan ur portalen

`portal/app.js:742` — `if (!state.apiKey && !state.demo) { renderKeySetup(); return; }`

Träffar tre vägar: den betalande kunden (kontoväljaren `app.js:1015` →
`?team=<slug>` → omladdning → väggen), mottagaren av en delningslänk
(`#cfg=`-grenen ligger *efter* kontrollen, `app.js:745`) och Builderns "Prova
teamet live" (`builder/builder.js:1415`). Rutan som visas (`app.js:771–845`)
länkar dessutom till `../#forbrukning` för "fem steg för att skaffa nyckeln" —
steg som medvetet är borttagna ur `index.html:449–453`.

Att göra: stryk raden. Ta bort `renderKeySetup`, `resetKey` och "Byt API-nyckel"
(`app.js:1096`, `1339`, `1389`). Byt de fem funktionsgrindarna från
`!state.apiKey` till enbart `state.demo` — annars dör de tyst i stället för att
visa nyckelfel: minnesförslag (`app.js:2100`), auto-rutiner (`2299`), "Utveckla
teamet" (`2562`, som i dag svarar *"Kräver en inkopplad nyckel"* till en kund
som aldrig ska ha en) och underlagsdestillat (`3322`). Bumpa `CACHE` i
`portal/sw.js`.

### 1.2 Stäng nyckelvägen i klienten — den går förbi betalväggen

`atb-claude.js:122` väljer proxyn **bara** när `apiKey` saknas. Finns
`atb_api_key` i localStorage går varje portalsvar direkt till `openrouter.ai`:
förbi `/api/ai`, förbi uppslaget mot `teams.plan`, förbi alla fyra taken och
förbi förbrukningsmätningen. Nyckeln kan planteras via Builderns kvarvarande
`saveVerifiedKey` (`builder/builder.js:1653`), som skriver till samma
localStorage-nyckel portalen läser (`builder.js:167–172`). CSP tillåter det:
`_headers:2` har `connect-src 'self' https://openrouter.ai`.

Att göra: ta bort `else if (openrouter)`- och `API_URL`-grenarna i
`atb-claude.js:131–150`, stryk `https://openrouter.ai` ur `connect-src`, och
radera den döda nyckelkoden i Buildern (`builder.js:175–215`, `1622–1664`,
`1680–1698`). Så länge grenen finns kvar kan betalväggen kringgås av vem som
helst som råkar ha en nyckel.

### 1.3 Skriv om kvittosidan

`portal/aktivera.html:81` säger, direkt efter betalningen: *"portalen ber om en
egen AI-nyckel från OpenRouter — det är den som betalar för själva AI-svaren …
Fem minuter att skaffa."* Det är produktens mest mottagliga ögonblick, och
texten säljer in ett krav som inte finns.

Att göra: ersätt stycket med "Ni behöver ingenting mer — logga in med koden i
mejlet". Lägg till skräppost-hinten som redan finns i portalen (`app.js:914–916`).
Låt `checkout/status.js` returnera planen, så att raden *"engångsbetalning —
inget abonnemang"* (`aktivera.html:82`) inte visas för den som just tecknat ett
abonnemang.

### 1.4 Bestäm vad `__draft`, `__vertical` och `__link` ska få göra

`functions/api/ai.js:167` — `looksLikeSlug` faller på understreck, med flit
(kommentaren på rad 165–166 säger det rakt ut). Följden är att Builderns
"Prova teamet live" möts av 402 *"Det här teamet är inte aktiverat på ditt
konto ännu"* även efter att 1.1 är gjord. Det gratis byggets hela belöning är
alltså stängd.

Det här är ett beslut, inte en bugg — se **Beslut som krävs** nedan.

---

## Pass 2 — Provmånaden måste kunna ta slut

Det här är den enda punkten på hela listan som direkt avgör intäkten, och den är
inte med i `docs/lansering.md` alls.

**`teams.plan` skrivs aldrig om.** `PLANS_WITHOUT_PORTAL` (`functions/api/ai.js:162`)
är en spärrlista som läser `expired`, `cancelled` och `refunded` — men ingen kod
i `functions/` eller `scripts/` skriver någonsin de värdena. Och
`stripe-webhook.js:42` hanterar bara `checkout.session.completed`.

Konsekvenserna, i tur och ordning:

- En provmånad på 90 kr (engångsbetalning, `_stripe.js:103`) ger **obegränsad
  portalåtkomst i evighet**. Provmånaden tar aldrig slut.
- Därmed säljer 290-nivån sig aldrig. Varför betala månadsvis för något
  engångsbeloppet redan gav?
- En uppsagd prenumeration behåller åtkomsten tills någon ändrar raden för hand.
- En återbetalning likaså.

Att göra: prenumerera på `customer.subscription.deleted`, `invoice.payment_failed`
och `charge.refunded` i webhooken och sätt `plan` därefter. Lägg ett
utgångsdatum på trial — billigast som lat kontroll i `ai.js` mot
`teams.created_at`, alltså ingen cron. Och gör "uppsägningsbart när som helst"
(`index.html:421`) sant: i dag kräver `villkor.html:328` ett mejl.

---

## Pass 3 — Skydda kassan

Taken finns och är genomtänkta, men de skyddar fel sak.

### 3.1 Det globala taket kan stänga ute betalande kunder

`functions/api/ai.js:299–302` kontrollerar dygnstaket (4 000 anrop) **före**
allt annat, även för portalanrop. Den som bränner taket gör tjänsten
otillgänglig — 503 — för varje betalande kund resten av dygnet. Anonym trafik
och betald trafik delar hink.

Att göra: reservera huvuddelen av budgeten åt `portal === true`, eller ge
betalande ett eget, högre tak.

### 3.2 Taket räknar anrop, inte pengar

4 000 anrop × (50 000 tecken in + 16 384 tokens ut) ≈ **180 kr/dygn, ~5 500 kr
i månaden**. I JSON-läge dubbelt, eftersom `jsonSvar()` gör två uppströmsanrop
som räknas som ett (`ai.js:398–418`). Det finns inget månadstak och ingen
larmning. Per IP hjälper inte: IPv6-rotation gör den hinken verkningslös.

Att göra: sätt det globala taket på tokens/kostnad i stället för antal anrop —
`ai_budget` lagrar redan `input_tok` och `output_tok`
(`migrations/0004_ai_proxy.sql`). Lägg till ett månadstak.

### 3.3 Teckentaket går att kringgå

`ai.js:227` mäter `String((m && m.content) || "").length`. Skickas `content` som
array — `[{type:"text",text:"…1 MB…"}]` — blir `String(...)` lika med
`"[object Object]"`, alltså 15 tecken. `MAX_INPUT_CHARS` passeras utan att
räknas, och payloaden går vidare orörd till OpenRouter (`ai.js:332`). Kostnaden
per anrop blir modellens hela kontextfönster.

Att göra: avvisa allt `content` som inte är en sträng, eller mät
`JSON.stringify(messages).length`.

### 3.4 Bygget är en öppen LLM-proxy

Utelämnas `body.team` blir anropet ett bygge: ingen autentisering alls,
klientstyrd `system` och `messages` (`ai.js:261–266`). Det är avsiktligt — bygget
ska vara gratis — men det gör `/api/ai` till en generell LLM-endpoint för vem
som helst med `curl`, och det ger en uppsagd kund en väg tillbaka in: ta bort
slugen ur anropet och chatta vidare gratis.

Att göra: kräv konto för bygg-rutten efter ett par anonyma anrop, eller bind den
till ett serversignerat bygg-token utfärdat vid intake. Sänk
`MAX_BUILD_CALLS_PER_IP_DAY` (i dag 200, `ai.js:55`).

### 3.5 Kapplöpning i takräkningen

`functions/api/auth/_lib.js:105–121` gör SELECT → UPDATE utan atomicitet.
Parallella anrop läser samma `count` och passerar allihop. Gäller varje tak i
systemet: AI-proxyn, kodutskicket, inbjudningarna, checkout.

Att göra: ersätt med `INSERT … ON CONFLICT DO UPDATE SET count = count + 1 …
RETURNING count` och jämför på returvärdet.

---

## Pass 4 — Kärnan: fält som inte kan genereras

Det tyngsta kärnfyndet är strukturellt och tyst.

**`TEAM_SCHEMA` (`builder/builder.js:1037`) skickas med `strict: true` och
`additionalProperties: false`** (`functions/api/ai.js:330`). Prompten i samma fil
(`builder.js:967–982`) ber om `firstProject`, `seasons`, `scaling` och per agent
`triggers` — men inget av dem finns i schemat. Med strict *kan* modellen inte
returnera dem. Prompt och schema har glidit isär inuti en och samma fil.

Följderna är alla synliga, men syns som "tomt" snarare än som fel:

| Fält | Vad som dör | Konsument |
|---|---|---|
| `firstProject` | 🎯-panelen "Första projektet" — konsult-lägets bärande leverabel | `builder.js:1446`, `portal/app.js:1214`, `2168`, `3511` |
| `seasons` | Årshjulet. Bekräftat: `seasons` saknas i **alla 14** filer i `portal/teams/` | `builder.js:1595` |
| `triggers` | "Triggas av"-chipsen renderas aldrig | `builder.js:1583` |

Konsult-läget kör alltså en egen betald pipeline-etapp (`builder.js:894`,
first-project.md) vars resultat kastas bort. Omvänt kräver schemat ett
toppnivå-`why` (`builder.js:1039`) som varken prompten, `PORTAL_RULES` eller
`portal-team.md` definierar — modellen tvingas hitta på ett fält som sedan
kastas i `stripTeam` (`builder.js:1593`).

Att göra, i ordning:

1. **Lägg in `firstProject`, `seasons` och `agents[].triggers` i `TEAM_SCHEMA`**
   och stryk toppnivå-`why` ur `required`. Störst effekt per minut i hela repot.
2. **Skriv ett `test/schema.mjs`** som kontrollerar att varje fält prompten
   beställer finns i `TEAM_SCHEMA.properties`. Det här är andra gången samma
   klass av fel uppstår — `starters` och `routines` försvann på samma sätt, och
   det var det som föranledde schemat från början.
3. **Synka `templates/shared/portal-team.md`**: `defaultModel: "claude-opus-4-8"`
   (rad 26) står kvar trots att modellen är låst, texten om att kunden klistrar
   in sin egen Anthropic-nyckel (rad 7–8) är struken sedan 2026-08-06, `starters`
   saknas helt i agent-objektet (rad 74–84) — så `/build-team`-vägen producerar
   portal-konfigar utan startförslag — och `PORTAL_RULES` säger "2–4 starters"
   (`builder.js:43`) där schemat kräver exakt 3.
4. **`language` hårdkodas till `"sv"`** (`builder.js:1022`), vilket bryter
   designprincip 9 (språk följer input).

### Kvalitetslyft i prompterna

- **Personläget är oåtkomligt från `/build-team`.** `research.md:59–131` — 73
  rader noggrant skriven promptlogik för team åt en person snarare än en
  verksamhet — styrs av `teamet_för`, ett fält som bara finns i `research.md:66`
  och `builder.js:764`. `intake-interview.md` frågar aldrig. Det är den största
  mängden skriven kärnlogik som ingen CLI-körning kan nå. En fråga i intaget
  löser det.
- **`proposal.md:46–48` tillåter uttryckligen generisk output**: VD ska få "ett
  generiskt operativt jobb" om research inte hittade prioriteringsmoment. Det är
  den enda regeln i hela kedjan som säger *gör det generiskt*, och den motsäger
  `research.md:409` ("notera det i Osäkerheter i stället för att hitta på").
  Stryk den.
- **Systemprompterna är för korta.** Uppmätt: repots egna handkurerade portalteam
  ligger på 2 641–3 496 tecken; nya bygget ger 1 319. `PORTAL_RULES` kräver åtta
  till nio numrerade sektioner — de ryms inte, och det syns: `accountant.js` och
  `coachonline.js` saknar helt `DITT PERSPEKTIV`. `minLength` fungerar men bara
  som golv. Bättre: **dela upp `system` i schemafält** (`perspective`,
  `delivery`, `doneWhen`) med var sitt `minLength` och sätt ihop dem i klienten.
  Då kan sektioner inte tappas bort — vilket är det verkliga felet, inte längden.
- **Exemplen är två promptversioner efter kärnan.** Alla sex saknar `Perspektiv`,
  `Leverans` och "Klart när" (0 träffar), och saknar anti-fabriceringsregeln helt.
  Två punkter på kvalitetschecklistan går därför inte att pröva mot dem. Ett
  facit som inte visar vad prompten kräver lär fel. Regenerera.
- **Stage 2-kroken har inte körts för de tre solo-exemplen.** Lerverk,
  norrskenspodden och wikander — projektets *starkaste* divergensbevis — saknar
  både `site/<slug>.html` och `portal/teams/<slug>.js`. De syns alltså ingenstans
  i säljlagret.

**Divergensregeln i sig håller.** De tre solo-exemplen ger tre olika
beslutsproblem för VD (försäljningsmix hos Lerverk, beläggning hos Wikander,
tidsbudget hos Norrskenspodden) och tre olika sammanslagningar. Konsult-exemplen
skiljer sig även i struktur, 3/4/6 agenter. Projektets överordnade regel är
uppfylld.

---

## Pass 5 — Kvalitetsnätet

`npm test` ger **56/56 gröna** på ~150 ms. Men det är två av femton filer i
`functions/` och noll rader av webblagrets logik, och **det finns ingen CI** —
testerna körs bara när någon minns att skriva `npm test`.

De fem mest värdefulla testerna att skriva, med buggen var och en hade fångat:

| Test | Fångar |
|---|---|
| Betalväggens avgörande (bryt ut logiken ur `ai.js:240–300`) | Att en klient som utelämnar slugen faller till bygge, och att betald plan aldrig möter spärren |
| Schema mot prompt (`TEAM_SCHEMA` ⟷ promptsträngen) | `firstProject`/`seasons`/`triggers`-fyndet ovan, och `starters`-fyndet som redan hänt |
| SHELL ⟷ `CACHE` i `portal/sw.js` | Fyra commits ändrade SHELL-filer utan att röra `sw.js`: `b25c973`, `660de77`, `022811b`, `406c6ca` |
| Byggartefakt (kör `build-dist.mjs` till temp) | Tappad prompt-fil (Buildern dör tyst mitt i ett kundbygge) — och motsatsen: `functions/` publicerad statiskt |
| Prisbelopp på tre ställen | Driften mellan `index.html`, `villkor.html` och `TIERS`. Dagens test kollar bara nivå*namn*, inte belopp |

`.github/workflows/ci.yml` med `npm ci && npm test && npm run build` är den
enskilt största vinsten — den gör alla fem verksamma i stället för frivilliga.

**Ingen felövervakning finns.** `functions/` innehåller 20 `console.error`, bland
dem `ai.js:610`: *"KREDITEN ÄR SLUT hos OpenRouter — fyll på, tjänsten står
stilla"*. Den raden når ingen. `ai_usage`/`ai_budget` bokför bara lyckade anrop,
så ett 502-regn ser ut som en lugn dag. Tar krediten slut kl. 02 en lördag
upptäcks det när en kund mejlar.

Billigaste larmet: en `ai_errors`-tabell (`day`, `code`, `count`) med upsert i
felvägarna kring `ai.js:436`, `489`, `603`, plus en `/api/health` som en extern
pinger hämtar — och mejl via samma Resend-uppsättning som redan finns i
`auth/_lib.js:251–271`. Återanvänder befintlig infrastruktur, kostar ingenting.

**Sw-bumpen är korrekt i dag** (`portal/sw.js` står på v22, bumpad i samma commit
som senaste `app.js`-ändringen) men rutinen är manuell och har redan kostat
felsökningsrundor. En rad i `build-dist.mjs` som hashar SHELL-filerna in i
`CACHE` tar bort risken permanent.

---

## Pass 6 — Kundresan och det som skaver

### Portalen

- **Betalspärren upptäcks först efter att man skrivit ett meddelande.** Hela
  arbetsytan renderas för ett team utan giltig plan; 402:an kommer som en
  felbubbla. Kontrollera planen vid laddning och visa köpkortet i stället.
- **Fair use-taket förklaras bort.** `atb-claude.js:69` skriver över *alla*
  429-svar med "Vänta en minut och försök igen" — inklusive serverns korrekta
  *"Ni har nått månadens tak på 1 000 svar"* (`ai.js:292`). Kunden får rådet att
  vänta en minut på en spärr som sitter till nästa månad. Behåll serverns text
  när anropet går via proxyn, precis som redan görs för 401.
- **Arbetsytan är överlastad vid första besöket** — kodens egen kommentar säger
  det (`app.js:1745–1747`). `wsCollapsed()` döljer fyra paneler, men
  veckorutinerna döljs inte (`app.js:1263–1278`) och sidfotens sex knappar,
  inklusive "Säg upp" och "Töm allt", visas från sekund noll (`app.js:1300–1348`)
  — samtidigt som introduktionsmodalen öppnas automatiskt efter 400 ms.
- **Race: två svar i luften samtidigt.** `submitMessage` (`app.js:3730–3763`)
  gör `await refreshFolder(...)` på rad 3737 men sätter `state.streaming = true`
  först på 3763. I luckan passerar ett andra anrop guarden; `state.chatAbort`
  skrivs över och stoppknappen stoppar bara det ena. Samma mönster i `runMeeting`
  (`3607` vs `3627`). Sätt flaggan före varje `await`.
- ~~**Kostnadsvisningen ljuger i både siffra och text.**~~ **Åtgärdat
  2026-08-06 — borttagen.** Beslut av Mikael: en kund som betalar fast pris ska
  inte se ett kronbelopp per svar. Hela subsystemet är rivet (prisberäkning,
  veckosumma, `msg-cost`-raden) och med det klientens modellkatalog, som bara
  fanns för att mata det med priser — och som ändå returnerade DeepSeeks gamla.
  `isoWeek()` behölls; den används av rutiner, streak och pulskortet.
- **`renderTrialCard`** (`app.js:2873`) skriver in kortet i `.ws`, men
  `refreshSidebar()` (`app.js:2011`) bygger om spalten och tar bort det utan att
  kalla `checkTrialNotice` igen.
- **`saveHistory`** (`app.js:117`) stringifierar hela historiken två gånger per
  tur; vid kvotfel visas bannern men inget beskärs, så nästa sparning misslyckas
  också.
- **Strömningen gör en reflow per token** (`app.js:3777`: `bubble.textContent = acc`
  plus läsning av `log.scrollHeight`). Ett svar på 3 000 tokens ger ~3 000
  reflows över en växande sträng. Märks som hackighet på mobil. Textnod med
  `appendData(delta)` och `requestAnimationFrame` på scroll-kontrollen.

### Mobil och tillgänglighet

- **iOS zoomar in vid varje textfält** — font-size under 16 px i produktens två
  viktigaste fält: `builder/builder.css:68` och `:71` (15 px),
  `portal/portal.css:313` (15,5 px).
- **Tangentbordsfokus släcks på just de fälten**: `:focus-visible` finns
  (`showcase.css:420`) men `outline: none` i `builder.css:68/71` och
  `portal.css:313` laddas senare med samma specificitet och vinner.
- **Agentkorten klipps på 360–375 px.** `.cards` kräver 330 px kolumn
  (`showcase.css:301`), `.wrap` tar 2×28 px padding utan mobilnedtrappning
  (`:64`), och `body{overflow-x:hidden}` (`:59`) klipper i stället för att
  scrolla. Gäller även Builderns resultatvy (`builder.js:1468`).
- **Kontrast under 4,5:1 på text**: `.price-ribbon` i vitt på `--accent` = 3,85
  (`index.html:75`), `--amber` som textfärg = 3,86 (`showcase.css:373`, `:393`,
  `:260`). `--accent-2` (5,6) och `--text-dim` (7,2) är däremot bra.
- **Överlagren saknar dialog-semantik.** `openOverlay()` (`app.js:3214–3231`)
  sätter varken `role="dialog"` eller `aria-modal`, flyttar inte fokus och har
  ingen fokusfälla. Mobilmenyknappen ☰ saknar `aria-expanded` (`app.js:1377`).
- **Enkätens chips**: `chip()` (`builder.js:595–605`) sätter bara CSS-klasser —
  ingen `aria-pressed`, och trestegsläget (av → ingår → tidstjuv ⏱) finns inte
  för skärmläsare. Träffytan är ~29 px mot portalens egen 44 px-regel.

### Texter som säger fel saker

- **Nyckeltext kvar på nio ställen** utöver 1.1–1.3: `portal/index.html:7`
  (meta description *"Din nyckel, din data, din webbläsare"* — syns i
  länkförhandsvisningar), `app.js:1397`, `1689`, `2656`, `3552`,
  `site/en-vecka.html:200`, och **varje branschsida** via `verticals/app.js:89`
  (*"Teamet kör på er egen AI-nyckel — normalt 2–4 kr i månaden"* — både kravet
  och beloppet överspelat).
- **Tidsangivelserna spretar över fem värden**: "femton minuter"
  (`index.html:160`), "en halv minut" (`:344`), "en kvart" (`:607`,
  `builder.js:115`), "ett par minuter" (`builder.js:305`, `:1327`), "1–2
  minuter" (`builder.js:960`). Uppmätt verklighet: 28 sekunder. Välj en siffra.
- **FAQ nämner "konsultpaketet"**, som inte finns i prislistan.
- **Galleriet påstår fel motor**: "En Claude-agent skulle vara redundant"
  (`site/ikea.html:353`, `357`, `361`, `coachonline.html:258`).
- **Utvecklarspråk i kundvy**: "⬇ Ladda ner config" (`builder.js:1416`) och
  filens första rad *"Lägg i portal/teams/ och registrera i index.js"*
  (`builder.js:1760`).
- **Builderns "Ladda ner teamfil" laddar sannolikt inte ner något**
  (`builder.js:1762`): frikopplad `<a download>` ignoreras av Chromium, och
  URL:en återkallas synkront. Det är exakt buggen som lansering.md säger är
  åtgärdad — fixen (`downloadFile`, `app.js:571`) gjordes bara i portalen. Flytta
  den till delad kod.

### Övrigt

- **Inbjudningsrutterna saknar knapp.** `functions/api/team/{invite,members,remove}.js`
  finns och fungerar; ingenting i portalen anropar dem. Ett gränssnitt gör
  "flera användare" säljbart utan offertsamtal.
- **Slug-längderna krockar**: `functions/api/teams/[slug].js:25` kräver 22–64
  tecken, `team/_lib.js:17` tillåter 2–64. Handprovisionerade slugar
  (`kallaren-nord`) blir därmed oladdbara i portalen.
- **Ingen gallring, personuppgifter som primärnyckel**: `login_codes` städas
  aldrig, `auth_throttle` har e-postadressen i klartext som nyckel
  (`_lib.js:139`), `ai_usage` lagrar IP månadsvis (`ai.js:369`). Hasha
  bucket-nycklarna och gallra opportunistiskt.
- **`_headers` `no-cache` glömmer CSS och sidoskript** — `portal.css`,
  `builder.css`, `showcase.css`, `survey-data.js`, `deadlines-se.js`,
  `verticals/*`. JS uppdateras direkt, stilen fyra timmar senare.
- **`MAIL_PROVIDER=console` lämnar ut inloggningskoden i svaret**
  (`auth/request.js:77–79`). Default är `resend` och felet kräver en felsatt
  variabel — men då är det totalt. Villkora på en andra, uttrycklig flagga.
- **CSP har `unsafe-inline`** (`_headers:2`). Ingen XSS-sänka hittades —
  markdown-renderaren bygger DOM-noder — men skyddet vilar helt på att det
  förblir så i en app som renderar LLM-utdata, inklistrade dokument och
  teamkonfig ur `#cfg=`-fragment.
- **`portal/app.js` är 3 902 rader** i ett globalt scope med ~30 fria variabler.
  Nästan alla race-fynd ovan är kapplöpningar mellan samtidiga skrivare, inte
  logikfel. Bryt ut lagringslagret först — det är det enda `builder`, `portal`
  och `verticals` faktiskt delar nycklar i, och där de i dag kan skriva över
  varandra.

---

## Beslut som krävs av Mikael

Fyra frågor som styr arbetet och som ingen granskare kan svara på.

**~~1. Noll eller fem gratissvar i portalen?~~ — AVGJORT 2026-08-06: noll.**
Inga provsvar. Att chatta med sitt eget team är det som säljs; kunde man göra
det gratis vore köpet valfritt. Koden var redan byggd så
(`functions/api/ai.js:19`) — det var specen i `lansering.md` som fick ändras.
Följden: kravet "kunden ska se hur många som är kvar" utgår, och ersätts av att
villkoret sägs *före* köpet — i Builderns avslut och i portalens låsta vy.

**~~2. Ska "Prova teamet live" fungera?~~ — AVGJORT 2026-08-06: nej.**
Knappen är borttagen. Den som vill se portalen innan hon köper tittar på ett
demoteam, där svaren är förskrivna och inget anrop sker. Utkast (`__draft`) och
delade team (`__link`) möts av den låsta vyn i stället för av ett 402 mitt i
första frågan.

**3. Ska capability-läsningen dö helt?**
`/api/teams/:slug` kräver numera inloggning, så den gamla länken är redan
stängd på servern. Kvar är frågan om `?team=<slug>` i portalen ska fortsätta
öppna lokalt levererade team utan konto. Det avgör om en borttagen kollega
faktiskt tappar åtkomsten.

**4. Var ska "Utveckla teamet" spara?**
Tillägg sparas bara i `localStorage` (`atb_teamext_<slug>`). Rensad webbläsare
eller ny dator = borta. Det var acceptabelt när nivån hette BYO; det är det inte
när 290 kr/mån säljs med "uppdateringar ingår".

---

## Vad som är bra och inte ska röras

Värt att skriva ut, så att nästa granskning inte river upp det:

- **Stripe-integrationen är korrekt.** HMAC-SHA256 över rå kropp, 300 s
  tolerans, konstant-tidsjämförelse, stöd för roterade hemligheter
  (`_stripe.js:48–79`). Idempotens via `teams.stripe_session UNIQUE` plus tidig
  retur och `idempotency-key` mot Stripe. Pris och läge tas aldrig från klienten.
- **Inloggningen är korrekt.** Kod hashad och saltad med e-postadressen, 10 min,
  tre försök, bränns vid ny begäran, försöket räknas upp före jämförelsen,
  `timingSafeEqual`. Session: 32 byte CSPRNG, SHA-256 i databasen,
  `HttpOnly; Secure; SameSite=Lax`.
- **Samtliga SQL-satser i `functions/` använder bundna parametrar.** Ingen
  strängkonkatenering av användardata någonstans.
- **Behörighetsmodellen är konsekvent**: `/api/teams/:slug`, `/api/team/*` och
  portalvägen i `/api/ai` går alla via `team_access` + `user_id`, med identiska
  svar på "finns inte" och "du når det inte".
- **Inga hemligheter har någonsin varit committade.** `git log --all` mot
  `.dev.vars*` ger noll träffar; ingen nyckel i spårade filer.
- **Kontextbudget-buggen är redan fixad** — `contextFor` (`app.js:519–549`),
  12 meddelanden / 40 000 tecken med lokalt destillat, används i alla banor som
  skickar historik. `docs/lansering.md` listar den fortfarande som öppen.
- **Enhetsekonomin håller.** Ett normalsvar kostar 0,23 öre mot utskrivna 0,25.
  Vid fair use-taket med tunga svar är marginalen 90 % på provmånaden och 97 %
  på standard. En betalande kund kan inte bli olönsam inom taken. Det är den
  fria byggrutten som är den oskyddade flanken, inte kunderna.
- **Divergensregeln håller** (se pass 4).
