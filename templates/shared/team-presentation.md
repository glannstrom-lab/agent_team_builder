# HTML-presentation av teamet

Genereras som sista steg i pipeline:n. En visuell, scroll-animerad
single-page HTML som presenterar det genererade teamet. Skrivs till
`.claude/agents/team-presentation.html` i målprojektet.

## Syfte

Ge användaren (och i ai-consultant-läget: kunden) en visuell
överblick av teamet som känns professionell och imponerande.
Allt innehåll ska komma från proposal och research — inget
fabricerat.

## Design

Mörk, polerad design med Inter-font. Scroll-triggered animationer.
Sektionerna nedan i ordning. All CSS och JS i samma fil — inga
externa beroenden förutom Google Fonts.

## Sektioner att generera

### 1. Hero

- Badge: "Mitt AI-team" med grön blink-prick
- Rubrik: "Ert AI-team," + företagsnamn i gradient
- Undertitel: en mening som sammanfattar teamet med branschreferens
- Tre nyckeltal: antal agenter, antal analyserade moment, antal avvisade
- Scroll-hint-pil

### 2. Teamöversikt (graf)

Visuell hierarki: VD → VD-assistent → Specialister.
Varje nod visar namn + jobb (en mening). Kopplingslinjer mellan
nivåerna.

- VD i accent-färg (indigo)
- VD-assistent i cyan
- Specialister i grön
- Max en rad per nivå, wrap vid behov

### 3. Agentdetaljer (kort)

Ett kort per agent med fade-in-animation. Varje kort innehåller:

- **Ikon** — välj en passande emoji baserat på agentens domän
- **Namn och jobb** — från proposal
- **Tag** — "Alltid närvarande" (VD, VD-assistent) eller "Specialist"
- **Kapaciteter** — lista från proposal (verb + objekt)
- **Triggas av** — som chip/tags i kursiv
- **Skills** — om agenten har föreslagna skills, visa som badges

Ordning: VD, VD-assistent, sedan specialister i prioritetsordning.

### 4. Avvisade moment

Grid med avvisade kluster/moment. Varje item:
- Namn med genomstrykning i rött
- Kort motivering varför det inte blev en agent

Sektionen har rubrik "Vad som medvetet inte blev agenter" och en
kort förklaring att avvisning är kvalitet.

### 5. Mötesfunktionen

Tre kort i grid:
- Projektgranskning (ikon: 🔍)
- Förbättring (ikon: 🔧)
- Vad gör vi härnäst (ikon: 🧭)

Varje kort: namn + en mening om vad mötet gör.

### 6. Footer

- "Byggt med Mitt AI-team"
- Research-statistik: antal moment, kluster, avvisade
- Om källa = externt: hypotes-varning

### 7. (Bara ai-consultant) Första-projekt-sektion

Infoga före "Avvisade moment":
- Projektnamn
- Problemet i kundens ord (citat)
- Vad som ska vara sant efter vecka 1
- Vem äger det

## Ikoner per domän

Välj emoji baserat på agentens jobb. Några förslag:

- Prioritering/strategi: ⚡
- Arbetspartner/triage: 🧭
- Innehåll/text: ✍️
- Rapport/dokumentation: 📊
- Offert/kalkyl: 📋
- Kundservice: 💬
- Kvalitet/granskning: 🔍
- Kod/utveckling: 💻
- Design: 🎨
- Ekonomi: 💰
- Marknadsföring: 📣

VD alltid ⚡, VD-assistent alltid 🧭.

## CSS-design

Använd exakt detta designsystem (kopierat, inte refererat):

```
:root {
  --bg: #0a0a0f;
  --surface: #13131a;
  --surface-2: #1a1a24;
  --border: #2a2a3a;
  --text: #e8e8f0;
  --text-dim: #8888a0;
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.3);
  --accent-2: #818cf8;
  --green: #34d399;
  --amber: #fbbf24;
  --red: #f87171;
  --cyan: #22d3ee;
}
```

Font: Inter via Google Fonts.
Animationer: fadeUp för hero-element, IntersectionObserver för
scroll-triggered fade-in på sektioner och kort.
Responsiv: fungera på mobil med clamp() och flex-wrap.

## Regler

1. **Allt innehåll från proposal/research.** Inget fabricerat. Om
   proposal har 3 agenter, sidan visar 3. Om 8, sidan visar 8.

2. **Språk följer resten av output.** Om teamet är på svenska,
   presentationen är på svenska.

3. **Single file.** All HTML, CSS och JS i en fil. Enda externa
   resurs: Google Fonts.

4. **Agenternas kapaciteter och triggers kopieras exakt** från
   proposal. Parafrasera inte.

5. **Avvisade-sektionen är obligatorisk.** Den visar att teamet
   är genomtänkt, inte en generisk lista.
