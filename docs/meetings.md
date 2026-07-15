# Mötesfunktionen

Ett återkommande problem: användaren säger "samla teamet om X" och vet inte
riktigt vilken sorts diskussion den vill ha. Resultatet blir en rörig
paneldiskussion där alla agenter säger lite av varje. VD-assistenten löser
det genom att **rama in mötet innan det börjar**.

## De tre mötestyperna

Alla tre är analytiska — de tar något som redan finns och får fler ögon på
det. De är inte brainstorms eller kreativa sessioner. Det är medvetet.
Kreativa möten är inte vad användaren av det här verktyget faktiskt behöver.

### 1. Projektgranskning

Bred svephandling över hela projektet eller ett större område. Varje agent
rapporterar vad den ser från sin vinkel.

**Risken:** att mötet slutar i en rörig hög med observationer.

**Lösningen:** output *måste* sluta i en rangordning. De tre viktigaste
fynden överst, resten sorterat. Om VD-assistenten inte kan producera en
rangordning är mötet inte klart.

### 2. Förbättring av något specifikt

Smalt fokus på en sak — en sida, en funktion, en process. Varje relevant
agent bidrar med konkreta förbättringsförslag.

**Risken:** att diskussionen glider iväg från den specifika saken och
blir en generell projektdiskussion.

**Lösningen:** VD-assistenten håller mötet på ämnet och avvisar utsvävningar.
Output är *handlingsbara* förslag — var och en ska kunna påbörjas direkt.
Filosofi och abstraktion räknas inte.

### 3. Vad gör vi härnäst

Prioriteringsmöte när användaren har många möjliga trådar öppna. Teamet
hjälper att välja.

**Risken:** att output blir en lista på tio saker man "kan" göra.

**Lösningen:** output är en kort, motiverad rekommendation. "Gör det här
först, sen det här, för att…". Max tre prioriteringar. Om teamet inte kan
enas ska VD fatta beslutet.

## Mötesflödet

```
Triage  →  Ram  →  Körning  →  Landning
```

### Triage

Användaren säger "samla teamet om X". VD-assistenten klassificerar förfrågan
mot de tre typerna. Om det är tvetydigt föreslår den en typ och frågar:
"Det här låter som en [typ]. Stämmer det, eller vill du något annat?"

### Ram

VD-assistenten fastställer innan någon agent får ordet:

- **Vilka agenter deltar?** Inte alla — bara de som är relevanta.
- **Vad är målet?** En mening.
- **Vad är output?** Ett konkret format för vad mötet ska producera.

Ramen presenteras för användaren för godkännande. Det tar tio sekunder och
sparar ett rörigt möte.

### Körning

VD-assistenten håller strukturen enligt mallen — ger ordet, avbryter
utsvävningar, sammanfattar faser. Agenterna pratar i tur och ordning, inte
parallellt. Ingen agent får avbryta en annan utan att VD-assistenten
släpper in den.

### Landning

Output produceras i det överenskomna formatet. VD-assistenten frågar
användaren om den vill agera direkt på output eller spara den.

## Den viktigaste regeln

**Inte allt är ett möte.**

Om användarens fråga bara berör en agent ska VD-assistenten skicka frågan
direkt dit utan att samla teamet. Mötesfunktionen devalveras om den används
för mycket. Triage-steget måste vara villigt att säga "det här behöver
inget möte, prata med specialist X".

En bra heuristik: om svaret på frågan finns hos en person i verkligheten,
behövs inget möte i agent-versionen heller.

## Mallarna

Ligger i `templates/shared/meetings/`:

- `project-review.md`
- `specific-improvement.md`
- `whats-next.md`

De genereras som en del av `/build-team` och `/consult`. De anpassas till
teamets storlek — en solo-granskning ser annorlunda ut än en enterprise-
granskning. I konsult-läget är de också anpassade för kundens mognad: en
nybörjarkund får enklare mötesmallar med mer vägledning, en byggarekund
får koncisa mallar utan pedagogik.
