# Lenas resa genom Mitt AI-team

## Berättelse

Jag hittar mittaiteam.se via en Facebook-grupp för egenföretagare. Hero-texten
"Fyra nya kollegor. Ingen av dem är påhittad." känns varm, och passerkorten med
riktiga namn (Vera, Ester, Sixten, Malte) gör det konkret på ett sätt jag inte
väntat mig (`index.html:128-181`). Jag scrollar till priser. Tre kort: 0 kr,
90 kr, 4 990 kr. Provmånaden är märkt "Börja här" med en ockrafärgad list, så
jag klickar där (`index.html:360-372`). Kortet nämner att jag "använder er egen
AI-nyckel" — jag vet inte vad det är, men det står också att det "i praktiken
[är] några kronor", så jag antar att det löser sig. Jag trycker "Kom igång →".

Ingenting händer utom att sidan hoppar ner till en kontaktruta med en
"Mejla oss"-knapp (`index.html:371, 506-513`). Jag har inte mejlklient
uppsatt på jobbdatorn, så knappen gör ingenting synligt. Jag förstår inte att
det här *var* köpknappen — jag trodde jag skulle komma till en kassa.

Jag provar demon istället (`portal/?team=coachonline&demo=1`). Den känns fint
— CoachOnline är en annan solo-coach, nästan min bransch. Jag klickar en av
de färdiga frågorna och får ett skarpt, konkret svar. Men när jag skriver en
egen fråga med mina egna ord får jag ett svepande, allmänt svar ("Bra — låt
mig ta...") som inte känns som att den förstod mig
(`portal/app.js:3253-3269`). Jag inser inte att det beror på att demot bara
spelar upp inspelade svar.

Jag går till Builder för att bygga mitt eget team gratis, som lovades på
prissidan. Direkt möts jag av en ruta som vill ha en "API-nyckel" — inte
demoläget jag kom från (`builder/builder.js:123-167`). Först längst ner finns
en liten länk "utforska i demoläge utan nyckel". Om jag missar den tror jag
att "gratis bygge" ändå kräver något tekniskt jag inte har.

Formuläret i sig är hanterbart — jag kan kryssa i branch och veckomoment i
stället för att skriva fritt (`builder/survey-data.js`). Men uppe i formuläret
finns ett val som heter "Läge" med alternativen "Team-builder (för dig själv
/ tekniska)" och "AI-konsult (för kunduppdrag)" (`builder/builder.js:204`).
Jag är varken konsult eller tekniker. Jag tvekar — är det här verktyget för
mig överhuvudtaget?

Säg att jag ändå bygger klart och vill "Spara i molnet" (`builder/builder.js:
1019-1078`) — det är först HÄR, inne i Buildern, som den riktiga
betalknappen för 90-krsnivån finns, inte på startsidan. Jag väljer
"Provmånad — 90 kr", betalar via Stripe, kommer till en aktiveringssida som
lugnt förklarar att jag loggar in med en kod till mejlen
(`portal/aktivera.html:69-82`). Det steget är faktiskt bra skrivet.

Men när jag loggar in och öppnar mitt team möts jag av exakt samma
nyckel-ruta som i Buildern (`portal/app.js:710, 739-796`). Jag har just
betalat 90 kr och förstår inte varför jag nu ombeds skaffa ett konto hos ett
företag jag aldrig hört talas om (OpenRouter) och lägga in ett betalkort där
också. Om jag ger upp här har jag betalat för något jag aldrig kommer att
använda.

## Friktionspunkter

| Var | Vad som händer | Allvarlighetsgrad | Fil:rad | Förslag |
|---|---|---|---|---|
| A. Startsidan, prissektionen | "Kom igång →" på 90 kr-kortet leder bara till en mailto-länk i kontaktsektionen, inte till någon kassa | Allvarlig | `index.html:371`, `index.html:511` | Länka direkt till Buildern eller en tydlig "så här köper du"-sida; skriv om knapptexten om målet är kontakt, inte köp |
| A/D. Prissektionen | "API-nyckel" nämns i en bisats utan länk eller förklaring; förklaringen finns bara i en hopfälld FAQ längre ner | Allvarlig | `index.html:367-368` vs `index.html:482-484` | Lägg en direktlänk till FAQ-svaret, eller en kort tooltip, precis vid ordet på priskortet |
| B. Demo | Egna formulerade frågor som inte matchar de inspelade svaren ger ett generiskt, känslolöst svar utan att det märks att det inte är "på riktigt" | Skav | `portal/app.js:3253-3269` | Märk tydligt när ett svar är ett fritt genererat exempel snarare än en inspelad demo-fråga |
| C. Builder, start | "Bygg ert team — 0 kr / ingen betalning" på startsidan, men Buildern kräver en API-nyckel direkt om man inte hittar demo-länken | Blockerande | `index.html:347-357` vs `builder/builder.js:123-167` | Gör demoläget till standardingång från startsidans "Bygg ert team"-knapp, inte nyckelskärmen |
| C. Builder, formulär | "Läge"-väljaren exponerar interna begrepp: "Team-builder (för dig själv / tekniska)" och "AI-konsult (för kunduppdrag)" | Skav | `builder/builder.js:204` | Dölj eller döp om fältet för en publik, icke-teknisk besökare — det är utvecklarterminologi |
| D. Köpet | Den enda fungerande kassan (Stripe) nås bara via Builderns "☁ Spara i molnet"-knapp efter en fullständig körning — inte från startsidans köpknapp | Allvarlig | `builder/builder.js:1019-1078`, `functions/api/checkout.js` | Gör vägen till kassan kortare och mer synlig för den som redan vet vad hon vill köpa |
| D. Efter köp | Provmånaden (egen nyckel) kräver att kunden skaffar konto och betalkort hos OpenRouter EFTER att hon redan betalat 90 kr till Mitt AI-team | Blockerande | `portal/app.js:710, 739-796` | Kräv och verifiera nyckeln (eller åtminstone ett konto) INNAN betalningen, inte efter — annars kan kunden betala för något hon aldrig kan öppna |
| D. Prisetikett vs teknik | Priskortet säger "90 kr / månaden" och villkoren beskriver ett "abonnemang" med uppsägningstid, men Stripe-nivån är `mode: "payment"` — ett engångsköp, ingen återkommande debitering | Skav (intern inkonsekvens) | `index.html:364`, `villkor.html:245-283` vs `functions/api/_stripe.js:99-102` | Räta ut om 90 kr är en engångskostnad eller ett återkommande abonnemang — texten och koden säger just nu olika saker |
| F/G. Uppsägning | Ingen knapp i portalen för att säga upp — måste mejla `info@mittaiteam.se` | Skav | `villkor.html:263-265` (ingen UI-motsvarighet i `portal/app.js`) | Lägg åtminstone en länk/knapp i portalen som förifyller uppsägningsmejlet |
| G. Provmånadens slut | Inget i portalen påminner kunden om att provmånaden går mot sitt slut eller vad som händer sen | Skav | Inget fynd i `portal/app.js` (sökt på "trial", "expiry", påminnelse) | Ett kort/notis i arbetsytan när ~30 dagar gått sedan köpet |

## Det här fick mig nästan att inte betala

- Att "Kom igång →" på det kort jag redan bestämt mig för inte gjorde något
  jag kunde se (mailto utan konfigurerad mejlklient) — jag trodde knappen var
  trasig.
- Ordet "API-nyckel" på priskortet, utan förklaring på plats — jag var
  tvungen att leta upp och läsa en hopfälld FAQ-post för att förstå att jag
  själv måste skaffa något hos ett företag jag aldrig hört talas om.
- Att inse att jag skulle behöva lägga in ett betalkort hos OpenRouter,
  utöver de 90 kronorna jag redan betalat till Mitt AI-team — två separata
  förhållanden till betala för samma sak kändes som en risk att bli lurad.
- "Läge"-valet i Buildern som talade om "tekniska" användare och "AI-konsult"
  fick mig att tro att verktyget kanske inte var byggt för någon som mig.

## Det här saknades helt

- En steg-för-steg-guide (i själva flödet, inte en extern länk) för hur man
  skapar och lägger in en OpenRouter-nyckel, riktad till någon som aldrig
  gjort det.
- En tydlig, väl synlig "prova/köp här"-knapp på startsidan som faktiskt
  leder till kassan — i dag är kassan gömd inne i Builderns resultatsida.
- Verifiering av att kunden har en fungerande nyckel INNAN hon betalar, så
  att ingen kan betala för en tjänst hon sedan inte kan öppna.
- En självbetjänad uppsägningsknapp i portalen.
- En påminnelse i portalen när provmånaden närmar sig sitt slut.
