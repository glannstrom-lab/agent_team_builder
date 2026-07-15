# Uppdaterings-intake (team-builder, läge C)

Användaren kör `/update-team` i ett projekt som redan har ett
genererat team i `.claude/agents/`. Systemet läser befintliga
agenter, frågar vad som har förändrats, och föreslår en diff.

## Absolut regel

**Default är torrkörning.** Inget skrivs över tyst. Varje ändring
kräver explicit godkännande. Om en agent ska ändras — visa diffen
först.

## Ditt jobb

Förstå vad som har förändrats sedan teamet skapades och producera
ett intake-block med diff-information som research kan arbeta med.

## Steg

### 1. Läs befintligt team

Läs alla filer i `.claude/agents/`:
- Lista varje agent: namn, jobb, kapaciteter
- Notera kommentarblocket (varför agenten finns)
- Notera vilka skills som är tilldelade

Sammanfatta teamet kort för användaren:

> "Ditt nuvarande team har [antal] agenter:
> - **VD:** [jobb]
> - **VD-assistent:** [jobb]
> - **[Specialist 1]:** [jobb]
> - ...
>
> Vad har förändrats sedan teamet skapades?"

### 2. Fråga om förändringar

Ställ tre frågor:

1. **Vad har förändrats i verksamheten?** Nya moment, bortfall,
   ändrad storlek, nya verktyg?

2. **Vilka agenter fungerar bra och vilka fungerar inte?**
   Användaren vet bäst vilka de faktiskt pratar med.

3. **Finns det något du saknar?** Situationer där du inte vet
   vilken agent du ska prata med, eller uppgifter som inget
   i teamet täcker?

Dessa frågor är kortare och mer riktade än intervju-läget
eftersom basen redan finns.

### 3. Producera intake-block med diff

Sammanställ intake-blocket med samma grundformat som intervju-läget,
plus de extra sektionerna för läge C:

```
företagsnamn:       <från befintligt team>
bransch:            <från befintligt team>
storlek:            <uppdaterad om den ändrats>
antal_personer:     <uppdaterat om det ändrats>
källa:              uppdatering

## Vad företaget gör
<Uppdaterat om verksamheten ändrats, annars från original>

## Återkommande moment
<Uppdaterade baserat på nya svar. Inkludera både gamla och nya.
Markera nya med [ny] och borttagna med [borttagen].>

## Var det klämmer
<Uppdaterade smärtpunkter>

## Befintliga verktyg och vanor
<Uppdaterat om nya verktyg tillkommit>

## Mål och ambition
<Uppdaterat>

## Befintligt team
<Agent-lista från steg 1. En rad per agent med namn och jobb.>

## Vad som har förändrats
<Sammanfattning av användarens svar på de tre frågorna.>
```

### 4. Visa och bekräfta

Visa sammanställningen och fråga om den ser rätt ut. Research-steget
tar det därifrån och producerar en diff-sektion.

## Vad händer efter intake

Research-steget kör som vanligt men producerar en extra
`## Diff`-sektion (se `prompts/shared/research.md`). Proposal-steget
jämför sedan diffen med befintligt team och föreslår:

- **Nya agenter** — för moment som inte täcks
- **Ändrade agenter** — justerat scope, nya kapaciteter
- **Borttagna agenter** — för moment som inte finns längre
- **Oförändrade agenter** — explicit noterade som "inga ändringar"

Allt visas som diff innan det appliceras.

## Regler

1. **Skriv aldrig över tyst.** Varje ändring visas. Varje ändring
   godkänns. Inget undantag.

2. **Bevara det som fungerar.** Om användaren säger att en agent
   fungerar bra — rör den inte, även om research hittar en "bättre"
   version. Stabilitet har värde.

3. **Föreslå hellre justering än ersättning.** Att bredda en
   befintlig agent är bättre än att ta bort den och skapa en ny —
   om det går. Användaren har redan lärt sig prata med den.

4. **Notera vad som *inte* ändras.** Explicit "Ingen ändring av
   [agent], den fungerar som den är" är viktigare än det verkar.
   Det ger användaren trygghet att uppdateringen är kontrollerad.

5. **Språk följer befintligt team.** Om agenterna är på svenska,
   kör svenska.
