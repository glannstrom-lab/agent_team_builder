// Vad "köpt" betyder — på ett enda ställe.
//
// Inledande understreck = biblioteksfil, ingen route (samma konvention som
// auth/_lib.js och _stripe.js).
//
// Reglerna låg tidigare bara i functions/api/ai.js, som en spärrlista över
// plan-värden. Två problem med det:
//
//  1. `/api/teams/:slug` läste inte planen alls. En kund vars provmånad tagit
//     slut fick alltså hela teamet levererat och möttes av spärren först när
//     hon skrivit sitt första meddelande. Grinden ska sitta i dörren, inte i
//     rummet innanför.
//  2. Ingen kod skrev någonsin de värden spärrlistan letade efter. Listan var
//     korrekt och verkningslös på samma gång — 90 kr gav portalåtkomst i
//     evighet, och därmed sålde 290-nivån aldrig sig själv.
//
// Funktionerna här är rena: de tar en rad och en tidpunkt och returnerar ett
// omdöme. Ingen databas, ingen fetch, inget Date.now(). Det är därför de går
// att testa i test/plan.mjs utan att någon del av Cloudflare startas.

// "En månad från beställningen" (villkor.html §4). Samma tal som portalen
// räknar med i trialNoticeFor() — ändras det ena måste det andra följa med,
// annars säger kortet i arbetsytan en sak och spärren en annan.
export const TRIAL_DAYS = 30;
export const DAY_MS = 86_400_000;

// Provmånadens namn genom tiderna. "trial-byo" ligger kvar på team som köptes
// före omläggningen 2026-08-06, då kunden fortfarande hade en egen nyckel.
// Att glömma det gamla namnet hade gett just de kunderna evig åtkomst — vilket
// är precis felet den här filen finns för att laga.
export const TRIAL_PLANS = new Set(["trial", "trial-byo"]);

// Spärrlista, inte tillåtlista. Ett tomt plan-fält räknas som köpt, och det är
// ett medvetet val: webhooken skriver NULL om Stripes metadata skulle saknas,
// och scripts/provision.mjs sätter inget plan alls. Att låsa ute en kund som
// betalat är värre än att släppa in en som fått teamet av oss för hand.
export const PLANS_WITHOUT_PORTAL = new Set([
  "expired",    // provmånaden passerade 30 dagar
  "cancelled",  // abonnemanget sagt upp och perioden slut
  "past_due",   // Stripe gav upp efter alla omförsök på en faktura
  "refunded",   // pengarna tillbaka
]);

// Terminalvärden i en mening var — visas aldrig rått för kunden, men ligger i
// loggen och i databasen där en människa läser dem.
export const PLAN_REASON = {
  expired: "provmånaden är slut",
  cancelled: "abonnemanget är uppsagt",
  past_due: "fakturan blev aldrig betald",
  refunded: "köpet är återbetalat",
};

/**
 * Får det här teamet användas i portalen just nu?
 *
 * @param {{plan?: string|null, created_at?: number|null}} row  rad ur `teams`
 * @param {number} now  unix epoch (ms)
 * @returns {{ok: boolean, plan: string, reason: string|null, expire: boolean, endsAt: number|null}}
 *
 * `expire: true` betyder "skriv 'expired' till raden om du kan". Kontrollen är
 * lat med flit: en cron som stänger av kunder mitt i natten är en till sak som
 * kan gå sönder tyst, och en provmånad som tar slut har ingen brådska förrän
 * någon faktiskt knackar på.
 */
export function planState(row, now) {
  const plan = String((row && row.plan) || "");

  if (PLANS_WITHOUT_PORTAL.has(plan)) {
    return { ok: false, plan, reason: plan, expire: false, endsAt: null };
  }

  if (TRIAL_PLANS.has(plan)) {
    const started = Number(row && row.created_at) || 0;
    // Utan startdatum går slutdatumet inte att räkna ut. Då släpper vi igenom:
    // en kund som betalat ska inte stängas ute av att en tidsstämpel saknas.
    if (!started) return { ok: true, plan, reason: null, expire: false, endsAt: null };

    const endsAt = started + TRIAL_DAYS * DAY_MS;
    if (now >= endsAt) {
      return { ok: false, plan, reason: "expired", expire: true, endsAt };
    }
    return { ok: true, plan, reason: null, expire: false, endsAt };
  }

  return { ok: true, plan, reason: null, expire: false, endsAt: null };
}

// Har teamet en plan som gått att ta sig ur, och som därför går att fortsätta?
// Styr vilken knapp den låsta vyn visar: "Aktivera teamet" för något som
// aldrig köpts, "Fortsätt löpande" för något som varit igång.
export function wasEverPaid(plan) {
  const p = String(plan || "");
  return TRIAL_PLANS.has(p) || PLANS_WITHOUT_PORTAL.has(p) || p === "standard" || p === "buy";
}

// Sätts på raden när en händelse från Stripe stänger av ett team. Egen
// funktion för att UPDATE-satsen ska se likadan ut på alla sex ställen den
// körs — inklusive plan_changed_at, som ingen kommer ihåg annars.
export function planUpdateSql() {
  return "UPDATE teams SET plan = ?1, plan_changed_at = ?2 WHERE slug = ?3";
}
