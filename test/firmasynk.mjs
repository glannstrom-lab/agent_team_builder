// Portalens synk av det delade (SP23) — företagsminnet, underlagen och
// kundregistret mellan webbläsaren och /api/firma. Körd ur källan i
// portal/app.js mot en låtsasserver som svarar som /api/firma gör.
//
// Varför filen finns (genomgången 2026-10-26, SY1–SY3 och KO2): serversidan
// hade sex tester, klientsidan noll. Och det var klientsidan som tappade data:
// en ändring som inte nådde servern skrevs över vid nästa laddning (SY1),
// nekade poster räknades som sparade (SY2), och servern kapade långa underlag
// tyst (SY3). Varje test nedan är en "omladdning": en ny instans av koden mot
// samma localStorage, utan modultillstånd.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { UNDERLAG_MAX } from "../functions/api/_firma.js";

const KÄLLA = readFileSync("portal/app.js", "utf8");
const klipp = (från, till) => {
  const i = KÄLLA.indexOf(från), j = KÄLLA.indexOf(till, i);
  assert.ok(i >= 0 && j > i, "hittade inte " + från);
  return KÄLLA.slice(i, j);
};
const KOD = [
  klipp("function loadLocalDocs()", "function loadDocToggles()"),
  klipp("// ---------- delat med kundens egen AI (SP23)", "// Alla underlag agenterna ser"),
].join("\n");

// Låtsasservern: samma svarsform som functions/api/firma.js — { sparade, fel },
// 400 när ALLA poster nekades. `nere` = nätfel.
function server() {
  const s = { nere: false, minne: "", poster: { underlag: {}, org: {}, kontakt: {} }, anrop: [] };
  s.api = async (path, body) => {
    s.anrop.push(body ? body.op : "GET");
    if (s.nere) throw new Error("Failed to fetch");
    if (!body) {
      const lista = (t) => Object.entries(s.poster[t]).map(([id, d]) => ({ id, ...d, updatedBy: "portal" }));
      return { minne: { text: s.minne }, underlag: lista("underlag"), org: lista("org"), kontakt: lista("kontakt") };
    }
    if (body.op === "minne") { s.minne = body.text; return { minne: { text: s.minne } }; }
    const sparade = [], fel = [];
    for (const p of body.poster) {
      if (p.data === null) { delete s.poster[p.typ][p.id]; sparade.push(p); continue; }
      if (p.typ === "underlag" && p.data.text.length > UNDERLAG_MAX) { fel.push({ typ: p.typ, id: p.id, fel: "Underlaget är för långt för att delas." }); continue; }
      s.poster[p.typ][p.id] = p.data; sparade.push(p);
    }
    if (fel.length && !sparade.length) { const e = new Error("Det gick inte just nu."); e.data = { sparade, fel }; e.status = 400; throw e; }
    return { sparade, fel };
  };
  return s;
}

function lager() {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

// En "sidladdning": ny instans av synkkoden mot samma lager och server.
function ladda(ls, srv) {
  const varningar = [];
  const väntande = [];
  const state = { slug: "kund", firmaSnap: {}, firmaSynkad: false };
  const env = {
    state, localStorage: ls, jobbApi: srv.api, harJobb: () => true,
    storeWarn: (what) => varningar.push(what),
    MEM_PREFIX: "atb_mem_", DOCS_PREFIX: "atb_docs_",
    folderActive: () => false, loadMemory: () => ls.getItem("atb_mem_kund") || "", saveMemory: () => {},
    paintFactCount: () => {}, window: {},
    setTimeout: (fn) => { väntande.push(fn()); return 1; }, clearTimeout: () => {},
  };
  const namn = Object.keys(env);
  const api = new Function(...namn, KOD + "; return { firmaSynk, firmaSpegla, firmaSkickaMinne, saveDocs: (d) => { d.forEach((x) => { if (x && !x.id) x.id = lokaltId('u_'); }); localStorage.setItem(DOCS_PREFIX + state.slug, JSON.stringify(d)); return firmaSpegla('underlag', Object.fromEntries(d.map((x) => [x.id, x]))); }, loadLocalDocs };")(...namn.map((n) => env[n]));
  return { ...api, state, varningar, klart: () => Promise.all(väntande) };
}

async function igång(ls, srv) { const p = ladda(ls, srv); await p.firmaSynk(); return p; }

test("SY1: ett underlag som inte nådde servern finns kvar efter omladdningen och skickas igen", async () => {
  const ls = lager(), srv = server();
  const p = await igång(ls, srv);
  srv.nere = true;
  await p.saveDocs([{ id: "u1", title: "Prislista", text: "Badrum 6 m²: 180 000 kr", on: true }]);
  assert.equal(Object.keys(srv.poster.underlag).length, 0);

  srv.nere = false;
  const igen = await igång(ls, srv);
  assert.deepEqual(igen.loadLocalDocs().map((d) => d.title), ["Prislista"], "omladdningen skrev över den osparade ändringen");
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(srv.poster.underlag.u1 && srv.poster.underlag.u1.title, "Prislista", "den väntande ändringen skickades inte igen");
});

test("SY1: ett minne som inte nådde servern skrivs inte över, och kommer fram vid nästa laddning", async () => {
  const ls = lager(), srv = server();
  srv.minne = "Vi har F-skatt.";
  const p = await igång(ls, srv);
  srv.nere = true;
  ls.setItem("atb_mem_kund", "Vi har F-skatt.\nTimpris 650 kr.");
  p.firmaSkickaMinne("Vi har F-skatt.\nTimpris 650 kr.");
  await p.klart();

  srv.nere = false;
  await igång(ls, srv);
  assert.match(srv.minne, /Timpris 650 kr/);
  assert.match(ls.getItem("atb_mem_kund"), /Timpris 650 kr/);
});

test("SY2 + SY3: ett för långt underlag nekas, ligger kvar lokalt, och skickas inte om i onödan", async () => {
  const ls = lager(), srv = server();
  const p = await igång(ls, srv);
  const långt = "x".repeat(UNDERLAG_MAX + 10);
  await p.saveDocs([{ id: "u2", title: "Årsredovisning", text: långt, on: true }]);
  assert.equal(srv.poster.underlag.u2, undefined, "servern ska neka, inte kapa");
  assert.ok(p.varningar.some((v) => /för långt/.test(v)), "kunden fick inget besked");

  const igen = await igång(ls, srv);
  const kvar = igen.loadLocalDocs().find((d) => d.id === "u2");
  assert.ok(kvar, "det nekade underlaget skrevs bort ur webbläsaren");
  assert.equal(kvar.text.length, långt.length, "det nekade underlaget kapades lokalt");
  const före = srv.anrop.filter((a) => a === "poster").length;
  await igen.saveDocs(igen.loadLocalDocs());
  assert.equal(srv.anrop.filter((a) => a === "poster").length, före, "samma nekade innehåll skickades igen");
});

test("SY2: i första flytten behålls det som nekades", async () => {
  const ls = lager(), srv = server();
  ls.setItem("atb_docs_kund", JSON.stringify([{ id: "u3", title: "Bok", text: "y".repeat(UNDERLAG_MAX + 1), on: true }, { id: "u4", title: "Kort", text: "ok", on: true }]));
  const p = await igång(ls, srv);
  assert.ok(srv.poster.underlag.u4, "det giltiga underlaget flyttades inte");
  assert.deepEqual(p.loadLocalDocs().map((d) => d.id).sort(), ["u3", "u4"]);
});

test("en borttagning som inte nådde servern väcks inte till liv av omladdningen", async () => {
  const ls = lager(), srv = server();
  srv.poster.underlag.u5 = { title: "Gammal prislista", text: "…", on: true };
  const p = await igång(ls, srv);
  srv.nere = true;
  await p.saveDocs([]);
  srv.nere = false;
  const igen = await igång(ls, srv);
  assert.deepEqual(igen.loadLocalDocs(), [], "den borttagna prislistan kom tillbaka från servern");
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(srv.poster.underlag.u5, undefined, "borttagningen skickades inte igen");
});

test("allt bekräftat: väntelistan är tom", async () => {
  const ls = lager(), srv = server();
  const p = await igång(ls, srv);
  await p.saveDocs([{ id: "u6", title: "A", text: "a", on: true }]);
  const o = JSON.parse(ls.getItem("atb_firmaosynk_kund") || "{}");
  assert.deepEqual(o.underlag || {}, {});
});
