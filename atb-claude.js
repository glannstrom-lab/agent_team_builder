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
  const ANTHROPIC_VERSION = "2023-06-01"; // uppdatera här när Anthropic byter version

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

  // Strömmar ett Claude-svar och anropar onDelta(text) för varje textbit.
  // opts: { apiKey, model, system, messages, maxTokens?, signal?, onDelta }
  async function stream(opts) {
    const { apiKey, model, system, messages, maxTokens, signal, onDelta } = opts;
    const res = await fetch(API_URL, {
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
        if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") onDelta(evt.delta.text);
        else if (evt.type === "error") throw new Error((evt.error && evt.error.message) || "Strömningsfel");
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

  window.ATBClaude = { stream, collect, fetchWithTimeout, API_URL, ANTHROPIC_VERSION };
})();
