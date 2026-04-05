# Första projektet

Det här dokumentet handlar om hur ai-consultant-läget identifierar ett bra
första projekt åt en kund. Det är konsult-lägets enskilt viktigaste steg.
Dåliga första projekt dödar AI-initiativ. Bra första projekt skapar momentum
som bär kunden i månader.

## De sex kriterierna

Ett projekt är en bra första kandidat om *alla sex* är uppfyllda. Inte fem.
Alla sex.

### 1. Litet i tid

Första värde inom en vecka. Inte en månad. Inte "när vi är klara".
Användaren ska kunna peka på något konkret som är bättre efter fem arbetsdagar
och säga "detta hjälpte".

### 2. Ägs av en person

En enda människa känner igen problemet och kan prova lösningen utan att
behöva stämma av med andra. Tvärfunktionella projekt kräver koordinering
som kostar energi som kunden inte har tidigt i resan.

### 3. Mäter något konkret

"Sparar X timmar per vecka på Y". "Minskar antalet Z-fel". "Kortar tiden
från A till B".

Inte: "Förbättrar kvaliteten". Inte: "Hjälper oss fatta bättre beslut".
Inte: "Ger oss insikter". Mätbart eller inget projekt.

### 4. Fallback existerar

Om AI-lösningen går sönder eller ger dåliga resultat ska verksamheten inte
stå stilla. Det gamla sättet att göra det måste fortfarande fungera. Det
här är avgörande för förtroende på tidiga projekt — en kund som känner att
de inte kan lita på AI kommer aldrig skala upp.

Exempel på dåligt första projekt ur denna vinkel: "Automatisera alla
fakturor." Går det sönder stannar verksamheten. Exempel på bra: "Förslå
svar på vanliga kundsupportfrågor som agenten kan redigera innan de
skickas." Går det sönder skriver de svar som förut.

### 5. Kan underhållas av kunden

När du är borta ska kunden kunna förstå, ändra och utvidga det ni byggde.
Om lösningen kräver djup teknisk kompetens de inte har, har du byggt fel sak.

Det här betyder också: använd inte ovanliga eller komplicerade verktyg
bara för att de är snyggare. En vanlig Claude Code-setup som kunden redan
har går före en exotisk lösning som kräver extra installation.

### 6. Har en naturlig version 2

När v1 funkar ska det vara uppenbart vad som kommer sen. Det skapar momentum
och det ger dig som konsult en naturlig nästa fas i relationen.

Exempel: "V1: föreslår svar på supportfrågor. V2: lär sig från vilka förslag
som accepteras och förbättras över tid. V3: hanterar också interna
frågor från kollegor."

Om du inte kan formulera v2 enkelt är v1 förmodligen en återvändsgränd.

## Hur verktyget hittar kandidater

Under intake och research samlar verktyget information om:

- Vilka arbetsmoment som återkommer ofta
- Vilka som är mest irriterande
- Vilka som är mest felbenägna
- Vilka som ägs av en enskild person
- Vilka som har ett enkelt sätt att mäta framgång

Sedan korskör verktyget dessa mot de sex kriterierna och rangordnar
kandidater.

## Regeln om högst tre kandidater

Verktyget presenterar **högst tre** kandidater för första projektet, ranskade.
Inte fem, inte tio. Tre.

Varför: valet mellan tre är ett *beslut*. Valet mellan tio är *förlamning*.
Kunden ska kunna titta på listan och omedelbart ha en känsla av vilket som
är rätt. Om de inte kan det är kandidaterna för lika varandra.

## Regeln om att avvisa uppdraget

Om ingen kandidat uppfyller alla sex kriterier **ska verktyget säga det
uttryckligen**. Inte pressa fram ett projekt som inte passar. Inte välja
det "minst dåliga".

Vad systemet gör istället:

- Förklarar vilka kriterier som inte kan uppfyllas och varför
- Föreslår att gå tillbaka till mognadsintake och ompröva kundens situation
- Om kunden verkligen är för tidig för ett byggprojekt — säg det. Kanske
  behöver de prova ChatGPT några månader innan de är redo för konsult.
  Ärlighet bygger långsiktig relation, lurade kunder bygger dåligt rykte.

Det här är modigt men rätt. Verktygets jobb är att leverera värde, inte
sälja uppdrag.

## Output: första-projekt-briefen

När en kandidat har valts producerar verktyget ett dokument:
`templates/ai-consultant/first-project-brief.md`.

Innehåller:

- Problemet i kundens egna ord (citerat från intake)
- Varför det här projektet uppfyller alla sex kriterier
- Vad som ska vara sant efter vecka 1
- Vilken person hos kunden som äger projektet
- Hur framgång mäts
- Fallback-planen om det inte fungerar
- Skiss på version 2

Det här dokumentet är också det första pedagogiska materialet kunden ser.
Det visar dem hur *du* tänker när du väljer projekt. Med tiden kommer de
att börja tänka likadant själva. Det är målet.
