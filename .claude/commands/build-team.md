# /build-team

Genererar ett skräddarsytt agent-team för ett projekt.

## Användning

- `/build-team` — intervju-läge (A): ställer frågor, bygger team
- `/build-team [företagsnamn]` — externt företag (B): resonerar från
  publik kännedom

## Innan du börjar

1. Om `.claude/agents/` redan finns i målprojektet och innehåller
   filer — säg det och föreslå `/update-team` istället. Kör inte
   vidare utan att användaren bekräftar.

2. Läs dessa filer i ordning:
   - `CLAUDE.md` — projektets övergripande principer
   - `docs/team-builder.md` — team-builder-lägets regler
   - `docs/scaling.md` — skalningsregler
   - `docs/team-roles.md` — VD, VD-assistent, specialister

## Flöde

```
Intake → Research → Skalning → Förslag → Bekräftelse → Generera → HTML-presentation
```

Kör stegen i ordning. Hoppa inte över. Varje steg har en egen
prompt-fil som beskriver vad som ska hända.

### Steg 1: Intake

**Om `/build-team` utan argument (läge A):**

Läs `prompts/team-builder/intake-interview.md` och följ den.
Ställ frågorna en i taget. Producera intake-blocket i det format
som research förväntar sig.

**Om `/build-team [företagsnamn]` (läge B):**

Läs `prompts/team-builder/intake-external.md`. Resonera från publik
kännedom. Markera allt som `[hypotes]`. Om du inte känner till
företaget — säg det och falla tillbaka på läge A.

Visa intake-sammanställningen för användaren och fråga om den ser
rätt ut innan du går vidare.

### Steg 2: Research

Läs `prompts/shared/research.md` och kör research-steget med
intake-blocket som input. Producera research-dokumentet i det
specificerade output-formatet.

Visa research-sammanfattningen (inte hela dokumentet) för användaren:
- Antal identifierade moment
- Kluster över/under ribban
- Eventuella osäkerheter

Fråga om användaren vill se hela research-dokumentet eller gå vidare.

### Steg 3: Skalning

Läs `prompts/shared/scale.md`. Ta företagsstorlek från intake och
klusterantal från research. Producera skalningsbeslutet.

Visa: "Skalningsbeslut: X agenter (VD + VD-assistent + Y specialister).
Motivering: ..."

Gå vidare utan att vänta på godkännande — skalningen är en
mellanberäkning, inte ett förslag.

### Steg 4: Förslag

Läs `prompts/shared/proposal.md` och `skills-catalog.md`. Producera
agent-förslag baserat på research och skalning.

Visa hela förslaget för användaren:
- Varje föreslagen agent med jobb, motivering och skills
- Avvisade agenter med motivering
- Flaggade osäkerheter från research

**Vänta på godkännande.** Användaren ska kunna:
- Godkänna som det är
- Be om ändringar (ta bort en agent, lägg till en, ändra scope)
- Avbryta

Om de ber om ändringar — justera förslaget och visa igen.

### Steg 5: Generera

Läs `prompts/shared/generate.md` och mallarna i `templates/`.
Skriv agent-filerna till målprojektets `.claude/agents/`.

Generera även `team-presentation.html` — en visuell presentation av
teamet enligt `templates/shared/team-presentation.md`.

Visa sammanfattning av genererade filer inklusive HTML-presentationen.

## Regler

1. **Språk följer användaren.** Om de pratar svenska, kör hela
   flödet på svenska. Om engelska, engelska.

2. **Visa, fråga, fortsätt.** Varje steg visar sitt resultat.
   Intake och proposal kräver godkännande. Research och skalning
   visas men kräver inte godkännande.

3. **Skriv inte över tyst.** Om `.claude/agents/` redan finns —
   stanna och fråga.

4. **Om output ser likadant ut oavsett input — något är fel.**
   Det här är projektets viktigaste regel. Om du märker att du
   producerar generiska förslag — gå tillbaka till research och
   leta efter det specifika.
