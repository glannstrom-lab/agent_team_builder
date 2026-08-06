// POST /api/stripe-webhook
//
// Steg två i köpflödet: Stripe berättar att betalningen gick igenom, och vi
// gör om utkastet till ett riktigt team kopplat till ett konto.
//
// Tre saker gör den här rutten känsligare än de andra:
//
//  1. Den är öppen för hela internet och skapar konton. Signaturkontrollen är
//     därför inte en formalitet — den ÄR betalningsbeviset. Ingen giltig
//     signatur, inget team.
//  2. Stripe skickar om händelser vid minsta tveksamhet, ibland flera gånger.
//     Allt här måste tåla att köras två gånger utan att skapa två team.
//  3. Kunden väntar framför aktiveringssidan medan det här körs. Ett fel som
//     bara loggas syns som en sida som snurrar för alltid.

import { json, nowMs, randomHex, normalizeEmail } from "./auth/_lib.js";
import { verifyStripeSignature, newSlug } from "./_stripe.js";

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

  // Andra händelsetyper kvitteras med 200. Ett fel här får Stripe att försöka
  // igen i timmar för något vi ändå inte tänker göra något åt.
  if (event.type !== "checkout.session.completed") return json({ received: true });

  const session = event.data && event.data.object;
  if (!session || !session.id) return json({ received: true });

  // Betald? En session kan slutföras utan att pengarna gått igenom (t.ex.
  // fördröjda betalsätt). Då väntar vi på checkout.session.async_payment_succeeded
  // i stället — som vi inte prenumererar på än, eftersom kort är enda betalsättet.
  if (session.payment_status !== "paid") return json({ received: true, note: "inte betald än" });

  // Idempotensen: teams.stripe_session är UNIQUE. Finns raden redan är
  // händelsen en repris och vi svarar 200 utan att röra något.
  const already = await db.prepare("SELECT slug FROM teams WHERE stripe_session = ?")
    .bind(session.id).first();
  if (already) return json({ received: true, slug: already.slug });

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
  const plan = (session.metadata && session.metadata.plan) || draft.plan || null;
  const userId = "usr_" + randomHex(12);
  const t = nowMs();

  // Allt i en batch: D1 kör den som en transaktion. Halvvägs vore värsta
  // utfallet — ett team utan ägare, eller ett konto utan team.
  const statements = [
    db.prepare(
      "INSERT INTO teams (slug, config, tier, plan, stripe_customer, stripe_session, created_at) " +
      "VALUES (?, ?, 'self-serve', ?, ?, ?, ?)"
    ).bind(slug, draft.config, plan, session.customer || null, session.id, t),
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
