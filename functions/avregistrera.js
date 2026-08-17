// GET /avregistrera?t=<token>
//
// Slår av veckobrevet. INGEN INLOGGNING — och det är avsiktligt: att kräva att
// kunden loggar in för att slippa ett mejl är att inte låta henne slippa det.
// Länken ligger i varje brev, den fungerar från vilken mejlklient som helst, och
// tokenen är 32 base62-tecken (≈190 bitar) så den går inte att gissa fram för
// någon annans adress.
//
// GET som ändrar tillstånd är normalt fult. Här är det rätt ändå: en
// avregistreringslänk MÅSTE fungera med ett klick i en mejlklient, och en del
// klienter förhandshämtar inte länkar men skickar heller inga POST. Ingreppet är
// litet och helt reversibelt i portalen, så avvägningen faller åt kundens sida.
// Tokenen är kravet som gör det försvarbart.
//
// Svaret är en HTML-sida, inte JSON: mottagaren är en människa i en webbläsare.
//
// DÄRFÖR ligger rutten INTE under /api/. functions/_middleware.js har ett
// skyddsnät som antar att ett HTML-svar under /api/ betyder "ingen Function
// matchade vägen" och byter det mot 404 — helt riktigt för ett JSON-API, men det
// hade tystat den här sidan. Upptäckt genom att köra den i emulatorn: rutten
// gjorde sitt jobb (raden uppdaterades) medan svaret ersattes med 404.
//
// Adressen är dessutom bättre så: den hamnar i ett mejl, där en människa kan
// hovra över den. `mittaiteam.se/avregistrera` läser bättre än
// `mittaiteam.se/api/digest/unsubscribe`.

const SIDA = (rubrik, text, ok) => `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${rubrik} · Mitt AI-team</title>
<meta name="robots" content="noindex, nofollow" />
<link rel="icon" type="image/svg+xml" href="/portal/icon.svg" />
<link rel="stylesheet" href="/fonts/fonts.css" />
<link rel="stylesheet" href="/site/showcase.css" />
<style>
  .u { max-width: 560px; margin: 0 auto; padding: 96px 24px; }
  .u h1 { font-size: clamp(26px, 5vw, 38px); font-weight: 800; letter-spacing: -0.025em; line-height: 1.1; margin: 12px 0 0; }
  .u p { color: var(--text-dim); font-size: 17px; margin: 18px 0 0; }
  .u .code { font-family: var(--font-mono); font-size: 12.5px; letter-spacing: .14em; text-transform: uppercase; color: ${ok ? "var(--accent-2)" : "#8F3F22"}; }
  .u .cta-row { display: flex; flex-wrap: wrap; gap: 13px; margin-top: 30px; }
</style>
</head>
<body>
<main class="u">
  <div class="code">${ok ? "Avregistrerad" : "Länken gick inte att använda"}</div>
  <h1>${rubrik}</h1>
  <p>${text}</p>
  <div class="cta-row">
    <a class="btn-lg btn-primary-lg" href="/portal/">Till portalen</a>
    <a class="btn-lg btn-ghost" href="/">Startsidan</a>
  </div>
</main>
</body>
</html>`;

const svar = (html, status) => new Response(html, {
  status,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
});

export async function onRequestGet(context) {
  const { env, request } = context;
  const token = new URL(request.url).searchParams.get("t") || "";

  // Formkontroll före databasen: en token av fel form är inte värd ett uppslag.
  if (!/^[0-9A-Za-z]{16,64}$/.test(token)) {
    return svar(SIDA(
      "Länken ser inte riktig ut",
      "Kontrollera att hela adressen följde med från mejlet — en del klienter bryter långa länkar. "
      + "Du kan också slå av veckobrevet i portalen.",
      false,
    ), 400);
  }

  try {
    // Idempotent med flit: en redan avregistrerad token ger samma svar som en
    // nyss avregistrerad. Kunden ska inte behöva undra om det tog.
    const r = await env.DB.prepare("UPDATE weekly_digest SET active = 0 WHERE token = ?").bind(token).run();
    const träffar = (r && r.meta && r.meta.changes) || 0;
    if (!träffar) {
      // Ingen rad: antingen okänd token eller en rad som hunnit tas bort. Vi
      // säger inte vilket — men vi säger det viktiga, att inget mer kommer.
      return svar(SIDA(
        "Vi hittade ingen prenumeration",
        "Antingen är den redan avregistrerad, eller så hör länken till ett konto som tagits bort. "
        + "Hur som helst skickas inga fler veckobrev till den adressen.",
        true,
      ), 200);
    }
  } catch (e) {
    console.error("[veckobrev] avregistrering misslyckades", String(e));
    return svar(SIDA(
      "Något gick fel hos oss",
      "Försök igen om en stund, eller slå av veckobrevet i portalen. Hör av dig till info@mittaiteam.se om det inte går.",
      false,
    ), 500);
  }

  return svar(SIDA(
    "Nu är veckobrevet avslaget",
    "Du får inga fler veckobrev för det teamet. Teamet självt påverkas inte — allt finns kvar i portalen, "
    + "och du kan slå på brevet igen därifrån när du vill.",
    true,
  ), 200);
}
