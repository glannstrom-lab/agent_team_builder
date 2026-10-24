// /mcp — MCP-servern som Claude och ChatGPT kopplar till (SP21, 2026-10-24).
//
// Transport: Streamable HTTP utan sessioner. Varje POST bär ett JSON-RPC-
// meddelande och får ett JSON-svar; inga strömmar behövs, för inget verktyg
// här tar tid. GET (serverinitierad ström) stöds inte och svarar 405, vilket
// specen tillåter.
//
// Jobben (SP21):
//   lista_jobb      vad som ligger i kundens team
//   hamta_jobb      jobbkortet: uppdrag, kund, "Klart när", agentens instruktion
//   lamna_leverans  leveransen tillbaka till portalen, för kundens godkännande
//   skapa_jobb      ett nytt jobb åt en agent, t.ex. ur ett samtal i plattformen
//
// Det delade (SP23, Mikael 2026-10-24: "claude och chatgpt behöver kunna komma
// åt allt på vår sida ... vill inte behöva skriva samma saker till båda
// sidorna"):
//   firman            översikten: teamet, rutinerna, minnet, underlagen, kunderna, jobben
//   hamta_agent       en agents hela instruktion, för att arbeta i dess roll
//   hamta_underlag    ett underlags fulla text
//   spara_minne       lägg till fakta i företagsminnet
//   spara_underlag    spara ett dokument som underlag för hela teamet
//   lista_kunder      organisationerna och kontakterna, med jobben
//   spara_organisation / spara_kontakt
// Kräver ett samtycke från efter SP23 (scope "firma"); en äldre koppling får
// ett tydligt besked om att koppla om.
//
// Plattformen kan inte godkänna, ta bort något eller läsa samtalen i
// portalen. Det som ska bli klart blir klart i portalen, av kunden.

import { nowMs, randomHex } from "./api/auth/_lib.js";
import {
  bearer, aktivaTeam, parseKlartNar, lookupClient, clientLabel, resourceMetadataUrl,
  jsonOut, preflight, STATUS_TEXT, LEVERANS_MAX, SCOPE, harFirma,
} from "./api/_koppling.js";
import { läsFirma, läggTillMinne, sparaPost, nyttId, UNDERLAG_MAX } from "./api/_firma.js";
import { FAKTA_SE } from "./api/_fakta.js";

const PROTOKOLL = ["2025-11-25", "2025-06-18", "2025-03-26"];

const INSTRUKTIONER =
  "Mitt AI-team är kundens kontor: hennes team av AI-kollegor, företagsminnet, underlagen, kunderna och jobben. " +
  "Kunden använder både Mitt AI-team och dig och vill inte behöva berätta samma sak två gånger. Därför: " +
  "(1) Läs firman i början av ett samtal som rör kundens verksamhet — där står vad du behöver veta om henne. " +
  "(2) När kunden berättar något bestående om verksamheten — ett beslut, en kund, ett pris, en vana — spara det med spara_minne, " +
  "spara_organisation eller spara_kontakt, och säg kort att du gjort det. Spara inget kunden inte sagt. " +
  "(3) Ett jobb hör till en agent och görs i agentens roll: hämta jobbkortet med hamta_jobb, följ instruktionen, bocka av 'Klart när' " +
  "och lämna resultatet med lamna_leverans. Kunden godkänner leveransen i Mitt AI-team — säg det när du är klar. " +
  "(4) Gäller frågan svenska regler, belopp eller datum (ROT, moms, representation, påminnelseavgift …): slå upp med svenska_regler först och ange källan. Står regeln inte där, säg att du inte är säker.";

export const VERKTYG = [
  {
    name: "lista_jobb",
    title: "Lista jobben",
    description: "Listar jobben i kundens team i Mitt AI-team, med id, rubrik, ansvarig agent, kund och status. Börja här när kunden ber dig ta ett jobb.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["oppen", "levererad", "godkand", "alla"], description: "Vilka jobb som visas. Standard: oppen." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "hamta_jobb",
    title: "Hämta ett jobbkort",
    description: "Hämtar hela jobbkortet: uppdraget, vem jobbet är åt, punkterna under 'Klart när' och instruktionen för den agent vars roll du ska ta. Läs det innan du gör jobbet.",
    inputSchema: {
      type: "object",
      properties: { jobb_id: { type: "string", description: "Jobbets id från lista_jobb." } },
      required: ["jobb_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "lamna_leverans",
    title: "Lämna leveransen",
    description: "Lämnar det färdiga resultatet på ett jobb till Mitt AI-team. Leveransen hamnar hos kunden för granskning och godkännande. Lämnas en ny leverans ersätter den den förra, så länge jobbet inte är godkänt.",
    inputSchema: {
      type: "object",
      properties: {
        jobb_id: { type: "string", description: "Jobbets id." },
        leverans: { type: "string", description: "Hela resultatet, i markdown. Det är det kunden läser och godkänner." },
        kommentar: { type: "string", description: "Valfritt: kort notering till kunden, t.ex. antaganden du gjort." },
      },
      required: ["jobb_id", "leverans"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    // OL8: ben 3 i kundens egen AI. Offentliga regler, inga kunddata — därför
    // öppet för varje koppling, också en från före SP23.
    name: "svenska_regler",
    title: "Svenska regler (kontrollerade)",
    description: "Slår upp svenska regler för småföretag — ROT/RUT, moms, representation, påminnelseavgift, dröjsmålsränta, förmåner, deklarationsdatum m.m. — kontrollerade mot Skatteverket, riksdagen.se och andra primärkällor, med källa och datum. Använd före du svarar på en fråga om svenska belopp, gränser eller datum, och ange källan. Står regeln inte här: säg att du inte är säker i stället för att gissa.",
    inputSchema: { type: "object", properties: { fraga: { type: "string", description: "Vad det gäller, t.ex. 'rotavdrag bostadsrätt' eller 'julgåva'. Tomt = lista alla ämnen." } }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "skapa_jobb",
    title: "Lägg upp ett jobb",
    description: "Lägger upp ett nytt jobb åt en agent i kundens team, så att det syns i agentens rum i Mitt AI-team. Använd när kunden ber dig lägga något på någons bord. Gör det inte på eget initiativ.",
    inputSchema: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agentens namn eller id, som de står i firman." },
        titel: { type: "string", description: "Kort rubrik, t.ex. 'Offert: badrum Villa Ek'." },
        uppdrag: { type: "string", description: "Vad som ska göras, med det underlag kunden gett." },
        kund: { type: "string", description: "Valfritt: organisationen eller personen jobbet görs åt." },
        klart_nar: { type: "array", items: { type: "string" }, description: "Valfritt: punkter som avgör när jobbet är klart." },
        foretag: { type: "string", description: "Valfritt: företagets namn, om kontot har flera team." },
      },
      required: ["agent", "titel", "uppdrag"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
];

// Det delade (SP23). Listan står för sig så att tools/list kan visa den bara
// för en koppling som fått samtycke till den.
const FÖRETAG = { foretag: { type: "string", description: "Valfritt: företagets namn, om kontot har flera team." } };
export const VERKTYG_FIRMA = [
  {
    name: "firman",
    title: "Firman i Mitt AI-team",
    description: "Översikten över kundens företag: teamet av AI-kollegor och vad var och en gör, veckans rutiner, hela företagsminnet, underlagen (rubriker), kunderna och jobben. Läs den först när ett samtal rör kundens verksamhet, så slipper kunden förklara det igen.",
    inputSchema: { type: "object", properties: { ...FÖRETAG }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "hamta_agent",
    title: "Hämta en agents instruktion",
    description: "Hämtar hela instruktionen för en agent i kundens team — perspektiv, leverans och gränser — så att du kan arbeta i den agentens roll.",
    inputSchema: { type: "object", properties: { agent: { type: "string", description: "Agentens namn eller id." }, ...FÖRETAG }, required: ["agent"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "hamta_underlag",
    title: "Hämta ett underlag",
    description: "Hämtar hela texten i ett av kundens underlag (dokument som kunden lagt in för teamet). Id:t står i firman.",
    inputSchema: { type: "object", properties: { underlag_id: { type: "string" }, ...FÖRETAG }, required: ["underlag_id"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "spara_minne",
    title: "Spara i företagsminnet",
    description: "Lägger till fakta i kundens företagsminne, som alla agenter i Mitt AI-team läser. En rad per fakta, kort och i kundens ord: beslut, priser, vanor, vem som bestämmer. Spara bara det kunden sagt eller bekräftat.",
    inputSchema: { type: "object", properties: { rader: { type: "array", items: { type: "string" }, description: "En eller flera rader att lägga till." }, ...FÖRETAG }, required: ["rader"], additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "spara_underlag",
    title: "Spara ett underlag",
    description: "Sparar ett dokument som underlag för hela teamet i Mitt AI-team — t.ex. en prislista, en mall eller ett avtal kunden gett dig. Med underlag_id ersätts ett befintligt underlag.",
    inputSchema: {
      type: "object",
      properties: { titel: { type: "string" }, text: { type: "string", description: "Hela texten, i markdown." }, underlag_id: { type: "string", description: "Valfritt: ersätt detta underlag." }, ...FÖRETAG },
      required: ["titel", "text"], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "lista_kunder",
    title: "Lista kunderna",
    description: "Listar kundens organisationer (kommuner, föreningar, företag, privatpersoner) och kontakter (människor), med anteckningar och jobben som gjorts åt dem.",
    inputSchema: { type: "object", properties: { ...FÖRETAG }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "spara_organisation",
    title: "Spara en organisation",
    description: "Lägger till eller uppdaterar en organisation i kundens kundregister. Finns en organisation med samma namn uppdateras den.",
    inputSchema: {
      type: "object",
      properties: {
        namn: { type: "string" }, typ: { type: "string", description: "Företag, Förening, Kommun, Myndighet, Privatperson eller Annan." },
        anteckning: { type: "string", description: "Det som är värt att minnas: avtal, vem som bestämmer, hur de vill bli kontaktade." }, ...FÖRETAG,
      },
      required: ["namn"], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "spara_kontakt",
    title: "Spara en kontakt",
    description: "Lägger till eller uppdaterar en kontakt (en människa) i kundens kundregister. Finns en kontakt med samma namn uppdateras den. Organisationen skapas om den inte finns.",
    inputSchema: {
      type: "object",
      properties: {
        namn: { type: "string" }, roll: { type: "string" }, organisation: { type: "string", description: "Organisationens namn." },
        anteckning: { type: "string", description: "T.ex. 'nås bäst före 08, föredrar sms'." }, ...FÖRETAG,
      },
      required: ["namn"], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const fel = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });
const text = (t, isError = false) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });

function unauthorized(request, description) {
  return jsonOut(
    { jsonrpc: "2.0", id: null, error: { code: -32001, message: description } },
    401,
    { "www-authenticate": `Bearer resource_metadata="${resourceMetadataUrl(request)}", scope="${SCOPE}"` }
  );
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return jsonOut(fel(null, -32603, "databasen är inte kopplad"), 500);

  // Nyckeln kontrolleras före allt annat — även initialize. Utan 401 här
  // startar Claude aldrig inloggningen.
  const vem = await bearer(db, request);
  if (!vem) return unauthorized(request, "Logga in för att koppla Mitt AI-team.");

  let msg;
  try { msg = await request.json(); } catch (_) { return jsonOut(fel(null, -32700, "Ogiltig JSON."), 400); }

  const ctx = { db, vem, request };
  if (Array.isArray(msg)) {
    const svar = (await Promise.all(msg.map((m) => hantera(ctx, m)))).filter(Boolean);
    return svar.length ? jsonOut(svar) : new Response(null, { status: 202 });
  }
  const svar = await hantera(ctx, msg);
  return svar ? jsonOut(svar) : new Response(null, { status: 202 });
}

export const onRequestGet = () => jsonOut(fel(null, -32000, "Ingen ström här: använd POST."), 405, { allow: "POST, OPTIONS" });
export const onRequestOptions = () => preflight();

async function hantera(ctx, msg) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return fel(msg?.id ?? null, -32600, "Ogiltig begäran.");
  const id = msg.id;
  const harId = id !== undefined && id !== null;
  // Notiser (utan id) får inget svar.
  if (!harId) return null;

  switch (msg.method) {
    case "initialize": {
      const begärd = msg.params && msg.params.protocolVersion;
      return ok(id, {
        protocolVersion: PROTOKOLL.includes(begärd) ? begärd : PROTOKOLL[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "mitt-ai-team", title: "Mitt AI-team", version: "1.0.0" },
        instructions: INSTRUKTIONER,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      // En koppling från före SP23 sa ja till att läsa och leverera jobb — inte
      // till att lägga upp dem eller nå minnet. Den ser bara det den sa ja till.
      return ok(id, { tools: harFirma(ctx.vem) ? [...VERKTYG_FIRMA, ...VERKTYG] : VERKTYG.filter((t) => t.name !== "skapa_jobb") });
    case "tools/call": {
      const namn = msg.params && msg.params.name;
      const args = (msg.params && msg.params.arguments) || {};
      try {
        if (namn === "lista_jobb") return ok(id, await listaJobb(ctx, args));
        if (namn === "hamta_jobb") return ok(id, await hamtaJobb(ctx, args));
        if (namn === "lamna_leverans") return ok(id, await lamnaLeverans(ctx, args));
        if (namn === "svenska_regler") return ok(id, svenskaRegler(args));
        const firmaFn = FIRMA_VERKTYG[namn];
        if (firmaFn) {
          if (!harFirma(ctx.vem)) return ok(id, text("Kopplingen gjordes innan Mitt AI-team delade minnet, underlagen och kunderna. Be kunden koppla bort och lägga till Mitt AI-team igen i inställningarna — då ser hen vad som delas och kan säga ja.", true));
          return ok(id, await firmaFn(ctx, args));
        }
      } catch (e) {
        return ok(id, text("Något gick fel i Mitt AI-team. Försök igen om en stund.", true));
      }
      return fel(id, -32602, `Okänt verktyg: ${namn}`);
    }
    default:
      return fel(id, -32601, `Okänd metod: ${msg.method}`);
  }
}

// ── verktygen ─────────────────────────────────────────────────────────────

async function teamKarta(ctx) {
  const team = await aktivaTeam(ctx.db, ctx.vem.userId);
  return new Map(team.map((t) => [t.slug, t]));
}

const agentAv = (team, agentId) => team.agents.find((a) => a.id === agentId) || null;

// Jobbet om användaren når det, annars null. Samma svar på "finns inte" som på
// "du når det inte" — annars går det att prova sig fram till andras jobb-id.
async function nåJobb(ctx, jobbId) {
  const id = String(jobbId || "").trim();
  if (!/^[a-z0-9_]{6,64}$/i.test(id)) return null;
  const row = await ctx.db.prepare("SELECT * FROM jobs WHERE id = ?1").bind(id).first();
  if (!row) return null;
  const team = (await teamKarta(ctx)).get(row.team_slug);
  return team ? { row, team } : null;
}

async function listaJobb(ctx, args) {
  const status = ["oppen", "levererad", "godkand", "alla"].includes(args.status) ? args.status : "oppen";
  const team = await teamKarta(ctx);
  if (!team.size) return text("Kontot har inget team som är igång i Mitt AI-team.");
  const slugs = [...team.keys()];
  const plats = slugs.map((_, i) => `?${i + 1}`).join(", ");
  const villkor = status === "alla" ? "status != 'avbruten'" : `status = '${status}'`;
  const { results } = await ctx.db.prepare(
    `SELECT id, team_slug, agent_id, title, kund, status, created_at FROM jobs WHERE team_slug IN (${plats}) AND ${villkor} ORDER BY created_at DESC LIMIT 50`
  ).bind(...slugs).all();
  const rader = results || [];
  if (!rader.length) {
    return text(status === "oppen"
      ? "Inga öppna jobb just nu. Kunden lägger upp jobb i Mitt AI-team, i den anställdes rum."
      : "Inga jobb med den statusen.");
  }
  const rad = (j) => {
    const t = team.get(j.team_slug);
    const a = agentAv(t, j.agent_id);
    return `- **${j.title}** (id: \`${j.id}\`)\n  ${t.company} · ${a ? a.name : j.agent_id}${j.kund ? " · åt " + j.kund : ""} · ${STATUS_TEXT[j.status] || j.status}`;
  };
  return text(`${rader.length} jobb:\n\n${rader.map(rad).join("\n")}\n\nHämta ett jobbkort med hamta_jobb innan du börjar.`);
}

async function hamtaJobb(ctx, args) {
  const nått = await nåJobb(ctx, args.jobb_id);
  if (!nått) return text("Hittade inget jobb med det id:t i kundens team. Använd lista_jobb.", true);
  const { row, team } = nått;
  const agent = agentAv(team, row.agent_id);
  const klart = parseKlartNar(row.klart_nar);

  // Bokför att kortet hämtats — kunden ser då i portalen att jobbet nått
  // plattformen. Det är allt: hämtat betyder inte att någon arbetar.
  const client = await lookupClient(ctx.db, ctx.vem.clientId);
  await ctx.db.prepare("UPDATE jobs SET hamtad_at = ?1, hamtad_av = ?2 WHERE id = ?3")
    .bind(nowMs(), clientLabel(client), row.id).run();

  const delar = [
    `# ${row.title}`,
    `**Företag:** ${team.company}`,
    `**Status:** ${STATUS_TEXT[row.status] || row.status}`,
    row.kund ? `**Åt:** ${row.kund}` : null,
    `## Uppdraget\n${row.brief}`,
    klart.length ? `## Klart när\n${klart.map((k) => `- [ ] ${k}`).join("\n")}` : null,
    agent
      ? `## Din roll: ${agent.name}${agent.role ? ` (${agent.role})` : ""}\nGör jobbet som den här agenten i ${team.company}s team. Agentens instruktion:\n\n${agent.system || ""}`
      : null,
    row.leverans ? `## Förra leveransen (${row.levererad_via || "okänd"})\n${row.leverans}` : null,
    `## När du är klar\nLämna resultatet med lamna_leverans (jobb_id: \`${row.id}\`). ${team.company} granskar och godkänner det i Mitt AI-team.`,
  ];
  if (row.status === "godkand" || row.status === "avbruten") {
    delar.splice(2, 0, "> Jobbet är redan " + (row.status === "godkand" ? "godkänt" : "avbrutet") + " och tar inte emot fler leveranser.");
  }
  return text(delar.filter(Boolean).join("\n\n"));
}

async function lamnaLeverans(ctx, args) {
  const nått = await nåJobb(ctx, args.jobb_id);
  if (!nått) return text("Hittade inget jobb med det id:t i kundens team. Använd lista_jobb.", true);
  const { row, team } = nått;
  if (row.status === "godkand") return text("Jobbet är redan godkänt av kunden och tar inte emot fler leveranser.", true);
  if (row.status === "avbruten") return text("Kunden har avbrutit jobbet.", true);

  let leverans = typeof args.leverans === "string" ? args.leverans.trim() : "";
  if (!leverans) return text("Leveransen är tom.", true);
  if (leverans.length > LEVERANS_MAX) return text(`Leveransen är för lång (högst ${LEVERANS_MAX} tecken). Korta den eller dela upp jobbet.`, true);
  const kommentar = typeof args.kommentar === "string" ? args.kommentar.trim().slice(0, 2000) : "";
  if (kommentar) leverans += `\n\n---\n*Kommentar:* ${kommentar}`;

  const client = await lookupClient(ctx.db, ctx.vem.clientId);
  const via = clientLabel(client);
  const t = nowMs();
  await ctx.db.prepare(
    "UPDATE jobs SET leverans = ?1, levererad_via = ?2, levererad_at = ?3, status = 'levererad', updated_at = ?3 WHERE id = ?4 AND status IN ('oppen','levererad')"
  ).bind(leverans, via, t, row.id).run();
  return text(`Leveransen ligger nu hos ${team.company} i Mitt AI-team för granskning. Säg till kunden att den väntar på godkännande där.`);
}

// ── det delade (SP23) ─────────────────────────────────────────────────────

const nyckel = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Vilket team verktyget gäller. Ett konto har oftast ett; har det flera väljs
// det som heter `foretag`, annars det senast skapade. Svaret säger alltid
// vilket företag det gällde, så att ett fel val syns direkt.
async function välj(ctx, args) {
  const team = await aktivaTeam(ctx.db, ctx.vem.userId);
  if (!team.length) return { fel: text("Kontot har inget team som är igång i Mitt AI-team.", true) };
  const önskat = nyckel(args && args.foretag);
  if (önskat) {
    const t = team.find((x) => nyckel(x.company) === önskat || x.slug === args.foretag) || team.find((x) => nyckel(x.company).includes(önskat));
    if (!t) return { fel: text(`Hittade inget team som heter "${args.foretag}". Kontot har: ${team.map((x) => x.company).join(", ")}.`, true) };
    return { team: t, alla: team };
  }
  return { team: team[0], alla: team };
}

const agentFör = (team, namn) => {
  const k = nyckel(namn);
  if (!k) return null;
  return team.agents.find((a) => a.id === namn) || team.agents.find((a) => nyckel(a.name) === k) || team.agents.find((a) => nyckel(a.name).includes(k)) || null;
};
const DAGNAMN = ["", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
const avVem = async (ctx) => clientLabel(await lookupClient(ctx.db, ctx.vem.clientId));
// En anteckning läggs till det som redan står, i stället för att skriva över det.
const påNot = (gammal, ny) => (ny == null || ny === "" ? (gammal || "") : gammal && !gammal.includes(ny) ? gammal + "\n" + ny : ny);

async function firman(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const { team, alla } = v;
  const f = await läsFirma(ctx.db, team.slug);
  const { results } = await ctx.db.prepare(
    "SELECT id, agent_id, title, kund, status FROM jobs WHERE team_slug = ?1 AND status IN ('oppen','levererad') ORDER BY updated_at DESC LIMIT 30"
  ).bind(team.slug).all();
  const jobb = results || [];
  const agent = (a) => `- **${a.name}**${a.id === team.entryAgent ? " (VD-assistent, kundens närmaste stöd)" : ""} — ${a.tagline || a.role || ""} (id: \`${a.id}\`)`;
  const delar = [
    `# ${team.company}`,
    alla.length > 1 ? `_Kontot har flera team (${alla.map((x) => x.company).join(", ")}). Ange foretag för att välja ett annat._` : null,
    `## Teamet\nKunden är VD. Hennes AI-kollegor:\n${team.agents.map(agent).join("\n")}\nHämta en agents hela instruktion med hamta_agent.`,
    team.routines.length ? `## Veckans rutiner\n${team.routines.map((r) => `- ${r.day ? DAGNAMN[r.day] + ": " : ""}${r.label}`).join("\n")}` : null,
    `## Företagsminnet\n${f.minne.text.trim() || "_Tomt än. Spara det kunden berättar om verksamheten med spara_minne._"}`,
    `## Underlag\n${f.underlag.length ? f.underlag.map((u) => `- **${u.title}** (id: \`${u.id}\`, ${u.text.length} tecken${u.on === false ? ", avstängt i portalen" : ""})`).join("\n") + "\nHämta texten med hamta_underlag." : "_Inga underlag än._"}`,
    `## Kunderna\n${f.org.length} organisationer och ${f.kontakt.length} kontakter. Se dem med lista_kunder.`,
    `## Jobben\n${jobb.length ? jobb.map((j) => `- **${j.title}** (id: \`${j.id}\`) — ${(agentAv(team, j.agent_id) || { name: j.agent_id }).name}${j.kund ? " · åt " + j.kund : ""} · ${STATUS_TEXT[j.status] || j.status}`).join("\n") : "_Inga öppna jobb._"}`,
  ];
  return text(delar.filter(Boolean).join("\n\n"));
}

async function hamtaAgent(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const a = agentFör(v.team, args.agent);
  if (!a) return text(`Ingen agent heter "${args.agent}" i ${v.team.company}s team. Agenterna står i firman.`, true);
  return text([
    `# ${a.name}${a.role ? ` (${a.role})` : ""} — ${v.team.company}`,
    a.job ? `**Jobbet:** ${a.job}` : null,
    `## Instruktionen\n${a.system || ""}`,
    `## Så här arbetar du i rollen\nSvara som ${a.name} skulle. Företagsminnet och underlagen i firman gäller också dig. Blir något ett jobb kunden ska godkänna: lämna det med lamna_leverans på jobbet, eller lägg upp jobbet med skapa_jobb om kunden ber om det.`,
  ].filter(Boolean).join("\n\n"));
}

async function hamtaUnderlag(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const u = (await läsFirma(ctx.db, v.team.slug)).underlag.find((x) => x.id === args.underlag_id);
  if (!u) return text("Hittade inget underlag med det id:t. Id:n står i firman.", true);
  return text(`# ${u.title}\n\n${u.text}`);
}

async function sparaMinneV(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const rader = (Array.isArray(args.rader) ? args.rader : [args.rader]).map((r) => String(r || "").trim().slice(0, 500)).filter(Boolean).slice(0, 30);
  if (!rader.length) return text("Inget att spara.", true);
  const r = await läggTillMinne(ctx.db, v.team.slug, rader, await avVem(ctx));
  if (r.fel) return text(r.fel, true);
  return text(r.tillagda
    ? `Sparat i ${v.team.company}s företagsminne (${r.tillagda} ${r.tillagda === 1 ? "rad" : "rader"}). Alla agenter i Mitt AI-team läser det från och med nu.`
    : "Det stod redan i företagsminnet.");
}

async function sparaUnderlagV(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const t = typeof args.text === "string" ? args.text : "";
  if (t.length > UNDERLAG_MAX) return text(`Underlaget är för långt (högst ${UNDERLAG_MAX} tecken). Dela upp det.`, true);
  const f = await läsFirma(ctx.db, v.team.slug);
  const id = args.underlag_id && f.underlag.some((u) => u.id === args.underlag_id) ? args.underlag_id : nyttId("u_");
  const r = await sparaPost(ctx.db, v.team.slug, "underlag", id, { title: args.titel, text: t, on: true }, await avVem(ctx));
  if (r.fel) return text(r.fel, true);
  return text(`Underlaget "${r.post.title}" ligger nu hos ${v.team.company} i Mitt AI-team (id: \`${id}\`). Agenterna där läser det.`);
}

async function listaKunder(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const f = await läsFirma(ctx.db, v.team.slug);
  const { results } = await ctx.db.prepare("SELECT title, kund, status FROM jobs WHERE team_slug = ?1 AND kund IS NOT NULL AND status != 'avbruten' ORDER BY updated_at DESC LIMIT 200").bind(v.team.slug).all();
  const jobb = results || [];
  if (!f.org.length && !f.kontakt.length && !jobb.length) return text(`${v.team.company} har inga kunder i registret än. Spara dem med spara_organisation och spara_kontakt när kunden nämner dem.`);
  const orgRad = (o) => {
    const folk = f.kontakt.filter((k) => k.org === o.id);
    const j = jobb.filter((x) => nyckel(x.kund) === nyckel(o.namn));
    return [`### ${o.namn}${o.typ ? ` (${o.typ})` : ""}`, o.not || null,
      folk.length ? "Kontakter: " + folk.map((k) => `${k.namn}${k.roll ? ", " + k.roll : ""}${k.not ? " — " + k.not : ""}`).join("; ") : null,
      j.length ? "Jobb: " + j.map((x) => `${x.title} (${STATUS_TEXT[x.status] || x.status})`).join("; ") : null].filter(Boolean).join("\n");
  };
  const utanOrg = f.kontakt.filter((k) => !k.org || !f.org.some((o) => o.id === k.org));
  const kända = new Set(f.org.map((o) => nyckel(o.namn)));
  const okända = [...new Set(jobb.map((j) => j.kund).filter((k) => !kända.has(nyckel(k))))];
  return text([
    `# Kunderna — ${v.team.company}`,
    f.org.map(orgRad).join("\n\n") || null,
    utanOrg.length ? "### Kontakter utan organisation\n" + utanOrg.map((k) => `- ${k.namn}${k.roll ? ", " + k.roll : ""}${k.not ? " — " + k.not : ""}`).join("\n") : null,
    okända.length ? "### Kunder på jobb som inte står i registret\n" + okända.map((k) => `- ${k}`).join("\n") : null,
  ].filter(Boolean).join("\n\n"));
}

// tyst = anropad inifrån spara_kontakt: returnerar posten i stället för text.
async function sparaOrg(ctx, args, tyst) {
  const v = await välj(ctx, args); if (v.fel) return tyst ? { fel: "Inget team." } : v.fel;
  const f = await läsFirma(ctx.db, v.team.slug);
  const finns = f.org.find((o) => nyckel(o.namn) === nyckel(args.namn));
  const data = { namn: args.namn, typ: args.typ || (finns ? finns.typ : ""), not: påNot(finns && finns.not, args.anteckning) };
  const r = await sparaPost(ctx.db, v.team.slug, "org", finns ? finns.id : nyttId("o"), data, await avVem(ctx));
  if (tyst) return r;
  if (r.fel) return text(r.fel, true);
  return text(`${finns ? "Uppdaterade" : "Lade till"} ${r.post.namn} i ${v.team.company}s kundregister.`);
}

async function sparaKontakt(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  let orgId = "";
  if (args.organisation) {
    const o = await sparaOrg(ctx, { namn: args.organisation, foretag: args.foretag }, true);
    if (o.fel) return text(o.fel, true);
    orgId = o.post.id;
  }
  const f = await läsFirma(ctx.db, v.team.slug);
  const finns = f.kontakt.find((k) => nyckel(k.namn) === nyckel(args.namn));
  const data = {
    namn: args.namn, roll: args.roll || (finns ? finns.roll : ""), org: orgId || (finns ? finns.org : ""),
    not: påNot(finns && finns.not, args.anteckning),
  };
  const r = await sparaPost(ctx.db, v.team.slug, "kontakt", finns ? finns.id : nyttId("p"), data, await avVem(ctx));
  if (r.fel) return text(r.fel, true);
  return text(`${finns ? "Uppdaterade" : "Lade till"} ${r.post.namn}${args.organisation ? " på " + args.organisation : ""} i ${v.team.company}s kundregister.`);
}

async function skapaJobb(ctx, args) {
  const v = await välj(ctx, args); if (v.fel) return v.fel;
  const a = agentFör(v.team, args.agent);
  if (!a) return text(`Ingen agent heter "${args.agent}" i ${v.team.company}s team. Agenterna står i firman.`, true);
  const kort = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : "");
  const titel = kort(args.titel, 140), uppdrag = kort(args.uppdrag, 8000);
  if (!titel || !uppdrag) return text("Jobbet behöver en titel och ett uppdrag.", true);
  const klart = (Array.isArray(args.klart_nar) ? args.klart_nar : []).map((k) => kort(k, 300)).filter(Boolean).slice(0, 12);
  const t = nowMs();
  const räknat = await ctx.db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE team_slug = ?1 AND created_at > ?2").bind(v.team.slug, t - 86_400_000).first();
  if (räknat && räknat.n >= 200) return text("För många nya jobb i dag.", true);
  const id = "job_" + randomHex(12);
  await ctx.db.prepare(
    "INSERT INTO jobs (id, team_slug, agent_id, title, brief, kund, klart_nar, status, created_by, created_at, updated_at) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'oppen', ?8, ?9, ?9)"
  ).bind(id, v.team.slug, a.id, titel, uppdrag, kort(args.kund, 200) || null, JSON.stringify(klart), ctx.vem.userId, t).run();
  return text(`Jobbet "${titel}" ligger nu på ${a.name}s skrivbord i Mitt AI-team (id: \`${id}\`).`);
}

const FIRMA_VERKTYG = {
  firman, hamta_agent: hamtaAgent, hamta_underlag: hamtaUnderlag, spara_minne: sparaMinneV, spara_underlag: sparaUnderlagV,
  lista_kunder: listaKunder, spara_organisation: (ctx, a) => sparaOrg(ctx, a, false), spara_kontakt: sparaKontakt, skapa_jobb: skapaJobb,
};

// ── svenska regler (OL8) ──────────────────────────────────────────────────
// Samma faktabas som portalens systemprompter (functions/api/_fakta.js). En
// enkel ordmatchning räcker: sexton regler, och plattformen formulerar frågan.
// Ämnet väger tyngre än texten, så att "julgåva" hittar julgåvan och inte
// varje regel som nämner ordet i förbigående.
const FAKTA_ÅLDER_MAX = 396; // dagar — samma vakt som test/portal.mjs (13 månader)
const SMÅORD = new Set(["när", "ska", "jag", "för", "och", "det", "som", "med", "kan", "hur", "vad", "får", "till", "man", "vår", "våra", "min", "mitt", "mina", "inte", "har", "hos"]);
const ordI = (s) => String(s || "").toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ").split(" ").filter((w) => w.length >= 3 && !SMÅORD.has(w));

export function svenskaRegler(args, nu = Date.now()) {
  const f = FAKTA_SE;
  const ålder = (nu - Date.parse(f.kontrollerad)) / 86_400_000;
  const varning = ålder > FAKTA_ÅLDER_MAX
    ? `> Reglerna kontrollerades ${f.kontrollerad}, för mer än ett år sedan. Belopp kan ha ändrats vid årsskiftet — kontrollera mot källan innan du använder dem.\n\n`
    : "";
  const fråga = ordI(args && args.fraga);
  const rad = (r) => `## ${r.amne}\n${r.text}\nKälla: ${r.kalla}`;
  if (!fråga.length) {
    return text(`${varning}# Svenska regler — kontrollerade ${f.kontrollerad}\n\nÄmnen:\n${f.regler.map((r) => `- ${r.amne}`).join("\n")}\n\nSlå upp ett ämne med fraga.`);
  }
  const träffar = f.regler
    .map((r) => {
      const amne = ordI(r.amne), txt = ordI(r.text);
      let p = 0;
      for (const w of fråga) {
        // Stammen tar böjningarna: "momsen" → moms, "deklarera" → deklar.
        const stam = w.slice(0, Math.max(4, w.length - 3));
        if (amne.some((a) => a.startsWith(w) || w.startsWith(a))) p += 3;
        else if (stam.length >= 4 && amne.some((a) => a.includes(stam))) p += 3;
        else if (stam.length >= 4 && txt.some((t) => t.includes(stam))) p += 1;
      }
      return { r, p };
    })
    .filter((x) => x.p >= 2)
    .sort((a, b) => b.p - a.p)
    .slice(0, 4);
  if (!träffar.length) {
    return text(`${varning}Ingen kontrollerad regel i Mitt AI-teams faktabas matchar "${args.fraga}". Säg till kunden att du inte är säker, och hänvisa till Skatteverket eller lagtexten på riksdagen.se i stället för att gissa. Ämnen som finns: ${f.regler.map((r) => r.amne).join(", ")}.`);
  }
  return text(`${varning}# Svenska regler — kontrollerade ${f.kontrollerad}\n\n${träffar.map((x) => rad(x.r)).join("\n\n")}\n\nAnvänd uppgifterna exakt och ange källan.`);
}
