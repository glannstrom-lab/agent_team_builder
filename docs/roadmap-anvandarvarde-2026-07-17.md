# Roadmap: användarvärde & retention (2026-07-17)

> Byggd på två researchrundor samma dag: en intern UX-granskning av
> portal/builder-koden och `omvarldsresearch-2026-07-17.md` (konkurrenter,
> BYO-frontends, retention-mönster, open source). Omfattar **bara det som går
> att bygga nu**: statiskt, BYO-nyckel, inga nya backend-beroenden. Löper
> parallellt med M-sekvensen i `produktstrategi-sjalvbetjaning.md` — särskilt
> lämpligt medan M2a-2+ väntar på Stripe-kontot.

## Tre principer som styr ordningen

1. **Skyddsnät före lockbeten.** Retention-funktioner är meningslösa om en
   builder-körning för riktiga pengar kan krascha utan återhämtning.
2. **Varje sidöppning ska belönas.** Utan server-push är sidöppningen vår enda
   trigger — den ska mötas av något som redan är gjort eller räknat.
3. **Exponera det kärnan redan vet.** Pipeline:n producerar motiveringar,
   avvisade agenter, tidsuppskattningar och briefs — portalen renderar bara en
   bråkdel. Billigaste vägen till "mer än en chatt" är rendering, inte nya prompter.

Storlek: **S** ≈ timmar, **M** ≈ en dag, **L** ≈ flera dagar.

---

> **Status 2026-07-18:** HELA roadmappen (etapp 0–4) är byggd och deployad,
> plus förvalsenkäten i Builder-intaget (`builder/survey-data.js`).
> Implementationsnoter per etapp:
> - **2:** puls-korten (2.4) beräknas helt lokalt utan AI-kostnad; "Veckan som
>   gick" (2.3) genereras först vid klick (BYO-kostnadsrespekt); minnesförslag
>   (2.1) = "🧠 Spara lärdomar"-knapp per svar; tidsstämplar (`at`) sätts på
>   alla nya meddelanden — tidslinjen (2.6) fylls framåt.
> - **3:** delningslänken (3.1) deflate-komprimeras in i `#cfg=`-fragmentet
>   (kodek i `atb-claude.js`); teamfil öppnas via kundväljaren, exporteras via
>   sidfoten. "Därför"-sidan (3.2) auto-öppnas en gång (`atb_hello_`), driven
>   av nya fälten `why` per agent + `divergence`/`rejected` i konfigen
>   (portal-team.md + Builderns schema). 3.4 byggdes som stegundertexter +
>   why/divergens i resultatvyn — INTE som realtidsrenderade kort (medvetet:
>   parsning av strömmande text är skör). Kvartals-Wrapped (3.5) är en lokal
>   sifferöverblick + delbar text, synlig sista tre veckorna av kvartalet.
> - **4:** kärnregeln + prisankaret + GDPR/BYO-argumentet + byrå/konsult-
>   sektionen på säljsidan. Mailto-platshållaren är KVAR (P0-1, kräver Mikael).
> Manuell webbläsargenomgång av "Klart när"-punkterna återstår för allt.

## Etapp 0 — Skyddsnät (gör först, i ordning) ✅ byggd 2026-07-17

**0.1 Svenska nätverksfel + automatisk retry** — S
`atb-claude.js`: fånga `TypeError` runt fetch ("Ingen kontakt med AI-tjänsten —
kontrollera internetuppkopplingen"), automatisk retry med 2–5 s backoff på
429/529 i `stream()`/`collect()`. Täcker även P3-28 i kundresegranskningen.
*Klart när:* wifi av mitt i ett svar ger begripligt svenskt besked; en enstaka
429 i builder/möte syns aldrig för användaren.

**0.2 Builder-körningar överlever fel och refresh** — M
`builder/builder.js`: persistera `state.lastRun.r` till localStorage efter varje
avklarat steg; sätt `err.stage` och erbjud "Fortsätt från steget som
misslyckades" på felsidan; autospara färdigt utkast i `renderResult`; vid boot:
"Du har en oavslutad/färdig körning för X — återuppta?"
*Klart när:* nätverksfel i proposal-steget kostar inte om research; F5 direkt
efter färdig körning tappar ingenting.

**0.3 Nyckelvalidering vid Anslut + förtroende-copy** — S
Billigt testanrop (modellista) med spinner och ok/fel vid Anslut i portal och
builder. Texten "Nyckeln sparas bara i din webbläsare och skickas aldrig till
oss" vid fältet (TypingMind-mönstret).
*Klart när:* felklistrad nyckel ger besked inom sekunder, i rätt kontext.

**0.4 Mötesfunktionen: delfel + synliga perspektiv** — M
`portal/app.js`: spara varje hämtat perspektiv; vid delfel erbjud "fortsätt med
de N som kom in"; visa perspektiven utfällbara under mötesanteckningen
("så här jobbade teamet" — AutoGen Studio-mönstret, pedagogiskt guld i
konsult-läget).
*Klart när:* fel på deltagare 3 av 4 kastar inga betalda anrop; kunden kan läsa
varje agents oberoende perspektiv.

**0.5 `__draft`-läckan** — S
Nyckla utkastets historik/minne/underlag per körning (eller rensa
`atb_hist___draft` + mem/docs när nytt utkast med annan company sparas).
*Klart när:* företag B:s utkast minns aldrig företag A.

**0.6 Sista builder-steget ser inte hängt ut** — S
Töm panelen vid sammanställningssteget; aktiv statusrad med förfluten tid
("Formaterar 5 agenter … ~1–2 min").
*Klart när:* det finns alltid ett synligt livstecken under sista steget.

**0.7 Mobil-drawer + mobilfixar** — L
Gör ☰ till riktig drawer med hela sidebar-innehållet (agenter, rutiner, möten,
minne, första projektet). Samtidigt: auto-scrolla bara nära botten; Enter =
radbrytning på pekskärm (`pointer: coarse`); ingen autofokus-tangentbordspopp.
*Klart när:* hela arbetsytan går att använda på en mobil; man kan läsa ett
långt svar medan det strömmar.

---

## Etapp 1 — Synligt värde och förtroende ✅ byggd 2026-07-17

**1.1 Kostnadsvisning** — M
Statisk pristabell per modell (OpenRouter-katalogen har priser; Anthropic
hårdkodas) + usage ur API-svaren → "det här svaret kostade ~0,04 kr" per svar
och löpande vecko-/månadssumma i localStorage. Ersätter P2-21 i
kundresegranskningen. Visa även grov kostnadsuppskattning vid Bygg-knappen i
Buildern (Opus vs Sonnet).
*Klart när:* kunden kan svara på "vad kostar teamet i veckan?" utan att öppna
sin API-konsol.

**1.2 Källhänvisning i svar** — S
Instruktionsrad i portalens systemprompt-bygge: när ett underlag användes,
referera det vid namn ("Enligt er prislista (prislista.md)…").
NotebookLM-mönstret — trovärdighet nästan gratis.
*Klart när:* svar som bygger på underlag säger vilket.

**1.3 Empty states + kom-igång-checklista** — M
Inventera varje tom yta (minne, möteshistorik, rutiner) och ge dem en säljande
text + en primär CTA. "Kom igång"-kort med 5 steg (state i localStorage):
① riktig fråga till VD-assistenten ② första veckostarten ③ ett underlag i
minnet ④ första mötet ⑤ koppla en mapp. Ersätter P2-22.
*Klart när:* ingen yta i portalen är tom utan att föreslå nästa handling.

**1.4 Synlig underlagsbudget** — S
Grön/gul markering i Minne & underlag som visar vilka aktiva underlag som ryms
inom 12k-budgeten just nu (i dag klipps de sista tyst).
*Klart när:* kunden ser när ett dokument inte följer med.

---

## Etapp 2 — Ackumulering & proaktivitet ("teamet jobbar") ✅ byggd 2026-07-18

**2.1 Minnesförslag med godkännande + "teamet har lärt sig X"** — M
Efter avslutat samtal föreslår ingångsagenten 1–3 minnesrader ("Ska jag komma
ihåg att ni har fri frakt över 500 kr?") — ett klick skriver till minnet
(`minne.md` i mappläget). Räknare i sidhuvudet: "Teamet känner till 14 saker om
er verksamhet." ChatGPT Projects-minne med grind + Sintra Brain + B2B-progression.
*Klart när:* minnet växer utan att kunden behöver formulera det själv, och
tillväxten syns.

**2.2 Rutin-avbockning + vecko-streak** — S
Markera rutin som klar per ISO-vecka när dess prompt skickats (bock +
veckoräknare). Streak på veckonivå: "4 veckor i rad med teamet", med en
semester-freeze per kvartal.
*Klart när:* en gjord rutin ser annorlunda ut än en ogjord; streaken överlever
en semestervecka.

**2.3 "Veckan som gick"** — M
Vid första öppningen efter söndag: generera en kort summering ur lokal metadata
(antal samtal, agenter, avklarade rutiner, mötesanteckningar) + förslag på
veckans fokus. Sparas till `från-teamet/` i mappläget
(`veckobrev-YYYY-VV.md` → fil-notis via kundens egen OneDrive/Dropbox).
*Klart när:* måndagens första öppning möts av en färdig återblick + framåtblick.

**2.4 Puls-kort vid sidöppning** — M
Om >X timmar sedan sist: 2–3 genererade kort ovanför agentkorten ("12 dagar
sedan första projektet rördes", "imorgon är det fakturadag") — cacheat per dag,
opt-in i inställningarna (BYO-kostnad). Klick öppnar rätt agent förifylld.
Kräver 2.2 (rutinstatus) för bra kort.
*Klart när:* portalen har alltid något att säga vid öppning — utan att kosta
mer än ett litet anrop per dag.

**2.5 Auto-körda rutiner (`auto: true`)** — M
Rutin markerad `auto` genereras klart i bakgrunden när portalen öppnas på rätt
dag och ligger som färdigt utkast ("Måndagsbriefen är klar — läs"). Kräver 2.2.
Fältet läggs till i `templates/shared/portal-team.md` så nya team får det.
*Klart när:* teamet har redan jobbat när kunden kommer — skillnaden mellan
"väntar på order" och "medarbetare".

**2.6 "Veckans arbete"-tidslinje** — M
Rendera veckans händelser (rutiner körda, möten hållna, svar sparade) som en
tidslinjeberättelse per agent (Marblism-mönstret) — ren frontend över data som
2.2–2.5 redan producerar.
*Klart när:* kunden kan visa någon "det här gjorde mitt team i veckan".

---

## Etapp 3 — Delning, ceremoni & demo-wow ✅ byggd 2026-07-18

**3.1 Dela team utan server** — M
`#cfg=<base64>`-fragmentläge i portalen (fragment når aldrig servern) +
"Ladda ner teamfil"/"Öppna teamfil" som robust fallback (LibreChat-presets).
Löser konsultflödet "jag mailar er teamet" och backup/flytt mellan datorer.
*Klart när:* ett Builder-utkast kan delas via en länk eller fil och öppnas på
en annan dator utan D1.

**3.2 "Därför ser ert team ut så här" + anställningsceremoni** — L
Låt `prompts/shared/generate.md` + `templates/shared/portal-team.md` bära med
motiveringar, avvisade agenter och flaggor (data som redan produceras i
proposal-steget) → en statisk sida per team i portalen. Vid första öppningen:
koppla varje agent till kundens egna intake-svar ("Du sa att offerterna tar
söndagskvällarna — därför finns Offertagenten") + kort "anställningsbrev" per
agent. Quiz-effekten: sambandet med egna svar mer än dubblar upplevd träffsäkerhet.
*Klart när:* en kund kan läsa varför varje agent finns, vilka som avvisades och
varför — långt efter köpet.

**3.3 Synlig delegering: "Skicka till [agent]"** — M
Knapp per svar som skickar det (som brief) till en annan agents kontext, med
synlig handoff i loggen ("VD-assistenten skickar detta till Butiksskribenten").
Researchen designar redan kedjorna; portalen exponerar dem inte.
*Klart när:* teamet samarbetar synligt i vardagsflödet, inte bara i möten.

**3.4 Visa nejen live i Buildern** — M
Rendera research-momenten som kort som bedöms i realtid; avvisningarna får
plats i ljuset ("Fotograferingen? Nej — AI kan inte fota"). Avsluta med
divergens-frågan ("skulle det här passa en annan keramiker? Nej, för…").
*Klart när:* en åskådare ser produkten säga nej till sig själv — och förstå
varför teamet blev just detta.

**3.5 "Kvartalet med teamet"** — M
Delbar genererad summeringssida per kvartal (Wrapped-mönstret): frågor lösta,
dokument producerade, vad minnet lärt sig, agenternas bästa insats. Renderas
med showcase-CSS:en. Fira sparsamt: detta + första projektet klart + 4-veckors
streak är de enda tre "fira"-ögonblicken.
*Klart när:* kunden kan visa en branschkollega sitt kvartal — retention och
säljmaterial i samma artefakt.

**3.6 Fork-knapp per svar** — S
"Fortsätt härifrån" → ny tråd med historiken fram till den punkten
(LibreChat-mönstret). Löser urspårade samtal utan att kunden behöver förstå
kontextfönster. Passa på: tidsstämpla meddelanden (`at`) och visa datumavdelare.
*Klart när:* ett urspårat samtal går att rädda med ett klick.

---

## Etapp 4 — Positionering & copy ✅ byggd 2026-07-18

**4.1 Säljsidans positionering** — S
Skriv kärnregeln ordagrant: *"Vi bygger inte samma team åt alla — ditt team
utgår från vad just du gör i veckan."* Kontrastera mot fasta rostrar
(Sintra/Vorker-kategorin, utan att nämna namn). Prisjämförelsen: "ett
skräddarsytt team för mindre än två konsulttimmar" (ankare: 1 200–2 500 kr/h).
*Klart när:* en besökare kan återge vad som skiljer oss från "AI-anställda"-apparna.

**4.2 BYO + GDPR som säljargument** — S
Explicit på säljsidan och vid nyckelfältet: "din nyckel, ingen markup på
token, byt modell fritt; din data lämnar aldrig din webbläsare/mapp; vanliga
md-filer — ni äger er data". (Relevance/TypingMind/Obsidian-mönstren.)
*Klart när:* integritetsargumentet står på svenska köpares språk (GDPR).

**4.3 Konsult-/byråpaketering** — S (copy nu, funktion senare)
Beskriv multi-team för redovisningsbyråer och AI-konsulter ("ge dina kunder
varsitt AI-team") — `?team=<slug>` finns redan; 3.1 gör distributionen enkel.
*Klart när:* det finns en sida/sektion som talar direkt till byrå-/konsultledet.

---

## Tekniska verifieringar (görs i förbifarten, etapp 0–2)

- **FSA-permission (M1.5):** kontrollera att mappkopplingen begär Chrome 122:s
  "Allow on every visit" och visar "senaste mappar" vid start (vscode.dev-mönstret).
- **Historik-kapning:** visa diskret notis när 60-gränsen kapar äldre
  meddelanden; skicka bara ~20 senaste till API:t (sänker kostnad per fråga).
- **Clipboard-fallback** för osäker kontext (http på LAN vid demo).
- **iOS-ikon:** `apple-touch-icon` måste vara PNG (finns redan i backloggen).

## Utanför denna roadmap (medvetet)

- Allt som kräver **Stripe/backend**: M2a-2+ (kassa, webhook, provisionering),
  managed-nivån (M2b), server-side gratis-smakprov (P1-10). Ligger kvar i
  `m2-backend-spec.md`-sekvensen.
- Allt som kräver **Mikael personligen**: domänpekning, mailto-ersättning,
  "vem står bakom", bekräftade priser (P0 i kundresegranskningen).
- **Vorker-bevakning**: inte kod — men kolla deras öppna beta (~april 2026 →
  bör vara live nu) inför copy-arbetet i etapp 4.
- Vertikala **team-mallar** (fork C): egen spår i produktstrategin, skördas ur
  konsultuppdrag.

## Föreslagen arbetsordning i sammandrag

Etapp 0 komplett → 1.1–1.4 → 2.1–2.2 (ackumuleringens kärna) → 2.3–2.6 →
etapp 3 efter behov (3.1 och 3.2 först — delning och "därför"-sidan har störst
sälj-sidoeffekt). Etapp 4 kan göras när som helst — 4.1/4.2 gärna direkt, de
är bara text och Vorkers beta gör dem brådskande.
