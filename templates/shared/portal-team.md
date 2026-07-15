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
  agents: [ /* se nedan, VD-assistent först, sedan VD, sedan specialister */ ]
};
```

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
2. **DINA KAPACITETER** — punktlista, agentens kapaciteter från proposal.
3. **DITT TEAM** (bara för VD-assistenten) — lista övriga agenter och vad de gör, så den kan hänvisa rätt.
4. **ARBETSSÄTT** (valfritt) — hur agenten ska be om data den saknar istället för att gissa (jfr regel 8 i generate.md: agenter startar utan data).
5. **TON** — kort. Spegla läget: nybörjarkund → pedagogisk, klarspråk; van/byggare → rakare, mer jämbördig. Avsluta med "Svara på <språk>."
6. **VIKTIGT** — vad agenten INTE gör (från proposalens "Rör inte"). Slutbeslut, juridik etc. ligger hos människan.

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
