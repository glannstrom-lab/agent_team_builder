# Portal-team-konfiguration

Genereras i pipeline:n så att ett genererat team kan användas direkt i
kundportalen (`portal/`). Producerar en JavaScript-fil som sätter
`window.TEAM`, plus en rad i portalens register.

Portalen körs i webbläsaren, men AI-anropen går till `POST /api/ai` på **vår**
nyckel — kunden har aldrig en egen, och portalsvar kräver inloggning och ett
köpt team. Varje agent blir en **systemprompt**. Allt innehåll kommer från
proposal och research — inget fabricerat.

> Den här filen speglar `PORTAL_RULES` och `stripTeam()` i
> `builder/builder.js` **för hand**. Ändras den ena måste den andra följa med;
> ingenting kontrollerar det åt oss. Fälten nedan är exakt de `stripTeam()`
> skickar vidare — varken fler eller färre.

## Output

1. `portal/teams/<slug>.js` — själva team-konfigurationen
2. En rad tillagd i `portal/teams/index.js` (registret för kundväljaren)

`<slug>` = kebab-case, inga å/ä/ö, samma som showcase-sidans filnamn.

## Format på `portal/teams/<slug>.js`

```js
window.TEAM = {
  company: "<Företagsnamn>",
  tagline: "<en mening om vad företaget gör>",
  // Inget `language` och ingen `defaultModel` (borttagna 2026-08-16). Båda såg
  // ut som val men var konstanter som ingen kod läste: modellen är låst i
  // atb-claude.js och samma för alla, och språket avgörs av prompterna, som
  // svarar på samma språk som intaget skrevs på. `defaultModel` pekade dessutom
  // fortfarande ut en Claude-modell, ett modellbyte för sent.
  entryAgent: "<VD-assistentens id>",   // alltid den primära arbetspartnern
  routines: [ /* se nedan — driver "Veckans rutiner" i portalens arbetsyta */ ],
  seasons: [ /* årshjulet: { label, month: 1–12, day|null, agentId|null, prompt|null } — BARA händelser
                ur intake/research (mässor, deadlines, högsäsonger); portalen påminner i förväg.
                Fabricera inga datum; utelämna/tom lista om årsrytmen är okänd. */ ],
  firstProject: null,        // ai-consultant-läget: { name, problem, week1, owner } → 🎯-panelen
  workstyle: null,           // "coach" = arbetsledarläge (se nedan), annars null/utelämna
  divergence: "<en mening ur divergens-checken: varför teamet inte skulle passa en annan aktör i samma bransch>",
  rejected: [ { name: "<avvisat moment>", why: "<varför det inte blev en agent>" } ],
  agents: [ /* se nedan, VD-assistent först, sedan VD, sedan specialister */ ]
};
```

`divergence` + `rejected` (från proposalens Avvisade-sektion) driver portalens
sida **"Därför ser ert team ut så här"** — den öppnas automatiskt vid kundens
första besök och är produktens förtroendeargument: en AI som säger nej till
sig själv. Utelämna aldrig `rejected` när proposalen avvisade moment.

### Rutiner (`routines`)

3–5 stående rutiner hämtade ur kundens **faktiska veckomoment** i researchen
(inte påhittade). De visas i portalens arbetsyta och öppnar rätt agent med
uppgiften förifylld:

```js
{ label: "Nyhetsbrevet",           // kort namn, visas i sidebaren
  agentId: "innehallsskribent",    // agenten som äger momentet
  day: 4,                          // 1=måndag … 7=söndag, null = närhelst
  timeEstimate: 90,                // minuter momentet brukar ta manuellt (ur researchen; utelämna om okänt)
  auto: false,                     // true = portalen kör rutinen automatiskt på rätt dag (se nedan)
  prompt: "Dags för veckans nyhetsbrev. Tema: [fyll i]. Skriv ett utkast i min ton." }
```

`prompt` skrivs i du-form med `[fyll i]`-luckor för det agenten behöver av
användaren — konkret nog att skicka direkt.

`timeEstimate` hämtas ur researchens tidsuppskattningar (aldrig påhittad —
utelämna hellre). Den driver portalens "Veckans arbete"-vy ("≈ X h tillbaka
den här veckan").

`auto: true` får bara sättas på **högst en** rutin, och bara när prompten är
komplett utan `[fyll i]`-luckor (t.ex. en stående måndagsbrief). Portalen
genererar då svaret i bakgrunden när kunden öppnar på rätt dag — "teamet har
redan jobbat". Svaret körs utan att kunden bett om det och räknas mot teamets
månadstak, så var restriktiv: högst en, och bara när den faktiskt är värd ett
oombett anrop.

### Varje agent-objekt

```js
{
  id: "vd-assistent",        // kebab-case, unikt
  name: "VD-assistent",
  icon: "🧭",                // VD alltid ⚡, VD-assistent alltid 🧭, domän-emoji för övriga
  role: "Operativ arbetspartner",
  tagline: "<kort, en rad — visas i sidebaren>",
  always: true,              // true för VD och VD-assistent, utelämna/false för specialister
  why: "<EN mening som knyter agenten till kundens egna ord: 'Du sa att offerterna tar söndagskvällarna — därför finns jag.'>",

  // De tre nedan driver AGENTKORTET i portalen ("det här kan jag hjälpa dig
  // med" + klickbara startförslag). Utelämnas de blir kortet tomt och agenten
  // ser ut som en tom chattruta — vilket är precis vad portalen finns för att
  // slippa vara.
  job: "<en mening om vad agenten gör i kundens vecka, i du-form>",
  capabilities: [            // minst 3, konkreta moment ur researchen
    "<vad agenten kan hjälpa till med — inte en rolltitel>",
  ],
  starters: [                // EXAKT 3 klickbara startuppgifter, i du-form
    "<en färdig uppgift kunden kan trycka på direkt>",
  ],

  // 0–3 situationer där just den här agenten är rätt att vända sig till.
  // Visas som "Vänd dig hit när" på agentkortet. Kapaciteterna säger vad
  // agenten KAN; triggers säger NÄR — den svårare frågan för en kund med sex
  // agenter. Hitta inte på: utelämna hellre fältet än att gissa situationer.
  triggers: [
    "<en konkret situation ur researchen, t.ex. 'en ny pjäs ska upp i butiken'>",
  ],

  system: `...systemprompt...`
}
```

`why` visas på "Därför ser ert team ut så här"-sidan. Använd kundens egna
formuleringar ur intaket/researchen — fabricera inget (quiz-effekten bygger
på att kunden känner igen sina egna ord).

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

**Arbetsledarläge (`workstyle: "coach"`):** när kunden gör utförandet i sin
egen AI (t.ex. betalt ChatGPT) ska varje agents system-prompt instruera den
att leverera **arbetspaket** i stället för färdigt innehåll: kort brief + en
färdig självbärande prompt i ett kodblock (all nödvändig kontext inbakad) +
"Klart när"-checklista + erbjudande att kvalitetsgranska resultatet om kunden
klistrar tillbaka det. Starters formuleras som arbetspaket-beställningar.
Portalen förblir navet: rutiner, minne, avbockning och uppföljning gäller
oavsett var utförandet sker, och "🤖 Kopiera prompten"-knappen plockar
kodblocket åt kunden.

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
