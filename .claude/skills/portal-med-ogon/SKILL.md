---
name: portal-med-ogon
description: Öppna portalen i en riktig webbläsare och gå igenom den — layout, chatt, arbetsyta, rutiner, provmånadskort, mobil, konsolfel och skärmbilder. Använd EFTER varje ändring i portal/app.js, portal/portal.css eller portal/teams/, innan portalen driftsätts, när ett fel bara syns för kunden, och när något ska "provas i webbläsaren", "köras på riktigt" eller "ses med ögon". Triggar också på "öppna portalen", "ser det rätt ut", "testa i webbläsaren", "skärmbild", "KR3", "RE1", "P6", "P4", "OM5".
---

# Portalen med ögon

Fem pass i rad lade kod i `portal/app.js` utan att någon öppnade portalen. De
två färskaste felen är exakt den sorten: **KR3** (provmånadskortet försvinner)
och **RE1** ("Veckan som gick" läser en logg som just nollställts). Ingen av dem
syns vid genomläsning. Båda syns direkt på skärmen.

## Läge 1 — demo, offline, tar en minut

```bash
node .claude/skills/portal-med-ogon/genomgang.mjs
node .claude/skills/portal-med-ogon/genomgang.mjs --synlig --team salong
```

Startar en egen statisk server (`server.mjs`, noll beroenden), öppnar
`?team=<slug>&demo=1` i Chromium, går igenom laddning, presentationsöverlägg,
agentbyte, ett svar, arbetsytan, mobilvy (390 px) och de andra ytorna — och
samlar konsolfel och skärmbilder.

**Vad demoläget INTE visar:** rutinlistan ritas men bockas aldrig av
(`routineDone` är avstängd), och streak, puls, sparad tid, provmånadskort,
"Utveckla teamet", sök, kvartalsöverblick och mappkoppling är helt borta
(`if (state.demo) return` på ett fyrtiotal ställen). Precis det som byggts blint
går alltså inte att se här. För det krävs läge 2.

## Läge 2 — riktig, inloggad kund

```bash
# 1. Fixturen: skriver ut SQL + kommando, kör ingenting själv
node .claude/skills/portal-med-ogon/satt-upp-lokalt.mjs --team coachonline --plan trial --dagar 27

# 2. Kör de fyra kommandona den skriver ut (migrate → execute → dev:cf → genomgang)
```

Fixturen kopierar ett befintligt teams konfiguration till en **ny slug**,
skapar konto, `team_access` och en sessionsrad, och skriver ut kakan.

Två fällor den redan känner till:

- **Slugen får inte vara ett showcase-slug.** `isShowcaseSlug()` tvingar
  demoläge för allt som står i `portal/teams/index.js` — öppnar du
  `coachonline` som inloggad kund får du ändå demoläget. Skriptet genererar
  därför en egen slug.
- **Slugen måste matcha `^[A-Za-z0-9_-]{22,64}$`**, annars svarar
  `/api/teams/:slug` 400 innan den ens slår upp något.

`--plan` och `--dagar` är själva poängen med fixturen: `--plan trial --dagar 27`
framkallar provmånadskortet, `--dagar 31` framkallar spärren, `--plan past_due`
den obetalda fakturan. Lägen som annars kräver att man väntar en månad.

## Vad du fortfarande måste göra själv

Skriptet ser att något **ritades** — inte att det **ser rätt ut**. Öppna
skärmbilderna. Och kör de här för hand, med `--synlig`:

- **P6** — bocka av en rutin, ladda om. Kvittot ("klar ✓") ska ligga kvar.
- **P4** — avsluta en grundagent. Historiken ska komma tillbaka med agenten när
  den tas in igen, och ingångsagenten ska flytta sig om det är hen som avslutas.
- **OM5** — sparad tid ska räkna avbockade rutiners `timeEstimate` och
  ingenting annat. Rutiner utan uppskattning ska sägas vara oräknade.
- **RE1** — "Veckan som gick" vid veckans första öppning. Är den tom trots
  avbockade rutiner förra veckan är felet reproducerat.

## Uppmätt 2026-09-06, första körningen

Den här skillen kördes mot den lokala emulatorn samma dag den skrevs. Tre
resultat värda att bära med sig:

1. **KR3 är reproducerad i webbläsaren — och tidigare än roadmapen tror.**
   Kortet ritas vid boot och är borta **så fort presentationsöverlägget stängs**,
   alltså före agentbyte, före svar, före expanderad arbetsyta. Roadmapen listar
   tre anropsställen för `refreshSidebar()`; överläggets stängning leder till
   ytterligare ett. Fixen (en rad sist i `refreshSidebar()`) täcker alla.
2. **Ett moln-team ger alltid två konsolfel vid laddning.** Portalen provar
   `teams/<slug>.js` först och faller tillbaka på `/api/teams/:slug`
   (`portal/app.js:825`), så varje betalande kund får en 404 och ett
   MIME-fel i konsolen. Fallbacken är avsiktlig — bruset är inte, och det döljer
   riktiga fel för den som felsöker hos en kund.
3. **Presentationsöverlägget fångar varje klick** (`#ovl` äter pointer events).
   Varje automatiserad genomgång måste stänga det först; en kund måste klicka
   sig förbi det innan hon kan göra något alls.

## Om chatten inte svarar

`/api/ai` returnerar 502/503 när `OPENROUTER_KEY` i `.dev.vars` är ogiltig —
det är läget i dag ("Missing Authentication header"). Genomgången säger det
rakt ut och fortsätter: **allt utom chatten fungerar utan nyckel.** Låt inte den
saknade nyckeln stoppa ett portalpass; be om en när chatten faktiskt ska provas.
