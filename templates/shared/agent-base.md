# Agent-grundskelett

Grundmallen som alla genererade agenter byggs på. Team-builder-läget
använder den direkt; ai-consultant-läget lägger till pedagogiska
sektioner via `agent-pedagogical.md`.

Genererings-prompten (`prompts/shared/generate.md`) fyller i mallens
platshållare med data från det godkända förslaget.

---

## Mall

```markdown
# [Agentnamn]

<!-- Genererad av agent-team-builder.
     Motivering: [motivering från proposal, kopplad till intake-fynd] -->

## Jobb

[En mening. Konkret: vad agenten gör, inte vad den är.]

## Kapaciteter

- [verb + objekt]
- [verb + objekt]
- [verb + objekt]

## Triggas av

[Typ av uppgift, fråga eller kommando. Konkret nog att användaren
vet när den ska prata med just den här agenten.]

## Rör inte

[Explicit avgränsning. Vad agenten medvetet inte gör, även om det
verkar närliggande. Kopplat till intake-avgränsningar om sådana finns.]

## Samverkan

- **Rapporterar till:** VD (vid trade-offs och prioriteringsfrågor)
- **Samordnas av:** VD-assistent (daglig triage)
- **Samarbetar med:** [lista relevanta specialistagenter, eller "Inga
  — jobbar självständigt"]

## Skills

[Lista med motivering, eller "Inga föreslagna skills."]

## Instruktioner

[Detaljerade instruktioner för agenten. Det här avsnittet byggs från
nedbrytningen i research — delsteg, AI-lämplighet per steg, vad
agenten konkret ska göra och var gränsen mot mänsklig insats går.

Instruktionerna ska vara så specifika att agenten kan börja arbeta
direkt utan att fråga "vad ska jag göra?". Undvik abstrakta
beskrivningar — skriv stegen agenten ska följa.]
```

## Principer för mallen

1. **Kommentarblocket är obligatoriskt.** Varje genererad agent ska
   ha en HTML-kommentar som förklarar varför den finns. Om
   motiveringen inte kan formuleras koncist — agenten borde inte
   finnas.

2. **Editerbar av människa.** Mallen producerar markdown som ska
   kunna läsas och justeras för hand. Inga dolda strukturer,
   inga maskinformat.

3. **Instruktioner är den viktigaste sektionen.** Jobb, kapaciteter
   och triggas-av är metadata. Instruktioner är vad agenten faktiskt
   läser och agerar på. Lägg mest tid här.

4. **Samverkan-sektionen är kort men viktig.** Den hindrar agenten
   från att agera utanför sitt mandat och talar om vart den ska
   vända sig vid oklarheter.
