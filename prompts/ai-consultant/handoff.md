# Överlämningsprompt (ai-consultant)

Körs i slutet av ett konsultuppdrag när det är dags att lämna
kunden att fortsätta själv. Producerar ett överlämningsdokument
enligt `templates/ai-consultant/handoff-document.md`.

## Förutsättning

- Mognadsintake finns (mognadsnivå, projektägare, framgångskriterium)
- Agent-team har genererats i `.claude/agents/`
- Första projektet har startats (helst avslutats eller nått
  tillräckligt långt för utvärdering)

## Input

1. **Intake-data** — företagsnamn, mognad, projektägare
2. **Agent-teamet** — lista från `.claude/agents/`
3. **Första-projekt-briefen** — `.claude/agents/first-project-brief.md`
4. **Erfarenheter från uppdraget** — vad fungerade, vad fungerade
   inte, vad lärde sig kunden

## Ditt jobb

Producera ett överlämningsdokument som gör kunden självständig.
Dokumentet ska svara på fyra frågor:

1. **Vad har vi?** Inventering av teamet och varför det ser ut
   som det gör.
2. **Hur ändrar vi det?** Konkreta exempel.
3. **När ska vi ringa tillbaka?** Tecken på tillväxt.
4. **Vad gör vi sen?** Nästa steg.

## Steg

### 1. Inventera teamet

Läs alla filer i `.claude/agents/` och sammanfatta:
- Varje agent: namn, jobb, varför den finns
- Vilka som används mest (om det kan härledas)
- Vilka som inte verkar ha använts (dito)

### 2. Samla erfarenheter

Fråga kunden (om du inte redan vet):
- Vilken agent har ni pratat mest med?
- Är det något som inte fungerar som tänkt?
- Har något nytt dykt upp som inte täcks av teamet?
- Hur gick första projektet?

Dessa frågor behöver inte alla besvaras — de ger dig material
för överlämningen.

### 3. Skriv överlämningsdokumentet

Följ mallen i `templates/ai-consultant/handoff-document.md`.

Språk och ton: samma pedagogikregler som resten av uppdraget
(se `prompts/ai-consultant/pedagogy.md`). Kundens ord i centrum.

### 4. Visa och bekräfta

Visa dokumentet för kunden. Fråga om det ser rätt ut. Justera
om något saknas eller är fel.

Skriv till `.claude/agents/handoff.md`.

## Regler

1. **Ärlig bedömning.** Om en agent inte fungerade — säg det.
   "Den här agenten har ni inte använt mycket. Det kan bero på
   att [anledning]. Om det fortsätter så, ta bort den — den
   tillför inget."

2. **Konkreta exempel.** "Hur ni ändrar" ska ha riktiga steg:
   "Öppna filen [filnamn]. Sektionen 'Instruktioner'. Lägg till…"
   Inte "modifiera agentens konfiguration".

3. **"Ringa tillbaka" är inte säljsnack.** Det är genuint
   användbar information: "Om ni märker att ni ställer frågor
   som ingen agent svarar bra på, eller om ert team har vuxit
   från [X] till [Y] personer — det är läge att se över teamet."

4. **Nästa steg är v2.** Koppla till version-2-skissen från
   första-projekt-briefen. Ge kunden en riktning, inte ett
   åtagande.

5. **Språk följer kunden.** Överlämningen sker på samma språk
   som resten av uppdraget.
