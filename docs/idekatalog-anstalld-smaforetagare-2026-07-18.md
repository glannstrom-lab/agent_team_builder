# Idékatalog: funktioner för anställda & småföretagare (2026-07-18)

> Brainstorm förankrad i förlagssimuleringen, omvärldsresearchen och det som
> redan är byggt. Märkning: **[statiskt]** = byggbart nu (BYO, ingen backend),
> **[data]** = kräver kurerat datapaket men ingen server, **[M2b]** = kräver
> backend-lagret. Segment: 🧑‍💼 anställd, 🏪 småföretagare, 🔁 båda.

## För anställda ("boosta en anställd"-segmentet)

1. 🧑‍💼 **Chef-rapporten** [statiskt] — "Vad säger jag på måndagsmötet?" En
   knapp som bygger statusuppdatering/veckorapport till chefen ur portalens
   egen logg (Veckans arbete finns redan — detta är samma data, ny mottagare).
   Anställd-segmentets trolige killer feature: synlighet uppåt.
2. 🧑‍💼 **"Det här har jag levererat"** [statiskt] — lönesamtals-/medarbetar-
   samtalsunderlag ur årets ackumulerade logg + minne. Wrapped-mekaniken
   riktad mot karriär i stället för retention. Stark anledning att logga allt
   i portalen.
3. 🧑‍💼 **Mötesförberedaren** [statiskt] — klistra in agenda/kalenderutdrag →
   brief per möte, frågor att ställa, vad du bör ha läst. Efteråt: anteckning
   → åtgärdslista med ägare.
4. 🧑‍💼 **Anonymiseringsvakten** [statiskt] — anställda får ofta inte klistra
   in kunddata i AI. En "maska innan du skickar"-hjälp (namn/orgnr/belopp →
   platshållare, lokalt i webbläsaren innan anropet) gör teamet användbart
   utan policybrott. Kan bli ett säljargument mot arbetsgivare.
5. 🧑‍💼 **Nej-hjälpen** [statiskt] — formulera artiga nej, förhandla om
   deadlines, eskalera snyggt. Litet, återkommande, känslomässigt värdefullt.
6. 🧑‍💼 **Roll-intake** [statiskt, pipeline] — intaget utgår från EN persons
   arbetsvecka/arbetsbeskrivning (klistra in jobbannonsen) i stället för ett
   företag. Redan noterat som segment-idé; enkäten gör det nu billigt att
   bygga en rollvariant av frågorna.

## För småföretagare

7. 🏪 **Ekonomipulsen: xlsx/csv-stöd** [statiskt] — utöka filimporten (pdf/
   docx finns) med SheetJS för .xlsx/.csv: Fortnox-/bokföringsexport,
   Shopify-order, kundlistor → månadsgenomgång på svenska. Lerverk-exemplets
   kärnkluster hängde på exakt detta; sannolikt största enskilda värdehöjaren
   för segmentet.
8. 🏪 **Svenska deadline-kalendern** [data] — kurerat datapaket per bolags-
   form (moms, AGI, deklaration, bokslut, semesterlagen...) som matas in i
   seasons-årshjulet automatiskt. "3 veckor till momsdeadline" utan att
   kunden behöver mata in något. Ren statisk datafil + befintligt puls-kort.
9. 🏪 **Öva-samtalet (rollspel)** [statiskt] — inför svåra samtal (sen
   betalning, prishöjning, reklamation, uppsägning): agenten spelar kunden,
   du övar i chatten, får feedback + färdigt samtalsmanus. Unik, känslomässig,
   demovänlig. Kräver bara en mötestyp-liknande UI + promptmall.
10. 🏪 **Offertjagaren** [statiskt] — klistra in/importera offertlistan →
    rutinen "dag 9: skicka puffen" med färdiga uppföljningsmejl per kund.
    Struktur: offerter.md i mappen som agenten läser och uppdaterar.
11. 🏪 **Kundboken** [statiskt, mönster] — kunder.md som strukturerat
    kundminne (mall: senaste kontakt, preferenser, öppna trådar) som
    agenterna refererar och föreslår uppdateringar till (samma grind som
    minnesförslagen). "Vad sa vi till Svenssons sist?"
12. 🏪 **Prislappshjälpen** [statiskt] — kalkylagent med mall: kostnader +
    timmar + påslag → "vad ska jag ta betalt för det här jobbet", med
    marginalvarning. Kopplar till "våga ta bättre betalt"-målet i enkäten.
13. 🏪 **Anbudsanalysen** [statiskt] — klistra in upphandlingsunderlag →
    gå/inte gå-bedömning + disposition + kravmatris. (Bevakning av nya
    upphandlingar kräver integration — analysen gör det inte.)
14. 🏪 **Semesterläget** [statiskt] — "jag är borta v.30–32": autosvarsutkast,
    att-göra-före/efter-lista, rutiner pausas, streak-freeze aktiveras.

## Båda segmenten

15. 🔁 **Diktera på mobilen** [statiskt] — Web Speech API (Chrome): tala in
    hjärndumpen i bilen/på bussen → VD-assistenten strukturerar. Löser
    mobilens största friktion (skriva långt på telefon). OBS: taligenkänningen
    går via webbläsarleverantören — märk ut det (integritetslöftet).
16. 🔁 **Beslutsloggen** [statiskt, mönster] — "vi bestämde X den 14/7" som
    egen sektion i minnet med datum, + snabbfråga "vad har vi bestämt om Z?"
    (sök finns — detta är struktur + prompt-konvention).
17. 🔁 **Att-göra-bryggan** [statiskt] — agentsvar innehåller ofta åtgärder;
    en "→ Till att-göra"-knapp som samlar dem i todo.md i mappen (delas via
    OneDrive med kollegan/chefen). Delegering till människa, inte bara agent.
18. 🔁 **Mallbiblioteket** [data] — kurerade svenska dokumentmallar (avtal,
    GDPR-texter, anställningsintyg, offertmall) som agenten fyller med
    minnets fakta. Juridik-disclaimer obligatorisk.

## Rekommenderad topp 5 (värde × byggbarhet × differentiering)

1. **xlsx/csv-stöd + ekonomipulsen** (7) — låser upp ekonomi/e-handel för
   hela segmentet; filimporten finns redan att bygga vidare på.
2. **Svenska deadline-kalendern** (8) — billig (ren data), unikt svensk,
   ger köparpersonan (Karin-problemet) vardagsvärde via befintliga puls-kort.
3. **Chef-rapporten + "det här har jag levererat"** (1+2) — anställd-
   segmentets ingång, byggd på loggen som redan finns.
4. **Öva-samtalet** (9) — demovänligast av allt; ingen konkurrent gör det.
5. **Diktera på mobilen** (15) — mobilfriktionens motmedel, Web Speech är
   gratis.

> Ej med: allt som kräver riktiga integrationer (mejl, Fortnox-API,
> kalender) — det är Fas 3-vallgraven och väntar på efterfrågan, precis som
> strategin säger.
