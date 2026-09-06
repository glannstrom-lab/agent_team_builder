---
name: driftsatt
description: Driftsätt mittaiteam.se hela vägen — förkontroll, push, migrationer, deploy, verifiering i drift, tagg och ROADMAP-post — och avsluta arbetspasset. Använd när något ska deployas, driftsättas, skeppas eller "läggas ut", när `npm run deploy` ska köras, när en migration ska köras skarpt, när ett arbetspass ska avslutas, eller när Mikael säger "kör klart", "vi är klara för idag", "lägg ut det" eller "driftsätt". Använd också vid rollback.
---

# Driftsätt och bokför

Deployen är sex steg och glöms i två ändar: **innan** (pushen — 2026-09-01 låg
`main` åtta commits före `origin/main`, så CI hade aldrig kört på koden i
produktion) och **efter** (verifieringen och ROADMAP-posten, som är det enda som
säger vad som faktiskt ligger ute).

Nio kontroller går att köra i stället för att minnas:

```bash
node .claude/skills/driftsatt/forkontroll.mjs
```

Den läser bara — deployar ingenting, når inte nätet. Röd utdata stoppar.

## Ordningen

### 1. Förkontroll

Kör skriptet ovan. Det fäller på oincheckade ändringar, opushade commits,
`dist/functions/`, en env-variabel som inte står i `CLAUDE.md`-tabellen och en
deploy-kedja som tappat `npm test`. Det varnar om migrationer, `functions/`,
halva kopplingar och den ROADMAP-post som ska skrivas efteråt.

### 2. Push — före deployen, inte efter

```bash
git push
git log --oneline origin/main..main   # ska vara tomt
```

`npm run deploy` pushar inte. Ligger main före origin har testsviten aldrig
sett koden i produktion: CI triggar på push, deployen kräver ingen. Det stod så
i två veckor utan att någon märkte det.

### 3. Migrationer, om passet har några

I den här ordningen, aldrig omkastad:

```bash
npm run db:backup        # avbryter om exporten saknar users/teams/team_access
npm run db:migrate       # mot skarpa D1
```

D1 är den enda datakällan i systemet som inte går att återskapa. Koden,
prompterna och besluten ligger i git; konton, betald åtkomst och planstatus
finns bara där. **Kopiorna hamnar i `backup/` på samma disk som repot** — de
skyddar mot en trasig migration, inte mot en trasig disk.

Migrationerna är enkelriktade: inga down-skript, och `ALTER TABLE ADD COLUMN` i
0003 och 0005 är inte idempotenta om de körs om för hand.

### 4. Deploy

```bash
npm run deploy   # npm test → build-dist → check-dist → wrangler pages deploy dist
```

Från **repo-roten**. Pages Functions hämtas därifrån (cwd), inte ur `dist/` —
`functions/` ska aldrig kopieras in i `dist/`, då publiceras API-källkoden som
statiska filer.

Skriv upp **Pages-id:t** wrangler skriver ut. Det är det som identifierar
deployen i dashboarden och i ROADMAP-posten. Rapporterar den `Uploaded 0 files`
är innehållet byte-identiskt med förra gången — värt att notera, för då ändrades
inget kundvänt.

### 5. Verifiera i drift — med riktiga anrop, inte med tillförsikt

Minimum, varje gång:

```bash
curl -s https://mittaiteam.se/api/health          # {"ok":true,...} med tre sanna kontroller
curl -s -o /dev/null -w "%{http_code}\n" https://mittaiteam.se/ https://mittaiteam.se/portal/ https://mittaiteam.se/builder/
curl -s -o /dev/null -w "%{http_code}\n" https://mittaiteam.se/helt/pahittad/sida   # ska vara 404, inte 200
```

Dessutom, beroende på vad passet rörde:

- **`functions/api/ai.js` eller `_build.js`** — kör ett riktigt byggsteg. Det
  var så K4:s enda öppna fråga (om `env.ASSETS` bär i produktion) besvarades.
  Och: fria rutten utan `step` ska ge **400 `build_step_required`**.
- **Betalvägen** — `/api/checkout` mot ett känt team. Ger den `cs_test_…` kör
  Stripe i testläge; kassan tar då inga riktiga pengar (hål 0 i
  `docs/lansering.md`).
- **Portalen** — öppna den, hårduppdatera. Service workern serverar gammalt
  skal tills den nya `CACHE`-hashen aktiverar; en deploy som "inte syns" är
  oftast det. Är det portalens *beteende* som ändrats: kör skillen
  `portal-med-ogon` i stället för att titta hastigt.
- **Veckobrevet** — går inte genom `ai.js` och har egen modellrad. Ändrades
  modellen: kontrollera `functions/api/digest/run.js` också.

### 6. Tagga och bokför

```bash
git tag deploy-$(date +%F) && git push --tags
```

Sedan en `## Driftsatt <ÅÅÅÅ-MM-DD>`-rubrik högst upp bland de daterade
avsnitten i `ROADMAP.md`, i samma form som de tidigare:

- Pages-id och commit-sha.
- **Verifierat i drift efteråt:** punktlista med det som faktiskt kördes — inte
  vad som borde fungera. Skriv `mätt` bara om något kördes.
- Fynd som dök upp under deployen. Det är ofta det viktigaste i avsnittet.
- Vad som är kvar och vems det är.

Är punkter avbetade: bocka av dem i arbetslistan högre upp i samma fil, och
uppdatera minnet (`python -m minne write …`) om något icke-uppenbart bekräftades
eller sprack.

### 7. Sista raden i passet

`CLAUDE.md` kräver en mening längst ner i **Nuvarande sprint**: *nästa pass enda
uppgift.* Projektet arbetar i skurar — 35 commits på sex dagar — så scopet måste
laddas i förväg, annars väljs det som är roligast under första timmen.

Skriv den innan du släpper tangentbordet, inte nästa gång.

## Rollback

Pages har rollback i dashboarden. **Men kod och schema hör ihop.** Att rulla
tillbaka bara koden går bra så länge migrationerna bara *lagt till* kolumner —
extra kolumner ignoreras. Den dag en migration *tar bort* något koden
fortfarande läser blir en ren kodrollback en tyst krasch i drift. Rör aldrig det
ena utan att veta var det andra står.

## Det som är Mikaels, inte ditt

Föreslå dem inte som "nästa steg" i ett pass — de är noterade och de står inte i
vägen:

- Aktivera Stripe-kontot och byta till live-nycklar (hål 0). **Fråga innan du
  påstår något om kassans läge** — uppmätt 2026-08-07 låg den i testläge, och
  om det ändrats syns inte i repot.
- Slå på Cloudflare Web Analytics med **automatic setup** (den manuella snutten
  skickar till `cloudflareinsights.com` och blockeras tyst av CSP:n).
- Peka en uptime-vakt mot `/api/health`. Rutten svarar redan rätt — men tills
  någon lyssnar finns spåret utan att någon tittar, vilket var exakt läget när
  produkten låg stum i tio dagar. **DR7** föreslår CI som vakt i stället: en
  `.github/workflows/health.yml` med `schedule` och `curl -fsS`, noll nya konton.
