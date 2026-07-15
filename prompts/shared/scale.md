# Skalningsprompt

Väljer antal agenter baserat på företagsstorlek och (för ai-consultant)
AI-mognad. Reglerna i `docs/scaling.md` är facit — den här prompten
implementerar dem.

## Input

- **Storlek** från intake (`solo / mikro / litet / medelstort / stort`)
- **Antal personer** från intake
- **Antal kluster över ribban** från research
- **(Bara ai-consultant) Mognadsnivå** från maturity-intake

## Steg

### 1. Slå upp i storlekstabellen

| Storlek                  | Agenter |
|--------------------------|---------|
| Solo / mikro (1–2)       | 2–4     |
| Litet team (3–10)        | 4–7     |
| Medelstort (10–100)      | 7–10    |
| Stort (100+)             | 10–14   |

### 2. (Bara ai-consultant) Justera för mognad

| Mognad        | Justering                                      |
|---------------|------------------------------------------------|
| Nybörjare     | 2–3 agenter oavsett företagsstorlek            |
| Van           | Hälften av storlekens normalantal              |
| Byggare       | Normal storlek enligt tabellen ovan            |

Dra inte upp en nybörjare för att det "känns snålt". Två skarpa
agenter som används varje dag slår sju som glöms bort.

Mognadstaket är ett **hårt tak**. Om research-jämförelsen (steg 3) ger
kluster + 2 högre än taket — vinner taket. Överskjutande kluster skjuts
till en framtida version, inte in i ett nybörjarteam.

### 3. Jämför med research

Research-dokumentets kluster ger en indikation på hur många
distinkta agent-domäner som finns. Jämför:

- **Kluster över ribban < tabellens minimum:** Sänk till antal
  kluster + 2 (VD + VD-assistent). Tvinga inte in agenter som
  inte motiveras.
- **Kluster över ribban > tabellens maximum:** Slå ihop kluster
  tills de ryms. Proposal-steget avgör vilka.
- **Kluster inom intervallet:** Välj ett tal i det intervall
  tabellen anger, närmast antal kluster + 2.

### 4. Output

En enda rad:

```
Skalningsbeslut: [antal] agenter (VD + VD-assistent + [antal-2] specialister)
Motivering: [Storlek X → intervall Y–Z. Research hittade N kluster
över ribban. Valde [antal] för att [kort motivering].]
```

Räkna tyst. Visa **inte** mellansteg eller resonemang i outputen — bara
blocket ovan. (Buildern kör det här steget verbatim och visar resultatet
live för kunden, så läckande tankekedja blir ett kundproblem.)

## Regler

1. Max 14 agenter. Aldrig fler.
2. VD och VD-assistent räknas alltid in i totalen.
3. Om research hittade för få kluster, skala ner. Research har rätt
   — inte storlekstabellen.
4. Om det finns en uppenbar mismatch (t.ex. stort företag men bara
   2 kluster) — notera det som en osäkerhet. Det kan bero på dålig
   intake-data.
5. Språk följer research.
