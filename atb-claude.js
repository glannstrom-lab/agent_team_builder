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

  // ── EN MODELL, INGA ALTERNATIV (beslutat 2026-08-05, bytt 2026-08-06) ──
  // Hela produkten kör GPT-OSS 120B via OpenRouter ($0,037/$0,170 per miljon
  // tokens). Bytet från DeepSeek V4 Flash gjordes efter mätning över hela
  // pipelinen: 9,1 s mot 241 s och 0,025 kr mot 0,076 kr per bygge — och
  // DeepSeek klarade inte sammanställningsstegets stora JSON alls.
  //
  // Konsekvenser att inte glömma:
  //  - Kunden har ingen egen nyckel. Allt går via /api/ai på vår.
  //  - Modellvalet är borta ur gränssnittet. Lägg inte tillbaka en
  //    dropdown utan att först ändra prisantagandena i index.html och
  //    villkor.html — de bygger på den här kostnadsnivån.
  //  - villkor.html § 3 och integritet.html § 3 beskriver vilken
  //    leverantör kundens data går till. Ändras raden nedan måste de med.
  const MODEL_ID = "openai/gpt-oss-120b"; // stabilt id: varken tilde-alias (~...-latest, uppdateras utan forvarning) eller datumsuffix (-0731, ruttnar)
  const MODEL_LABEL = "GPT-OSS 120B";

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
  // En väg (/api/ai), ett format (OpenAI-SSE). opts.model och opts.apiKey
  // ignoreras med flit — anropsställena får fortsätta skicka dem.
  // opts: { system, messages, maxTokens?, json?, schema?, team?, signal?, onDelta, onUsage? }
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
    // Varför svaret slutade. "length" betyder att modellen slog i maxTokens och
    // klipptes mitt i — strömmen avslutas då helt normalt, så utan den här
    // raden renderas och sparas ett halvt svar som om det vore färdigt. För ett
    // nyhetsbrev eller ett avtalsutkast läses den avklippta sista meningen som
    // avsiktlig, eller missas. Samma familj av tyst fel som B1: inget kraschar,
    // men det som visas är inte det som borde visas.
    let finishReason = null;
    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") return;
      try {
        const evt = JSON.parse(data);
        // ETT format. /api/ai skickar uppströmsbytena vidare orörda
        // (functions/api/ai.js:599), och uppströms är OpenRouter — alltså
        // OpenAI-format: {choices:[{delta:{content}}]}, där vissa rader är
        // tomma keep-alives. Proxyns egna felramar har formen
        // {error:{message}} och fångas av samma gren.
        //
        // Den gamla if/else-förgreningen mot Anthropic-format läste en
        // variabel `openrouter` som togs bort när nyckelvägen städades
        // (916166e). Kvar blev ett ReferenceError på FÖRSTA strömmade
        // raden: varje svar dog innan ett tecken nådde skärmen, i både
        // builder och portal. Lägg inte tillbaka en förgrening här utan
        // att först ge den något att förgrena på.
        const val = evt.choices && evt.choices[0];
        const delta = val && val.delta;
        if (delta && typeof delta.content === "string" && delta.content) onDelta(delta.content);
        else if (evt.error) throw new Error(evt.error.message || "Strömningsfel");
        if (val && val.finish_reason) finishReason = val.finish_reason;
        if (evt.usage) { used.input = evt.usage.prompt_tokens || 0; used.output = evt.usage.completion_tokens || 0; }
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
    // Avkapat svar: säg det, i stället för att låta kunden tro att den sista
    // halva meningen var meningen. Anroparen bestämmer hur det visas.
    if (finishReason === "length" && opts.onTruncated) {
      try { opts.onTruncated(); } catch (_) { /* en varning får aldrig fälla ett levererat svar */ }
    }
    return { used, finishReason };
  }

  // validateKey är borttagen 2026-08-06. Ingen kund har en egen nyckel, så
  // det finns inget att validera — och en kvarlämnad validering hade bara
  // gjort det lätt att återinföra nyckelvägen som en genväg förbi köpet.

  // Modellkatalogen är borttagen 2026-08-06. Den fanns för modellväljaren
  // och för kostnadsvisningen — modellen är låst sedan dess, och
  // kostnadsraden är borta. Kvar blev en hårdkodad stub med DeepSeeks gamla
  // priser plus en aldrig anropad hämtare mot OpenRouters katalog.

  // Icke-strömmande bekvämlighet: samlar hela svaret till en sträng.
  // Returnerar strängen som förut. Den som behöver veta om svaret klipptes av
  // skickar med onTruncated — collect kan inte lämna tillbaka två värden utan
  // att varje anropsställe skulle behöva skrivas om.
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

  // ---------- ladda ner en fil ----------
  // Bor här för att BÅDA ytorna ska använda samma, lagade version. Portalen
  // hade den rättade varianten och Buildern en egen trerading som råkat ut för
  // exakt de två fel kommentarerna nedan beskriver — samma sorts glidning som
  // den här filen finns för att förhindra.
  //
  // Två saker är inte pynt:
  //  1. Länken läggs in i dokumentet före klicket och plockas bort efteråt. En
  //     lös <a> som aldrig kopplats in ignoreras av vissa webbläsare, och då
  //     händer exakt ingenting när kunden klickar — verifierat i headless
  //     Chromium.
  //  2. revokeObjectURL fördröjs. Kallas den synkront direkt efter .click()
  //     hinner webbläsaren inte alltid börja läsa blobben, och nedladdningen
  //     avbryts tyst.
  function downloadFile(filename, text, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/markdown" }));
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    const url = a.href;
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
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

  window.ATBClaude = { stream, collect, setTeam, fetchWithTimeout, downloadFile, encodeTeamLink, decodeTeamLink, MODEL_ID, MODEL_LABEL };
})();
