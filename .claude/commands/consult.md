# /consult

Startar ai-consultant-läget. Hjälper en mindre eller medelstor
verksamhet komma igång med AI genom att identifiera ett bra första
projekt och bygga ett skräddarsytt agent-team.

Se `docs/ai-consultant.md` för fullständig beskrivning av läget.

## Förutsättning

Projektet ska vara agent-team-builder-repot. Output skrivs till
målprojektets `.claude/agents/` — men först måste hela flödet köras.

Om `.claude/agents/` redan finns och innehåller agenter — fråga
om det är en uppdatering (kör `/update-team` istället) eller om
kunden vill börja om.

## Flöde

```
Mognadsintake → Research → Skalning → Första-projekt-identifiering →
Team-förslag → Bekräftelse → Generera team + brief + HTML-presentation
```

### Steg 1: Mognadsintake

Läs `prompts/ai-consultant/maturity-intake.md` och följ den.

Ställ frågorna i ordning. Vänta på svar. Tonen ska vara avslappnad
och nyfiken — du är en bygg-coach, inte en revisor.

Producera intake-blocket med mognadssektionerna. Visa sammanställningen
för kunden och fråga om den ser rätt ut.

**Kritisk information från intake:**
- Mognadsnivå (nybörjare / van / byggare) — styr allt som kommer efter
- Projektägare — flagga om oklar
- Framgångskriterium — behövs för mätbara mål

### Steg 2: Research

Läs `prompts/shared/research.md` och kör research-steget med
intake-blocket som input.

Allt fungerar som i team-builder, men var extra uppmärksam på:
- Moment som kan bli första-projekt-kandidater (hög smärta, hög
  frekvens, tydlig ägare)
- AI-lämplighet — nybörjarkunder behöver moment med hög lämplighet

### Steg 3: Skalning

Läs `prompts/shared/scale.md` och tillämpa mognadsjusteringen i dess
steg 2 — det är enda facit. Upprepa **inte** siffrorna här; den tabellen
äger nybörjare/van/byggare-dämpningen så att consult.md och scale.md
aldrig kan glida isär.

Kom ihåg: mognadstaket är ett **hårt tak**. Klarar research-jämförelsen
fler kluster än taket tillåter, vinner taket — överskjutande kluster
skjuts till en framtida version, inte in i ett nybörjarteam.

### Steg 4: Första-projekt-identifiering

Läs `prompts/ai-consultant/first-project.md`.

Det här är det viktigaste steget i ai-consultant-läget. Korskör
research-momenten mot de sex kriterierna och hitta det bästa
första projektet.

**Om minst en kandidat klarar alla sex:** Producera Output A —
rangordnade kandidater med brief enligt
`templates/ai-consultant/first-project-brief.md`.

**Om ingen kandidat klarar alla sex:** Producera Output B —
ärlig avvisning. Våga avvisa. Ett pressat projekt som inte
uppfyller kriterierna skadar kunden mer än inget projekt.

Visa resultatet för kunden. Vänta på bekräftelse innan team-förslag.

### Steg 5: Team-förslag

Läs `prompts/shared/proposal.md` och `prompts/ai-consultant/pedagogy.md`.

Producera team-förslaget som vanligt, men med pedagogiska hänsyn:
- Motiveringar citerar intake ("Ni nämnde att…")
- Tonen är problemorienterad, inte teknisk
- Mognaden påverkar komplexiteten — nybörjare får enklare team
- Första projektet ska ha tydlig koppling till minst en agent

Visa förslaget och vänta på godkännande.

### Steg 6: Generera

Läs `prompts/shared/generate.md`.

Generera agent-filer med pedagogiska mallar:
- VD: `templates/ai-consultant/ceo-beginner.md` för nybörjare/van,
  `templates/team-builder/ceo-small.md` eller `ceo-large.md` för
  byggare (med pedagogiska sektioner från `agent-pedagogical.md`)
- VD-assistent: `templates/ai-consultant/chief-of-staff.md`
- Specialister: `templates/ai-consultant/agent-pedagogical.md`
- Mötesmallar: `templates/shared/meetings/` anpassade till teamet

Generera även första-projekt-briefen som separat fil:
`.claude/agents/first-project-brief.md`

Generera `team-presentation.html` — en visuell presentation av teamet
och första projektet enligt `templates/shared/team-presentation.md`.

Körs detta **inifrån agent-team-builder-repot**: gör också steg 7–8 i
`generate.md` — portal-konfig (`portal/teams/<slug>.js` + rad i `index.js`)
och galleri-sida (`site/<slug>.html`). Utan dem dyker kunden aldrig upp i
portalen eller galleriet.
Inkludera sektion 7 (första-projekt) med data från briefen.

Visa sammanfattning av genererade filer inklusive HTML-presentationen.

## Efter genereringen

Kunden har nu sitt team och sin brief. Härifrån arbetar ni
*tillsammans* på första projektet.

När uppdraget avslutas: `/handoff` för att producera
överlämningsdokumentet (se `prompts/ai-consultant/handoff.md`).

## Regler

1. **Mognad före allt.** Fråga om AI-mognad innan du föreslår
   något. Det är den viktigaste informationen i hela flödet.

2. **Våga avvisa.** Om inget bra första projekt finns — säg det.
   Gå tillbaka till intake, föreslå alternativa vägar. Starta inte
   ett dömt projekt för att "ge kunden något".

3. **Kundens ord i centrum.** Allt material kunden ser ska referera
   till vad de sa, inte till abstrakta branschbeskrivningar.

4. **Pedagogik är situerad.** Förklara det som händer framför
   kunden just nu. Inte AI-teori i förskott. Se
   `prompts/ai-consultant/pedagogy.md`.

5. **Språk följer kunden.** Om kunden pratar svenska, svarar
   du på svenska. Om engelska, engelska. Byt aldrig språk.

6. **Skriv inte över befintliga filer.** Om `.claude/agents/`
   redan finns, fråga. Inget skrivs utan explicit godkännande.
