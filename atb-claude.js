/* ============================================================
   Delad Claude-klient för Builder och Portal.
   Klassiskt skript som exponerar window.ATBClaude — samma mönster
   som avatars.js. Samlar SSE-strömningen och felhanteringen på ETT
   ställe så att builder/builder.js och portal/app.js inte kan glida
   isär (på samma sätt som Buildern hämtar prompts/ live för att inte
   glida från /build-team). Ingen state-koppling: allt skickas in.
   ============================================================ */
(function () {
  // Klienten kanner inte langre nagon leverantors-URL. Allt gar till /api/ai;
  // vart eget lager ager valet av leverantor och modell.
  const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

  // ── EN MODELL, INGA ALTERNATIV (beslutat 2026-08-05) ──────────────────
  // Hela produkten kör DeepSeek V4 Flash via OpenRouter. Det är ~1/30 av
  // Opus pris ($0,14/$0,28 per miljon tokens mot $5/$25) och det som gör
  // både provmånaden och den nyckelfria nivån möjliga att prissätta.
  //
  // Konsekvenser att inte glömma:
  //  - Anthropic-nycklar (sk-ant-) fungerar INTE längre. Enda giltiga
  //    nyckel är sk-or- från OpenRouter.
  //  - Modellvalet är borta ur gränssnittet. Lägg inte tillbaka en
  //    dropdown utan att först ändra prisantagandena i index.html och
  //    villkor.html — de bygger på den här kostnadsnivån.
  //  - villkor.html § 3 och integritet.html § 3 beskriver vilken
  //    leverantör kundens data går till. Ändras raden nedan måste de med.
  const MODEL_ID = "openai/gpt-oss-120b"; // stabilt id: varken tilde-alias (~...-latest, uppdateras utan forvarning) eller datumsuffix (-0731, ruttnar)
  const MODEL_LABEL = "GPT-OSS 120B";

  // Kvar som funktion för att anropsställena ska slippa ändras, men den
  // har bara ett svar numera: allt går via OpenRouter.
  function providerFor() {
    return "openrouter";
  }

  // Vilket team anropen gäller. Portalen sätter den när ett team laddats;
  // Buildern rör den aldrig. Den skiljer ett portalsvar (kräver köpt team och
  // inloggning) från ett bygge (gratis) — och den avgörs på servern, mot
  // databasen. Att fältet sätts här är bara transport: en klient som ljuger
  // om det får byggets villkor, inte gratis portalsvar.
  let currentTeam = null;
  function setTeam(slug) { currentTeam = slug || null; }

  // Översätter ett misslyckat svar till ett begripligt felmeddelande.
  // Läser BARA JSON om servern faktiskt skickar JSON — annars (t.ex. en
  // HTML-sida från en proxy/502/504) skulle res.json() kasta och dölja det
  // riktiga felet bakom ett generiskt "Fel".
  async function errorMessage(res) {
    let msg = `Fel ${res.status}`;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const j = await res.json();
        // Två format: OpenRouter svarar {error:{message}}, vår egen proxy
        // svarar {error:"text på svenska"}. Utan det andra fallet tappas
        // proxyns meddelanden — som taket och fair use-gränsen — och kunden
        // får ett nummer i stället för en förklaring.
        if (j && j.error) msg = (typeof j.error === "string" ? j.error : j.error.message) || msg;
      } catch (_) { /* trasig JSON — behåll status-meddelandet */ }
    } else if (res.status >= 500) {
      msg = "Serverfel hos modell-API:t — försök igen om en stund.";
    }
    // Serverns egen text vinner alltid. Den vet skillnaden mellan "vänta en
    // stund" och "månadens tak är nått" — en generisk 429-text skickade kunden
    // att vänta en minut på en spärr som satt till nästa månad. Bara när
    // proxyn inte hunnit säga något alls fyller vi i.
    if (res.status === 429 && msg === `Fel ${res.status}`) {
      msg = "För många anrop just nu — det gick inte ens efter automatiska omförsök. Vänta en minut och försök igen.";
    }
    return msg;
  }

  // Paus som respekterar Avbryt-knappen — annars skulle en backoff-väntan
  // ignorera att användaren tryckt avbryt.
  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) { reject(new DOMException("Avbruten", "AbortError")); return; }
      const t = setTimeout(resolve, ms);
      if (signal) signal.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Avbruten", "AbortError")); }, { once: true });
    });
  }

  // fetch där ett nätverksfel (tappat wifi, DNS, adblockare) blir ett
  // begripligt svenskt meddelande i stället för rått "Failed to fetch" —
  // det vanligaste felet en icke-teknisk användare möter. Abort passerar orört.
  async function netFetch(url, init) {
    try {
      return await fetch(url, init);
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      throw new Error("Ingen kontakt med AI-tjänsten. Kontrollera internetuppkopplingen och försök igen om en stund.");
    }
  }

  // Backoff-schema för automatiska omförsök på 429/överlastning/serverfel.
  // Kör bara om strömningen inte hunnit börja — då har inga tokens förbrukats.
  const RETRY_DELAYS = [2000, 5000];

  // Strömmar ett svar och anropar onDelta(text) för varje textbit.
  // Väljer Anthropic- eller OpenRouter-format utifrån nyckelns prefix.
  // opts: { apiKey, model, system, messages, maxTokens?, signal?, onDelta }
  async function stream(opts) {
    const { system, messages, maxTokens, signal, onDelta, json } = opts;
    // opts.model och opts.apiKey ignoreras med flit. Anropsställena får
    // fortsätta skicka dem — det är en modell som gäller, och en väg.

    // VÅR NYCKEL, ALLTID (2026-08-06, enda vägen sedan 2026-08-07).
    //
    // Varje anrop går till vår egen proxy. Kunden ska aldrig behöva skaffa en
    // nyckel, varken för att bygga ett team eller för att använda det — kravet
    // var den enskilt största avhoppspunkten för alla som inte redan var
    // utvecklare.
    //
    // Den gamla grenen som skickade anropet direkt till leverantören när en
    // nyckel fanns i localStorage är borttagen. Den var inte bara död kod: så
    // länge den fanns kvar gick varje portalsvar att styra förbi köpgrinden,
    // taken och förbrukningsmätningen genom att lägga en nyckel i webbläsaren.
    // En kvarlämnad väg under en ny grind gör grinden valfri.
    const url = "/api/ai";
    const init = {
      method: "POST",
      signal: signal || undefined,
      credentials: "same-origin", // sessionen avgör om förbrukningen räknas per konto
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ system, messages, maxTokens: maxTokens || 4096, json: !!json, schema: opts.schema || null, team: opts.team || currentTeam || undefined }),
    };

    // Automatiska omförsök på 429/529/5xx innan strömningen börjat — de
    // flesta rate limit-blippar blir därmed osynliga för användaren.
    let res;
    for (let attempt = 0; ; attempt++) {
      res = await netFetch(url, init);
      if (res.ok) break;
      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < RETRY_DELAYS.length) {
        await wait(RETRY_DELAYS[attempt], signal);
        continue;
      }
      throw new Error(await errorMessage(res));
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    // Tokenförbrukning ur strömmen — driver kostnadsvisningen i portalen.
    const used = { input: 0, output: 0 };
    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") return;
      try {
        const evt = JSON.parse(data);
        if (openrouter) {
          // OpenAI-format: {choices:[{delta:{content}}]} — vissa rader är tomma keep-alives.
          const delta = evt.choices && evt.choices[0] && evt.choices[0].delta;
          if (delta && typeof delta.content === "string" && delta.content) onDelta(delta.content);
          else if (evt.error) throw new Error(evt.error.message || "Strömningsfel");
          if (evt.usage) { used.input = evt.usage.prompt_tokens || 0; used.output = evt.usage.completion_tokens || 0; }
        } else {
          if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") onDelta(evt.delta.text);
          else if (evt.type === "error") throw new Error((evt.error && evt.error.message) || "Strömningsfel");
          else if (evt.type === "message_start" && evt.message && evt.message.usage) used.input = evt.message.usage.input_tokens || 0;
          else if (evt.type === "message_delta" && evt.usage) used.output = evt.usage.output_tokens || used.output;
        }
      } catch (e) {
        if (e instanceof SyntaxError) return; // ofullständig rad — vänta på nästa chunk
        throw e;
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) handleLine(line);
    }
    if (buffer) handleLine(buffer); // ev. sista rad utan avslutande radbrytning
    if (opts.onUsage && (used.input || used.output)) {
      try { opts.onUsage(used); } catch (_) { /* kostnadsvisning får aldrig fälla ett lyckat svar */ }
    }
  }

  // validateKey är borttagen 2026-08-06. Ingen kund har en egen nyckel, så
  // det finns inget att validera — och en kvarlämnad validering hade bara
  // gjort det lätt att återinföra nyckelvägen som en genväg förbi köpet.

  // Hämtar OpenRouters modellkatalog (publik endpoint, ingen nyckel krävs)
  // och kurerar den till en dropdown-vänlig lista: Auto-routern först, sedan
  // alla Claude-modeller (produktens hemmaplan), sedan övriga flaggskepp.
  // Cachas i sessionStorage ett dygn så portalen inte hämtar i onödan.
  let orModelsPromise = null;
  // Returnerar den enda modell som används. Behåller formen (en lista med
  // {id,name,pricing}) så att anropande kod inte behöver skrivas om — men
  // listan har numera exakt ett element och hämtar ingenting över nätet.
  async function openrouterModels() {
    return [{ id: MODEL_ID, name: MODEL_LABEL, pricing: { prompt: "0.00000009", completion: "0.00000018" } }];
  }

  async function openrouterModelsUnused() {
    if (orModelsPromise) return orModelsPromise;
    orModelsPromise = (async () => {
      const CACHE_KEY = "atb_or_models_v2"; // v2: inkluderar pricing (kostnadsvisningen)
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        if (cached && Date.now() - cached.at < 24 * 3600 * 1000) return cached.models;
      } catch (_) { /* trasig cache — hämta om */ }

      const res = await fetchWithTimeout(OPENROUTER_MODELS_URL, {}, 8000);
      if (!res.ok) throw new Error("Kunde inte hämta OpenRouters modellista");
      const j = await res.json();
      const all = (j.data || []).filter((m) => m && m.id);
      const byId = (a, b) => a.id.localeCompare(b.id);
      const anthropic = all.filter((m) => m.id.startsWith("anthropic/")).sort(byId);
      const flagships = all
        .filter((m) => /^(openai|google|mistralai|meta-llama|deepseek|x-ai)\//.test(m.id))
        .sort(byId);
      // pricing (USD per token) följer med så portalen kan visa ~kr per svar.
      const slim = (m) => ({
        id: m.id, name: m.name || m.id,
        pricing: m.pricing ? { prompt: +m.pricing.prompt || 0, completion: +m.pricing.completion || 0 } : null,
      });
      const models = [{ id: "openrouter/auto", name: "Auto — OpenRouter väljer modell", pricing: null }]
        .concat(anthropic.map(slim))
        .concat(flagships.map(slim));
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), models })); } catch (_) { /* full storage — strunta i cache */ }
      return models;
    })();
    orModelsPromise.catch(() => { orModelsPromise = null; }); // låt nästa försök hämta om
    return orModelsPromise;
  }

  // Icke-strömmande bekvämlighet: samlar hela svaret till en sträng.
  async function collect(opts) {
    let out = "";
    await stream(Object.assign({}, opts, { onDelta: (d) => { out += d; } }));
    return out;
  }

  // ---------- delbara teamlänkar (ingen server) ----------
  // Teamkonfigen packas (deflate om webbläsaren kan) och base64url-kodas in i
  // ett URL-fragment (#cfg=…). Fragment skickas aldrig till servern — länken
  // bär hela teamet själv. Prefixet anger om innehållet är komprimerat.
  async function encodeTeamLink(teamObj) {
    const bytes = new TextEncoder().encode(JSON.stringify(teamObj));
    let packed = bytes, prefix = "0.";
    if (typeof CompressionStream === "function") {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      packed = new Uint8Array(await new Response(stream).arrayBuffer());
      prefix = "1.";
    }
    let bin = "";
    packed.forEach((b) => { bin += String.fromCharCode(b); });
    return prefix + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  async function decodeTeamLink(str) {
    const m = /^([01])\.(.+)$/.exec((str || "").trim());
    if (!m) throw new Error("Ogiltig teamlänk.");
    const bin = atob(m[2].replace(/-/g, "+").replace(/_/g, "/"));
    let bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    if (m[1] === "1") {
      if (typeof DecompressionStream !== "function") throw new Error("Den här webbläsaren kan inte öppna länken — prova Chrome, Edge eller Firefox.");
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // fetch med hård timeout — så en seg/hängande request inte låser UI:t
  // (t.ex. portalens moln-team-hämtning). Kastar AbortError vid timeout.
  async function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms || 8000);
    try {
      return await fetch(url, Object.assign({}, options, { signal: ctrl.signal }));
    } finally {
      clearTimeout(timer);
    }
  }

  window.ATBClaude = { stream, collect, setTeam, fetchWithTimeout, providerFor, openrouterModels, encodeTeamLink, decodeTeamLink, MODEL_ID, MODEL_LABEL };
})();
