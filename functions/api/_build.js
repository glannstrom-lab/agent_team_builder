// Byggets egna prompter — serversidan.
//
// VARFÖR FILEN FINNS (K4). Fram till nu tog /api/ai emot vilken systemprompt
// som helst på den fria rutten. Det gjorde bygget till en oautentiserad
// LLM-proxy: vem som helst kunde POSTa en egen systemprompt och få svar på vår
// nyckel, och — värre kommersiellt — en uppsagd kund kunde ta sin nedladdade
// teamkonfig, klistra in agentens systemprompt och fortsätta använda teamet
// gratis genom att utelämna slugen. Betalväggen gällde alltså bara den som
// lämnade slugen kvar i anropet.
//
// Rättningen är strukturell, inte en kontroll: klienten skickar inte längre
// NÅGON systemprompt på den fria rutten. Den skickar ett STEG-namn, och
// servern hämtar prompten själv. Då finns ingen text att smyga in — den fria
// rutten kan producera exakt två saker: byggets egna mellandokument, och ett
// team-JSON enligt schemat längst ner. Ingenting annat.
//
// VAD SOM FLYTTADE HIT, och varför det är en förbättring och inte bara en
// flytt: PORTAL_RULES, CLARIFY_PROMPT och TEAM_SCHEMA låg i
// builder/builder.js. CLAUDE.md kallade prompten och schemat "ETT kontrakt i
// två filer" och räknade upp två tillfällen då de glidit isär (starters/
// routines, sedan firstProject/seasons/triggers). Nu står beställningen och
// schemat i SAMMA fil, några rader ifrån varandra. Kontraktet är inte längre
// spritt över två runtimes.
//
// De fyra .md-prompterna flyttade INTE hit. De läses från våra egna
// publicerade filer, precis som Buildern läste dem förut — samma invariant som
// tidigare (`prompts/` är enda källan, Builder och /build-team kan inte glida
// isär), bara flyttad ett steg bakåt. Ändras research.md ändras bygget, utan
// att någon kod rörs.

// ── läsning av prompt-filerna ────────────────────────────────────────────
//
// env.ASSETS är Pages Functions egen bindning till de publicerade filerna:
// ingen väg ut på nätet, samma deploy, alltid samma version som resten av
// sajten.
//
// Reservvägen (fetch mot vår egen adress) är inte pynt. Uppmätt i emulatorn
// 2026-08-29: `wrangler pages dev` listar DB och miljövariablerna som
// bindningar men INTE ASSETS — vilken av de två vägarna som bar lokalt gick
// inte att avläsa, men prompten lästes och anropet nådde uppströms, alltså
// höll minst en av dem. Skulle bindningen saknas även i drift blir följden en
// subrequest per kall start i stället för ett stumt bygge; `console.warn`
// nedan säger till en gång per isolat så att det syns i tail. `_middleware.js`
// rör bara `/api/*`, så en självhämtning av `/prompts/…` går rakt till
// asset-servern.
//
// Cachen är per isolat: en kall start läser filen en gång, resten av isolatets
// livstid är den gratis. Ett bygge är fyra till fem anrop, så i praktiken
// betalar bara det första.
let varnatOmReservväg = false;
const promptCache = new Map();

// Bara för testerna: cachen lever per isolat och skulle annars göra "vad händer
// när prompten inte går att läsa" obeskrivbart efter att samma fil lästs en
// gång. Anropas aldrig i drift.
export const rensaPromptCache = () => promptCache.clear();

async function läsPrompt(env, request, path) {
  if (promptCache.has(path)) return promptCache.get(path);
  const url = new URL(path, request.url).toString();
  let res = null;
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    res = await env.ASSETS.fetch(new Request(url)).catch(() => null);
  }
  if (!res || !res.ok) {
    // En rad per isolat, inte en per anrop: det ska gå att se i loggen att
    // bindningen saknas utan att bruset döljer riktiga fel.
    if (!varnatOmReservväg) {
      varnatOmReservväg = true;
      console.warn("[build] env.ASSETS svarade inte — läser prompterna via självhämtning i stället");
    }
    res = await fetch(url).catch(() => null);
  }
  if (!res || !res.ok) throw new Error("prompt saknas: " + path);
  const txt = await res.text();
  // En tom, omdirigerad eller bortstädad fil ska säga ifrån här — inte bli en
  // tom systemprompt som modellen svarar fritt på. Den minsta av de fyra
  // (scale.md) ligger på flera kilobyte.
  if (txt.trim().length < 500) throw new Error("prompt för kort: " + path);
  promptCache.set(path, txt);
  return txt;
}

// ── följdfrågorna före bygget ────────────────────────────────────────────
//
// Låg i builder.js. De två tilläggen är de enda varianterna, och båda styrs av
// booleaner — ingen kundtext går in i systemprompten.
const CLARIFY_BAS = `Du granskar ett intake-underlag för att bygga ett AI-agentteam.
Bedöm om research-steget kan arbeta med det: konkreta veckomoment (helst med tidsangivelse), begriplig verksamhet, någon bild av verktyg.
Svara EXAKT "OK" om underlaget räcker.
Annars: ställ 1–2 korta följdfrågor som skulle göra störst skillnad — en per rad, varje rad börjar med "- ". Fråga bara om sådant som inte redan står i underlaget. Inga andra ord, ingen inledning.`;

// Utan tillägget frågar modellen gärna en ekonomiassistent hur många anställda
// hon har.
const CLARIFY_PERSON = `
UNDERLAGET GÄLLER EN ENSKILD PERSON i sitt jobb. Fråga om personens vecka, roll, system och förväntningar — aldrig om företagets storlek, kunder, omsättning eller marknadsföring.`;

// KA1: ett rent kryssintag innehåller per definition ingenting som skiljer den
// här verksamheten från nästa i samma bransch. Då är "OK" alltid fel svar.
const CLARIFY_ENKAT = `
UNDERLAGET KOMMER HELT FRÅN KRYSSVAL i en enkät med fasta listor. Det innehåller därför ingenting som skiljer den här verksamheten från vilken annan som helst i samma bransch. Svara ALDRIG "OK". Ställ två frågor som bara just den här verksamheten kan besvara — om förra veckan konkret, om vad som blev ogjort, om vad som gör den svår. Fråga inte om något som en lista kunde ha innehållit (bransch, verktyg, kundtyp).`;

// ── sammanställningen ────────────────────────────────────────────────────
//
// Regler för hur en agent blir en portal-systemprompt (speglar
// templates/shared/portal-team.md — ändras den ena måste den andra följa med).
const PORTAL_RULES = `Bygg varje agents "system" som en komplett systemprompt SKRIVEN FÖR AGENTEN (inte för användaren):
1. Kontext om företaget + agentens jobb (jobb-meningen ur proposalen).
2. DITT PERSPEKTIV — proposalens Perspektiv: blicken agenten resonerar från, vad den alltid letar efter/varnar för. Det som gör att två agenter med närliggande uppgifter svarar olika.
3. DINA KAPACITETER — punktlista ur proposalen.
4. (Bara VD-assistenten) DITT TEAM — lista övriga agenter och vad de gör, så den kan hänvisa rätt. VD-assistenten granskar dessutom mötesbidrag mot varje agents "Klart när"-punkter innan sammanställning.
5. LEVERANS — proposalens Leverans + "Klart när"-punkter: hur ett färdigt svar ser ut, så agenten levererar mot det istället för att resonera fritt.
6. ARBETSSÄTT — be om data agenten saknar istället för att gissa.
7. TON — kort; nybörjarkund → pedagogisk/klarspråk, van/byggare → rakare. Avsluta med "Svara på <språk>."
8. VIKTIGT — vad agenten INTE gör (proposalens "Rör inte"); slutbeslut/juridik ligger hos människan.
9. STARTERS — per agent: EXAKT 3 korta exempeluppgifter i du-form ("Skriv ett utkast till …", "Gå igenom …"), hämtade ur agentens kapaciteter och kundens veckomoment. De blir klickbara startförslag i portalen — konkreta nog att skicka direkt.
10. WHY — per agent: EN mening som knyter agenten till kundens egna ord ur intaket/researchen, riktad till kunden: "Du sa att offerterna tar söndagskvällarna — därför finns Offertagenten." Använd kundens formuleringar, fabricera inget. Detta visas på "Därför ser ert team ut så här"-sidan i portalen.`;

const COACH_RULES = `

ARBETSLEDARLÄGE (viktigt): kunden gör själva utförandet i sin egen AI (t.ex. ChatGPT). Varje agents system-prompt ska instruera agenten att leverera ARBETSPAKET i stället för färdigt innehåll: 1) kort brief (vad och varför), 2) en FÄRDIG självbärande prompt i ett \`\`\`-kodblock — med all kontext kundens AI behöver inbakad, 3) "Klart när"-checklistan att bedöma resultatet mot, 4) erbjudande att kvalitetsgranska om kunden klistrar tillbaka resultatet. Starters formuleras som arbetspaket-beställningar ("Gör ett arbetspaket för veckans nyhetsbrev").`;

// Den här texten MÅSTE spegla TEAM_SCHEMA längre ner, fält för fält: det som
// inte står i schemat kan inte genereras (additionalProperties: false), och det
// som krävs i schemat men inte beställs här blir påhittat. Sedan K4 står de i
// samma fil, vilket är hela poängen med att flytta hit dem.
//
// ANTALEN är den halva som glider tystast, för de bryter ingenting synligt.
// KA6, lagad 2026-09-06: punkt 9 beställde "2–4 startförslag" medan schemat
// hundra rader ner tvingar exakt 3. Schemat vinner alltid, så utdatan blev
// ändå tre — men modellen fick motstridiga instruktioner i det dyraste steget
// att köra om, och `templates/shared/portal-team.md` (samma regler för
// /build-team) sa en tredje sak. Regeln är enkelriktad och värd att kunna:
// **allt prompten tillåter måste schemat tillåta.** Prompten får vara
// snävare än schemat (rutiner 3–5 mot minItems 3 är i sin ordning), aldrig
// vidare. Två tester i test/ai.mjs fäller numera bygget på båda felen.
function structurePrompt({ konsult, coach }) {
  const schema = `{
  "company": string,
  "slug": string,
  "tagline": string,
  "firstProject": ${konsult ? '{ "name": string, "problem": string, "week1": string, "owner": string }' : "null"},
  "divergence": string,
  "rejected": [{ "name": string, "why": string }],
  "routines": [{ "label": string, "agentId": string, "day": number|null, "timeEstimate": number|null, "auto": boolean, "prompt": string }],
  "seasons": [{ "label": string, "month": number, "day": number|null, "agentId": string|null, "prompt": string|null }],
  "agents": [{
    "id": string, "name": string, "icon": string, "role": string, "tagline": string,
    "always": boolean, "job": string, "why": string, "capabilities": [string], "triggers": [string],
    "starters": [string], "system": string
  }]
}`;
  return `Du sammanställer ett redan färdigt agent-team till strukturerad JSON för rendering och för en kundportal.

HÄMTA ALLT INNEHÅLL FRÅN FÖRSLAGET OCH RESEARCHEN NEDAN. Fabricera inget, lägg inte till eller ta bort agenter, ändra inte besluten. Du formaterar bara om — innehållet är redan bestämt.

${PORTAL_RULES}${coach ? COACH_RULES : ""}

VD-assistenten ska ha id "vd-assistent" och vara först i listan, sedan VD (id "vd"), sedan specialister i prioritetsordning. always=true för VD och VD-assistent. VD ⚡, VD-assistent 🧭, domän-emoji för specialister. Avvisade moment kommer från researchen/förslaget (minst ett).

DIVERGENCE: en mening ur proposalens/researchens divergens-check — varför just DETTA team inte skulle passa en annan aktör i samma bransch ("Skulle det passa en annan keramiker? Nej, för …"). Hämta ur underlaget; finns ingen divergens-check, härled den ur teamets mest verksamhetsspecifika val.

SEASONS: kundens årshjul — BARA händelser som uttryckligen nämns i intake/research (mässor, deklarationsdatum, högsäsonger, ansökningsdeadlines). month 1–12, day om känd annars null, agentId = mest relevant agent annars null, prompt = valfri startuppgift i du-form. Fabricera inga datum; tom lista om årsrytmen är okänd. Portalen påminner kunden i förväg ("X dagar till mässan").

TRIGGERS: per agent, 0–3 konkreta situationer i kundens vardag då man ska vända sig till just den agenten ("När en offert ska ut", "Inför månadsbokslutet"). Hämta dem ur researchens arbetsmoment. Har en agent ingen tydlig utlösare — VD och VD-assistent har sällan det, de är alltid på — lämna listan tom. Hitta aldrig på en situation för att fylla ut.

RUTINER: 3–5 stående rutiner hämtade ur kundens faktiska veckomoment (inte påhittade). label = kort namn; agentId = agenten som äger momentet; day = veckodag 1–7 (1=måndag) om momentet är dagbundet, annars null; timeEstimate = minuter momentet brukar ta manuellt ENLIGT RESEARCHEN (null om researchen inte anger tid — hitta aldrig på); auto = true på HÖGST EN rutin och bara om dess prompt är komplett utan [fyll i]-luckor (portalen kör den då automatiskt på rätt dag), annars false; prompt = uppgiften i du-form med [fyll i]-luckor för det agenten behöver av användaren, konkret nog att skicka direkt.

Returnera ENBART giltig JSON enligt schemat (ingen text runt, inga markdown-staket):
${schema}`;
}

// Schemat som modellen MÅSTE följa. Strict-läget kräver att varje objekt har
// additionalProperties: false och att alla fält står i required — det är just
// den strängheten som gör att starters och routines inte kan hoppas över.
// Uppmätt 2026-08-06: med bara json_object utelämnade modellen båda, och
// portalens agentkort och veckorutiner hade levererats tomma.
//
// BAKSIDAN, uppmätt 2026-08-15 och lagad 2026-08-16: `additionalProperties:
// false` betyder att ett fält som saknas i schemat inte bara är valfritt —
// det är FÖRBJUDET. Prompten ovan beställde `firstProject`, `seasons` och
// `agents[].triggers`, och modellen kunde inte leverera något av dem hur
// tydligt den än blev tillsagd. Följderna gick åt olika håll och båda var
// tysta:
//
//   • `seasons` saknades i ALLA genererade teamfiler → portalens årshjul var
//     permanent tomt, och ingen kunde se varför.
//   • `firstProject` gick inte att producera → konsult-lägets 🎯-panel kunde
//     aldrig fyllas, trots att first-project-steget kördes och betalades.
//   • `triggers` → "Triggas av"-chipsen i builderns förhandsvisning var döda.
//
// Omvänt krävde schemat ett toppnivå-`why` som ingen prompt definierade och
// ingen kod läste: modellen tvingades hitta på det för att svaret skulle
// valideras.
//
// REGELN: prompten och schemat är ETT kontrakt. Ändras det ena måste det andra
// följa med, i båda riktningarna — ett fält som beställs men inte står här
// kommer aldrig tillbaka, och ett fält som krävs här men inte beställs blir
// påhittat. Sedan K4 står de i SAMMA fil, vilket är så nära man kommer att
// göra regeln onödig. Lägg ändå inte till något här utan en läsare i koden;
// det var så `language` och `defaultModel` blev dödfält.
export const TEAM_SCHEMA = {
  type: "object", additionalProperties: false,
  // Allt i properties måste stå i required — strict-läget tillåter inga
  // valfria fält. Det som får saknas uttrycks som nullbar typ eller tom lista,
  // inte som en utelämnad nyckel.
  required: ["company", "tagline", "slug", "divergence", "agents", "rejected", "routines", "seasons", "firstProject"],
  properties: {
    company: { type: "string" }, tagline: { type: "string" }, slug: { type: "string" },
    divergence: { type: "string" },
    agents: {
      type: "array", minItems: 2,
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "name", "icon", "role", "tagline", "always", "job", "why", "capabilities", "triggers", "starters", "system"],
        properties: {
          id: { type: "string" }, name: { type: "string" }, icon: { type: "string" },
          role: { type: "string" }, tagline: { type: "string" }, always: { type: "boolean" },
          job: { type: "string" }, why: { type: "string" },
          capabilities: { type: "array", minItems: 3, items: { type: "string" } },
          // Inget minItems: alla agenter har inte en naturlig utlösare, och
          // ett golv här hade betytt påhittade triggers i stället för tomma.
          triggers: { type: "array", items: { type: "string" } },
          starters: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
          system: { type: "string" },
        },
      },
    },
    rejected: {
      type: "array", minItems: 1,
      items: { type: "object", additionalProperties: false, required: ["name", "why"],
        properties: { name: { type: "string" }, why: { type: "string" } } },
    },
    routines: {
      type: "array", minItems: 3,
      items: { type: "object", additionalProperties: false,
        required: ["label", "agentId", "day", "timeEstimate", "auto", "prompt"],
        properties: { label: { type: "string" }, agentId: { type: "string" },
          day: { type: ["integer", "null"] }, timeEstimate: { type: ["integer", "null"] },
          auto: { type: "boolean" }, prompt: { type: "string" } } },
    },
    // Årshjulet. Tom lista är ett giltigt och vanligt svar — prompten förbjuder
    // uttryckligen att datum fabriceras, så ett minItems här hade beställt just
    // det den förbjuder.
    seasons: {
      type: "array",
      items: { type: "object", additionalProperties: false,
        required: ["label", "month", "day", "agentId", "prompt"],
        properties: { label: { type: "string" }, month: { type: "integer" },
          day: { type: ["integer", "null"] }, agentId: { type: ["string", "null"] },
          prompt: { type: ["string", "null"] } } },
    },
    // Bara konsult-läget har ett första projekt. I team-builder-läget beställer
    // prompten uttryckligen null, därför nullbar i stället för utelämnad.
    firstProject: {
      type: ["object", "null"], additionalProperties: false,
      required: ["name", "problem", "week1", "owner"],
      properties: { name: { type: "string" }, problem: { type: "string" },
        week1: { type: "string" }, owner: { type: "string" } },
    },
  },
};

// ── stegregistret ────────────────────────────────────────────────────────
//
// `max` är takets ENDA källa för den fria rutten: klientens maxTokens läses
// inte alls. Talen är byggets egna, mätta i drift — skalningen svarar med två
// rader, sammanställningen med hela teamet.
export const BUILD_STEPS = {
  research:     { fil: "/prompts/shared/research.md", max: 8192 },
  scale:        { fil: "/prompts/shared/scale.md", max: 1024 },
  proposal:     { fil: "/prompts/shared/proposal.md", max: 8192 },
  firstproject: { fil: "/prompts/ai-consultant/first-project.md", max: 4096 },
  clarify:      { max: 300 },
  structure:    { max: 16384, schema: true },
};

export const ärByggsteg = (s) =>
  typeof s === "string" && Object.prototype.hasOwnProperty.call(BUILD_STEPS, s);

// Bygger steget. Returnerar { system, maxTokens, schema } — allt det som
// klienten annars hade fått bestämma.
//
// Flaggorna är booleaner, aldrig text. Det är avsiktligt: så fort en sträng
// från klienten får hamna i systemprompten är hålet tillbaka, bara mindre.
export async function byggSteg(env, request, step, body) {
  const def = BUILD_STEPS[step];
  if (!def) throw new Error("okänt byggsteg: " + step);

  let system;
  if (def.fil) {
    system = await läsPrompt(env, request, def.fil);
  } else if (step === "clarify") {
    system = CLARIFY_BAS + (body.person ? CLARIFY_PERSON : "") + (body.survey ? CLARIFY_ENKAT : "");
  } else {
    system = structurePrompt({ konsult: body.mode === "ai-consultant", coach: body.workstyle === "coach" });
  }

  return { system, maxTokens: def.max, schema: def.schema ? TEAM_SCHEMA : null };
}
