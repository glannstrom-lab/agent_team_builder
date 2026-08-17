// Klockan för veckobrevet — och ingenting annat.
//
// Varför den finns som en EGEN worker: Cloudflare Pages Functions kan inte
// schemaläggas. Cron Triggers finns bara på Workers. Resten av projektet är
// Pages, och där bor D1-bindningen, mejlsändaren och modellanropet — så det
// enda som saknades var en klocka.
//
// Workern är avsiktligt dum. Den vet ingenting om team, planer, tak eller
// mejltexter; den fetchar `/api/digest/run` med en delad hemlighet och loggar
// utfallet. Det gör att all logik går att testa som vanliga Pages Functions, och
// att en ändring i veckobrevet aldrig kräver en ny deploy av två saker.
//
// Deploy (en gång, separat från Pages):
//   cd worker-veckobrev
//   npx wrangler@4.123.0 secret put DIGEST_SECRET
//   npx wrangler@4.123.0 deploy
//
// Samma DIGEST_SECRET måste finnas som Pages-secret på huvudprojektet, annars
// svarar rutten 401.

const RUTT = "https://mittaiteam.se/api/digest/run";

async function kör(env, varifrån) {
  if (!env.DIGEST_SECRET) {
    console.error("[klocka] DIGEST_SECRET saknas — kör inget");
    return { ok: false, error: "no secret" };
  }
  try {
    const res = await fetch(RUTT, {
      method: "POST",
      headers: {
        authorization: "Bearer " + env.DIGEST_SECRET,
        "content-type": "application/json",
      },
    });
    const text = await res.text();
    // Utfallet loggas alltid, båda vägarna. En tyst klocka är samma problem som
    // D3 handlade om: felet finns men ingen ser det.
    if (!res.ok) {
      console.error(`[klocka] ${varifrån}: rutten svarade ${res.status}`, text.slice(0, 300));
      return { ok: false, status: res.status, body: text.slice(0, 300) };
    }
    console.log(`[klocka] ${varifrån}: ${text.slice(0, 300)}`);
    return { ok: true, body: text.slice(0, 300) };
  } catch (e) {
    console.error(`[klocka] ${varifrån}: anropet gick inte fram`, String(e));
    return { ok: false, error: String(e) };
  }
}

export default {
  // Cron. Körs varje timme (se wrangler.toml) — rutten avgör själv vilka som
  // ska ha brev just i dag, och `last_sent_day` gör att ingen får två. Att köra
  // ofta i stället för exakt en gång är med flit: missar en körning på grund av
  // ett tillfälligt fel tar nästa timme hand om det.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(kör(env, "cron " + event.cron));
  },

  // Manuell knuff, för att kunna prova utan att vänta på klockan. Kräver samma
  // hemlighet som rutten — workern är publik, hemligheten är inte det.
  async fetch(request, env) {
    const auth = request.headers.get("authorization") || "";
    if (!env.DIGEST_SECRET || auth !== "Bearer " + env.DIGEST_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const r = await kör(env, "manuell knuff");
    return new Response(JSON.stringify(r), {
      status: r.ok ? 200 : 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};
