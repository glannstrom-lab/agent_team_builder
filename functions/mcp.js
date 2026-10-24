// /mcp — MCP-servern som Claude och ChatGPT kopplar till (SP21, 2026-10-24).
//
// Transport: Streamable HTTP utan sessioner. Varje POST bär ett JSON-RPC-
// meddelande och får ett JSON-svar; inga strömmar behövs, för inget verktyg
// här tar tid. GET (serverinitierad ström) stöds inte och svarar 405, vilket
// specen tillåter.
//
// Tre verktyg, och medvetet inte fler — ledstången från 2026-10-24 är
// begriplighet, inte funktionalitet:
//   lista_jobb      vad som ligger i kundens team
//   hamta_jobb      jobbkortet: uppdrag, kund, "Klart när", agentens instruktion
//   lamna_leverans  leveransen tillbaka till portalen, för kundens godkännande
// Plattformen kan inte godkänna, ta bort eller läsa samtal och minne. Det som
// ska bli klart blir klart i portalen, av kunden.

import { nowMs } from "./api/auth/_lib.js";
import {
  bearer, aktivaTeam, parseKlartNar, lookupClient, clientLabel, resourceMetadataUrl,
  jsonOut, preflight, STATUS_TEXT, LEVERANS_MAX, SCOPE,
} from "./api/_koppling.js";

const PROTOKOLL = ["2025-11-25", "2025-06-18", "2025-03-26"];

const INSTRUKTIONER =
  "Mitt AI-team är kundens kontor: varje jobb hör till en agent i kundens team och ska göras i den agentens roll. " +
  "Hämta alltid jobbkortet med hamta_jobb innan du börjar, följ agentens instruktion och bocka av varje punkt under 'Klart när'. " +
  "Lämna resultatet med lamna_leverans. Kunden granskar och godkänner leveransen i Mitt AI-team — säg det till kunden när du är klar.";

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
      return ok(id, { tools: VERKTYG });
    case "tools/call": {
      const namn = msg.params && msg.params.name;
      const args = (msg.params && msg.params.arguments) || {};
      try {
        if (namn === "lista_jobb") return ok(id, await listaJobb(ctx, args));
        if (namn === "hamta_jobb") return ok(id, await hamtaJobb(ctx, args));
        if (namn === "lamna_leverans") return ok(id, await lamnaLeverans(ctx, args));
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
