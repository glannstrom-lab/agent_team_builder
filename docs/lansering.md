# Lansering — vad som är kvar

> **Levande dokument, inte en daterad ögonblicksbild.** Stryk rader när de är
> gjorda, lägg till när något nytt hittas. Det här är listan som avgör när
> produkten går att sälja till någon som inte känner Mikael.
>
> Senast genomgången 2026-08-06 (kväll): sju parallella granskare — kod &
> arkitektur, säkerhet, kärnan, produkt & affär, dokumentation, kundresa & UX,
> tester & drift. Arbetslistan som föll ut ligger i **`docs/roadmap.md`**; den
> här filen listar hålen, roadmapen listar arbetet.
>
> Tidigare samma dag: kodgranskning, visuell genomgång med Playwright (elva
> sidor, desktop + mobil), och två rollspelade kundresor — en privatperson
> (livscoach, solo, icke-teknisk) och ett företag (redovisningsbyrå, nio
> anställda, IT-leverantör som granskar).

## Den stora omläggningen 2026-08-06 (eftermiddag)

Två beslut som ändrar produkten mer än allt annat i listan nedan:

**1. Kunden har aldrig en egen API-nyckel.** Vi kör AI:n på vår nyckel via
`POST /api/ai`. Kravet på en egen nyckel var den enskilt största
avhoppspunkten för alla som inte redan var utvecklare — och kostnaden vi tar
över är 2–4 kr per kund och månad mot 90–290 kr i intäkt. Priset för bytet:
vi är personuppgiftsbiträde, och en öppen rutt på vår nyckel måste bevakas.
Tre tak i `functions/api/ai.js`: per IP, per konto (1 000 svar/mån = villkorens
fair use) och ett globalt dygnstak som skyddar kassan.

**2. Prisstegen är tre nivåer: 0 / 90 / 290 per månad.** Engångsköpet på
4 990 är skrotat, liksom 190 och 490. Skälet är hederligt: vi har ingen
molnstruktur för att underhålla team åt kunder, och "ert för alltid" vore ett
löfte utan drift bakom sig. Molnstrukturen byggs ut när det finns intäkt.

**3. Modellen är bytt till `openai/gpt-oss-120b`** (2026-08-06 kväll). Mätt över
hela pipelinen med samma underlag: **9,1 s mot 241 s, 0,025 kr mot 0,076 kr**.
DeepSeek klarade dessutom inte att producera teamet som JSON — 0 av 4 försök,
och varken högre tokentak, `response_format`, `require_parameters` eller
avstängt resonemang hjälpte. Sammanställningen använder nu ett riktigt
JSON-schema i strict-läge, vilket också var det som fick tillbaka `starters`
och `routines`: `json_object` garanterar syntax, inte innehåll.

Verifierat i webbläsare: bygge utan nyckel → följdfrågor → färdigt team på
**28 sekunder**, fyra agenter, tre startförslag var, tre rutiner, två avvisade.

Kvarstår på kvalitet: systemprompterna är i snitt 1 319 tecken mot DeepSeeks
2 100. Åtgärdas med `minLength` i schemat — inte gjort, inte verifierat.

~~Detta får inte deployas förrän `OPENROUTER_KEY` är satt.~~ Deployat och
verifierat skarpt (`3bb3dfc`, `fc6ac61`).

## Gratissvaren: noll, inte fem — avgjort 2026-08-06

Specen sa först fem gratissvar, koden byggdes med noll. **Mikael avgjorde till
kodens fördel:** inga provsvar i portalen. Att chatta med sitt eget team är det
som säljs — kunde man göra det gratis vore köpet valfritt. Den som vill se hur
portalen fungerar tittar på ett demoteam, där svaren är förskrivna.

Samtidigt avgjort: **det ska inte gå att prova sitt eget team live.** Knappen
"Prova teamet live" är borttagen ur Buildern (den fungerade ändå inte — servern
avvisar utkast-slugen med flit).

Fundamentet var rätt byggt hela tiden. De tre kraven:

1. **Bygget får inte räknas.** ✅ Uppfyllt. Skillnaden avgörs i D1 mot
   `team_access` och `teams.plan` (`ai.js:240-266`), aldrig av en flagga
   klienten sätter. `fc6ac61` täppte det verkliga hålet: portalen skickade
   aldrig slugen, så *varje* portalsvar behandlades som ett bygge.
2. **En betalande kund får aldrig mötas av den.** ✅ Uppfyllt, triviellt —
   uppslaget sker mot databasen.
3. **Kunden ska se hur många som är kvar.** Utgår — med noll gratissvar finns
   inget att räkna ner. I stället ska villkoret sägas *före* köpet, vilket det
   nu görs: Builderns avslut har ett eget stycke om att portalen öppnas av
   köpet, och ett utkast som öppnas i portalen möts av en låst vy i stället för
   ett 402 mitt i första frågan.

~~**Kringgåendet:** en OpenRouter-nyckel i localStorage skickade portalsvaren
direkt till `openrouter.ai`, förbi proxyn, betalväggen, taken och mätningen.~~
**Stängt 2026-08-06** — nyckelvägen är borttagen ur `atb-claude.js`; alla anrop
går till `/api/ai`. Verifierat i webbläsare med en planterad nyckel i
localStorage: teamet förblir låst.

## Läget just nu

Köpflödet fungerar hela vägen och är verifierat i riktig webbläsare: bygge →
"Spara i molnet" → Stripes kassa → betalning → webhook → konto → inloggning →
teamet i portalen. Inloggningskoder mejlas skarpt via Resend. Prislistan leder
numera till kassan i stället för till en mejladress.

Det som återstår är inte teknik i första hand. Det är **de fyra hålen mellan
löfte och leverans** nedan, och de syns bara när någon som inte byggt
produkten går igenom den.

---

## Blockerande — måste vara löst innan en okänd kund betalar

### 0. Stripe kör i TESTLÄGE — ingen kan betala på riktigt · NYTT 2026-08-07

Mätt, inte gissat. `POST /api/checkout` mot mittaiteam.se returnerar en session
vars id börjar på **`cs_test_`**. Webhook-endpointen i Stripes testläge pekar på
produktionsadressen `https://mittaiteam.se/api/stripe-webhook`, och produktionen
accepterar en signatur räknad med testlägets hemlighet — alltså är
`STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET` hos Cloudflare testnycklar.

Följden: **kassan fungerar men tar inga pengar.** Ett riktigt kort avvisas i
Stripes kassa, och det enda som går igenom är testkortsnummer. Prislistan säljer
en provmånad för 90 kr som ingen kan köpa.

Det förklarar också vad "verifierat skarpt 2026-08-06" faktiskt betydde: verifierat
mot den riktiga deployen, i Stripes testläge. Det är en fullgod teknisk
verifiering — men inte en kommersiell.

Att göra, och bara Mikael kan göra det: aktivera kontot hos Stripe (bolagsuppgifter,
bankkonto), skapa priserna på nytt i live-läge, och lägga in fyra live-värden som
Pages-secrets — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_TRIAL`,
`STRIPE_PRICE_STANDARD`. Live-lägets webhook-endpoint behöver samma fem
händelsetyper som testlägets nu har.

### ~~1. Nyckelkravet lever kvar i portalen~~ — STÄNGT 2026-08-06 (kväll)

Hålet stängdes först i Buildern och köppanelen, men omläggningen "kunden har
aldrig en egen API-nyckel" hade aldrig genomförts i portalen. Fyra granskare
hittade det oberoende av varandra. Nu är hela nyckelvägen borta:

- **Nyckelrutan i portalen** (`renderKeySetup`) är ersatt av en **låst vy**
  (`renderLocked`) som säger att teamet är byggt men inte aktiverat, och leder
  till köpet. "Byt API-nyckel", `resetKey` och nyckelknappen i mobilraden är
  borttagna.
- **Nyckelvägen i klienten** är borta. `atb-claude.js` har bara en väg kvar:
  `/api/ai`. Grenen som skickade anropet direkt till leverantören när en nyckel
  fanns i localStorage var inte död kod — den gjorde köpgrinden valfri.
- **Builderns nyckelkod** (`renderKeySetup`, `buildKeyGate`, `checkApiKey`,
  `saveVerifiedKey`) är raderad. Ingenting skriver längre `atb_api_key`, och
  portalen städar bort en kvarglömd nyckel vid start.
- **Demoteamen öppnas i demoläge automatiskt**, så ett exempelteam kan tittas på
  utan konto i stället för att svara 402 på första frågan.

Verifierat i webbläsare (Playwright, fyra flöden): exempelteam utan
demo-parameter → portal i demoläge; utkast → låst vy; utkast **med planterad
nyckel i localStorage** → fortfarande låst; uttryckligt demoläge → oförändrat.
Inga nyckelfält, ingen `sk-or-`-text kvar i portalen.

**Kvar på den här punkten:** `portal/aktivera.html:81` säljer fortfarande in
nyckelkravet efter betalningen, och nyckeltext står kvar i portalens meta
description och på branschsidorna (`verticals/app.js:89`). Se `docs/roadmap.md`,
pass 6.

### ~~1b. Nyckelgrinden i köppanelen~~ — STÄNGT 2026-08-06

Köppanelen hade en grind: saknades nyckel gick planknapparna inte att trycka på
förrän en nyckel testats mot OpenRouter på riktigt. Grinden togs sedan bort helt
i `022811b` när kunden slutade ha nycklar.

**Följdfynd på vägen — också stängt:** demoläget *sålde demoteamet*. Den som
klickade "Spara i molnet" ur `?demo=1` betalade 90 kr för CoachOnline-teamet, ett
påhittat företag. Nyckelgrinden såg till att kunden kunde öppna dörren, men inte
att rätt sak låg bakom den. Nu säljer demoläget ingenting: panelen förklarar att
körningen är inspelad, ber om nyckeln, och tar kunden till formuläret för att
bygga sitt eget.

### 2. Flera användare — halvvägs

**Byggt 2026-08-06:** `POST /api/team/invite`, `GET /api/team/members`,
`POST /api/team/remove`. Ägaren kan bjuda in, lista och ta bort platser.
Inbjudan bär ingen inloggningskod (den lever tio minuter, mejl läses när de
läses). Åtkomstraden skrivs före mejlet, så ett misslyckat utskick ger en kollega
som finns men inte fått lappen — inte tvärtom. Egna spärrhinkar, tak på 50
platser, och identiskt svar på "finns inte" och "du äger det inte".

**Kvar: ingen knapp.** Rutterna finns, men ingenting i portalen anropar dem.
Tills det byggs är det fortfarande Mikael som lägger till kollegor — nu via ett
API-anrop i stället för `scripts/provision.mjs`, vilket är snabbare men lika
manuellt.

**Kvar också:** en borttagen kollega tappar sitt konto men inte capability-länken.
Har hen sparat `/portal/?team=<slug>` når hen fortfarande teamet, eftersom
`/api/teams/:slug` med flit inte kräver inloggning (det är så team som säljs utan
konto levereras). Att täppa till det kräver ett beslut om capability-läsningen
ska dö helt.

### ~~3. Den nyckelfria nivån säljs men finns inte~~ — ÖVERSPELAT 2026-08-06

Nivåerna 190 och 490 är strukna ur prislistan, och den nyckelfria driften *är*
byggd: `/api/ai` på vår nyckel, fyra tak, förbrukning i `ai_budget`/`ai_usage`.
Kontextbudget-buggen som blockerade den fixades i `6959aa4` (`contextFor`,
`portal/app.js:519-549`).

### ~~3b. Provmånaden tar aldrig slut~~ — STÄNGT 2026-08-07

Var: ingen kod skrev någonsin `expired`, `cancelled` eller `refunded` till
`teams.plan`. Spärrlistan fylldes av ingen, och webhooken hanterade bara
`checkout.session.completed`. Följden var att 90 kr gav obegränsad
portalåtkomst i evighet, vilket gjorde 290-nivån osäljbar.

Nu: reglerna bor i `functions/api/_plan.js` och läses av både `/api/ai` och
`/api/teams/:slug`. Provmånaden är 30 dagar ur `teams.created_at`, kontrollerad
lat utan cron. Webhooken är en dispatcher över fem händelsetyper. Vägen vidare
finns: `POST /api/checkout { tier, slug }` fortsätter med samma team, och
`POST /api/subscription/cancel` säger upp i portalen. Se `docs/roadmap.md`
pass 2 för filraderna.

**I drift 2026-08-07:** migration 0005 körd skarpt, koden deployad
(`8a73e000`, Production/main, commit `a50ecf3`), och webhook-endpointen
uppgraderad från en till fem händelsetyper. Verifierat mot mittaiteam.se.
Gäller Stripes **testläge** — se hål 0 ovan; live-läget har ingen endpoint än.

### ~~4. Ingen självbetjänad väg ut~~ — STÄNGT 2026-08-06

Kort i arbetsytan från dag 25 som säger vilket datum provmånaden tar slut och
att ingenting dras automatiskt. "Ladda ner allt" som samlar företagsminne,
underlag och hela chatthistoriken i en läsbar markdown-fil. Uppsägningslänk som
öppnar ett förifyllt mejl med företagsnamn och slug. *(Mejlet blev en riktig
uppsägning 2026-08-07 — `/api/subscription/cancel`; mejlvägen ligger kvar som
reserv om anropet fallerar.)*

**Bugg som hittades på vägen:** de befintliga nedladdningsknapparna (per svar,
och "Ladda ner teamfil") fungerade sannolikt inte alls — en frikopplad
`<a download>` ignoreras av Chromium. Nu går alla nedladdningar genom en delad
hjälpfunktion som lägger in elementet i dokumentet före klicket.

---

## Allvarligt — kostar affärer men stoppar dem inte

- **Fritt formulerade frågor i demoläget** faller tillbaka på ett generiskt svar
  utan att det märks att det inte är en riktig körning.
- **Inbjudningsrutterna saknar gränssnitt** (se hål 2 ovan).
- **Det globala dygnstaket delas med betalande kunder** (`ai.js:299-302`) — den
  som bränner 4 000 anrop ger 503 åt varje kund resten av dygnet. Taket räknar
  dessutom anrop, inte pengar: värsta fall ~180 kr/dygn, och inget månadstak.
- **Ingen felövervakning.** `ai.js:610` skriver *"KREDITEN ÄR SLUT hos
  OpenRouter"* till en logg ingen läser. Tar krediten slut en helgnatt upptäcks
  det när en kund mejlar.
- **Prompt och schema har glidit isär i `builder/builder.js`.** `TEAM_SCHEMA`
  körs `strict` med `additionalProperties: false`, men prompten beställer
  `firstProject`, `seasons` och `triggers` — fält som inte finns i schemat och
  därför aldrig kan genereras. Konsult-lägets 🎯-panel kan alltså inte produceras
  av Buildern, och årshjulet är tomt i alla 14 teamfiler.

## Skav — rätta när något ändå görs i filen

- Ingen påminnelse om att maskera personnummer i redovisningsteamets lönerutin,
  trots att integritetspolicyn ber kunden undvika dem.
- Galleriet saknar sidor för tre av `examples/`-körningarna (lerverk,
  norrskenspodden, wikander).
- `/api/team/...` och `/api/teams/:slug` ligger namnmässigt nära varandra. Ingen
  kollision, men lätt att läsfela senare — och slug-längderna krockar redan:
  `teams/[slug].js:25` kräver 22–64 tecken, `team/_lib.js:17` tillåter 2–64, så
  handprovisionerade slugar blir oladdbara.
- Nyckeltext kvar på nio ställen, bl.a. `portal/index.html:7` (meta description,
  syns i länkförhandsvisningar) och varje branschsida via `verticals/app.js:89`.
- Tidsåtgången anges med fem olika värden på sajten; uppmätt verklighet är 28 s.
- `integritet.html` beskriver taken och `ai_usage.subject` felaktigt — koden
  skriver även `team:<slug>` och `ip:<ip>`, och fair use räknas per team, inte
  per konto. Art. 13-information ska stämma.
- `docs/pub-avtal-mall.md:149-155` påstår att OpenRouter *inte* är underbiträde.
  Det gällde i BYO-läget; nu anropar vi dem från egen server, och
  `villkor.html:471` listar dem redan. Rätta före nästa kundutskick.

---

## Åtgärdat 2026-08-06

Sparat här för att nästa granskning inte ska hitta samma saker igen.

| Fynd | Åtgärd |
|---|---|
| Prislistans knappar gick till en mejladress, inte till kassan | Alla tre pris-CTA går nu till Buildern |
| "API-nyckel" nämndes i en bisats utan förklaring | Egen sektion `#forbrukning`: kostnad per svar, tre månadsscenarier, fem steg för att skaffa nyckeln |
| Ingen kostnadsuppgift alls för AI-förbrukningen | "2–4 kr i månaden vid normal användning", räknat på $0,14/$0,28 per miljon tokens och 10,50 kr/dollar |
| Nyckelrutan erbjöd Anthropic-nycklar som inte fungerar | Bara OpenRouter; en Anthropic-nyckel får ett eget felmeddelande som förklarar varför |
| `defaultModel: "claude-opus-4-8"` i sex teamfiler | Borttaget, och Buildern skriver inte längre fältet — modellen är låst på ett ställe |
| DeepSeeks ursprung stod ingenstans | Utskrivet i både FAQ och integritetspolicy, med vad kunden kan begränsa hos OpenRouter |
| Villkoren lovade faktura, kassan tog kort | Villkoren beskriver kort som standard och faktura på begäran före köp |
| "Läge: Team-builder / AI-konsult" i Builderns formulär | Omskrivet till vad kunden får ut, inte vad delarna heter internt |
| "0 kr, ingen betalning" men Buildern krävde nyckel | Kortet säger nu att bygget kostar ~8 öre på egen nyckel, och länkar till demoläget |
| Inloggning krävde ny mejlkod var 30:e dag | Rullande session: utgången flyttas fram vid användning, så en aktiv kund aldrig ser en kod igen |
| Statiska filer cachades i fyra timmar utan innehållshash | `no-cache` på applagret i `_headers` — deployer syns direkt |
| CSP tillät `api.anthropic.com` som aldrig anropas | Borttaget; `checkout.stripe.com` tillagt i `form-action` |
| Demoläget sålde demoteamet — 90 kr för ett påhittat företags team | Demoläget säljer ingenting; köpknappen leder till ett riktigt bygge |
| Aktiveringssidan var 247 tecken i kundens mest mottagliga ögonblick | Förklarar nu inloggning, nyckelkravet med länk, och att köpet inte förnyas |
| Branschsidorna nämnde varken kostnad eller nyckel | Kostnadsrad med länk till `#forbrukning` i heron |
| Bokföringsdemot såg ut att gälla alla byråer | Säger nu att det är en trepersonersbyrå och att en större får ett annat team |
| `m2-backend-spec.md` beskrev capability-URL som levande lösning | Märkt överspelad på leveranspunkten; resonemanget kvar som historik |
| Nedladdningsknapparna laddade sannolikt inte ner något | Delad `downloadFile()` som lägger in elementet i dokumentet före klicket |
| Inget testade signaturkontrollen — betalningsbeviset | `test/stripe.mjs`, 13 tester. Suiten: 43 → 56 |
