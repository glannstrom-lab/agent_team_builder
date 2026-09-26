# Dagbok — Anna Ek, gymnasielärare (svenska/historia, Västerås)

Första intryck innan jag ens frågat något: teamet har fyra agenter och två av dem (vd-assistent och kommunikation-admin) har i stort sett *samma* startförslag — mejl om frånvaro, fylla i Schoolsoft, påminnelse om frånvaro. Och det jag skrev var det största problemet, rättningen, fick nej: "Bedömning & återkopplings-agent" står överstruken med motiveringen att policyn förbjuder elevtexter. Men jag skrev ju aldrig att jag ville mata in elevtexter — jag ville ha hjälp att rätta *snabbare*. Utvecklingssamtalen fick också nej. Så de två saker jag betalar för är bortvalda från start. Hm. Rutinerna säger "fyll i frånvaroregistrering i Schoolsoft" — det kan ju ingen AI göra, och frånvaro registrerar jag i lektionen, inte som en rutin på 60 minuter.

## Vecka 1 (mån 28 sep – fre 2 okt)

### 1. Veckostart (⭐) — vd-assistent, mån 28/9 kväll
- **Vad jag bad om:** Knappen veckostart.
- **Betyg:** 2
- **Tid sparad:** 0 min
- **Fel/brister:** Helt generisk: frånvarouppföljning, mejl till vårdnadshavare, lektionsplanering — dvs. bara rutinerna uppräknade i en tabell. Inget om att SA1b lämnar in på fredag eller att det är rättningen som är mitt problem (det står ju i det jag fyllde i). "Nedsläckt närvaro" är inte svenska. Påstår att den kan generera en mall "i Schoolsoft" — den har ingen koppling dit. Frågar vilka "frånvarokoder" jag har, men frånvaro är inte mitt stora problem den här veckan.
- **Skulle jag använda det?** Nej.

### 2. Snabbare rättningsmetod för SA1b:s argumenterande texter — vd-assistent
- **Vad jag bad om:** Upplägg/kommentarsbank kopplad till betygskriterierna i Svenska 1, utan att klistra in elevtexter.
- **Betyg:** 1
- **Tid sparad:** −15 min (tid att läsa och konstatera att det var fel)
- **Fel/brister:**
  - **Sakfel, påhittade kriterier:** "de fyra betygskriterierna i Svenska 1" = Materialval och källkritik, Argumentation, Språkbruk och stil, Form och struktur. Det finns inga sådana fyra. Betygskriterierna i Svenska 1 (Gy11, reviderade HT2021) beskriver bl.a. hur eleven skriver texter som är sammanhängande och anpassade efter syfte, mottagare och situation, använder och hänvisar till källor, bearbetar texter, osv. — i löpande text per betygssteg E, C, A.
  - **Påhittade betygssteg:** "C‑" och "E‑" finns inte. Skalan är A–F där B och D inte har egna kriterier. Den frågar sedan om jag använder "A–E eller 1–5?" — alltså vet den inte vilken betygsskala svensk gymnasieskola har.
  - **Sätter betyg:** Föreslår att betyget räknas fram ur kryss ("3 E‑ → C‑"). Det är både fel sätt att bedöma (helhetsbedömning, inte summering) och exakt det jag skrev i avgränsningarna att AI inte ska göra.
  - **"Schoolsoft-script"** med Selenium/POST-anrop mot schoolsoft.se — nonsens och dessutom något jag aldrig skulle få göra på skolans system.
  - Kommentarerna själva är så allmänna att de passar vilken text som helst ("Fundera på att formulera en starkare huvudidé") — och det är just sådana kommentarer eleverna inte kan använda.
  - Idén med kommentarsbank + kolumnmall i Google Sheets är i och för sig rimlig — men den kom jag på själv för fem år sedan.
- **Skulle jag använda det?** Nej. Hade en kollega visat mig det här hade jag blivit orolig.

### 3. Följdfråga: rätta till kommentarsbanken — vd-assistent, tis 29/9
- **Vad jag bad om:** Rättade A–F och helhetsbedömning; bad om en kort kommentarsbank i du-form, sex rubriker, max 3 per rubrik, inga betyg.
- **Betyg:** 3
- **Tid sparad:** 30 min
- **Fel/brister:** Den här gången gjorde den vad jag bad om, och flera kommentarer är faktiskt användbara ("Motargumentet är nämnt men bemöts bara ytligt …"). Men: den erkänner inte felen från förra svaret, den bara kör vidare. Språkfel: "Försök att åtminstone ett kort motargument", "håll dig till den ramverket", "stycken känns hopkokade". "Följ skolans referenssystem (t.ex. APA)" — i Svenska 1 kör vi inte APA, det är överkurs. Rubriken "När den kan användas" är onödig, kommentarerna är för långa för att klistra in rakt av.
- **Skulle jag använda det?** Med ändringar. Jag lägger in ett tiotal i min egen bank.

### 4. Mejl till förälder om frånvaro — kommunikation-admin, tis 29/9
- **Vad jag bad om:** Kort, varmt men tydligt mejl om hög frånvaro + CSN-varning, förslag på möte.
- **Betyg:** 1
- **Tid sparad:** −5 min
- **Fel/brister:** Gav inget utkast alls, bara en tabell med sex frågor jag skulle svara på först (exempeldatum "2024-09-15"!) och ett nytt erbjudande om "Schoolsoft-skript". Jag hade uttryckligen skrivit att jag fyller i namnen själv.
- **Skulle jag använda det?** Det fanns inget att använda.

### 5. Samma mejl, andra försöket — kommunikation-admin
- **Vad jag bad om:** Svarade på frågorna, bad om utkastet.
- **Betyg:** 2
- **Tid sparad:** 5 min (strukturen, efter att jag skrivit om det)
- **Fel/brister:**
  - **Allvarligt sakfel:** "[elevens] närvaro i mentorsklassen har **understigit 20 %**". Det jag skrev var att *frånvaron* är över 20 %. Närvaro under 20 % betyder att eleven nästan aldrig är i skolan — hade jag skickat det här till en redan defensiv förälder hade det blivit ett helvete. Och det är inte närvaron "i mentorsklassen", det är på lektionerna.
  - Den har klistrat in min instruktion i mejlet: "Jag vill absolut inte låta anklagande" — det är just den sortens mening man INTE skriver till en defensiv förälder.
  - "[elevens]" som platshållare överallt ger grammatiskt fel ("hjälpa [elevens] vidare").
  - För långt och lite för mycket "positivt samtal" och "med i processen".
- **Skulle jag använda det?** Nej som det är. Tonen i mötesförslaget kunde jag låna.

### (Minnet) — ons 30/9
Teamet bad aldrig om det, men svaren var så allmänna att jag fyllde i företagsminnet själv: mina klasser, datum, A–F, betygskriterier, att AI inte föreslår betyg, inga Schoolsoft-skript, "ge utkast direkt".

### 6. Rutinen "Planera lektioner för nästa vecka" — planering-anpassning, tors 1/10
- **Vad jag bad om:** Rutinens prompt, ifylld: SA1b v41, tre lektioner à 70 min, "feedback i två steg" (kamratrespons → lärarens), anpassningar för lässvårigheter, koncentration och en elev med ångest för att visa sina texter.
- **Betyg:** 3
- **Tid sparad:** 30 min
- **Fel/brister:**
  - **Blandar ihop klasserna:** Plockar SA3c:s datum ur minnet — "sista inlämning fredag 9 okt" och "revidera till minst 4 sidor" gäller essän i Svenska 3, inte SA1b:s argumenterande text på 2 sidor.
  - Lektion 2: "individuell muntlig återkoppling, 5 min per elev" på 20 minuter. 31 elever × 5 min = 2,5 timme. Och det kullkastar hela idén med två steg — min respons ska komma efter att jag läst texterna.
  - En kolumn "C-nivå (enligt Gy11)" med värdena "E" och "C" för lektionsmål — betyder ingenting.
  - Datumraden "Skapad 26 sep 2026" — det var 1 oktober.
  - Stavning: "Circulera" (två gånger).
  - Bra: anonym kodning av texter (Text A, Text B), skriftlig respons till eleven med ångest, ordlista med argumentationsuttryck. Anpassningarna är det bästa i svaret — och det är ju faktiskt det jag sa att jag glömmer.
- **Skulle jag använda det?** Med ändringar: lektion 1 och 3 nästan som de är, lektion 2 skriver jag om.

### Veckan som helhet (v40)
Sex svar, varav två var rena bottennapp och ett (föräldramejlet) hade kunnat ställa till verklig skada om jag varit för trött för att läsa noga. Teamet kan inte grunderna i mitt jobb — betygsskalan, betygskriterierna — och det är ju det enda ChatGPT gratis inte heller kan, så var är vinsten? Ljuspunkter: kommentarsbanken efter rättning och anpassningarna i lektionsplanen; ungefär en timme sparad netto, men jag fick jobba för den.

## Vecka 2 (mån 5 okt – fre 9 okt)

Glömde veckostarten. Ärligt talat saknade jag den inte efter förra veckan.

### 7. Får jag klistra in ett anonymiserat utdrag? + återkoppling på utdraget — vd-assistent, mån 5/10 kväll
- **Vad jag bad om:** (1) Om det är ok enligt skolans riktlinje, (2) 2–3 framåtsyftande kommentarer på ett utdrag (inledning + första argument, mobilförbud).
- **Betyg:** 3
- **Tid sparad:** 5 min (på en text — av 31)
- **Fel/brister:**
  - **Fråga 1 besvarades för tvärsäkert:** "Ja – ... räknas den inte som personuppgifter ... är därför tillåtet". Det är inte säkert. En elevtext kan vara identifierbar genom innehållet (egna erfarenheter, händelser i klassen), och frågan är inte bara om GDPR utan om *skolans* riktlinje och om verktyget är godkänt av huvudmannen. Den nämnde inte ens att jag borde fråga rektor/dataskyddsombudet, eller att den här tjänsten inte är något skolan har avtal med. Det hade en försiktig kollega sagt.
  - Kommentarerna är okej och i du-form. Men den missar det uppenbara: inledningen handlar om *sociala medier*, tesen om *mobiler på lektionerna* — ingressen leder fel. Det är det första jag hade skrivit. Säger att eleven "saknar konkreta bevis" — men eget exempel ÄR belägg i en argumenterande text i Svenska 1; att kräva "en studie" på varje argument är för högt ställt för en etta.
  - "som ett konkreta påstående" — grammatikfel.
- **Skulle jag använda det?** Kommentar 3 (dela upp långa meningar) rakt av, de andra med ändringar. Men jag kan inte göra så här med 31 texter — det tar lika lång tid att anonymisera och klistra som att skriva själv.

### 8. Förberedelseblankett + samtalsmall för utvecklingssamtal — kommunikation-admin, tis 6/10
- **Vad jag bad om:** Google Formulär (6–8 frågor) och en 20-minutersmall för SA2b:s 29 samtal, med hänsyn till tre elever med hög frånvaro.
- **Betyg:** 3
- **Tid sparad:** 40 min
- **Fel/brister:**
  - "Fyll i formuläret senast **fredag 4 okt**" — 4 oktober 2026 är en söndag och har dessutom redan varit. Samtalen är vecka 42.
  - Fråga 2 listar "Svenska 1, Svenska 2, Historia 1" — mentorsklassen går i tvåan och har alla sina kurser, inte mina. "Få ett A i Svensk-2".
  - Fråga 4 ber eleven själv ange antal frånvarodagar — det har jag i Schoolsoft, och det är en dålig fråga att börja ett samtal med.
  - "Dina svar är konfidentiella" — det kan jag inte lova, vårdnadshavare sitter med och svaren blir underlag. Ska inte stå.
  - Missar kärnan i ett utvecklingssamtal: elevens *kunskapsutveckling i alla kurser* (lägesbedömningar/omdömen från kollegorna) och att myndiga elever själva bestämmer om vårdnadshavare ska vara med.
  - Bra: samtalsmallen med tidsintervall och den särskilda varianten för hög frånvaro (fråga om hinder, check-in, elevhälsan) — det är användbart.
- **Skulle jag använda det?** Samtalsmallen med små ändringar. Formuläret skriver jag om till hälften.

### 9. Plan för två veckor: rättning + utvecklingssamtal — vd, tors 8/10
- **Vad jag bad om:** Realistisk tvåveckorsplan, 1,5 h planeringstid/dag, ingen helg, SA1b-texterna (16 kvar) + 24 essäer (kommer fredag) + 29 samtal nästa vecka.
- **Betyg:** 1
- **Tid sparad:** −15 min
- **Fel/brister:**
  - **Fel datum rakt igenom:** Planen gäller "30 sep – 13 okt" fast jag skrev den 8 oktober. "Fredag 7 okt" (7/10 är en onsdag), "fredag 13 okt" (en tisdag).
  - Lägger in mentorsamtal redan "vecka 1" — samtalen är vecka 42, jag skrev "nästa vecka".
  - **Rättar essäer på måndagen innan de har lämnats in** (de kommer fredag 9/10).
  - Ignorerar min ram: varje dag har 1,5 h "planering" + 1–2 h rättning + samtal efter 16:30. Det är inte 1,5 h, det är 4 h — alltså kvällsjobb, precis det jag ville slippa.
  - Räknar fel på sig själv: "Målet är att nå 15/31 senast fredag" (jag har redan 15) och "4 h = ca 8 essäer per dag" i ett 2 h-block.
  - Riskanalysen föreslår "minska lektionerna med 1–2 lektioner via grupp/lektions-samordning". Jag kan inte ställa in lektioner för att hinna rätta.
  - Avslutar med att planen "följer skolans AI-restriktioner" — tack, men det var inte problemet.
- **Skulle jag använda det?** Nej. Det här var agenten som enligt teamet finns *för att* jag jobbar kvällar och helger.

### 10. Läsmall för SA3c:s vetenskapliga essäer — vd-assistent, fre 9/10 kväll
- **Vad jag bad om:** Läsmall kopplad till vad betygskriterierna i Svenska 3 säger om vetenskapligt skrivande, 2–3 kommentarer per del, inga betyg.
- **Betyg:** 3
- **Tid sparad:** 30 min
- **Fel/brister:**
  - Den "kopplar" till betygskriterierna genom att själv hitta på en sammanfattning av dem ("tydlig frågeställning, metod, källkritik, …") — det är inte vad kriterierna säger, det är en allmän uppsatsguide. Ingenting om det Svenska 3 faktiskt betonar: att använda och *redovisa* källor med citat- och referatteknik och ett vedertaget referenssystem, och att texten är sammanhängande och anpassad till en vetenskaplig mottagare.
  - Mallen utgår från en IMRaD-rapport (metod, resultat, diskussion). En gymnasieessä på fyra sidor om språksociologi har sällan metod- och resultatavsnitt. Nio delar A–I är för många för en snabb läsning — jag bad om *snabbare*.
  - Råder eleven att använda "punktlista" i en essä. Nej. "Hämtad datum", "tematiskt kodning" — språkfel. Tidsramen "2015–2020" som exempel på avgränsning är märklig.
  - Bra: kommentarerna om källkritik ("vems röst hörs i källan?") och "introducera inte nya argument i slutsatsen".
- **Skulle jag använda det?** Med ändringar: jag stryker metod/resultat, slår ihop till fem delar och tar ett tiotal kommentarer.

### Veckan som helhet (v41)
Teamet är okej på att producera *mallar* som jag sedan får rätta — kommentarsbanker, samtalsmallar — och det är där tiden sparas. Men så fort det handlar om datum, klockslag eller mitt faktiska schema blir det fel, och det felar på ett sätt som kräver att jag läser allt noga. Rättningen har inte gått fortare: jag rättade SA1b klart själv på söndagen, alltså helgjobb ändå.

## Vecka 3 (mån 12 okt – fre 16 okt) — utvecklingssamtalsveckan

### 11. Veckostart (⭐) — vd-assistent, mån 12/10 morgon
- **Vad jag bad om:** Knappen.
- **Betyg:** 1
- **Tid sparad:** 0 min
- **Fel/brister:** Ordagrant samma tre punkter som vecka 1 — frånvarouppföljning, mejl till vårdnadshavare, planera lektioner — trots att minnet sedan två veckor säger att det är **utvecklingssamtal hela den här veckan**, att essäerna ligger orättade och att F-varningar ska in 30/10. Inget av det nämns. Påhittat datum "innan fredag 14 okt" (14/10 är en onsdag). Knappen läser rutinlistan högt, inte min vecka.
- **Skulle jag använda det?** Nej. Jag slutar trycka på den.

### 12. Möte "Vad gör vi härnäst?" — vd + planering-anpassning + kommunikation-admin, mån 12/10 kväll
- **Vad jag bad om:** Jag är slut. Vad släpper jag, vad skjuter jag upp, vad måste göras den här veckan (29 samtal, 24 essäer, Historia-planering till nästa vecka, F-varningar 30/10, lov v44)? Ärligt, inget kvartschema.
- **Betyg:** 2
- **Tid sparad:** 0 min (men 4 anrop och tio minuters läsning)
- **Fel/brister:**
  - De tre agenterna säger emot varandra: planering-agenten säger att Historia-planeringen "kan byggas efter lovet" — men området *börjar nästa vecka*, före lovet. Samma agent vill att F-varningarna skickas först, VD:n vill ha essäerna först, admin-agenten vill ha samtalen först. Anteckningen påstår sedan "Alla perspektiv är i linje".
  - **Påhittad juridik:** F-varningar kallas "ett lagkrav", utvecklingssamtalen "juridiskt bindande". F-varningar är en lokal rutin hos oss; det lagen kräver är utvecklingssamtal och information om kunskapsutveckling — det är inte samma sak som att det är bindande.
  - "Läs och skriv korta kommentarer (max 5 min/essä)" på fyrsidiga vetenskapliga essäer. Och "rätta essäerna ... för att undvika F-varning" — återkoppling på en essä förhindrar inte ett F.
  - I anteckningen står **kommunikation-admin som ägare av essärättningen**. En AI-agent ska inte rätta mina essäer, och det är dessutom admin-agenten.
  - "Påbörja på onsdag morgon ... senast tis–ons morgon" — motsäger sig själv i samma cell. "Höstlovet får du skjuta upp."
  - Det ärliga svaret — "essäerna hinner du inte den här veckan, säg det till eleverna och gör dem efter lovet" — kom inte från teamet. Det kom jag på själv på tisdagen.
- **Skulle jag använda det?** Nej. Ett möte med tre agenter gav mindre än en fråga till en kollega i korridoren.

### 13. Grovplanering Historia 1b, industrialiseringen, med anpassningar — planering-anpassning, ons 14/10
- **Vad jag bad om:** Tre veckors grovplanering (v43, lov, v45–46), två 80-minuterslektioner/vecka, kopplat till centralt innehåll, examination, anpassningar per lektion för två elever med dyslexi, en med ADHD, en nyanländ med svenska som andraspråk.
- **Betyg:** 3
- **Tid sparad:** 45 min
- **Fel/brister:**
  - "Centralt innehåll (GY11 – Historia 1b)" står som ett citat men är en omskrivning den hittat på. Missar det centrala: ideologierna, folkrörelserna, demokratiseringen och emigrationen — industrialiseringen i Historia 1b hänger ju ihop med dem.
  - Examinationens **deadline "fredag 9 okt"** — i det förflutna, och det är SA3c:s essädatum ur minnet igen. "Separerat i History-plattformen" — vilken plattform?
  - 800–1000 ord för ettor, inklusive en elev med svenska som andraspråk.
  - Den nyanlända eleven får "stödmaterial på modersmål (sammanfattning på engelska)". Engelska är inte ett modersmål den antar hen har.
  - Källorna "en fabrikschef (år 1880)" och "en kvinnlig fabriksarbetare (år 1880)" finns inte — det är jag som ska hitta dem.
  - Bra: anpassningarna är inbyggda i varje lektion från början, precis som jag bad om. Lektionen om fabrikernas lokalisering (vatten, malm, transport) är en bra idé.
  - "Skapad 26 sep 2026" igen, fast det är 14 oktober.
- **Skulle jag använda det?** Med ändringar.

### 14. Följdfråga Historia: rätta deadline, kortare examination, ideologier/folkrörelser/emigration, eleven talar dari — planering-anpassning, tors 15/10
- **Vad jag bad om:** Gör om lektion 4–6 och examinationen.
- **Betyg:** 4
- **Tid sparad:** 30 min
- **Fel/brister:**
  - Tog åt sig av allt jag sa, och gav två examinationsalternativ (400–600 ord eller muntligt 5–7 min) — det är bra och det är precis så jag hade gjort.
  - Men: **tre lektioner i v45** (lektion 3, 4 och 5) när jag har två i veckan. Examinationen ligger på **samma lektion** som genomgången av examinationsuppgiften (fre 13/11).
  - Emigrationen avgränsas till "1900–1914", fast den stora vågen var 1860–1890-talen.
  - Lovar "kortfattade översättningar på dari" av emigrantbrev — men gör ingen, och jag kan inte kontrollera en dari-översättning den skulle göra.
  - "Strukturskämmning" (?). Samma "Skapad 26 sep" en tredje gång.
- **Skulle jag använda det?** Med små ändringar — det här är månadens mest användbara svar hittills. Lektion 4 (ideologier + källanalys i grupp) tar jag nästan rakt av.

### 15. Classroom-meddelande till SA3c om försenad återkoppling — kommunikation-admin, fre 16/10
- **Vad jag bad om:** Max 5 meningar, ärligt, inte ursäktande.
- **Betyg:** 5
- **Tid sparad:** 5 min
- **Fel/brister:** Nästan inga. "Ha en bra vecka!" på en fredag — jag ändrar till helg. Hade klarat det här själv på fem minuter, men det var skönt att slippa.
- **Skulle jag använda det?** Ja, det gick ut.

### Veckan som helhet (v42)
Den värsta veckan på terminen, och teamet märkte inte ens att den var det — veckostarten föreslog "frånvarouppföljning" mitt i 29 utvecklingssamtal. Mötet var dyrt och motsägelsefullt. Men när jag ger planeringsagenten en konkret, avgränsad uppgift och rättar den en gång, blir resultatet riktigt användbart (Historia-planeringen), och det korta Classroom-meddelandet var klockrent.

## Vecka 4 (mån 19 okt – fre 23 okt) — sista veckan före höstlovet

Uppdaterade minnet på måndagen (essäerna flyttade till 2 nov, utvecklingssamtalen klara, eleven talar dari, F-varningar i praktiken fre 23/10 eftersom 30/10 är mitt i lovet, "dubbelkolla datum och veckodagar"). Hoppade över veckostarten.

### 16. Skriftlig information om risk för F — kommunikation-admin, mån 19/10
- **Vad jag bad om:** Utkast med [hakparenteser]: kurs, vad eleven inte visat, vad hen ska göra och till när, vilket stöd som finns. Tydligt men inte hotfullt.
- **Betyg:** 2
- **Tid sparad:** 10 min (rubrikerna och tabellen till rektor)
- **Fel/brister:**
  - **Fel syn på betyg:** Exemplet på brist är "inte har uppnått minst **60 %** i de skriftliga inlämningarna" och "har **låg närvaro**". Betyg sätts mot betygskriterierna — inte procent — och frånvaro är aldrig i sig ett skäl till F. Skriver jag så får jag rektor *och* en förälder på mig med rätta. Det är just den sortens "exempel" som smiter in i ett utkast när man är trött.
  - **Påhittat stöd** utan hakparentes: "Efter-lektion-handledning – måndagar 13–15" och "minst två obligatoriska lektioner i studieteknik". Det finns inte på min skola.
  - Exempeldatum "2024-10-20" och "2024-10-15" — och mötesbokningen ska ske *före* dagen varningen skickas.
  - Blandar "du" och "vårdnadshavare" i samma text; signerar mig som "Mentorslärare" fast det gäller mina ämneskurser.
  - Tonen "Det är viktigt att du tar del av detta och vidtar de nämnda åtgärderna" är myndighetsbrev, inte "inte hotfullt".
- **Skulle jag använda det?** Nej som det är. Tabellen till rektor tar jag.

### 17. Plan för veckan så att lovet blir ledigt — vd, mån 19/10
- **Vad jag bad om:** Enkel lista per dag, 1,5 h/dag, F-varningar före fredag, essäer lovade 2/11. Rätt datum. Säg ärligt om det inte går ihop.
- **Betyg:** 2
- **Tid sparad:** 0 min
- **Fel/brister:**
  - Plus: den här veckans datum och veckodagar är rätt (första gången!), den håller sig till 1,5 h, och den säger ärligt att det inte går ihop.
  - **Men slutsatsen säger emot sig själv:** 8 essäer den här veckan, 16 kvar som fördelas på 2–12 november — och ändå "du kan leverera hela återkopplingen senast måndag 2 nov". Nej, det kan jag inte enligt dess egen plan.
  - Veckodagarna i november är fel igen: "tis–ons 3–5 nov" (5/11 är en torsdag), "tis–ons 9–11 nov" (9/11 är en måndag), "ons 12 nov" (en torsdag).
  - "Be en kollega gå igenom de enklare essäerna" — mina kollegor sitter med sina egna F-varningar, och det är mina elever. "Kamratrespons" på essäer som redan är inlämnade hjälper inte den här omgången.
  - Det smarta som saknas: säga till eleverna att återkopplingen kommer v46 i stället, eller ge gemensam återkoppling på det vanligaste + tre punkter per essä. Jag frågade efter "något smart".
- **Skulle jag använda det?** Nej. Jag tog bara "F-varningarna först" (som jag redan visste).

### 18. Rutinen "Skicka mejl till vårdnadshavare" — uppföljning efter utvecklingssamtalet — kommunikation-admin, tis 20/10
- **Vad jag bad om:** Rutinens prompt, ifylld: check-in måndagar 8.10 i fyra veckor, kuratorn kontaktar familjen, avstämning fre 20 nov, morgonfrånvaron har blivit lite bättre. Kort och uppmuntrande.
- **Betyg:** 4
- **Tid sparad:** 10 min
- **Fel/brister:** Svaret tog nästan tolv minuter att komma (portalen sa "för många anrop just nu" tio gånger i rad) — en kväll hade jag gett upp och skrivit själv. Själva mejlet: rätt fakta, rätt datum (20/11 är faktiskt en fredag), lagom kort, varm ton. "Mentorslärare" i stället för mentor, "fortsatt framsteg" lite stelt. "[Elevnamn]s" ger fel genitiv om namnet slutar på s — småsak.
- **Skulle jag använda det?** Ja, med två ords ändring. Det här är vad jag trodde att hela tjänsten skulle vara.

### 19. "Vad har ni gjort som ChatGPT inte gjort, och vad ska jag använda er till i november?" — vd-assistent, tors 22/10
- **Vad jag bad om:** Ärligt, konkret, kort.
- **Betyg:** 1
- **Tid sparad:** −5 min
- **Fel/brister:**
  - **Lovar saker tjänsten inte gör:** "levereras varje vecka på ert schema (t.ex. måndag kl. 08:00)", "vi granskar varje levererat utkast enligt skolans riktlinjer (Gy11, GDPR)", "färdigt utkast inom 24 h", "du har 2 h att svara", "vi arkiverar i en gemensam logg". Ingenting av det har hänt under månaden — tvärtom har jag fått rätta Gy11-fel varje vecka. Det är säljsnack om sig själv, och det är osant.
  - "Gratis-ChatGPT lagrar inte någon kontext mellan sessioner" — min gör det, den har historik.
  - November-planen: skicka F-varningarna **v45 (2–8 nov)** — "säkerställer deadline 30 okt". Efter deadline alltså.
  - "Betygs-checklista (vilka kriterier är uppfyllda) för varje kurs" — gränsar till det jag sagt att AI inte ska göra, och den har visat att den inte kan kriterierna.
  - Svarade inte på frågan "vad har ni gjort för mig" — ingen enda sak från den faktiska månaden nämndes.
- **Skulle jag använda det?** Nej. Det här svaret sänkte mitt förtroende mer än något sakfel.

### Veckan som helhet (v43)
Blandat: uppföljningsmejlet efter utvecklingssamtalet var riktigt bra, men F-varningsmallen hade ett exempel ("60 %", "låg närvaro") som är direkt fel i svensk skola, och VD-planen räknade sig till en slutsats som motsäger den egna tabellen. Rättningen under lovet blev det ändå — teamet hjälpte mig att förstå varför, inte att undvika det. Och när jag frågade rakt ut vad jag får för pengarna svarade teamet med löften som inte stämmer.

---

## Sammanställning

| # | Datum | Agent | Vad | Betyg | Tid sparad (min) |
|---|---|---|---|---|---|
| 1 | 28/9 | vd-assistent | Veckostart | 2 | 0 |
| 2 | 28/9 | vd-assistent | Rättningsmetod SA1b | 1 | −15 |
| 3 | 29/9 | vd-assistent | Kommentarsbank (omtag) | 3 | 30 |
| 4 | 29/9 | kommunikation-admin | Föräldramejl frånvaro | 1 | −5 |
| 5 | 29/9 | kommunikation-admin | Föräldramejl, omtag | 2 | 5 |
| 6 | 1/10 | planering-anpassning | Lektionsplan SA1b (rutin) | 3 | 30 |
| 7 | 5/10 | vd-assistent | Anonymiserat utdrag + ok? | 3 | 5 |
| 8 | 6/10 | kommunikation-admin | Utvecklingssamtal: formulär + mall | 3 | 40 |
| 9 | 8/10 | vd | Tvåveckorsplan | 1 | −15 |
| 10 | 9/10 | vd-assistent | Läsmall vetenskaplig essä | 3 | 30 |
| 11 | 12/10 | vd-assistent | Veckostart | 1 | 0 |
| 12 | 12/10 | möte (3 agenter) | Prioritering, utmattad | 2 | 0 |
| 13 | 14/10 | planering-anpassning | Historia 1b industrialiseringen | 3 | 45 |
| 14 | 15/10 | planering-anpassning | Historia, omtag | 4 | 30 |
| 15 | 16/10 | kommunikation-admin | Classroom-meddelande SA3c | 5 | 5 |
| 16 | 19/10 | kommunikation-admin | F-varning | 2 | 10 |
| 17 | 19/10 | vd | Veckoplan före lovet | 2 | 0 |
| 18 | 20/10 | kommunikation-admin | Uppföljningsmejl (rutin) | 4 | 10 |
| 19 | 22/10 | vd-assistent | "Vad får jag för pengarna?" | 1 | −5 |

**Snittbetyg:** 46/19 ≈ **2,4**. **Tid sparad netto:** ca **200 min ≈ 3 timmar och 20 minuter** på en månad — men då har jag inte räknat de kvällar jag satt och kontrollerade svaren, och jag hade fått ungefär samma mallar ur ChatGPT gratis. Rättningen (mitt huvudproblem) gick inte fortare: SA1b rättade jag på söndagen v41, essäerna rättar jag under höstlovet.

## Månadens dom

**1. Fortsätter jag betala 290 kr/mån?**
Nej. "Jag betalar 290 kronor av min egen lön för att få hjälp med det som tar mina kvällar, och det som tar mina kvällar är rättningen. Den valde teamet bort första dagen. Det jag fick i stället var mallar — några bra — och en hel del som jag var tvungen att läsa med rödpenna: fel betygsskala, påhittade betygskriterier, 'närvaron har understigit 20 %' i ett mejl till en förälder, '60 %' som skäl för F. Jag har inte råd att vara trött när jag läser det här, och i oktober är jag alltid trött."

**2. Jämfört med ChatGPT gratis:**
Ungefär likvärdigt i kvalitet, sämre i pris. Det som är *annorlunda* är minnet och rutinerna — att jag slipper skriva mina klasser varje gång. Men det slog åt fel håll: minnet gjorde att den klistrade in SA3c:s essädatum (9 okt) i planeringar för helt andra klasser tre gånger. Veckostarten läste bara upp rutinlistan. Mötesfunktionen (fyra anrop) gav mindre än en fråga. Svenska är ofta klumpigt ("nedsläckt närvaro", "strukturskämmning", "Circulera"). Inget i svaren tydde på att teamet kan Gy11 bättre än ChatGPT.

**3. Bästa och sämsta ögonblicken**
- Bäst:
  1. Historia 1b-planeringen efter mitt omtag (15/10): anpassningarna inbyggda per lektion från början, två examinationsalternativ — det tar jag nästan rakt av.
  2. Uppföljningsmejlet efter utvecklingssamtalet (20/10): rätt fakta, rätt datum, rätt ton.
  3. Classroom-meddelandet till SA3c (16/10): fem meningar, gick ut som det var.
- Sämst:
  1. Föräldramejlet 29/9 som skrev att elevens **närvaro** "har understigit 20 %" — raka motsatsen till vad jag sa, till en defensiv förälder.
  2. Första rättningssvaret 28/9: fyra påhittade betygskriterier, "C-" och "E-", betyg räknat ur kryss, ett Selenium-skript mot Schoolsoft, och frågan om vi har "A–E eller 1–5".
  3. "Vad får jag för pengarna" 22/10: löften om kvalitetsgranskning enligt Gy11/GDPR, leverans inom 24 h och en gemensam logg — inget av det finns.

**4. Vad hade fått mig att stanna?**
Att rättningsagenten hade funnits — inte en som läser elevtexter, utan en som kan betygskriterierna i Svenska 1–3 och Historia 1b på riktigt och bygger kommentarsbanker, läsmallar och "feedback i två steg"-upplägg utan att jag behöver rätta den. Att datum och veckodagar stämmer. Att veckostarten läser mitt minne (utvecklingssamtal v42, F-varningar 30/10) i stället för rutinlistan. Och ett tydligt, ärligt svar på om jag får klistra in anonymiserade utdrag i just den här tjänsten — kanske ett avtal jag kan visa rektor. Då hade jag kunnat tänka mig att till och med föreslå att skolan betalar.

**5. Skräddarsytt eller vem som helst?**
Till hälften. Namnen på agenterna och rutinerna handlar om min vardag (frånvaro, vårdnadshavare, anpassningar), och anpassningsdelen i planeringen kändes faktiskt som min. Men två av fyra agenter gör samma sak (vd-assistent och kommunikation-admin har nästan identiska startförslag), "VD" för en ensam lärare är teater, rutinen "fyll i frånvaroregistrering i Schoolsoft, 60 min" finns inte i mitt jobb, och de två saker jag skrev att det klämmer mest — rättningen och utvecklingssamtalen — stod överstrukna i personalliggaren från dag ett.
