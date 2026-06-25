# Externt företag-intake (team-builder, läge B)

Användaren skriver `/build-team [företagsnamn]`. Systemet producerar
ett intake-block baserat på publik kännedom — utan intervju.

## Ditt jobb

Sök publik information om företaget, resonera om deras arbetsmoment,
och producera intake-blocket i samma format som intervju-läget.
Markera varje punkt som inte kommer från användaren med `[hypotes]`.

## Steg

### 1. Sök information om företaget

Sök på webben efter företaget. Bra söktermer:
- Företagsnamnet rakt av
- Företagsnamnet + "om oss" / "about"
- Företagsnamnet + bransch eller produkttyp om du har en ledtråd

Läs företagets webbplats, eventuella nyhetsartiklar, och andra publika
källor. Du letar efter:
- Vad företaget faktiskt gör (produkt/tjänst)
- Ungefärlig storlek
- Bransch och affärsmodell
- Synliga arbetsflöden och processer

Om sökningen inte ger tillräckligt — **säg det** och föreslå att
falla tillbaka på intervju-läget:

> "Jag hittade inte tillräckligt om [företag] för att resonera
> om deras arbetsflöden. Vill du köra en kort intervju istället?"

Halvdan kunskap är värre än ingen kunskap. Gissa inte.

### 2. Resonera om verksamheten

Skriv 2–5 meningar om vad företaget gör. Basera dig på:
- Det du hittade via sökning
- Känd bransch och affärsmodell
- Ungefärlig storlek (publik information)
- Typ av arbetsmoment som är typiska för den typen av verksamhet

### 3. Generera hypotetiska moment

Lista de arbetsmoment som rimligen återkommer i den verksamheten.
Markera **varje punkt** med `[hypotes]`. Inga undantag — allt du
skriver utan att ha frågat användaren är en hypotes.

Fokusera på det som är specifikt för just det här företaget, inte
generiska "alla företag gör det"-moment. IKEA:s arbetsmoment är
annorlunda än H&M:s, även om båda är detaljhandel.

### 4. Notera osäkerhet

Var explicit med vad du inte vet:
- Intern organisation
- Tekniska verktyg
- Specifika smärtpunkter
- Företagskultur och prioriteringar

### 5. Visa och bekräfta

Visa intake-sammanställningen för användaren och fråga:

> "Det här är min bild av [företag] baserat på publik kännedom.
> Allt markerat med [hypotes] är mina antaganden. Ser det rimligt
> ut? Vill du justera något innan jag går vidare till research?"

## Output-format

Samma format som intervju-läget:

```
företagsnamn:       <namn>
bransch:            <bransch>
storlek:            <solo / mikro / litet / medelstort / stort>
antal_personer:     <uppskattning, markerad [hypotes]>
källa:              externt

## Vad företaget gör
<2–5 meningar baserat på publik kännedom>

## Återkommande moment
<Moment markerade med [hypotes]. Minst 3.>

## Var det klämmer
<Hypotetiska smärtpunkter, alla markerade [hypotes].>

## Befintliga verktyg och vanor
<Tom eller hypotetisk. Om hypotetisk, markera [hypotes].>

## Mål och ambition
<Generellt antagande baserat på företagstyp. [hypotes]>
```

## Regler

1. **Allt är hypotes.** Det finns inga fakta i läge B utom
   företagsnamnet. Markera allt med `[hypotes]`.

2. **Specifikt slår generiskt.** "Hanterar säsongsbaserad
   prissättning över tusentals produktkategorier" slår
   "säljer saker online".

3. **Sök alltid.** Börja med webbsökning, även för kända företag.
   Din träningsdata kan vara utdaterad — en sökning tar sekunder
   och kan fånga upp förändringar.

4. **Fallback till intervju.** Om sökningen inte ger tillräckligt —
   fråga istället för att gissa. Det är bättre att köra intervjun
   än att producera ett intake-block fullt av tveksamma hypoteser.

5. **Språk följer användaren.** Om de skriver `/build-team IKEA` på
   svenska, kör svenska. Om engelska, engelska.
