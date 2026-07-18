# Simulering: ett halvår med Förlaget Blåklint — slutsatser (2026-07-18)

> Metod: den riktiga pipelinen (research → scale → proposal → first-project →
> portal-konfig) kördes via Claude Code för en fiktiv kund (litet bokförlag,
> 3 personer, ai-consultant-läge, mognad "van"), följt av en ärlig simulering
> av sex månaders portalanvändning (juli–december) mot portalens faktiska
> funktioner och kända begränsningar. Råmaterial: `testoutput/forlaget-blaklint/`
> (research, scaling, proposal, first-project, team.json, simulering-halvar.md).

## Utfallet i en mening

Blåklint förnyar år två — ROI:n bars nästan helt av **en** specialist
(Manuslotsen: refuseringsberg 4+ månader → 11 dagar) plus rutinvakten, men
förnyelsen hängde på redaktörens mandat, inte köparens, och hotet mot år tre
är inte AI-kvaliteten utan **logistiken runt den**: bilagor, delad teamstatus
och en växtväg för teamet utan konsultsamtal.

## Vad simuleringen bekräftade (rör inte)

- **Kärnregeln höll.** Teamet blev genuint förlagsspecifikt; divergens-raden
  var äkta, inte kosmetisk. Mognadstaket producerade självmant en seriös
  avvisning (Kulturrådsagenten) — scale→proposal-kedjan håller ihop.
- **"Konkreta arbetsmoment"-principen är rätt.** Värdet kom från moment med
  volym och frekvens (manustriage, titelpaket, kanalrytm) — inte från de
  "strategiska" agenterna.
- **Mätbarhetsspåret (etapp 2) avgjorde förnyelsen.** Kvartals-wrapped
  ("≈ 118 h avklarat") var det som övertygade köparen. Rutinavbockningen bar
  kanalrytmen genom katalogveckor, mässa och julrusch.

## Prioriterade förbättringar

### P1 — Churn-riskerna (bygg härnäst)

1. **Bilagor: PDF/Word → text, klient-side.** 15–20 manus/vecka som PDF
   klistras idag in för hand — mitt i kärnflödet. Lösning utan backend:
   vendorerade pdf.js + mammoth.js (CSP self) som extraherar text lokalt till
   underlag/mappen. Gäller långt fler kunder än förlag (offerter, avtal,
   fakturor). *Klart när:* en PDF kan släppas i portalen och bli underlag.
2. **Uppdateringsflöde i portalen + "först i kön"-ytan.** Oktober-krisen:
   den avvisade Kulturrådsagenten behövdes, och portalen hade ingen väg att
   växa teamet → "varför betalar vi"-frågan. Bygg "Har något ändrats?"-flödet
   (kör `intake-update.md` i webbläsaren som Buildern kör prompterna) och gör
   Avvisade-listan till en synlig växtväg på "Därför detta team"-sidan
   ("först i kön vid nästa uppdatering" + knapp). Avvisningar är
   förtroendekapital vid köpet men måste vara en *produktyta* efteråt.
3. **Delad teamstatus (fleranvändare).** Tre personer = tre osynkade portaler;
   OneDrive-mappen synkar filer men inte historik/rutinbock/streak/minnes-
   godkännanden. Mellansteg utan backend: flytta rutinlogg + streak +
   minnesgodkännanden till statusfil(er) i mappen (append-vänligt format,
   läs-före-skriv mot konfliktkopior). Fullt svar = M2b-2 (identitet) —
   simuleringen är starkaste beviset hittills för M2b-prioriteringen.
4. **Historik: arkiv + sök.** 60-taket åt upp läsrapporter Jonas behövde
   månader senare. Arkivera utfasade meddelanden till mappen
   (`arkiv-<agent>.md`) i stället för att slänga; klientsök över historik +
   arkiv. (Sök var medvetet nedprioriterad i etapp 0–4 — simuleringen visar
   att den blir kritisk runt månad 3.)

### P2 — Vardagsvärde och småfixar

5. **Köparens vardagsvärde (Karin-problemet).** VD-agenten användes två
   gånger på sex månader — köparen hittade ingen vardagsanvändning, farligt
   vid förnyelse. Åtgärder: (a) `seasons`/årshjul i teamkonfigen (pipeline:n
   känner redan årsrytmen: katalogveckor, mässan, stöddeadlines) → puls-kort
   "3 veckor till Kulturrådsdeadline"; (b) ge VD-agenten en stående månads-
   leverans (månadsöversikt) så rollen har en rutin, inte bara finns.
6. **Auto-rutinens dagfönster.** Öppnas portalen på tisdag uteblir måndags-
   briefen helt. Fix: kör om `rt.day <= idag` och rutinen inte är avbockad
   den veckan.
7. **minne.md-konflikter.** Samtidiga godkännanden via OneDrive gav
   konfliktkopior. Läs om filen före skrivning; överväg append-logg.
8. **Underlagsbudgeten.** ○-markeringen förklarar inte *vad man ska göra*;
   katalogveckans sju titelunderlag sprack budgeten. Kortsiktigt: bättre
   förklaring + "Sammanfatta underlaget"-knapp (AI-destillat som ersätter
   originalet i prompten). Långsiktigt: RAG-trappan (M2b-4).
9. **Mobil + mapp.** Underlagen var tomma på telefonen under Bokmässan
   (File System Access finns inte på mobil). Ingen statisk lösning —
   argument för M2b-3 (moln-material). Dokumentera ärligt i UI:t.

### P3 — Pipeline-prompterna (små, gör vid tillfälle)

10. **`scale.md`:** explicit golv — "minst 1 specialist när minst ett kluster
    ligger över ribban" — och en färdig tabellrad för mognadshalveringen
    (dagens "hälften av 4–7" tvingar fram gissning).
11. **`research.md`:** konvention för delade moment (när delar av ett moment
    avvisas: lista delmomenten som egna poster över/under ribban).
12. **`first-project.md`:** ge Output A en mallplats för sexkriterietestet
    (idag kräver steg 2 testet men formatet saknar plats — Buildern kör
    detta verbatim och får oförutsägbar output).

### Struktur (inte kod)

- **Integrationer (Fas 3) bekräftade som vallgraven** — klistra in/ut mot
  Mailchimp/Bokinfo var den ackumulerande irritationen, men den drev inte
  churn på ett år. Vänta på efterfrågan, precis som strategin säger.
- **Churn-mekaniken att designa mot:** värdet bevisas hos *en* användare
  (utföraren), beslutet fattas av en annan (köparen). Wrapped/tidslinjen är
  bryggan — allt som gör värdet synligt för den som betalar är retention.

## Var detaljerna finns

- `testoutput/forlaget-blaklint/` — hela pipelinekörningen + simuleringens
  månadsdagbok, friktionslogg (12 punkter) och churn-bedömning.
- Relaterat: `docs/roadmap-anvandarvarde-2026-07-17.md` (etapp 0–4, byggda),
  `docs/m2-backend-spec.md` (M2b-nedbrytningen som simuleringen stärker).
