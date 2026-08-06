# Lansering — vad som är kvar

> **Levande dokument, inte en daterad ögonblicksbild.** Stryk rader när de är
> gjorda, lägg till när något nytt hittas. Det här är listan som avgör när
> produkten går att sälja till någon som inte känner Mikael.
>
> Senast genomgången 2026-08-06: kodgranskning, visuell genomgång med Playwright
> (elva sidor, desktop + mobil), och två rollspelade kundresor — en privatperson
> (livscoach, solo, icke-teknisk) och ett företag (redovisningsbyrå, nio
> anställda, IT-leverantör som granskar).

## Den stora omläggningen 2026-08-06 (eftermiddag)

Två beslut som ändrar produkten mer än allt annat i listan nedan:

**1. Kunden har aldrig en egen API-nyckel.** Vi kör AI:n på vår nyckel via
`POST /api/ai`. Kravet på en egen nyckel var den enskilt största
avhoppspunkten för alla som inte redan var utvecklare — och kostnaden vi tar
över är 2–4 kr per kund och månad mot 90–290 kr i intäkt. Priset för bytet:
vi är personuppgiftsbiträde, och en öppen rutt på vår nyckel måste bevakas.
Tre tak i `functions/api/ai.js`: per IP, per konto (1 000 svar/mån = villkorens
fair use) och ett globalt dygnstak som skyddar kassan.

**2. Prisstegen är tre nivåer: 0 / 90 / 290 per månad.** Engångsköpet på
4 990 är skrotat, liksom 190 och 490. Skälet är hederligt: vi har ingen
molnstruktur för att underhålla team åt kunder, och "ert för alltid" vore ett
löfte utan drift bakom sig. Molnstrukturen byggs ut när det finns intäkt.

**Detta får inte deployas förrän `OPENROUTER_KEY` är satt.** Sajten säljer nu
"AI:n ingår" och Buildern frågar inte längre kunden om någon nyckel — utan vår
svarar `/api/ai` 503 och produkten är död i vattnet.

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

### ~~1. Nyckelkravet kommer efter betalningen~~ — STÄNGT 2026-08-06

Köppanelen har en grind: saknas nyckel går planknapparna inte att trycka på
förrän en nyckel testats mot OpenRouter på riktigt. Valideringen är utbruten och
delas med builderns vanliga nyckelruta, så de kan inte glida isär.

**Följdfynd på vägen — också stängt:** demoläget *sålde demoteamet*. Den som
klickade "Spara i molnet" ur `?demo=1` betalade 90 kr för CoachOnline-teamet, ett
påhittat företag. Nyckelgrinden såg till att kunden kunde öppna dörren, men inte
att rätt sak låg bakom den. Nu säljer demoläget ingenting: panelen förklarar att
körningen är inspelad, ber om nyckeln, och tar kunden till formuläret för att
bygga sitt eget.

### 2. Flera användare — halvvägs

**Byggt 2026-08-06:** `POST /api/team/invite`, `GET /api/team/members`,
`POST /api/team/remove`. Ägaren kan bjuda in, lista och ta bort platser.
Inbjudan bär ingen inloggningskod (den lever tio minuter, mejl läses när de
läses). Åtkomstraden skrivs före mejlet, så ett misslyckat utskick ger en kollega
som finns men inte fått lappen — inte tvärtom. Egna spärrhinkar, tak på 50
platser, och identiskt svar på "finns inte" och "du äger det inte".

**Kvar: ingen knapp.** Rutterna finns, men ingenting i portalen anropar dem.
Tills det byggs är det fortfarande Mikael som lägger till kollegor — nu via ett
API-anrop i stället för `scripts/provision.mjs`, vilket är snabbare men lika
manuellt.

**Kvar också:** en borttagen kollega tappar sitt konto men inte capability-länken.
Har hen sparat `/portal/?team=<slug>` når hen fortfarande teamet, eftersom
`/api/teams/:slug` med flit inte kräver inloggning (det är så team som säljs utan
konto levereras). Att täppa till det kräver ett beslut om capability-läsningen
ska dö helt.

### 3. Den nyckelfria nivån säljs men finns inte

190 kr och 490 kr/mån kräver en proxy på egen nyckel med kvot- och takräkning.
Den är inte byggd. Båda korten är nu märkta "öppnar senare i höst" — men
frågan kommer att ställas i varje säljsamtal, och svaret måste vara ett datum
eller ett nej, inte ett "snart".

**Beror på:** kontextbudget-buggen måste fixas först (kostnaden blir vår i det
läget), och en kvotmätning per konto ovanpå `usage`-tabellen.

### ~~4. Ingen självbetjänad väg ut~~ — STÄNGT 2026-08-06

Kort i arbetsytan från dag 25 som säger vilket datum provmånaden tar slut och
att ingenting dras automatiskt. "Ladda ner allt" som samlar företagsminne,
underlag och hela chatthistoriken i en läsbar markdown-fil. Uppsägningslänk som
öppnar ett förifyllt mejl med företagsnamn och slug.

**Bugg som hittades på vägen:** de befintliga nedladdningsknapparna (per svar,
och "Ladda ner teamfil") fungerade sannolikt inte alls — en frikopplad
`<a download>` ignoreras av Chromium. Nu går alla nedladdningar genom en delad
hjälpfunktion som lägger in elementet i dokumentet före klicket.

---

## Allvarligt — kostar affärer men stoppar dem inte

- **Fritt formulerade frågor i demoläget** faller tillbaka på ett generiskt svar
  utan att det märks att det inte är en riktig körning.
- **Inbjudningsrutterna saknar gränssnitt** (se hål 2 ovan).
- **Kontextbudget-buggen** (`portal/app.js`) måste fixas innan den nyckelfria
  nivån kan prissättas — då är kostnaden vår.

## Skav — rätta när något ändå görs i filen

- Ingen påminnelse om att maskera personnummer i redovisningsteamets lönerutin,
  trots att integritetspolicyn ber kunden undvika dem.
- Galleriet saknar sidor för tre av `examples/`-körningarna (lerverk,
  norrskenspodden, wikander).
- `/api/team/...` och `/api/teams/:slug` ligger namnmässigt nära varandra. Ingen
  kollision, men lätt att läsfela senare.

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
| Demoläget sålde demoteamet — 90 kr för ett påhittat företags team | Demoläget säljer ingenting; köpknappen leder till ett riktigt bygge |
| Aktiveringssidan var 247 tecken i kundens mest mottagliga ögonblick | Förklarar nu inloggning, nyckelkravet med länk, och att köpet inte förnyas |
| Branschsidorna nämnde varken kostnad eller nyckel | Kostnadsrad med länk till `#forbrukning` i heron |
| Bokföringsdemot såg ut att gälla alla byråer | Säger nu att det är en trepersonersbyrå och att en större får ett annat team |
| `m2-backend-spec.md` beskrev capability-URL som levande lösning | Märkt överspelad på leveranspunkten; resonemanget kvar som historik |
| Nedladdningsknapparna laddade sannolikt inte ner något | Delad `downloadFile()` som lägger in elementet i dokumentet före klicket |
| Inget testade signaturkontrollen — betalningsbeviset | `test/stripe.mjs`, 13 tester. Suiten: 43 → 56 |
