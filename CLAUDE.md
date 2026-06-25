# Agent Team Builder

Ett Claude Code-projekt för att generera skräddarsydda team av subagents åt
företag och projekt. Verktyget har två lägen:

- **`team-builder`** — för dig själv och för tekniska användare som vet vad
  de håller på med. Snabb intake, direkt till team-generering.
- **`ai-consultant`** — för kunduppdrag där du hjälper mindre eller
  medelstora företag komma igång med AI. Lägger till ett första-projekt-steg
  och pedagogiska lager ovanpå samma kärna.

De två lägena delar research-motor, skalningsregler, mötesfunktion och
agent-format. Ungefär 70% är gemensamt. Läs den här filen först, sen
`docs/team-builder.md` eller `docs/ai-consultant.md` beroende på vad du
jobbar på.

## Börja här

Om du (människa eller Claude) precis har öppnat projektet:

1. Läs den här filen en gång — den tar fem minuter.
2. Titta i `examples/` för att se vad output ska likna.
3. För att utveckla systemet: se **Nuvarande sprint** längst ner.
4. För att köra systemet: `/build-team` (team-builder) eller `/consult`
   (ai-consultant) i målprojektet.

## Den enda regeln som betyder mest

**Om output ser likadant ut oavsett input är projektet trasigt.**

Tre olika företag ska ge tre meningsfullt olika team — inte bara olika namn
på samma roller. Det här är inget mjukt ideal; det är projektets
existensberättigande. Varje designval i alla filer finns för att skydda den
regeln.

## De två lägena i en bild

```
                 ┌────────────────────┐
                 │  Delad kärna       │
                 │                    │
                 │  • Research        │
                 │  • Skalning        │
                 │  • Agent-format    │
                 │  • Skills-katalog  │
                 │  • Mötesfunktion   │
                 │  • Principer       │
                 └─────────┬──────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐       ┌────────▼────────┐
     │  team-builder   │       │  ai-consultant  │
     │                 │       │                 │
     │ Kort intake     │       │ Mognadsintake   │
     │ Direkt team     │       │ Första projekt  │
     │ Min. pedagogik  │       │ Pedagogiskt     │
     │                 │       │ Överlämning     │
     └─────────────────┘       └─────────────────┘
```

## Designprinciper (gäller båda lägena)

1. **Konkreta arbetsmoment, inte roller.** Research identifierar vad som
   görs i veckan, inte vilka titlar branschen har.
2. **Skala efter storlek och (för konsult-läget) mognad.** Små team eller
   AI-nybörjare → färre agenter, bredare uppdrag. Se `docs/scaling.md`.
3. **VD måste ha ett operativt jobb.** För solo-projekt räcker inte abstrakt
   strategi — då blir agenten teater. Den här regeln är den näst viktigaste
   efter "output ska vara olika".
4. **VD-assistenten är den primära arbetspartnern.** Se `docs/team-roles.md`.
5. **Varje agent ska kunna motiveras med ett konkret fynd.** Ingen motivering,
   ingen agent. Samma ribba för skills.
6. **Editerbar av människa.** All output är markdown tänkt att läsas och
   justeras för hand.
7. **Idempotent uppdatering.** Att köra igen skrotar aldrig befintligt arbete.
8. **Noll infrastruktur i kärnan.** Genereringen sker via användarens egen
   Claude Code. Det valfria webblagret (se **Webbgränssnitt**) är också nära
   noll-infra: rena statiska filer, kunden använder sin egen API-nyckel i
   webbläsaren — ingen server, ingen databas.
9. **Språk följer input.** Pratar användaren svenska, svarar systemet på
   svenska. Pratar de engelska, engelska. Enkel regel, lätt att glömma.
10. **(Konsult-läget) Pedagogik är situerad.** Förklara det som händer framför
    kunden, just nu, i deras eget projekt. Inte AI-teori i förskott.

## Webbgränssnitt (valfritt lager ovanpå kärnan)

Tre statiska webbappar + en hub gör verktyget demobart och användbart för
icke-tekniska kunder. De delar designsystem (`site/showcase.css`) och kör helt
i webbläsaren — kunden anger sin egen Anthropic-nyckel (lagras lokalt, anropar
`api.anthropic.com` direkt via `anthropic-dangerous-direct-browser-access`).
Ingen backend.

- **Hub** (`index.html`) — front-dörr som navigerar till de tre.
- **Builder** (`builder/`) — bygg ett team live framför en kund. Kör den
  **riktiga pipelinen** i webbläsaren: hämtar `prompts/shared/research.md`,
  `scale.md`, `proposal.md` (+ `ai-consultant/first-project.md`) live och kör
  dem verbatim, steg för steg, plus ett avslutande sammanställningssteg som
  formaterar förslaget till render-JSON + portal-systemprompter (ändrar inget
  innehåll). Eftersom den hämtar filerna live följer den alltid de underhållna
  prompterna — Builder och `/build-team` kan inte glida isär.
- **Galleri** (`site/`) — `index.html` + sex scroll-stories (en per exempel)
  som visar hela processen. Säljmaterial. Statiskt, ingen nyckel.
- **Portal** (`portal/`) — där kunden använder sitt team: chattar med varje
  agent. Multi-tenant via `?team=<slug>` → `portal/teams/<slug>.js`; utan
  parameter visas en kundväljare; `?team=__draft` öppnar ett Builder-utkast.

**Kör lokalt:** `python -m http.server 8420` från repo-roten, öppna
`http://localhost:8420/`. Builder och portal kräver http:// (inte file://),
och Buildern kräver att `prompts/` serveras.

**Stage 2-krok:** `prompts/shared/generate.md` (steg 7–8) genererar — när man
kör inifrån detta repo — även en portal-konfig (`templates/shared/portal-team.md`)
och en galleri-sida (`templates/shared/showcase-page.md`) per körning, så varje
ny kund dyker upp i både galleri och portal automatiskt.

## Repo-struktur

```
.
├── CLAUDE.md                       # Den här filen (paraply)
├── README.md                       # Kort intro för nya användare
├── skills-catalog.md               # Kurerad lista över kända Claude Skills
│
├── index.html                      # Webb-hub (Bygg / Galleri / Portal)
├── builder/                        # Builder-UI: bygg ett team live i webbläsaren
├── site/                           # Galleri: showcase-sidor + showcase.css
├── portal/                         # Kundportal: chatta med ett genererat team
│   └── teams/                      # En <slug>.js per kund + index.js (register)
│
├── docs/                           # Djupare dokumentation per område
│   ├── team-builder.md             # Team-builder-lägets flöde och regler
│   ├── ai-consultant.md            # Ai-consultant-lägets flöde och regler
│   ├── scaling.md                  # Skalningsregler (storlek + mognad)
│   ├── team-roles.md               # VD, VD-assistent, specialisters roller
│   ├── meetings.md                 # Mötesfunktionen i detalj
│   └── first-project.md            # Kriterier för ett bra första kundprojekt
│
├── .claude/
│   └── commands/
│       ├── build-team.md           # /build-team [företagsnamn?]
│       ├── update-team.md          # /update-team
│       └── consult.md              # /consult — startar ai-consultant-läget
│
├── prompts/
│   ├── shared/                     # Prompts som används av båda lägena
│   │   ├── research.md             # Nyckelsteget — lägg tid här
│   │   ├── scale.md                # Välj antal agenter
│   │   ├── proposal.md             # Format för agent-förslag
│   │   └── generate.md             # Skriv ut agent-filer
│   │
│   ├── team-builder/
│   │   ├── intake-interview.md     # Kort intake för tekniska användare
│   │   ├── intake-external.md      # Läge B: externt företag via namn
│   │   └── intake-update.md        # Läge C: diff mot befintligt team
│   │
│   └── ai-consultant/
│       ├── maturity-intake.md      # Fråga om AI-mognad och kontext
│       ├── first-project.md        # Identifiera första-projekt-kandidat
│       ├── pedagogy.md             # Regler för den pedagogiska tonen
│       └── handoff.md              # Överlämningsläget vid uppdragets slut
│
├── templates/
│   ├── shared/
│   │   ├── agent-base.md           # Grundskelett som båda lägena bygger på
│   │   ├── team-presentation.md    # Fristående HTML-presentation per team
│   │   ├── portal-team.md          # Genererar portal-konfig (Stage 2-krok)
│   │   ├── showcase-page.md        # Genererar galleri-sida (Stage 2-krok)
│   │   └── meetings/
│   │       ├── project-review.md
│   │       ├── specific-improvement.md
│   │       └── whats-next.md
│   │
│   ├── team-builder/
│   │   ├── ceo-small.md            # Operativ VD för små team
│   │   ├── ceo-large.md            # Strategisk VD för stora team
│   │   └── chief-of-staff.md
│   │
│   └── ai-consultant/
│       ├── agent-pedagogical.md    # Agent-mall med pedagogiska sektioner
│       ├── ceo-beginner.md         # VD-mall för AI-nybörjarkunder
│       ├── chief-of-staff.md       # Kundanpassad VD-assistent
│       ├── first-project-brief.md  # Mall för första-projekt-dokumentet
│       └── handoff-document.md     # Mall för överlämningsdokumentet
│
└── examples/
    ├── team-builder/
    │   ├── bonusloots/             # Solo, intervju
    │   ├── coachonline/            # Solo, intervju
    │   └── ikea/                   # Enterprise, externt namn
    │
    └── ai-consultant/
        ├── beginner-accountant/    # Liten bokföringsbyrå, AI-nybörjare
        ├── intermediate-agency/    # Marknadsbyrå som provat ChatGPT
        └── advanced-studio/        # Designstudio som börjat bygga
```

## Nuvarande sprint

Bygg i den här ordningen. Hoppa inte över steg.

### Fas 1: Delad kärna (team-builder är facit)

1. **`prompts/shared/research.md`** — nyckelsteget. Om research inte hittar
   konkreta arbetsmoment faller allt annat. Skriv först och testa isolerat.
2. **`prompts/team-builder/intake-interview.md`** — matar research.
3. **`prompts/shared/proposal.md`** + **`templates/shared/agent-base.md`** —
   så att output kan skrivas.
4. **`PROMPT.md`** + **`.claude/commands/build-team.md`** — ihop end-to-end.
5. **Testa mot bonusloots, coachonline, ett tredje.** Om output inte är
   meningsfullt olika → tillbaka till steg 1.

### Fas 2: Resten av team-builder

6. Läge B (externt företag) via `prompts/team-builder/intake-external.md`
7. Mötesmallar i `templates/shared/meetings/`
8. Läge C (uppdatering) via `prompts/team-builder/intake-update.md`

### Fas 3: Ai-consultant-läget

9. **`prompts/ai-consultant/maturity-intake.md`** — fråga om AI-mognad
10. **`prompts/ai-consultant/first-project.md`** — nyckelsteget för konsult.
    Lika viktigt som research-steget var för team-builder. Lägg tid här.
11. **`prompts/ai-consultant/pedagogy.md`** — ton och språkregler
12. **`templates/ai-consultant/agent-pedagogical.md`** — pedagogisk mall
13. **`.claude/commands/consult.md`** — sätt ihop
14. **Testa mot tre fiktiva kunder** i `examples/ai-consultant/`. Samma
    kvalitetstest: meningsfullt olika output, konkreta första projekt som
    uppfyller kriterierna i `docs/first-project.md`.
15. **`templates/ai-consultant/handoff-document.md`** — sist, efter att
    resten fungerar.

Gå inte vidare till fas 2 förrän fas 1 passerar kvalitetstestet. Gå inte
vidare till fas 3 förrän fas 2 gör det.

## Kvalitetschecklista (båda lägena)

**Delat:**

- [ ] Tre företag i samma storleksklass ger tre meningsfullt olika team
- [ ] Solo-team och enterprise-team är uppenbart olika i *struktur*
- [ ] Varje agent kan motiveras med ett konkret fynd
- [ ] Varje föreslagen skill kan motiveras med ett konkret fynd
- [ ] VD-agenten i ett solo-projekt har ett operativt jobb
- [ ] VD-assistenten vägrar kalla till möte när en enskild agent räcker
- [ ] Varje möte landar i sitt definierade output-format
- [ ] Minst en föreslagen agent avvisas i en typisk körning
- [ ] `/update-team` föreslår diff utan att skrota befintligt

**Specifikt för ai-consultant:**

- [ ] Verktyget frågar om AI-mognad innan det föreslår något
- [ ] Första projektet uppfyller alla kriterier i `docs/first-project.md`
- [ ] Pedagogiska sektioner är konkret problemorienterade, inte tekniska
- [ ] En kund på AI-nybörjarnivå får färre agenter än skalningstabellen
      föreslår för deras företagsstorlek
- [ ] Överlämningsdokumentet innehåller "när ringer ni tillbaka"

## Öppna frågor

- Ska ai-consultant-läget generera `.docx`/`.pdf` direkt via skills, eller
  bara markdown? → Markdown i v1 med krok för senare.
- Metadata i genererade filer (`generated_at`, `generator_version`)? → Git
  räcker tills det inte gör det.
- Lokal skills-scan utöver katalogen? → Efter v1.
- Återanvändning av mönster över kunduppdrag (utan att lagra kunddata)? →
  Spännande men v2. Skissa inte nu.
- Ska team-builder och ai-consultant kunna kombineras — dvs ett konsult-
  uppdrag som slutar i ett team-builder-genererat team? → Förmodligen ja
  naturligt, eftersom de delar kärna, men implementera inte som eget flöde.

## Varför det här projektet finns

Tre samtidiga mål som råkar lösas av samma arkitektur:

1. **Eget behov.** Du hoppar mellan projekt och vill ha skräddarsydda team
   per projekt utan att handgöra prompts varje gång.
2. **Lärprojekt.** Du vill bygga intuition för vad multi-agent-arkitektur
   faktiskt tillför och var gränserna går. Verktyget genererar många team
   över tid, vilket ger dig data.
3. **Konsultverktyg.** Du lär ut arbetssättet — att se vilka problem som
   lämpar sig för AI och bygga skarpa små verktyg mot dem — till små och
   medelstora företag. Verktyget är hur du gör det skalbart.

Mål 3 är det som gör projektet långsiktigt viktigt. Mål 1 är hur du testar
det dagligen. Mål 2 är hur du blir bättre på det.
