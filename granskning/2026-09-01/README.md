# Genomgång 2026-09-01

Källmaterialet till projektgenomgången. **Deployas inte** — `build-dist.mjs`
har en uttrycklig ITEMS-lista och `granskning/` står inte i den.

Publicerad översikt:
<https://claude.ai/code/artifact/08527a49-a84b-491f-98b0-c6561afdab4e>

Arbetslistan med samma ID:n bor i `ROADMAP.md` i projektroten.

## Filerna

| Fil | Vad den är |
|---|---|
| `oversikt.html` | Artifaktens källa, **med typsnitten redan inbakade** som data-URI. Det är den här filen som publicerats; publicera om samma sökväg för att uppdatera samma URL. |
| `typsnitt.mjs` | Bakar in projektets egna woff2 (`fonts/`) i en `/*TYPSNITT*/`-markör. Redan körd på `oversikt.html` — markören finns alltså inte kvar. Behövs bara om sidan byggs om från grunden. |
| `repro-veckan-som-gick.mjs` | Reproducerar **RE1**. Kör `node repro-veckan-som-gick.mjs` — den plockar `isoWeek`, `routLoad` och `sparadTid` **verbatim ur `portal/app.js`** och kör dem mot ett stubbat localStorage, alltså den riktiga koden och inte en kopia. Ska skriva ut att återblicken får 0 rutiner och 0 minuter medan kunden faktiskt gjort 3 rutiner à 135 minuter. **När RE1 är lagad ska det här skriptet sluta reproducera** — det är kvittot. |

## Nästa genomgång

Uppdatera **samma** artifakt-URL (skicka `url` till Artifact-verktyget), märk
åtgärdade poster *Fixat* i stället för att radera dem, och väg om linserna.
Den här rundan körde PR (produktriktning), KR (köpresa), RE (retention),
KA (kärnan), DR (drift) och BF (blindfläck); SEO, delning och tillgänglighet
valdes bort eftersom de kördes 2026-08-17.
