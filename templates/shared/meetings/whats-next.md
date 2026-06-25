# Mötesmall: Vad gör vi härnäst

Prioriteringsmöte. Användaren har flera möjliga trådar öppna och
behöver hjälp att välja.

## Syfte

Landa i en kort, motiverad rekommendation: gör det här först, sen
det här. Max tre prioriteringar. Om teamet inte enas fattar VD
beslutet.

## Deltagare

- **VD-assistent:** Leder, samlar perspektiv, producerar output
- **VD:** Fattar beslutet om teamet inte enas
- **Specialister:** De vars domäner innehåller kandidater

## Körning

### 1. Ram (VD-assistenten)

> **Fråga:** Vad ska vi fokusera på härnäst?
> **Kontext:** [nuläge — vad som just avslutats, vad som pågår]
> **Kandidater:** [om användaren nämnde specifika alternativ, lista dem]
> **Deltagare:** [lista]

### 2. Perspektiv (en agent i taget)

Varje agent svarar på:

1. **Vad tycker jag är viktigast från min vinkel?** En sak, max två.
2. **Varför just nu?** Vad händer om vi väntar?
3. **Vad kan vänta?** Och varför.

VD-assistenten avbryter om:
- En agent listar fler än två saker → "Välj en."
- En agent argumenterar för sin egen domän utan substans →
  "Varför är det viktigare än [alternativ X]?"

### 3. Syntes (VD-assistenten)

Sammanfatta perspektiven. Om det finns konsensus — formulera
rekommendationen. Om inte — lyft konflikten till VD.

### 4. Beslut (VD om det behövs)

VD fattar beslutet med en kort motivering. VD-assistenten
dokumenterar.

## Output-format

```markdown
# Nästa steg: [datum]

## Rekommendation

### 1. [Högsta prioritet]
**Varför:** [motivering]
**Vem driver:** [agent eller användare]
**Klart när:** [definition av done]

### 2. [Näst högst]
**Varför:** [motivering]
**Vem driver:** [agent eller användare]
**Klart när:** [definition av done]

### 3. [Om det finns en tredje]
...

## Medvetet parkerat

- [Sak som teamet bestämde kan vänta, och varför]

## Beslut av

[VD-assistent (konsensus) / VD (avgjorde)]
```

## Risker att bevaka

- **Tio saker istället för tre:** Det vanligaste felet. Om output
  innehåller fler än tre — det är inte ett prioriteringsbeslut,
  det är en att-göra-lista. Skär ner.
- **Alla vill göra sitt eget:** Naturligt men inte hjälpsamt.
  VD-assistenten ska tvinga trade-off-diskussionen.
- **Ingen vågar prioritera bort:** VD:s jobb. Påminn om det.
