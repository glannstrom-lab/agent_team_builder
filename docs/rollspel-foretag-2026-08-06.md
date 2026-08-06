# Rollspel: Patrik, 51, delägare i redovisningsbyrå, Lindesberg (9 anställda)

## Berättelsen (jag-form)

Jag googlar "AI-team bokföringsbyrå" och hamnar på mittaiteam.se. Startsidan
är proffsig — jag ser direkt en "Bokföringsbyrå"-länk under "Branscher".
Innan jag tittar på pris scrollar jag till FAQ:n om GDPR (index.html:486).
Den säger att med egen nyckel går allt "direkt mellan er webbläsare och
AI-leverantören" och att jag "äger min data på riktigt". Bra formulerat.
Men den nämner ingen modell och inget land.

Jag läser vidare i villkor.html §3 (rad 143–145) och där står det: motorn är
"språkmodellen DeepSeek V4 Flash, som nås via tjänsten OpenRouter". Jag
googlar DeepSeek på min lunch och hittar att det är en kinesisk AI-lab. Det
står ingenstans på hela sajten — varken i FAQ, i integritetspolicyn eller i
villkoren. Integritetspolicyn (integritet.html:219–223) säger bara att
"Vill du veta i vilket land modellen körs anger OpenRouter det per
leverantör — läs det innan du matar in något känsligt." Det är kunden själv
som ska gräva fram det. För en byrå som hanterar kunders bokföring är det
inte en fotnot, det är hela frågan. Jag skickar länken till vår IT-
leverantör och han svarar samma dag: "Var går datat, vem är
personuppgiftsbiträde, finns DPA — annars nej."

Jag öppnar bokföringsdemot (accountant.js). Teamet heter "Lindgren
Bokföring" och är byggt för en trepersonersbyrå med tre agenter — vi är nio.
Skalningsreglerna (docs/scaling.md) säger att ett "litet team (3–10)" ska
få 4–7 agenter, så demot representerar knappast oss. Jag noterar också att
teamfilen anger `defaultModel: "claude-opus-4-8"` (accountant.js:12) — men
atb-claude.js säger uttryckligen att modellvalet ignoreras och att allt körs
på DeepSeek (atb-claude.js:28, 88–90). Två olika svar om vilken leverantör
som faktiskt hanterar datan är precis det som skulle få vår IT-leverantör
att tacka nej.

Jag tittar på 4 990 kr-nivån. Villkor §4 (rad 220–223) lovar "faktura med
15 dagars betalningsvillkor" — perfekt, det kan jag bokföra och dra av. Men
när jag följer knappen "Spara i molnet" i Buildern ser jag att det bara
finns två köpbara nivåer: engångsköpet och en provmånad (builder.js:1026–
1029), båda via Stripe Checkout med kortbetalning direkt (stripe-
webhook.js:49: "kort är enda betalsättet"). Ingen faktura-väg syns i själva
flödet. Och "490 kr i månaden — vi kör det åt er" som står framträdande på
prissidan (index.html:380) finns inte alls i Stripes nivålista
(_stripe.js:99–102) — den kräver en proxy som enligt kodkommentaren
"inte är byggd".

Sist: vi är nio. Jag letar efter hur mina kollegor loggar in. Databasen har
en `team_access`-tabell med roller `owner`/`member` (0002_auth.sql:69–76),
så tekniskt är det tänkt. Men det finns ingen "bjud in"-knapp någonstans i
koden, och provisioneringsskriptet (provision.mjs:66–74) skapar bara
`owner`-rader — för hand, av Mikael, en kommandorad i taget. Att lägga till
åtta kollegor betyder åtta mejl till leverantören, inte ett klick i
portalen.

## Friktionspunkter

| Var | Vad som händer | Allvarlighetsgrad | Fil:rad | Förslag |
|---|---|---|---|---|
| Datans destination | Modellen (DeepSeek) är kinesisk; det nämns ingenting om Kina/tredjelandsöverföring bortom Cloudflare/Google (USA) | Blockerande | integritet.html:207–223, 308–316; villkor.html:143–145 | Skriv rakt ut vilket land DeepSeek-anropen körs i, eller vilket avtal (SCC) som gäller för OpenRouter→DeepSeek |
| "Vi sköter allt" 490 kr/mån | Marknadsförs som ett aktivt köpalternativ men finns inte i Stripes nivåer | Allvarlig | index.html:374–385; functions/api/_stripe.js:95–102; builder/builder.js:1026–1029 | Märk kortet "öppnar senare" som redan görs för 190 kr-nivån (index.html:332–336) |
| Faktura vs. kortbetalning | Villkor lovar faktura/15 dagar, men köpflödet är Stripe Checkout med kort, ingen fakturaväg syns | Allvarlig | villkor.html:220–223; functions/api/checkout.js (hela filen); functions/api/stripe-webhook.js:49 | Förtydliga att självbetjänings-nivåerna är kort, faktura endast vid offert |
| Flera användare | `team_access` stödjer roller i databasen, men ingen inbjudningsfunktion finns i UI eller API | Allvarlig | migrations/0002_auth.sql:63–77; scripts/provision.mjs:66–74 | Antingen bygg en enkel inbjudningsrutt, eller skriv tydligt att fler platser sköts manuellt av leverantören |
| Inloggningskoder | Standardläget skickar mejl via Resend, men enligt CLAUDE.md är avsändartjänsten ännu inte konfigurerad — kod kan då hamna bara i serverloggen | Blockerande (tills mail är satt upp) | functions/api/auth/_lib.js:210–222; functions/api/auth/request.js:73–79 | Verifiera mailleverans innan första riktiga kund loggar in |
| Demoteamets storlek | Bokförings-demot (Lindgren Bokföring) är byggt för 3 anställda, inte 9 | Skav | portal/teams/accountant.js:1–9; docs/scaling.md:9–14 | Notera på branschsidan att demot är ett exempel på en mindre byrå |
| Motsägande modelluppgift | Teamfilen påstår `claude-opus-4-8`, motorn kör faktiskt DeepSeek | Skav (blir allvarlig om IT-leverantören läser filen) | portal/teams/accountant.js:12; atb-claude.js:28, 88–90 | Uppdatera `defaultModel`-fältet i genererade team eller ta bort det |
| Känslig data i löneflödet | Agentens egna rutiner (lönevecka) rör personaldata, samtidigt som policyn ber kunden undvika personnummer helt | Skav | integritet.html:136–152; portal/teams/accountant.js (löneveckans rutin) | Påminn agenten/kunden explicit i löneflödet om att maskera personnummer |

## Frågor jag ställde som ingen på sajten svarar på

- I vilket land/på vilka servrar körs DeepSeek V4 Flash faktiskt, och vilket
  dataskyddsavtal gäller för den överföringen?
- Om jag väljer "vi sköter allt" för 490 kr/mån — går det att köpa idag, och
  om inte, när?
- Får jag en riktig svensk faktura med moms och org.nr, eller bara ett
  Stripe-kvitto?
- Hur lägger jag till mina åtta kollegor som egna inloggningar, och vad
  kostar en extra plats konkret?
- Om vår byrå har 9 anställda — vilket team (hur många agenter) hade vi
  faktiskt fått, inte det demoteam som är byggt för tre?

## Det här skulle stoppa affären

- Ingen tydlig uppgift om att modellen (DeepSeek) är kinesisk och vilket
  regelverk som skyddar överföringen dit — vår IT-leverantör säger nej
  direkt på den punkten, före pris.
- Att "vi sköter allt"-nivån som säljs på förstasidan inte går att köpa.
- Att inloggningskoder till kontot kan utebli om mejlleveransen inte är
  klar (funktionellt blockerande för att överhuvudtaget komma in i det
  köpta kontot).
- Ingen självbetjänad väg att ge nio anställda var sin inloggning trots att
  databasen är byggd för det.

## Sammanfattning till Mikael

De fem viktigaste fynden ur Patriks resa:

1. **Datans destination är otillräckligt tydlig.** DeepSeek V4 Flash (via
   OpenRouter) är en kinesisk modell, men det nämns aldrig i klartext på
   sajten (integritet.html:207–223, villkor.html:143–145) — bara att
   "OpenRouter anger land per leverantör" om kunden själv letar. För en
   redovisningsbyrå med sekretessbelagd kunddata är det den första frågan
   en IT-leverantör ställer, och den besvaras inte.
2. **"Vi sköter allt" för 490 kr/mån marknadsförs men går inte att köpa.**
   Stripe-nivåerna (functions/api/_stripe.js:95–102) innehåller bara
   engångsköpet och provmånaden — den nyckelfria/hostade nivån kräver en
   proxy som enligt kodens egna kommentarer inte är byggd.
3. **Fakturalöftet i villkoren matchar inte köpflödet.** Villkor.html
   lovar faktura med 15 dagars betalningsvillkor, men den faktiska vägen
   (Builder → "Spara i molnet" → Stripe Checkout) tar kort direkt, ingen
   faktura syns i flödet.
4. **Flera användare är en databastabell, inte en funktion.** `team_access`
   stödjer roller, men det finns varken en inbjudningsknapp i portalen
   eller ett sätt att lägga till en `member` — bara ett manuellt skript som
   skapar `owner`-rader, körd av Mikael själv.
5. **Inloggningskoden kan utebli.** Om avsändartjänsten (Resend) inte är
   konfigurerad hamnar koden bara i serverloggen — enligt projektets eget
   lägesdokument är det ännu inte klart, vilket gör att en kund som köper
   idag riskerar att inte kunna logga in i det konto hen just betalat för.

Slutsats: kärnprodukten (teamgenerering, agenter, portal) är genomarbetad
och ärlig om sina begränsningar där den väl är byggd. Men själva
köp-till-konto-resan för en B2B-kund med säkerhetskrav har tre öppna hål
(datans land, betalvägen, flera användare) som en person som Patrik skulle
hitta inom en timme — och som skulle få hans IT-leverantör att säga nej
innan priset ens diskuteras.
