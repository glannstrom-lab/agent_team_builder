// Tester för betalningens livscykel — POST /api/stripe-webhook och
// GET /api/teams/:slug (DR8).
//
// Webhooken är den enda koden som ändrar `teams.plan` efter ett köp, och den
// hade noll tester fram till 2026-09-26. Varje gren i den avgör om en kund
// kommer in eller står utanför: en gren som skriver fel plan låser ute någon
// som betalat, och en gren som inte skriver alls ger någon evig åtkomst för
// 90 kr — vilket var exakt läget före pass 2 (2026-08-07).
//
// Testerna kör den RIKTIGA `onRequestPost` med korrekt signerade händelser,
// mot en liten minnesdatabas som förstår just de satser rutterna ställer. Ingen
// kopia av webhookens logik: databasen är dum, och det den håller efteråt är
// det rutten faktiskt skrev. Signeringen är samma HMAC som i test/stripe.mjs.
//
// Okänd SQL kastar i stället för att svara null. En stubb som svarar null på
// allt hade låtit en omskriven sats passera tyst — och sett ut som en tom
// databas, vilket är precis det fall rutten ska tåla.
import { test } from "node:test";
import assert from "node:assert/strict";

import { onRequestPost } from "../functions/api/stripe-webhook.js";
import { onRequestGet } from "../functions/api/teams/[slug].js";
import { sha256Hex } from "../functions/api/auth/_lib.js";
import { TRIAL_DAYS, DAY_MS } from "../functions/api/_plan.js";

const SECRET = "whsec_testhemlighet_for_webhooken";

// Webhooken kontrollerar tidsfönstret mot Date.now() (ingen injicerbar klocka
// i rutten), så signaturen räknas på den riktiga tiden.
async function sign(body, secret, timestamp) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + "." + body));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Webhooken loggar varje avstängning med console.warn/error — med flit, det är
// spåret en människa läser i drift. I testutskriften är det bara brus.
const tyst = (fn) => async () => {
  const [w, e] = [console.warn, console.error];
  console.warn = () => {};
  console.error = () => {};
  try { return await fn(); } finally { console.warn = w; console.error = e; }
};

// ── minnesdatabasen ──────────────────────────────────────────────────────────
//
// Tabellerna är vanliga listor. Varje sats rutterna ställer har en rad här;
// allt annat kastar. `skrivna` bokför varje skrivande sats (sql + args), så
// ett test kan slå fast att INGENTING skrevs — det viktigaste påståendet för
// grenarna som ska låta bli.
function minnesDb({ teams = [], users = [], access = [], pending = [], sessions = [] } = {}) {
  const s = {
    teams: teams.map((r) => ({ ...r })),
    users: users.map((r) => ({ ...r })),
    access: access.map((r) => ({ ...r })),
    pending: pending.map((r) => ({ ...r })),
    sessions: sessions.map((r) => ({ ...r })),
  };
  const skrivna = [];

  function kör(sql, args) {
    const q = sql.replace(/\s+/g, " ").trim();

    // ── läsningar ──
    if (q === "SELECT slug FROM teams WHERE stripe_session = ?") {
      const r = s.teams.find((t) => t.stripe_session === args[0]);
      return { first: r ? { slug: r.slug } : null };
    }
    if (q === "SELECT config, plan FROM pending WHERE id = ?") {
      const r = s.pending.find((p) => p.id === args[0]);
      return { first: r ? { config: r.config, plan: r.plan } : null };
    }
    if (q === "SELECT slug, plan, plan_changed_at FROM teams WHERE stripe_subscription = ?") {
      return { all: s.teams.filter((t) => t.stripe_subscription === args[0]).map(({ slug, plan, plan_changed_at }) => ({ slug, plan, plan_changed_at })) };
    }
    if (q === "SELECT slug, plan, plan_changed_at FROM teams WHERE stripe_customer = ?") {
      return { all: s.teams.filter((t) => t.stripe_customer === args[0]).map(({ slug, plan, plan_changed_at }) => ({ slug, plan, plan_changed_at })) };
    }
    if (q.startsWith("SELECT s.user_id, s.expires_at, u.email FROM sessions s")) {
      const se = s.sessions.find((x) => x.token_hash === args[0]);
      const u = se && s.users.find((x) => x.id === se.user_id);
      return { first: se && u ? { user_id: se.user_id, expires_at: se.expires_at, email: u.email } : null };
    }
    if (q.startsWith("SELECT t.config, t.plan, t.created_at FROM teams t JOIN team_access a")) {
      const [slug, userId] = args;
      const har = s.access.some((a) => a.team_slug === slug && a.user_id === userId);
      const t = har && s.teams.find((x) => x.slug === slug);
      return { first: t ? { config: t.config, plan: t.plan, created_at: t.created_at } : null };
    }

    // ── skrivningar ──
    skrivna.push({ sql: q, args });

    if (q.startsWith("INSERT INTO teams (slug, config, tier, plan, plan_changed_at, stripe_customer, stripe_subscription, stripe_session, created_at)")) {
      const [slug, config, plan, plan_changed_at, stripe_customer, stripe_subscription, stripe_session, created_at] = args;
      // UNIQUE(stripe_session) — idempotensen i rutten vilar på den.
      if (s.teams.some((t) => t.stripe_session === stripe_session)) throw new Error("UNIQUE constraint failed: teams.stripe_session");
      s.teams.push({ slug, config, tier: "self-serve", plan, plan_changed_at, stripe_customer, stripe_subscription, stripe_session, created_at });
      return { run: { meta: { changes: 1 } } };
    }
    if (q.startsWith("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING")) {
      const [id, email, created_at] = args;
      if (s.users.some((u) => u.email === email)) return { run: { meta: { changes: 0 } } };
      s.users.push({ id, email, created_at });
      return { run: { meta: { changes: 1 } } };
    }
    if (q.startsWith("INSERT INTO team_access (team_slug, user_id, role, created_at) SELECT ?, id, 'owner', ? FROM users WHERE email = ?")) {
      const [slug, t, email] = args;
      const u = s.users.find((x) => x.email === email);
      if (!u || s.access.some((a) => a.team_slug === slug && a.user_id === u.id)) return { run: { meta: { changes: 0 } } };
      s.access.push({ team_slug: slug, user_id: u.id, role: "owner", created_at: t });
      return { run: { meta: { changes: 1 } } };
    }
    if (q === "DELETE FROM pending WHERE id = ?") {
      const före = s.pending.length;
      s.pending = s.pending.filter((p) => p.id !== args[0]);
      return { run: { meta: { changes: före - s.pending.length } } };
    }
    if (q === "UPDATE teams SET plan = ?1, plan_changed_at = ?2 WHERE slug = ?3") {
      const t = s.teams.find((x) => x.slug === args[2]);
      if (t) { t.plan = args[0]; t.plan_changed_at = args[1]; }
      return { run: { meta: { changes: t ? 1 : 0 } } };
    }
    if (q.startsWith("UPDATE teams SET plan = ?1, plan_changed_at = ?2, stripe_customer = COALESCE(?3, stripe_customer)")) {
      const [plan, t, cust, sub, sess, slug] = args;
      const r = s.teams.find((x) => x.slug === slug);
      if (r) Object.assign(r, { plan, plan_changed_at: t, stripe_customer: cust ?? r.stripe_customer, stripe_subscription: sub ?? r.stripe_subscription, stripe_session: sess });
      return { run: { meta: { changes: r ? 1 : 0 } } };
    }
    throw new Error("minnesDb känner inte satsen: " + q);
  }

  const db = {
    prepare: (sql) => ({
      bind: (...args) => ({
        sql, args,
        first: async () => kör(sql, args).first ?? null,
        all: async () => ({ results: kör(sql, args).all ?? [] }),
        run: async () => kör(sql, args).run ?? { meta: { changes: 0 } },
      }),
    }),
    // D1 kör en batch som en transaktion: fäller en sats rullas alla tillbaka.
    batch: async (satser) => {
      const kopia = JSON.stringify(s);
      const antal = skrivna.length;
      try {
        return satser.map((st) => kör(st.sql, st.args).run);
      } catch (e) {
        Object.assign(s, JSON.parse(kopia));
        skrivna.length = antal;
        throw e;
      }
    },
    _s: s,
    _skrivna: skrivna,
  };
  return db;
}

// ── anrop ────────────────────────────────────────────────────────────────────

async function händelse(db, type, object, { secret = SECRET, förvanska = false } = {}) {
  const body = JSON.stringify({ id: "evt_" + Math.random().toString(36).slice(2), type, data: { object } });
  const t = Math.floor(Date.now() / 1000);
  let sig = await sign(body, secret, String(t));
  if (förvanska) sig = sig.replace(/^./, (c) => (c === "0" ? "1" : "0"));
  const request = new Request("https://mittaiteam.se/api/stripe-webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${sig}` },
    body,
  });
  const res = await onRequestPost({ request, env: { DB: db, STRIPE_WEBHOOK_SECRET: SECRET } });
  return { status: res.status, body: await res.json() };
}

const plan = (db, slug) => db._s.teams.find((t) => t.slug === slug).plan;

// Ett team som redan finns, med Stripe-koppling. Slugen följer mönstret i
// teams/[slug].js ({22,64}) så att samma rader går att läsa ut där.
const SLUG_A = "A".repeat(22);
const SLUG_B = "B".repeat(22);
const team = (över = {}) => ({
  slug: SLUG_A, config: JSON.stringify({ company: "Lerverk" }), tier: "self-serve",
  plan: "standard", plan_changed_at: 1, stripe_customer: "cus_1", stripe_subscription: "sub_1",
  stripe_session: "cs_gammal", created_at: Date.now() - DAY_MS, ...över,
});

// ── 6. signaturen: ingen giltig signatur, inget skrivet ──────────────────────
//
// Först, eftersom resten av filen står på den. En förfalskad köphändelse med
// ett riktigt utkast är det dyraste som kan nå den här rutten.

test("förvanskad signatur avvisas med 400 och ingenting skrivs", tyst(async () => {
  const db = minnesDb({ pending: [{ id: "drf_1", config: "{}", plan: "trial" }] });
  const r = await händelse(db, "checkout.session.completed",
    { id: "cs_1", payment_status: "paid", metadata: { draft_id: "drf_1", plan: "trial" }, customer_details: { email: "a@b.se" } },
    { förvanska: true });
  assert.equal(r.status, 400);
  assert.equal(db._skrivna.length, 0);
  assert.equal(db._s.teams.length, 0);
  assert.equal(db._s.pending.length, 1, "utkastet ska ligga kvar");
}));

test("signatur med fel hemlighet avvisas och ingenting skrivs", tyst(async () => {
  const db = minnesDb({ teams: [team()] });
  const r = await händelse(db, "customer.subscription.deleted", { id: "sub_1", customer: "cus_1" },
    { secret: "whsec_nagon_annans" });
  assert.equal(r.status, 400);
  assert.equal(db._skrivna.length, 0);
  assert.equal(plan(db, SLUG_A), "standard");
}));

// ── 1. köpet ─────────────────────────────────────────────────────────────────

const betaldSession = (över = {}) => ({
  id: "cs_ny", payment_status: "paid", customer: "cus_ny", subscription: null,
  customer_details: { email: "  Kund@Exempel.SE " },
  metadata: { draft_id: "drf_1", plan: "trial" }, ...över,
});

test("checkout.session.completed skapar team, konto och ägaråtkomst — och tömmer utkastet", tyst(async () => {
  const db = minnesDb({ pending: [{ id: "drf_1", config: '{"company":"Lerverk"}', plan: "trial" }] });
  const r = await händelse(db, "checkout.session.completed", betaldSession());
  assert.equal(r.status, 200);
  assert.equal(db._s.teams.length, 1);

  const t = db._s.teams[0];
  assert.equal(r.body.slug, t.slug);
  assert.match(t.slug, /^[A-Za-z0-9]{22}$/);
  assert.equal(t.config, '{"company":"Lerverk"}');
  assert.equal(t.plan, "trial");
  assert.equal(t.stripe_session, "cs_ny");
  assert.equal(t.stripe_customer, "cus_ny");

  // Adressen normaliseras — annars blir "Kund@" och "kund@" två konton.
  assert.equal(db._s.users.length, 1);
  assert.equal(db._s.users[0].email, "kund@exempel.se");
  assert.deepEqual(db._s.access.map((a) => [a.team_slug, a.user_id, a.role]),
    [[t.slug, db._s.users[0].id, "owner"]]);
  assert.equal(db._s.pending.length, 0);
}));

test("samma session två gånger ger ett team, inte två", tyst(async () => {
  const db = minnesDb({ pending: [{ id: "drf_1", config: "{}", plan: "trial" }] });
  const första = await händelse(db, "checkout.session.completed", betaldSession());
  const antal = db._skrivna.length;
  const andra = await händelse(db, "checkout.session.completed", betaldSession());

  assert.equal(andra.status, 200);
  assert.equal(andra.body.slug, första.body.slug, "reprisen ska peka på samma team");
  assert.equal(db._s.teams.length, 1);
  assert.equal(db._s.access.length, 1);
  assert.equal(db._skrivna.length, antal, "reprisen ska inte skriva något");
}));

test("ett befintligt konto får åtkomst till det nya teamet, inget andra konto", tyst(async () => {
  const db = minnesDb({
    users: [{ id: "usr_gammal", email: "kund@exempel.se", created_at: 1 }],
    pending: [{ id: "drf_1", config: "{}", plan: "trial" }],
  });
  await händelse(db, "checkout.session.completed", betaldSession());
  assert.equal(db._s.users.length, 1);
  assert.equal(db._s.access[0].user_id, "usr_gammal");
}));

test("obetald session skapar inget team", tyst(async () => {
  const db = minnesDb({ pending: [{ id: "drf_1", config: "{}", plan: "trial" }] });
  const r = await händelse(db, "checkout.session.completed", betaldSession({ payment_status: "unpaid" }));
  assert.equal(r.status, 200);
  assert.equal(db._skrivna.length, 0);
  assert.equal(db._s.pending.length, 1);
}));

test("betald session utan utkast kvitteras med 200 och skriver inget", tyst(async () => {
  // Fel vore att svara 500: Stripe försöker då i timmar mot något som inte
  // löser sig av sig självt.
  const db = minnesDb();
  const r = await händelse(db, "checkout.session.completed", betaldSession());
  assert.equal(r.status, 200);
  assert.equal(r.body.note, "utkastet saknas");
  assert.equal(db._skrivna.length, 0);
}));

test("betald session utan mejladress sparar teamet men skapar inget konto", tyst(async () => {
  const db = minnesDb({ pending: [{ id: "drf_1", config: "{}", plan: "trial" }] });
  await händelse(db, "checkout.session.completed", betaldSession({ customer_details: null, customer_email: null }));
  assert.equal(db._s.teams.length, 1);
  assert.equal(db._s.users.length, 0);
  assert.equal(db._s.access.length, 0);
}));

test("uppgradering byter plan på SAMMA team och är också idempotent", tyst(async () => {
  const db = minnesDb({ teams: [team({ plan: "expired", stripe_subscription: null })] });
  const session = {
    id: "cs_upp", payment_status: "paid", customer: "cus_1", subscription: "sub_ny",
    metadata: { upgrade_slug: SLUG_A, plan: "standard" },
  };
  const r = await händelse(db, "checkout.session.completed", session);
  assert.equal(r.status, 200);
  assert.equal(r.body.upgraded, true);
  assert.equal(db._s.teams.length, 1);
  assert.equal(plan(db, SLUG_A), "standard");
  assert.equal(db._s.teams[0].stripe_subscription, "sub_ny");
  assert.equal(db._s.teams[0].stripe_session, "cs_upp");

  const antal = db._skrivna.length;
  const igen = await händelse(db, "checkout.session.completed", session);
  assert.equal(igen.body.slug, SLUG_A);
  assert.equal(db._skrivna.length, antal);
}));

// ── 2. abonnemanget slut ─────────────────────────────────────────────────────

test("customer.subscription.deleted skriver cancelled på abonnemangets team", tyst(async () => {
  const db = minnesDb({ teams: [team()] });
  const r = await händelse(db, "customer.subscription.deleted", { id: "sub_1", customer: "cus_1" });
  assert.equal(r.status, 200);
  assert.equal(r.body.updated, 1);
  assert.equal(plan(db, SLUG_A), "cancelled");
  assert.ok(db._s.teams[0].plan_changed_at > 1, "plan_changed_at ska följa med");
}));

test("uppslaget på abonnemanget stänger inte kundens ANDRA team", tyst(async () => {
  // En kund kan ha flera team. Att stänga av alla för att ett abonnemang tog
  // slut vore att låsa ute någon som betalar.
  const db = minnesDb({ teams: [team(), team({ slug: SLUG_B, stripe_subscription: "sub_2", stripe_session: "cs_b" })] });
  await händelse(db, "customer.subscription.deleted", { id: "sub_1", customer: "cus_1" });
  assert.equal(plan(db, SLUG_A), "cancelled");
  assert.equal(plan(db, SLUG_B), "standard");
}));

// ── 3. fakturan som aldrig betalades ─────────────────────────────────────────

test("invoice.payment_failed när Stripe gett upp skriver past_due", tyst(async () => {
  const db = minnesDb({ teams: [team()] });
  const r = await händelse(db, "invoice.payment_failed",
    { id: "in_1", customer: "cus_1", subscription: "sub_1", next_payment_attempt: null });
  assert.equal(r.status, 200);
  assert.equal(plan(db, SLUG_A), "past_due");
}));

test("invoice.payment_failed med fler försök kvar skriver ingenting", tyst(async () => {
  const db = minnesDb({ teams: [team()] });
  const r = await händelse(db, "invoice.payment_failed",
    { id: "in_1", customer: "cus_1", subscription: "sub_1", next_payment_attempt: Math.floor(Date.now() / 1000) + 3 * 86400 });
  assert.equal(r.status, 200);
  assert.equal(db._skrivna.length, 0);
  assert.equal(plan(db, SLUG_A), "standard");
}));

test("invoice.payment_failed läser abonnemanget i 2025-formen (parent.subscription_details)", tyst(async () => {
  const db = minnesDb({ teams: [team(), team({ slug: SLUG_B, stripe_subscription: "sub_2", stripe_session: "cs_b" })] });
  await händelse(db, "invoice.payment_failed", {
    id: "in_1", customer: "cus_1", next_payment_attempt: null,
    parent: { subscription_details: { subscription: "sub_2" } },
  });
  assert.equal(plan(db, SLUG_B), "past_due");
  assert.equal(plan(db, SLUG_A), "standard", "fel abonnemang får inte träffas via kunden");
}));

// ── 4. betalningen kom in ────────────────────────────────────────────────────

for (const spärrad of ["past_due", "cancelled"]) {
  test(`invoice.paid öppnar en spärrad rad (${spärrad} → standard)`, tyst(async () => {
    const db = minnesDb({ teams: [team({ plan: spärrad })] });
    const r = await händelse(db, "invoice.paid", { id: "in_1", customer: "cus_1", subscription: "sub_1" });
    assert.equal(r.body.reopened, 1);
    assert.equal(plan(db, SLUG_A), "standard");
  }));
}

test("invoice.payment_succeeded går samma väg som invoice.paid", tyst(async () => {
  const db = minnesDb({ teams: [team({ plan: "past_due" })] });
  await händelse(db, "invoice.payment_succeeded", { id: "in_1", customer: "cus_1", subscription: "sub_1" });
  assert.equal(plan(db, SLUG_A), "standard");
}));

test("invoice.paid rör inte en frisk rad — ingen skrivning vid vanlig förnyelse", tyst(async () => {
  const db = minnesDb({ teams: [team({ plan_changed_at: 42 })] });
  const r = await händelse(db, "invoice.paid", { id: "in_1", customer: "cus_1", subscription: "sub_1" });
  assert.equal(r.body.reopened, 0);
  assert.equal(db._skrivna.length, 0);
  assert.equal(db._s.teams[0].plan_changed_at, 42);
}));

// FYND (DR8, 2026-09-26) — inte lagat, bara visat. handleInvoicePaid öppnar
// allt i PLANS_WITHOUT_PORTAL, alltså även `refunded`. Ångerknappen
// (subscription/withdraw.js) skriver `refunded` och avslutar abonnemanget; en
// faktura för samma abonnemang som Stripe skickar OM efteråt (Stripe lovar
// varken ordning eller en enda leverans) öppnar då ett ångrat köp som
// `standard`, gratis. Kommentaren ovanför funktionen säger att "en plan som
// stängts av en människa för hand ska inte öppnas av en gammal faktura" —
// koden jämför aldrig fakturans tid mot plan_changed_at.
// LAGAT samma dag: bara past_due och cancelled öppnas, och en faktura betald
// före planens senaste ändring öppnar ingenting.
for (const stängd of ["refunded", "expired"]) {
  test(`invoice.paid öppnar INTE ${stängd} — ett ångrat köp förblir ångrat`, tyst(async () => {
    const db = minnesDb({ teams: [team({ plan: stängd })] });
    const r = await händelse(db, "invoice.paid", { id: "in_gammal", customer: "cus_1", subscription: "sub_1" });
    assert.equal(r.body.reopened, 0);
    assert.equal(plan(db, SLUG_A), stängd);
  }));
}
test("invoice.paid betald FÖRE spärren öppnar ingenting — den hör till tiden innan", tyst(async () => {
  const spärrad = Date.now();
  const db = minnesDb({ teams: [team({ plan: "cancelled", plan_changed_at: spärrad })] });
  const r = await händelse(db, "invoice.paid", {
    id: "in_gammal", customer: "cus_1", subscription: "sub_1",
    status_transitions: { paid_at: Math.floor((spärrad - 86400000) / 1000) },
  });
  assert.equal(r.body.reopened, 0);
  assert.equal(plan(db, SLUG_A), "cancelled");
}));

// ── 5. återbetalningen ───────────────────────────────────────────────────────

test("charge.refunded (full) skriver refunded på en engångsplan", tyst(async () => {
  const db = minnesDb({ teams: [team({ plan: "trial", stripe_subscription: null })] });
  const r = await händelse(db, "charge.refunded", { id: "ch_1", customer: "cus_1", refunded: true });
  assert.equal(r.body.updated, 1);
  assert.equal(plan(db, SLUG_A), "refunded");
}));

test("charge.refunded rör inte ett abonnemang hos samma kund", tyst(async () => {
  // En återbetald provmånad får inte stänga av samma kunds löpande team.
  const db = minnesDb({
    teams: [
      team({ plan: "trial", stripe_subscription: null }),
      team({ slug: SLUG_B, plan: "standard", stripe_subscription: "sub_2", stripe_session: "cs_b" }),
    ],
  });
  await händelse(db, "charge.refunded", { id: "ch_1", customer: "cus_1", refunded: true });
  assert.equal(plan(db, SLUG_A), "refunded");
  assert.equal(plan(db, SLUG_B), "standard");
}));

test("charge.refunded som delåterbetalning skriver ingenting", tyst(async () => {
  const db = minnesDb({ teams: [team({ plan: "trial", stripe_subscription: null })] });
  const r = await händelse(db, "charge.refunded", { id: "ch_1", customer: "cus_1", refunded: false, amount_refunded: 1000 });
  assert.equal(r.body.note, "delåterbetalning");
  assert.equal(db._skrivna.length, 0);
}));

test("charge.refunded utan kund skriver ingenting", tyst(async () => {
  const db = minnesDb({ teams: [team({ plan: "trial", stripe_subscription: null })] });
  await händelse(db, "charge.refunded", { id: "ch_1", customer: null, refunded: true });
  assert.equal(db._skrivna.length, 0);
}));

test("okänd händelsetyp kvitteras med 200 och skriver ingenting", tyst(async () => {
  const db = minnesDb({ teams: [team()] });
  const r = await händelse(db, "customer.created", { id: "cus_1" });
  assert.equal(r.status, 200);
  assert.equal(db._skrivna.length, 0);
}));

// ── GET /api/teams/:slug — dörren som planen styr ────────────────────────────

const TOKEN = "sessionstoken-for-webhooktest";
const USER = { id: "usr_1", email: "kund@exempel.se", created_at: 1 };

async function dörr({ teams = [team()], access = true, inloggad = true, slug = SLUG_A } = {}) {
  const db = minnesDb({
    teams,
    users: [USER],
    access: access ? [{ team_slug: SLUG_A, user_id: USER.id, role: "owner", created_at: 1 }] : [],
    sessions: [{ token_hash: await sha256Hex(TOKEN), user_id: USER.id, expires_at: Date.now() + DAY_MS }],
  });
  const headers = inloggad ? { cookie: "atb_session=" + TOKEN } : {};
  const väntan = [];
  const res = await onRequestGet({
    params: { slug },
    env: { DB: db },
    request: new Request("https://mittaiteam.se/api/teams/" + slug, { headers }),
    waitUntil: (p) => väntan.push(p),
  });
  await Promise.all(väntan);
  return { res, db };
}

test("teams/:slug utan inloggning ger 401 och läser inget team", async () => {
  const { res } = await dörr({ inloggad: false });
  assert.equal(res.status, 401);
});

test("teams/:slug inloggad utan team_access ger samma 404 som ett team som inte finns", async () => {
  const utan = await dörr({ access: false });
  const finnsInte = await dörr({ slug: "Z".repeat(22) });
  assert.equal(utan.res.status, 404);
  assert.equal(finnsInte.res.status, 404);
  assert.deepEqual(await utan.res.json(), await finnsInte.res.json(),
    "skillnad i svaret vore ett sätt att prova sig fram till vilka slugs som finns");
});

test("teams/:slug med åtkomst och frisk plan levererar konfigen", async () => {
  const { res } = await dörr();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { company: "Lerverk" });
  assert.equal(res.headers.get("cache-control"), "no-store");
});

for (const spärrad of ["cancelled", "past_due", "refunded", "expired"]) {
  test(`teams/:slug med plan ${spärrad} ger 402 plan_ended och ingen konfig`, async () => {
    const { res, db } = await dörr({ teams: [team({ plan: spärrad })] });
    assert.equal(res.status, 402);
    const j = await res.json();
    assert.equal(j.code, "plan_ended");
    assert.equal(j.plan, spärrad);
    assert.equal(j.company, "Lerverk");
    assert.equal(j.canResume, true);
    assert.equal(j.agents, undefined);
    assert.equal(db._skrivna.length, 0, "en redan spärrad rad skrivs inte om");
  });
}

test("teams/:slug med provmånad äldre än TRIAL_DAYS spärras och skriver expired", async () => {
  const { res, db } = await dörr({
    teams: [team({ plan: "trial", stripe_subscription: null, created_at: Date.now() - (TRIAL_DAYS + 1) * DAY_MS })],
  });
  assert.equal(res.status, 402);
  assert.equal((await res.json()).plan, "expired");
  assert.equal(plan(db, SLUG_A), "expired");
});

test("teams/:slug med provmånad inom TRIAL_DAYS levererar konfigen", async () => {
  const { res, db } = await dörr({
    teams: [team({ plan: "trial", stripe_subscription: null, created_at: Date.now() - (TRIAL_DAYS - 1) * DAY_MS })],
  });
  assert.equal(res.status, 200);
  assert.equal(db._skrivna.length, 0);
});

// ── hela kedjan: köp → användning → uppsägning → återöppning ─────────────────

test("kedjan: köpt standard öppnar dörren, deleted stänger den, invoice.paid öppnar igen", tyst(async () => {
  const db = minnesDb({ pending: [{ id: "drf_1", config: '{"company":"Kedjan AB"}', plan: "standard" }] });
  const köp = await händelse(db, "checkout.session.completed", betaldSession({
    subscription: "sub_k", customer: "cus_k", customer_details: { email: USER.email },
    metadata: { draft_id: "drf_1", plan: "standard" },
  }));
  const slug = köp.body.slug;
  db._s.sessions.push({ token_hash: await sha256Hex(TOKEN), user_id: db._s.users[0].id, expires_at: Date.now() + DAY_MS });

  const öppna = async () => (await onRequestGet({
    params: { slug }, env: { DB: db }, waitUntil: () => {},
    request: new Request("https://mittaiteam.se/api/teams/" + slug, { headers: { cookie: "atb_session=" + TOKEN } }),
  })).status;

  assert.equal(await öppna(), 200);
  await händelse(db, "customer.subscription.deleted", { id: "sub_k", customer: "cus_k" });
  assert.equal(await öppna(), 402);
  await händelse(db, "invoice.paid", { id: "in_k", customer: "cus_k", subscription: "sub_k" });
  assert.equal(await öppna(), 200);
}));
