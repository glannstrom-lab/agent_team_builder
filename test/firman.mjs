// Tester för spåret "Firman växer" (SP1, SP2, SP3, SP9) — portal/firman.js.
//
// Varför de finns: hela spåret vilar på en ärlighetsregel — firman levlar på
// det som faktiskt hänt, aldrig på att någon chattat. Den regeln syns inte i
// en webbläsare förrän en kund märker att nivån går att "farma" med frågor,
// och då är förtroendet för siffran redan borta. Därför står den här.
//
// Filen läses in i en egen vm-kontext, precis som webbläsaren läser den som
// klassiskt skript — testet kör samma kod som kunden, inte en kopia.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const KÄLLA = readFileSync("portal/firman.js", "utf8");
const ctx = vm.createContext({});
vm.runInContext(KÄLLA, ctx, { filename: "portal/firman.js" });
const F = ctx.ATBFirman;

const DAG = 86400000;
// Måndagar kl 12 lokal tid, så att ISO-veckan aldrig hamnar på en gräns.
const MÅN = new Date(2026, 9, 5, 12).getTime(); // 2026-10-05, måndag
const vecka = (n) => MÅN + n * 7 * DAG;

const h = (handelser, extra = {}) => ({ entryAgent: "vd-assistent", handelser, ...extra });
const ev = (typ, at, agentId) => (agentId ? { typ, at, agentId } : { typ, at });

function lagring(poster) {
  const m = new Map(Object.entries(poster).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null) };
}

// ── chatt höjer aldrig ──────────────────────────────────────────────────────

test("chatt utan leverans höjer aldrig nivån — inte ens tusen frågor", () => {
  const chatt = [];
  for (let i = 0; i < 1000; i++) {
    chatt.push(ev("chatt", vecka(i % 20)), ev("svar", vecka(i % 20), "offert"),
      ev("veckostart", vecka(i % 20)), ev("mote_hallet", vecka(i % 20)));
  }
  const r = F.nivaFor(h(chatt), vecka(30));
  assert.equal(r.niva, 1);
  assert.equal(r.examen, false);
});

test("adaptern gör ingen händelse av chatthistorik, möten eller streak", () => {
  // En flitig kund som bara pratat: hundra svar per agent, möten, en streak
  // på tolv veckor och första projektet öppnat. Ingenting av det är en
  // leverans någon godkänt.
  const hist = { "vd-assistent": [], offert: [] };
  for (let i = 0; i < 100; i++) {
    hist["vd-assistent"].push({ role: "user", content: "fråga", at: vecka(i % 12) }, { role: "assistant", content: "svar", at: vecka(i % 12) + 1 });
    hist.offert.push({ role: "assistant", content: "## 🤝 Mötesanteckning", perspectives: [{ name: "x", text: "y" }], at: vecka(i % 12) + 2 });
  }
  const l = lagring({
    atb_hist_kund: hist,
    atb_streak_kund: { lastAt: vecka(12), count: 12, freezeQ: "" },
    atb_intro_kund: { week: true, meeting: true },
    atb_fp_kund: String(vecka(0)),
  });
  const hi = F.historikUr(l, "kund", { entryAgent: "vd-assistent", routines: [] });
  assert.equal(hi.handelser.length, 0, "chatt blev en händelse");
  assert.equal(F.nivaFor(hi, vecka(13)).niva, 1);
  // …men det hon använt är upplåst.
  assert.equal(hi.anvant.mote, true);
  assert.equal(hi.anvant.veckostart, true);
  assert.equal(F.upplast(1, { anvant: hi.anvant }).mote.upplast, true);
});

test("auto-körda rutiner räknas inte — teamet gjorde dem, inte kunden", () => {
  const l = lagring({
    atb_rout_kund: { week: F.isoVecka(vecka(0)), done: [{ label: "Måndagsbrief", at: vecka(0) }] },
    atb_auto_kund: [{ label: "Måndagsbrief", agentId: "offert", at: vecka(0) }],
  });
  const hi = F.historikUr(l, "kund", { entryAgent: "vd-assistent", routines: [{ label: "Måndagsbrief", agentId: "offert" }] });
  assert.equal(hi.handelser.length, 0);
  assert.equal(F.nivaFor(hi, vecka(0)).niva, 1);
});

// ── varje gräns nås exakt på sitt villkor ───────────────────────────────────

test("nivå 1 → 2: första projektet påbörjat, inte förr", () => {
  assert.equal(F.nivaFor(h([]), vecka(0)).niva, 1);
  assert.equal(F.nivaFor(h([ev("projekt_paborjat", vecka(0))]), vecka(0)).niva, 2);
  // En godkänd leverans från VD-assistenten är också en start.
  assert.equal(F.nivaFor(h([ev("leverans_godkand", vecka(0), "vd-assistent")]), vecka(0)).niva, 2);
  // En händelse i framtiden räknas inte.
  assert.equal(F.nivaFor(h([ev("projekt_paborjat", vecka(1))]), vecka(0)).niva, 1);
});

test("nivå 2 → 3: en godkänd leverans från en SPECIALIST", () => {
  const bas = [ev("projekt_paborjat", vecka(0))];
  assert.equal(F.nivaFor(h([...bas, ev("leverans_godkand", vecka(0), "vd-assistent")]), vecka(1)).niva, 2,
    "VD-assistentens leverans ska inte räknas som specialistens");
  assert.equal(F.nivaFor(h([...bas, ev("leverans_godkand", vecka(0), "offert")]), vecka(1)).niva, 3);
});

test("nivå 3 → 4: rutiner avbockade i tre olika veckor", () => {
  const bas = [ev("projekt_paborjat", vecka(0)), ev("leverans_godkand", vecka(0), "offert")];
  const r2 = F.nivaFor(h([...bas, ev("rutin_klar", vecka(1), "offert"), ev("rutin_klar", vecka(2), "offert")]), vecka(3));
  assert.equal(r2.niva, 3);
  assert.equal(r2.kvar, "en vecka till med avbockade rutiner");
  // Fem bockar samma vecka är fortfarande en vecka.
  const samma = [1, 2, 3, 4, 5].map((i) => ev("rutin_klar", vecka(1) + i * 3600000, "offert"));
  assert.equal(F.nivaFor(h([...bas, ...samma]), vecka(3)).kvar, "två veckor till med avbockade rutiner");
  const r3 = F.nivaFor(h([...bas, ev("rutin_klar", vecka(1)), ev("rutin_klar", vecka(2)), ev("rutin_klar", vecka(4))]), vecka(5));
  assert.equal(r3.niva, 4);
  assert.equal(r3.namn, "Teamet samarbetar");
});

test("nivå 4 → 5: möte → beslut → rutin, i den ordningen", () => {
  const bas = [ev("projekt_paborjat", vecka(0)), ev("leverans_godkand", vecka(0), "offert"),
    ev("rutin_klar", vecka(1)), ev("rutin_klar", vecka(2)), ev("rutin_klar", vecka(3))];
  const beslut = F.nivaFor(h([...bas, ev("mote_beslut", vecka(4))]), vecka(5));
  assert.equal(beslut.niva, 4);
  assert.equal(beslut.kvar, "att beslutet från mötet blir en rutin");
  assert.equal(F.nivaFor(h([...bas, ev("rutin_ur_beslut", vecka(4)), ev("mote_beslut", vecka(5))]), vecka(6)).niva, 4,
    "en rutin från FÖRE beslutet kom inte ur beslutet");
  assert.equal(F.nivaFor(h([...bas, ev("mote_beslut", vecka(4)), ev("rutin_ur_beslut", vecka(4) + 60000)]), vecka(5)).niva, 5);
});

test("examen: ett kvartal i gång — både tid och arbete", () => {
  const start = vecka(0);
  const rutiner = (n) => Array.from({ length: n }, (_, i) => ev("rutin_klar", vecka(i + 1)));
  const fem = [ev("projekt_paborjat", start), ev("leverans_godkand", start, "offert"),
    ev("mote_beslut", vecka(2)), ev("rutin_ur_beslut", vecka(2) + 1)];
  const på = (n, nu) => F.nivaFor(h([...fem, ...rutiner(n)], { start }), nu);
  assert.equal(på(10, start + 90 * DAG).examen, false, "dag 90 är inte ett kvartal");
  assert.equal(på(10, start + 91 * DAG).examen, true);
  assert.equal(på(9, start + 200 * DAG).examen, false, "tid utan arbete ger ingen examen");
  assert.equal(på(9, start + 200 * DAG).kvar, "en vecka till med avbockade rutiner");
  assert.equal(på(10, start + 91 * DAG).kvar, "");
  // Examen öppnar rad 5:s förmågor, nivå 5 ensam gör det inte.
  assert.equal(F.upplast(5, { examen: false }).utveckla.upplast, false);
  assert.match(F.upplast(5, { examen: false }).utveckla.villkor, /kvartal/);
  assert.equal(F.upplast(5, { examen: true }).utveckla.upplast, true);
});

// ── upplåsning ──────────────────────────────────────────────────────────────

test("låsta paneler bär sitt villkor som text, upplåsta inget", () => {
  const u = F.upplast(1);
  assert.equal(u.veckostart.upplast, true);
  assert.equal(u.veckostart.villkor, null);
  assert.equal(u.rutiner.upplast, false);
  assert.equal(u.rutiner.villkor, "Låses upp när du godkänt en leverans från er första specialist");
  assert.equal(u.mote.villkor, "Låses upp när rutinerna suttit i tre veckor");
  assert.equal(F.upplast(4).mote.upplast, true);
  assert.equal(F.upplast(1, { visaAllt: true }).mote.upplast, true, "Visa allt ska slå förbi trappan");
});

test("varje panel öppnas på sin nivå och aldrig stängs högre upp", () => {
  for (let n = 1; n < 5; n++) {
    const a = F.upplast(n), b = F.upplast(n + 1);
    Object.keys(a).forEach((id) => {
      if (a[id].upplast) assert.equal(b[id].upplast, true, `${id} stängdes på nivå ${n + 1}`);
    });
  }
});

// ── nästa steg ──────────────────────────────────────────────────────────────

const fullt = {
  niva: 4, entryAgent: "vd-assistent", namn: { "vd-assistent": "Vera", offert: "Olle" },
  forstaProjektet: { namn: "Offertmallen", paborjat: false },
  utkast: [{ id: "u1", agentId: "offert", titel: "Offert till Byggbolaget" }],
  rutiner: [{ label: "Måndagens offerter", agentId: "offert", day: 1, klar: false }],
  mote: { fokus: "prissättningen", agentId: "vd-assistent" },
  rekrytering: { dags: true, nasta: "ekonomi" },
  veckomoteHallet: false,
};

test("nastaSteg ger alltid exakt ett steg, i prioritetsordning", () => {
  const steg = (t) => F.nastaSteg(t, MÅN);
  const typ = (t) => steg(t).typ;
  // Nivå 1 utan påbörjat projekt: första projektet, oavsett vad som väntar.
  assert.equal(typ({ ...fullt, niva: 1 }), "forsta-projektet");
  assert.equal(steg({ ...fullt, niva: 1 }).agentId, "vd-assistent");
  assert.equal(typ(fullt), "utkast");
  assert.equal(typ({ ...fullt, utkast: [] }), "rutin");
  assert.equal(typ({ ...fullt, utkast: [], rutiner: [{ ...fullt.rutiner[0], klar: true }] }), "mote");
  assert.equal(typ({ ...fullt, utkast: [], rutiner: [], mote: null }), "anstallning");
  assert.equal(steg({ ...fullt, utkast: [], rutiner: [], mote: null }).agentId, "ekonomi");
  assert.equal(typ({ ...fullt, utkast: [], rutiner: [], mote: null, rekrytering: { dags: false, nasta: "ekonomi" } }), "veckomote");
});

test("nastaSteg tål tomt, trasigt och konstigt tillstånd — ett steg ändå", () => {
  const fall = [undefined, null, {}, "nej", { niva: 99 }, { niva: -3 }, { niva: 3, rutiner: "x", utkast: {} },
    { niva: 2, forstaProjektet: { paborjat: true } }, fullt, { ...fullt, niva: 1 }];
  fall.forEach((t) => {
    const s = F.nastaSteg(t, MÅN);
    assert.ok(s && typeof s === "object" && !Array.isArray(s), "inte ett steg");
    assert.equal(Object.keys(s).sort().join(","), "agentId,text,typ");
    assert.ok(typeof s.typ === "string" && s.typ && typeof s.text === "string" && s.text);
  });
});

test("en rutin föreslås inte innan rutinerna är upplåsta — om hon inte redan använt dem", () => {
  const t = { niva: 2, entryAgent: "vd-assistent", forstaProjektet: { paborjat: true },
    rutiner: [{ label: "Måndagens offerter", agentId: "offert", day: 1, klar: false }] };
  assert.equal(F.nastaSteg(t, MÅN).typ, "veckomote");
  assert.equal(F.nastaSteg({ ...t, anvant: { rutiner: true } }, MÅN).typ, "rutin");
});

// ── rekryteringen och dag 21-golvet ────────────────────────────────────────

const PLAN = ["offert", "ekonomi", "marknad"];

test("nivån öppnar platser: 0, 1, 2, alla", () => {
  const start = MÅN;
  const på = (niva, hired) => F.rekrytering(PLAN, hired, start + DAG, start, { niva });
  assert.equal(på(1, {}).dags, false);
  assert.equal(på(2, {}).dags, true);
  assert.equal(på(2, {}).nasta, "offert");
  assert.equal(på(2, {}).skal, "niva");
  assert.equal(på(2, { offert: start }).dags, false);
  assert.equal(på(3, { offert: start }).nasta, "ekonomi");
  assert.equal(på(3, { offert: start }).dags, true);
  assert.equal(på(4, { offert: start, ekonomi: start }).nasta, "marknad");
  assert.equal(på(4, { offert: start, ekonomi: start }).dags, true);
});

test("dag 21-golvet: hela planen föreslås senast dag 21 även på nivå 1", () => {
  const start = MÅN;
  const r = (hired, dag) => F.rekrytering(PLAN, hired, start + dag * DAG, start, { niva: 1 });
  // Tre i planen → senast dag 7, 14, 21.
  assert.equal(r({}, 6).dags, false);
  assert.equal(r({}, 7).dags, true);
  assert.equal(r({}, 7).skal, "golv");
  assert.equal(r({ offert: 1 }, 13).dags, false);
  assert.equal(r({ offert: 1 }, 14).dags, true);
  assert.equal(r({ offert: 1, ekonomi: 1 }, 20).dags, false);
  assert.equal(r({ offert: 1, ekonomi: 1 }, 21).dags, true);
  assert.equal(r({ offert: 1, ekonomi: 1 }, 21).golvDatum, start + 21 * DAG, "sista anställningen ska landa exakt på dag 21");
  assert.equal(r({}, 0).allaSenast, start + F.GOLV_DAG * DAG);
  // En specialist i planen: dag 21, inte tidigare.
  assert.equal(F.rekrytering(["offert"], {}, start + 20 * DAG, start, { niva: 1 }).dags, false);
  assert.equal(F.rekrytering(["offert"], {}, start + 21 * DAG, start, { niva: 1 }).dags, true);
  // Utan startdatum finns inget golv att räkna från.
  assert.equal(F.rekrytering(PLAN, {}, start + 99 * DAG, null, { niva: 1 }).dags, false);
});

test("golvet lämnar en vecka av provmånaden — läst ur portal/app.js", () => {
  // SP14 kan ändra provmånaden. Krymper den utan att golvet följer med ser
  // kunden aldrig hela teamet i arbete innan hon ska bestämma sig.
  const m = /const TRIAL_LENGTH_DAYS = (\d+);/.exec(readFileSync("portal/app.js", "utf8"));
  assert.ok(m, "hittade inte TRIAL_LENGTH_DAYS i portal/app.js");
  assert.ok(F.GOLV_DAG <= +m[1] - 7, `golvet (dag ${F.GOLV_DAG}) lämnar mindre än en vecka av ${m[1]} dagar`);
});

test("Anställ alla nu: alla i planen, befintliga datum orörda", () => {
  const hired = { offert: MÅN };
  const alla = F.anstallAlla(PLAN, hired, MÅN + 5 * DAG);
  assert.deepEqual(Object.keys(alla).sort(), [...PLAN].sort());
  assert.equal(alla.offert, MÅN, "den som redan var anställd fick nytt datum");
  assert.equal(alla.ekonomi, MÅN + 5 * DAG);
  assert.deepEqual(hired, { offert: MÅN }, "anstallAlla muterade indata");
  const r = F.rekrytering(PLAN, alla, MÅN + 5 * DAG, MÅN, { niva: 1 });
  assert.deepEqual([...r.anstallda], PLAN);
  assert.equal(r.nasta, null);
  assert.equal(r.dags, false);
});

// ── bakåtkompatibilitet ─────────────────────────────────────────────────────

test("befintlig kund utan hired-fält: alla anställda, ingen förlorar en agent", () => {
  const r = F.rekrytering(PLAN, undefined, MÅN, MÅN, { niva: 1 });
  assert.equal(r.arv, true);
  assert.deepEqual([...r.anstallda], PLAN);
  assert.equal(r.nasta, null);
  // Ett tomt objekt är däremot en NY kund som inte anställt någon än.
  assert.equal(F.rekrytering(PLAN, {}, MÅN, MÅN, { niva: 1 }).anstallda.length, 0);
});

test("befintlig kund med rutinhistorik hamnar på rätt nivå direkt", () => {
  // Fyra veckor i liggaren (OM5) plus innevarande veckas bockar — ingen
  // firman-logg finns, för den bokförs först när filen kopplas in.
  const nu = vecka(5);
  const team = { entryAgent: "vd-assistent", routines: [{ label: "Offerterna", agentId: "offert" }] };
  const l = lagring({
    atb_sparad_kund: [1, 2, 3, 4].map((i) => ({ v: F.isoVecka(vecka(i)), m: 120, at: vecka(i) })),
    atb_rout_kund: { week: F.isoVecka(nu), done: [{ label: "Offerterna", at: nu }] },
    atb_intro_kund: { week: true, meeting: true, digest: true },
    atb_teamext_kund: { agents: [{ id: "extra", system: "x".repeat(50) }] },
  });
  const hi = F.historikUr(l, "kund", team, { start: vecka(0) });
  assert.equal(hi.arv, true);
  const n = F.nivaFor(hi, nu);
  assert.equal(n.niva, 4, "fem rutinveckor ska ge nivå 4 direkt");
  // Det hon använt är öppet, även det som trappan lägger högre.
  const u = F.upplast(n.niva, { anvant: hi.anvant });
  ["veckostart", "mote", "veckobrev", "rutiner", "utveckla"].forEach((id) =>
    assert.equal(u[id].upplast, true, `${id} låstes för en befintlig kund`));
  // Och det hon bara sett, men aldrig använt, är också öppet.
  const allt = F.upplast(n.niva, { anvant: hi.anvant, arv: hi.arv });
  Object.entries(allt).forEach(([id, p]) => assert.equal(p.upplast, true, `${id} låstes för en befintlig kund som sett det`));
  // En ny kund på samma nivå har däremot fortfarande något låst.
  assert.ok(Object.values(F.upplast(1)).some((p) => !p.upplast));
});

test("finns firman-loggen läses inte gammal lagring om — inga dubbelräknade veckor", () => {
  const l = lagring({
    atb_firman_kund: { v: 1, handelser: [ev("projekt_paborjat", vecka(0))] },
    atb_sparad_kund: [1, 2, 3].map((i) => ({ v: F.isoVecka(vecka(i)), m: 60, at: vecka(i) })),
  });
  const hi = F.historikUr(l, "kund", { entryAgent: "vd-assistent" });
  assert.equal(hi.arv, false);
  assert.equal(F.nivaFor(hi, vecka(4)).niva, 2);
});

test("trasig lagring kastar inte", () => {
  const l = { getItem: (k) => (k.startsWith("atb_hist_") ? "{trasig" : k.startsWith("atb_rout_") ? "[1,2" : null) };
  const hi = F.historikUr(l, "kund", null);
  assert.equal(F.nivaFor(hi, MÅN).niva, 1);
  const kastar = { getItem: () => { throw new Error("SecurityError"); } };
  assert.equal(F.nivaFor(F.historikUr(kastar, "kund", {}), MÅN).niva, 1);
});

test("teamstatus-sammanslagning: samma händelse från två kollegor räknas en gång", () => {
  const a = [ev("rutin_klar", vecka(1), "offert"), ev("projekt_paborjat", vecka(0))];
  const b = [ev("rutin_klar", vecka(1), "offert"), ev("rutin_klar", vecka(2), "offert"), { typ: "chatt", at: vecka(2) }];
  const ut = F.slaIhopHandelser(a, b);
  assert.equal(ut.length, 3);
  assert.equal(ut[0].typ, "projekt_paborjat", "sorterat på tid");
});
