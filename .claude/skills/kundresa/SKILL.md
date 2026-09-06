---
name: kundresa
description: Gå hela köpkedjan från gratis bygge till första svaret i portalen — bygga, köpa i Stripe, webhookens leverans, kvittosidan, inloggningskoden och första chatten — och hitta var den brister. Använd innan en riktig kund ska köpa, efter ändringar i functions/api/checkout.js, stripe-webhook.js, auth/ eller portal/aktivera.html, när Stripe byter läge eller nycklar, när något i betalflödet ska verifieras, och när en kund säger att hon inte kommer in. Triggar på "köpflödet", "betalning", "Stripe", "webhook", "kunden kommer inte in", "aktivera", "leverans", "första kunden", "ångerrätt", "villkoren".
---

# Kundresan, hel

Sex av de öppna punkterna i `ROADMAP.md` — KR3, KR4, KR5, KR6, BF4, DR8 —
ligger på sträckan mellan "kunden klickar köp" och "kunden får sitt första
svar". De hittades var för sig, genom läsning. **Ingen har gått sträckan hel.**

Den körs sällan, och det är hela argumentet för en skill: en procedur du gör
två gånger om året minns du aldrig, och den här ska fungera den dag en betalande
kund står i den.

```bash
node .claude/skills/kundresa/kopresan.mjs                        # statisk genomgång
node .claude/skills/kundresa/kopresan.mjs --live https://mittaiteam.se
```

## Kedjan, länk för länk

| # | Länk | Vad som ska hålla |
|---|---|---|
| 1 | **Bygget** | gratis, anonymt, återupptagbart efter F5; klienten skickar ett STEG, aldrig en systemprompt |
| 2 | **Villkoren** | måste visas *innan* avtalet ingås — annars börjar ångerfristen inte löpa |
| 3 | **Kassan** | rätt nivå, rätt belopp, `success_url` till kvittosidan |
| 4 | **Webhooken** | levererar teamet, idempotent vid retries, sex händelsetyper |
| 5 | **Kvittosidan** | säger sanningen om vad som händer härnäst |
| 6 | **Inloggningen** | engångskod per mejl — enskild felpunkt för ALL portalåtkomst |
| 7 | **Första svaret** | 402 utan `team_access`, riktigt svar med |

Skriptet läser källan och rapporterar varje länk. Uppmätt 2026-09-06: **sju
brott**, alla kända och alla i ROADMAP.md.

## Gå den på riktigt

Statisk läsning fångar inte att kortet dras eller att mejlet kommer fram. Kör
den här sekvensen när något i kedjan ändrats, eller inför den första riktiga
kunden:

1. **Bygg ett team** i Buildern på `mittaiteam.se` — hela vägen, som en kund.
2. **Köp provmånaden.** Titta på id:t som `/api/checkout` returnerar:
   `cs_test_…` = testläge, inga pengar dras. `cs_live_…` = skarpt.
   **Uppmätt 2026-08-07 låg kassan i testläge.** Om det ändrats sedan dess syns
   inte i repot — *fråga Mikael, påstå inget.*
3. **Följ webhooken** i Stripes dashboard: kom eventet fram, svarade vi 200?
   De sex händelsetyperna måste vara **påslagna i dashboarden** — annars körs
   koden aldrig och allt ser ut att fungera precis som förut.
4. **Kvittosidan** ska säga vad som gäller. Gör den inte det, se KR6.
5. **Logga in** med adressen du betalade med. Kommer koden fram? Utan
   `MAIL_PROVIDER`, `MAIL_API_KEY` och `MAIL_FROM` skickas ingenting — och
   `/api/health` säger fortfarande 200 (DR6).
6. **Första svaret.** Går det igenom är kedjan hel.
7. **Gå tillbaka till Buildern** och klicka "Bygg ert team". Får du
   återupptagningsrutan och en köpknapp för teamet du just köpt, är KR5 levande.

Emulatorvägen för stegen 5–7 utan att röra Stripe:
`.claude/skills/portal-med-ogon/satt-upp-lokalt.mjs`.

## De två som är juridik, inte kod

- **BF4** — `checkout.js` sätter varken `consent_collection` eller
  `custom_text`, och `villkor.html` §15 lovar ett samtycke ingen kod inhämtar.
  Distansavtalslagen kräver information om ångerrätten innan avtalet ingås;
  utan den börjar fristen inte löpa, och ångerknappen skyddar då inte mot en
  väsentligt längre frist än de 14 dagar koden räknar med. Kodfixen är liten
  (`consent_collection[terms_of_service]=required` i båda sessionsanropen +
  villkors-URL i Stripes dashboard). **Meningen i §15 är Mikaels text — rör den
  inte.**
- **KR4** — provmånaden tar slut per *team*, inte per *kund*. Med gratis bygge
  är cykeln två klick i månaden: 90 kr i stället för 290, i all evighet.
  Varken villkoren eller prislistan säger något om en provmånad per kund.
  Villkorsraden är Mikaels; koden kan flagga och mejla `info@`.

## Om en kund hör av sig och inte kommer in

Kolla i den ordningen — billigast först:

1. `/api/health` — 503 säger vilken av tre kontroller som fallerar.
2. Finns raden i `team_access`? Utan den svarar `/api/teams/:slug` 402
   `purchase_required`, hur betalt teamet än är.
3. Vad säger `teams.plan`? `expired`, `cancelled`, `past_due` och `refunded`
   stänger portalen — `planState()` i `functions/api/_plan.js` avgör.
4. Kom inloggningskoden fram? Mejlvägen loggar bara till konsolen (DR6), så
   svaret finns i `wrangler pages deployment tail` och ingen annanstans.
5. Är det chatten som tiger? Titta på `ai_errors` — 402 uppströms betyder tömd
   kredit hos OpenRouter, och då är produkten stum för alla, inte bara för den
   som ringde.
