# M2 — Backend-spec (betalning, provisionering, moln)

> Status: spec v1 (2026-06-28). Syftet är att göra produkten **självgående** —
> kund betalar och får sitt team utan att Mikael rör en tangent.
> Arkitekturbesluten (§2) är tagna 2026-06-28. Bygget av M2a-1 kan börja direkt
> (lokal D1, inga konton). M2a-2 och framåt kräver Stripe-kontot i §8.
> Bygger vidare på [strategin](produktstrategi-sjalvbetjaning.md).

> **ÖVERSPELAT 2026-08-05 — leveranspunkten (Beslut B).** Den här specen
> skrevs innan M3 fanns, och **§2 Beslut B, §6:s beskrivning av
> aktiveringssidan och §12/M2b-2:s "identitet"-punkt beskriver inte längre hur
> leveransen faktiskt sker.** Vad som gäller i stället: teamet levereras till
> ett **konto**, inte en hemlig länk. Kunden loggar in med en engångskod som
> mejlas till adressen hen betalade med — inga lösenord, se
> `migrations/0002_auth.sql` och rutterna under `functions/api/auth/`.
> `functions/api/stripe-webhook.js` skapar kontot (`users`/`team_access`)
> direkt när betalningen går igenom, i samma transaktion som teamet.
> Capability-slugen (`teams.slug`, §5) finns fortfarande kvar internt — det är
> fortfarande vägen till `/api/teams/:slug` — men den delas inte längre ut som
> kundens åtkomstlänk. Anledningen till bytet står kvar i `0002_auth.sql`:
> en länk går inte att återkalla, läcker via webbhistorik och vidarebefordrade
> mejl, och identifierar ingen — vilket den nyckelfria nivån (190/490 kr)
> kräver för att kunna mäta förbrukning per konto. Resonemanget nedan för
> **varför** capability-URL valdes 2026-06-28 stryks inte — det förklarar
> varför beslutet såg rimligt ut då och vad som fick oss att ändra oss.

---

## 1. Mål och avgränsning

M2 lägger ett **tunt köp/leverans-lager** ovanpå den statiska webben. Kärnan
(prompts, skill, generering) och de statiska apparna är oförändrade.

I scope:
- Kund kan **betala** (Stripe) och automatiskt få ett **moln-sparat team** med en
  egen portal-URL som funkar från vilken enhet som helst.
- (Senare, M2b) **Managed-nivå**: backend kör Claude-anropen med Mikaels nyckel,
  mäter förbrukning och fakturerar.

Inte i scope nu: full kontopanel, teamredigering i molnet, fakturahistorik-UI.
Allt det kan komma efter att grundflödet bär.

### Den hårda grundbulten (igen)
Claude Max kan **inte** driva en backend. Managed-nivån kräver en **egen
Anthropic API-nyckel med credits** på servern. BYO-nivån använder kundens nyckel
i webbläsaren precis som idag. (Se grundbulten i §1.)

---

## 2. Beslut (kärnan i specen)

**Beslutat 2026-06-28:** A = *Bygg → betala → spara*. B = *Capability-URL*.
C = *Faza — BYO (M2a) först, managed (M2b) senare*. D (Stripe-priser) = bekräftas
av Mikael innan live. Detaljerna nedan står kvar som motivering.

### Beslut A — Provisioneringsflöde
**Hur blir ett betalt team till?**
1. **Bygg → betala → spara (rekommenderat).** Kunden bygger i Buildern (egen
   nyckel, gratis), gillar det, klickar "Spara i molnet" → Stripe Checkout → vid
   betalning sparas teamet (redan i localStorage-utkastet) i molnet och får en
   permanent portal-URL. Kunden ser värdet *innan* betalning → högst konvertering,
   och återanvänder utkastflödet som redan finns.
2. Betala → bygg. Renare konto, men betala-före-värde = lägre konvertering.

→ **Rekommendation: 1.**

### Beslut B — Åtkomst / inloggning

> **Historik, överspelad 2026-08-05 (M3).** Alternativ 1 (capability-URL) var
> valet 2026-06-28 och stod kvar genom M2a. Sedan M3 levereras teamet i
> stället till ett **konto**, med inloggning via engångskod (alternativ 2 här,
> fast med kod i stället för länk i mejlet) — se markeringen högst upp i
> dokumentet för varför. Resonemanget nedan är kvar för spårbarhet, inte som
> beskrivning av hur det fungerar idag.

**Hur kommer kunden åt sitt team från valfri enhet?**
1. **Capability-URL (rekommenderat för BYO).** Teamet får en lång, ogissningsbar
   slug: `portal/?team=k7f3...`. Den som har länken kommer in — ingen inloggning,
   ingen lösenordshantering. "Tillgängligt från vilken enhet som helst" = öppna
   länken var som helst. Matchar dagens inloggningsfria känsla.
2. **Magisk länk (e-post).** Kund anger e-post, får en länk. Mer "konto" utan
   lösenord. Behövs egentligen först för managed-nivån.
3. Riktiga konton (lösenord). Mest friktion, spara till senare.

→ **Rekommendation: 1 för BYO nu, 2 när managed kommer.**

### Beslut C — Managed-nivå nu eller senare?
Managed (du proxar Claude + fakturerar förbrukning) är den tyngsta biten:
proxy, mätning, kostnadstak, abuse-skydd. 
→ **Rekommendation: faza.** M2a = betalning + provisionering + moln-team (BYO).
M2b = managed proxy. Släpp M2a först, lägg managed när någon faktiskt vill betala
för att slippa nyckeln.

### Beslut D — Pris-/produktstruktur i Stripe
Engångspris för "Bygg själv" (idag 2 900 kr placeholder) → Stripe **one-time
price**. Retainer/managed → Stripe **subscription price**. 
→ **Rekommendation:** skapa två produkter i Stripe (engång + prenumeration),
koppla till prisnivåerna på säljsidan (`index.html`, se även
`produktstrategi-sjalvbetjaning.md`). Bekräfta de slutliga priserna.

---

## 3. Arkitektur

Allt på Cloudflare (ni kör redan Pages):

```
Webbläsare (portal/builder)
        │
        ├─ statiska filer ............ Cloudflare Pages (som idag)
        │
        └─ /api/* .................... Cloudflare Pages Functions  (= Workers)
                                          │
                                          ├─ D1 (SQLite) — teams, customers, (usage)
                                          ├─ Stripe API — checkout + webhook
                                          └─ (M2b) Anthropic API — managed proxy
```

**Varför Pages Functions och inte separat Worker:** funktionerna bor i `/functions`
och deployas med samma Pages-projekt — ingen extra deploy-pipeline, samma domän
(inga CORS-problem mot `/api`).

---

## 4. Endpoints (Pages Functions)

### M2a — commerce + provisionering
| Metod | Väg | Gör |
|------|-----|-----|
| POST | `/api/checkout` | Skapar Stripe Checkout Session. Body: `{tier, draftId}`. Returnerar `{url}`. Lagrar utkastet temporärt (D1, `pending`) kopplat till sessionen. |
| POST | `/api/stripe-webhook` | Tar emot `checkout.session.completed`. Verifierar signatur. Flyttar `pending`-utkast → permanent team, genererar capability-slug. |
| GET | `/api/teams/:slug` | Returnerar team-JSON för portalen. 404 om okänt. |
| GET | `/api/checkout/status?session_id=` | Pollas av success-sidan tills webhooken hunnit skapa teamet; returnerar `{slug}` när klart. |

### M2b — managed (senare)
| Metod | Väg | Gör |
|------|-----|-----|
| POST | `/api/chat` | Proxar till Anthropic med Mikaels nyckel. Kräver `Authorization` (kundtoken). Mäter tokens, kollar kostnadstak. Streamar tillbaka. |
| GET | `/api/usage` | Kundens förbrukning innevarande period. |

---

## 5. Datamodell (D1)

```sql
CREATE TABLE teams (
  slug        TEXT PRIMARY KEY,          -- capability-slug (≥128 bitar slump)
  config      TEXT NOT NULL,             -- team-JSON (samma format som portal/teams/*.js)
  tier        TEXT NOT NULL,             -- 'self-serve' | 'managed'
  stripe_customer TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE pending (
  id          TEXT PRIMARY KEY,          -- draftId
  config      TEXT NOT NULL,
  stripe_session TEXT,
  created_at  INTEGER NOT NULL           -- städa bort >24h gamla
);

-- M2b
CREATE TABLE usage (
  slug        TEXT NOT NULL,
  period      TEXT NOT NULL,             -- 'YYYY-MM'
  input_tok   INTEGER DEFAULT 0,
  output_tok  INTEGER DEFAULT 0,
  PRIMARY KEY (slug, period)
);
```

Slug genereras med `crypto.getRandomValues` (16+ byte, base62) — oguessbar.

---

## 6. Stripe-integration

- **Checkout:** `/api/checkout` skapar en Session (`mode: 'payment'` för engång,
  `'subscription'` för retainer) med `success_url` → `/portal/aktivera?session_id={CHECKOUT_SESSION_ID}`,
  `cancel_url` → tillbaka till Buildern.
- **Webhook:** verifiera `Stripe-Signature` mot `STRIPE_WEBHOOK_SECRET` (Stripes
  SDK funkar i Workers, eller verifiera manuellt med Web Crypto). Hantera
  `checkout.session.completed` → provisionera team.
- **Idempotens:** webhooken kan komma flera gånger → no-op om teamet redan finns
  för den sessionen.

Aktiveringssida (`portal/aktivera`) pollar `/api/checkout/status` tills slug finns.

> **Historik, överspelad 2026-08-05.** Ursprungsplanen var att visa "Ditt team
> är klart" med en direktlänk `portal/?team=<slug>` — själva capability-URL:en
> som åtkomst. Den byggda sidan (`portal/aktivera.html`) gör i stället det som
> beskrivs högst upp i dokumentet: den visar att kontot är kopplat och pekar
> kunden till inloggning med engångskod, inte till en länk att spara.

---

## 7. Ändringar i befintlig frontend (små)

- **Builder:** efter genererat team, ny knapp "Spara i molnet" → POST utkast till
  `/api/checkout`, redirect till Stripe. (Bredvid dagens "Ladda ner config".)
- **Portal `loadTeam`:** idag laddar den `teams/<slug>.js`. Lägg till: om den
  statiska filen 404:ar, gör `GET /api/teams/<slug>` och använd JSON:en. Då funkar
  både inbyggda exempel och moln-team utan särbehandling.
- **(M2b) Portal `streamClaude`:** i managed-läge anropa `/api/chat` istället för
  `api.anthropic.com`, med kundtoken i stället för `x-api-key`.

---

## 8. Konton, secrets och config (det du behöver fixa)

- [ ] **Stripe-konto** + produkter/priser skapade (Beslut D). Secrets:
      `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- [ ] **Cloudflare:** D1-databas (`wrangler d1 create agent-team-builder`), bindning
      i `wrangler.toml`. Pages-projektet finns redan.
- [ ] **(M2b)** `ANTHROPIC_API_KEY` med credits för managed-proxyn.
- [ ] Secrets sätts som Pages-miljövariabler (krypterade), aldrig i git.

Inloggning för dessa gör du själv i din terminal med t.ex.
`! npx wrangler login` och `! npx stripe login`.

---

## 9. Säkerhet

- **Webhook-signatur** måste verifieras — annars kan vem som helst provisionera
  gratis team.
- **Capability-slugs** ≥128 bitar slump (oguessbara), serveras bara över HTTPS.
  Sedan M3 är slugen inte längre kundens enda skydd — kontot och engångskoden
  är det (se markeringen högst upp i dokumentet) — men slugen förblir
  oguessbar av samma skäl som innan: `/api/teams/:slug` ska inte gå att
  skanna fram.
- **M2b proxy:** kundtoken krävs; **kostnadstak per kund och period** (hård gräns
  i `/api/chat`); Cloudflare rate limiting; logga aldrig nyckeln.
- BYO-läget rör ingen kostnad/risk för dig — bara managed gör det.

---

## 10. Byggsekvens inom M2

1. **M2a-1:** ✅ **BYGGT (2026-06-28).** D1-schema (`migrations/0001_init.sql`),
   `/api/teams/:slug` (`functions/api/teams/[slug].js`), portalens fallback-laddning,
   D1-bindning i `wrangler.toml`, npm-scripts (`db:migrate:local`, `dev:cf`).
   **I drift sedan 2026-07-15:** D1 skapad, remote-migrerad, `database_id` i
   `wrangler.toml`, `/api/teams/:slug` verifierad live. Verifieringen var
   **manuell (ad hoc), inte automatiserad** — repot innehåller inga tester.
   Känd lucka: `_headers` gäller inte Functions-svar, så `/api/*` går ut utan
   CSP och `nosniff`, och HEAD faller tillbaka på den statiska sidan. Fixa i
   ett `functions/_middleware.js` innan M2a-2 ärver samma nolla.
2. **M2a-2:** `/api/checkout` + Stripe i **testläge** + aktiveringssida.
3. **M2a-3:** `/api/stripe-webhook` + provisionering + idempotens. End-to-end i
   Stripe-testläge.
4. **M2a-4:** Builderns "Spara i molnet"-knapp. Skarpt i Stripe live.
5. **M2b** (separat): managed proxy + mätning + tak + token-auth + magisk länk.

Varje steg är verifierbart för sig. M2a-1 till M2a-3 kan byggas och testas helt i
Stripe **testläge** utan att en krona rör sig.

---

## 11. Kontext: M1.5 "Mapp på datorn" flyttar M2b:s mål (2026-07-16)

Portalen har numera en **arbetsyta** (veckostart, rutiner, möten, minne &
underlag, export) och **mappkoppling** via File System Access (Chrome/Edge):
kundens material bor i en vanlig mapp (`minne.md` + `.md`/`.txt`-underlag,
svar skrivs till `från-teamet/`). Det tar bort localStorage-taken utan backend,
och en mapp i OneDrive/Dropbox ger kunden synk + delning själv.

**Konsekvens för M2b:** kvarvarande värde = *mobil, slippa nyckel, riktig
fleranvändare med behörigheter, RAG i stor skala* — inte grundlagring.

## 12. M2b — nedbrytning (managed, materiallagring, RAG-trappa)

> Ordningen förutsätter M2a-2…4 (Stripe) — ingen managed utan prenumeration.

- **M2b-1 — Proxy + mätning** (§4:s `/api/chat`, `/api/usage`): streama mot
  modell-API:t med Mikaels nyckel; tokens → `usage`; hårt kostnadstak per
  kund/period; Cloudflare rate limiting. **Överväg OpenRouter som backend:**
  ett konto, inbyggda spend-limits, alla modeller, och billiga defaulter
  (deepseek-v4-flash) som gör prenumerationsmarginalen hållbar. Frontenden
  finns redan förberedd: `atb-claude.js` väljer redan endpoint per läge.
- **M2b-2 — Identitet + fleranvändare:** ~~magisk länk via e-post (engångskod;
  MailChannels är gratis från Workers, annars Resend), sessions-token i D1,
  `customers`-tabell.~~ **Identitetsdelen är byggd och i drift sedan M3
  (2026-08-05)** — engångskod via Resend, `users`/`sessions` i
  `migrations/0002_auth.sql`, se markeringen högst upp i dokumentet. Kvar att
  göra är fleranvändardelen: `team_access` har rollerna (`owner`/`member`)
  men ingen inbjudningsknapp och ingen API-rutt — i dag betyder en
  niopersonersbyrå nio manuella körningar av `scripts/provision.mjs`. Sen
  inbjudningar: fler e-postadresser per tenant → fempersonersbyrån delar team,
  minne och historik på riktigt.
- **M2b-3 — Materiallagring i molnet:** `materials`-tabell i D1
  (`team, id, title, text, active, updated_at`) + företagsminne + historik.
  Portalens "Minne & underlag"-UI behålls oförändrat — bara lagringsbackend
  byts (`/api/materials` i stället för localStorage/mapp). Filer (PDF/Word):
  R2 + textextraktion → `materials`; kan vänta till v2.
- **M2b-4 — RAG-trappan** (när materialet överstiger kontextbudgeten):
  1. *Destillat:* generera ~500-teckens sammanfattning per underlag vid
     uppladdning; sammanfattningarna alltid i kontexten, fulltext på begäran.
     Billigt, inget nytt system.
  2. *Riktig RAG:* Cloudflare Vectorize + Workers AI-embeddings — chunka,
     embedda, hämta top-k per fråga. GDPR-utredning krävs: D1 ligger i EU
     (EEUR), men Workers AI/Vectorize kör globalt — jurisdiktionsval eller
     EU-baserad embedding kan behövas.

Kostnadssida: D1/R2/Vectorize har generösa gratisnivåer; Workers-betalplan
~5 USD/mån. Marginalen på managed äts av modellkostnaden — därav
OpenRouter-poängen i M2b-1.

## 13. Öppna frågor (svara när de blir aktuella)

- Ska moln-team kunna **redigeras** efter köp, eller är de frysta tills nästa körning?
- Vad händer om kunden vill ha **flera team** (capability-URL per team räcker, men
  vill du ha en samlingsvy)?
- Managed: **modellval** låst eller kundstyrt? (Påverkar kostnadstaket.)
- Retainer: vad ingår konkret per månad (kopplas till prisnivåerna på säljsidan)?
```
