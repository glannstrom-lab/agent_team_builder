# Förslags-prompt

Tar output från research och skalning, producerar agent-förslag i det
format som visas för användaren för godkännande.

**Status:** Ej skriven.

## Format per agent

```
### [Namn]
**Jobb:** En mening.
**Motivering:** Koppling till konkret fynd från research/intake.
**Triggas av:** Typ av uppgift eller kommando.
**Rör inte:** Explicit avgränsning.
**Kapaciteter:** 3–6 verb.
**Föreslagna skills:** 0–3 från skills-catalog.md, med motivering per skill.
**Skalningsnot:** (Små team:) extra hattar. (Stora team:) vad den medvetet inte gör.
```

Ai-consultant-läget lägger till:
```
**Varför just denna agent för er:** Pedagogisk koppling till intake.
```
