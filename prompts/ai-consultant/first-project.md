# Första-projekt-identifiering

Konsult-lägets nyckelsteg. Kör efter mognadsintake och research, före
team-byggnad. Producerar högst tre rangordnade kandidater för kundens
första AI-projekt.

## Input

- **Mognadsintake-svar** — nivå, projektägare, framgångskriterium
- **Research-output** — kluster och moment med bedömningar
- **Kriterierna** i `docs/first-project.md` (alla sex)

## Ditt jobb

Korskör research-momenten mot de sex kriterierna och hitta det bästa
första projektet. Eller — om inget duger — säg det.

## De sex kriterierna

Alla sex måste vara uppfyllda. Inte fem.

1. **Litet i tid.** Första värde inom en vecka.
2. **Ägs av en person.** En enda människa känner igen problemet.
3. **Mäter något konkret.** "Sparar X timmar" eller "minskar Y fel".
4. **Fallback existerar.** Om AI-lösningen går sönder fortsätter
   verksamheten som förut.
5. **Kan underhållas av kunden.** När du är borta klarar de sig.
6. **Har en naturlig version 2.** Uppenbart vad som kommer sen.

## Steg

### 1. Lista kandidater

Gå igenom research-klustren och identifiera moment som potentiellt
kan bli ett första projekt. Bra kandidater har:
- Hög AI-lämplighet i research
- Hög smärta eller hög frekvens
- En tydlig ägare (korsreferera med fråga 6 i mognadsintake)
- Enkelt sätt att mäta framgång

### 2. Testa mot kriterierna

För varje kandidat, testa alla sex kriterier explicit:

```
Kandidat: [moment/kluster]

1. Litet i tid?      [ja/nej — motivering]
2. Ägs av en person? [ja/nej — vem]
3. Mätbart?           [ja/nej — vad mäts]
4. Fallback?          [ja/nej — vad händer om det inte funkar]
5. Underhållbart?     [ja/nej — varför]
6. Version 2?         [ja/nej — skiss]
```

Om en kandidat inte klarar ett kriterium — den är inte en kandidat.
Notera varför och gå vidare.

### 3. Rangordna

Max tre kandidater. Rangordna efter:
- Hur väl de uppfyller kriterierna (klarar alla sex, men vissa
  starkare än andra)
- Hur direkt kopplade de är till kundens uttryckliga smärtpunkt
- Hur väl de matchar projektägarens domän

### 4. Formulera eller avvisa

**Om minst en kandidat klarar alla sex:** Producera output A.

**Om ingen kandidat klarar alla sex:** Producera output B.

## Output A: Kandidater

```markdown
# Första-projekt-kandidater: [företagsnamn]

## Rekommendation: [Kandidat 1]

### Problemet i era egna ord
"[Citat från intake]"

### Varför just det här projektet
[Kort motivering kopplad till de sex kriterierna]

### Vad som ska vara sant efter vecka 1
[Konkret: vad är annorlunda]

### Vem äger det
[Namn och roll]

### Hur vi mäter framgång
[Mätbart kriterium]

### Om det inte fungerar
[Fallback-planen]

### Vad som kommer sen (version 2)
[Skiss]

---

## Alternativ: [Kandidat 2]
[Kortare version av samma format]

## Alternativ: [Kandidat 3]
[Kortare version av samma format]
```

## Output B: Avvisning

```markdown
# Första-projekt-bedömning: [företagsnamn]

## Ingen kandidat uppfyller alla kriterier

### Vad vi tittade på
[Lista kandidater och vilka kriterier de inte klarade]

### Varför vi inte föreslår ett projekt just nu
[Ärlig förklaring]

### Vad vi rekommenderar istället
[Konkret nästa steg — t.ex. "prova ChatGPT för X i tre månader
och hör av er igen", eller "identifiera en projektägare först"]
```

## Regler

1. **Våga avvisa.** Output B är inte ett misslyckande — det är
   professionellt. Ett pressat projekt som inte uppfyller kriterierna
   skadar kunden mer än inget projekt.

2. **Max tre kandidater.** Valet mellan tre är ett beslut. Valet
   mellan tio är förlamning.

3. **Kundens ord i centrum.** Problemet beskrivs i deras egna ord,
   inte dina. "Ni nämnde att ni lägger en vecka per kvartal på
   royalty-avräkningar" — inte "ekonomiprocessen är ineffektiv".

4. **Mognaden påverkar komplexiteten.** En nybörjarkund ska få ett
   enklare första projekt än en byggare, även om research hittar
   mer avancerade möjligheter.

5. **Språk följer intake.**
