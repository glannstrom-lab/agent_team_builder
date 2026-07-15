# Första-projekt-brief (ai-consultant)

Dokumentet som presenterar det valda första projektet för kunden.
Produceras av `prompts/ai-consultant/first-project.md` (Output A).

Det här är det första pedagogiska dokumentet kunden ser — det sätter
tonen för hela uppdraget. Om briefen är otydlig eller abstrakt tappar
kunden förtroendet innan teamet ens är byggt.

---

## Mall

```markdown
# Första-projekt: [projektnamn i klartext]

## Problemet i era egna ord

"[Citat från intake — exakt vad kunden sa. Om det är en
sammanslagning av flera svar, ange det: 'Ni nämnde i fråga 4
att… och i fråga 7 att…']"

## Varför just det här projektet

[Kort motivering — max fyra meningar. Koppla till de sex
kriterierna utan att lista dem som checklista. Naturligt språk:

"Det här projektet passar som ert första för att det är litet nog
att ge resultat på en vecka, det ägs av en person ([namn]),
och om det inte fungerar fortsätter ni som förut. Dessutom finns
det ett naturligt nästa steg när det väl fungerar."]

## Vad som ska vara sant efter vecka 1

[Konkret. Inte "förbättrad process" utan:
"[Namn] ska kunna [verb + objekt] utan att [det som tar tid idag].
Det som idag tar [X timmar/vecka] ska ta [Y minuter/vecka]."

En eller två meningar. Testbart: om någon frågar "[Namn], fungerar
det?" ska [Namn] kunna svara ja eller nej.]

## Vem äger det

**[Namn]**, [roll].

[En mening om varför just den personen. T.ex. "Ni pekade ut [Namn]
som den som känner problemet bäst och som skulle kunna testa
lösningen i sitt dagliga arbete."]

## Hur vi mäter framgång

[Mätbart kriterium. Kopplat till fråga 8 i mognadsintake.

Bra: "Sparar [Namn] minst 3 timmar per vecka på [moment]."
Bra: "Minskar antalet fel i [process] från ~[X] till ~[Y] per månad."
Dåligt: "Förbättrar kvaliteten i processen."]

## Om det inte fungerar

[Fallback-planen. Skriven för att skapa trygghet:

"Om lösningen inte fungerar som tänkt fortsätter ni som förut —
[beskriv vad 'som förut' innebär]. Inget i er befintliga process
påverkas av att vi testar det här."

Viktig sektion för nybörjarkunder. Deras största oro är att AI-
projektet ska störa det som redan fungerar.]

## Vad som kommer sen (version 2)

[Skiss på naturlig version 2. Konkret nog att kunden ser
progressionen, vag nog att det inte blir ett åtagande.

"När [vecka-1-målet] fungerar är det naturliga nästa steget att
[v2-beskrivning]. Det bygger på samma grund men [vad som tillkommer].
Vi behöver inte bestämma det nu — men det är bra att veta att
det finns en väg framåt."]
```

## Kommentarer till generering

### Om ingen kandidat klarar alla sex kriterier

Producera **inte** denna brief. Producera istället Output B enligt
`prompts/ai-consultant/first-project.md` — en ärlig förklaring om
varför inget projekt rekommenderas just nu.

### Alternativa kandidater

Om det finns fler än en kandidat, lägg till efter huvudbrieven:

```markdown
---

## Alternativ: [Kandidat 2]

### Problemet
"[Citat]"

### Varför det också fungerar
[Kort — två meningar]

### Skillnaden mot rekommendationen
[Varför den hamnade på plats 2, inte 1]
```

Max tre kandidater totalt (en rekommendation + max två alternativ).

### Språk

Briefen skrivs på kundens språk. Citaten från intake är ordagranna.

### Pedagogisk funktion

Briefen visar kunden *hur du tänker* — varför just det här projektet,
varför inte de andra. Det bygger förtroende och lär kunden känna igen
vad som gör ett bra AI-projekt. Pedagogiken är implicit (kunden ser
ditt resonemang) snarare än explicit (du förklarar ramverket).

Nämn inte "de sex kriterierna" vid namn i kundmaterialet. Kunden
behöver inte veta att du har en checklista — de behöver se att
resonemanget hänger ihop.
