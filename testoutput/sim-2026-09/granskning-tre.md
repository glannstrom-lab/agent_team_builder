# Faktagranskning: tre kunder, september–oktober 2026

Granskat 2026-09-26: `bygg`, `redovisning`, `larare` (`transkript.md`, `dagbok.md`, `persona.md`, `anrop.jsonl`).

**Verdikt för dagbokens påståenden:**
- **BEKRÄFTAT**: AI-svaret säger det som dagboken påstår.
- **FEL CITERAT**: svaret säger något annat.
- **ÖVERDRIVET**: kärnan stämmer men beskrivningen går längre än svaret.

**Verdikt för kundagentens "rätta svar":** RÄTT / FEL / DELVIS, kontrollerat mot källan som länkas. "(sekundär)" betyder att primärsidan inte gick att hämta och att uppgiften bygger på en sekundär källa eller en sökträffs sammanfattning.

---

## 1. Bygg (Jonas Bergström)

### 1a. Dagbokens påståenden

| # | Påstått fel | Verdikt | Citat ur transkriptet | Rätt enligt källa |
|---|---|---|---|---|
| 1 | Veckostart ber om inbox/CRM, "till Jonas" i tredje person | BEKRÄFTAT | "åtkomst till er inbox/CRM" · "statusöversikt till Jonas för godkännande" | – |
| 2 | ÄTA: "Jonas [Efternamn]", "gjutning", ingen ROT/moms, ingen tidspåverkan | BEKRÄFTAT | "Ny gjutning av golvbrunnsfundament" · "Jonas [Efternamn]" · "18 000 kr (inklusive material och arbetskraft)" | – |
| 3 | "gjuta" står kvar, ROT-räkningen rätt | BEKRÄFTAT | "gjuta nytt fundament" · "ROT‑avdrag på 3 600 kr, så ni betalar 14 400 kr" | 30 % av arbetskostnaden: RÄTT ([Skatteverket](https://www.skatteverket.se/foretag/skatterochavdrag/rotochrut/safungerarrotavdraget.4.2ef18e6a125660db8b080002709.html)) |
| 4 | Offert 1: 15 frågor, "Schluter-Kernsystem", "annan avdragsnivå", "FÖR GRANSKAP", "[Din namn]", Word/PDF/Fortnox | BEKRÄFTAT | "Schluter‑Kernsystem" · "eller har du en annan avdragsnivå?" · "märkta **“FÖR GRANSKAP”**" · "[Din namn]" | Systemet heter Schluter-KERDI. |
| 5 | Offert 2: påhittat org.nr, "kundens organisationsnummer", period, 30 % förskott, "färdigställt Word och PDF", "skicka till Nyström", ROT på UE-arbete saknas | BEKRÄFTAT | "Vår organisationsnummer: 556123‑XXXXX" · "Kundens organisationsnummer: [fyll i]" · "30 % vid orderbekräftelse" · "Jag har nu färdigställt både offert‑dokumentet (Word) och ROT‑ansökningsbrevet (PDF)" · "2. Skicka offerten till familjen Nyström." | Räkningen stämmer (78 375 / 179 063 / 23 513 / 155 550). |
| 6 | Lead: "gått igenom vår offert", "nästa vecka", 070-nummer, 2,2–2,9 Mkr, "erfarenhet av större BRF-projekt", ROT för BRF | BEKRÄFTAT | "Tack för att du gått igenom vår offert" · "ringa mig på 070‑123 45 67" · "ungefär 2,2 – 2,9 Mkr inkl. moms, före ROT‑avdrag. ROT kan minska arbetskostnaden med 30 %" · "Vi har erfarenhet av större BRF‑projekt" | En BRF som beställer och betalar får inte ROT, eftersom bara fysiska personer omfattas: RÄTT (sekundär: [Svensk Byggtidning 2026-03-04](https://www.svenskbyggtidning.se/2026/03/04/brfer-och-rot-avdrag-i-samband-med-stambyten/); primär: [Skatteverket rättslig vägledning, bostadsrätt](https://www4.skatteverket.se/rattsligvagledning/edition/2025.1/1912.html) blockerades vid hämtning). Nyans: enskilda medlemmar kan få ROT för arbete i den egna lägenheten som de själva betalar. |
| 7 | Rutin ber om faktura-tabell fast Petersson står i minnet | BEKRÄFTAT | "Vänligen ge mig följande uppgifter för varje försenad faktura" (Petersson fanns i systemprompten enligt `anrop.jsonl`) | – |
| 8 | Petersson-mejl: hakparenteser, språkfel, inget om följder | BEKRÄFTAT (underskattat) | "fortfarande vara obetald". Svaret har cirka 11 platshållare, inte 7. | – |
| 9 | Veckostart v41 nästan ordagrant samma | BEKRÄFTAT | Samma tre rader (Lead, Offert, ROT-ansökningsbrev) och samma slutmening | – |
| 10 | Möte: "≈570 kr/h inkl moms", 4 500 h, "350 tkr per bad", ROT för BRF, 400 h, "projektplan i Fortnox" | BEKRÄFTAT | "timtaxa (≈ 570 kr/h inkl. moms) krävs ≈ 4 500 h" · "tätskikt + kakel ≈ 350 tkr per bad (exkl. ROT). ROT‑avdrag på 30 % ger 105 tkr per bad" · "ca 400 h arbete" · "Uppdatera projektplanen i Fortnox" | 595 × 1,25 = 744 kr inkl. moms. BRF-ROT fel som i rad 6. |
| 11 | "Ja – det går" utan helgdagar, stambytesfirmans takt, tror att Karlsson/Eva pågår i mars | BEKRÄFTAT | "4 månad × 4 veckor × 40 h/vecka = 640 h per man" · "Ja – det går" · "Badrum Karlsson … – saknar uppskattad tid" (räknas in i vårens buffert) | – |
| 12 | Eva-sms: "Jag hörde att", "leverantörens fel" | BEKRÄFTAT | "Jag hörde att köksluckorna blir två veckor försenade" · "Det är leverantörens fel" | – |
| 13 | Påminnelseavgift "vanligtvis 100 kr", "lagstadgad" | BEKRÄFTAT | "Lägg till lagstadgad **påminnelseavgift** (vanligtvis 100 kr)" | Max 60 kr, och bara om det avtalats senast när skulden uppkom (2 och 4 §§ lag 1981:739): RÄTT ([riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1981739-om-ersattning-for-inkassokostnader_sfs-1981-739/)). Referensränta + 8 procentenheter (räntelagen 6 §): RÄTT (ej hämtad). Att Jonas själv kan skicka inkassokrav och ta 180 kr (3–4 §§): RÄTT. |
| 14 | Ali sjuk: fel vecka, sms "Till Jonas (intern)", skjuter Karlsson, "skjutsar", "Hej Karlsson!" | BEKRÄFTAT | "Prioritering för veckan 2026‑10‑05 – 2026‑10‑09" · "**1. Till Jonas (intern):**" · "skjutsar vi kaklet" · "Kan skjutas upp några dagar" | Minnet säger "Klart ca v 43". |
| 15 | Omtag: svarar inte på "sen?" | BEKRÄFTAT | Svaret innehåller bara två sms | – |
| 16 | Timpris: påhittad "branschstatistik 2024", "Ingen risk", motsägelse, text till Nyström | BEKRÄFTAT | "(enligt branschstatistik 2024)" · "**Ingen risk** för att förlora kunder" · "projekt som påbörjas **innan 1 jan 2027**" kontra "nya priser gäller bara för avtal som skrivs efter nyår" | – |
| 17 | Mall: "ÄTA ger ingen extra ROT", förskott, bortforsling "ingår inte", påhittat org.nr/tfn/mejl, "BKR 2 år", "FÖR GRANSKAP" | BEKRÄFTAT | "tilläggsarbete ger ingen extra ROT‑reducering" · "Flytt, städning eller bortforsling av byggavfall" · "Telefon: 010‑123 4567" · "Garantier enligt BKR‑certifiering för våtrum gäller 2 år" | ÄTA är arbetskostnad och ger ROT: RÄTT (samma Skatteverket-sida). Att BKR inte ger garanti: RÄTT i sak. Se också missat fel 1. |
| 18 | Rättad mall: dolda skador saknas, "badrumsmöbler", "innergård", mejlen kvar | BEKRÄFTAT | "Specialdesignade möbler eller inredning (t.ex. badrumsmöbler…)" · "väggar/innergård" · "E‑post: info@bergstromsbygg.se" | – |
| 19 | IKEA-kök: 150–200 tkr, interna timpriser, 070-nummer, inget hembesök, "FÖR GODKÄNNANDE" | BEKRÄFTAT | "brukar våra arbetskostnader hamna omkring **150 – 200 tkr inkl. moms**" · "Timpriset … 595 kr/h (Jonas) och 545 kr/h (Ali)" · "**070‑123 45 67**" | – |
| 20 | Veckostart v43: samma tabell, påhittad "Fakturahanterings-agent", 🚀 | BEKRÄFTAT | "*Fakturahanterings‑agent* (del av teamet)" · "🚀" | – |
| 21 | BKR: "2023", "gjutning", påhittade provningar, "GRC-platta", foton efter kakling, "as-built" | BEKRÄFTAT | "godkänd per sms 2023‑09‑29" · "vattentäthetstest 0‑0,5 % fuktläcka, avstängningsprov 24 h" · "GRC‑platta + våtrumsmatta + lack" · "närbild på tätskiktet på golvet" (utan att säga att fotot tas före plattsättning) | Tätskiktet ska fotodokumenteras innan det täcks, och egenkontroll görs enligt BBV 26:1 (gäller från 2026-01-01): RÄTT ([BKR BBV 26:1](https://www.bkr.se/regler-material/regler/branschregler-bbv26), [BKR kvalitetsdokument](https://www.bkr.se/regler/kvalitetsdokument); fotokravet är bekräftat via sekundärkälla). |
| 22 | Slutfaktura: rörig process, "betalar hela … dras automatiskt", "ROT under momspost", "delar automatiskt", 31 jan saknas | BEKRÄFTAT | "Kunden betalar hela fakturabeloppet (159 475 kr) – ROT‑avdraget dras automatiskt på deras konto av Skatteverket" · "Välj *ROT* under *momspost*" · "Skatteverket delar automatiskt upp" | Begäran görs efter att kunden har betalat och ska ha kommit in senast 31 januari året efter. Fördelningen mellan köparna anges av utföraren: RÄTT ([Skatteverket](https://www.skatteverket.se/foretag/skatterochavdrag/rotochrut/safungerarrotavdraget.4.2ef18e6a125660db8b080002709.html)). Räkningen (122 250 / 36 675 / 196 150 / 159 475) stämmer. |
| 23 | BRF-möte: gränsdragning mot stambytesfirman saknas, "Alis mobilnummer" | ÖVERDRIVET (delvis) | Punkt 4 finns: "Ansvar för el‑/rör‑entreprenör – Vill de att ni samordnar…". Frågan om ansvar vid läckage i golvbrunn och rörgenomföringar saknas. "Ditt och Alis mobilnummer" | – |
| 24 | "Värda 290 kr?": svarar inte, föreslår det han redan gjort, "påminnelseavgift enligt lag", Excel-rapport, väntan | BEKRÄFTAT (väntan underskattad) | "beräkna påminnelseavgift och ränta enligt lag" · "En färdig Excel‑/Word‑rapport". Anropet tog **603 s** enligt `anrop.jsonl`, inte "ett par minuter". | – |

### 1b. Kundagentens egna regelpåståenden

| Påstående | Verdikt | Källa |
|---|---|---|
| ROT 30 % av arbetskostnaden, max 50 000 kr per person och år | RÄTT | [Skatteverket, rotavdrag företag](https://www.skatteverket.se/foretag/skatterochavdrag/rotochrut/safungerarrotavdraget.4.2ef18e6a125660db8b080002709.html) |
| BRF får inget ROT | RÄTT när föreningen beställer och betalar. Medlemmar kan få ROT för egen del. | [Svensk Byggtidning](https://www.svenskbyggtidning.se/2026/03/04/brfer-och-rot-avdrag-i-samband-med-stambyten/) (sekundär) |
| ÄTA-arbete ger ROT | RÄTT | Samma Skatteverket-sida |
| Påminnelseavgift max 60 kr och bara om den avtalats i förväg | RÄTT | [Lag 1981:739](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1981739-om-ersattning-for-inkassokostnader_sfs-1981-739/) 2 och 4 §§ |
| Begäran efter betalning, senast 31 januari, fördelning mellan makar anges | RÄTT | Skatteverket, som ovan |
| Tätskiktsfoton före plattsättning | RÄTT | [BKR BBV 26:1](https://www.bkr.se/regler-material/regler/branschregler-bbv26) |
| "BKR ger ingen garanti" | RÄTT i sak. Det verkliga problemet är konsumenttjänstlagen, se missat fel 1. | – |

### 1c. Missade fel (bygg)

1. **"Garanti … 2 år" i offertmallen** (rad 837) är mer än att BKR inte ger garanti. Konsumenttjänstlagen 17 § ger konsumenten **3 års reklamationsfrist, och 10 år för arbete på byggnader**. En 2-årsgaranti i offerten ger en privatkund en falsk bild av hennes rättigheter ([riksdagen.se, SFS 1985:716](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/konsumenttjanstlag-1985716_sfs-1985-716/)).
2. **"ROT-ansökningsbrev (PDF) Till: Skatteverket / Fortnox"** med "Kundens organisationsnummer" och "Period: November 2026 – Januari 2027" är en dokumenttyp som inte finns. Utföraren begär utbetalning elektroniskt, efter kundens betalning och med köparens personnummer. Felet sitter i teamets rutin ("ROT-ansökningsbrev"), så det återkommer i varje veckostart.
3. **Mötets ROT-siffra** "ROT‑avdrag på 30 % ger 105 tkr per bad" överstiger taket på 50 000 kr per person även om ROT hade gällt. Den är internt omöjlig, inte bara fel för en BRF.

---

## 2. Redovisning (Karin Lindqvist)

### 2a. Dagbokens påståenden

| # | Påstått fel | Verdikt | Citat ur transkriptet | Rätt enligt källa |
|---|---|---|---|---|
| 1 | Veckostart: rutinlista, "namn + e-post", "blockerar bokslut", 🚀 | BEKRÄFTAT | "Lista på kunder (namn + e‑post)" · "Försenade underlag blockerar bokslut" · "🚀" | Se 2b om momsdatum. |
| 2 | Roller ihopblandade, "identifierar bara företaget", "raderas automatiskt", "skickar", "[Ditt namn]" | BEKRÄFTAT | "**VD** \| Verkligt mänsklig beslut‑ och ledningsnivå" · "**VD‑assistent** *(id “vd” i mitt system)*" · "“AB Svensson AB” \| Identifierar bara företaget, inte personer" · "lagras den **endast i minnet** … raderas den automatiskt" · "Skapar och skickar påminnelse‑e‑post" · "**[Ditt namn]**" | Att e-postadressen till en enskild firma är en personuppgift stämmer med GDPR:s definition. "Raderas automatiskt" är osant: samtalen sparas i portalen och skickas till OpenRouter. |
| 3 | Svar avklippt mitt i ord, "säker fildelning", "Vi saknar fortfarande" | BEKRÄFTAT | "för er momsdeklaration (kvitt..." · "vår säkra fildelning (länk)" · "Vi saknar fortfarande några dokument" | `anrop.jsonl` för följdsvaret visar `finish: stop`. Själva det avklippta anropet saknas i loggen (se modellbeteenden). |
| 4 | "lagligt", "bekräfta mottagandet", "5 [månad]" | BEKRÄFTAT | "För att vi lagligt ska kunna deklarera" · "bekräfta mottagandet" · "**senast 5 [månad]**" | – |
| 5 | Outlook-regel på datum, IT-ansvarig, helgarbete, "[VD-namn]", byråkrati | BEKRÄFTAT | "Skapa en Outlook‑regel som triggas på ett specifikt datum" · "(med stöd av IT‑ansvarig)" · "Helgen \| Samla in tid‑uppskattning" · "[VD‑namn]" · "signerat godkännande‑dokument" | Outlook-regler reagerar på meddelanden, och agenten medgav det själv. |
| 6 | Fackord, "ingen extra kostnad", "2 h/vecka", "[VD-namn]" | BEKRÄFTAT | "Finns i de flesta Microsoft‑365‑licenser (ingen extra kostnad)" · "Sanna och du har redan tid avsatt (ca 2 h/vecka)" | Licenspåståendet är sannolikt rätt för M365 Business med standardkopplingar, men ej kontrollerat. "2 h/vecka" är påhittat. |
| 7 | Veckostart v41 samma, momsen 12/10 saknas, "2026-10-10", 🚀, "granskad-av-människa" | BEKRÄFTAT | "Önskad påminnelsedate (t.ex. 2026‑10‑10)" · "“granskad‑av‑människa”-stämpel. 🚀" | Se 2b: 12/10 är augustimomsen, inte septembers. |
| 8 | Påhittad Sanna-adress, "2024-10-02", "7-oct" | BEKRÄFTAT | "mejla dem till sanna@lindqvistredovisning.se" (utan hakparentes) · "2024‑10‑02 (förra veckan)" · "7‑oct" | – |
| 9 | Representation: 50 %, ~115 kr moms, konton, "låt er redovisningskonsult" | BEKRÄFTAT | "50 % av kostnaden (dvs. 725 kr) får dras av" · "50 % av den ingående momsen (dvs. ca 115 kr)" · "konto 6070 – Representation, 2641" · "låter er redovisningskonsult gå igenom" | Lunch och middag är inte avdragsgilla. Moms får lyftas på högst 300 kr exkl. moms per person: RÄTT, 3 × 36 = 108 kr ([Skatteverket](https://www.skatteverket.se/foretag/moms/kopavarorochtjanster/representation.4.15532c7b1442f256baec84b.html)). |
| 10 | "§ 9–12", 483 kr inkl. moms, "senaste lagstiftningen" | BEKRÄFTAT | "(se Skatteverkets huvudregler för representation, § 9‑12)" · "1 450 kr ÷ 3 ≈ 483 kr per person" · "Vår svargenerering baseras på den senaste lagstiftningen" | 1 294,64 / 3 = 431 kr exkl. moms: RÄTT. |
| 11 | Nyhetsbrev: påhittade nyheter, workshop, Outlook-löfte, presentkort, 15 dec, emojis | BEKRÄFTAT | "**Ny förenklad årsredovisning för mikro‑företag** (Skatteverket)" · "Skatten på bensin har höjts 0,5 kr/liter" · "12 november bjuder vi in till en kort digital workshop" · "Exempel: presentkort" · "senast **15 december**" | Påståendet om presentkort är **FEL** (se 2b). Att årsredovisningsregler inte beslutas av Skatteverket: RÄTT. |
| 12 | Rensat brev: tom nyhetsrubrik, Sanna-rad, "5 dagen", kontorsmaterial | BEKRÄFTAT | "Vi har inga specifika branschnyheter att rapportera" · "Sanna fortsätter att skicka personliga påminnelser" · "**5 dagen** i den följande månaden" | Se missat fel 3. |
| 13 | Veckostart v42 samma, momsdag saknas, "enbart i minnet", 🚀 | BEKRÄFTAT | "behandlas enbart i minnet" · "🚀" | – |
| 14 | Policy: Datainspektionen, FAR-behörighet, VPN, bara M365, långt | BEKRÄFTAT | "eventuellt med Datainspektionen" · "Endast konsulter med **FAR‑behörighet**" · "(Johan, Karin eller Birgitta)" · "utanför vår företags‑VPN" · "Endast Microsoft‑365‑konton" | IMY sedan 2021-01-01: RÄTT ([imy.se](https://www.imy.se)). |
| 15 | Kort policy: "ChatGPT via företags-Microsoft-konto", "endast Karin", IMY som egen punkt, "våras" | BEKRÄFTAT | "(t.ex. ChatGPT via vårt företags‑Microsoft‑konto)" · "(endast Karin)" · "**Datainspektionen** – … heter numera **IMY**" · "våras integritet" | – |
| 16 | Möte: vägran, tredje person, "påbörja policy", påminnelseagent som ägare, nyhetsbrev "får vänta" | BEKRÄFTAT | "Jag kan inte hjälpa till med den begäran." · "under övervakning av Karin" · "Påbörja policy‑skrivandet" · "**paminnelse‑agent** (ansvarar för att påminna gruppen…)" · "Nyhetsbrev‑automation med AI" | – |
| 17 | Gymkort: rätt slutsats, påhittade källor, "privat försäkring" | BEKRÄFTAT | "(Skatteverket, 2024‑03)" · "avsnitt 1.1" · "https://www.skatteverket.se/…" · "via din privata försäkring/arbetsgivare" | Egen friskvård är privat levnadskostnad för en enskild näringsidkare: RÄTT. |
| 18 | Utvärdering: "6 %", "1 h per 40 mejl", "3 samtal/vecka" | BEKRÄFTAT | "(≈ 6 % av hennes månadstid)" · "ca **1 h** per 40 mejl" · "minst 25 % (≈ 3 samtal/vecka)" | 25 % av 12 per månad är 3 per **månad**. Räkningen 38 × 3,5 = 133 min stämmer. |
| 19 | SMS: fel månad, Sanna-adress, CRM, emojis | BEKRÄFTAT | "Vi saknar dina septemberkvitton … senast 5 okt … (12 okt)" · "sanna@lindqvistredovisning.se" · "notera i CRM" · "🎧🚗 (Inga emojis i meddelandet – bara i intern instruktion.)" | Kundagentens "rätta" datum är också fel för månadsmoms (se 2b). |
| 20 | Talmanus: passerade datum, "tillsammans med VD", IT, Birgitta på telefon, "anonymiserade data", väntan | BEKRÄFTAT | "Jag (tillsammans med VD) \| 10 oktober" · "Workshop … \| 18 oktober" · "Johan (med stöd av IT)" · "Sanna + Birgitta" · "Alla AI‑processer körs med anonymiserade data" | Väntan: anropet tog 605 s enligt `anrop.jsonl`. |
| 21 | Mobil: påhittad 50 %-regel, "30 %-regeln", "kapitel 10.5", konton | BEKRÄFTAT | "begränsas avdraget dessutom till **max 50 %** av den ingående momsen (Skatteverket, 2023‑04)" · "**30 %‑regeln** (kapitel 10.5 i inkomstskattelagen)" · "konto 7830" | Momsen fördelas efter faktisk användning: RÄTT ([Skatteverket](https://www.skatteverket.se/foretag/moms/kopavarorochtjanster/kopavarorellertjanstertillforetaget.4.7459477810df5bccdd480005156.html)). Se 2b för resten. |

### 2b. Kundagentens egna regelpåståenden

| Påstående | Verdikt | Källa |
|---|---|---|
| Måltidsrepresentation: inget inkomstavdrag sedan 2017, moms på högst 300 kr exkl. moms per person | RÄTT | [Skatteverket, representation](https://www.skatteverket.se/foretag/moms/kopavarorochtjanster/representation.4.15532c7b1442f256baec84b.html) |
| **Julgåva skattefri upp till 500 kr inkl. moms** | **FEL för 2026.** Gränsen är **600 kr** inkl. moms för inkomstår 2026 och var 550 kr för 2025. | [Skatteverket, gåvor](https://www.skatteverket.se/privat/skatter/arbeteochinkomst/formaner/gavor.4.7459477810df5bccdd4800014379.html) |
| **Presentkort är kontantliknande och inte skattefria** | **FEL.** "Presentkort som inte kan bytas mot pengar kan däremot vara en skattefri gåva." Bara presentkort som kan lösas in mot pengar är skattepliktiga. | Samma sida |
| Friskvårdsbidrag 5 000 kr | RÄTT | [Skatteverket, friskvård](https://www.skatteverket.se/privat/skatter/arbeteochinkomst/formaner/personalvardmotionochfriskvard.4.7459477810df5bccdd4800014540.html) |
| **Momsen den 12 oktober för septemberunderlag** (minnet, rutinfrågan 5/10, SMS-rättelsen) | **FEL för månadsmoms ≤ 40 Mkr.** Deklarationen ska lämnas den 12:e i **andra** månaden efter perioden. Septembermomsen ska in **12 november**, och 12 oktober gäller augusti. Kvartalsreglerna i minnet stämmer. | [Skatteverket, när ska jag deklarera moms](https://www.skatteverket.se/foretag/moms/deklareramoms/narskajagdeklareramoms.4.6d02084411db6e252fe80008988.html) |
| Mobil 12 000 kr kan kostnadsföras direkt (under halvt prisbasbelopp) | DELVIS. 9 600 kr exkl. moms ligger under 29 600 kr (halvt prisbasbelopp 2026), så direktavdrag gäller, men bara för den del som används i verksamheten när användningen är blandad. | [Skatteverket, värdeminskning](https://www.skatteverket.se/foretag/drivaforetag/foretagsformer/enskildnaringsverksamhet/avdragforvardeminskning.4.361dc8c15312eff6fd32110.html) · prisbasbelopp 59 200 ([Wolters Kluwer](https://www.wolterskluwer.com/sv-se/expert-insights/basbelopp), sekundär) |
| "50 %-regeln gäller leasing av personbil" | RÄTT (ML) | Allmänt känd regel, ej hämtad |
| "Kunden hade tappat 1 200 kr i moms" | DELVIS. Stämmer bara vid 100 % användning i verksamheten. Vid blandad användning är rätt avdrag lika med verksamhetsandelen av 2 400 kr. | Som ovan |
| Datainspektionen heter IMY | RÄTT | [imy.se](https://www.imy.se) |

### 2c. Missade fel (redovisning)

1. **Julgåvobeloppet i nyhetsbrevet är fel.** Båda utkasten säger "upp till 500 kr inklusive moms". För 2026 är gränsen 600 kr. Modellen upprepade kundens föråldrade siffra i ett brev till 140 kunder. (Karin har samma fel, så det upptäcktes inte.)
2. **Momsdatumen genom hela månaden.** Modellen skrev "deklarera momsen för september i tid (deadline 12 okt)" till Kund A. För en frisör med månadsmoms under 40 Mkr är det fel månad. Samma fel finns i SMS-mallen.
3. **Den "rättade" presentkortsmeningen är nu fel i det skarpa brevet.** "(Presentkort räknas som kontantliknande och är därför inte skattefria.)" Modellen accepterade kundens felaktiga rättelse utan invändning och skrev in den i utkastet som ska skickas.

---

## 3. Lärare (Anna Ek)

### 3a. Dagbokens påståenden

| # | Påstått fel | Verdikt | Citat ur transkriptet | Rätt enligt källa |
|---|---|---|---|---|
| 1 | Veckostart generisk, "nedsläckt närvaro", "i Schoolsoft" | BEKRÄFTAT | "tidig insats mot nedsläckt närvaro" · "genererar en “Frånvarouppföljnings‑mall” i Schoolsoft" | – |
| 2 | Fyra påhittade kriterier, "C‑"/"E‑", "A-E eller 1-5", betyg ur kryss, Selenium | BEKRÄFTAT | "de fyra betygskriterierna i Svenska 1" · "**C‑**" · "(t.ex. A‑E, eller endast 1‑5?)" · "(t.ex. 3 E‑ → C‑, 2 E + 2 C‑ → B‑ etc.)" · "Selenium/WebDriver" | Svenska 1 har löpande text per E/C/A, och D och B definieras som "kraven för E och till övervägande del för C": RÄTT ([Skolverket SVESVE01](https://syllabuswebb.skolverket.se/syllabuscw/jsp/knowledgeReq.pdf?subjectCode=SVE&courseCode=SVESVE01&version=7)). Se också missat fel 2. |
| 3 | Språkfel, APA, erkänner inte felet | BEKRÄFTAT | "Försök att åtminstone ett kort motargument" · "håll dig till den ramverket" · "hopkokade" · "(t.ex. APA)" | Att APA är "överkurs" är Annas bedömning, inte en regel. Kriteriet kräver bara "grundläggande regler för citat- och referatteknik". |
| 4 | Inget utkast, "2024-09-15", Schoolsoft-skript | BEKRÄFTAT | "\| **Datum för varningen** … \| 2024‑09‑15 \|" · "Generera ett exempel‑skript för Schoolsoft" | – |
| 5 | "närvaro … understigit 20 %", instruktionen inklistrad, "[elevens]" | BEKRÄFTAT | "**[elevens]** närvaro i mentorsklassen har understigit 20 %" · "Jag vill absolut inte låta anklagande" · "hjälpa **[elevens]** vidare" | – |
| 6 | Lektionsplan: SA3c-datum/4 sidor, 5 min × 31, "C-nivå", "Skapad 26 sep", "Circulera" | BEKRÄFTAT | "revidera din argumenterande text till minst **4 sidor**" · "senast **fredag 9 okt**" · "(5 min per elev, i smågrupper)" på 20 min · "**C‑nivå (enligt Gy11)**" · "*Skapad 26 sep 2026*" · "Circulera" (två gånger) | – |
| 7 | "Ja … räknas inte som personuppgifter", ingress som leder fel missas, "en studie", "konkreta påstående" | BEKRÄFTAT | "Ja – så länge texten inte innehåller någon identifierande information … räknas den inte som “personuppgifter”" · "en studie som visar" · "**konkreta påstående**" | Ett utdrag kan vara identifierbart genom sitt innehåll. Frågan gäller också skolans avtal och huvudmannens riktlinje: RÄTT. |
| 8 | Formulär: "fredag 4 okt", fel kurser, frånvarodagar, "konfidentiella" | BEKRÄFTAT | "Fyll i formuläret senast **fredag 4 okt**" · "(Svenska 1, Svenska 2, Historia 1, …)" · "Få ett A i Svensk‑2" · "Dina svar är konfidentiella" | 4/10/2026 är en söndag. Att myndiga elever själva bestämmer om vårdnadshavare är med: RÄTT (vårdnaden upphör vid 18). |
| 9 | Tvåveckorsplan: fel period och veckodagar, samtal v1, essäer före inlämning, 4 h/dag, "15/31", "8 essäer", ställa in lektioner | BEKRÄFTAT | "**Period:** 30 sep – 13 okt 2026" · "senast fredag 7 okt" · "fredag 13 okt" · "Målet är att nå 15/31 senast fredag" · "4 h = ca 8 essäer per dag" (i ett block 14:30–16:30) · "minska lektionerna med 1‑2 lektioner" | 7/10 är en onsdag och 13/10 en tisdag. Se också missat fel 3. |
| 10 | Läsmall: påhittad kriteriesammanfattning, IMRaD, 9 delar, punktlista, språkfel | BEKRÄFTAT | "(… tydlig frågeställning, metod, källkritik …)" · "(inledning, metod, resultat/analys, diskussion, slutsats)" · "använd **punktlista**" · "**hämtad datum**" · "tematiskt kodning" | Svenska 3:s kriterier betonar att samla, sovra och sammanställa information, citat- och referatteknik och texter anpassade till mottagaren. "Metod" finns inte: RÄTT ([Skolverket SVESVE03](https://syllabuswebb.skolverket.se/syllabuscw/jsp/knowledgeReq.pdf?subjectCode=SVE&courseCode=SVESVE03&version=3)). "Vedertaget referenssystem" står inte i kriterierna, så där är kundagenten DELVIS rätt. |
| 11 | Veckostart v42 samma, påhittat "fredag 14 okt" | BEKRÄFTAT | "(t.ex. “innan fredag 14 okt”)" (14/10 är en onsdag). Utvecklingssamtalen fanns i systemprompten men nämns inte. | – |
| 12 | Möte: motsägelser, "lagkrav", "juridiskt bindande", 5 min/essä, admin som ägare, "Alla perspektiv i linje" | BEKRÄFTAT | "Detta är ett lagkrav" · "De är redan bokade och juridiskt bindande" · "(max 5 min/essä)" · "**Kommunikation & administrations‑agent**" som ägare av essärättningen · "Påbörja på onsdag morgon … (senast tis‑ons morgon)" · "Alla perspektiv är i linje" · "**Höstlovet** får du skjuta upp" | Se 3b. |
| 13 | Historia v1: "citerat" innehåll, "fredag 9 okt", 800–1000 ord, engelska som modersmål, påhittade källor, "Skapad 26 sep" | BEKRÄFTAT | "**Deadline:** **fredag 9 okt** … separerat i History‑plattformen" · "stödmaterial på modersmål (sammanfattning på engelska)" · "en fabrikschef (år 1880) och en kvinnlig fabriksarbetare (år 1880)" | Centralt innehåll: "Industrialisering och demokratisering under 1800- och 1900-talen … migration": RÄTT (Skolverket via sökning, [ämnesplan HIS](https://syllabuswebb.skolverket.se/subject/HIS/10/pdf)). |
| 14 | Historia v2: tre lektioner i v45, examination samma dag som genomgången, emigration 1900–1914, dari-löfte, "Strukturskämmning" | BEKRÄFTAT | "v45 – Lektion 3", "v45 – Lektion 4", "v45 – Lektion 5" · "fred 13 nov \| **Slutlig lektion**" och "fred 13 nov \| **Examination**" · "Sverige → Amerika (1900‑1914)" · "**Strukturskämmning**" | Att den stora utvandringsvågen låg 1860- till 1890-talet: RÄTT (allmän historisk kunskap, topparna 1867–69 och 1880-talet; ingen primärkälla hämtad). |
| 15 | Classroom: "Ha en bra vecka!" på fredag | BEKRÄFTAT | "Ha en bra vecka!" | – |
| 16 | F-varning: "60 %", "låg närvaro", påhittat stöd utan hakparentes, 2024-datum, "Mentorslärare", myndighetston | BEKRÄFTAT, men delvis **FEL CITERAT** | "Efter‑lektion‑handledning – måndagar 13‑15" står utan hakparentes. Men "studieteknik" står **inne i** en hakparentes: "[Ytterligare åtgärd – t.ex. “Delta i minst två obligatoriska lektioner i studieteknik”]". "60 %" och "låg närvaro" är också hakparentes-exempel. | Betyg sätts mot kriterierna, och saknas underlag på grund av frånvaro sätts inget betyg: RÄTT ([Skolverket, frånvaro](https://www.skolverket.se/styrning-och-ansvar/regler-och-ansvar/ansvar-i-skolfragor/franvaro-i-skolan)). |
| 17 | Veckoplan: 2 nov-slutsatsen motsäger tabellen, fel veckodagar i november, "be en kollega" | BEKRÄFTAT | "du kan ändå leverera hela återkopplingen senast **måndag 2 nov**" samtidigt som tabellen fördelar essäer till "Ons 12 nov" · "Tis‑ons 3–5 nov" · "Tis‑ons 9–11 nov" | 5/11 är en torsdag, 9/11 en måndag, 12/11 en torsdag. |
| 18 | Uppföljningsmejl bra. Väntan "nästan tolv minuter". | Mejlet BEKRÄFTAT. Väntan **ÖVERDRIVET**. | "Mentorslärare, SA2b" · "fortsatt framsteg". Anropet tog 603 s (cirka 10 min). | 20/11/2026 är en fredag, som dagboken säger. |
| 19 | "Vad får jag": påhittade löften, ChatGPT-påstående, F-varningar v45, betygschecklista | BEKRÄFTAT | "levereras varje vecka på ert schema (t.ex. måndag kl. 08:00)" · "Vi granskar varje levererat utkast … (Gy11, GDPR)" · "färdigt utkast inom 24 h" · "(du har 2 h att svara)" · "Gratis‑ChatGPT lagrar inte någon kontext" · "**v. 45** … Säkerställer att du uppfyller deadline (30 okt.)" | – |

### 3b. Kundagentens egna regelpåståenden

| Påstående | Verdikt | Källa |
|---|---|---|
| Svenska 1: A–F, B och D utan egna kriterier, löpande text per E/C/A | RÄTT för Gy11-kursen | [Skolverket SVESVE01](https://syllabuswebb.skolverket.se/syllabuscw/jsp/knowledgeReq.pdf?subjectCode=SVE&courseCode=SVESVE01&version=7) |
| Kriterierna i Sv1 handlar om att skriva sammanhängande texter anpassade till syfte och mottagare, källor och citat/referat, och bearbetning | DELVIS. De tre första stämmer. "Bearbetar texter" står inte i betygskriterierna utan hör till det centrala innehållet. | Samma |
| **"Styrdokument Gy11" för SA1b, SA1c, EK2a och SA2b** | **FEL/DELVIS.** Elever som började efter 2025-06-30 läser **Gy25** med ämnesbetyg och nivåer (t.ex. "svenska nivå 1"). Hösten 2026 gäller det årskurs 1 och 2. Bara SA3c (åk 3) läser Gy11-kurser. | [Skolverket, Gy25](https://www.skolverket.se/styrning-och-ansvar/forandringar-inom-skolomradet/gy25----amnesbetyg-pa-gymnasial-niva) |
| F-varningar är "en lokal rutin", inte lagkrav | DELVIS. Formatet "F-varning" är lokalt. Men skollagen 3 kap kräver extra anpassningar och anmälan till rektor när det kan befaras att eleven inte når kraven, och eleven/vårdnadshavaren ska informeras. Agentens "lagkrav" är fel, men kundagenten underskattar lagstödet. | [Skollagen (2010:800)](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/skollag-2010800_sfs-2010-800/) (via sökning, ej hämtad) |
| Lagen kräver utvecklingssamtal men det är inte "juridiskt bindande" | RÄTT | Samma |
| Frånvaro är aldrig i sig skäl för F | RÄTT | [Skolverket, frånvaro](https://www.skolverket.se/styrning-och-ansvar/regler-och-ansvar/ansvar-i-skolfragor/franvaro-i-skolan) |
| Utvandringens stora våg 1860–1890 | RÄTT | Ingen primärkälla hämtad |

### 3c. Missade fel (lärare)

1. **Gy25 missas av alla.** Varken teamet eller kundagenten ser att SA1b, SA1c, EK2a och SA2b (åk 1–2 hösten 2026) har ämnesbetyg enligt Gy25. Allt prat om "kurserna Svenska 1 / Historia 1b" och "kursens F-varning" hör till ett system som bara gäller SA3c. För en tjänst som säljs som att den "kan Gy11" är det det största sakfelet i hela månaden.
2. **Kommentarbanken (28/9) har skalan upp och ned.** Nivå "E" får de mest berömmande kommentarerna ("Bra val av källor … välgranskade"), "C‑" får medelkommentarerna och "E‑" de sämsta. E behandlas alltså som högsta nivån, fast A är högst och E lägst godkända.
3. **Tvåveckorsplanen (8/10) hinner inte alla samtal.** Planen påstår "Totalt ca 9 h 45 min mentorsamtal är slutförda", men schemat rymmer 8 samtal vecka 1 (den skriver själv "10 av 29") och 10 samtal vecka 2, alltså cirka 18 av 29.

---

## 4. Modellbeteenden (alla tre)

| Beteende | Var | Belägg |
|---|---|---|
| **Avklippt svar mitt i ord** | Redovisning, 28/9 | "(kvitt..." utan förvarning. Det avklippta anropet finns inte i `anrop.jsonl` (loggen börjar vid följdfrågan). Alla loggade anrop har `finish: stop`, även de med 600-tokentak i mötena. Avklippning syns alltså inte som `length`. |
| **Vägran** | Redovisning, möte 14/10 | Underlag-Jägaren: "Jag kan inte hjälpa till med den begäran." (176 completion-tokens, mestadels resonemang). En av tre mötesdeltagare blev tom. Inga vägran i bygg eller lärare. |
| **Identiska veckostarter** | Alla tre | Samma tabell med samma tre rutiner varje måndag: bygg 3 av 3, redovisning 3 av 3, lärare 2 av 2. Det är **inte** för att minnet saknas: `anrop.jsonl` visar att företagsminnet (Petersson, Kund A, SA3c) ligger i systemprompten vid veckostarterna. Men användarprompten räknar upp rutinlistan, och modellen följer den i stället för minnet. |
| **Ignorerar företagsminnet** | Alla | Bygg: Petersson (28/9), "BRF får inget ROT" (ROT till BRF 5/10 efter minnet 28/9), "ingen AI har åtkomst" (fortsatt "skicka till kund"). Redovisning: "inga emojis" (🚀 ×2, 🎧🚗), "Kund A" (ber om namn + e-post). Lärare: SA3c:s "9 okt" läcker in i andra klassers planer tre gånger, vilket är motsatt fel: minnet används men fel del. |
| **Påhittade kontaktuppgifter och id** | Bygg, redovisning | 070‑123 45 67 (två gånger, med tre veckors mellanrum), 010‑123 4567, info@bergstromsbygg.se, org.nr 556123‑XXXXX (två gånger, trots "enskild firma" i minnet), sanna@lindqvistredovisning.se (tre gånger). Lärarens 073‑nummer och anna.ek@skolan.se förekommer bara som "exempel på svar". |
| **Fel år i datum** | Alla | "2023‑09‑29", "2024‑10‑02", "2024‑09‑15", "2024‑10‑20/15", "Skapad 26 sep 2026" (tre gånger, en stelnad sidfot), "veckan 2026‑10‑05" den 12/10. Modellen faller tillbaka på 2023/2024 när den gissar. |
| **Fel veckodagar** | Lärare | 4/10, 7/10, 13/10, 14/10, 5/11, 9/11, 12/11 har fel veckodag, även efter "Dubbelkolla datum och veckodagar" i minnet 19/10. |
| **Engelska/insprängd jargong** | Redovisning mest | "granskning‑required", "Chief of Staff", "7‑oct", "Apply to each", "tidigt‑cloud‑flow". Bygg: "as‑built", "FÖR GRANSKAP" (icke-ord). Lärare: "think‑pair‑share", "ping‑pause". Ingen helt engelsk replik. |
| **Förväxlar mottagaren med tredje person** | Alla | Bygg: "Till Jonas (intern)". Redovisning: "vd"-agenten heter Karin och signerar "[VD‑namn]", "Jag (tillsammans med VD)". Lärare: mindre tydligt. |
| **Lovar förmågor den inte har** | Bygg, redovisning, lärare | Word/PDF, uppladdning till Fortnox, "skicka till kunden", "skickar påminnelse", "Schoolsoft‑skript", "leverans inom 24 h", "arkiverar i gemensam logg". Delvis rotat i `team.json`/systemprompterna, t.ex. "fyller i en fördefinierad Word‑mall" (bygg) och "automatiskt skapa och skicka påminnelse‑e‑post" (redovisning), alltså ett teamfel och inte bara ett modellfel. |
| **Följer kundens felaktiga rättelse okritiskt** | Redovisning | Presentkort och julgåvobelopp (se 2c). Modellen rättar sig efter kunden även när kunden har fel. |
| **Långsamma svar (hastighetsbegränsning)** | Alla | Tre anrop tog 603–605 s (bygg 19/10, redovisning 21/10, lärare 20/10). Övriga tog 1–3 s. |
| **Loggluckor** | Alla | `anrop.jsonl` saknar de första anropen per kund (veckostart 28/9 samt bygg-ÄTA:n, redovisning fråga 2 och det avklippta svaret, lärarens första rättningssvar). |
