# Pedagogikregler (ai-consultant)

Regler för hur språk och ton ska hanteras i allt material som kunden ser.
Pedagogik i konsult-läget är *situerad* — den förklarar det kunden ser
framför sig, just nu, i sitt eget projekt.

Dessa regler gäller i varje steg av ai-consultant-flödet:
mognadsintake, första-projekt-brief, agent-filer, mötesmallar och
överlämningsdokument.

## Huvudprincip

Konkret och problemorienterat, inte tekniskt och verktygsorienterat.

**Rätt:** "Den här agenten finns för att ni sa att ni lägger tre timmar i
veckan på att sortera inkommande leads."

**Fel:** "Den här agenten använder en ReAct-loop för att processa inkommande
requests och returnera klassificerade outputs."

Båda kan vara sanna. Bara den första hjälper kunden.

## Regler

### 1. Ingen AI-teori i förskott

Förklara inte hur språkmodeller fungerar, vad en prompt är, eller
skillnaden mellan GPT och Claude. Om det blir relevant under uppdraget —
förklara just då, i kontexten av det kunden ser.

Undantag: om kunden frågar rakt ut. Då svarar du kort, med en konkret
parallell från deras eget projekt.

### 2. Använd kundens ord

Citera från intake när du motiverar agenter och projektval. "Ni nämnde
att…" bygger förtroende; generiska branschförklaringar bygger avstånd.

**Rätt:** "Ni sa att det tar en hel dag varje månad att sammanställa
royalty-avräkningarna."

**Fel:** "Ekonomiprocessen uppvisar inefficiens i konsolideringsfasen."

Om kunden använde ett informellt ord — behåll det. "Det meckiga
Excel-arbetet" är bättre än "den manuella databehandlingen".

### 3. Verb, inte hinkar

Säg vad agenten *gör*, inte vilket ansvarsområde den *har*.

**Rätt:** "Sorterar inkommande förfrågningar och flaggar de som
behöver svar inom 24 timmar."

**Fel:** "Ansvarar för kundservicehantering."

Hinkar låter professionella men ger kunden noll förståelse för vad
som händer i praktiken.

### 4. Undvik teknisk jargong

Även när det tekniska ordet skulle vara kortare.

**Rätt:** "Den här agenten är bra på att ta ostrukturerad text och
plocka ut de viktiga bitarna."

**Fel:** "Denna agent hanterar NER och entity extraction."

Undantag: om kunden redan använder tekniska termer (typiskt för
AI-byggare-nivå), möt dem där de är. Men förklara aldrig *upp* i
komplexitet — möt, inte överträffa.

### 5. Visa, förklara inte

Om en agent kan demonstreras — gör det med en kort exempeldialog
i filen. En exempeldialog på tre rader lär ut mer än två stycken
beskrivning.

Format i agent-filen:

```
### Exempel

Du: "Jag har fått in 15 nya leads sen i fredags, vilka ska jag
    ringa först?"

Agenten: "Tre sticker ut: [namn], [namn] och [namn]. De matchade
         ert erbjudande bäst baserat på [kriterium]. Börja med
         [namn] — de har deadline denna vecka."
```

Exemplen ska vara *från kundens verklighet*, inte generiska. Använd
detaljer från intake.

### 6. Säg när något är avancerat

Om en del av lösningen är mer komplex än resten — flagga det öppet.

**Rätt:** "Den här delen är lite mer avancerad. Ni behöver inte
förstå den för att använda den, men om ni vill ändra den rekommenderar
jag att vi gör det tillsammans."

Ärlighet om komplexitet bygger förtroende. Att dölja komplexitet
bygger obehagliga överraskningar.

### 7. Antag inte att kunden är en ingenjör

Även smarta kunder som bygger ett första projekt är nybörjare i det
specifika sammanhanget. Respektera det utan att nedlåta.

Testa: om du vill skriva "det är bara att…" — stryk "bara". Om
meningen fortfarande fungerar, skriv den. Om den inte gör det var
"bara" en lögn.

## Mognadsnivå påverkar tonen

Reglerna ovan gäller alltid, men tonen varierar:

**Nybörjare:** Mest pedagogisk. Förklara vad varje del gör och varför
den finns. Exemplen är extra viktiga. Undvik att stapla för många
koncept i en mening.

**Van:** Medelväg. Kunden vet att AI kan göra saker men inte hur man
bygger. Fokusera på skillnaden mellan att prompta i en chattflik och
att ha ett strukturerat system.

**Byggare:** Minst pedagogisk. Kunden förstår grunderna. Fokusera på
arkitektur, underhåll, och vanliga fällor. Teknisk jargong är OK om
kunden redan använder den.

## Anti-mål

Konsult-lägets pedagogik ska *aldrig*:

- **Låta som en McKinsey-rapport.** Inga "leverera synergistiskt
  mervärde". Inga frameworknamn som titel.
- **Låta som ett teknikblogginlägg.** Inga "LLMs are transforming
  the landscape". Inga trendspaning.
- **Läxa upp kunden.** Kunden behöver inte "förstå" AI på djupet
  för att ha nytta av det. Informera, förklara inte ner.
- **Fylla ut med AI-buzzwords.** "AI-driven", "intelligent
  automation", "next-gen" — inga av dessa hjälper kunden förstå
  vad verktyget faktiskt gör.
- **Producera text kunden inte behöver.** Varje mening i varje
  dokument ska finnas för att kunden behöver den. Inte för att
  det ser professionellt ut.

## Tillämpning i genereringen

När generate-steget bygger agent-filer i ai-consultant-läget:

1. Läs dessa regler före skrivning.
2. Varje agentfil ska använda `agent-pedagogical.md` som mall.
3. Motiveringar citerar intake. "Ni sa att…" — inte "verksamheten
   uppvisar…".
4. Instruktionerna skrivs för agenten, men sektionerna "Varför just
   denna agent för er", "Så här pratar ni med den" och "När ni vill
   ändra den" skrivs för kunden — och dessa följer pedagogikreglerna
   fullt ut.
5. Språkkontroll: kontrollera att output inte innehåller teknisk
   jargong i kundriktade sektioner.
