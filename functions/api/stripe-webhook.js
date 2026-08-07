// POST /api/stripe-webhook
//
// Stripe berättar vad som hänt med pengarna, och vi ändrar `teams.plan`
// därefter. Rutten sköter hela planens livscykel — inte bara dess början.
//
// Fram till 2026-08-07 lyssnade den på EN händelse: checkout.session.completed.
// Följden var att en plan aldrig kunde ta slut. Ett engångsköp på 90 kr gav
// portalåtkomst i evighet, en uppsagd prenumeration fortsatte fungera, och en
// återbetalning ändrade ingenting. 290-nivån gick därmed inte att sälja: den
// kostade mer och gav mindre än provmånaden.
//
// Fyra saker gör den här rutten känsligare än de andra:
//
//  1. Den är öppen för hela internet och skapar konton. Signaturkontrollen är
//     därför inte en formalitet — den ÄR betalningsbeviset. Ingen giltig
//     signatur, inget team.
//  2. Stripe skickar om händelser vid minsta tveksamhet, ibland flera gånger.
//     Allt här måste tåla att köras två gånger utan att skapa två team.
//  3. Kunden väntar framför aktiveringssidan medan det här körs. Ett fel som
//     bara loggas syns som en sida som snurrar för alltid.
//  4. Händelserna som STÄNGER AV kan låsa ute en betalande kund om de träffar
//     fel rad. Uppslaget går därför på abonnemangets id när det finns, och på
//     kunden bara som andrahandsval.
//
// Händelser som måste vara påslagna i Stripes dashboard:
//   checkout.session.completed      köpet — skapar team, konto och åtkomst
//   customer.subscription.deleted   abonnemanget slut → 'cancelled'
//   invoice.payment_failed          Stripe gav upp → 'past_due'
//   invoice.paid                    betalningen kom in → öppnar igen
//   charge.refunded                 pengarna tillbaka → 'refunded'

import { json, nowMs, randomHex, normalizeEmail } from "./auth/_lib.js";
import { verifyStripeSignature, newSlug } from "./_stripe.js";
import { planUpdateSql, PLANS_WITHOUT_PORTAL } from "./_plan.js";

// Engångsplaner. Används bara vid återbetalning: ett abonnemang avslutas
// genom sina egna händelser, aldrig genom en charge.
const ONEOFF_PLANS = new Set(["trial", "trial-byo", "buy"]);

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  // Råa kroppen, inte omserialiserad JSON: signaturen är räknad på exakt de
  // bytes Stripe skickade, och JSON.parse + JSON.stringify ändrar dem.
  const raw = await request.text();
  const ok = await verifyStripeSignature(
    raw,
    request.headers.get("stripe-signature"),
    env.STRIPE_WEBHOOK_SECRET
  );
  if (!ok) return json({ error: "ogiltig signatur" }, 400);

  let event;
  try {
    event = JSON.parse(raw);
  } catch (_) {
    return json({ error: "trasig kropp" }, 400);
  }

  const obj = (event.data && event.data.object) || null;
  if (!obj) return json({ received: true });
  const t = nowMs();

  // Okända händelsetyper kvitteras med 200. Ett fel här får Stripe att försöka
  // igen i timmar för något vi ändå inte tänker göra något åt.
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckout(db, obj, t);
    case "customer.subscription.deleted":
      return handleSubscriptionEnd(db, obj, t);
    case "invoice.payment_failed":
      return handleInvoiceFailed(db, obj, t);
    case "invoice.paid":
    case "invoice.payment_succeeded":
      return handleInvoicePaid(db, obj, t);
    case "charge.refunded":
      return handleRefund(db, obj, t);
    default:
      return json({ received: true });
  }
}

// ── köpet ─────────────────────────────────────────────────────────────────

async function handleCheckout(db, session, t) {
  if (!session.id) return json({ received: true });

  // Betald? En session kan slutföras utan att pengarna gått igenom (t.ex.
  // fördröjda betalsätt). Då väntar vi på checkout.session.async_payment_succeeded
  // i stället — som vi inte prenumererar på än, eftersom kort är enda betalsättet.
  if (session.payment_status !== "paid") return json({ received: true, note: "inte betald än" });

  // Idempotensen: teams.stripe_session är UNIQUE. Finns raden redan är
  // händelsen en repris och vi svarar 200 utan att röra något. Gäller både
  // nya köp och uppgraderingar — uppgraderingen skriver om sessionsid:t på
  // teamet, så en repris hittar samma rad.
  const already = await db.prepare("SELECT slug FROM teams WHERE stripe_session = ?")
    .bind(session.id).first();
  if (already) return json({ received: true, slug: already.slug });

  const plan = (session.metadata && session.metadata.plan) || null;

  // ── uppgradering av ett team som redan finns ──
  //
  // Det är den här vägen som gör att provmånaden kan ta slut utan att kunden
  // förlorar sitt team. Utan den vore utgången bara en stängd dörr: enda
  // sättet att fortsätta hade varit att bygga om teamet från början, och en
  // kund som just tvingats göra om allt köper inte 290-nivån.
  //
  // Åtkomsten prövades i /api/checkout innan sessionen skapades — metadatat
  // sattes av oss, inte av klienten, och Stripe ekar bara tillbaka det.
  const upgradeSlug = (session.metadata && session.metadata.upgrade_slug) || null;
  if (upgradeSlug) {
    const res = await db.prepare(
      "UPDATE teams SET plan = ?1, plan_changed_at = ?2, " +
      "stripe_customer = COALESCE(?3, stripe_customer), " +
      "stripe_subscription = COALESCE(?4, stripe_subscription), " +
      "stripe_session = ?5 WHERE slug = ?6"
    ).bind(plan, t, session.customer || null, session.subscription || null, session.id, upgradeSlug)
      .run().catch((e) => { console.error("[checkout] uppgradering misslyckades", session.id, String(e)); return null; });

    if (!res) return json({ error: "kunde inte spara" }, 500);
    if (!res.meta || !res.meta.changes) {
      // Betalt för ett team som inte längre finns. Kvittera — Stripe kan inte
      // lösa det genom att försöka igen — och lämna spår för en människa.
      console.error("[checkout] uppgradering utan team", session.id, upgradeSlug);
      return json({ received: true, note: "teamet saknas" });
    }
    return json({ received: true, slug: upgradeSlug, upgraded: true });
  }

  // ── nytt team ──
  const draftId = (session.metadata && session.metadata.draft_id) || null;
  const draft = draftId
    ? await db.prepare("SELECT config, plan FROM pending WHERE id = ?").bind(draftId).first()
    : null;

  if (!draft) {
    // Utkastet är borta men betalningen är gjord. Att svara med fel vore att
    // låta Stripe försöka igen i timmar mot ett problem som inte löser sig.
    // Kvittera, och lämna spår: det här är ett ärende för en människa.
    console.error("[checkout] betald session utan utkast", session.id, draftId);
    return json({ received: true, note: "utkastet saknas" });
  }

  const slug = newSlug();
  const email = normalizeEmail(
    (session.customer_details && session.customer_details.email) || session.customer_email || ""
  );
  const userId = "usr_" + randomHex(12);

  // Allt i en batch: D1 kör den som en transaktion. Halvvägs vore värsta
  // utfallet — ett team utan ägare, eller ett konto utan team.
  const statements = [
    db.prepare(
      "INSERT INTO teams (slug, config, tier, plan, plan_changed_at, stripe_customer, stripe_subscription, stripe_session, created_at) " +
      "VALUES (?, ?, 'self-serve', ?, ?, ?, ?, ?, ?)"
    ).bind(
      slug, draft.config, plan || draft.plan || null, t,
      session.customer || null, session.subscription || null, session.id, t
    ),
  ];

  // Utan mejladress finns ingen att leverera till. Teamet sparas ändå — det
  // är betalt — och kan kopplas till ett konto för hand med scripts/provision.mjs.
  if (email) {
    statements.push(
      db.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING")
        .bind(userId, email, t),
      db.prepare(
        "INSERT INTO team_access (team_slug, user_id, role, created_at) " +
        "SELECT ?, id, 'owner', ? FROM users WHERE email = ? " +
        "ON CONFLICT(team_slug, user_id) DO NOTHING"
      ).bind(slug, t, email)
    );
  } else {
    console.error("[checkout] betald session utan mejladress", session.id);
  }

  statements.push(db.prepare("DELETE FROM pending WHERE id = ?").bind(draftId));

  try {
    await db.batch(statements);
  } catch (e) {
    // Här är fel däremot rätt svar: Stripe försöker igen, och nästa gång kan
    // databasen vara uppe. Idempotenskollen ovan gör omförsöket ofarligt.
    console.error("[checkout] kunde inte spara team", session.id, String(e));
    return json({ error: "kunde inte spara" }, 500);
  }

  return json({ received: true, slug });
}

// ── avslut och återöppning ────────────────────────────────────────────────

// Abonnemanget är slut — antingen uppsagt och perioden utgången, eller
// avslutat av Stripe efter alla misslyckade omförsök. I båda fallen är det
// HÄR åtkomsten upphör, inte den dag kunden klickade "säg upp": betald tid är
// betald tid, och /api/subscription/cancel sätter därför bara
// cancel_at_period_end.
async function handleSubscriptionEnd(db, sub, t) {
  const slugs = await teamsByStripe(db, { subscription: sub.id, customer: sub.customer });
  const n = await setPlan(db, slugs.map((r) => r.slug), "cancelled", t);
  if (!n) console.error("[stripe] uppsagt abonnemang utan team", sub.id, sub.customer);
  return json({ received: true, updated: n });
}

// Fakturan gick inte igenom. Att stänga av direkt vore fel: Stripes egna
// omförsök löper i veckor och de flesta kort går igenom på andra försöket.
// `next_payment_attempt` är null först när Stripe gett upp — det är den
// tidpunkt som betyder något för oss.
async function handleInvoiceFailed(db, invoice, t) {
  if (invoice.next_payment_attempt) return json({ received: true, note: "fler försök kvar" });

  const slugs = await teamsByStripe(db, {
    subscription: subscriptionOf(invoice),
    customer: invoice.customer,
  });
  const n = await setPlan(db, slugs.map((r) => r.slug), "past_due", t);
  console.warn("[stripe] faktura obetald efter alla försök", invoice.id, "team:", n);
  return json({ received: true, updated: n });
}

// Betalningen kom in. Öppnar bara sådant som ÄR stängt — en normal
// månadsförnyelse ska inte skriva om raden varje månad, och en plan som
// stängts av en människa för hand ska inte öppnas av en gammal faktura.
async function handleInvoicePaid(db, invoice, t) {
  const rows = await teamsByStripe(db, {
    subscription: subscriptionOf(invoice),
    customer: invoice.customer,
  });
  const spärrade = rows.filter((r) => PLANS_WITHOUT_PORTAL.has(String(r.plan || "")));
  const n = await setPlan(db, spärrade.map((r) => r.slug), "standard", t);
  if (n) console.warn("[stripe] plan återöppnad efter betalning", invoice.id, n);
  return json({ received: true, reopened: n });
}

// Pengarna tillbaka. Delåterbetalning är inte ett avslut — den kan lika gärna
// vara en prisjustering — så bara full återbetalning stänger av.
//
// Uppslaget går på kunden, eftersom teams-tabellen sparar sessionen och
// abonnemanget men inte payment_intent. Träffen begränsas därför till
// ENGÅNGSPLANER: annars kunde en återbetald provmånad stänga av samma kunds
// löpande team. Ett återbetalat abonnemang avslutas genom
// customer.subscription.deleted, som ändå följer med i praktiken.
async function handleRefund(db, charge, t) {
  if (charge.refunded !== true) return json({ received: true, note: "delåterbetalning" });
  if (!charge.customer) return json({ received: true, note: "ingen kund på betalningen" });

  const rows = await teamsByStripe(db, { subscription: null, customer: charge.customer });
  const engångs = rows.filter((r) => ONEOFF_PLANS.has(String(r.plan || "")));
  const n = await setPlan(db, engångs.map((r) => r.slug), "refunded", t);
  console.warn("[stripe] återbetalning", charge.id, charge.customer, "team:", n);
  return json({ received: true, updated: n });
}

// ── uppslag ───────────────────────────────────────────────────────────────

// Abonnemangets id först, kunden sedan. Ordningen spelar roll: en kund kan ha
// flera team, och att stänga av dem allihop för att ETT abonnemang tog slut
// vore att låsa ute någon som betalar.
async function teamsByStripe(db, { subscription, customer }) {
  if (subscription) {
    const r = await db.prepare("SELECT slug, plan FROM teams WHERE stripe_subscription = ?")
      .bind(subscription).all().catch(() => null);
    if (r && r.results && r.results.length) return r.results;
  }
  if (customer) {
    const r = await db.prepare("SELECT slug, plan FROM teams WHERE stripe_customer = ?")
      .bind(customer).all().catch(() => null);
    if (r && r.results) return r.results;
  }
  return [];
}

async function setPlan(db, slugs, plan, t) {
  if (!slugs.length) return 0;
  try {
    await db.batch(slugs.map((s) => db.prepare(planUpdateSql()).bind(plan, t, s)));
  } catch (e) {
    // Fel är rätt svar: Stripe försöker igen, och att sätta samma plan två
    // gånger är ofarligt.
    console.error("[stripe] kunde inte skriva plan", plan, slugs.join(","), String(e));
    throw e;
  }
  return slugs.length;
}

// Stripe flyttade `invoice.subscription` till
// `invoice.parent.subscription_details.subscription` i API-versionerna från
// 2025. Vilken form som kommer beror på vilken version kontot är låst till,
// vilket inte styrs härifrån — så läs båda.
export function subscriptionOf(invoice) {
  if (!invoice) return null;
  if (typeof invoice.subscription === "string" && invoice.subscription) return invoice.subscription;
  const d = invoice.parent && invoice.parent.subscription_details;
  return (d && typeof d.subscription === "string" && d.subscription) ? d.subscription : null;
}
