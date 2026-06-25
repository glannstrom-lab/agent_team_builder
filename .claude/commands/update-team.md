# /update-team

Uppdaterar ett befintligt agent-team baserat på vad som förändrats.

## Förutsättning

`.claude/agents/` måste finnas och innehålla agenter. Om den inte
finns — säg det och föreslå `/build-team` istället.

## Flöde

Samma pipeline som `/build-team` men med uppdaterings-intake:

```
Läs befintligt team → Fråga om förändringar → Research (med diff) →
Skalning → Förslag (med diff) → Bekräftelse → Applicera
```

### Steg 1: Uppdaterings-intake

Läs `prompts/team-builder/intake-update.md` och följ den.

### Steg 2–4: Research, skalning, förslag

Samma som `/build-team` men research producerar en diff-sektion
och proposal jämför med befintligt team.

### Steg 5: Visa diff

Innan något skrivs — visa exakt vad som ändras:

```
Föreslagna ändringar:

Nya agenter:
+ [agentnamn]: [jobb]

Ändrade agenter:
~ [agentnamn]: [vad som ändras]

Borttagna agenter:
- [agentnamn]: [varför]

Oförändrade:
= [agentnamn]: Ingen ändring
```

**Vänta på godkännande.** Applicera inget utan explicit OK.

### Steg 6: Applicera

Skriv ändringarna. Visa vilka filer som uppdaterades.

## Regler

1. Default är torrkörning — inget skrivs utan godkännande
2. Bevara det som fungerar — rör inte agenter som användaren
   är nöjd med
3. Föreslå justering framför ersättning
4. Språk följer befintligt team
