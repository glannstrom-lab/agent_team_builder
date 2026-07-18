# Pedagogisk agent-mall (ai-consultant)

Utökar `agent-base.md` med pedagogiska sektioner. Ungefär dubbel längd,
men innehåller allt kunden behöver för att förstå och underhålla agenten.

Alla kundriktade sektioner följer reglerna i
`prompts/ai-consultant/pedagogy.md`. Instruktionssektionen skrivs för
agenten — den behöver inte vara pedagogisk, bara precis.

---

## Mall

```markdown
# [Agentnamn]

<!-- Genererad av agent-team-builder (ai-consultant).
     Kund: [företagsnamn]
     Mognad: [nybörjare/van/byggare]
     Motivering: [motivering från proposal, kopplad till intake-fynd] -->

## Jobb

[En mening. Konkret: vad agenten gör, inte vad den är. Skrivet så att
kunden förstår direkt.]

## Varför just denna agent för er

[Citera från intake. "Ni nämnde att…" + koppling till varför den här
agenten löser det problemet. Max tre meningar.

Koppla till kundens verklighet, inte till teknisk kapacitet. Kunden
ska tänka "ja, det där problemet känner jag igen" — inte "vilken
imponerande teknik".]

## Perspektiv

[2–3 meningar: yrkesblicken agenten resonerar från — vad den alltid
letar efter och varnar för. Byggs från ett intake-/research-fynd,
inte generisk persona. Skrivet så att kunden förstår vilken sorts
kollega det här är. Två agenter i samma team delar aldrig perspektiv.]

## Kapaciteter

- [verb + objekt — vad agenten faktiskt gör]
- [verb + objekt]
- [verb + objekt]

## Leverans

[Hur ett färdigt resultat från agenten ser ut: format, omfång, ton.
Skrivet så att kunden vet vad de kan förvänta sig — och känner igen
"klart" när de ser det.]

**Klart när:**
- [kontrollpunkt som går att svara ja/nej på]
- [kontrollpunkt]

## Så här pratar ni med den

[Konkreta exempel på vad kunden skriver till agenten och vad som
händer. Inte abstrakt beskrivning utan dialog.]

### Exempel

Du: "[realistisk fråga från kundens vardag, med detaljer från intake]"

Agenten: "[realistiskt svar som visar vad agenten faktiskt gör]"

---

Du: "[en annan vanlig situation]"

Agenten: "[svar]"

[Minst två exempel. Använd kundens verklighet — produkter, moment,
namn om det finns. Generiska exempel hjälper inte.]

## Triggas av

[Typ av uppgift, fråga eller kommando. Skrivet som naturliga
situationer, inte tekniska triggers.]

## Rör inte

[Explicit avgränsning. Vad agenten medvetet inte gör, även om det
verkar närliggande. Skrivet så att kunden vet var gränsen går.]

## Samverkan

- **Rapporterar till:** VD (vid trade-offs och prioriteringsfrågor)
- **Samordnas av:** VD-assistent (daglig triage)
- **Samarbetar med:** [lista relevanta specialistagenter, eller "Inga
  — jobbar självständigt"]

## Skills

[Lista med motivering, eller "Inga föreslagna skills."]

## När ni vill ändra den

[Kort anvisning för kunden:
- Vad som kan ändras utan risk (t.ex. lägga till en trigger,
  justera en formulering i instruktionerna)
- Vad som kräver mer eftertanke (t.ex. bredda jobbet, ta bort
  en avgränsning)
- Var i filen man hittar vad

Om mognadsnivå = nybörjare, var mer explicit:
"Öppna filen [filnamn]. Sektionen 'Instruktioner' — där kan ni
lägga till nya steg. Sektionen 'Rör inte' — var försiktig med
att ändra den utan att tänka igenom vad som händer."

Om mognadsnivå = byggare, var kortare:
"Instruktionssektionen är det som styr beteendet. Resten är
metadata. Ändra fritt, men testa efter."]

## Instruktioner

[Detaljerade instruktioner för agenten. Byggs från research-
nedbrytningen: delsteg, AI-lämplighet per steg, vad agenten
konkret ska göra och var gränsen mot mänsklig insats går.

Den här sektionen skrivs för agenten, inte för kunden.
Den behöver inte vara pedagogisk — den behöver vara precis.]
```

## Skillnader mot agent-base.md

| Sektion | agent-base.md | agent-pedagogical.md |
|---------|--------------|---------------------|
| Kommentarblock | Motivering | + kund, mognad |
| Perspektiv / Leverans | Samma | Samma, men skrivna i kundvänlig ton |
| Varför just denna agent | — | Ny. Citera intake. |
| Så här pratar ni med den | — | Ny. Exempeldialoger. |
| När ni vill ändra den | — | Ny. Mognadsnivåanpassad. |
| Instruktioner | Samma | Samma (för agenten, inte kunden) |

## Principer

1. **Pedagogiken bor i tre sektioner.** Resten av filen — jobb,
   kapaciteter, instruktioner — är samma kvalitet som team-builder.
   Skillnaden är att kunden får *kontext*, inte att agenten blir
   annorlunda.

2. **Exempeldialoger är obligatoriska.** Minst två. Från kundens
   verklighet. Om du inte kan skriva ett realistiskt exempel har
   du inte förstått vad agenten gör.

3. **"När ni vill ändra den" är inte ett disclaimer.** Det är en
   genuint användbar sektion. Skriv den som om du sitter bredvid
   kunden och pekar på skärmen.

4. **Mognadsnivån påverkar tonen, inte strukturen.** Alla tre
   sektionerna finns oavsett nivå. Nybörjare får mer förklaring
   i varje sektion. Byggare får kortare, mer direkt.
