/* ============================================================
   Delad Claude-klient för Builder och Portal.
   Klassiskt skript som exponerar window.ATBClaude — samma mönster
   som avatars.js. Samlar SSE-strömningen och felhanteringen på ETT
   ställe så att builder/builder.js och portal/app.js inte kan glida
   isär (på samma sätt som Buildern hämtar prompts/ live för att inte
   glida från /build-team). Ingen state-koppling: allt skickas in.
   ============================================================ */
(function () {
  const API_URL = "https://api.anthropic.com/v1/messages";
  const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
  const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
  const ANTHROPIC_VERSION = "2023-06-01"; // uppdatera här när Anthropic byter version

  // Leverantör avgörs av nyckelns prefix: sk-ant- = Anthropic direkt,
  // sk-or- = OpenRouter (OpenAI-kompatibelt API, fler modeller att välja på).
  function providerFor(apiKey) {
    return (apiKey || "").startsWith("sk-or-") ? "openrouter" : "anthropic";
  }

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
        if (j && j.error && j.error.message) msg = j.error.message;
      } catch (_) { /* trasig JSON — behåll status-meddelandet */ }
    } else if (res.status >= 500) {
      msg = "Serverfel hos modell-API:t — försök igen om en stund.";
    }
    if (res.status === 401) msg = "Ogiltig API-nyckel. Kontrollera nyckeln under „Byt API-nyckel”.";
    if (res.status === 429) msg = "För många anrop just nu — vänta en stund och försök igen.";
    return msg;
  }

  // Strömmar ett svar och anropar onDelta(text) för varje textbit.
  // Väljer Anthropic- eller OpenRouter-format utifrån nyckelns prefix.
  // opts: { apiKey, model, system, messages, maxTokens?, signal?, onDelta }
  async function stream(opts) {
    const { apiKey, model, system, messages, maxTokens, signal, onDelta } = opts;
    const openrouter = providerFor(apiKey) === "openrouter";

    let res;
    if (openrouter) {
      // OpenAI-kompatibelt format: system som första message, Bearer-auth.
      const orMessages = system ? [{ role: "system", content: system }].concat(messages) : messages;
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        signal: signal || undefined,
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer " + apiKey,
          "HTTP-Referer": location.origin, // visas i OpenRouters statistik
          "X-Title": "Mitt AI-team",
        },
        body: JSON.stringify({ model, max_tokens: maxTokens || 4096, stream: true, messages: orMessages }),
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        signal: signal || undefined,
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model, max_tokens: maxTokens || 4096, stream: true, system, messages }),
      });
    }

    if (!res.ok) throw new Error(await errorMessage(res));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
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
        } else {
          if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") onDelta(evt.delta.text);
          else if (evt.type === "error") throw new Error((evt.error && evt.error.message) || "Strömningsfel");
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
  }

  // Hämtar OpenRouters modellkatalog (publik endpoint, ingen nyckel krävs)
  // och kurerar den till en dropdown-vänlig lista: Auto-routern först, sedan
  // alla Claude-modeller (produktens hemmaplan), sedan övriga flaggskepp.
  // Cachas i sessionStorage ett dygn så portalen inte hämtar i onödan.
  let orModelsPromise = null;
  async function openrouterModels() {
    if (orModelsPromise) return orModelsPromise;
    orModelsPromise = (async () => {
      const CACHE_KEY = "atb_or_models_v1";
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
      const models = [{ id: "openrouter/auto", name: "Auto — OpenRouter väljer modell" }]
        .concat(anthropic.map((m) => ({ id: m.id, name: m.name || m.id })))
        .concat(flagships.map((m) => ({ id: m.id, name: m.name || m.id })));
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

  window.ATBClaude = { stream, collect, fetchWithTimeout, providerFor, openrouterModels, API_URL, ANTHROPIC_VERSION };
})();
