# Lansering — vad som är kvar

> **Levande dokument, inte en daterad ögonblicksbild.** Stryk rader när de är
> gjorda, lägg till när något nytt hittas. Det här är listan som avgör när
> produkten går att sälja till någon som inte känner Mikael.
>
> Senast genomgången 2026-08-06: kodgranskning, visuell genomgång med Playwright
> (elva sidor, desktop + mobil), och två rollspelade kundresor — en privatperson
> (livscoach, solo, icke-teknisk) och ett företag (redovisningsbyrå, nio
> anställda, IT-leverantör som granskar).

## Läget just nu

Köpflödet fungerar hela vägen och är verifierat i riktig webbläsare: bygge →
"Spara i molnet" → Stripes kassa → betalning → webhook → konto → inloggning →
teamet i portalen. Inloggningskoder mejlas skarpt via Resend. Prislistan leder
numera till kassan i stället för till en mejladress.

Det som återstår är inte teknik i första hand. Det är **de fyra hålen mellan
löfte och leverans** nedan, och de syns bara när någon som inte byggt
produkten går igenom den.

---

## Blockerande — måste vara löst innan en okänd kund betalar

### 1. Nyckelkravet kommer efter betalningen

**Problemet.** Den som köper provmånaden ur demoläget kan betala 90 kr, logga
in, och först då mötas av kravet på en egen OpenRouter-nyckel. Har hen ingen —
och vet inte vad det är — har hen betalat för något hon aldrig öppnar.

**Delvis åtgärdat 2026-08-06:** köppanelen varnar nu i demoläge, hubben har en
egen sektion (`index.html#forbrukning`) med kostnad och femstegsinstruktion, och
både Buildern och portalen länkar dit från nyckelrutan. Den som bygger på
riktigt har dessutom redan en fungerande nyckel — den krävdes för att komma
fram till köpknappen.

**Kvar:** verifiera nyckeln *före* betalning i demoflödet, eller flytta
nyckelsteget till aktiveringssidan så att det sker medan köpet är färskt. Så
länge det går att betala utan nyckel finns hålet kvar.

### 2. Flera användare går inte att sälja

`team_access` har roller (`owner`/`member`) sedan M3, men det finns ingen
inbjudningsknapp och ingen API-rutt. Nio anställda betyder nio manuella körningar
av `scripts/provision.mjs`. Prislistan säger "hör av er så räknar vi på det",
vilket är ärligt — men en byrå som frågar "hur lägger jag till mina åtta
kollegor" får inget svar på sajten.

**Att göra:** antingen en minimal inbjudningsrutt (`POST /api/team/invite` →
mejl med engångskod, `member`-rad), eller en tydlig mening om att platser läggs
till för hand och vad de kostar. Det senare tar tjugo minuter och räcker för de
första kunderna.

### 3. Den nyckelfria nivån säljs men finns inte

190 kr och 490 kr/mån kräver en proxy på egen nyckel med kvot- och takräkning.
Den är inte byggd. Båda korten är nu märkta "öppnar senare i höst" — men
frågan kommer att ställas i varje säljsamtal, och svaret måste vara ett datum
eller ett nej, inte ett "snart".

**Beror på:** kontextbudget-buggen måste fixas först (kostnaden blir vår i det
läget), och en kvotmätning per konto ovanpå `usage`-tabellen.

### 4. Ingen självbetjänad väg ut

Uppsägning sker genom att mejla. Ingen påminnelse när provmånaden tar slut.
Ingen export-knapp i portalen som samlar allt kunden lagt in. Villkoren lovar
att data går att få ut; portalen har inget som gör det i ett klick.

**Att göra:** ett kort i arbetsytan när ~25 dagar gått sedan köpet ("provmånaden
tar slut den X — här är vad som händer"), och en "Ladda ner allt"-knapp.

---

## Allvarligt — kostar affärer men stoppar dem inte

- **Demoteamen matchar inte den kund som tittar.** Bokföringsdemot är byggt för
  en trepersonersbyrå; branschsidan säger inte det. En byrå med nio anställda
  ser ett team som är för litet för dem och drar fel slutsats om produkten.
- **Fritt formulerade frågor i demoläget** faller tillbaka på ett generiskt svar
  utan att det märks att det inte är en riktig körning.
- **Aktiveringssidan är tunn.** Fungerar, men innehåller 247 tecken text. Det är
  ögonblicket efter att kunden betalat — det tåligaste läget att förklara nästa
  steg, och det används inte.
- **`docs/m2-backend-spec.md` är ett halvår gammal på leveranspunkten.** Den
  beskriver capability-URL; koden levererar till konton. Specen bör märkas
  som överspelad på just den punkten.

## Skav — rätta när något ändå görs i filen

- Ingen påminnelse om att maskera personnummer i redovisningsteamets lönerutin,
  trots att integritetspolicyn ber kunden undvika dem.
- `verticals/`-sidorna länkar inte till `#forbrukning`.
- Galleriet saknar sidor för tre av `examples/`-körningarna (lerverk,
  norrskenspodden, wikander).

---

## Åtgärdat 2026-08-06

Sparat här för att nästa granskning inte ska hitta samma saker igen.

| Fynd | Åtgärd |
|---|---|
| Prislistans knappar gick till en mejladress, inte till kassan | Alla tre pris-CTA går nu till Buildern |
| "API-nyckel" nämndes i en bisats utan förklaring | Egen sektion `#forbrukning`: kostnad per svar, tre månadsscenarier, fem steg för att skaffa nyckeln |
| Ingen kostnadsuppgift alls för AI-förbrukningen | "2–4 kr i månaden vid normal användning", räknat på $0,14/$0,28 per miljon tokens och 10,50 kr/dollar |
| Nyckelrutan erbjöd Anthropic-nycklar som inte fungerar | Bara OpenRouter; en Anthropic-nyckel får ett eget felmeddelande som förklarar varför |
| `defaultModel: "claude-opus-4-8"` i sex teamfiler | Borttaget, och Buildern skriver inte längre fältet — modellen är låst på ett ställe |
| DeepSeeks ursprung stod ingenstans | Utskrivet i både FAQ och integritetspolicy, med vad kunden kan begränsa hos OpenRouter |
| Villkoren lovade faktura, kassan tog kort | Villkoren beskriver kort som standard och faktura på begäran före köp |
| "Läge: Team-builder / AI-konsult" i Builderns formulär | Omskrivet till vad kunden får ut, inte vad delarna heter internt |
| "0 kr, ingen betalning" men Buildern krävde nyckel | Kortet säger nu att bygget kostar ~8 öre på egen nyckel, och länkar till demoläget |
| Inloggning krävde ny mejlkod var 30:e dag | Rullande session: utgången flyttas fram vid användning, så en aktiv kund aldrig ser en kod igen |
| Statiska filer cachades i fyra timmar utan innehållshash | `no-cache` på applagret i `_headers` — deployer syns direkt |
| CSP tillät `api.anthropic.com` som aldrig anropas | Borttaget; `checkout.stripe.com` tillagt i `form-action` |
