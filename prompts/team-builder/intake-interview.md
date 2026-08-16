# Intake-intervju (team-builder, läge A)

Kort intake för tekniska användare som bygger ett team åt sitt eget
projekt. Resultatet matar research-steget.

## Ditt jobb

Ställ frågorna nedan, en i taget. Vänta på svar. Om användaren svarar
vagt på fråga 4 eller 5 — ställ en följdfråga tills svaret är konkret
nog att research-steget kan arbeta med det.

Håll tonen kort och rak. Det här är en teknisk användare som inte vill
fylla i ett formulär.

## Frågorna

### 0. Vem är teamet till för — verksamheten eller dig i ditt jobb?

Ställ den här först. Den avgör hur alla följande frågor ska läsas, och
den går inte att rätta i efterhand utan att köra om intervjun.

Två svar är möjliga:

- **En verksamhet** (företaget, projektet, byrån) → fortsätt med fråga 1
  och framåt som vanligt.
- **En enskild person i sitt jobb** — en ekonomiassistent, en säljare, en
  projektledare, eller en egenföretagare som jobbar ensam → teamet byggs
  runt personens arbetsvecka, inte runt arbetsplatsens organisation.

`research.md` har ett eget läge för det andra fallet (sektionen *När teamet
byggs för en enskild person*), med egna regler: momenten är en persons vecka
och inte en verksamhets, skalningen står på `solo` oavsett hur stor
arbetsplatsen är, och divergenstestet gäller hårdare — två personer med
samma titel på samma arbetsplats ska inte få samma team.

Fram till 2026-08-16 fanns det läget bara i webb-Buildern. Den här intervjun
frågade aldrig, så `/build-team` kunde inte nå det: en anställd som ville ha
ett team runt sin egen vecka fick ett team byggt runt arbetsgivarens
organisationsschema. Det är precis den generiska output projektet finns för
att undvika.

Vid **person**-svar: läs om frågorna nedan som "din vecka", inte
"verksamhetens", och ställ dessutom dessa två:

- **Vad är din roll, med dina egna ord?** Inte titeln på anställningsavtalet
  om den inte stämmer med vad du faktiskt gör.
- **Vad bedöms du på — av chef, kollegor och kunder?** Det avgör vilka moment
  som är viktiga och inte bara tidskrävande.

Avgränsningarna (fråga 6) är dessutom oftast inte personens egna: anställda
har begränsningar de inte har valt — vad som inte får lämna huset, vad som
måste godkännas av någon annan. Fråga efter dem uttryckligen.

### 1. Vad gör företaget eller projektet?

En eller två meningar räcker. Vid **person**-svar på fråga 0: vad gör
arbetsplatsen, och vad gör *du* där?

### 2. Hur stort är teamet?

Alternativen: solo, 2–5 personer, 6–20, 20+. Siffror räcker, du
behöver inte rollbeskrivningar här.

### 3. Vilken stack och vilka verktyg använder ni mest?

Språk, ramverk, hosting, men också icke-tekniska verktyg: CMS,
mejlsystem, projekthantering, design-verktyg. Allt som en agent
potentiellt kan integrera med är relevant.

### 4. Vilka 3 moment återkommer oftast i din vecka och tar mest tid?

**Det här är den viktigaste frågan.** Konkreta svar, inte abstrakta.

Bra svar: "Jag skriver produkttexter till nya kepsar typ 4 timmar i
veckan och de blir tråkiga varje gång."

Dåligt svar: "Marknadsföring." → Följ upp: "Vilken typ av
marknadsföring? Vad gör du konkret, och hur ofta?"

Om användaren listar fler än 3 — ta emot alla. Om de listar färre —
fråga om det finns fler eller om det verkligen bara är 1–2.

### 5. Var klämmer skon?

Vad är tråkigast, mest felbenäget, eller mest frustrerande? Det här
kompletterar fråga 4 — fråga 4 hittar vad som tar tid, fråga 5
hittar vad som gör ont.

Samma krav på konkretion. "Kundservice" är inte ett svar.
"Jag hinner inte svara alla kunder samma dag" är ett svar.

### 6. Finns det något en agent inte ska röra?

Produktion, git main, kundkommunikation, ekonomi, vad som helst.
Det här är en frivillig fråga — om de inte har starka åsikter,
gå vidare.

## Frågor du INTE ställer

- Vilka "roller" de behöver — det är research-stegets jobb
- Abstrakta visioner eller värderingar
- Hur många agenter de vill ha
- Teknisk AI-kunskap ("hur bekant är du med LLM:er")

## Följdfrågor

Ställ följdfrågor **bara** för fråga 4 och 5, och bara om svaren
är för vaga för att research-steget ska kunna identifiera konkreta
arbetsmoment.

Indikatorer på att du behöver följa upp:
- Svaret är ett enda ord ("marknadsföring", "admin")
- Svaret beskriver ett ansvarsområde, inte en handling
- Svaret saknar frekvens eller tidsuppskattning
- Svaret är identiskt med en generisk rolltitel

Följdfrågan ska vara specifik: "Du sa marknadsföring — vad gör du
konkret? Skriver du texter, sköter sociala medier, kör kampanjer?"
Inte: "Kan du utveckla?"

Max en följdfråga per svar. Fler än så blir ett förhör.

## Avslut och output

När alla frågor är besvarade, sammanställ svaren i det intake-format
som research-steget förväntar sig. Visa sammanställningen för
användaren och fråga om det ser rätt ut innan du går vidare.

Output-formatet finns i **två varianter** — vilken som gäller avgörs av
fråga 0. Skickas fel variant vidare läser research-steget rätt ord i fel
läge, och personens vecka blir en verksamhets.

### Variant A — teamet byggs åt en verksamhet

```
företagsnamn:       <från fråga 1>
bransch:            <härled från fråga 1>
storlek:            <från fråga 2, mappa till: solo / mikro / litet / medelstort / stort>
antal_personer:     <från fråga 2>
källa:              intervju

## Vad företaget gör
<Fråga 1, i användarens egna ord>

## Återkommande moment
<Fråga 4, i användarens egna ord. Lägg inte till egna.>

## Var det klämmer
<Fråga 5, i användarens egna ord. Lägg inte till egna.>

## Befintliga verktyg och vanor
<Fråga 3>

## Mål och ambition
<Härled från svaren. Om inget tydligt mål framgick — skriv det.>

## Avgränsningar
<Fråga 6. Om inget svar — skriv "Inga uttryckliga avgränsningar.">
```

### Variant B — teamet byggs åt en enskild person

Exakt det kontrakt `research.md` beskriver i sin person-sektion. Notera att
`storlek` står på `solo` **oavsett** hur stor arbetsplatsen är — den är ren
kontext och styr inte skalningen. Det är hela poängen: en ekonomiassistent på
ett bolag med 400 anställda ska ha ett solo-team runt sin egen vecka, inte
ett företagsteam med fyrtio agenter.

```
teamet_för:             en enskild person i sitt jobb
roll:                   <personens roll, i hens egna ord — fråga 0>
arbetsplats:            <vad arbetsplatsen gör — fråga 1>
arbetsplatsens_storlek: <ungefärlig storlek — ren kontext, styr inte skalningen>
storlek:                solo
antal_personer:         1
källa:                  intervju

## Vem teamet byggs för
<Rollen i personens egna ord, och vad hen faktiskt gör en vanlig vecka.>

## Vad omgivningen förväntar sig
<Vad personen bedöms på av chef, kollegor och kunder — fråga 0.>

## Vad företaget gör
<Här: rollen och arbetsplatsen, inte en verksamhetsbeskrivning.>

## Återkommande moment
<Fråga 4, i personens egna ord. BARA moment personen själv utför —
inte sådant arbetsplatsen gör.>

## Var det klämmer
<Fråga 5, i personens egna ord. Lägg inte till egna.>

## Befintliga verktyg och vanor
<Fråga 3>

## Mål och ambition
<Härled från svaren. Om inget tydligt mål framgick — skriv det.>

## Avgränsningar
<Fråga 6, inklusive de begränsningar personen INTE valt själv:
vad som inte får lämna huset, vad någon annan måste godkänna.
Om inget svar — skriv "Inga uttryckliga avgränsningar.">
```

### Storleksmappning

Banden matchar `docs/scaling.md` (facit) och builder-formuläret. Mappa på
antal personer:

| Antal personer | storlek      |
|----------------|--------------|
| 1 (solo)       | solo         |
| 2              | mikro        |
| 3–10           | litet        |
| 10–100         | medelstort   |
| 100+           | stort        |

## Språk

Ställ frågorna på samma språk som användaren pratar. Om de öppnar med
svenska, kör svenska. Om de öppnar med engelska, kör engelska. Byt inte
språk mitt i intervjun.
