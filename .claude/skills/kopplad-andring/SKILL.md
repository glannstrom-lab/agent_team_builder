---
name: kopplad-andring
description: Slå upp vilka andra filer som måste ändras samma dag som den du just rört, och om något test fäller när de glider isär. Använd INNAN du ändrar priser, modellnamn, provmånadens eller ångerfristens längd, byggsteg, TEAM_SCHEMA, PORTAL_RULES, fair use-taket, CSP, service workerns SHELL, migrationer, secrets, teamregistret eller avatarräkningen — och när du är osäker på om en ändring har en andra halva. Triggar också på "vad mer måste ändras", "hänger något ihop med det här", "samma dag-regeln", "glider isär".
---

# Kopplad ändring

Det här projektet har ett drygt dussin par av filer som måste ändras samma dag.
Reglerna stod i prosa i `CLAUDE.md`, spridda över tolv stycken, och det räckte
inte: **KA6 var en koppling som gled isär inuti den fil K4 skapade för att göra
det omöjligt** (lagad 2026-09-06). Prosa läses av den som redan misstänker att
den behövs.

Registret ligger i `kopplingar.json` bredvid den här filen. Det är maskinläst,
så det går att fråga i stället för att minnas.

## Kör det här

```bash
# Vad hänger ihop med det jag redan ändrat? (läser git status)
node .claude/skills/kopplad-andring/kontrollera.mjs

# Innan jag rör en fil:
node .claude/skills/kopplad-andring/kontrollera.mjs --fil portal/app.js

# Hela registret, med vilka som är ovaktade:
node .claude/skills/kopplad-andring/kontrollera.mjs --alla

# Stämmer registret fortfarande med koden?
node .claude/skills/kopplad-andring/kontrollera.mjs --revidera
```

## Ordningen

1. **`--fil <sökväg>` innan ändringen**, eller utan argument efter. Utdatan
   visar varje halva, vad den gör, och om något test fäller när de skiljer sig.
2. **Ändra alla halvor i samma commit.** Inte "jag fixar texten sen" — det är
   precis så prislistan, modellraden och schemat har glidit isär förut.
3. **Är kopplingen märkt `OVAKTAD`: skriv testet nu.** Fältet
   `foreslagen_vakt` säger vad det ska mäta. Ett register som bara påminner är
   ett register som slutar läsas; ett test fäller bygget även när ingen läser.
4. **Är kopplingen ny — skriv in den i `kopplingar.json`** med ankare, roll och
   varför, och kör `--revidera`.

## Kör `--revidera` innan du litar på utdatan

Ett ankare som ruttnat är sämre än inget register: det säger "kontrollerad" och
pekar på en rad som inte finns längre. `--revidera` kontrollerar tre saker —
att varje fil finns, att varje ankarsträng fortfarande står i den, och att
varje *test som påstås vakta* fortfarande heter det registret tror. Ett omdöpt
test är en vakt som tyst slutade vakta.

När den går igenom: uppdatera `kontrollerad`-datumet i `kopplingar.json`.

## Vad som står i registret i dag (2026-09-06)

Sexton kopplingar. **Fem av dem är ovaktade** — ingen test fäller om halvorna
glider isär:

| id | vad som kan gå isär | följd |
|---|---|---|
| `modell-id` | modellraden på tre ställen + kostnadskalkylen | bygget, portalen och veckobrevet kör olika modeller; kalkylen som säljer "AI:n ingår" bygger på fel prislapp |
| `portal-regler` | `PORTAL_RULES` ↔ `templates/shared/portal-team.md` | Buildern och `/build-team` genererar olika team ur samma prompt |
| `fair-use` | `MAX_CALLS_PER_TEAM` ↔ villkoren ↔ startsidan | vi bryter ett avtalat tak, eller lovar ett vi inte håller |
| `migration-kod` | schema ↔ läsande kod | en ren kodrollback blir en tyst krasch i drift |
| `avatarer` | `COUNT = 25` ↔ filerna i `portal/avatars/` | trasigt porträtt i stället för felmeddelande |

Två som räknas som vaktade men bara delvis är:

- **`secrets`** — ett av tio värden kontrolleras (`OPENROUTER_KEY` i
  `test/health.mjs`). Frågan "kan vi upptäcka att en secret saknas?" har
  fortfarande svaret nej för 7 av 10 (DR6).
- **`portal-regler`** — sedan 2026-09-06 vaktas *en* siffra, antalet
  startförslag. De övriga nio punkterna i `PORTAL_RULES` speglas för hand.

De vaktade tio behöver du inte hålla i huvudet — men läs `varfor`-fältet innan
du ändrar ett tal. Testet säger *att* de ska vara lika, inte *varför* talet är
det det är.

## Två fällor värda att kunna utantill

**Schemat och prompten är ETT kontrakt, i båda riktningarna.** Ett fält som
beställs i `structurePrompt()` men saknas i `TEAM_SCHEMA` kommer aldrig
tillbaka — `additionalProperties: false` gör det förbjudet, inte valfritt. Ett
fält som krävs i schemat men ingen prompt beställer blir påhittat. Det slog
till på `starters`/`routines`, sedan på `firstProject`/`seasons`/`triggers`.
Lägg heller inget i schemat utan en läsare i koden: så blev `language` och
`defaultModel` dödfält.

Och **antalen** lyder samma regel en nivå ner — det var KA6, lagad 2026-09-06:
prompten beställde 2–4 startförslag medan schemat tvingade exakt 3. Regeln är
enkelriktad: *allt prompten tillåter måste schemat tillåta.* Snävare prompt än
schema är i sin ordning (rutiner 3–5 mot `minItems: 3` utan tak), vidare är ett
fel — då beställs ett svar valideringen kastar. Två tester i `test/ai.mjs`
fäller numera på båda felen.

**`Cache-Control` hör inte hemma i `_headers`.** Cloudflare Pages äger den på
statiska tillgångar och skriver över den — mätt i produktion. Det ser ut att
fungera och gör det inte. Färskheten ligger i `build-dist.mjs`.

## När registret inte säger något

`kontrollera.mjs` svarar "ingen av de ändrade filerna står i registret". Det
betyder inte att ändringen är ofarlig — det betyder att ingen skrivit ner
kopplingen än. Hittar du en: lägg in den, och skriv testet samtidigt.
