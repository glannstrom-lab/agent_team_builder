# Tredjepartsbibliotek i portalen

Tre bibliotek ligger inklistrade här i stället för att hämtas från ett CDN.
Skälet är CSP:n: `_headers` tillåter inga externa script-källor, och ingen
besökares IP ska gå till en tredje part. Priset är att `npm audit` och
Dependabot inte ser dem — inget verktyg varnar den dag en CVE dyker upp.

Den här filen finns för att göra dem synliga ändå. **Uppdatera den när en fil
byts ut.**

| Fil | Bibliotek | Version | Källa till versionen |
|---|---|---|---|
| `pdf.min.mjs` | PDF.js (Mozilla) | **6.2.108** | filens egen `Version = ` -sträng |
| `pdf.worker.min.mjs` | PDF.js worker | **6.2.108** | samma, matchar huvudfilen |
| `xlsx.full.min.js` | SheetJS CE | **0.20.3** | filens egen `version="0.20.3"` |
| `mammoth.browser.min.js` | mammoth.js | **okänd** | se nedan |

**mammoth är inte fastställd.** Bundlen innehåller flera `version="…"`-strängar
(3.4.7, 3.7.1, 1.0) som hör till dess egna beroenden, inte till mammoth självt.
Filen laddades ned 2026-07-18 (filens tidsstämpel). Vill man veta säkert: hämta
den aktuella `mammoth.browser.min.js` och jämför storlek och innehåll, eller
byt ut filen och skriv in versionen här samtidigt.

## Varför just dessa tre är värda att hålla ögonen på

`pdf.min.mjs` parsar **kundens uppladdade filer** — alltså opålitlig indata från
en fil vi inte har skrivit, i webbläsaren hos en betalande kund. Det är den enda
av de tre där en sårbarhet har en självklar väg in. `xlsx` läser
kalkylark och `mammoth` Word-dokument, samma sorts indata men historiskt färre
allvarliga fynd.

CSP:n skyddar mot att biblioteken *hämtar* något externt. Den skyddar inte mot
en bugg i parsern.

## Rutin

En gång i kvartalet, eller när något av dem nämns i säkerhetssammanhang:

1. Jämför versionerna ovan mot senaste utgåvan
   (`github.com/mozilla/pdf.js/releases`, `github.com/SheetJS/sheetjs`,
   `github.com/mwilliamson/mammoth.js`).
2. Sök upp kända CVE:er för den version som ligger här, inte bara för den
   senaste.
3. Byts en fil: uppdatera tabellen ovan **i samma commit**, och kör
   filimporten i portalen en gång för hand — det finns inget test som täcker
   den vägen.
