# Portal-team-konfiguration

Genereras i pipeline:n så att ett genererat team kan användas direkt i
kundportalen (`portal/`). Producerar en JavaScript-fil som sätter
`window.TEAM`, plus en rad i portalens register.

Portalen är statisk: kunden klistrar in sin egen Anthropic-nyckel (lagras
lokalt i webbläsaren) och pratar med agenterna direkt mot Claude. Varje
agent blir en **systemprompt**. Allt innehåll kommer från proposal och
research — inget fabricerat.

## Output

1. `portal/teams/<slug>.js` — själva team-konfigurationen
2. En rad tillagd i `portal/teams/index.js` (registret för kundväljaren)

`<slug>` = kebab-case, inga å/ä/ö, samma som showcase-sidans filnamn.

## Format på `portal/teams/<slug>.js`

```js
window.TEAM = {
  company: "<Företagsnamn>",
  tagline: "<en mening om vad företaget gör>",
  language: "sv",            // följ output-språket
  defaultModel: "claude-opus-4-8",
  entryAgent: "<VD-assistentens id>",   // alltid den primära arbetspartnern
  routines: [ /* se nedan — driver "Veckans rutiner" i portalens arbetsyta */ ],
  firstProject: null,        // ai-consultant-läget: { name, problem, week1, owner } → 🎯-panelen
  agents: [ /* se nedan, VD-assistent först, sedan VD, sedan specialister */ ]
};
```

### Rutiner (`routines`)

3–5 stående rutiner hämtade ur kundens **faktiska veckomoment** i researchen
(inte påhittade). De visas i portalens arbetsyta och öppnar rätt agent med
uppgiften förifylld:

```js
{ label: "Nyhetsbrevet",           // kort namn, visas i sidebaren
  agentId: "innehallsskribent",    // agenten som äger momentet
  day: 4,                          // 1=måndag … 7=söndag, null = närhelst
  prompt: "Dags för veckans nyhetsbrev. Tema: [fyll i]. Skriv ett utkast i min ton." }
```

`prompt` skrivs i du-form med `[fyll i]`-luckor för det agenten behöver av
användaren — konkret nog att skicka direkt.

### Varje agent-objekt

```js
{
  id: "vd-assistent",        // kebab-case, unikt
  name: "VD-assistent",
  icon: "🧭",                // VD alltid ⚡, VD-assistent alltid 🧭, domän-emoji för övriga
  role: "Operativ arbetspartner",
  tagline: "<kort, en rad — visas i sidebaren>",
  always: true,              // true för VD och VD-assistent, utelämna/false för specialister
  system: `...systemprompt...`
}
```

**Avatarer:** sätt INGET `avatar`/`avatarN`-fält. Portalen tilldelar varje
agent ett porträtt automatiskt vid inladdning (delad logik i `avatars.js` —
stabilt seedat på `company`, kanonisk ordning VD-assistent → VD →
specialister). `icon`-emojin behålls som fallback om en bild inte kan laddas.
Sätt bara ett uttryckligt `avatarN` (1–25) om kunden specifikt vill låsa en
viss face till en viss agent.

### `system`-promptens struktur

Skriv den **för agenten**, inte för användaren (jfr regel 4 i generate.md).
Bygg varje del från proposal/research:

1. **Kontext + roll** — en mening om företaget, sedan agentens jobb (jobb-meningen från proposal).
2. **DITT PERSPEKTIV** — proposalens Perspektiv: blicken agenten resonerar från, vad den alltid letar efter/varnar för. Det här är vad som gör att två agenter med närliggande uppgifter svarar olika.
3. **DINA KAPACITETER** — punktlista, agentens kapaciteter från proposal.
4. **DITT TEAM** (bara för VD-assistenten) — lista övriga agenter och vad de gör, så den kan hänvisa rätt. För VD-assistenten även: granska mötesbidrag mot varje agents "Klart när"-punkter innan sammanställning.
5. **LEVERANS** — proposalens Leverans + "Klart när"-punkter: hur ett färdigt svar ser ut, så agenten levererar mot det istället för att resonera fritt.
6. **ARBETSSÄTT** (valfritt) — hur agenten ska be om data den saknar istället för att gissa (jfr regel 8 i generate.md: agenter startar utan data).
7. **TON** — kort. Spegla läget: nybörjarkund → pedagogisk, klarspråk; van/byggare → rakare, mer jämbördig. Avsluta med "Svara på <språk>."
8. **VIKTIGT** — vad agenten INTE gör (från proposalens "Rör inte"). Slutbeslut, juridik etc. ligger hos människan.

**Läge B (externt/hypotes):** lägg in en mening i varje system-prompt om att
agenten arbetar utifrån antaganden om verksamheten och bör be om verklig data
eller bekräftelse innan den agerar.

## Registret (`portal/teams/index.js`)

Lägg till **en rad** i `window.TEAMS`-arrayen (skapa inte dubbletter — om
slug redan finns, uppdatera den raden istället):

```js
{ slug: "<slug>", company: "<Företagsnamn>", icon: "<samma emoji som VD-assistenten eller en företags-emoji>", tagline: "<en mening>" },
```

## Regler

1. **Giltig JavaScript.** Filen sätter bara `window.TEAM`. Inga importer, inga beroenden.
2. **entryAgent = VD-assistenten.** Den är alltid kundens första kontakt.
3. **Exakt proposalens agenter** — inga fler, inga färre. Om proposalen avvisade moment blir de inte agenter här heller.
4. **Idempotent register.** Kör igen → skriv över `<slug>.js` och uppdatera (inte duplicera) registerraden.
5. **Språk följer output.** Svensk intake → svenska systemprompter.
