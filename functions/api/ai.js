// POST /api/ai — vår proxy mot OpenRouter, på vår nyckel.
//
// Varför den finns: fram till 2026-08-06 hade varje kund en egen API-nyckel.
// Det var tekniskt elegant — inget passerade oss — och kommersiellt förödande.
// Rollspelet med en icke-teknisk kund visade var det tog stopp: hon hade betalat
// 90 kr, loggat in, och möttes av kravet att skaffa konto hos ett amerikanskt
// utvecklarverktyg och lägga in ett betalkort där. Den tröskeln kostade oss
// varje kund som inte redan var utvecklare.
//
// Nu står vi för förbrukningen. Två öre per svar mot 90–490 kr i intäkt är ett
// avrundningsfel; tröskeln var det inte. Priset för bytet är att vi blir
// personuppgiftsbiträde och att en öppen rutt på vår nyckel måste bevakas —
// därav taken nedan.
//
// Strömmen skickas vidare ORÖRD till klienten. atb-claude.js parsar redan
// OpenRouters SSE-format, och en proxy som skriver om formatet blir ett andra
// ställe där svarshanteringen kan gå sönder.

import { json, nowMs, allowAttempt, clientIp, sessionUser } from "./auth/_lib.js";

// ── tak ───────────────────────────────────────────────────────────────────
//
// Tre lager, för de skyddar mot olika saker:
//
//   per IP     — en enskild besökare som klickar för mycket, eller ett enkelt
//                skript. Ett bygge är fyra anrop, så 24 räcker för sex byggen
//                per kvart. Ingen verklig människa bygger så.
//   per konto  — fair use, det som villkoren hänvisar till. Generöst med flit:
//                den som når det ska vara en kund värd ett samtal, inte en
//                kund vi stoppat.
//   per dygn   — hela tjänstens kostnadstak. Det enda som håller om någon
//                roterar IP-adresser. Slår det till är tjänsten nere för alla,
//                vilket är illa — men mindre illa än en oväntad räkning som
//                inte går att ta tillbaka.
const MAX_CALLS_PER_IP = 24;          // per kvart
const MAX_CALLS_PER_ACCOUNT = 1000;   // per månad — samma tal som villkorens fair use
const MAX_CALLS_PER_DAY = 4000;       // globalt; ~ett par hundra kronor i värsta fall

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

const MODEL_ID = "openai/gpt-oss-120b";

const utcDay = (t) => new Date(t).toISOString().slice(0, 10);
const utcMonth = (t) => new Date(t).toISOString().slice(0, 7);

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

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || !messages.length) return json({ error: "inga meddelanden" }, 400);

  const system = typeof body.system === "string" ? body.system : "";
  const size = system.length + messages.reduce((n, m) => n + String((m && m.content) || "").length, 0);
  if (size > MAX_INPUT_CHARS) return json({ error: "för mycket text i ett anrop" }, 413);

  const t = nowMs();

  // Vem frågar? Inloggad räknas per konto, bygget räknas anonymt. Bygget är
  // öppet med flit — att kräva konto för att få se vad produkten gör vore att
  // sätta tillbaka tröskeln vi just tog bort.
  const user = await sessionUser(db, request).catch(() => null);
  const subject = user ? "user:" + user.id : "anon";

  if (!(await allowAttempt(db, "ip:ai:" + (clientIp(request) || "okänd"), MAX_CALLS_PER_IP))) {
    return json({ error: "För många anrop just nu. Vänta en kvart och försök igen." }, 429);
  }

  if (user) {
    const row = await db.prepare("SELECT calls FROM ai_usage WHERE subject = ? AND period = ?")
      .bind(subject, utcMonth(t)).first();
    if (row && row.calls >= MAX_CALLS_PER_ACCOUNT) {
      return json({
        error: "Ni har nått månadens tak på " + MAX_CALLS_PER_ACCOUNT + " svar. Hör av er till info@mittaiteam.se så löser vi det.",
        quota: { used: row.calls, limit: MAX_CALLS_PER_ACCOUNT },
      }, 429);
    }
  }

  const budget = await db.prepare("SELECT calls FROM ai_budget WHERE day = ?").bind(utcDay(t)).first();
  if (budget && budget.calls >= MAX_CALLS_PER_DAY) {
    return json({ error: "Tjänsten är hårt belastad just nu. Försök igen senare." }, 503);
  }

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.OPENROUTER_KEY,
      "content-type": "application/json",
      // OpenRouter vill ha avsändare för sin statistik; skadar inget och gör
      // det lättare att se vad som är vårt i deras logg.
      "http-referer": "https://mittaiteam.se",
      "x-title": "Mitt AI-team",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      max_tokens: Math.min(Number(body.maxTokens) || 4096, MAX_OUTPUT_TOKENS),
      stream: true,
      stream_options: { include_usage: true },
      // Snabbaste leverantören i stället för billigaste. OpenRouter fördelar
      // annars efter pris och kan landa på en leverantör som ger fyra tokens
      // i sekunden — uppmätt i Buildern 2026-08-06, där ett researchsteg tog
      // över fem minuter och användaren avbröt. Det kostar något mer per token;
      // en kund som lägger ner kostar allt.
      // require_parameters i JSON-läget: OpenRouter dirigerar annars till
      // snabbaste leverantör oavsett om den stödjer response_format, och den
      // som inte gör det IGNORERAR det tyst. Uppmätt 2026-08-06: Baidu
      // returnerade `,\ntagline": ...` — ett tappat inledande citattecken mitt
      // i ett i övrigt komplett svar. Ett garanterat format som inte
      // garanteras är värre än inget, för då litar koden på det.
      provider: body.json
        ? { sort: "throughput", require_parameters: true }
        : { sort: "throughput" },
      // JSON-läge när anroparen begär det. Buildern ber modellen om ett helt
      // team som JSON, och "returnera ENBART giltig JSON" i systemprompten
      // räcker inte: DeepSeek lägger till prosa, staket eller oescapade
      // radbrytningar och hela bygget faller på sista steget. Med
      // response_format garanterar leverantören syntaxen i stället för att vi
      // hoppas på den.
      // Resonemanget stängs av i JSON-läget. DeepSeek V4 Flash är en
      // resonerande modell och tänker FÖRE svaret — uppmätt 2026-08-06: 419 av
      // 467 utdatatokens gick till resonemang för en trivial JSON-uppgift.
      // Resonemangstokens räknas mot max_tokens, så de kapade teamet mitt i:
      // det var den egentliga orsaken till "ogiltig JSON", inte modellens
      // formatvilja. Att formatera färdig text till JSON kräver inget tänkande.
      //
      // Kvar PÅ i de andra stegen (research, skalning, förslag) — där är
      // resonemanget själva arbetet, och det är dem produkten säljer.
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
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detalj = await upstream.text().catch(() => "");
    // Detaljen loggas, inte returneras: den kan innehålla vår nyckels status
    // och leverantörsnamn som kunden inte har med att göra.
    console.error("[ai] uppströmsfel", upstream.status, detalj.slice(0, 400));

    // Slut på pengar är inte samma sak som "försök igen om en stund" — det
    // löser sig aldrig av sig självt, och ett svar som ber kunden vänta gör
    // att ingen hör av sig medan tjänsten står stilla. 402 är OpenRouters
    // kod för tömd kredit; texten kan också nämna det vid andra statusar.
    if (upstream.status === 402 || /insufficient|credit|quota/i.test(detalj)) {
      console.error("[ai] KREDITEN ÄR SLUT hos OpenRouter — fyll på, tjänsten står stilla");
      return json({
        error: "Tjänsten ligger nere på grund av ett fel hos oss, inte hos er. Vi är meddelade och åtgärdar det. Hör gärna av er till info@mittaiteam.se om det inte fungerar inom kort.",
      }, 503);
    }
    return json({ error: "AI-tjänsten svarade inte. Försök igen om en stund." }, 502);
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
  let used = null;
  let lineBuf = "";
  const decoder = new TextDecoder();
  let klar;
  const mätningKlar = new Promise((r) => { klar = r; });

  const läsRad = (rad) => {
    const t = rad.trim();
    if (!t.startsWith("data:")) return;
    const data = t.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const evt = JSON.parse(data);
      if (evt.usage) {
        used = {
          input: evt.usage.prompt_tokens || 0,
          output: evt.usage.completion_tokens || 0,
        };
      }
    } catch (_) { /* ofullständig rad — nästa chunk fyller på */ }
  };

  const meter = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk); // kunden får sitt svar först, alltid
      lineBuf += decoder.decode(chunk, { stream: true });
      let i;
      while ((i = lineBuf.indexOf("\n")) >= 0) {
        läsRad(lineBuf.slice(0, i));
        lineBuf = lineBuf.slice(i + 1);
      }
    },
    flush() {
      läsRad(lineBuf);
      klar();
    },
    cancel() {
      // Kunden avbröt. Anropet har ändå kostat oss det som hunnit genereras,
      // så det ska räknas — annars är taket kringgåbart genom att avbryta.
      klar();
    },
  });

  // Bokföringen får aldrig fälla ett lyckat svar: den körs efter att strömmen
  // lämnat oss, och ett fel här loggas i stället för att kastas.
  waitUntil((async () => {
    // Anropet räknas oavsett hur det gick — annars blir ett trasigt anrop
    // gratis, och då är taket kringgåbart genom att avbryta strömmen.
    try {
      // Vänta in mätningen i stället för att hoppas att den hunnit. Ett
      // setTimeout(0) räckte inte: strömmen är inte klar när svaret lämnar
      // funktionen, den är klar när sista chunken passerat.
      await mätningKlar;
      const inTok = () => (used ? used.input : 0);
      const outTok = () => (used ? used.output : 0);
      await db.batch([
        db.prepare(
          "INSERT INTO ai_budget (day, calls, input_tok, output_tok) VALUES (?, 1, ?, ?) " +
          "ON CONFLICT(day) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok"
        ).bind(utcDay(t), inTok(), outTok()),
        db.prepare(
          "INSERT INTO ai_usage (subject, period, calls, input_tok, output_tok) VALUES (?, ?, 1, ?, ?) " +
          "ON CONFLICT(subject, period) DO UPDATE SET calls = calls + 1, input_tok = input_tok + excluded.input_tok, output_tok = output_tok + excluded.output_tok"
        ).bind(subject, utcMonth(t), inTok(), outTok()),
      ]);
    } catch (e) {
      console.error("[ai] kunde inte bokföra förbrukning", String(e));
    }
  })());

  return new Response(upstream.body.pipeThrough(meter), {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no", // ingen buffring: strömmen ska synas medan den skrivs
    },
  });
}
