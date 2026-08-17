// POST /api/ai — vår proxy mot OpenRouter, på vår nyckel.
//
// Varför den finns: fram till 2026-08-06 hade varje kund en egen API-nyckel.
// Det var tekniskt elegant — inget passerade oss — och kommersiellt förödande.
// Rollspelet med en icke-teknisk kund visade var det tog stopp: hon hade betalat
// 90 kr, loggat in, och möttes av kravet att skaffa konto hos ett amerikanskt
// utvecklarverktyg och lägga in ett betalkort där. Den tröskeln kostade oss
// varje kund som inte redan var utvecklare.
//
// Nu står vi för förbrukningen. Två öre per svar mot 90–290 kr i intäkt är ett
// avrundningsfel; tröskeln var det inte. Priset för bytet är att vi blir
// personuppgiftsbiträde och att en öppen rutt på vår nyckel måste bevakas —
// därav taken nedan.
//
// Rutten har TVÅ trafikslag, och skillnaden mellan dem är hela affären:
//
//   BYGGET   — gratis och obegränsat, det är säljargumentet. Anonymt.
//   PORTALEN — det som säljs. Kräver inloggning OCH ett team som kunden har
//              åtkomst till i databasen. Inga gratissvar (beslut 2026-08-06).
//
// Skillnaden får ALDRIG avgöras av en flagga som klienten sätter — då är
// betalväggen en rad JavaScript att ta bort. Den avgörs av `team_access` och
// `teams` i D1: portalen skickar teamets slug, och åtkomsten slås upp här.
// En klient som utelämnar slugen blir inte gratis-portal, den blir ett bygge:
// anonymt, utan historik på vår sida, och med byggets hårdare IP-tak.
//
// Strömmen skickas vidare i stort sett ORÖRD till klienten. atb-claude.js
// parsar redan OpenRouters SSE-format, och en proxy som skriver om formatet
// blir ett andra ställe där svarshanteringen kan gå sönder. Enda undantaget är
// felramar — se `SVENSKA FEL` längre ner.

import { json, nowMs, allowAttempt, clientIp, sessionUser } from "./auth/_lib.js";
import { planState, planUpdateSql, PLAN_REASON } from "./_plan.js";

// ── tak ───────────────────────────────────────────────────────────────────
//
// Fyra lager, för de skyddar mot olika saker:
//
//   per IP     — en enskild besökare som klickar för mycket, eller ett enkelt
//                skript. Ett bygge är fyra anrop, så 24 räcker för sex byggen
//                per kvart. Ingen verklig människa bygger så.
//   per IP/dygn— gör den fria bygg-rutten oanvändbar som gratis chatt. Utan
//                den kan den som tar bort slugen ur portalens anrop använda
//                oss som chatbot i all oändlighet, 24 svar i taget. 200 svar
//                är drygt trettio byggen på ett dygn: ingen som bygger team
//                märker taket, den som chattar gör det på en förmiddag.
//   per team   — fair use, det som villkoren hänvisar till. Räknas på TEAMET
//                och inte på personen, för det är teamet som säljs; fem
//                kollegor på samma abonnemang delar på samma hink.
//   per dygn   — hela tjänstens kostnadstak. Det enda som håller om någon
//                roterar IP-adresser. Slår det till är tjänsten nere för alla,
//                vilket är illa — men mindre illa än en oväntad räkning som
//                inte går att ta tillbaka.
const MAX_CALLS_PER_IP = 24;             // bygget: per kvart
const MAX_CALLS_PER_IP_PAID = 90;        // portalen: per kvart — sex kollegor i samma kontor
const MAX_BUILD_CALLS_PER_IP_DAY = 200;  // bygget: per dygn
const MAX_CALLS_PER_TEAM = 1000;         // per månad — samma tal som villkorens fair use
const MAX_CALLS_PER_DAY = 4000;          // globalt; ~ett par hundra kronor i värsta fall
// Byggets andel av det globala dygnstaket. Utan den delade gratis, anonym
// byggtrafik hink med betalande kunder — och eftersom bygget är obegränsat och
// utan konto är det den trafik som kan explodera. En dag med ovanligt många
// byggen (eller ett skript som roterar IP-adresser förbi de andra taken) hade
// då stängt portalen för dem som betalat, resten av dygnet. Fel kund att svika:
// den som bygger gratis kan komma tillbaka i morgon, den som betalar 290 kr i
// månaden för att teamet ska finnas där kan inte det.
//
// Skillnaden mot MAX_BUILD_CALLS_PER_IP_DAY: det taket är per uppkoppling och
// stoppar EN missbrukare. Det här är globalt och stoppar alla byggen
// tillsammans, oavsett varifrån de kommer.
//
// 2500 av 4000 lämnar alltid minst 1500 svar åt portalen. Uppmätt bygge = fyra
// anrop, alltså drygt 600 byggen per dygn innan den fria rutten stryps — långt
// över allt vi sett, och taket säger ifrån i loggen (`build_busy`) om det ändå
// nås, så siffran går att höja med data i handen i stället för på känsla.
const MAX_BUILD_CALLS_PER_DAY = 2500;

// Klientens maxTokens tas emot men klampas: en klient är inte att lita på, och
// det är vi som betalar för svaret.
//
// 16384 och inte 4096, vilket var första gissningen. Buildern begär 16000 för
// sammanställningssteget, som ska skriva ut hela teamet som JSON — fem agenter
// med systemprompter blir långt. Med taket på 4096 kapades svaret mitt i, och
// kapad JSON är ogiltig JSON: hela bygget föll på "Modellen returnerade ogiltig
// JSON", vilket pekade på modellen i stället för på taket. Det tog ett helt
// bygge i webbläsaren att hitta, för felet syns inte i något API-svar.
//
// Kostnaden i värsta fall är 16384 × $0,28/M ≈ 5 öre. Ett misslyckat bygge
// kostar en kund.
const MAX_OUTPUT_TOKENS = 16384;
// Ett normalt anrop med systemprompt, underlag och historik ligger långt under.
// Taket finns för att en manipulerad klient inte ska kunna skicka en roman.
const MAX_INPUT_CHARS = 200000;
// Taket på ANTALET meddelanden. Utan det mäts en miljon meddelanden med tom
// content som noll tecken, passerar teckentaket och går vidare uppströms som
// ett tiotal megabyte. Portalens längsta historik ligger runt 40 turer.
const MAX_MESSAGES = 200;

const MODEL_ID = "openai/gpt-oss-120b";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── leverantörsval ────────────────────────────────────────────────────────
//
// OpenRouter dirigerar mellan flera leverantörer av samma modell. `sort:
// "throughput"` väljer den snabbaste — bra för prosa, men det var precis det
// som gjorde bygget opålitligt: den snabbaste för tillfället var ofta Groq,
// och Groq klarar inte strukturerad utdata mot vårt schema. Kunden möttes av
// `Upstream error from Groq: Generated JSON does not match the expected
// schema` — engelsk utvecklartext, med leverantörsnamn, mitt i en svensk
// säljtratt.
//
// Uppmätt 2026-08-06: Cerebras gav 4/4 giltig JSON. Groq fallerade på schemat.
//
// Därför två olika inställningar:
//
//   JSON-läge  — `order` sätter Cerebras först, sedan tre andra leverantörer
//                som deklarerar stöd för response_format. `ignore` stänger
//                ute Groq helt: den DEKLARERAR stöd (så `require_parameters`
//                filtrerar inte bort den) men levererar inte. `sort` sätts
//                INTE — ordningen ÄR preferensen, och det var hastigheten som
//                ledde oss fel. `allow_fallbacks` lämnas på, så att en enskild
//                leverantörs nedtid inte fäller tjänsten: efter listan får
//                vilken leverantör som helst som klarar parametrarna ta över,
//                utom den vi uttryckligen ignorerar.
//   Prosaläge  — oförändrat `sort: "throughput"`. Groq är snabb och helt
//                korrekt på vanlig text; det är bara scheman den missar.
//
// Slugarna är basnamn utan kvantiseringsvariant ("cerebras", inte
// "cerebras/fp16") — så följer vi med när en leverantör byter variant.
const JSON_PROVIDER_ORDER = ["cerebras", "baseten", "deepinfra", "together"];
const JSON_PROVIDER_IGNORE = ["groq"];

// ── tidsgränser ───────────────────────────────────────────────────────────
//
// Ett anrop får aldrig hänga. En skarp genomgång 2026-08-06 gav två lyckade
// körningar (42 s och 297 s), ett hårt fel och tre hängningar — 300 s, 340 s
// och en som stod stilla i över femton minuter. En sida som står stilla är
// värre än ett fel: kunden vet inte om hon ska vänta eller ladda om, och
// ingenting i gränssnittet vågar säga något.
//
// Måtten är valda mot en BRA körning, inte mot en dålig: hela pipelinen tog
// 42 s, och sammanställningssteget — det längsta — tog 28 s.
//
//   CONNECT  30 s  tid till svarshuvudena. Ett normalt anrop svarar på under
//                  en sekund; 30 s betyder att leverantörens kö har fastnat.
//   STALL    30 s  längsta tystnad MITT i en ström. Det är det precisa
//                  instrumentet: en frisk ström skriver hela tiden, en hängd
//                  skriver ingenting alls. En frisk körning kommer aldrig i
//                  närheten.
//   STREAM  180 s  absolut tak för ett prosasvar. 16 384 tokens hinner ut
//                  långt inom det hos de leverantörer vi dirigerar till.
//                  Finns som skyddsnät mot en leverantör som droppar en token
//                  var 29:e sekund i evighet och därmed aldrig stallar.
//   JSON     60 s  per försök i JSON-läge (buffrat, se nedan) — drygt dubbla
//                  den uppmätta sammanställningen.
//   DEADLINE 110 s båda JSON-försöken tillsammans. Efter knappt två minuter
//                  har kunden lämnat sidan ändå; då är ett ärligt fel bättre
//                  än ett svar ingen ser.
const CONNECT_TIMEOUT_MS = 30_000;
const STALL_TIMEOUT_MS = 30_000;
const STREAM_TIMEOUT_MS = 180_000;
const JSON_ATTEMPT_MS = 60_000;
const JSON_DEADLINE_MS = 110_000;
const JSON_RETRY_MIN_MS = 20_000; // starta inget omförsök som ändå inte hinner klart

// ── planer ────────────────────────────────────────────────────────────────
//
// Vad "köpt" betyder i databasen.
//
// Åtkomsten är det som säljs. En rad i `team_access` skapas bara av
// Stripe-webhooken efter betalning, av en ägare som bjuder in en kollega,
// eller av scripts/provision.mjs när vi lägger upp någon för hand. Ingen väg
// dit går genom klienten — det är därför uppslaget här är en betalvägg och
// inte en artighetsfråga.
//
// `teams.plan` säger VAD som köptes ('trial' | 'standard', se TIERS i
// _stripe.js). Den läses för att gå att STÄNGA AV — reglerna för vad varje
// värde betyder, och när en provmånad tar slut, bor i _plan.js så att den här
// rutten och /api/teams/:slug inte kan komma till olika slutsatser om samma
// rad. Fram till 2026-08-07 läste bara den här filen planen, och den betalande
// kunden mötte därför spärren först efter att ha skrivit sitt första
// meddelande.

// Samma mönster som functions/api/team/_lib.js. Utkast och branschdemos i
// portalen heter "__draft"/"__vertical"/"__link" och faller på första tecknet
// — de är inte köpta team och ska mötas av köpmeddelandet, inte av ett svar.
const looksLikeSlug = (s) => /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(s);

// ── SVENSKA FEL ───────────────────────────────────────────────────────────
//
// Allt som når kunden är på svenska och nämner aldrig en leverantör. Detaljen
// loggas med console.error, men uppströmstext returneras aldrig rått: den är
// engelsk, den namnger Groq eller Cerebras, och den ger ingen väg vidare.
const FEL = {
  login: "Du behöver logga in för att använda teamet. Öppna mittaiteam.se/portal/ och begär en inloggningskod till din mejladress.",
  purchase:
    "Det här teamet är inte aktiverat på ditt konto ännu. Starta provmånaden på mittaiteam.se och spara teamet i molnet, så öppnas det direkt. " +
    "Har du redan betalat — mejla info@mittaiteam.se, så ordnar vi det på en gång.",
  // Egen text när planen tagit slut. Kunden HAR teamet, hon har använt det, och
  // "inte aktiverat ännu" vore både fel och nedlåtande i det läget. Att skilja
  // de två fallen åt läcker ingenting: hit kommer man bara med en rad i
  // team_access, alltså med åtkomst till just det teamet.
  ended: {
    expired:
      "Provmånaden för det här teamet är slut. Fortsätt löpande för 290 kr/mån i portalen, så svarar agenterna igen — minne, underlag och samtal ligger kvar orörda.",
    cancelled:
      "Abonnemanget för det här teamet är uppsagt, så agenterna svarar inte längre. Vill ni starta om går det när som helst i portalen.",
    past_due:
      "Vi fick inte betalt för senaste fakturan, så teamet är pausat. Uppdatera kortet i portalen eller mejla info@mittaiteam.se, så öppnar vi direkt.",
    refunded:
      "Köpet av det här teamet är återbetalat, så agenterna svarar inte längre. Vill ni börja om finns teamet kvar — hör av er till info@mittaiteam.se.",
  },
  timeout: "Det tog för lång tid att få svar. Försök igen — händer det två gånger i rad, mejla info@mittaiteam.se så tittar vi på det.",
  strömTimeout: "Svaret tog för lång tid och avbröts. Försök igen.",
  strömBröts: "Svaret avbröts på vägen. Försök igen.",
  jsonFel:
    "AI-tjänsten lyckades inte sätta ihop teamet den här gången. Försök igen — det brukar gå på andra försöket. " +
    "Fortsätter det, mejla info@mittaiteam.se.",
  uppström: "AI-tjänsten svarade inte. Försök igen om en stund.",
  kredit:
    "Tjänsten ligger nere på grund av ett fel hos oss, inte hos er. Vi är meddelade och åtgärdar det. " +
    "Hör gärna av er till info@mittaiteam.se om det inte fungerar inom kort.",
};

const utcDay = (t) => new Date(t).toISOString().slice(0, 10);
const utcMonth = (t) => new Date(t).toISOString().slice(0, 7);

const enc = new TextEncoder();
// En felram i OpenRouters eget SSE-format. atb-claude.js läser `evt.error`
// och kastar meddelandet vidare till gränssnittet — så en ström som dör mitt i
// blir ett läsbart svenskt fel i stället för ett svar som bara tar slut.
const felRam = (message) => enc.encode(`data: ${JSON.stringify({ error: { message } })}\n\n`);

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no", // ingen buffring: strömmen ska synas medan den skrivs
};

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);
  if (!env.OPENROUTER_KEY) {
    // Tydligt fel i stället för ett tyst 502: det här är en driftmiss, inte
    // något kunden kan göra något åt.
    return json({ error: "AI-tjänsten är inte konfigurerad. Hör av dig till info@mittaiteam.se." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "trasig kropp" }, 400);
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : null;
  if (!rawMessages || !rawMessages.length) return json({ error: "inga meddelanden" }, 400);
  if (rawMessages.length > MAX_MESSAGES) return json({ error: "för många meddelanden i ett anrop" }, 413);

  // Formen valideras, inte bara storleken — och det som går vidare uppströms är
  // det vi själva byggt, aldrig klientens objekt.
  //
  // Teckentaket mätte tidigare `String(m.content).length`. Skickar man `content`
  // som en ARRAY — vilket OpenAI-formatet tillåter, och uppströms accepterar —
  // blir `String([...])` "[object Object]": femton tecken, oavsett om nyttolasten
  // är en megabyte. Taket gick alltså att kliva rakt förbi, och räkningen är vår.
  // Att mäta arrayen rekursivt hade lagat siffran men lämnat kvar det egentliga
  // problemet: klientens objekt vidarebefordrades orört, med vilka nycklar som
  // helst. Ingen av våra ytor skickar något annat än en sträng (builder.js:755
  // m.fl.), så allt annat avvisas.
  const messages = [];
  for (const m of rawMessages) {
    if (!m || typeof m !== "object" || typeof m.content !== "string") {
      return json({ error: "ogiltigt meddelandeformat" }, 400);
    }
    messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
  }

  const system = typeof body.system === "string" ? body.system : "";
  const size = system.length + messages.reduce((n, m) => n + m.content.length, 0);
  if (size > MAX_INPUT_CHARS) return json({ error: "för mycket text i ett anrop" }, 413);

  const t = nowMs();
  const ip = clientIp(request) || "okänd";
  const wantsJson = !!(body.json || body.schema);

  // ── vem frågar, och om vad? ────────────────────────────────────────────
  //
  // `team` är signalen att det här är ett portalsvar. Den är inte en flagga
  // som säger "jag får detta gratis" — den är en slug som måste finnas i
  // databasen och vara knuten till den inloggade. Utelämnas den blir anropet
  // ett bygge, med byggets tak och utan portalens funktioner.
  const slug = typeof body.team === "string" ? body.team.trim() : "";
  const user = await sessionUser(db, request).catch(() => null);

  let subject;
  if (slug) {
    if (!user) return json({ error: FEL.login, code: "login_required" }, 401);

    // Samma svar på "teamet finns inte", "du når det inte" och "planen är
    // avstängd". Skiljer de sig blir rutten ett sätt att prova sig fram till
    // vilka slugs som finns — och en slug är fortfarande halva nyckeln.
    let row = null;
    if (looksLikeSlug(slug)) {
      row = await db.prepare(
        "SELECT t.plan, t.created_at FROM teams t JOIN team_access a ON a.team_slug = t.slug " +
        "WHERE t.slug = ?1 AND a.user_id = ?2"
      ).bind(slug, user.id).first().catch(() => null);
    }
    if (!row) return json({ error: FEL.purchase, code: "purchase_required" }, 402);

    const plan = planState(row, t);
    if (!plan.ok) {
      // Provmånaden tar slut av sig själv, utan cron: kontrollen är lat och
      // raden skrivs om första gången någon knackar på efter utgången. Skrivs
      // den inte (databasfel, avbruten request) räknas den ut igen nästa gång —
      // det enda som går förlorat är att stödpersonal ser 'trial' i tabellen.
      if (plan.expire) {
        waitUntil(db.prepare(planUpdateSql()).bind("expired", t, slug).run().catch(() => {}));
      }
      console.warn("[ai] avvisad plan", slug, plan.plan, PLAN_REASON[plan.reason] || plan.reason);
      return json({
        error: FEL.ended[plan.reason] || FEL.purchase,
        code: "plan_ended",
        plan: plan.reason,
      }, 402);
    }
    subject = "team:" + slug;
  } else {
    // Bygget. Inloggad räknas ändå per konto — inte för att sätta ett tak
    // utan för att kunna se vem som bygger mycket. Bygget är gratis och
    // obegränsat; det är säljargumentet.
    subject = user ? "user:" + user.id : "anon";
  }

  const portal = subject.startsWith("team:");

  // ── tak ────────────────────────────────────────────────────────────────
  const ipBucket = portal ? "ip:ai:paid:" + ip : "ip:ai:" + ip;
  if (!(await allowAttempt(db, ipBucket, portal ? MAX_CALLS_PER_IP_PAID : MAX_CALLS_PER_IP))) {
    return json({ error: "För många anrop just nu. Vänta en kvart och försök igen.", code: "rate_limited" }, 429);
  }

  if (!portal) {
    // Dygnstaket på den fria rutten. Räknas i ai_usage med dagen som period —
    // en egen tabell hade sagt samma sak med mer schema att underhålla.
    const dag = await db.prepare("SELECT calls FROM ai_usage WHERE subject = ? AND period = ?")
      .bind("ip:" + ip, utcDay(t)).first().catch(() => null);
    if (dag && dag.calls >= MAX_BUILD_CALLS_PER_IP_DAY) {
      return json({
        error: "Det har byggts många team i dag från den här uppkopplingen. Vänta till i morgon, eller mejla info@mittaiteam.se så löser vi det.",
        code: "build_quota",
      }, 429);
    }
  } else {
    const row = await db.prepare("SELECT calls FROM ai_usage WHERE subject = ? AND period = ?")
      .bind(subject, utcMonth(t)).first().catch(() => null);
    if (row && row.calls >= MAX_CALLS_PER_TEAM) {
      return json({
        error: "Ni har nått månadens tak på " + MAX_CALLS_PER_TEAM + " svar. Hör av er till info@mittaiteam.se så löser vi det.",
        code: "quota",
        quota: { used: row.calls, limit: MAX_CALLS_PER_TEAM },
      }, 429);
    }
  }

  // Det globala kostnadstaket. Gäller alla — når vi det är tjänsten nere, och
  // det är avsiktligt: en oväntad räkning går inte att ta tillbaka.
  const budget = await db.prepare("SELECT calls FROM ai_budget WHERE day = ?").bind(utcDay(t)).first();
  if (budget && budget.calls >= MAX_CALLS_PER_DAY) {
    return json({ error: "Tjänsten är hårt belastad just nu. Försök igen senare.", code: "service_busy" }, 503);
  }

  // Byggets egen andel av samma dygn. Räknas på en global rad i ai_usage
  // (`build:global`) i stället för i ai_budget, så att ingen migration behövs
  // och siffran går att läsa av separat.
  //
  // Den här kontrollen gäller BARA den fria rutten. Att den ligger efter det
  // globala taket är med flit: når vi 4000 ska alla få samma besked, och först
  // därunder skiljer vi på trafikslagen.
  if (!portal) {
    const byggDygn = await db.prepare("SELECT calls FROM ai_usage WHERE subject = ? AND period = ?")
      .bind("build:global", utcDay(t)).first().catch(() => null);
    if (byggDygn && byggDygn.calls >= MAX_BUILD_CALLS_PER_DAY) {
      console.warn("[ai] byggets dygnstak nått", byggDygn.calls, "av", MAX_BUILD_CALLS_PER_DAY);
      return json({
        error: "Ovanligt många team byggs just nu. Försök igen om en stund, eller i morgon — " +
          "det kostar ingenting att vänta, och er körning står kvar.",
        code: "build_busy",
      }, 503);
    }
  }

  // ── uppströms ──────────────────────────────────────────────────────────

  const payload = {
    model: MODEL_ID,
    max_tokens: Math.min(Number(body.maxTokens) || 4096, MAX_OUTPUT_TOKENS),
    stream: true,
    stream_options: { include_usage: true },
    // Se leverantörsvalet högst upp. require_parameters sållar bort de
    // leverantörer som inte ens deklarerar response_format — de IGNORERAR det
    // annars tyst, och ett garanterat format som inte garanteras är värre än
    // inget, för då litar koden på det.
    provider: wantsJson
      ? {
          order: JSON_PROVIDER_ORDER,
          ignore: JSON_PROVIDER_IGNORE,
          allow_fallbacks: true,
          require_parameters: true,
        }
      : { sort: "throughput" },
    // Äkta strukturerad utdata när anroparen skickar ett schema. Skillnaden
    // mot json_object är avgörande och kostade ett halvt dygn att lära sig:
    // json_object garanterar bara SYNTAX. Innehållet är fortfarande en
    // vädjan i systemprompten, och modellen hoppade över starters och
    // routines — de fält portalens agentkort och veckorutiner bygger på.
    // Ett schema med required kan den inte hoppa över.
    ...(body.schema
      ? { response_format: { type: "json_schema", json_schema: { name: "team", strict: true, schema: body.schema } } }
      : body.json ? { response_format: { type: "json_object" } } : {}),
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
  };

  const headers = {
    authorization: "Bearer " + env.OPENROUTER_KEY,
    "content-type": "application/json",
    // OpenRouter vill ha avsändare för sin statistik; skadar inget och gör
    // det lättare att se vad som är vårt i deras logg.
    "http-referer": "https://mittaiteam.se",
    "x-title": "Mitt AI-team",
  };
  const payloadText = JSON.stringify(payload);

  // Bokföringen får aldrig fälla ett lyckat svar: den körs efter att svaret
  // lämnat oss, och ett fel här loggas i stället för att kastas.
  //
  // Anropet räknas oavsett hur det gick — annars blir ett trasigt anrop
  // gratis, och då är taket kringgåbart genom att avbryta strömmen.
  const bokför = (used) => {
    const inTok = (used && used.input) || 0;
    const outTok = (used && used.output) || 0;
    const satser = [
      db.prepare(
        "INSERT INTO ai_budget (day, calls, input_tok, output_tok) VALUES (?, 1, ?, ?) " +
        "ON CONFLICT(day) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok"
      ).bind(utcDay(t), inTok, outTok),
      db.prepare(
        "INSERT INTO ai_usage (subject, period, calls, input_tok, output_tok) VALUES (?, ?, 1, ?, ?) " +
        "ON CONFLICT(subject, period) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok"
      ).bind(subject, utcMonth(t), inTok, outTok),
    ];
    if (!portal) {
      // Dygnsraden för den fria rutten. Egen rad, eget subject — annars går
      // det inte att skilja "den här IP-adressen i dag" från månadssiffran.
      satser.push(db.prepare(
        "INSERT INTO ai_usage (subject, period, calls, input_tok, output_tok) VALUES (?, ?, 1, ?, ?) " +
        "ON CONFLICT(subject, period) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok"
      ).bind("ip:" + ip, utcDay(t), inTok, outTok));
      // Byggets globala dygnsrad — den som MAX_BUILD_CALLS_PER_DAY läser.
      // Utan den här skrivningen är taket ovan en kontroll mot en siffra som
      // aldrig växer, alltså inget tak alls. Samma fälla som planens livscykel
      // var före 2026-08-07: en spärrlista som ingen kod fyllde på.
      satser.push(db.prepare(
        "INSERT INTO ai_usage (subject, period, calls, input_tok, output_tok) VALUES (?, ?, 1, ?, ?) " +
        "ON CONFLICT(subject, period) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok"
      ).bind("build:global", utcDay(t), inTok, outTok));
    }
    return db.batch(satser).catch((e) => console.error("[ai] kunde inte bokföra förbrukning", String(e)));
  };

  // Fel bokförs som antal per dygn och kod — aldrig innehåll. Det är det enda
  // spår som finns kvar efter att svaret gått: `console.error` i en Pages
  // Function syns bara i `wrangler pages deployment tail` medan någon tittar,
  // vilket är exakt varför B1 kunde ligga stum i tio dagar. `/api/health` läser
  // den här tabellen, så en uptime-vakt kan larma i stället för en kund.
  const bokförFel = (code) => db.prepare(
    "INSERT INTO ai_errors (day, code, count, last_at) VALUES (?, ?, 1, ?) " +
    "ON CONFLICT(day, code) DO UPDATE SET count = count + 1, last_at = excluded.last_at"
  ).bind(utcDay(t), String(code || "okänd"), t).run()
    .catch((e) => console.error("[ai] kunde inte bokföra fel", String(e)));

  return wantsJson
    ? jsonSvar({ headers, payloadText, bokför, bokförFel, waitUntil })
    : strömSvar({ headers, payloadText, bokför, bokförFel, waitUntil });
}

// ── JSON-läget: buffrat, med ETT omförsök ─────────────────────────────────
//
// JSON-anropen strömmas inte vidare medan de skrivs, utan buffras och skickas
// i ett stycke. Det låter konstigt i en fil som annars vaktar strömmen, men
// det är just vad som gör omförsöket möjligt: schemafelet kommer som en
// felram SIST i strömmen, och har vi redan skickat halva svaret till kunden
// går det inte att ta tillbaka. Ingenting går förlorat — bygget anropar det
// här steget via ATBClaude.collect(), som ändå samlar hela svaret innan det
// används, och sammanställningen visas aldrig som text för kunden.
//
// Ett omförsök, aldrig fler. Misslyckas den strukturerade utdatan är nästa
// försök oftast lyckat (annan leverantör i ordningen, ny sampling), men två
// misslyckanden i rad betyder något annat än otur — och en kund som väntar
// tre gånger 60 sekunder har lämnat sidan.
async function jsonSvar({ headers, payloadText, bokför, bokförFel, waitUntil }) {
  const deadline = nowMs() + JSON_DEADLINE_MS;
  const summa = { input: 0, output: 0 };
  let sista = null;

  for (let försök = 1; försök <= 2; försök++) {
    const kvar = deadline - nowMs();
    if (kvar < (försök === 1 ? 1 : JSON_RETRY_MIN_MS)) break;

    const r = await jsonFörsök(headers, payloadText, Math.min(JSON_ATTEMPT_MS, kvar));
    // Förbrukningen räknas även på ett misslyckat försök: tokens är genererade
    // och betalda oavsett om svaret gick att använda.
    if (r.used) { summa.input += r.used.input; summa.output += r.used.output; }
    sista = r;

    if (r.kind === "ok") {
      waitUntil(bokför(summa));
      return new Response(r.raw, { headers: SSE_HEADERS });
    }
    // Bara schemafel görs om. Ett HTTP-fel uppströms (nyckel, kredit, 5xx)
    // blir inte bättre av att skickas igen från vår sida — klienten har egna
    // omförsök för det — och en tidsgräns som slagit till betyder att det inte
    // finns tid kvar.
    if (r.kind !== "schema") break;
    console.error("[ai] schemafel i JSON-läget, försök " + försök, String(r.detail || "").slice(0, 400));
  }

  waitUntil(bokför(summa));

  if (!sista) return json({ error: FEL.timeout, code: "timeout" }, 408);
  if (sista.kind === "http") return httpFel(sista.status, sista.detail, bokförFel, waitUntil);
  if (sista.kind === "timeout") {
    console.error("[ai] tidsgräns i JSON-läget");
    // 408 och inte 504 med flit: atb-claude.js gör automatiska omförsök på
    // allt ≥500, och tre försök à en minut gör en minuts väntan till fyra.
    return json({ error: FEL.timeout, code: "timeout" }, 408);
  }
  if (sista.kind === "schema") {
    // 422 av samma skäl: det här är ett slutgiltigt svar, inte något som blir
    // bättre av att klienten skickar om det tre gånger till.
    return json({ error: FEL.jsonFel, code: "json_failed" }, 422);
  }
  console.error("[ai] nätfel mot uppströms", String(sista.detail || "").slice(0, 400));
  return json({ error: FEL.uppström, code: "upstream" }, 502);
}

async function jsonFörsök(headers, payloadText, budgetMs) {
  const ctrl = new AbortController();
  let löpteUt = false;
  const timer = setTimeout(() => { löpteUt = true; ctrl.abort(); }, budgetMs);
  try {
    const res = await fetch(OPENROUTER_URL, { method: "POST", headers, body: payloadText, signal: ctrl.signal });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      return { kind: "http", status: res.status, detail };
    }
    // Hela strömmen på en gång. Tidsgränsen ovan gäller även den här
    // läsningen, eftersom signalen sitter på hela anropet — en ström som
    // hänger mitt i avbryts alltså också.
    const raw = await res.text();
    const läst = läsSse(raw);
    if (läst.error) return { kind: "schema", detail: läst.error, used: läst.used };
    if (!ärJson(läst.text)) return { kind: "schema", detail: "svaret gick inte att tolka som JSON", used: läst.used };
    return { kind: "ok", raw, used: läst.used };
  } catch (e) {
    return { kind: löpteUt ? "timeout" : "nät", detail: String(e) };
  } finally {
    clearTimeout(timer);
  }
}

// ── prosaläget: strömmas vidare, med vakthund ─────────────────────────────
async function strömSvar({ headers, payloadText, bokför, bokförFel, waitUntil }) {
  const ctrl = new AbortController();
  let löpteUt = false;
  let stallTimer = null;
  const hårdTimer = setTimeout(() => { löpteUt = true; ctrl.abort(); }, STREAM_TIMEOUT_MS);
  const armera = (ms) => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => { löpteUt = true; ctrl.abort(); }, ms);
  };
  const släck = () => { clearTimeout(stallTimer); clearTimeout(hårdTimer); };

  armera(CONNECT_TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(OPENROUTER_URL, { method: "POST", headers, body: payloadText, signal: ctrl.signal });
  } catch (e) {
    släck();
    waitUntil(bokför(null));
    if (löpteUt) {
      console.error("[ai] uppströms svarade inte inom " + CONNECT_TIMEOUT_MS + " ms");
      return json({ error: FEL.timeout, code: "timeout" }, 408);
    }
    console.error("[ai] nätfel mot uppströms", String(e).slice(0, 400));
    waitUntil(bokförFel("network"));
    return json({ error: FEL.uppström, code: "upstream" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    släck();
    const detalj = await upstream.text().catch(() => "");
    waitUntil(bokför(null));
    return httpFel(upstream.status, detalj, bokförFel, waitUntil);
  }

  // Räkna medan strömmen passerar. Alternativet — att låta klienten rapportera
  // sin förbrukning — vore att låta den som ska begränsas skriva räkningen.
  //
  // Raderna parsas som SSE, inte med en regex över svansen. Första försöket
  // gjorde det senare och räknade noll tokens i skarp drift: usage-objektet
  // innehåller nästlade objekt (prompt_tokens_details, cost_details), så ett
  // `[^}]*` slutar vid fel klammer. Felet syntes inte i något svar — bara som
  // nollor i databasen, vilket är precis den sortens tystnad som gör att ett
  // tak aldrig slår till när det behövs.
  const decoder = new TextDecoder();
  let lineBuf = "";
  let used = null;
  let felRad = null;

  const läsRad = (rad) => {
    const s = rad.trim();
    if (!s.startsWith("data:")) return;
    const data = s.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const evt = JSON.parse(data);
      if (evt.usage) {
        used = { input: evt.usage.prompt_tokens || 0, output: evt.usage.completion_tokens || 0 };
      }
      if (evt.error) felRad = (evt.error && evt.error.message) || "okänt uppströmsfel";
    } catch (_) { /* ofullständig rad — nästa chunk fyller på */ }
  };

  // Returnerar felmeddelandet om chunken innehöll en felram, annars null.
  // Läsningen sker FÖRE vidarebefordran, till skillnad från tidigare: en
  // felram får inte nå kunden, och när bytesen väl är utskickade går de inte
  // att hämta tillbaka. Kostnaden är en JSON.parse per rad innan den skickas —
  // omätbar mot en ström som ändå väntar på nätet.
  const mät = (bytes) => {
    felRad = null;
    lineBuf += decoder.decode(bytes, { stream: true });
    let i;
    while ((i = lineBuf.indexOf("\n")) >= 0) {
      läsRad(lineBuf.slice(0, i));
      lineBuf = lineBuf.slice(i + 1);
    }
    return felRad;
  };

  const reader = upstream.body.getReader();
  let klar = false;
  const avsluta = () => {
    if (klar) return;
    klar = true;
    släck();
    läsRad(lineBuf);
    waitUntil(bokför(used));
  };

  const ström = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) { avsluta(); controller.close(); return; }

        const fel = mät(value);
        if (fel) {
          // Här dog körningen. Uppströmstexten loggas — den är det enda som
          // säger VILKEN leverantör som fallerade — men kunden får en svensk
          // mening. Chunken släpps inte igenom: den bär felet i klartext.
          console.error("[ai] uppströmsfel i strömmen", String(fel).slice(0, 400));
          controller.enqueue(felRam(FEL.strömBröts));
          await reader.cancel().catch(() => {});
          avsluta();
          controller.close();
          return;
        }

        controller.enqueue(value);
        armera(STALL_TIMEOUT_MS);
      } catch (e) {
        // Tidsgräns eller brutet nät. Kunden har redan fått 200 och en del av
        // svaret, så felet måste komma som en felram i strömmen — annars tar
        // svaret bara slut mitt i en mening och ser ut som ett fungerande men
        // konstigt svar.
        console.error("[ai] strömmen bröts", löpteUt ? "tidsgräns" : String(e).slice(0, 200));
        try { controller.enqueue(felRam(löpteUt ? FEL.strömTimeout : FEL.strömBröts)); } catch (_) { /* redan stängd */ }
        avsluta();
        controller.close();
      }
    },
    cancel() {
      // Kunden avbröt. Uppströms stängs också — det som inte genereras
      // behöver vi inte betala för. Anropet räknas ändå, annars är taket
      // kringgåbart genom att avbryta.
      ctrl.abort();
      avsluta();
    },
  });

  return new Response(ström, { headers: SSE_HEADERS });
}

// ── delat ─────────────────────────────────────────────────────────────────

// Ett HTTP-fel uppströms översatt till något kunden kan göra något åt.
// Detaljen loggas, inte returneras: den kan innehålla vår nyckels status och
// leverantörsnamn som kunden inte har med att göra.
// `bokförFel` och `waitUntil` är valfria: httpFel anropas från två ställen som
// båda har dem, men funktionen ska inte falla isär om ett tredje anropsställe
// tillkommer utan. Bokföringen är det som gör felet läsbart i efterhand — se
// /api/health, som är beroende av att just service_down hamnar i ai_errors.
function httpFel(status, detalj, bokförFel, waitUntil) {
  console.error("[ai] uppströmsfel", status, String(detalj || "").slice(0, 400));
  const spara = (code) => {
    if (bokförFel && waitUntil) waitUntil(bokförFel(code));
  };

  // Slut på pengar är inte samma sak som "försök igen om en stund" — det
  // löser sig aldrig av sig självt, och ett svar som ber kunden vänta gör
  // att ingen hör av sig medan tjänsten står stilla. 402 är OpenRouters
  // kod för tömd kredit; texten kan också nämna det vid andra statusar.
  if (status === 402 || /insufficient|credit|quota/i.test(String(detalj || ""))) {
    console.error("[ai] KREDITEN ÄR SLUT hos OpenRouter — fyll på, tjänsten står stilla");
    spara("service_down");
    return json({ error: FEL.kredit, code: "service_down" }, 503);
  }
  spara("upstream");
  return json({ error: FEL.uppström, code: "upstream" }, 502);
}

// Plockar isär en hel SSE-ström: texten, förbrukningen och en eventuell
// felram. Används bara i JSON-läget, där hela svaret finns innan något skickas.
function läsSse(raw) {
  let text = "";
  let used = null;
  let error = null;
  for (const rad of String(raw || "").split("\n")) {
    const s = rad.trim();
    if (!s.startsWith("data:")) continue;
    const data = s.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    let evt;
    try { evt = JSON.parse(data); } catch (_) { continue; }
    const delta = evt.choices && evt.choices[0] && evt.choices[0].delta;
    if (delta && typeof delta.content === "string") text += delta.content;
    if (evt.usage) used = { input: evt.usage.prompt_tokens || 0, output: evt.usage.completion_tokens || 0 };
    if (evt.error && !error) error = (evt.error && evt.error.message) || "okänt uppströmsfel";
  }
  return { text, used, error };
}

// Duger svaret som JSON? Staketen tillåts för att inte tvinga fram ett dyrt
// omförsök på något klienten ändå klarar — builderns parseTeamJson() skalar
// bort dem. Det som INTE ska passera är avhugget eller tomt innehåll, för det
// är vad ett schemafel ser ut som.
function ärJson(text) {
  const s = String(text || "").trim();
  if (!s) return false;
  const utan = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try { JSON.parse(utan); return true; } catch (_) { return false; }
}
