// POST /api/digest/run — skickar veckans veckostart som mejl.
//
// Varför den finns: portalens retentionsmodell förutsätter att kunden kommer
// ihåg att logga in. Vecka tre gör hon inte det. Ett brev på måndag morgon
// dyker upp oavsett — och enligt halvårssimuleringen bevisas värdet hos
// utföraren medan beslutet fattas av köparen, så ett mejl syns för båda.
//
// ANROPAS AV EN CRON-WORKER, inte av en webbläsare. Pages Functions kan inte
// schemaläggas; därför ligger klockan i `worker-veckobrev/` och all logik här,
// där D1 och mejlsändaren redan bor. Workern är avsiktligt dum: den fetchar den
// här rutten och loggar utfallet.
//
// Fyra saker som rutten inte får göra, och som styr koden nedan:
//
//   1. Skicka två brev för samma dygn. En cron kan fyra om, och ett halvt fel
//      kan ge ett omförsök. Därför `last_sent_day` — samma idempotensgrepp som
//      `stripe_session` ger i teams.
//   2. Mejla någon vars plan tagit slut. Det brevet ska handla om något annat,
//      och ett veckobrev till en spärrad kund är att sälja på fel sätt.
//   3. Kosta pengar utan att räknas. Varje brev är ett modellanrop; det bokförs
//      i ai_budget och ai_usage som allt annat, och har ett eget tak.
//   4. Skickas utan väg ut. Varje brev bär en avregistreringslänk som fungerar
//      utan inloggning.

import { json, sendWeeklyDigest } from "../auth/_lib.js";
import { planState } from "../_plan.js";

const MODEL_ID = "openai/gpt-oss-120b";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Tak per körning. Skyddar mot att en enda körning drar iväg om något går fel i
// urvalet — och gör kostnaden per körning förutsägbar. Nås taket loggas det, och
// resten får sitt brev nästa gång rutten körs (workern kör varje timme).
const MAX_PER_RUN = 40;
// Veckobrevets egen andel av dygnet. Samma resonemang som byggets tak (K3): en
// post som delar hink med portalen kan svälta betalande kunders chatt.
const MAX_DIGEST_CALLS_PER_DAY = 200;
// Globalt dygnstak, samma tal som /api/ai. Når vi det står tjänsten stilla för
// alla, och då ska inga brev gå ut heller.
const MAX_CALLS_PER_DAY = 4000;

const MAX_TOKENS = 700; // ett brev, inte en rapport

// Tidigaste timme (UTC) ett brev får gå ut. Workern kör varje timme för att en
// misslyckad körning ska tas igen nästa timme i stället för nästa vecka — men
// utan det här golvet hade första körningen efter midnatt UTC skickat brevet
// klockan ett på natten svensk tid. 6 UTC är 07:00 vintertid och 08:00
// sommartid: morgon året om, vilket är nog så exakt för ett veckobrev.
const TIDIGAST_TIMME_UTC = 6;

const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const utcMonth = (ms) => new Date(ms).toISOString().slice(0, 7);
// ISO-veckodag: 1 = måndag … 7 = söndag. getUTCDay() ger 0 för söndag.
const isoWeekday = (ms) => new Date(ms).getUTCDay() || 7;

// Jämförelse som inte läcker hur många tecken som stämde. Hemligheten är kort
// och anropen få, men en tidsjämförelse här kostar ingenting att göra rätt.
function sameSecret(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length || !x) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

// Prompten. Brevet ska vara kort och peka på veckan — inte en rapport, och
// framför allt inte en påhittad lägesbeskrivning. Modellen vet ingenting om vad
// kunden gjort sedan sist, och får därför uttryckligen inte låtsas att den gör.
function digestPrompt(cfg) {
  const namn = String(cfg.company || "verksamheten");
  const entry = (cfg.agents || []).find((a) => a.id === cfg.entryAgent) || (cfg.agents || [])[0] || {};
  const agenter = (cfg.agents || [])
    .map((a) => `- ${a.name}: ${a.job || a.role || a.tagline || ""}`.trim())
    .join("\n");
  const rutiner = (cfg.routines || [])
    .map((r) => `- ${r.label}${r.day ? ` (${r.day})` : ""}`)
    .join("\n");

  const system = [
    entry.system || `Du är ${entry.name || "VD-assistent"} i AI-teamet hos ${namn}.`,
    "",
    "DU SKRIVER NU ETT VECKOBREV som skickas som e-post till kunden på måndag morgon.",
    "",
    "Format: ren text, inga rubriker med #, ingen markdown-fetstil. Max 200 ord.",
    "Börja direkt med hälsningen — ingen ämnesrad, den sätts av systemet.",
    "",
    "Innehåll:",
    "1. En kort hälsning.",
    "2. Tre saker som är värda att lägga veckan på, var och en med en rad om varför och vilken agent i teamet som hjälper till.",
    "3. En avslutande rad: den enskilt viktigaste saken att börja med.",
    "",
    "VIKTIGAST AV ALLT: du vet INTE vad kunden gjort sedan sist. Du har ingen",
    "tillgång till hennes kalender, inkorg eller anteckningar. Påstå aldrig att",
    "något är klart, påbörjat eller försenat, och nämn inga namn, belopp eller",
    "datum som inte står i underlaget nedan. Utgå från teamets uppdrag och",
    "verksamhetens rytm — inte från en påhittad lägesbild. Skriv förslag, inte",
    "rapport.",
  ].join("\n");

  const user = [
    `VERKSAMHET: ${namn}`,
    "",
    "TEAMET:",
    agenter || "(inga agenter i konfigurationen)",
    rutiner ? "\nSTÅENDE RUTINER:\n" + rutiner : "",
    cfg.seasons && cfg.seasons.length
      ? "\nÅRSRYTM:\n" + cfg.seasons.map((s) => `- ${s.label || s.name || ""}: ${s.note || s.what || ""}`).join("\n")
      : "",
    "",
    "Skriv veckobrevet.",
  ].filter(Boolean).join("\n");

  return { system, user };
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const nu = Date.now();

  // ── vem får ringa ────────────────────────────────────────────────────────
  const auth = request.headers.get("authorization") || "";
  const given = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!env.DIGEST_SECRET) {
    console.error("[veckobrev] DIGEST_SECRET saknas — rutten är avstängd");
    return json({ error: "not configured" }, 503);
  }
  if (!sameSecret(given, env.DIGEST_SECRET)) {
    // Inget om VARFÖR: en rutt som skiljer "fel nyckel" från "ingen nyckel"
    // hjälper den som gissar.
    return json({ error: "unauthorized" }, 401);
  }
  if (!env.OPENROUTER_KEY) return json({ error: "no model key" }, 503);

  const db = env.DB;
  const dag = utcDay(nu);
  const veckodag = isoWeekday(nu);

  // För tidigt på dygnet: svara ok och gör inget. Workern knackar varje timme
  // och den första knacken efter midnatt ska inte väcka någon.
  const timme = new Date(nu).getUTCHours();
  if (timme < TIDIGAST_TIMME_UTC) {
    return json({ ok: true, dag, veckodag, skickade: 0, hoppade: 0, fel: 0, orsak: "för tidigt på dygnet" });
  }

  // ── vilka ska ha brev i dag ──────────────────────────────────────────────
  let rader = [];
  try {
    const r = await db.prepare(
      "SELECT d.user_id, d.team_slug, d.token, u.email, t.config, t.plan, t.created_at " +
      "FROM weekly_digest d " +
      "JOIN users u ON u.id = d.user_id " +
      "JOIN teams t ON t.slug = d.team_slug " +
      "WHERE d.active = 1 AND d.weekday = ? AND (d.last_sent_day IS NULL OR d.last_sent_day != ?) " +
      "LIMIT ?"
    ).bind(veckodag, dag, MAX_PER_RUN + 1).all();
    rader = (r && r.results) || [];
  } catch (e) {
    console.error("[veckobrev] kunde inte läsa mottagare", String(e));
    return json({ error: "db" }, 500);
  }

  const fler = rader.length > MAX_PER_RUN;
  if (fler) rader = rader.slice(0, MAX_PER_RUN);
  if (!rader.length) return json({ ok: true, dag, veckodag, skickade: 0, hoppade: 0, fel: 0 });

  // ── dygnstaken ───────────────────────────────────────────────────────────
  const tal = async (sql, ...args) => {
    const r = await db.prepare(sql).bind(...args).first().catch(() => null);
    return (r && Number(r.calls)) || 0;
  };
  const globalt = await tal("SELECT calls FROM ai_budget WHERE day = ?", dag);
  if (globalt >= MAX_CALLS_PER_DAY) {
    console.warn("[veckobrev] globala dygnstaket nått — inga brev i dag");
    return json({ ok: false, code: "service_busy", skickade: 0 });
  }
  let brevIDag = await tal("SELECT calls FROM ai_usage WHERE subject = ? AND period = ?", "digest:global", dag);

  let skickade = 0, hoppade = 0, fel = 0;

  for (const rad of rader) {
    // Planen: ett veckobrev till en kund vars provmånad tagit slut är att sälja
    // på fel sätt. Den kunden ska få ett annat brev, av en annan rutt.
    const plan = planState({ plan: rad.plan, created_at: rad.created_at }, nu);
    if (!plan.ok) { hoppade++; continue; }

    if (brevIDag >= MAX_DIGEST_CALLS_PER_DAY) {
      console.warn("[veckobrev] veckobrevets dygnstak nått vid", brevIDag);
      hoppade++;
      continue;
    }

    let cfg;
    try { cfg = JSON.parse(rad.config); } catch (_) { hoppade++; continue; }

    try {
      const { system, user } = digestPrompt(cfg);
      const svar = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          authorization: "Bearer " + env.OPENROUTER_KEY,
          "content-type": "application/json",
          "http-referer": "https://mittaiteam.se",
          "x-title": "Mitt AI-team",
        },
        body: JSON.stringify({
          model: MODEL_ID,
          max_tokens: MAX_TOKENS,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }),
      });

      if (!svar.ok) {
        const detalj = await svar.text().catch(() => "");
        console.error("[veckobrev] uppströmsfel", svar.status, detalj.slice(0, 300));
        await bokförFel(db, dag, nu, svar.status === 402 ? "service_down" : "upstream");
        fel++;
        continue;
      }

      const data = await svar.json();
      const text = ((data.choices && data.choices[0] && data.choices[0].message) || {}).content || "";
      if (!text.trim()) { fel++; continue; }

      const usage = data.usage || {};
      // Bokför FÖRE utskicket: samma hållning som K2 i /api/ai — anropet är
      // gjort och betalt oavsett om mejlet går fram.
      await bokför(db, { dag, månad: utcMonth(nu), slug: rad.team_slug, usage });
      brevIDag++;

      const unsubUrl = `https://mittaiteam.se/avregistrera?t=${encodeURIComponent(rad.token)}`;
      await sendWeeklyDigest(env, rad.email, { company: cfg.company, body: text, unsubUrl });

      // Först nu räknas dygnet som avklarat. Går utskicket fel försöker nästa
      // körning igen — hellre ett brev sent än inget.
      await db.prepare("UPDATE weekly_digest SET last_sent_day = ? WHERE user_id = ? AND team_slug = ?")
        .bind(dag, rad.user_id, rad.team_slug).run();
      skickade++;
    } catch (e) {
      console.error("[veckobrev] misslyckades för ett team", String(e).slice(0, 300));
      await bokförFel(db, dag, nu, "digest");
      fel++;
    }
  }

  console.log(`[veckobrev] ${dag} veckodag ${veckodag}: ${skickade} skickade, ${hoppade} hoppade, ${fel} fel${fler ? " (fler väntar)" : ""}`);
  return json({ ok: true, dag, veckodag, skickade, hoppade, fel, fler });
}

async function bokför(db, { dag, månad, slug, usage }) {
  const inTok = Number(usage.prompt_tokens) || 0;
  const outTok = Number(usage.completion_tokens) || 0;
  const upsert = (tabell, nycklar) => db.prepare(
    `INSERT INTO ${tabell} (${nycklar}, calls, input_tok, output_tok) VALUES (${nycklar.split(", ").map(() => "?").join(", ")}, 1, ?, ?) ` +
    `ON CONFLICT(${nycklar}) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok`
  );
  await db.batch([
    upsert("ai_budget", "day").bind(dag, inTok, outTok),
    // Teamets månadsrad: brevet räknas mot samma fair use som chatten, för det
    // är samma modell på samma nyckel.
    upsert("ai_usage", "subject, period").bind("team:" + slug, månad, inTok, outTok),
    // Veckobrevets egen dygnsrad — den som MAX_DIGEST_CALLS_PER_DAY läser.
    upsert("ai_usage", "subject, period").bind("digest:global", dag, inTok, outTok),
  ]).catch((e) => console.error("[veckobrev] kunde inte bokföra", String(e)));
}

async function bokförFel(db, dag, nu, kod) {
  await db.prepare(
    "INSERT INTO ai_errors (day, code, count, last_at) VALUES (?, ?, 1, ?) " +
    "ON CONFLICT(day, code) DO UPDATE SET count = count + 1, last_at = excluded.last_at"
  ).bind(dag, kod, nu).run().catch((e) => console.error("[veckobrev] kunde inte bokföra fel", String(e)));
}
