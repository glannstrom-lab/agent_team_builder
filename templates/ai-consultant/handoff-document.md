# Överlämningsdokument (ai-consultant)

Mall för överlämningsdokumentet som produceras i slutet av ett
konsultuppdrag. Kunden får detta som `.claude/agents/handoff.md`.

Dokumentet ska vara fristående — kunden ska kunna läsa det sex
månader senare och fortfarande förstå vad de har, hur de ändrar
det, och vad nästa steg är.

---

## Mall

```markdown
# Överlämning: [företagsnamn]

## Vad ni har

Ert AI-team har [antal] agenter, byggda utifrån det vi pratade
om under uppdraget.

### Teamet i korthet

| Agent | Jobb | Varför den finns |
|-------|------|------------------|
| VD | [jobb, en mening] | [kopplat till intake] |
| VD-assistent | [jobb] | Alltid närvarande — er startpunkt |
| [Specialist 1] | [jobb] | [kopplat till intake] |
| [Specialist 2] | [jobb] | [kopplat till intake] |
| ... | ... | ... |

[Om en agent inte användes under uppdraget, notera det:
"[Agent] — den här agenten skapades för [syfte] men användes
inte under uppdraget. Om ni inte börjar använda den inom en
månad, överväg att ta bort den."]

### Första projektet

[Status: "Ni har gjort [X]" eller "Första projektet är igång
med [status]".]

Framgångskriteriet var: "[citera från brief]"

[Utvärdering om möjlig: "Resultatet hittills: [observation]."]

## Hur ni ändrar det

Alla filer ligger i `.claude/agents/`. Varje fil är en vanlig
textfil (markdown) som ni kan öppna och ändra.

### Lägga till en ny agent

1. Kopiera en befintlig agent-fil (t.ex. `[specialist].md`)
2. Ändra namn, jobb, och instruktioner
3. Berätta för VD-assistenten att den nya agenten finns
   (uppdatera listan i `chief-of-staff.md` under Instruktioner)

### Ändra en befintlig agent

Öppna filen. Sektionen **Instruktioner** styr vad agenten gör.
Ändra där om agenten beter sig fel eller om ni vill att den ska
göra mer.

Sektionen **Rör inte** är en säkerhetsgräns — ändra den med
eftertanke.

### Ta bort en agent

Radera filen. Uppdatera VD-assistentens lista i
`chief-of-staff.md`.

[Mognadsnivå = nybörjare: Lägg till en uppmuntran:
"Det är helt okej att ta bort agenter som inte används. Färre
agenter som fungerar är bättre än många som ni glömmer bort."

Mognadsnivå = byggare: Lägg till teknisk detalj:
"Om agenten har samverkan med andra, kontrollera att inga
andra agenter refererar till den i sin samverkan-sektion."]

## När ni ska höra av er

Här är några tecken på att det är dags att se över teamet
eller ta in hjälp igen:

- **Ni ställer frågor som ingen agent svarar bra på.**
  Det betyder att det finns ett gap i teamet.
- **Ert företag har vuxit** — fler personer, nya roller, nya
  typer av arbete. Teamet är byggt för [storlek] — om ni
  dubbleras kan strukturen behöva justeras.
- **Ni har slutat använda en agent** och den har legat
  oanvänd i mer än en månad. Ta bort den — eller fråga
  er varför den inte används.
- **Första projektet har mognat** och ni vill ta nästa
  steg (se nedan).
- **Ni vill bygga något mer avancerat** — t.ex. kopplingar
  mellan agenter, automatiserade flöden, eller integration
  med era befintliga system.

[Anpassa punkterna till kundens specifika situation. Om de
t.ex. nämnde att de planerar anställa, referera till det.]

## Nästa steg

Under uppdraget identifierade vi en naturlig version 2:

**[V2-projektets namn/beskrivning]**

[Citera från första-projekt-briefens v2-sektion.]

Det bygger på det ni redan har. [Kort beskrivning av vad som
tillkommer och varför det är ett logiskt nästa steg.]

[Om det finns ytterligare idéer som dök upp under uppdraget:
"Vi pratade också om [idé]. Det är inte lika akut men värt
att ha i bakhuvudet."]

---

*Överlämnat [datum]. Lycka till — ni har en bra grund att
bygga vidare på.*
```

## Principer

1. **Fristående.** Kunden läser detta utan dig. Allt som
   refereras ska finnas i dokumentet eller i agent-filerna.
   Inga "som vi pratade om" utan kontext.

2. **Realistisk bedömning.** Om en agent inte fungerade, säg
   det. Om första projektet inte nådde målet, säg det.
   Överlämningen är inte en säljpitch.

3. **"Ringa tillbaka" är inte säljsnack.** Det är genuint
   användbar information som hjälper kunden förstå livscykeln
   för sitt team.

4. **Nästa steg ger momentum.** Överlämningen ska inte kännas
   som ett slut utan som en station. Kunden ska veta vart de
   är på väg, inte bara var de är.

5. **Anpassad efter mognad.** Nybörjare: mer hand-holding i
   "hur ni ändrar". Byggare: tekniska detaljer, kortare
   förklaringar.
