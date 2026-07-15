# Research

Research-steget tar intake-data och producerar en strukturerad analys av
konkreta arbetsmoment. Det är nyckelsteget i hela systemet — om research
inte hittar riktiga moment faller allt efter det platt.

## Input

Research förväntar sig ett `intake`-block med följande fält. Alla
intake-promptar (intervju, externt företag, uppdatering) ansvarar för att
leverera det här formatet.

```
företagsnamn:       <namn>
bransch:            <bransch eller domän>
storlek:            <solo / mikro / litet / medelstort / stort>
antal_personer:     <ungefärligt antal>
källa:              <intervju | externt | uppdatering>

## Vad företaget gör
<2–5 meningar om kärnverksamheten>

## Återkommande moment
<De moment som tar mest tid, i användarens egna ord. Minst 3.>

## Var det klämmer
<Smärtpunkter, flaskhalsar, irritationsmoment. I användarens egna ord.>

## Befintliga verktyg och vanor
<Vad de redan använder — mjukvara, processer, automatiseringar.
Tom om okänt (läge B).>

## Mål och ambition
<Vad de vill uppnå med ett agent-team. Kort.>

## Avgränsningar
<"Rör inte"-svar från intake — moment användaren uttryckligen vill
behålla manuella. "Inga uttryckliga avgränsningar." om inget framkom.
Proposal-steget kräver den här sektionen (regel 4) — utelämna den inte.>
```

För **läge B** (externt företag) kan "återkommande moment" och "var det
klämmer" vara hypotetiska baserat på publik kännedom. Om så, markera varje
punkt med `[hypotes]`. Research-steget behandlar hypoteser med lägre
konfidens — de motiverar förslag men inte starka rekommendationer.

För **läge C** (uppdatering) finns också:

```
## Befintligt team
<Lista över nuvarande agenter med en rad per styck.>

## Vad som har förändrats
<Vad användaren säger har ändrats sedan teamet skapades.>
```

---

## Vad research gör

Steget har ett jobb: hitta de konkreta saker som görs i verksamheten
vecka efter vecka, förstå vilka som är viktiga, och bedöma vilka som
lämpar sig för en agent.

Research gör **inte**:
- Föreslår agenter (det gör proposal)
- Bestämmer antal agenter (det gör scaling)
- Matchar mot skills (det gör proposal)
- Ger pedagogiska förklaringar (det gör ai-consultant-lagret)

### Steg 1: Identifiera arbetsmoment

Gå igenom intake-datan och lista varje konkret arbetsmoment du kan
identifiera. Ett arbetsmoment är något som:

- Återkommer (varje dag, vecka eller månad)
- Tar märkbar tid
- Har ett tydligt start- och slutresultat

**Rätt nivå:** "Skriver och publicerar nyhetsbrev varje vecka" — inte
"Klickar på publish-knappen" och inte "Kommunicerar med kunder".

Arbeta från det specifika till det generella:
1. Börja med det användaren explicit sa i intake ("återkommande moment"
   och "var det klämmer")
2. Lägg till moment som är implicita givet bransch och storlek, men
   *bara om de rimligen kan hamna över ribban*. Implicita moment som
   uppenbart inte lämpar sig för AI eller saknar smärta ska inte
   inkluderas för fullständighetens skull — de är brus.
3. Var försiktig med steg 2 — implicita moment markeras `[implicit]`
   och viktas lägre

### Steg 2: Analysera varje moment

För varje moment, bedöm:

- **Frekvens:** dagligen / flera ggr i veckan / veckovis / månadsvis
- **Tidsåtgång:** hur stor del av veckan det tar (grov bedömning)
- **Smärta:** låg / medel / hög / okänd — baserat på vad intake sa, inte
  gissning. Om intake inte tydligt signalerar smärtnivå, markera som
  `okänd` snarare än att gissa. En synlig `okänd` är ärligare än en
  "medel" som ser kvalificerad ut men egentligen är skakig.
- **Felbenägenhet:** låg / medel / hög — gör man ofta fel, missar saker?
- **Ägare:** vem gör det idag? (en person, delat, oklart)
- **AI-lämplighet:** hur väl kan en Claude-agent hjälpa till med just
  det här momentet? Bedöm ärligt. Vissa saker lämpar sig dåligt.
- **Kontextprofil:** välavgränsat / brett / bullrigt

**AI-lämplighet är den viktigaste bedömningen.** Var inte optimistisk.
En agent som ska "hjälpa med kundrelationer" utan att ha tillgång till
kundens CRM-system är teater. En agent som granskar text som redan
finns i markdown kan leverera direkt.

Faktorer som höjer AI-lämplighet:
- Momentet handlar om text, kod, analys eller strukturering
- Input och output finns i format Claude kan arbeta med
- Uppgiften har rätt/fel-kriterier eller tydliga kvalitetsmått
- Momentet kan göras stegvis med mänsklig granskning

Faktorer som sänker AI-lämplighet:
- Kräver tillgång till system Claude inte kan nå
- Kräver mänskligt omdöme som inte kan kodifieras
- Resultatet måste vara exakt rätt varje gång (bokföring, juridik)
- Momentet är redan snabbt och enkelt för en människa

**Kontextprofil:** Tre typer av moment har olika agent-konsekvenser:

- **Välavgränsat:** Tydlig input, tydlig output, lite kontextberoende.
  Bra kandidat för en fokuserad agent.
- **Brett:** Kräver kontext från flera delar av verksamheten. Kan behöva
  delas upp i smalare bitar, eller hanteras av en agent med bred syn
  (VD-assistenten).
- **Bullrigt:** Genererar mycket mellanliggande data, kräver iteration,
  producerar många artefakter. Bra kandidat för en *isolerad* agent
  även om själva uppgiften är enkel — kontextutrymmet i
  huvudkonversationen bör inte ätas upp.

### Steg 3: Hitta kluster

Arbetsmoment klustrar sig naturligt. "Skriver bloggposter", "skriver
nyhetsbrev" och "skriver produkttexter" är tre moment men de bildar
ett naturligt kluster: innehållsproduktion.

Identifiera kluster, men tvinga inte. Om ett moment står ensamt och
är tillräckligt viktigt — låt det stå ensamt. Slå inte ihop moment
med olika kontextprofiler i samma kluster om distinktionen är
meningsfull — ett välavgränsat moment och ett bullrigt moment hör
sällan hemma i samma agent.

Klustren blir embryon till agenter i proposal-steget, men research
föreslår inga agenter själv. Research säger "de här momenten hänger
ihop" — proposal avgör om de ska bli en agent.

### Steg 4: Prioritera

Rangordna klustrena efter hur mycket värde ett agent-team kan leverera
där. Värde = frekvens × tidsåtgång × smärta × AI-lämplighet.

Markera tydligt vilka kluster som hamnar *under ribban* — där
AI-lämpligheten är för låg, momentet för sällan, eller smärtan för
liten för att motivera en agent. De här listas ändå, men med en
explicit notis att de förmodligen inte bör bli agenter.

Det här är kritiskt. Kvalitetschecklistan i CLAUDE.md säger att
"minst en föreslagen agent avvisas i en typisk körning". Den
avvisningen börjar här — research måste identifiera moment som
*inte* lämpar sig, inte bara de som gör det.

### Steg 5: Förbered råmaterial för proposal

Det här steget är inte en analys i sig — det är material som proposal-
steget behöver för att kunna formulera vad en agent faktiskt ska göra.

För de kluster som prioriterats högst (typiskt de 3–5 översta), bryt
ner momenten i konkreta delsteg.

Exempel:

```
Kluster: Innehållsproduktion
Moment: Skriver bloggposter (veckovis, ~3h, hög smärta)

Delsteg:
1. Väljer ämne baserat på SEO-research och pågående projekt
2. Skriver utkast (~1500 ord)
3. Redigerar ton och struktur
4. Lägger till interna länkar och CTA
5. Publicerar via CMS

→ AI-lämplighet per steg: hög för 1-4, låg för 5 (kräver CMS-åtkomst)
→ Vad en agent konkret kan göra: leverera publiceringsklart utkast med
  SEO-optimering och intern länkning. Människan trycker på knappen.
```

---

## Output-format

Research producerar ett dokument med följande struktur. Proposal-steget
och scaling-steget förlitar sig på den.

```markdown
# Research: [företagsnamn]

## Körningsmetadata
- **Antal identifierade moment:** X
- **Över ribban:** X  |  **Under ribban:** X
- **Källa intervju:** X  |  **Implicita:** X  |  **Hypoteser:** X
- **Okänd smärta:** X moment
- **Språk:** <samma som intake>

## Sammanfattning
<3–5 meningar: vad verksamheten gör, vad som tar tid, och var
ett agent-team kan göra mest nytta.>

## Identifierade arbetsmoment

### [Moment 1: Namn]
- **Källa:** intervju / implicit / hypotes
- **Frekvens:** ...
- **Tidsåtgång:** ...
- **Smärta:** ... (låg / medel / hög / okänd)
- **Felbenägenhet:** ...
- **Ägare:** ...
- **AI-lämplighet:** hög / medel / låg
- **Kontextprofil:** välavgränsat / brett / bullrigt
- **Notering:** <Kort förklaring av lämplighets-bedömningen.>

### [Moment 2: Namn]
...

## Kluster

### Kluster A: [Namn]  — prioritet 1
- **Ingående moment:** [lista]
- **Samlad AI-lämplighet:** hög / medel / låg
- **Notering:** <Varför de hänger ihop. Vad en agent i det här
  området faktiskt skulle göra.>

### Kluster B: [Namn]  — prioritet 2
...

### Under ribban
<Kluster eller enskilda moment som inte motiverar en agent.
Förklara kort varför för varje.>

## Nedbrytning av toppkluster

### [Kluster A: Namn]

#### [Moment: Namn]
Delsteg:
1. ...
2. ...
→ AI-lämplighet per steg: ...
→ Vad en agent konkret kan göra: ...

...

## Kontextfaktorer

<Saker som påverkar hela teamet men inte är enskilda moment.
Exempelvis: "företaget jobbar helt remote", "all dokumentation
är i Google Docs", "VD:n är den enda tekniska personen".
Dessa matas vidare till scaling och proposal.>

## Osäkerheter och motsägelser

<Vad research inte vet och som intake inte besvarade. Saker som
kan påverka agent-designen men som kräver mer information.
Proposal-steget bör flagga dessa för användaren.

Inkludera också eventuella motsägelser i intake-svaren.
Hellre flagga än att tyst välja sida.>
```

---

## Diff-sektion (bara läge C)

När intake innehåller "befintligt team" och "vad som har förändrats",
utökas output med:

```markdown
## Diff

### Nya moment
<Moment som inte fanns när teamet skapades.>

### Förändrade moment
<Moment som finns men har ändrat karaktär (mer/mindre tid,
ny ägare, förändrad smärta).>

### Borttagna moment
<Moment som inte längre är relevanta.>

### Befintliga agenter som påverkas
<Vilka nuvarande agenter som berörs av förändringarna,
och hur.>
```

---

## Regler

1. **Konkret slår abstrakt.** "Granskar pull requests" slår
   "kvalitetssäkrar kod". "Svarar på supportmejl" slår "hanterar
   kundrelationer". Om du inte kan formulera momentet som en konkret
   handling som tar tid — det är inte ett moment, det är en etikett.

2. **Intake-ord slår dina ord.** Om användaren sa "vi lägger typ tre
   timmar i veckan på att jaga fakturor" — skriv det. Parafrasera inte
   till "optimerar faktureringsflödet".

3. **Markera osäkerhet.** `[implicit]` och `[hypotes]` är inte
   fusk — de är kvalitetssignaler. En research utan dem ser polerad
   ut men är förmodligen övermodig.

4. **Hypoteser (läge B) får inte driva agentval ensamma.** Proposal-
   steget ska vara medveten om att ett moment markerat `[hypotes]`
   kan vara fel. Om ett helt kluster bara vilar på hypoteser bör
   agenten som proposal-steget föreslår markeras som tentativ.

5. **Var villig att hitta lite.** Ett soloföretag med en person kanske
   har 5–8 moment, varav 3 lämpar sig för AI. Det är ett legitimt
   resultat. Pumpa inte upp det för att det känns tunt.

6. **VD-momentet.** Om intake innehåller indikationer på prioritering,
   riktning eller beslut — lyft fram dem särskilt, eftersom de motiverar
   VD-agenten i nästa steg. Om företaget är litet ska sådana moment
   vara operativa ("prioritera veckans tasks") inte abstrakta ("sätta
   strategisk riktning"). Om intake *inte* innehåller sådana
   indikationer, notera det i "Osäkerheter" istället för att hitta på.

7. **Det viktigaste testet.** Om research-outputen för tre olika
   företag ser likadan ut — prompten är trasig. Den ska fånga det
   som är *specifikt* för just det här företaget, inte mappa tillbaka
   mot en generisk branschmall. Om du märker att du skriver samma
   moment för alla: stanna och gå tillbaka till intake-datan.

8. **Motsägelser flaggas, inte löses.** Om intake-svaren säger emot
   varandra — notera det i "Osäkerheter och motsägelser". Välj inte
   tyst en sida. Proposal-steget tar det vidare till användaren.

9. **Språk följer intake.** Research-outputen skrivs på samma språk
   som intake — inte översatt, inte blandat. Om intake är på svenska
   är research på svenska. Om intake är på engelska är research på
   engelska. Modellen defaultar gärna till engelska i analytiskt läge;
   den impulsen ska motstås. Kontrollera stavning och grammatik i
   outputen innan leverans — slarvig output underminerar förtroendet
   för hela analysen.

10. **Körningsmetadata ska stämma.** Innan du levererar, kontrollera
    att siffrorna i körningsmetadata matchar resten av dokumentet:
    - "Över ribban" = antal kluster som *inte* listas under "Under
      ribban"
    - "Under ribban" = antal moment/kluster som explicit avvisas
    - "Över ribban" + "Under ribban" behöver inte summera till
      totalt antal moment (ett moment kan ingå i ett kluster),
      men siffrorna ska vara konsistenta med kluster-sektionen.
    Om de inte stämmer — rätta siffrorna, inte texten.
