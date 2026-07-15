# Produktstrategi: low-touch självbetjäning

> Status: v1.1 (2026-07-15). Beslutad riktning, inte färdig spec.
> Läge: M2a-1 byggd + deployad (D1 skapad); M3-*landningssidorna* (9
> branscher i `verticals/`) är byggda i förväg, men vertikala
> **team-mallar** (fork C:s egentliga IP) återstår. M2a-2+ väntar på
> Stripe-konto.
> Skriven utifrån två beslut: **Hybrid betalmodell** och **A+B+C** som
> tillsammans tjänar ett mål — en produkt som säljer sig själv och kör utan
> att Mikael behöver vara inblandad, eftersom säljtiden är starkt begränsad.

## 1. Mål och begränsning

- **Hård begränsning:** Mikaels säljtid är mycket liten. Allt som kräver hans
  närvaro per kund skalar inte.
- **Mål:** en produkt som (a) säljer sig själv via demo/innehåll, (b) levereras
  automatiskt utan handpåläggning, (c) är bra nog ur lådan tack vare vertikala
  mallar.
- **Konsekvens:** konsultandet (A) får INTE vara motorn — det äter just den tid
  som saknas. Självbetjäningsprodukten är motorn. A och C tjänar den.

## 2. Den hårda sanningen om Claude Max (grundbult)

**Claude Max funkar bara inuti Claude Code och claude.ai — aldrig i en webbsida
eller backend.** Det finns ingen "Max-API". Allt som körs i webbläsare eller på
server kräver en API-nyckel med credits (skild fakturering från Max).

Följder:

- **Done-for-you levereras gratis** via `/build-team`-skillen i Claude Code på
  Mikaels Max. Ingen nyckel behövs för att *Mikael* ska bygga ett team.
- **Webb-Buildern och "managed"-nivån kräver nycklar** — kundens egen (BYO) eller
  Mikaels egen med credits på en backend. Max kan inte ersätta det.
- Detta är hela skälet till att **Hybrid** är rätt modell (se nedan).

## 3. Hur A/B/C tjänar det enda målet

| Fork | Roll i den här strategin |
|------|--------------------------|
| **A — Konsult** | Degraderas till sällan-aktivitet med högt pris. Syfte: kassaflöde *medan* produkten byggs + **skörda vertikala mallar och case (C)** från riktiga kunder. Inte volym. |
| **B — Produkt/infra** | Det som *möjliggör* hands-off: betalning + automatisk provisionering först, integrationer senare. Utan B kör inget utan Mikael. |
| **C — Vertikal IP** | Bränslet. Självbetjäning "säljer sig själv" bara om outputen är vass ur lådan — det kräver branschanpassade mallar. Varje A-uppdrag deponerar en. |

## 4. Betalmodell: Hybrid (vald)

- **Billig självbetjäningsnivå → BYO-nyckel.** Kunden skapar egen API-nyckel,
  kör Builder + portal. Mikael bär ingen modellkostnad/risk. Nära dagens arkitektur.
- **Premium "managed"-nivå → Mikael proxar + fakturerar.** Backend kör anropen
  via Mikaels egen nyckel, påslag på förbrukning. Kunden slipper all teknik.
  Detta är en riktig SaaS-komponent (drift, fakturering, kostnadsrisk).
- Börja lätt (BYO), väx in i managed när efterfrågan finns.

## 5. Arkitektur — faser

Notera: detta bryter medvetet projektets princip "noll infrastruktur" för
*webbprodukten*. Kärnan (prompts, skill, genereringen) förblir noll-infra; det
är bara köp/leverans/proxy-lagret som får en tunn backend.

- **Fas 0 (idag):** statiska filer på Cloudflare Pages, BYO-nyckel, portal-demo
  utan nyckel. Inget köp, ingen provisionering.
- **Fas 1 — Tunn backend för självbetjäning (BYO):**
  - Cloudflare Worker (samma plattform som Pages redan kör på).
  - Stripe Checkout för engångsköp.
  - Lagring (Cloudflare D1 eller KV) för genererade team + enkel åtkomstlänk.
  - Flöde: kund betalar → får sin egen portal (`?team=<slug>`) → kopplar in sin
    egen nyckel i portalen. Noll handpåläggning från Mikael.
- **Fas 2 — Managed-nivå (proxy + metering):**
  - Worker proxar `api.anthropic.com` med Mikaels nyckel.
  - Förbrukningsmätning + påslag, prenumerationsfakturering via Stripe.
  - Här uppstår modellkostnad och driftansvar — prissätt med marginal.
- **Fas 3 — Integrationer (B, långsiktig vallgrav):** koppla agenter till kundens
  riktiga verktyg (bokföring, CRM, inkorg, filer). Störst bytkostnad, dyrast att
  bygga. Vänta tills efterfrågan drar dit.

## 6. Vertikaler (C)

- Skörda 2–3 vertikaler från de första A-uppdragen (t.ex. bokföringsbyrå,
  marknadsbyrå, e-handel — bygg på befintliga `examples/`).
- Per vertikal: en team-mall + en landningssida + ett publikt case/demo-team.
- Mallarna gör självbetjäningsoutputen tillräckligt skräddarsydd utan Mikael i rummet.

## 7. Självmarknadsföring (svänghjulet)

- Demolänkar (`portal/?team=<slug>&demo=1`) i kall-mejl och på sajten.
- Galleriet som asynkront säljmaterial.
- En landningssida per vertikal (SEO + delbart).
- Lätt säljassist: demon övertygar 90%, walt halvautomatiserar den korta knuffen.
- Realism: ren SMB-självbetjäning konverterar lågt och behöver trafik — trafik är
  också arbete. Räkna med produktledd tillväxt *med* lätt assist, inte noll människa.

## 8. Sekvens / milstolpar

1. **M1 (nu):** kör A sparsamt → skörda 2–3 vertikala mallar + case. walt på
   invändnings-text och vertikala vinklar.
2. **M2:** Fas 1-backend — Stripe + provisionering, BYO-nyckel självbetjäning.
3. **M3:** vertikala landningssidor + svänghjul igång.
4. **M4:** Fas 2 managed-nivå (proxy + metering) när efterfrågan finns.
5. **Senare:** Fas 3 integrationer.

## 9. Öppna frågor / risker

- **Modellkostnad i managed:** måste prissättas med marginal och tak, annars
  äter en storanvändare lönsamheten.
- **Support:** självbetjäning ska vara självgående, men noll support är orealistiskt.
- **Konvertering kräver trafik:** marknadsföringsarbetet ersätter säljtiden — det
  försvinner inte, det byter form.
- **Princip-revidering:** "noll infra" gäller fortfarande kärnan, men inte
  köp/leverans-lagret. (Inskrivet i CLAUDE.md princip 8 sedan 2026-06-28.)
