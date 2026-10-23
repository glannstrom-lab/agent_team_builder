/* ============================================================
   Mitt AI-team — spåret "Firman växer" (SP1, SP2, SP3, SP9)

   Ren logik, ingen DOM. Firman levlar på saker som faktiskt hänt —
   en godkänd leverans, en avbockad rutin, ett möte som blev ett
   beslut som blev en rutin — och ALDRIG på att någon chattat. Det är
   samma ärlighetsregel som OM5 (sparad tid): det vi visar ska gå att
   stå för när köparen frågar.

   Filen är ett klassiskt skript som sätter `window.ATBFirman` (samma
   (function (g) { … })-mönster som avatars.js) och läses av
   test/firman.mjs i en egen vm-kontext — testet kör alltså samma kod
   som kunden, inte en kopia som kan bli mildare.

   ── INKOPPLING (görs i ett senare pass, när skisserna i UX4 är godkända) ──

   1. portal/index.html: <script src="firman.js"> före app.js. Lägg den
      också i SHELL i portal/sw.js och kontrollera att build-dist.mjs
      versionsstämplar den (se skillen kopplad-andring: SHELL och HTML
      ska bära samma URL:er, annars fäller check-dist bygget).

   2. Bokföringen. Ny nyckel `atb_firman_<slug>` = { v: 1, handelser: [] }
      med händelser { typ, at, agentId? } ur HANDELSER nedan. Lägg den i
      listan över nycklar som städas vid nytt utkast (app.js, raden med
      "atb_hello_", "atb_intro_", …) och i syncStatusNow(), som speglar
      den till teamstatus.json med slaIhopHandelser() — firman levlar,
      inte personen, så kollegor ska se samma nivå.
        • rutin_klar       — när kunden BOCKAR AV rutinen. INTE i
                             routineMarkDone() som den ser ut i dag: den
                             körs när rutinens prompt skickas (pendingRoutine
                             i submit-vägen) och när runAutoRoutines() kört
                             den åt kunden. Båda är chatt/automatik, inte
                             ett godkännande. Behåll routineMarkDone() för
                             veckobocken, och boka händelsen från en
                             uttrycklig "Klar ✓" på svaret.
        • leverans_godkand — en "✓ Godkänn"-knapp i addActions() (eller
                             IK3:s utkast → godkänn → ut när den finns).
        • projekt_paborjat — "Första steget är gjort" i openFirstProject(),
                             inte knappen "Be teamet ta första steget",
                             som bara skickar en fråga.
        • mote_beslut      — "Beslut fattat ✓" på mötesanteckningen.
        • rutin_ur_beslut  — "Gör beslutet till en rutin": lägger rutinen i
                             teamExt.routines (samma väg som renderGrowPreview)
                             och bokar händelsen.

   3. Ersätt:
        • wsCollapsed() och "＋ Visa hela arbetsytan" i renderSidebar()
          → upplast(niva, { anvant, examen, arv }). Varje wsBtn/extras-rad
          slår upp sin panel i PANELER; låsta ritas som en rad med
          `villkor`. "Visa allt" (ny flagga i teamExt) slår förbi.
        • renderIntroCard() och pulskortens lista i renderPulse()
          → ETT kort: nastaSteg(tillstand, Date.now()).
        • applyTeamExt(): nytt fält `hired` ({ agentId: ms }) i teamExt,
          samma väg som retired/edits. Agenter som inte står i
          rekrytering(...).anstallda filtreras bort (ingångsagenten står
          alltid kvar). Saknas `hired` helt är kunden befintlig och alla
          räknas som anställda — ingen förlorar en agent.
        • "Anställ alla nu" → saveTeamExt({ ...ext, hired: anstallAlla(...) }).
      Planen = team.agents utom ingångsagenten, i byggets ordning (den
      högst prioriterade först). Starten = teams.created_at ur
      /api/auth/me (samma som trialNoticeFor()), annars historikens
      första verkliga händelse.

   4. touchStreak()/streakCount() får stå kvar för märket "🔥 N veckor i
      rad" — men nivån läser dem inte, eftersom veckostarten och mötet
      (båda AI-anrop) också flyttar streaken.
   ============================================================ */
(function (g) {
  "use strict";

  const DAG = 86400000;

  // Takt-golvet: hela rekryteringsplanen ombord senast dag 21. Provmånaden
  // är 30 dagar (TRIAL_LENGTH_DAYS i portal/app.js) — kunden ska ha sett
  // hela teamet i arbete minst en vecka innan den tar slut. test/firman.mjs
  // läser TRIAL_LENGTH_DAYS ur app.js och fäller bygget om golvet inte längre
  // lämnar den veckan (SP14 kan ändra provmånaden).
  const GOLV_DAG = 21;

  // Nivå 5 → examen: "ett kvartal i gång". Mätt som både tid och arbete —
  // bara tid hade gett examen till den som betalat och inte gjort något.
  const KVARTAL_DAGAR = 91;
  const KVARTAL_RUTINVECKOR = 10; // tio av ett kvartals tretton veckor

  const RUTINVECKOR_NIVA4 = 3;

  // Det enda som flyttar nivån. Allt annat — chatt, veckostart, ett möte som
  // inte ledde någonstans, att öppna en panel — ignoreras av nivaFor(), även
  // om det skulle hamna i loggen.
  const HANDELSER = ["projekt_paborjat", "leverans_godkand", "rutin_klar", "mote_beslut", "rutin_ur_beslut"];

  // Trappan, andra utkastet (ROADMAP.md, spåret Firman växer). `krav` är
  // villkoret för att lämna nivån; `lasUpp` är det som öppnas när det
  // uppfylls. Rad 5:s krav ("ett kvartal i gång") har ingen nivå 6 — det är
  // examen, och det låser upp rad 5:s förmågor.
  const TRAPPAN = [
    { niva: 1, namn: "Första mötet", krav: "Första projektet påbörjat med VD-assistenten" },
    { niva: 2, namn: "Första anställningen", krav: "En leverans från specialisten godkänd" },
    { niva: 3, namn: "Rutinerna sitter", krav: "Rutiner avbockade tre veckor" },
    { niva: 4, namn: "Teamet samarbetar", krav: "Möte → beslut → rutin" },
    { niva: 5, namn: "Ni kan det här", krav: "Ett kvartal i gång" },
  ];

  // Arbetsytans paneler, namngivna efter knapparna i renderSidebar().
  // `niva` = nivån där panelen öppnas; `examen` = öppnas först vid examen.
  // `byggd: false` = förmågan finns inte i portalen än (IK2–IK4, OL4) —
  // den står här för att trappan ska kunna visa att den kommer.
  const PANELER = {
    "lar-kanna":        { niva: 1, etikett: "👋 Lär känna teamet" },
    "veckostart":       { niva: 1, etikett: "⭐ Veckostart" },
    "forsta-projektet": { niva: 1, etikett: "🎯 Första projektet" },
    "minne":            { niva: 1, etikett: "🧠 Minne & underlag" },
    "granska":          { niva: 1, etikett: "🔎 Granska mitt utkast" },
    "darfor":           { niva: 1, etikett: "✨ Därför detta team" },
    "veckobrev":        { niva: 1, etikett: "✉️ Veckobrev" }, // RE3: vecka tre loggar hon inte in — brevet ska finnas tidigt
    "veckans-arbete":   { niva: 2, etikett: "📈 Veckans arbete" },
    "sok":              { niva: 2, etikett: "🔍 Sök i historiken" },
    "rutiner":          { niva: 3, etikett: "Veckans rutiner" },
    "ova":              { niva: 3, etikett: "🎭 Öva ett samtal" },
    "mote":             { niva: 4, etikett: "🤝 Håll ett möte" },
    "kvartal":          { niva: 4, etikett: "🏆 Kvartalet med teamet" },
    "kedjor":           { niva: 5, etikett: "Kedjor", byggd: false },                       // IK4
    "godkann":          { niva: 5, etikett: "Utkast → godkänn → ut", byggd: false },        // IK3
    "rutiner-mejl":     { niva: 5, etikett: "Rutiner som mejlas", byggd: false },           // IK2
    "utveckla":         { niva: 5, examen: true, etikett: "🔄 Utveckla teamet (bortom planen)" },
    "export":           { niva: 5, examen: true, etikett: "Ta med teamet till egen AI", byggd: false }, // OL4
  };

  // Villkoret som text, i personalliggarens ton — det som står på raden
  // för en låst panel.
  const VILLKOR = {
    2: "Låses upp när första projektet kommit i gång",
    3: "Låses upp när du godkänt en leverans från er första specialist",
    4: "Låses upp när rutinerna suttit i tre veckor",
    5: "Låses upp när ett möte blivit ett beslut, och beslutet en rutin",
    examen: "Låses upp när firman varit i gång ett kvartal",
  };

  const ORD = ["noll", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio"];
  const ord = (n) => (n >= 0 && n < ORD.length ? ORD[n] : String(n));
  const veckor = (n) => `${ord(n)} ${n === 1 ? "vecka" : "veckor"}`;

  // ISO-vecka, samma algoritm som isoWeek() i portal/app.js — veckoliggaren
  // `atb_sparad_<slug>` bär nycklar i just den formen ("2026-W43"), och en
  // annan räkning hade gett två veckor där det var en.
  function isoVecka(ms) {
    const d = new Date(ms);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day + 3);
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const week = 1 + Math.round(((d - jan4) / DAG - 3 + ((jan4.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  // ── historikens form ────────────────────────────────────────────────────
  //
  //   {
  //     entryAgent: "vd-assistent",   // ingångsagenten (team.entryAgent)
  //     start: 1761000000000 | null,  // köpet (teams.created_at), annars första händelsen
  //     arv: false,                   // true = härledd ur lagring från före firman-loggen
  //     handelser: [
  //       { typ: "rutin_klar", at: ms, agentId?: "offert", arv?: true },
  //       …
  //     ],
  //     anvant: { veckostart: true, mote: true, … }  // panel → redan använd
  //   }
  //
  // `typ` ur HANDELSER. `arv: true` på en händelse = den kommer ur gammal
  // lagring där agenten inte går att avgöra (veckoliggaren bär ingen agent);
  // den räknas till kundens fördel.
  function normalisera(h) {
    h = h && typeof h === "object" ? h : {};
    const handelser = (Array.isArray(h.handelser) ? h.handelser : [])
      .filter((e) => e && HANDELSER.includes(e.typ) && Number.isFinite(+e.at));
    return {
      entryAgent: typeof h.entryAgent === "string" ? h.entryAgent : null,
      start: Number.isFinite(+h.start) && +h.start > 0 ? +h.start : null,
      arv: !!h.arv,
      handelser,
      anvant: h.anvant && typeof h.anvant === "object" ? h.anvant : {},
    };
  }

  // Villkoren, ett per trappsteg. Varje funktion läser bara verkliga
  // händelser fram till `nu`.
  function matt(h, nu) {
    const ev = h.handelser.filter((e) => +e.at <= nu);
    const av = (typ) => ev.filter((e) => e.typ === typ);

    // En avbockad rutin är också en godkänd leverans: kunden har sagt att
    // arbetet är gjort. Från specialisten = någon annan än ingångsagenten.
    const frånSpecialist = (e) =>
      (e.typ === "leverans_godkand" || e.typ === "rutin_klar") &&
      (e.agentId ? e.agentId !== h.entryAgent : e.arv === true);

    const rutinVeckor = new Set(av("rutin_klar").map((e) => isoVecka(+e.at))).size;
    const beslut = av("mote_beslut");
    const beslutBlevRutin = beslut.some((b) => av("rutin_ur_beslut").some((r) => +r.at >= +b.at));

    const forsta = ev.length ? Math.min(...ev.map((e) => +e.at)) : null;
    const start = h.start || forsta;
    const dagar = start ? Math.floor((nu - start) / DAG) : 0;

    const v = {
      1: ev.some((e) => e.typ === "projekt_paborjat" || e.typ === "leverans_godkand" || e.typ === "rutin_klar"),
      2: ev.some(frånSpecialist),
      3: rutinVeckor >= RUTINVECKOR_NIVA4,
      4: beslutBlevRutin,
    };
    const examen = v[4] && dagar >= KVARTAL_DAGAR && rutinVeckor >= KVARTAL_RUTINVECKOR;
    return { v, examen, rutinVeckor, beslut: beslut.length, dagar };
  }

  // nivaFor(historik, nu) → { niva, namn, kvar, examen }
  //
  // Nivån är det högsta trappsteg vars villkor är uppfyllt, plus ett. Bevis
  // för ett högre steg räknas alltså som att de lägre är passerade: den som
  // bockat av rutiner i tre veckor har uppenbarligen kommit i gång. För en ny
  // kund gör upplåsningen ordningen ändå (rutinerna öppnas först på nivå 3),
  // och för en befintlig kund är det skälet till att hon hamnar rätt direkt.
  function nivaFor(historik, nu) {
    nu = Number.isFinite(+nu) ? +nu : Date.now();
    const h = normalisera(historik);
    const m = matt(h, nu);
    let niva = 1;
    for (let k = 4; k >= 1; k--) if (m.v[k]) { niva = k + 1; break; }

    let kvar = "";
    if (niva === 1) kvar = "att första projektet kommer i gång med VD-assistenten";
    else if (niva === 2) kvar = "en leverans från er första specialist som du godkänt";
    else if (niva === 3) {
      const n = RUTINVECKOR_NIVA4 - m.rutinVeckor;
      kvar = m.rutinVeckor ? `${veckor(n)} till med avbockade rutiner` : `${veckor(n)} med avbockade rutiner`;
    } else if (niva === 4) {
      kvar = m.beslut
        ? "att beslutet från mötet blir en rutin"
        : "ett möte som landar i ett beslut — och beslutet blir en rutin";
    } else if (!m.examen) {
      const delar = [];
      const dagKvar = KVARTAL_DAGAR - m.dagar;
      if (dagKvar > 0) delar.push(`${veckor(Math.ceil(dagKvar / 7))} till i gång`);
      const vKvar = KVARTAL_RUTINVECKOR - m.rutinVeckor;
      if (vKvar > 0) delar.push(`${veckor(vKvar)} till med avbockade rutiner`);
      kvar = delar.join(" och ");
    }
    return { niva, namn: TRAPPAN[niva - 1].namn, kvar, examen: m.examen };
  }

  // upplast(niva, { anvant, examen, visaAllt, arv }) → { [panel]: { upplast, villkor, byggd } }
  //
  // `anvant` är bakåtkompatibiliteten: det kunden redan använt är upplåst
  // oavsett nivå. Ingen befintlig kund ska öppna portalen och hitta en
  // knapp hon tryckt på förra veckan bakom ett lås.
  function upplast(niva, opts) {
    opts = opts || {};
    const n = Math.max(1, Math.min(5, Math.floor(+niva) || 1));
    const anvant = opts.anvant || {};
    const ut = {};
    Object.keys(PANELER).forEach((id) => {
      const p = PANELER[id];
      const genomNiva = p.examen ? n >= 5 && !!opts.examen : n >= p.niva;
      // En befintlig kund (historik.arv) har sett hela arbetsytan i dag, så
      // allt står öppet för henne: "ingen befintlig kund förlorar något" gäller
      // det hon sett, inte bara det hon använt (beslut 2026-10-23). Nivån räknas
      // och visas ändå — den låser bara inte.
      const ok = genomNiva || !!anvant[id] || !!opts.visaAllt || !!opts.arv;
      ut[id] = {
        upplast: ok,
        villkor: ok ? null : p.examen && n >= p.niva ? VILLKOR.examen : VILLKOR[p.niva],
        byggd: p.byggd !== false,
        etikett: p.etikett,
      };
    });
    return ut;
  }

  // ── rekryteringen (SP9) ──────────────────────────────────────────────────
  //
  // rekrytering(plan, hired, nu, start, { niva }) →
  //   { anstallda, kvar, nasta, dags, skal, golvDatum, allaSenast, arv }
  //
  //   plan   — specialisterna i turordning (id-strängar eller { id }),
  //            ingångsagenten EJ med: hen är anställd från dag ett.
  //   hired  — teamExt.hired: { agentId: ms } (eller en lista id:n).
  //            null/undefined = befintlig kund från före SP9: alla anställda.
  //   start  — köpet (teams.created_at). Utan start finns inget golv.
  //
  // Nivån öppnar platser: nivå 2 → första specialisten, nivå 3 → nästa,
  // nivå 4 → resten. Golvet fördelar planen jämnt fram till dag 21, så att
  // den k:te av n anställningarna föreslås senast dag round(21·k/n) även om
  // nivån inte hunnit dit — "VD-assistenten föreslår nästa anställning ändå".
  function planIds(plan) {
    const ids = [];
    (Array.isArray(plan) ? plan : []).forEach((p) => {
      const id = typeof p === "string" ? p : p && p.id;
      if (id && !ids.includes(id)) ids.push(id);
    });
    return ids;
  }
  function hiredMap(hired) {
    if (Array.isArray(hired)) { const m = {}; hired.forEach((id) => { if (typeof id === "string") m[id] = null; }); return m; }
    return hired && typeof hired === "object" ? hired : {};
  }
  function platserFor(niva, n) {
    if (niva >= 4) return n;
    if (niva === 3) return Math.min(2, n);
    if (niva === 2) return Math.min(1, n);
    return 0;
  }

  function rekrytering(plan, hired, nu, start, opts) {
    opts = opts || {};
    nu = Number.isFinite(+nu) ? +nu : Date.now();
    const ids = planIds(plan);
    const arv = hired == null;
    const karta = arv ? Object.fromEntries(ids.map((id) => [id, null])) : hiredMap(hired);
    const anstallda = ids.filter((id) => Object.prototype.hasOwnProperty.call(karta, id));
    const kvar = ids.filter((id) => !anstallda.includes(id));
    const nasta = kvar[0] || null;
    const n = ids.length;
    const s = Number.isFinite(+start) && +start > 0 ? +start : null;

    const golvDatum = nasta && s ? s + Math.round((GOLV_DAG * (anstallda.length + 1)) / n) * DAG : null;
    const genomNiva = anstallda.length < platserFor(Math.floor(+opts.niva) || 1, n);
    const genomGolv = golvDatum != null && nu >= golvDatum;
    const dags = !!nasta && (genomNiva || genomGolv);

    return {
      anstallda,
      kvar,
      nasta,
      dags,
      skal: !dags ? null : genomNiva ? "niva" : "golv",
      golvDatum,
      allaSenast: s && n ? s + GOLV_DAG * DAG : null,
      arv,
    };
  }

  // "Anställ alla nu": ny karta, befintliga datum orörda, resten anställs nu.
  // Muterar inget — anroparen sparar resultatet i teamExt.hired.
  function anstallAlla(plan, hired, nu) {
    nu = Number.isFinite(+nu) ? +nu : Date.now();
    const ut = Object.assign({}, hiredMap(hired));
    planIds(plan).forEach((id) => { if (!Object.prototype.hasOwnProperty.call(ut, id)) ut[id] = nu; });
    return ut;
  }

  // ── nästa steg (SP1) ─────────────────────────────────────────────────────
  //
  // nastaSteg(tillstand, nu) → { typ, text, agentId } — alltid exakt ett.
  //
  //   tillstand = {
  //     niva, examen?, anvant?,            // ur nivaFor()/historikUr()
  //     entryAgent: "vd-assistent",
  //     namn?: { agentId: "Visningsnamn" },
  //     forstaProjektet?: { namn?, agentId?, paborjat },
  //     utkast?: [{ id, agentId, titel }],  // väntar på godkännande (IK3; tom i dag)
  //     rutiner?: [{ label, agentId, day, klar }],   // day 1=mån … 7=sön
  //     mote?: { fokus, agentId } | null,   // ett möte som väntar
  //     rekrytering?: rekrytering(...)-resultatet,
  //     veckomoteHallet?: bool,             // veckostarten körd denna vecka
  //   }
  //
  // ORDNINGEN, och varför:
  //   1. Första projektet — på nivå 1 finns inget annat att göra; allt
  //      senare i trappan förutsätter att firman kommit i gång.
  //   2. Utkast att godkänna — arbetet är redan gjort och betalt och står
  //      och väntar på kunden. Det är billigast att göra, och ett godkännande
  //      är dessutom just den händelse trappan levlar på.
  //   3. Rutin som förfaller i dag — bunden till dagen; i morgon är den sen.
  //   4. Möte att hålla — ett beslut som väntar, men inte på timmen.
  //   5. Nästa anställning — när nivån eller golvet (dag 21) säger att det
  //      är dags. Den ligger efter dagens arbete: en ny kollega presenteras
  //      bäst när det som redan väntar är gjort.
  //   6. Veckomötet — finns alltid, och är därför garantin att det alltid
  //      finns exakt ett steg.
  function nastaSteg(tillstand, nu) {
    const t = tillstand && typeof tillstand === "object" ? tillstand : {};
    nu = Number.isFinite(+nu) ? +nu : Date.now();
    const niva = Math.max(1, Math.min(5, Math.floor(+t.niva) || 1));
    const entry = t.entryAgent || null;
    const namn = (id) => (t.namn && id && t.namn[id]) || (id === entry ? "VD-assistenten" : id || "teamet");
    const open = upplast(niva, { anvant: t.anvant, examen: t.examen, visaAllt: t.visaAllt, arv: t.arv });

    const fp = t.forstaProjektet;
    if (niva === 1 && !(fp && fp.paborjat)) {
      const agentId = (fp && fp.agentId) || entry;
      const vad = fp && fp.namn ? `"${fp.namn}"` : "ert första projekt";
      return { typ: "forsta-projektet", text: `Kom i gång med ${vad} tillsammans med ${namn(agentId)}`, agentId };
    }

    const utkast = (Array.isArray(t.utkast) ? t.utkast : []).find((u) => u && u.agentId);
    if (utkast) {
      return { typ: "utkast", text: `${namn(utkast.agentId)} har ett utkast som väntar på ditt godkännande${utkast.titel ? `: ${utkast.titel}` : ""}`, agentId: utkast.agentId };
    }

    const idag = Number.isFinite(+t.idag) ? +t.idag : ((new Date(nu).getDay() + 6) % 7) + 1;
    if (open.rutiner.upplast) {
      const r = (Array.isArray(t.rutiner) ? t.rutiner : []).find((x) => x && x.day === idag && !x.klar);
      if (r) {
        const agentId = r.agentId || entry;
        return { typ: "rutin", text: `I dag: ${r.label} — med ${namn(agentId)}`, agentId };
      }
    }

    if (open.mote.upplast && t.mote && t.mote.fokus) {
      const agentId = t.mote.agentId || entry;
      return { typ: "mote", text: `Håll mötet om ${t.mote.fokus}`, agentId };
    }

    const rk = t.rekrytering;
    if (rk && rk.dags && rk.nasta) {
      return { typ: "anstallning", text: `Dags att anställa ${namn(rk.nasta)}`, agentId: rk.nasta };
    }

    return t.veckomoteHallet
      ? { typ: "veckomote", text: `Veckomötet är hållet — ge ${namn(entry)} nästa uppdrag`, agentId: entry }
      : { typ: "veckomote", text: `Håll veckomötet med ${namn(entry)}`, agentId: entry };
  }

  // ── adaptern: portalens lagring → historik ──────────────────────────────
  //
  // historikUr(lagring, slug, team, { start }) → historik (formen ovan)
  //
  // `lagring` är något med getItem (localStorage, eller en Map-attrapp i
  // testet). Nycklarna som läses, alla `<prefix><slug>`:
  //
  //   atb_firman_   — NY: händelseloggen { v, handelser }. Finns inte i dag;
  //                   bokförs när filen kopplas in (se överst).
  //   atb_sparad_   — veckoliggaren (OM5) [{ v: "2026-W43", m, at }]. Den
  //                   enda källan som överlever ISO-veckoskiftet — men bara
  //                   för veckor där en rutin MED timeEstimate bockats av.
  //   atb_rout_     — innevarande (eller förra) veckans avbockningar
  //                   { week, done: [{ label, at }] }.
  //   atb_auto_     — kvitton på auto-körda rutiner. Används för att
  //                   SORTERA BORT dem: en rutin teamet kört själv är inget
  //                   kunden gjort.
  //   atb_hist_     — chatthistoriken. Läses bara för startdatum som reserv;
  //                   ingenting i den blir en händelse. Möten (svar med
  //                   `perspectives`) blir `anvant.mote`, inte nivå.
  //   atb_intro_    — kom igång-flaggorna (week, meeting, digest) → anvant.
  //   atb_fp_       — första projektet öppnat → anvant (inte nivå: att öppna
  //                   en panel är inte att göra något).
  //   atb_teamext_  — tillagda agenter → anvant.utveckla.
  //
  // Läses INTE: atb_streak_ (veckostart och möte flyttar den — båda chatt).
  function läs(lagring, nyckel) {
    try {
      const raw = lagring && typeof lagring.getItem === "function" ? lagring.getItem(nyckel) : null;
      return raw == null ? null : JSON.parse(raw);
    } catch (_) { return null; } // trasig post — hellre ingen historik än en krasch
  }
  function läsRå(lagring, nyckel) {
    try { return lagring && typeof lagring.getItem === "function" ? lagring.getItem(nyckel) : null; }
    catch (_) { return null; }
  }

  function historikUr(lagring, slug, team, opts) {
    opts = opts || {};
    team = team && typeof team === "object" ? team : {};
    const rutiner = Array.isArray(team.routines) ? team.routines : [];
    const agentFör = (label) => { const r = rutiner.find((x) => x && x.label === label); return r && r.agentId ? r.agentId : null; };

    const firman = läs(lagring, "atb_firman_" + slug);
    const egna = firman && Array.isArray(firman.handelser) ? firman.handelser : [];
    const handelser = egna.filter((e) => e && HANDELSER.includes(e.typ) && Number.isFinite(+e.at)).map((e) => Object.assign({}, e));
    const arv = !firman;

    if (arv) {
      // Auto-körda rutiner bockas av i samma loggar som kundens egna, och
      // går bara att skilja ut så länge kvittot ligger kvar (sju dagar).
      const auto = läs(lagring, "atb_auto_" + slug);
      const autoEtiketter = new Set((Array.isArray(auto) ? auto : []).map((d) => d && d.label).filter(Boolean));

      const ligg = läs(lagring, "atb_sparad_" + slug);
      (Array.isArray(ligg) ? ligg : []).forEach((x) => {
        if (x && x.v && +x.m > 0 && Number.isFinite(+x.at)) handelser.push({ typ: "rutin_klar", at: +x.at, arv: true });
      });
      const rout = läs(lagring, "atb_rout_" + slug);
      if (rout && Array.isArray(rout.done)) {
        rout.done.forEach((d) => {
          const label = d && (d.label || d);
          const at = d && +d.at;
          if (!label || !Number.isFinite(at) || autoEtiketter.has(label)) return;
          const agentId = agentFör(label);
          handelser.push(agentId ? { typ: "rutin_klar", at, agentId, arv: true } : { typ: "rutin_klar", at, arv: true });
        });
      }
    }

    // Vad kunden redan använt — upplåst oavsett nivå.
    const anvant = {};
    const intro = läs(lagring, "atb_intro_" + slug) || {};
    if (intro.week) anvant.veckostart = true;
    if (intro.meeting) anvant.mote = true;
    if (intro.digest) anvant.veckobrev = true;
    if (+läsRå(lagring, "atb_fp_" + slug) > 0) anvant["forsta-projektet"] = true;
    const ext = läs(lagring, "atb_teamext_" + slug) || {};
    if (Array.isArray(ext.agents) && ext.agents.length) anvant.utveckla = true;

    const hist = läs(lagring, "atb_hist_" + slug);
    let förstaSvar = null;
    if (hist && typeof hist === "object") {
      Object.keys(hist).forEach((id) => {
        (Array.isArray(hist[id]) ? hist[id] : []).forEach((m) => {
          if (!m || !Number.isFinite(+m.at)) return;
          if (förstaSvar == null || +m.at < förstaSvar) förstaSvar = +m.at;
          if (m.role === "assistant" && Array.isArray(m.perspectives) && m.perspectives.length) anvant.mote = true;
        });
      });
    }
    if (handelser.some((e) => e.typ === "rutin_klar")) anvant.rutiner = true;

    const startar = [+opts.start, +(firman && firman.start), förstaSvar, ...handelser.map((e) => +e.at)]
      .filter((x) => Number.isFinite(x) && x > 0);
    const start = Number.isFinite(+opts.start) && +opts.start > 0 ? +opts.start : startar.length ? Math.min(...startar) : null;

    return {
      entryAgent: typeof team.entryAgent === "string" ? team.entryAgent : null,
      start,
      arv: arv && (handelser.length > 0 || förstaSvar != null),
      handelser,
      anvant,
    };
  }

  // Union av två händelselistor (lokalt + teamstatus.json). Samma typ, tid
  // och agent är samma händelse — två kollegor som synkar samma logg ska
  // inte få dubbla rutinveckor.
  function slaIhopHandelser(a, b) {
    const ut = [];
    const sett = new Set();
    [].concat(Array.isArray(a) ? a : [], Array.isArray(b) ? b : []).forEach((e) => {
      if (!e || !HANDELSER.includes(e.typ) || !Number.isFinite(+e.at)) return;
      const k = `${e.typ}|${+e.at}|${e.agentId || ""}`;
      if (sett.has(k)) return;
      sett.add(k);
      ut.push(e);
    });
    return ut.sort((x, y) => +x.at - +y.at);
  }

  g.ATBFirman = {
    GOLV_DAG, KVARTAL_DAGAR, KVARTAL_RUTINVECKOR, RUTINVECKOR_NIVA4,
    HANDELSER, TRAPPAN, PANELER,
    isoVecka, nivaFor, upplast, rekrytering, anstallAlla, nastaSteg, historikUr, slaIhopHandelser,
  };
})(typeof window !== "undefined" ? window : globalThis);
