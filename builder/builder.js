/* ============================================================
   Mitt AI-team — Builder-UI (djup körning)
   Kör den RIKTIGA pipelinen i webbläsaren mot kundens nyckel.
   Varje steg använder den faktiska prompt-filen som systemprompt:
   research.md → scale.md → proposal.md → (first-project.md) → sammanställning.
   ============================================================ */

const MODEL_STORAGE = "atb_model";
const DRAFT_STORAGE = "atb_draft_team";
// Pågående/senaste körning ({intake, r, team?, at}) — persisteras efter varje
// avklarat pipeline-steg så att ett fel eller en F5 aldrig kastar bort betalda
// steg. Utan detta är en refresh mitt i produktens dyraste operation = börja om.
const RUN_STORAGE = "atb_last_run";
// Inget sparat modellval längre. Modellen är låst i atb-claude.js; de gamla
// nycklarna städas bort så att en webbläsare som varit här förut inte bär
// omkring på ett val som inte finns.
const OR_MODEL_STORAGE = "atb_model_or";
try { localStorage.removeItem(OR_MODEL_STORAGE); localStorage.removeItem(MODEL_STORAGE); } catch (_) { /* privat läge */ }
// Strömningen ligger i ../atb-claude.js (window.ATBClaude) — delad med
// Portalen så de inte kan glida isär. Klienten känner ingen leverantörs-URL:
// allt går till /api/ai, och vårt eget lager äger modell- och leverantörsval.

const MODELS = [{ id: window.ATBClaude.MODEL_ID, label: window.ATBClaude.MODEL_LABEL }];
// En modell, inga alternativ (2026-08-05). Listan finns kvar för att
// anropande kod inte ska behöva skrivas om, men har exakt ett element
// och hämtar det från atb-claude.js — modellvalet bor på ett ställe.

function syncModelForProvider() {
  state.model = window.ATBClaude.MODEL_ID;
}

// Regler för hur en agent blir en portal-systemprompt (speglar templates/shared/portal-team.md).
const PORTAL_RULES = `Bygg varje agents "system" som en komplett systemprompt SKRIVEN FÖR AGENTEN (inte för användaren):
1. Kontext om företaget + agentens jobb (jobb-meningen ur proposalen).
2. DITT PERSPEKTIV — proposalens Perspektiv: blicken agenten resonerar från, vad den alltid letar efter/varnar för. Det som gör att två agenter med närliggande uppgifter svarar olika.
3. DINA KAPACITETER — punktlista ur proposalen.
4. (Bara VD-assistenten) DITT TEAM — lista övriga agenter och vad de gör, så den kan hänvisa rätt. VD-assistenten granskar dessutom mötesbidrag mot varje agents "Klart när"-punkter innan sammanställning.
5. LEVERANS — proposalens Leverans + "Klart när"-punkter: hur ett färdigt svar ser ut, så agenten levererar mot det istället för att resonera fritt.
6. ARBETSSÄTT — be om data agenten saknar istället för att gissa.
7. TON — kort; nybörjarkund → pedagogisk/klarspråk, van/byggare → rakare. Avsluta med "Svara på <språk>."
8. VIKTIGT — vad agenten INTE gör (proposalens "Rör inte"); slutbeslut/juridik ligger hos människan.
9. STARTERS — per agent: 2–4 korta exempeluppgifter i du-form ("Skriv ett utkast till …", "Gå igenom …"), hämtade ur agentens kapaciteter och kundens veckomoment. De blir klickbara startförslag i portalen — konkreta nog att skicka direkt.
10. WHY — per agent: EN mening som knyter agenten till kundens egna ord ur intaket/researchen, riktad till kunden: "Du sa att offerterna tar söndagskvällarna — därför finns Offertagenten." Använd kundens formuleringar, fabricera inget. Detta visas på "Därför ser ert team ut så här"-sidan i portalen.`;

const PROMPTS = {}; // cache av hämtade prompt-filer
const state = {
  // Kunden har ingen egen nyckel (2026-08-06). Fältet står kvar tomt eftersom
  // anropsställena skickar med det; stream() ignorerar det.
  apiKey: "",
  model: window.ATBClaude.MODEL_ID,
  // Demoläge: spela upp en inspelad körning utan nyckel (knapp eller ?demo=1).
  demo: new URLSearchParams(location.search).get("demo") === "1",
  busy: false, team: null, abort: null,
  lastRun: null, // { intake, intakeBlock, r } — för "sammanställ igen"
  // Vem teamet byggs för: "verksamhet" | "person" | null (inte valt än).
  // Styr hela formuläret, enkäten och intake-blocket.
  audience: null,
  formDraft: {}, // ifyllda fält som ska överleva ett byte av vägval
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const $ = (s) => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slugify = (s) => s.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "team";

async function fetchPrompt(path) {
  if (PROMPTS[path]) return PROMPTS[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Kunde inte läsa ${path} (${res.status}). Servera projektroten så att prompts/ är åtkomlig.`);
  const txt = await res.text();
  PROMPTS[path] = txt;
  return txt;
}

function hubLink() { const a = el("a", "hublink", "← Mitt AI-team"); a.href = "../"; return a; }

// PNG:erna ligger i portal/avatars/ — refereras härifrån med detta prefix.
const AVATAR_BASE = "../portal/avatars/";
function avatarSrcFor(a) {
  if (a.avatar) return a.avatar;
  if (a.avatarN && window.ATBAvatars) return window.ATBAvatars.src(a.avatarN, AVATAR_BASE);
  return null;
}
// Fyller en ikon-box med agentens porträtt (om ett finns) annars emoji.
function fillIcon(box, a) {
  const src = avatarSrcFor(a);
  if (src) {
    box.classList.add("has-img");
    const img = el("img", "ava-img");
    img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    img.onerror = () => { box.classList.remove("has-img"); box.textContent = a.icon || "•"; };
    box.appendChild(img);
  } else {
    box.textContent = a.icon || "•";
  }
  return box;
}

// ---------- boot ----------
// Buildern frågar aldrig efter en nyckel. Bygget körs på VÅR nyckel via
// /api/ai (beslutat 2026-08-06) — den fria körningen är själva säljargumentet,
// och en nyckelruta framför den är att ta betalt i tid av någon som ännu inte
// vet om produkten är något värd. state.apiKey nollställs med flit: fanns en
// gammal nyckel kvar i webbläsaren skulle kunden betala för vårt bygge.
function boot() {
  state.apiKey = "";
  syncModelForProvider();
  renderForm();
}

// Liten banner som visas i demoläget.
function demoBanner() {
  const b = el("div", "demo-banner");
  b.appendChild(el("span", "demo-dot"));
  b.appendChild(el("span", "demo-text", "Demoläge — en inspelad körning spelas upp. Bygg mot ert eget företag i stället, det är gratis och tar en kvart."));
  const c = el("button", "demo-connect", "Bygg på riktigt →");
  c.onclick = connectKey;
  b.appendChild(c);
  return b;
}

// Lämna demoläget och gå till det riktiga formuläret. Hette connectKey när
// det fanns en nyckel att koppla in; namnet står kvar tills anropsställena
// bytts, men den kopplar inte in någonting längre.
function connectKey() {
  state.demo = false;
  const params = new URLSearchParams(location.search);
  if (params.get("demo")) {
    params.delete("demo");
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  }
  renderForm();
}

// Nyckelrutorna (renderKeySetup, buildKeyGate) är borttagna 2026-08-06.
// Kunden har ingen egen nyckel; bygget är gratis på vår, och portalen
// öppnas av köpet. En kvarlämnad nyckelruta var inte bara död kod — den
// skrev en nyckel till localStorage som portalen läste, och den nyckeln
// styrde anropen förbi köpgrinden, taken och mätningen.

// ---------- vägval: vem är teamet till för? ----------
//
// Produkten antog länge att den som fyller i formuläret är en verksamhet. Men
// en ekonomiassistent som vill ha hjälp i sitt eget jobb är ett lika vanligt
// fall — och en helt annan intervju. "Hur många anställda är ni" och "vilka är
// era kunder" är fel frågor till henne; rätt frågor är rollen, veckan,
// systemen hon sitter i och vad omgivningen förväntar sig. Får båda fallen
// samma formulär får de i praktiken samma team, och då faller projektets enda
// bärande regel. Därför är det här första frågan, före allt annat, och den
// ritar om resten av formuläret.
function audiencePicker() {
  const box = el("div", "aud");
  box.appendChild(el("div", "flabel", "Vem ska teamet vara till för?"));
  box.appendChild(el("p", "aud-hint", "Valet styr resten av frågorna. En verksamhet och en enskild person behöver olika underlag — och får olika team."));
  const grid = el("div", "aud-grid");
  const opts = [
    ["verksamhet", "🏢", "En verksamhet",
      "Ett företag, en byrå, en förening — eller din egen firma. Teamet byggs runt verksamhetens vecka: kunder, försäljning, drift och administration."],
    ["person", "🙋", "En person i sitt jobb",
      "Du själv eller en medarbetare — anställd, eller egen företagare som jobbar ensam. Teamet byggs runt en arbetsvecka: rollen, systemen och det som stjäl tid."],
  ];
  opts.forEach(([val, icon, title, body]) => {
    const b = el("button", "aud-card" + (state.audience === val ? " sel" : ""));
    b.type = "button";
    b.setAttribute("aria-pressed", state.audience === val ? "true" : "false");
    b.appendChild(el("span", "aud-icon", icon));
    b.appendChild(el("span", "aud-title", title));
    b.appendChild(el("span", "aud-body", body));
    b.onclick = () => {
      if (state.audience === val) return;
      snapshotForm(); // det som redan är ifyllt och betyder samma sak ska överleva bytet
      state.carrySurvey = true;
      state.audience = val;
      renderForm();
    };
    grid.appendChild(b);
  });
  box.appendChild(grid);
  return box;
}

// Byter man vägval ritas formuläret om från grunden. Den som upptäcker halvvägs
// att hen valde fel dörr ska inte straffas med att skriva om allt — fält som
// heter samma sak i båda fallen bär över. Select-värden som inte finns i det
// nya fallet hoppas över, annars nollställs de till tomt.
function snapshotForm() {
  const f = $("#intake-form");
  if (!f) return;
  state.formDraft = Object.assign({}, state.formDraft, Object.fromEntries(new FormData(f).entries()));
}
function applyDraft(form) {
  // Det som placerats i ett fält är förbrukat — det lever i DOM:en nu och
  // snapshottas om vid nästa byte. Det som INTE har något fält här (rollen när
  // man tittar på verksamhetsformuläret) sparas, så att en resa fram och
  // tillbaka mellan de två dörrarna inte kostar det man redan skrivit.
  const rest = {};
  Object.entries(state.formDraft || {}).forEach(([k, v]) => {
    if (v == null || v === "") return;
    const e = form.elements[k];
    if (!e || (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === v))) { rest[k] = v; return; }
    e.value = v;
  });
  state.formDraft = rest;
}

// ---------- intake form ----------
function renderForm() {
  // Demoläget spelar upp en inspelad körning åt ett företag — då är vägvalet
  // redan gjort och ska inte stå i vägen för uppspelningen.
  if (state.demo && !state.audience) state.audience = "verksamhet";
  const person = state.audience === "person";
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "form-wrap");
  wrap.appendChild(hubLink());
  if (state.demo) wrap.appendChild(demoBanner());
  const head = el("div", "form-head");
  head.appendChild(el("div", "eyebrow", "● Ny körning · djup pipeline"));
  const h = el("h1");
  h.innerHTML = !state.audience
    ? `Bygg ett <span class="grad">AI-team</span>`
    : person
      ? `Berätta om ditt jobb — så bygger vi <span class="grad">ditt team</span>`
      : `Berätta om verksamheten — så bygger vi <span class="grad">teamet</span>`;
  head.appendChild(h);
  head.appendChild(el("p", "form-lead", !state.audience
    ? "En fråga först: vem ska teamet vara till för? Resten av formuläret följer det valet."
    : person
      ? "Fyll i, tryck Bygg, och se hela den riktiga analysen växa fram live. Teamet byggs runt din arbetsvecka — inte runt arbetsplatsens organisationsschema."
      : "Fyll i, tryck Bygg, och se hela den riktiga analysen växa fram live. Körningen tar under en minut — och resultatet blir korrekt."));
  wrap.appendChild(head);

  // Sparad körning? Erbjud återupptagning — de klara stegen är redan betalda.
  const saved = state.demo ? null : loadRun();
  if (saved && saved.intake && (saved.team || (saved.r && Object.keys(saved.r).length))) {
    const box = el("div", "resume-box");
    box.appendChild(el("div", "clarify-title", saved.team
      ? `Din senaste körning (${saved.intake.company}) är klar och finns kvar.`
      : `Du har en oavslutad körning för ${saved.intake.company} — de avklarade stegen finns kvar.`));
    const row = el("div", "clarify-actions");
    const go = el("button", "btn-primary", saved.team ? "Visa teamet igen" : "↻ Återuppta körningen"); go.type = "button";
    go.onclick = () => {
      state.audience = saved.intake.audience || state.audience; // körningen bär sitt eget vägval
      state.lastRun = { intake: saved.intake, intakeBlock: buildIntakeBlock(saved.intake), r: saved.r || {} };
      if (saved.team) { state.team = saved.team; renderResult(saved.team); }
      else runBuild(saved.intake, saved.r || {});
    };
    const drop = el("button", "link-btn", "Släng den"); drop.type = "button";
    drop.onclick = () => { clearRun(); box.remove(); };
    row.append(go, drop); box.appendChild(row);
    wrap.appendChild(box);
  }

  wrap.appendChild(audiencePicker());
  // Inget vägval, inga frågor. Att visa ett formulär som ändå ska ritas om vore
  // att be någon fylla i sådant vi kanske slänger.
  if (!state.audience) { root.appendChild(wrap); return; }

  const form = el("form", "intake"); form.id = "intake-form";

  if (person) {
    form.appendChild(fieldRow("Vem är teamet till för?", inputEl("company", "company", 'T.ex. Anna — eller bara "Ekonomiassistenten"'),
      "Namnet blir teamets rubrik. Vill du vara anonym räcker rollen."));
    form.appendChild(fieldRow("Vad har du för roll?", inputEl("role", "role", "T.ex. ekonomiassistent, projektledare, säljare, handläggare")));
    form.appendChild(fieldRow("Vad gör arbetsplatsen?", inputEl("workplace", "workplace", "En mening räcker. T.ex. byggfirma som gör om- och tillbyggnader åt privatpersoner"),
      "Samma roll ser olika ut på ett bygge och på en advokatbyrå."));
    form.appendChild(fieldRow("Hur stor är arbetsplatsen?", selectEl("workplaceSize", "workplaceSize", [
      ["ensam", "Jag jobbar ensam"],
      ["några", "Vi är några stycken (2–10)"],
      ["mellan", "Mellanstor (10–100)"],
      ["stor", "Stor (100+)"],
      ["okänt", "Spelar ingen roll / vill inte säga"],
    ]), "Bara bakgrund. Teamet skalas efter din vecka, inte efter antalet anställda."));
  } else {
    form.appendChild(fieldRow("Företag / projekt", inputEl("company", "company", "T.ex. CoachOnline")));
    form.appendChild(fieldRow("Storlek", selectEl("size", "size", [
      ["solo", "Solo (1 person)"], ["mikro", "Mikro (2)"], ["litet", "Litet team (3–10)"],
      ["medelstort", "Medelstort (10–100)"], ["stort", "Stort (100+)"],
    ])));
  }

  // Etiketterna hette förut "Team-builder (för dig själv / tekniska)" och
  // "AI-konsult (för kunduppdrag)" — projektets egna arbetsnamn, obegripliga
  // för den som bara vill ha ett team. Värdena är oförändrade; det är bara
  // vad kunden ser som är omskrivet.
  const modeSel = selectEl("mode", "mode", [
    ["team-builder", person ? "Bara teamet — jag sätter igång själv" : "Bara teamet — jag vet vad jag vill ha"],
    ["ai-consultant", "Teamet plus ett första projekt att börja med"],
  ]);
  form.appendChild(fieldRow("Vad vill du få ut?", modeSel));

  const matRow = fieldRow(person ? "Hur van är du vid AI?" : "Hur vana är ni vid AI?", selectEl("maturity", "maturity", person ? [
    ["nybörjare", "Har inte börjat"], ["van", "Har provat ChatGPT och liknande"], ["byggare", "Bygger redan egna verktyg"],
  ] : [
    ["nybörjare", "Nybörjare — har inte börjat"], ["van", "Van — har provat ChatGPT och liknande"], ["byggare", "Byggare — bygger redan egna verktyg"],
  ]));
  matRow.style.display = "none"; form.appendChild(matRow);
  modeSel.onchange = () => { matRow.style.display = modeSel.value === "ai-consultant" ? "" : "none"; };

  // Arbetsledarläge: den som redan betalar för en egen AI (ChatGPT m.fl.) kan
  // låta teamet briefa/coacha i stället för att utföra — portalen förblir
  // navet (rutiner, minne, uppföljning), utförandet sker i kundens egen AI.
  // För en anställd är det ofta enda vägen: arbetsgivaren har redan valt verktyg.
  form.appendChild(fieldRow("Hur ska teamet arbeta?", selectEl("workstyle", "workstyle", [
    ["team", "Teamet gör jobbet — allt sker i portalen (standard)"],
    ["coach", person
      ? "Arbetsledarläge — teamet briefar & coachar, du kör den AI du redan har på jobbet"
      : "Arbetsledarläge — teamet briefar & coachar, ni kör er egen AI (t.ex. ChatGPT)"],
  ])));

  // INGEN MODELLVÄLJARE. Modellen är låst i atb-claude.js sedan 2026-08-05 och
  // stream() ignorerar vilken modell anropet än skickar med — väljaren styrde
  // alltså ingenting. Värre: den visade två DeepSeek-rader, för portalen sparade
  // id:t med suffixet "-latest" i samma localStorage-nyckel som buildern läste,
  // och de två strängarna matchade inte varandra. En väljare som inte väljer
  // något, med ett dubblerat alternativ, är sämre än ingen väljare alls.

  // Valbar förvalsenkät — för den som tycker det är svårt att formulera sitt
  // arbete i fritext. Allt går att kryssa, inget kräver text. Vägvalet avgör
  // vilken av de två enkäterna som visas.
  form.appendChild(renderSurvey(state.audience));

  // Strukturerat frågeformulär istället för en tom textruta — kunden vet vad
  // den ska svara på, och research-steget får jämnt råmaterial i exakt det
  // format intake-kontraktet (prompts/shared/research.md) kräver.
  const taEl = (name, rows, ph) => { const t = el("textarea", "intake-text"); t.name = name; t.id = "f-" + name; t.rows = rows; t.placeholder = ph || ""; return t; };

  if (person) {
    form.appendChild(fieldRow("Vad går din vecka åt till?", taEl("moments", 4, "De 2–4 saker som återkommer varje vecka, gärna med ungefärlig tid.\nT.ex: 1) Registrera och kontera leverantörsfakturor, 6–8 h. 2) Svara på säljarnas frågor om vad som är betalt."),
      "Det här är det viktigaste fältet — teamet byggs runt de här momenten."));
    form.appendChild(fieldRow("Vad förväntas av dig?", taEl("expectations", 2, "Det chefen, kollegorna eller kunderna bedömer dig på. T.ex: att månadsskiftet är klart den femte, att ingen faktura blir liggande."),
      "Det du mäts på men inte hinner med är oftast där ett team gör störst nytta."));
    form.appendChild(fieldRow("Vad stjäl tid utan att synas?", taEl("pains", 2, "Det som inte står i någon arbetsbeskrivning men ändå äter timmar. Avbrott, letande, dubbelregistrering.")));
    form.appendChild(fieldRow("System du sitter i dagligen", inputEl("tools", "tools", "T.ex. Outlook, Excel, Business Central, Teams")));
    form.appendChild(fieldRow("Vad vill du att teamet ska ge dig?", inputEl("goals", "goals", "T.ex. sluta ta med jobbet hem på torsdagar")));
    form.appendChild(fieldRow("Något teamet inte ska röra?", inputEl("nogo", "nogo", "T.ex. personuppgifter, löner, ärenden med sekretess."),
      "Ta med det arbetsgivaren har bestämt, inte bara det du själv tycker."));
  } else {
    form.appendChild(fieldRow("Vad gör företaget?", taEl("what", 2, "1–2 meningar. T.ex: Livs- och karriärcoach som säljer 1-on-1-sessioner online. Har ni fyllt i enkäten räcker det att komplettera med det den inte fångar.")));
    form.appendChild(fieldRow("Veckans återkommande moment — vad tar mest tid?", taEl("moments", 4, "De 2–4 moment som återkommer varje vecka, gärna med ungefärlig tid.\nT.ex: 1) Nyhetsbrev och blogg, 5–7 h. 2) Svara på inkommande leads (mail, DM).")));
    form.appendChild(fieldRow("Var klämmer skon?", taEl("pains", 2, "Det som är frustrerande eller blir liggande. Valfritt men gör analysen skarpare.")));
    form.appendChild(fieldRow("Program & system ni använder dagligen", inputEl("tools", "tools", "T.ex. Fortnox, Outlook, Shopify, Google Kalender")));
    form.appendChild(fieldRow("Vad ska AI-teamet uppnå?", inputEl("goals", "goals", "T.ex. frigöra 5 h/vecka från admin till betalt arbete")));
    form.appendChild(fieldRow("Något AI inte ska röra?", inputEl("nogo", "nogo", "T.ex. kundsamtalen, prissättningen. Lämna tomt om inget.")));
  }

  const err = el("div", "fin-err"); err.id = "form-err"; err.style.display = "none";
  form.appendChild(err);

  const btn = el("button", "btn-primary build-btn", "⚡ Bygg teamet"); btn.type = "submit";
  form.appendChild(btn);

  // Grov kostnadsbild vid knappen — ovisshet om pris är den största bromsen
  // för BYO-användare. Uppskattning, inte löfte. Ingen lyssnare på något
  // modellval längre: modellen är låst, och den gamla raden lyssnade på ett
  // element som inte finns kvar.
  const costHint = el("div", "cost-hint", state.demo
    ? "I demoläget anropas inget API — att bygga på riktigt kostar bara dina egna API-ören."
    : "En körning gör 4–6 anrop. Vi står för AI-kostnaden — du betalar ingenting för bygget.");
  form.appendChild(costHint);

  form.onsubmit = (e) => {
    e.preventDefault();
    const intake = collect(form);
    intake.survey = surveyCollect();
    const sv = intake.survey || {};
    // Enkäten kan ersätta fritexten helt — det är hela poängen med den.
    // Verksamhet: bransch + kundbild räcker som "vad företaget gör".
    // Person: en vald roll räcker som beskrivning av jobbet.
    // Båda: ≥3 ikryssade moment räcker som veckomoment.
    const surveyProfile = person
      ? !!(sv.prole || sv.industry)
      : !!(sv.industry && ((sv.customers || []).length || (sv.sales || []).length));
    const surveyMoments = (sv.moments || []).length + (sv.tidstjuvar || []).length;
    if (!intake.company) {
      err.textContent = person
        ? "Skriv ett namn eller en roll — det blir teamets rubrik."
        : "Fyll i företagets eller projektets namn.";
      err.style.display = "block"; return;
    }
    if (person && (!intake.role || intake.role.trim().length < 2) && !surveyProfile) {
      err.textContent = "Skriv vad du har för roll — eller välj en roll i enkäten."; err.style.display = "block"; return;
    }
    if (!person && (!intake.what || intake.what.trim().length < 10) && !surveyProfile) {
      err.textContent = "Beskriv vad företaget gör med en mening — eller öppna enkäten och välj bransch + kunder."; err.style.display = "block"; return;
    }
    if ((!intake.moments || intake.moments.trim().length < 20) && surveyMoments < 3) {
      err.textContent = person
        ? "Din vecka är det viktigaste underlaget — beskriv ett par moment i fritext eller kryssa i minst tre i enkäten."
        : "Veckans moment är det viktigaste underlaget — beskriv ett par moment i fritext eller kryssa i minst tre i enkäten.";
      err.style.display = "block"; return;
    }
    err.style.display = "none";
    if (state.demo) runBuild(intake);
    else clarifyThenBuild(intake, form, btn); // 1–2 AI-följdfrågor innan pipelinen
  };
  wrap.appendChild(form);
  applyDraft(form);
  if (modeSel.value === "ai-consultant") matRow.style.display = ""; // draften kan ha valt första projektet

  const foot = el("div", "form-foot");
  // Bara demoläget har något att lämna. I det riktiga läget finns ingen
  // nyckel att byta och inget att koppla in — därför ingen knapp.
  if (state.demo) {
    const reset = el("button", "link-btn", "Bygg på riktigt i stället");
    reset.onclick = connectKey;
    foot.appendChild(reset);
  }
  wrap.appendChild(foot);
  root.appendChild(wrap);
  if (state.demo) prefillDemo();
}

function prefillDemo() {
  const d = (window.BUILDER_DEMO || {}).intake || {};
  const set = (id, v) => { const e = $("#f-" + id); if (e && v != null) e.value = v; };
  set("company", d.company); set("size", d.size);
  set("what", d.what); set("moments", d.moments); set("pains", d.pains);
  set("tools", d.tools); set("goals", d.goals); set("nogo", d.nogo);
  const mode = $("#f-mode");
  if (mode && d.mode) { mode.value = d.mode; mode.dispatchEvent(new Event("change")); }
  if (d.maturity) set("maturity", d.maturity);
}

function fieldRow(label, control, hint) {
  const r = el("div", "frow");
  const lab = el("label", "flabel", label);
  if (control.id) lab.setAttribute("for", control.id);
  r.appendChild(lab);
  if (hint) r.appendChild(el("div", "fhint", hint));
  r.appendChild(control); return r;
}
function inputEl(name, id, ph) { const i = el("input", "fin"); i.name = name; i.id = "f-" + id; i.placeholder = ph || ""; return i; }
function selectEl(name, id, opts) { const s = el("select", "fin"); s.name = name; s.id = "f-" + id; opts.forEach(([v, l]) => { const o = el("option", null, l); o.value = v; s.appendChild(o); }); return s; }
function collect(form) {
  const d = Object.fromEntries(new FormData(form).entries());
  if (d.mode !== "ai-consultant") delete d.maturity;
  d.audience = state.audience === "person" ? "person" : "verksamhet";
  // En person skalas som solo oavsett hur stor arbetsplatsen är — se
  // docs/scaling.md. Arbetsplatsens storlek följer med som ren kontext.
  if (d.audience === "person") { d.size = "solo"; }
  return d;
}

// ---------- förvalsenkät ----------
// UI för window.BUILDER_SURVEY (builder/survey-data.js). Helt valbar: chips
// som togglas med klick, inga textfält. Moments-sektionen har tre lägen:
// av → ingår i vardagen → stor tidstjuv (⏱) → av.
// Två uppsättningar sektioner: `sections` för en verksamhet, `personSections`
// för en enskild person. Vilken som visas avgörs av vägvalet.
let surveyState = null;
function surveySections(audience) {
  const d = window.BUILDER_SURVEY || {};
  return (audience === "person" ? d.personSections : d.sections) || [];
}
// prev: föregående enkätsvar. Nycklar som finns i båda enkäterna (bransch,
// system, mål, avgränsningar …) följer med när vägvalet byts — momenten gör
// det inte, eftersom listorna är olika och ett kryss annars skulle överleva
// utan att alternativet gör det.
function newSurveyState(audience, prev) {
  const s = { single: {}, multi: {}, momSel: new Set(), momHot: new Set() };
  surveySections(audience).forEach((sec) => {
    if (sec.type === "multi") {
      const keep = prev && prev.multi[sec.key];
      s.multi[sec.key] = new Set(keep ? [...keep].filter((v) => (sec.options || []).includes(v)) : []);
    }
    if (sec.type === "single") {
      const keep = prev && prev.single[sec.key];
      s.single[sec.key] = keep && (sec.options || []).includes(keep) ? keep : null;
    }
  });
  return s;
}
function surveyCount() {
  if (!surveyState) return 0;
  let n = surveyState.momSel.size + surveyState.momHot.size;
  Object.values(surveyState.single).forEach((v) => { if (v) n++; });
  Object.values(surveyState.multi).forEach((set) => { n += set.size; });
  return n;
}
// Plockar ut allt som kryssats, oavsett vilken av de två enkäterna som visades.
// Generisk över nycklarna: de personspecifika (prole, who, expect, friction)
// hamnar i objektet utan att den här funktionen behöver känna till dem.
function surveyCollect() {
  if (!surveyState) return null;
  const out = { moments: [...surveyState.momSel], tidstjuvar: [...surveyState.momHot] };
  Object.entries(surveyState.single).forEach(([k, v]) => { out[k] = v || null; });
  Object.entries(surveyState.multi).forEach(([k, set]) => { out[k] = [...set]; });
  return surveyCount() ? out : null;
}

function renderSurvey(audience) {
  const sections = surveySections(audience);
  // Svaren bärs bara över när användaren just bytt vägval — inte när
  // formuläret ritas om av andra skäl ("Bygg ett till" ska börja rent).
  const prev = state.carrySurvey ? surveyState : null;
  state.carrySurvey = false;
  surveyState = newSurveyState(audience, prev);
  const wrap = el("div", "survey-wrap");
  if (!sections.length) return wrap; // datafilen saknas — formuläret funkar ändå

  const toggle = el("button", "survey-toggle"); toggle.type = "button";
  const tLabel = el("span", "survey-toggle-label", audience === "person"
    ? "📋 Svårt att sätta ord på ditt jobb? Öppna enkäten och kryssa i stället"
    : "📋 Svårt att sätta ord på verksamheten? Öppna enkäten och kryssa i stället");
  const tBadge = el("span", "survey-badge"); tBadge.style.display = "none";
  const tChev = el("span", "survey-chev", "▾");
  toggle.append(tLabel, tBadge, tChev);
  wrap.appendChild(toggle);

  const body = el("div", "survey-body");
  body.appendChild(el("p", "survey-lead", "Allt är valfritt och går att kryssa utan att skriva något. Dina val vävs in i analysen tillsammans med det du eventuellt skriver i fälten nedanför."));

  const updateBadge = () => {
    const n = surveyCount();
    tBadge.textContent = n ? `${n} val` : "";
    tBadge.style.display = n ? "" : "none";
  };

  const chip = (label, getState, cycle) => {
    const b = el("button", "schip", label); b.type = "button";
    const paint = () => {
      const st = getState();
      b.classList.toggle("sel", st === 1 || st === 2);
      b.classList.toggle("hot", st === 2);
    };
    b.onclick = () => { cycle(); paint(); updateBadge(); };
    paint();
    return b;
  };

  sections.forEach((sec) => {
    const box = el("div", "survey-sec");
    box.appendChild(el("div", "survey-sec-title", sec.title));
    if (sec.hint) box.appendChild(el("div", "survey-hint", sec.hint));

    if (sec.type === "moments") {
      (sec.groups || []).forEach((g) => {
        box.appendChild(el("div", "survey-group-label", g.label));
        const row = el("div", "survey-chips");
        g.items.forEach((item) => {
          row.appendChild(chip(item,
            () => surveyState.momHot.has(item) ? 2 : surveyState.momSel.has(item) ? 1 : 0,
            () => {
              if (surveyState.momHot.has(item)) surveyState.momHot.delete(item);
              else if (surveyState.momSel.has(item)) { surveyState.momSel.delete(item); surveyState.momHot.add(item); }
              else surveyState.momSel.add(item);
            }));
        });
        box.appendChild(row);
      });
    } else if (sec.type === "single") {
      const row = el("div", "survey-chips");
      sec.options.forEach((opt) => {
        row.appendChild(chip(opt,
          () => surveyState.single[sec.key] === opt ? 1 : 0,
          () => { surveyState.single[sec.key] = surveyState.single[sec.key] === opt ? null : opt; }));
      });
      box.appendChild(row);
      // Radio-beteende: måla om alla chips i sektionen när ett val görs.
      row.addEventListener("click", () => {
        [...row.children].forEach((c) => c.classList.toggle("sel", surveyState.single[sec.key] === c.textContent));
      });
    } else {
      const row = el("div", "survey-chips");
      sec.options.forEach((opt) => {
        row.appendChild(chip(opt,
          () => surveyState.multi[sec.key].has(opt) ? 1 : 0,
          () => { surveyState.multi[sec.key].has(opt) ? surveyState.multi[sec.key].delete(opt) : surveyState.multi[sec.key].add(opt); }));
      });
      box.appendChild(row);
    }
    body.appendChild(box);
  });

  wrap.appendChild(body);
  toggle.onclick = () => {
    const open = wrap.classList.toggle("open");
    tChev.textContent = open ? "▴" : "▾";
  };
  // Kryss som burits över från det andra vägvalet ska synas direkt — annars
  // ser enkäten tom ut fast svaren finns kvar, och användaren kryssar om allt.
  updateBadge();
  if (surveyCount()) { wrap.classList.add("open"); tChev.textContent = "▴"; }
  return wrap;
}

// ---------- intake block ----------
// Mappar formuläret till intake-kontraktet i prompts/shared/research.md —
// samma sektioner (inkl. ## Avgränsningar) som intervju-prompterna levererar.
// Enkätsvaren (intake.survey) vävs in i respektive sektion: fritext först
// (användarens egna ord väger tyngst i research), förval som komplement.
//
// Vägvalet (teamet_för) står först i blocket och styr både vilka extra rader
// som skrivs och hur research ska läsa momenten — reglerna för det står i
// prompts/shared/research.md under "När teamet byggs för en enskild person".
// Sektionsrubrikerna är desamma i båda fallen; kontraktet ändras inte, det
// får bara sällskap av ett par personspecifika sektioner.
function buildIntakeBlock(intake) {
  const val = (v, alt) => (v && v.trim() ? v.trim() : alt);
  const sv = intake.survey || {};
  const list = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");
  const person = intake.audience === "person";

  // Fritext + enkätrader kombinerat; alt används bara om båda saknas.
  const merge = (free, surveyLines, alt) => {
    const parts = [];
    if (free && free.trim()) parts.push(free.trim());
    surveyLines.forEach((l) => { if (l) parts.push(l); });
    return parts.length ? parts.join("\n") : alt;
  };

  // "Vad företaget gör" i personfallet = vad JOBBET går ut på. Sektionsnamnet
  // är kontraktets, innehållet är personens: roll först, arbetsplats som
  // kontext. Utan rollen först läser research det som en verksamhet.
  const roleTxt = val(intake.role, sv.prole || "");
  const workplaceTxt = val(intake.workplace, "");
  const what = person
    ? merge([
      roleTxt ? `Roll: ${roleTxt}.` : null,
      workplaceTxt ? `Arbetsplatsen: ${workplaceTxt}${/[.!?]$/.test(workplaceTxt) ? "" : "."}` : null,
    ].filter(Boolean).join(" "), [
      !intake.workplace?.trim() && sv.industry ? `Arbetsplatsens bransch enligt enkäten: ${sv.industry}.` : null,
      list(sv.who) ? `Jobbar till vardags mot: ${list(sv.who)}.` : null,
    ], "(saknas)")
    : merge(intake.what, [
      !intake.what?.trim() && sv.industry
        ? `(Fri beskrivning saknas — ur enkäten: ${sv.industry}${list(sv.customers) ? ", säljer till " + list(sv.customers).toLowerCase() : ""}${list(sv.sales) ? ", via " + list(sv.sales).toLowerCase() : ""}.)`
        : null,
    ], "(saknas)");

  const moments = merge(intake.moments, [
    list(sv.moments) ? `Ur enkäten — ingår i ${person ? "veckan" : "vardagen"}: ${list(sv.moments)}.` : null,
    list(sv.tidstjuvar) ? `Ur enkäten — markerade som STORA TIDSTJUVAR: ${list(sv.tidstjuvar)}. Väg dessa tyngst.` : null,
  ], "(saknas)");

  const pains = merge(intake.pains, [
    list(sv.tidstjuvar) ? `Tidstjuvarna ur enkäten (${list(sv.tidstjuvar)}) är sannolikt där det klämmer.` : null,
    person && list(sv.friction) ? `Stjäl tid utan att synas (ur enkäten): ${list(sv.friction)}.` : null,
  ], "Framgår inte uttryckligen — härled försiktigt ur momenten.");

  // Bara personfallet: det omgivningen mäter personen på. En uppgift man
  // bedöms på men inte hinner med gör ont även när ingen kallar det smärta.
  const expectations = person ? merge(intake.expectations, [
    list(sv.expect) ? `Ur enkäten: ${list(sv.expect)}.` : null,
  ], "Framgår inte — notera det som en osäkerhet i stället för att gissa.") : null;

  const tools = merge(intake.tools, [
    list(sv.tools) ? `Ur enkäten: ${list(sv.tools)}.` : null,
  ], "Okänt.");

  const goals = merge(intake.goals, [
    list(sv.goals) ? `Ur enkäten: ${list(sv.goals)}.` : null,
  ], "Frigöra tid från de mest återkommande momenten.");

  // "Inget särskilt …" är ett aktivt icke-svar, inte en avgränsning.
  const nogoChoices = (sv.nogo || []).filter((x) => !/^inget särskilt/i.test(x));
  const nogo = merge(intake.nogo, [
    nogoChoices.length ? `Ur enkäten: ${nogoChoices.join(", ")}.` : null,
  ], "Inga uttryckliga avgränsningar.");

  // Profilrader som saknar egen sektion i kontraktet — extra kontext för research.
  const WORKPLACE_SIZE = {
    ensam: "jag jobbar ensam", några: "några stycken (2–10)",
    mellan: "mellanstor (10–100)", stor: "stor (100+)", okänt: "okänd",
  };
  const profile = person ? [
    `roll:           ${roleTxt || "(framgår inte)"}`,
    `arbetsplats:    ${workplaceTxt || sv.industry || "(framgår inte)"}`,
    intake.workplaceSize && intake.workplaceSize !== "okänt"
      ? `arbetsplatsens_storlek: ${WORKPLACE_SIZE[intake.workplaceSize] || intake.workplaceSize}  (kontext — skalningen följer personen)` : null,
    list(sv.who) ? `jobbar mot:     ${list(sv.who)}` : null,
    sv.rhythm ? `årsrytm:        ${sv.rhythm}` : null,
    sv.ownai && !/^nej/i.test(sv.ownai) ? `egen_ai:        ${sv.ownai}` : null,
  ].filter(Boolean) : [
    list(sv.customers) ? `kunder:         ${list(sv.customers)}` : null,
    list(sv.sales) ? `försäljning:    ${list(sv.sales)}` : null,
    list(sv.channels) ? `kanaler:        ${list(sv.channels)}` : null,
    sv.rhythm ? `årsrytm:        ${sv.rhythm}` : null,
    sv.ownai && !/^nej/i.test(sv.ownai) ? `egen_ai:        ${sv.ownai}` : null,
  ].filter(Boolean);

  // Arbetsledarläget påverkar VAD agenterna levererar — research/proposal ska
  // känna till det, så det går in som egen intake-sektion.
  const coach = intake.workstyle === "coach";

  return [
    "```",
    `teamet_för:     ${person ? "en enskild person i sitt jobb" : "en verksamhet"}`,
    `företagsnamn:   ${intake.company}`,
    `bransch:        ${sv.industry || "(härled ur beskrivningen)"}`,
    `storlek:        ${person ? "solo" : intake.size}`,
    person ? `antal_personer: 1` : null,
    `läge:           ${intake.mode}`,
    intake.maturity ? `ai_mognad:      ${intake.maturity}` : null,
    `källa:          intervju`,
    ...profile,
    "",
    // Vägvalet upprepas som egen sektion, inte bara som en rad högst upp. En
    // rad i en huvudlista är lätt att läsa förbi; den här sektionen är svår
    // att missa, och den är det som avgör om researchen blir en persons
    // vecka eller ett företags organisationsschema.
    person ? "## Vem teamet byggs för" : null,
    person ? "Det här teamet byggs för EN ENSKILD PERSON i hens eget jobb — inte för en verksamhet. Momenten nedan är en persons arbetsvecka, inte en organisations. Läs dem som det: fyrtio timmar, en människa, en roll. Se prompts/shared/research.md, avsnittet \"När teamet byggs för en enskild person\"." : null,
    person ? "" : null,
    "## Vad företaget gör",
    what,
    "",
    "## Återkommande moment",
    moments,
    "",
    "## Var det klämmer",
    pains,
    "",
    person ? "## Vad omgivningen förväntar sig" : null,
    person ? expectations : null,
    person ? "" : null,
    "## Befintliga verktyg och vanor",
    tools,
    "",
    "## Mål och ambition",
    goals,
    "",
    "## Avgränsningar",
    nogo,
    coach ? `\n## Arbetssätt (viktigt för förslaget)\n${person ? "Personen" : "Kunden"} vill fortsätta göra själva utförandet i sin egen AI${sv.ownai && !/^nej/i.test(sv.ownai) ? ` (${sv.ownai})` : " (t.ex. ChatGPT)"}. Teamets agenter ska därför ARBETSLEDA, inte utföra: varje agents Leverans blir ett arbetspaket — en kort brief, en FÄRDIG självbärande prompt att klistra in i ${person ? "personens" : "kundens"} AI, och en "Klart när"-checklista för att bedöma resultatet. Portalen förblir navet för rutiner, minne och uppföljning.` : null,
    intake.extra ? "\n## Kompletterande svar (följdfrågor)\n" + intake.extra : null,
    "```",
  ].filter((x) => x !== null).join("\n");
}

// ---------- följdfrågor (hybrid-intake) ----------
// Formulär först, sedan max två AI-följdfrågor på det som stack ut — så
// tappas inte djupet från fri intervju. Frågorna är nice-to-have: vid fel
// eller "OK" startar pipelinen direkt.
const CLARIFY_PROMPT = `Du granskar ett intake-underlag för att bygga ett AI-agentteam.
Bedöm om research-steget kan arbeta med det: konkreta veckomoment (helst med tidsangivelse), begriplig verksamhet, någon bild av verktyg.
Svara EXAKT "OK" om underlaget räcker.
Annars: ställ 1–2 korta följdfrågor som skulle göra störst skillnad — en per rad, varje rad börjar med "- ". Fråga bara om sådant som inte redan står i underlaget. Inga andra ord, ingen inledning.`;

async function clarifyThenBuild(intake, form, btn) {
  if (state.busy) return;
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = "Läser dina svar…";
  let out = "OK";
  try {
    out = (await window.ATBClaude.collect({
      apiKey: state.apiKey, model: state.model,
      // Följdfrågorna måste fråga om rätt sak. Utan tillägget nedan frågar
      // modellen gärna en ekonomiassistent hur många anställda hon har.
      system: CLARIFY_PROMPT + (intake.audience === "person"
        ? "\nUNDERLAGET GÄLLER EN ENSKILD PERSON i sitt jobb. Fråga om personens vecka, roll, system och förväntningar — aldrig om företagets storlek, kunder, omsättning eller marknadsföring."
        : ""),
      messages: [{ role: "user", content: buildIntakeBlock(intake) }],
      maxTokens: 300,
    })).trim();
  } catch (_) { /* följdfrågor är nice-to-have — fortsätt utan */ }
  btn.disabled = false; btn.textContent = orig;
  const qs = /^ok\b/i.test(out) ? [] : out.split("\n").map((s) => s.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean).slice(0, 2);
  if (!qs.length) { runBuild(intake); return; }
  renderClarify(form, intake, qs);
}

function renderClarify(form, intake, qs) {
  form.querySelector(".clarify-box")?.remove();
  const box = el("div", "clarify-box");
  box.appendChild(el("div", "clarify-title", "Snabba följdfrågor — svaren gör analysen skarpare"));
  const inputs = qs.map((q, i) => {
    const r = el("div", "frow");
    const lab = el("label", "flabel", q);
    const t = el("textarea", "intake-text"); t.rows = 2;
    // Koppla etiketten till fältet, som fieldRow() redan gör i intag-formuläret.
    // Utan for/id flyttar ett klick på frågan inte fokus, och en skärmläsares
    // fältlista säger bara "flerradigt textfält, tomt" — utan att avslöja
    // vilken av följdfrågorna det gäller.
    t.id = "clarify-" + i;
    lab.setAttribute("for", t.id);
    r.appendChild(lab);
    r.appendChild(t); box.appendChild(r);
    return { q, t };
  });
  const row = el("div", "clarify-actions");
  const go = el("button", "btn-primary", "Fortsätt — bygg teamet"); go.type = "button";
  go.onclick = () => {
    const extra = inputs.map(({ q, t }) => `**${q}**\n${t.value.trim() || "(inget svar)"}`).join("\n\n");
    runBuild(Object.assign({}, intake, { extra }));
  };
  const skip = el("button", "link-btn", "Hoppa över och bygg direkt"); skip.type = "button";
  skip.onclick = () => runBuild(intake);
  row.append(go, skip); box.appendChild(row);
  form.appendChild(box);
  box.scrollIntoView({ behavior: "smooth", block: "center" });
  inputs[0]?.t.focus();
}

// ---------- körnings-persistens ----------
// Varje avklarat steg skrivs till localStorage så att fel, F5 eller en stängd
// flik aldrig kostar redan betalda API-anrop. team följer med när det är klart.
function saveRun(team) {
  if (!state.lastRun) return;
  try {
    localStorage.setItem(RUN_STORAGE, JSON.stringify({ intake: state.lastRun.intake, r: state.lastRun.r, team: team || null, at: Date.now() }));
  } catch (_) { /* full storage — körningen fungerar ändå, bara utan skyddsnät */ }
}
function loadRun() { try { return JSON.parse(localStorage.getItem(RUN_STORAGE) || "null"); } catch (_) { return null; } }
function clearRun() { localStorage.removeItem(RUN_STORAGE); }

// ---------- pipeline ----------
// prevR: redan avklarade stegresultat (från en avbruten körning) — steg med
// resultat hoppas över, så en återupptagning bara betalar för det som saknas.
async function runBuild(intake, prevR) {
  if (state.demo) return runDemoBuild(intake);
  if (state.busy) return;
  state.busy = true;
  state.abort = new AbortController();
  const intakeBlock = buildIntakeBlock(intake);
  const r = prevR || {};
  state.lastRun = { intake, intakeBlock, r };

  const stages = [
    { key: "research", label: "Research — analyserar arbetsmoment", file: "../prompts/shared/research.md", stream: true, max: 8192, user: () => intakeBlock, store: "research" },
    { key: "scale", label: "Skalning — väljer antal agenter", file: "../prompts/shared/scale.md", stream: false, max: 1024, user: () => `INTAKE:\n${intakeBlock}\n\nRESEARCH-DOKUMENT:\n${r.research}`, store: "scaling" },
    { key: "proposal", label: "Förslag — formar agenterna", file: "../prompts/shared/proposal.md", stream: true, max: 8192, user: () => `INTAKE:\n${intakeBlock}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}`, store: "proposal" },
  ];
  if (intake.mode === "ai-consultant") {
    stages.push({ key: "firstproject", label: "Första projektet — väljer en startpunkt", file: "../prompts/ai-consultant/first-project.md", stream: true, max: 4096, user: () => `INTAKE:\n${intakeBlock}\n\nRESEARCH-DOKUMENT:\n${r.research}\n\nFÖRSLAG:\n${r.proposal}`, store: "firstproject" });
  }
  stages.push({ key: "structure", label: "Sammanställer teamet", stream: false });

  renderProgress(intake, stages);

  let current = null;
  try {
    for (const stg of stages) {
      current = stg;
      setStage(stg.key);
      if (stg.key === "structure") {
        const teamObj = await structureWithStatus(intake, r);
        markDone(stg.key);
        state.team = teamObj;
        saveRun(teamObj);
        renderResult(teamObj);
        return;
      }
      if (stg.store && r[stg.store]) { markDone(stg.key); continue; } // klar sedan tidigare — betala inte igen
      const sys = await fetchPrompt(stg.file);
      const panel = $("#analysis-text");
      // Tom panel = död sida. Under tankepausen står här vad som ska dyka upp;
      // första tecknet skriver över texten (acc är tom, så det sker av sig självt).
      panel.textContent = stg.stream ? "Textens första mening dyker upp här så fort modellen är klar med att tänka." : "";
      panel.classList.toggle("is-waiting", !!stg.stream);
      let acc = "";
      // clockWriting flyttar vänteindikatorn från "tänker" till "skriver" vid
      // första tecknet — det är den enda signal vi har på att tankepausen är slut.
      const onDelta = (d) => { acc += d; panel.textContent = acc; panel.scrollTop = panel.scrollHeight; clockWriting(acc.length); };
      if (stg.stream) {
        await streamClaude(sys, [{ role: "user", content: stg.user() }], onDelta, stg.max);
      } else {
        // Enda icke-strömmande steget i loopen är skalningen (sammanställningen
        // tas om hand ovan). Panelen ska ändå säga vad som pågår.
        panel.textContent = (stg.key === "scale" ? "Väger underlaget mot skalningsreglerna." : "Arbetar med steget.")
          + "\n\nDet här steget strömmar inte — svaret kommer i ett stycke när det är klart.";
        acc = await callClaude(sys, [{ role: "user", content: stg.user() }], stg.max);
        panel.textContent = acc;
      }
      r[stg.store] = acc;
      saveRun();
      markDone(stg.key);
    }
  } catch (err) {
    if (err.name === "AbortError") { renderForm(); }
    else {
      if (!err.stage && current) err.stage = current.key;
      renderError(err.message, err.stage === "structure", err.stage !== "structure");
    }
  } finally {
    state.busy = false;
    clockStop(); // fel, avbrott eller klart — räknaren ska aldrig ticka vidare i bakgrunden
  }
}

// Sammanställningssteget är långt (upp till 16k tokens, icke-strömmat) och
// kommer precis vid klimaxet — utan livstecken ser det ut som en hängning.
// Sekundräkningen sköts numera av den delade vänteindikatorn (clockStart via
// setStage); här räcker det att panelen förklarar vad som pågår. Två timers
// som skrev i samma vy skulle bara kunna glida isär.
async function structureWithStatus(intake, r) {
  const panel = $("#analysis-text");
  if (panel) {
    panel.textContent = "Formaterar teamet för portalen — alla beslut är redan fattade, inget innehåll ändras.\n\n"
      + "Det här är körningens längsta steg och det strömmar inte: modellen skriver hela teamet klart innan något skickas tillbaka. "
      + "Räknaren ovanför visar hur länge det pågått. Det brukar ta en halv minut, ibland ett par om leverantören är trög.";
  }
  return structureTeam(intake, r);
}

// Sista steget: omvandla research + proposal till render-struktur + portal-systemprompter.
async function structureTeam(intake, r) {
  // Den här texten MÅSTE spegla TEAM_SCHEMA längre ner, fält för fält. De är
  // ett kontrakt i två filer: det som inte står i schemat kan inte genereras
  // (additionalProperties: false), och det som krävs i schemat men inte
  // beställs här blir påhittat. `scaling` stod här förut och lästes av ingen —
  // skalningsbeslutet finns redan som eget steg i `r.scaling`.
  const schema = `{
  "company": string,
  "slug": string,
  "tagline": string,
  "firstProject": ${intake.mode === "ai-consultant" ? '{ "name": string, "problem": string, "week1": string, "owner": string }' : "null"},
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
  const coachRules = intake.workstyle === "coach" ? `

ARBETSLEDARLÄGE (viktigt): kunden gör själva utförandet i sin egen AI (t.ex. ChatGPT). Varje agents system-prompt ska instruera agenten att leverera ARBETSPAKET i stället för färdigt innehåll: 1) kort brief (vad och varför), 2) en FÄRDIG självbärande prompt i ett \`\`\`-kodblock — med all kontext kundens AI behöver inbakad, 3) "Klart när"-checklistan att bedöma resultatet mot, 4) erbjudande att kvalitetsgranska om kunden klistrar tillbaka resultatet. Starters formuleras som arbetspaket-beställningar ("Gör ett arbetspaket för veckans nyhetsbrev").` : "";
  const sys = `Du sammanställer ett redan färdigt agent-team till strukturerad JSON för rendering och för en kundportal.

HÄMTA ALLT INNEHÅLL FRÅN FÖRSLAGET OCH RESEARCHEN NEDAN. Fabricera inget, lägg inte till eller ta bort agenter, ändra inte besluten. Du formaterar bara om — innehållet är redan bestämt.

${PORTAL_RULES}${coachRules}

VD-assistenten ska ha id "vd-assistent" och vara först i listan, sedan VD (id "vd"), sedan specialister i prioritetsordning. always=true för VD och VD-assistent. VD ⚡, VD-assistent 🧭, domän-emoji för specialister. Avvisade moment kommer från researchen/förslaget (minst ett).

DIVERGENCE: en mening ur proposalens/researchens divergens-check — varför just DETTA team inte skulle passa en annan aktör i samma bransch ("Skulle det passa en annan keramiker? Nej, för …"). Hämta ur underlaget; finns ingen divergens-check, härled den ur teamets mest verksamhetsspecifika val.

SEASONS: kundens årshjul — BARA händelser som uttryckligen nämns i intake/research (mässor, deklarationsdatum, högsäsonger, ansökningsdeadlines). month 1–12, day om känd annars null, agentId = mest relevant agent annars null, prompt = valfri startuppgift i du-form. Fabricera inga datum; tom lista om årsrytmen är okänd. Portalen påminner kunden i förväg ("X dagar till mässan").

TRIGGERS: per agent, 0–3 konkreta situationer i kundens vardag då man ska vända sig till just den agenten ("När en offert ska ut", "Inför månadsbokslutet"). Hämta dem ur researchens arbetsmoment. Har en agent ingen tydlig utlösare — VD och VD-assistent har sällan det, de är alltid på — lämna listan tom. Hitta aldrig på en situation för att fylla ut.

RUTINER: 3–5 stående rutiner hämtade ur kundens faktiska veckomoment (inte påhittade). label = kort namn; agentId = agenten som äger momentet; day = veckodag 1–7 (1=måndag) om momentet är dagbundet, annars null; timeEstimate = minuter momentet brukar ta manuellt ENLIGT RESEARCHEN (null om researchen inte anger tid — hitta aldrig på); auto = true på HÖGST EN rutin och bara om dess prompt är komplett utan [fyll i]-luckor (portalen kör den då automatiskt på rätt dag), annars false; prompt = uppgiften i du-form med [fyll i]-luckor för det agenten behöver av användaren, konkret nog att skicka direkt.

Returnera ENBART giltig JSON enligt schemat (ingen text runt, inga markdown-staket):
${schema}`;
  const fpBlock = r.firstproject ? `\n\nFÖRSTA PROJEKTET:\n${r.firstproject}` : "";
  const user = `RESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}\n\nFÖRSLAG (agenterna):\n${r.proposal}${fpBlock}\n\nSammanställ som JSON.`;

  // json: true — se kommentaren i functions/api/ai.js. Det här steget är det
  // enda i pipelinen som måste ge maskinläsbart svar, och det var det som föll.
  const raw = await callClaude(sys, [{ role: "user", content: user }], 16000, true, TEAM_SCHEMA);
  let team;
  try {
    team = parseTeamJson(raw);
  } catch (e) {
    const err = new Error("Modellen returnerade ogiltig JSON i sammanställningen. Research och förslag finns kvar — försök sammanställa igen.");
    err.stage = "structure";
    throw err;
  }
  if (!team || !Array.isArray(team.agents) || team.agents.length === 0) {
    const err = new Error("Sammanställningen saknar agenter. Försök sammanställa igen.");
    err.stage = "structure";
    throw err;
  }
  kontrolleraSystemprompter(team);
  team.slug = slugify(team.slug || intake.company);
  // Inget `language`-fält. Det stod hårdkodat till "sv" och lästes inte av en
  // enda rad kod någonstans — ett påstått val som varken var ett val eller
  // användes, och som dessutom sa emot designprincip 9 (språk följer input).
  // Språket avgörs där det hör hemma: i prompterna, som svarar på samma språk
  // som kunden skrev intaget på. Behövs fältet igen ska det sättas från
  // intaget, inte från en konstant.
  //
  // Ingen defaultModel: modellen är låst i atb-claude.js och samma för alla.
  // Ett fält som ser ut som ett val men inte är det förvirrar den som läser
  // konfigen — och den är gjord för att läsas.
  team.workstyle = intake.workstyle === "coach" ? "coach" : null;
  team.entryAgent = (team.agents.find((a) => a.id === "vd-assistent") || team.agents[0]).id;
  return team;
}


// ── golv på systemprompternas INNEHÅLL ────────────────────────────────────
//
// `TEAM_SCHEMA` garanterar att fältet `system` finns och är en sträng. Det
// säger ingenting om vad som står i den. Uppmätt 2026-08-15: två av fjorton
// teamfiler i `portal/teams/` saknade `DITT PERSPEKTIV` i samtliga agenter —
// alltså genererades de utan att någon märkte det, och ingenting sa ifrån.
//
// Varför just de här två sektionerna, och inte alla tio i PORTAL_RULES:
//
//   DITT PERSPEKTIV är det som gör att två agenter med närliggande uppgifter
//   svarar OLIKA. Utan den är en agent utbytbar mot vilken annan som helst i
//   samma team, och kvalitetschecklistans "två agenter i samma team delar
//   inte perspektiv" går inte att uppfylla ens i teorin.
//
//   LEVERANS bär "Klart när"-punkterna. Utan dem resonerar agenten fritt i
//   stället för att leverera mot något, och kunden kan inte avgöra om ett
//   svar är färdigt.
//
// De övriga sektionerna gör svaret bättre; de här två gör det till ett team.
// Därför fäller bara de två — ett golv som kräver allt hade gjort bygget
// ostabilt av kosmetiska skäl, och ett golv som inte fäller alls är ingen
// kontroll utan en förhoppning.
const OBLIGATORISKA_SEKTIONER = [
  { namn: "DITT PERSPEKTIV", varför: "utan den blir agenten utbytbar mot de andra" },
  { namn: "LEVERANS", varför: "utan den finns inga \"Klart när\"-punkter att leverera mot" },
];

function kontrolleraSystemprompter(team) {
  const brister = [];
  for (const a of team.agents) {
    const sys = String((a && a.system) || "");
    for (const s of OBLIGATORISKA_SEKTIONER) {
      // Skiftlägesokänsligt: modellen skriver ibland "Ditt perspektiv".
      // Rubriken måste finnas, men får se ut hur som helst runtomkring.
      if (!sys.toUpperCase().includes(s.namn)) {
        brister.push(`${a.name || a.id || "en agent"}: saknar ${s.namn} — ${s.varför}`);
      }
    }
  }
  if (!brister.length) return;

  console.warn("[builder] systemprompter under golvet:", brister);
  const err = new Error(
    "Agenternas systemprompter blev ofullständiga:\n\n" + brister.map((b) => "• " + b).join("\n") +
    "\n\nResearch och förslag finns kvar — försök sammanställa igen. " +
    "Det brukar gå på andra försöket."
  );
  err.stage = "structure";
  throw err;
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
// REGELN: prompten och schemat är ETT kontrakt i två filer. Ändras det ena
// måste det andra följa med, i båda riktningarna — ett fält som beställs men
// inte står här kommer aldrig tillbaka, och ett fält som krävs här men inte
// beställs blir påhittat. Lägg inte till något här utan en läsare i koden;
// det var så `language` och `defaultModel` blev dödfält.
const TEAM_SCHEMA = {
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

// Läser modellens svar som JSON, och lagar det om det behövs.
//
// Bakgrund, uppmätt 2026-08-06: DeepSeek V4 Flash producerar trasig JSON i
// sammanställningssteget, konsekvent och oberoende av allt vi kan be om.
// Vi provade i tur och ordning: ett högre tokentak (svaret var inte kapat),
// response_format: json_object (leverantören ignorerar det tyst),
// require_parameters så bara leverantörer som stödjer formatet väljs (samma
// leverantör, samma fel), och att stänga av resonemanget (billigare, men lika
// trasigt). Tre av tre försök misslyckades i varje variant.
//
// Felet är däremot regelbundet: modellen tappar det INLEDANDE citattecknet på
// ett fältnamn — `,\ntagline": "…"` i stället för `,\n"tagline": "…"`. Det
// går att laga deterministiskt, till skillnad från att hoppas på modellen.
//
// Lagningen körs BARA om en rak tolkning misslyckats. Ett svar som redan är
// giltigt rörs aldrig, så en framtida bättre modell märker inte att koden finns.
function parseTeamJson(raw) {
  const text = extractJson(raw);
  try {
    return JSON.parse(text);
  } catch (_) {
    return JSON.parse(repairJson(text));
  }
}

function repairJson(t) {
  return t
    // Fältnamn som tappat sitt inledande citattecken. Ankaret är `{` eller `,`
    // följt av radbrytning/blanksteg — inuti en sträng står aldrig en klammer
    // eller ett komma i den positionen, så mönstret träffar inte innehåll.
    .replace(/([{,]\s*)([A-Za-zÅÄÖåäö_][A-Za-z0-9ÅÄÖåäö_-]*)"(\s*):/g, '$1"$2"$3:')
    // Efterföljande komma före avslutande klammer — den andra vanliga slarven.
    .replace(/,(\s*[}\]])/g, "$1");
}

// Balansera klamrar för att plocka exakt ett JSON-objekt även om modellen lägger till prosa.
function extractJson(s) {
  let t = s.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = t.indexOf("{");
  if (start === -1) throw new Error("ingen JSON");
  let depth = 0, inStr = false, escaped = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return t.slice(start, i + 1); }
  }
  throw new Error("ofullständig JSON");
}

async function retryStructure() {
  if (state.busy || !state.lastRun) return;
  state.busy = true;
  renderProgress(state.lastRun.intake, [{ key: "structure", label: "Sammanställer teamet" }]);
  setStage("structure");
  try {
    const teamObj = await structureWithStatus(state.lastRun.intake, state.lastRun.r);
    state.team = teamObj;
    saveRun(teamObj);
    renderResult(teamObj);
  } catch (err) {
    renderError(err.message, true);
  } finally {
    state.busy = false;
    clockStop();
  }
}

// ---------- demo-uppspelning ----------
// Spelar upp den inspelade körningen (window.BUILDER_DEMO) som om pipelinen
// kördes live — samma progress-vy, men inget API anropas.
async function runDemoBuild(intake) {
  if (state.busy) return;
  const demo = window.BUILDER_DEMO;
  if (!demo || !demo.stages || !demo.team) {
    renderError("Demodatan kunde inte laddas (demo-data.js saknas). Ladda om sidan och försök igen.", false);
    return;
  }
  state.busy = true;
  // stream: true även här — uppspelningen matar text tecken för tecken, och
  // vänteindikatorn ska bete sig likadant som i en riktig körning.
  const stages = [
    { key: "research", label: "Research — analyserar arbetsmoment", text: demo.stages.research, stream: true },
    { key: "scale", label: "Skalning — väljer antal agenter", text: demo.stages.scaling, stream: true },
    { key: "proposal", label: "Förslag — formar agenterna", text: demo.stages.proposal, stream: true },
    { key: "structure", label: "Sammanställer teamet" },
  ];
  renderProgress(intake, stages);
  try {
    for (const stg of stages) {
      setStage(stg.key);
      if (stg.key === "structure") {
        await sleep(550);
        markDone(stg.key);
        state.team = demo.team;
        renderResult(demo.team);
        return;
      }
      const panel = $("#analysis-text"); panel.textContent = "";
      let acc = "";
      await streamText(stg.text, (d) => { acc += d; panel.textContent = acc; panel.scrollTop = panel.scrollHeight; clockWriting(acc.length); });
      markDone(stg.key);
      await sleep(220);
    }
  } finally {
    state.busy = false;
    clockStop();
  }
}

// Strömmar fram text ord för ord så det känns som riktig generering.
async function streamText(full, onDelta) {
  const tokens = (full || "").split(/(\s+)/);
  for (const tk of tokens) { await sleep(7); onDelta(tk); }
}

// ---------- vänteindikator ----------
//
// Modellen (gpt-oss-120b) skickar resonemangs-tokens FÖRE själva svaret, och
// de filtreras bort på vägen hit — vi ser dem aldrig, kunden ännu mindre. För
// användaren betyder det att skärmen kan stå helt still i tiotals sekunder
// mitt i produktens dyraste operation. Mikael avbröt själv en körning av
// precis det skälet: det såg hängt ut. En sida som ser död ut kostar mer än
// en sida som är långsam.
//
// Därför en indikator som ALLTID rör sig. Den visar tre ärliga saker: vilket
// steg som körs, hur länge det hållit på, och om texten har börjat komma.
// Ingen procentsats — vi vet inte hur långt modellen har kvar, och en påhittad
// mätare som fastnar på 80 % är värre än ingen mätare alls.
const clock = {
  timer: null,       // setInterval-handtag; null = ingen körning pågår
  startedAt: 0,      // när det NUVARANDE steget började
  runStartedAt: 0,   // när hela körningen började (nollställs av renderProgress)
  streaming: false,  // har första texttecknet kommit?
  firstDeltaMs: 0,   // hur länge tankepausen varade — visas när texten börjat
  chars: 0,
  streams: true,     // ger steget löpande text, eller allt på en gång?
};

// Väntetexterna trappas upp med tiden. Poängen är inte att fylla tystnaden med
// ord utan att svaret på "har det hängt sig?" ska ändras allteftersom, precis
// som användarens misstanke gör det. Vid riktigt lång väntan pekar texten på
// Avbryt-knappen i stället för att fortsätta lugna — det är det ärliga rådet.
const THINK_PHASES = [
  [0, "Modellen läser underlaget och tänker igenom svaret innan den skriver. Därför står det still en stund — ingen text kommer förrän tankearbetet är klart."],
  [12, "Fortfarande tankearbete. Det brukar ta 10–40 sekunder innan första meningen dyker upp."],
  [40, "Längre tankepaus än vanligt. Inget är fel — när texten väl börjar kommer den i ett svep."],
  [90, "Över en och en halv minut. Det händer när leverantören är hårt belastad. Du kan avbryta nedan; stegen som är klara ligger kvar."],
  [180, "Över tre minuter. Nu är det troligen trögt hos leverantören — avbryt gärna och försök igen, du förlorar inte det som redan är gjort."],
];
const QUIET_PHASES = [
  [0, "Det här steget strömmar inte — svaret kommer i ett enda stycke när det är färdigt. Tystnaden är alltså normal här."],
  [25, "Fortfarande igång. Modellen tänker och skriver klart innan något skickas tillbaka."],
  [75, "Över en minut. Långa steg tar den tiden ibland. Avbryt-knappen finns kvar nedan."],
  [180, "Över tre minuter. Troligen trögt hos leverantören — avbryt gärna, de klara stegen sparas."],
];

// Stegen och deras ordning, satt av renderProgress. Låter setStage veta både
// vad steget heter och om det strömmar, utan att varje anropsställe behöver
// skicka med det.
let progMeta = new Map();

function fmtSecs(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function clockStart(meta) {
  clockStop();
  clock.startedAt = Date.now();
  if (!clock.runStartedAt) clock.runStartedAt = clock.startedAt;
  clock.streaming = false; clock.firstDeltaMs = 0; clock.chars = 0;
  clock.streams = !!(meta && meta.stream);
  const live = $("#prog-live");
  if (live) {
    live.classList.remove("is-writing");
    live.style.display = "";
    const head = live.querySelector(".prog-live-head");
    if (head) head.textContent = meta && meta.total > 1
      ? `Steg ${meta.n} av ${meta.total} · ${meta.label}`
      : (meta ? meta.label : "Arbetar");
  }
  clockPaint();
  clock.timer = setInterval(clockPaint, 1000);
}

// Anropas från strömningens onDelta. Måste vara billig — den körs per token.
// Allt arbete utom övergången görs av sekundtickern.
function clockWriting(chars) {
  if (!clock.timer) return;
  clock.chars = chars;
  if (clock.streaming) return;
  clock.streaming = true;
  clock.firstDeltaMs = Date.now() - clock.startedAt;
  // Övergången ska vara omöjlig att missa: indikatorn byter läge och panelen
  // blinkar till en gång. Det är ögonblicket användaren har väntat på.
  const live = $("#prog-live");
  if (live) live.classList.add("is-writing");
  const text = $("#analysis-text");
  if (text) text.classList.remove("is-waiting"); // väntetexten är ersatt av riktig text
  const panel = document.querySelector(".analysis-panel");
  if (panel) { panel.classList.remove("flash"); void panel.offsetWidth; panel.classList.add("flash"); }
  clockPaint();
}

function clockStop() {
  if (clock.timer) { clearInterval(clock.timer); clock.timer = null; }
}

function clockPhaseText(now) {
  if (clock.streaming) {
    const n = `Texten strömmar in — ${clock.chars.toLocaleString("sv-SE")} tecken hittills.`;
    // Tankepausen redovisas bara när den var värd att vänta ut. "Tog 0 s" är
    // sant men säger ingenting, och en siffra som inte säger något är brus.
    return clock.firstDeltaMs >= 2000 ? `${n} Tankepausen före första meningen tog ${fmtSecs(clock.firstDeltaMs)}.` : n;
  }
  const sec = (now - clock.startedAt) / 1000;
  const table = clock.streams ? THINK_PHASES : QUIET_PHASES;
  let out = table[0][1];
  table.forEach(([at, txt]) => { if (sec >= at) out = txt; });
  return out;
}

function clockPaint() {
  const live = $("#prog-live");
  if (!live) { clockStop(); return; } // vyn är utbytt — ingen anledning att ticka vidare
  const now = Date.now();
  const secs = live.querySelector(".prog-live-secs");
  if (secs) secs.textContent = fmtSecs(now - clock.startedAt);
  // Totaltiden visas först när den skiljer sig meningsfullt från stegets egen,
  // annars står samma siffra två gånger och betyder ingenting.
  const total = live.querySelector(".prog-live-total");
  if (total) {
    const t = now - clock.runStartedAt, s = now - clock.startedAt;
    total.textContent = t - s > 3000 ? `totalt ${fmtSecs(t)}` : "";
  }
  const sub = live.querySelector(".prog-live-sub");
  if (sub) { const txt = clockPhaseText(now); if (sub.textContent !== txt) sub.textContent = txt; }
}

// ---------- progress view ----------
function renderProgress(intake, stages) {
  clockStop(); clock.runStartedAt = 0;
  progMeta = new Map(stages.map((s, i) => [s.key, { label: s.label, stream: !!s.stream, n: i + 1, total: stages.length }]));
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "progress-wrap");
  const head = el("div", "prog-head");
  head.appendChild(el("div", "eyebrow", "● Bygger team för"));
  head.appendChild(el("h1", "prog-company", intake.company));
  head.appendChild(el("p", "form-lead", "Den fullständiga pipelinen körs live och tar under en minut. Modellen tänker igenom varje steg innan den börjar skriva, så skärmen står still i perioder — räknaren nedan visar att arbetet pågår."));
  wrap.appendChild(head);

  // Undertexter som förklarar vad som händer — och lyfter att analysen även
  // säger NEJ (avvisningarna är förtroendeargumentet, inte en bieffekt).
  const STAGE_SUBS = {
    research: "Letar konkreta veckomoment — och sorterar bort det som vore AI-teater. Nejen syns i texten.",
    scale: "Hur många agenter förtjänar underlaget? Fler är inte bättre.",
    proposal: "Varje agent måste motiveras av ett konkret fynd — annars ryker den.",
    firstproject: "Ett första projekt som ger resultat inom en vecka.",
    structure: "Formaterar för portalen — inga nya beslut fattas.",
  };
  const steps = el("div", "prog-steps");
  stages.forEach((s, i) => {
    const st = el("div", "prog-step"); st.dataset.stage = s.key;
    st.appendChild(el("span", "prog-dot"));
    const meta = el("span", "prog-meta");
    meta.appendChild(el("span", "prog-label", `${i + 1} · ${s.label}`));
    if (STAGE_SUBS[s.key]) meta.appendChild(el("span", "prog-sub", STAGE_SUBS[s.key]));
    st.appendChild(meta);
    steps.appendChild(st);
  });
  wrap.appendChild(steps);

  // Den ständigt rörliga raden. Ligger mellan steglistan och textpanelen
  // eftersom det är precis där blicken är när ingenting händer.
  const live = el("div", "prog-live"); live.id = "prog-live";
  const pulse = el("span", "prog-live-pulse"); pulse.setAttribute("aria-hidden", "true");
  pulse.append(el("i"), el("i"), el("i"));
  const body = el("div", "prog-live-body");
  body.appendChild(el("div", "prog-live-head", "Startar…"));
  const sub = el("div", "prog-live-sub", THINK_PHASES[0][1]);
  // role=status läser upp fasbytena för skärmläsare. Sekundräknaren hålls
  // utanför — en uppläsning i sekunden vore obrukbart.
  sub.setAttribute("role", "status");
  body.appendChild(sub);
  const time = el("div", "prog-live-time"); time.setAttribute("aria-hidden", "true");
  time.appendChild(el("span", "prog-live-secs", "0 s"));
  time.appendChild(el("span", "prog-live-total", ""));
  live.append(pulse, body, time);
  wrap.appendChild(live);

  const panel = el("div", "analysis-panel");
  const at = el("div", "analysis-text"); at.id = "analysis-text";
  panel.appendChild(at); wrap.appendChild(panel);

  if (state.abort) {
    const cancel = el("button", "link-btn prog-cancel", "Avbryt körningen");
    cancel.onclick = () => { try { state.abort.abort(); } catch (_) {} };
    wrap.appendChild(cancel);
  }
  root.appendChild(wrap);
}
function setStage(key) {
  document.querySelectorAll(".prog-step").forEach((n) => { if (n.dataset.stage === key) n.classList.add("active"); });
  clockStart(progMeta.get(key)); // klockan startar med steget, inte med första tecknet
}
function markDone(key) {
  document.querySelectorAll(".prog-step").forEach((n) => { if (n.dataset.stage === key) { n.classList.remove("active"); n.classList.add("done"); } });
  clockStop();
  // Sista steget lämnar inget efter sig att vänta på — dölj raden så att en
  // frusen räknare inte står kvar och ser ut som något som fastnat.
  const live = $("#prog-live");
  if (live && progMeta.get(key) && progMeta.get(key).n === progMeta.get(key).total) live.style.display = "none";
}

// ---------- result view ----------
function renderResult(team) {
  if (window.ATBAvatars) window.ATBAvatars.assign(team); // ge varje agent ett porträtt
  // Autospara utkastet direkt — ett färdigt team ska aldrig kunna försvinna
  // för att användaren råkade ladda om innan den hann spara det hos oss.
  if (!state.demo) { try { localStorage.setItem(DRAFT_STORAGE, JSON.stringify(stripTeam(team))); } catch (_) { /* full storage */ } }
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "result-wrap");
  wrap.appendChild(hubLink());

  const hero = el("div", "result-hero");
  hero.appendChild(el("div", "eyebrow", "✓ Teamet är klart"));
  const h = el("h1"); h.innerHTML = `${esc(team.company)} — <span class="grad">${team.agents.length} agenter</span>`;
  hero.appendChild(h);
  hero.appendChild(el("p", "result-lead", team.tagline || ""));
  hero.appendChild(closingBlock(team));

  // Sekundära val. De händer alla i den här webbläsaren och kostar ingenting —
  // därför står de under avslutet, inte bredvid det.
  const actions = el("div", "result-actions is-secondary");
  actions.appendChild(el("div", "actions-label", "Innan du bestämmer dig:"));
  // "Prova teamet live" är borttagen (beslut 2026-08-06). Att chatta med sitt
  // eget team är det som säljs — kunde man göra det gratis vore köpet valfritt.
  // Knappen fungerade dessutom inte: servern avvisar utkast-slugen med flit.
  // Den som vill se portalen innan hon köper tittar på ett färdigt demoteam,
  // där svaren är förskrivna och inget anrop sker.
  const peek = el("button", "btn-ghost", "👀 Se hur portalen fungerar");
  peek.onclick = () => window.open("../portal/?team=coachonline&demo=1", "_blank");
  const dl = el("button", "btn-ghost", "⬇ Ladda ner config");
  dl.onclick = () => downloadConfig(team);
  // Delbar länk utan server: hela konfigen komprimeras in i URL-fragmentet
  // (#cfg=…) — fragment skickas aldrig till servern. Mottagaren öppnar
  // teamet direkt i portalen med sin egen nyckel.
  const share = el("button", "btn-ghost", "🔗 Kopiera delningslänk");
  share.onclick = async () => {
    try {
      const b64 = await window.ATBClaude.encodeTeamLink(stripTeam(team));
      const url = new URL("../portal/", location.href).href + "#cfg=" + b64;
      await navigator.clipboard.writeText(url);
      share.textContent = "Kopierad ✓ — skicka länken";
    } catch (_) { share.textContent = "Kunde inte kopiera"; }
    setTimeout(() => (share.textContent = "🔗 Kopiera delningslänk"), 2400);
  };
  // "Spara i molnet" ligger inte längre här. Den var ett av fem likvärdiga
  // alternativ i en knapprad — den enda som leder någonstans, klädd som de
  // fyra som inte gör det. Den bor i avslutet ovanför i stället.
  const again = el("button", "btn-ghost", "↺ Bygg ett till");
  again.onclick = () => renderForm();
  actions.append(peek, dl, share, again); hero.appendChild(actions);
  wrap.appendChild(hero);

  if (team.divergence) {
    const dv = el("p", "divergence");
    dv.textContent = "🧭 " + team.divergence;
    dv.title = "Divergens-checken: därför skulle det här teamet inte passa en annan aktör i samma bransch";
    wrap.appendChild(dv);
  }

  const fp = team.firstProject;
  if (fp && typeof fp === "object" && fp.name) {
    const box = el("div", "decision"); box.style.marginTop = "10px";
    box.appendChild(el("div", "meta-label", "Första projektet"));
    box.appendChild(Object.assign(el("div", "big"), { textContent: fp.name }));
    if (fp.problem) box.appendChild(el("p", null, "Problemet: " + fp.problem));
    const row = el("div", "scale-row");
    if (fp.week1) row.appendChild(el("span", "scale-chip", "Efter vecka 1: " + fp.week1));
    if (fp.owner) row.appendChild(el("span", "scale-chip", "Äger: " + fp.owner));
    box.appendChild(row); wrap.appendChild(box);
  }

  const org = el("div", "org");
  const ceo = team.agents.find((a) => a.id === "vd");
  const cos = team.agents.find((a) => a.id === "vd-assistent");
  const specs = team.agents.filter((a) => a.id !== "vd" && a.id !== "vd-assistent");
  if (ceo) org.appendChild(orgRow([node(ceo, "ceo")]));
  if (ceo && cos) org.appendChild(connector(true));
  if (cos) org.appendChild(orgRow([node(cos, "cos")]));
  if (specs.length) { org.appendChild(connector(false)); org.appendChild(orgRow(specs.map((a) => node(a, "spec")))); }
  wrap.appendChild(org);

  const cards = el("div", "cards");
  team.agents.forEach((a) => cards.appendChild(agentCard(a)));
  wrap.appendChild(cards);

  if (Array.isArray(team.rejected) && team.rejected.length) {
    const rh = el("div", "section-head"); rh.style.marginTop = "10px";
    rh.appendChild(el("div", "eyebrow", "Avvisat"));
    rh.appendChild(el("h2", "section-title", "Vad som medvetet inte blev agenter"));
    wrap.appendChild(rh);
    const rg = el("div", "rejected-grid");
    team.rejected.forEach((x) => { const rj = el("div", "rej"); rj.appendChild(el("div", "rn", x.name)); rj.appendChild(el("div", "rm", x.why)); rg.appendChild(rj); });
    wrap.appendChild(rg);
  }
  root.appendChild(wrap);
}

// ---------- avslutet på resultatsidan ----------
//
// Resultatsidan räknade upp vad som byggts och lade sedan fem likvärdiga
// knappar i rad — inklusive den enda som leder till ett köp. Ett resultat utan
// nästa steg är ett resultat kunden lämnar, och en köpknapp som ser ut som
// "ladda ner config" blir inte tryckt.
//
// Här står i stället ett val: spara teamet, eller låt det ligga kvar i en
// webbläsare som förr eller senare städar bort det. Ingen hype och inga
// utropstecken — påståendena ska gå att kontrollera. Beloppen kommer från
// PLANS; de får inte skrivas om här, för prislistan i index.html och
// villkor.html § 4 hänger ihop med dem.
const PLAN_GAIN = {
  trial: "Hela teamet i portalen i en månad: agenterna svarar, veckans rutiner går att köra, företagsminnet och era underlag ligger kvar mellan gångerna. AI-användningen ingår. Månaden tar slut av sig själv — det finns inget att säga upp.",
  standard: "Samma sak löpande, och teamet ligger på ert konto i stället för i den här webbläsaren. Ni når det från vilken dator som helst och loggar in med en kod till mejlen. Uppsägningsbart när som helst.",
};

function closingBlock(team) {
  const box = el("div", "result-close");

  // Demoläget säljer ingenting (beslutat 2026-08-06) — teamet på skärmen
  // tillhör ett påhittat företag. Avslutet leder därför till ett riktigt
  // bygge, inte till en kassa.
  if (state.demo) {
    box.appendChild(el("div", "close-head", "Det här teamet är inte ditt"));
    box.appendChild(el("p", "close-body",
      "Körningen du just såg är inspelad åt ett påhittat företag, och den säljer vi inte. "
      + "Samma pipeline mot din egen verksamhet tar ungefär en kvart och kostar dig ingenting — vi står för AI:n."));
    const go = el("button", "btn-primary btn-save", "Bygg samma sak för din verksamhet →");
    go.onclick = connectKey;
    box.appendChild(go);
    return box;
  }

  const nAgents = team.agents.length;
  const nRoutines = Array.isArray(team.routines) ? team.routines.length : 0;
  const nRejected = Array.isArray(team.rejected) ? team.rejected.length : 0;

  box.appendChild(el("div", "close-head", "Teamet finns bara i den här webbläsaren"));

  // Vad kunden fick — räknat ur teamet självt, inte påstått.
  const got = [`${nAgents} agenter med varsin systemprompt`];
  if (nRoutines) got.push(`${nRoutines} veckorutiner`);
  if (nRejected) got.push(`${nRejected} förslag som medvetet fick nej`);
  const gotTxt = got.length > 1 ? got.slice(0, -1).join(", ") + " och " + got[got.length - 1] : got[0];
  box.appendChild(el("p", "close-body",
    `Du har ${gotTxt} — byggt ur det du skrev, inte ur en mall. `
    + "Allt ligger just nu i den här datorns webbläsare och ingen annanstans. "
    + "Byter du dator, rensar historiken eller bygger ett nytt team är det borta, och en ny körning ger ett annat team. "
    + "Sparar du det får du ett konto och når teamet där du loggar in."));

  // Sägs här, en gång, i klartext. Att kunden upptäcker det först när hon
  // står i portalen och skrivit en fråga är samma fel som nyckelrutan var:
  // ett villkor som visar sig efter att förväntningen redan byggts.
  box.appendChild(el("p", "close-body close-gate",
    "🔒 Att bygga teamet är gratis — att arbeta med det är det som kostar. "
    + "Portalen, där du chattar med agenterna, håller veckomöten och bygger upp ett gemensamt minne, "
    + "öppnas när teamet är sparat hos oss. AI:n ingår; du behöver ingen egen nyckel och inget konto hos någon leverantör."));

  const plans = el("div", "close-plans");
  PLANS.forEach((p) => {
    const row = el("div", "close-plan");
    const top = el("div", "close-plan-top");
    top.appendChild(el("span", "close-plan-label", p.label));
    top.appendChild(el("span", "close-plan-price", p.price));
    row.appendChild(top);
    row.appendChild(el("p", "close-plan-body", PLAN_GAIN[p.tier] || p.note));
    plans.appendChild(row);
  });
  box.appendChild(plans);

  const save = el("button", "btn-primary btn-save", "☁ Spara teamet hos oss");
  save.onclick = () => renderPurchase(team, box, save);
  box.appendChild(save);
  box.appendChild(el("p", "close-fine",
    "Betalning med kort via Stripe. Provmånaden förnyas inte automatiskt. "
    + "Vill du se portalen först finns färdiga demoteam att titta på — knappen nedanför."));
  return box;
}

function orgRow(nodes) { const r = el("div", "org-row"); nodes.forEach((n) => r.appendChild(n)); return r; }
function connector(solid) { return el("div", "connector" + (solid ? " solid" : "")); }
function node(a, kind) {
  const n = el("div", "node " + kind);
  n.appendChild(el("div", "role", a.role || (kind === "spec" ? "Specialist" : "")));
  const nm = el("div", "nm");
  const src = avatarSrcFor(a);
  if (src) {
    const img = el("img", "ava-inline");
    img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    nm.appendChild(img); nm.appendChild(document.createTextNode(a.name));
  } else {
    nm.textContent = `${a.icon || "•"} ${a.name}`;
  }
  n.appendChild(nm);
  n.appendChild(el("div", "jb", a.tagline || a.job || ""));
  return n;
}
function agentCard(a) {
  const cls = a.id === "vd" ? "card is-ceo" : a.id === "vd-assistent" ? "card is-cos" : "card";
  const c = el("div", cls);
  const top = el("div", "card-top"); top.appendChild(fillIcon(el("div", "icon"), a));
  const td = el("div"); td.appendChild(el("h3", null, a.name));
  td.appendChild(el("span", "tag " + (a.always ? "always" : "special"), a.always ? "Alltid närvarande" : "Specialist"));
  top.appendChild(td); c.appendChild(top);
  c.appendChild(el("p", "job", a.job || ""));
  if (a.why) c.appendChild(el("p", "why", "→ " + a.why)); // kopplingen till kundens egna ord
  if (Array.isArray(a.capabilities) && a.capabilities.length) { c.appendChild(el("div", "meta-label", "Kapaciteter")); const ul = el("ul", "caps"); a.capabilities.forEach((x) => ul.appendChild(el("li", null, x))); c.appendChild(ul); }
  if (Array.isArray(a.triggers) && a.triggers.length) { c.appendChild(el("div", "meta-label", "Triggas av")); const ch = el("div", "chips"); a.triggers.forEach((x) => ch.appendChild(el("span", "chip", x))); c.appendChild(ch); }
  return c;
}

function stripTeam(team) {
  // job/capabilities/starters följer med till portalen — de driver agentkortet
  // ("det här kan jag hjälpa dig med" + klickbara exempeluppgifter).
  // routines + firstProject driver arbetsytan (rutinlistan och 🎯-panelen).
  // rejected + divergence + why följer med — de driver portalens
  // "Därför ser ert team ut så här"-sida (anställningsceremonin).
  // Inget `language`. Fältet stod hårdkodat till "sv" här och en gång till i
  // structureTeam, lästes av noll rader kod, och sa emot designprincip 9 genom
  // att påstå svenska även om kunden fyllt i formuläret på engelska. Språket
  // avgörs av prompterna, som svarar på samma språk som intaget skrevs på —
  // det syns i agenternas texter, vilket är det enda ställe det spelar roll.
  return { company: team.company, tagline: team.tagline, entryAgent: team.entryAgent,
    routines: Array.isArray(team.routines) ? team.routines : [],
    seasons: Array.isArray(team.seasons) ? team.seasons : [],
    firstProject: team.firstProject || null,
    divergence: team.divergence || null,
    rejected: Array.isArray(team.rejected) ? team.rejected : [],
    workstyle: team.workstyle || null,
    agents: team.agents.map((a) => ({ id: a.id, name: a.name, icon: a.icon, avatarN: a.avatarN, role: a.role, tagline: a.tagline, always: !!a.always,
      job: a.job, why: a.why || null, capabilities: a.capabilities, starters: a.starters, system: a.system })) };
}
// ---------- köp ("Spara i molnet") ----------
//
// De två nivåerna som går att leverera i dag. 190 kr och 490 kr/mån kräver en
// proxy på vår nyckel med kvotmätning — den finns inte, och tills den gör det
// ska de inte gå att köpa. Priserna här är etiketter; beloppen som dras kommer
// från Stripe, och prislistan i index.html och villkor.html § 4 måste följa med
// om de ändras.
const PLANS = [
  { tier: "trial", label: "Provmånad", price: "90 kr", note: "En månad med teamet i portalen. AI-användningen ingår. Slutar av sig själv — inget att säga upp." },
  { tier: "standard", label: "Standard", price: "290 kr/mån", note: "Teamet löpande, med allt inkluderat. Uppsägningsbart när som helst." },
];


function renderPurchase(team, hero, trigger) {
  if (hero.querySelector(".buy-panel")) return; // redan öppen
  trigger.disabled = true;

  const panel = el("div", "buy-panel");
  // surface-2, inte surface: panelen öppnas numera inuti avslutsblocket, som
  // självt ligger på surface. Samma ton två gånger hade sett ut som ingen ram alls.
  panel.style.cssText = "margin-top:20px;padding:18px;border:1px solid var(--border);border-radius:6px;background:var(--surface-2);text-align:left";

  // Demoläget säljer inte demoteamet. Körningen är inspelad och gjord åt ett
  // påhittat företag — att ta betalt för den vore att sälja någon annans team
  // till någon som tror att det är sitt. Nyckelgrinden räckte inte mot det:
  // den ser till att kunden KAN öppna dörren, inte att det ligger rätt sak
  // bakom den. Här blir köpknappen i stället vägen till ett riktigt bygge.
  if (state.demo) {
    panel.appendChild(el("div", "eyebrow", "Först: bygg ditt eget team"));
    const dl = el("p");
    dl.style.cssText = "color:var(--text-dim);margin:8px 0 16px;line-height:1.6";
    dl.textContent = "Det du ser nu är en inspelad demo åt ett påhittat företag — vi säljer inte den. " +
      "Samma pipeline mot din egen verksamhet tar under en minut och kostar dig ingenting: AI:n står vi för, " +
      "och du behöver ingen nyckel. Först när du har ett team som faktiskt handlar om dig är det något värt att spara.";
    panel.appendChild(dl);
    const go = el("button", "btn-primary btn-save", "Bygg mitt eget team →");
    go.onclick = () => { state.demo = false; renderForm(); };
    panel.appendChild(go);
    const back = el("button", "btn-ghost", "Inte nu");
    back.style.marginTop = "4px";
    back.onclick = () => { panel.remove(); trigger.disabled = false; };
    panel.appendChild(back);
    hero.appendChild(panel);
    return;
  }

  panel.appendChild(el("div", "eyebrow", "Välj nivå"));

  // Kortare än förut: att teamet bara finns i webbläsaren står redan i
  // avslutsblocket som panelen öppnas inuti. Här handlar det om nästa klick.
  const lead = el("p");
  lead.style.cssText = "color:var(--text-dim);margin:8px 0 16px;line-height:1.6";
  lead.textContent = "Nästa steg är Stripes kassa. Efter betalningen får ni en inloggningskod till mejlen och teamet ligger på ert konto — inget lösenord att hitta på.";
  panel.appendChild(lead);

  const status = el("p");
  status.style.cssText = "color:var(--text-dim);margin:14px 0 0;min-height:20px";

  // Nyckelgrind. Den som byggt på riktigt har redan en verifierad nyckel — den
  // krävdes för att komma hit, och då ska ingenting stå i vägen för köpet. Den
  // som kommer ur demoläget har ingen, och skulle utan grinden upptäcka kravet
  // först efter betalningen, inne i portalen: betalt för en dörr hon inte kan
  // öppna. Det är kundresans värsta fel, och en varningsruta räcker inte mot
  // det — den går att klicka förbi. Därför får planknapparna inte gå att trycka
  // på förrän en nyckel faktiskt har testats mot leverantören.
  const planBtns = [];

  PLANS.forEach((plan) => {
    const row = el("button", "btn-ghost");
    row.style.cssText = "display:block;width:100%;text-align:left;margin-bottom:8px";
    row.innerHTML = `<b>${esc(plan.label)} — ${esc(plan.price)}</b><br><span style="color:var(--text-dim);font-weight:400">${esc(plan.note)}</span>`;
    planBtns.push(row);
    row.onclick = async () => {
      panel.querySelectorAll("button").forEach((b) => (b.disabled = true));
      status.textContent = "Öppnar betalningen…";
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tier: plan.tier, config: stripTeam(team) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || "kunde inte starta betalningen");
        // Samma flik, inte ny: en popup-blockerare får aldrig stå mellan en
        // kund och en kassa. Teamet ligger kvar i localStorage om hen ångrar sig.
        location.href = data.url;
      } catch (e) {
        panel.querySelectorAll("button").forEach((b) => (b.disabled = false));
        status.textContent = "Det gick inte: " + ((e && e.message) || "okänt fel") + ". Teamet ligger kvar — prova igen, eller ladda ner configen så länge.";
      }
    };
    panel.appendChild(row);
  });

  // Ingen nyckelgrind längre: AI:n ingår i alla nivåer utom köpet, och där
  // skaffas nyckeln efter leveransen. Grinden fanns för att ingen skulle
  // betala för en dörr hen inte kunde öppna — nu är dörren alltid öppen.

  const cancel = el("button", "btn-ghost", "Inte nu");
  cancel.style.marginTop = "4px";
  cancel.onclick = () => { panel.remove(); trigger.disabled = false; };
  panel.append(cancel, status);
  hero.appendChild(panel);
}

function downloadConfig(team) {
  const js = "// Genererad av Builder. Lägg i portal/teams/ och registrera i index.js.\nwindow.TEAM = " + JSON.stringify(stripTeam(team), null, 2) + ";\n";
  // Delad hjälpare i atb-claude.js. Här stod tidigare en egen trerading som
  // varken kopplade in <a> i dokumentet eller fördröjde revokeObjectURL — två
  // fel som båda yttrar sig likadant: kunden klickar, och ingenting händer.
  // Portalen hade redan lagat dem; Buildern hade en egen kopia som inte fick
  // rättningen. Nu finns bara en version att laga.
  window.ATBClaude.downloadFile(`${team.slug}.js`, js, "text/javascript");
}

function renderError(msg, canRetryStructure, canResume) {
  const root = $("#root"); root.innerHTML = "";
  const wrap = el("main", "result-wrap");
  wrap.appendChild(hubLink());
  wrap.appendChild(el("div", "eyebrow", "⚠️ Något gick fel"));
  wrap.appendChild(el("p", "result-lead", msg));
  const actions = el("div", "result-actions"); actions.style.marginTop = "22px";
  if (canRetryStructure && state.lastRun) {
    const retry = el("button", "btn-primary", "↻ Sammanställ igen");
    retry.onclick = () => retryStructure();
    actions.appendChild(retry);
  }
  if (canResume && state.lastRun) {
    // Färdiga steg ligger i state.lastRun.r (och i localStorage) — kör vidare
    // därifrån i stället för att börja om och betala om researchen.
    const resume = el("button", "btn-primary", "↻ Fortsätt från steget som misslyckades");
    resume.onclick = () => runBuild(state.lastRun.intake, state.lastRun.r);
    actions.appendChild(resume);
  }
  const back = el("button", "btn-ghost", "↺ Till formuläret");
  back.onclick = () => renderForm();
  actions.appendChild(back);
  wrap.appendChild(actions);
  root.appendChild(wrap);
}

// ---------- Claude API ----------
// Tunna omslag runt den delade klienten (../atb-claude.js). callClaude samlar
// hela svaret; streamClaude strömmar via onDelta. Abort-signalen kommer från
// "Avbryt körningen"-knappen.
async function callClaude(system, messages, maxTokens, json, schema) {
  return window.ATBClaude.collect({
    apiKey: state.apiKey, model: state.model, system, messages, maxTokens, json, schema,
    signal: state.abort ? state.abort.signal : undefined,
  });
}
async function streamClaude(system, messages, onDelta, maxTokens) {
  await window.ATBClaude.stream({
    apiKey: state.apiKey, model: state.model, system, messages, maxTokens, onDelta,
    signal: state.abort ? state.abort.signal : undefined,
  });
}

boot();
