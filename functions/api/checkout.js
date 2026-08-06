// POST /api/checkout  { tier, config }  → { url }
//
// Steg ett i köpflödet (Beslut A i m2-backend-spec.md: bygg → betala → spara).
// Teamet är redan byggt i webbläsaren när kunden kommer hit. Vi lägger undan
// utkastet i `pending`, skapar en Stripe Checkout Session och skickar tillbaka
// adressen dit kunden ska.
//
// Utkastet sparas FÖRE betalningen, inte efter. Annars måste webbläsaren hålla
// kvar en konfiguration på tiotusentals tecken genom en omdirigering till
// Stripe och tillbaka — och en kund som stänger fliken mitt i har betalat för
// ett team som ingen längre har.

import { json, readJson, nowMs, randomHex, allowAttempt, clientIp } from "./auth/_lib.js";
import { stripeCall, TIERS } from "./_stripe.js";

// Ett team-JSON är stort men inte hur stort som helst. Taket finns för att
// rutten är öppen: utan det är den en väg att fylla databasen.
const MAX_CONFIG_BYTES = 400 * 1024;

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  // Öppen rutt som skriver till databasen och anropar Stripe. Tjugo försök
  // per kvart och IP räcker för varje verklig kund och stoppar en skriptad.
  if (!(await allowAttempt(db, "ip:checkout:" + clientIp(request), 20))) {
    return json({ error: "För många försök. Vänta en kvart och försök igen." }, 429);
  }

  const body = await readJson(request);
  const tier = String(body.tier || "");
  const spec = TIERS[tier];
  if (!spec) return json({ error: "okänd nivå" }, 400);

  const price = env[spec.env];
  if (!price) return json({ error: "nivån är inte prissatt i den här miljön" }, 500);

  // Konfigen tas emot som objekt och sparas som sträng — samma format som
  // portal/teams/*.js (window.TEAM) och som /api/teams/:slug skickar tillbaka.
  const config = body.config;
  if (!config || typeof config !== "object" || !Array.isArray(config.agents) || !config.agents.length) {
    return json({ error: "utkastet saknar agenter" }, 400);
  }
  const configText = JSON.stringify(config);
  if (configText.length > MAX_CONFIG_BYTES) return json({ error: "utkastet är för stort" }, 413);

  const draftId = randomHex(16);
  const t = nowMs();

  await db.prepare(
    "INSERT INTO pending (id, config, plan, created_at) VALUES (?, ?, ?, ?)"
  ).bind(draftId, configText, tier, t).run();

  // Adresserna byggs ur den begärans egen origin, inte ur en hårdkodad domän.
  // Då fungerar flödet likadant på en förhandsdeploy som på mittaiteam.se.
  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await stripeCall(env, "/checkout/sessions", {
      mode: spec.mode,
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      // {CHECKOUT_SESSION_ID} är Stripes egen platshållare och fylls i av dem.
      success_url: origin + "/portal/aktivera.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/builder/",
      locale: "sv",
      // Skapa en Stripe-kund även vid engångsköp. Utan den är ett köp en lös
      // betalning utan historik — och abonnemangsnivån, när proxyn finns,
      // kräver en kund att hänga prenumerationen på.
      customer_creation: "always",
      // Mejladressen är leveransadressen: den blir kundens konto. Stripe samlar
      // alltid in den i payment-läge, så vi behöver inte fråga två gånger.
      "metadata[draft_id]": draftId,
      "metadata[plan]": tier,
      // Kvitto direkt från Stripe. Ett köp utan kvitto blir ett supportärende.
      "payment_intent_data[metadata][draft_id]": draftId,
    }, "checkout:" + draftId);
  } catch (e) {
    // Utkastet städas bort direkt i stället för att ligga kvar som skräp.
    await db.prepare("DELETE FROM pending WHERE id = ?").bind(draftId).run().catch(() => {});
    return json({ error: "kunde inte starta betalningen" }, 502);
  }

  await db.prepare("UPDATE pending SET stripe_session = ? WHERE id = ?")
    .bind(session.id, draftId).run();

  // Gammalt skräp städas här i stället för i ett schemalagt jobb: utkast som
  // aldrig betalades har inget värde, och rutten körs ofta nog.
  await db.prepare("DELETE FROM pending WHERE created_at < ?")
    .bind(t - 24 * 60 * 60 * 1000).run().catch(() => {});

  return json({ url: session.url, sessionId: session.id });
}
