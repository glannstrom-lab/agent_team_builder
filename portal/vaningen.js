/* ============================================================
   Mitt AI-team — Våningen (SP16/SP20, skiss 14 gjord skarp 2026-10-24)

   Mikael: "en design som ett riktigt företag, designat som ett spel ...
   kontor som innehåller de aktuella arbetsuppgifterna, tydliga arbetsytor
   med pågående projekt." Ledstången samma dag: begriplighet och översikt,
   inte funktionalitet.

   Huset (2026-11-12, riktning E i design/omg2/e-huset.html): portalen öppnar
   på en våning i huset — rumskort med rummets bild, kollegan och läget, sex
   rum per våning. Planritningen i isometri (SVG) är ersatt av det. Varje
   anställd har ett rum som kunden kan inreda ("Inred rummet"), och möblerna
   gör något: arkivskåpet ger underlagen, diplomet reglerna (systemFor i
   app.js), kalendern, telefonen, whiteboarden och brevkorgen syns i rummet.
   Jobben ligger som mappar på skrivbordet, och en bricka säger att något
   väntar på kunden. Kunden är VD:n (KA14) och har VD-kontoret. De som
   inte är anställda än står som streckade rum ur rekryteringsplanen (SP9).
   Kunderna är en andra lins på samma firma: affärer, organisationer och
   kontakter.

   Allt som visas är riktiga data — inget i den här filen är skissens
   påhittade innehåll:
     • rummen       ← team.agents, team.pending, team.entryAgent
     • mapparna     ← jobben i D1 (/api/jobb, SP21)
     • nivån        ← firmanLage() / window.ATBFirman (SP2/SP19)
     • nästa steg   ← nastaStegFor() + nastaStegHandling() (SP1)
     • samtalet     ← portalens egen chatt, flyttad in i rummet
     • kunderna     ← jobbens `kund` + kundregistret i atb_kunder_<slug>

   Den här filen äger bara HUR det syns. Logiken bor kvar där den bodde
   (app.js, firman.js), och den gamla arbetsytan finns kvar som en låda
   ("Arbetsytan" i HUD:en) — inget som fanns har tagits bort.

   Klassiskt skript efter app.js: det läser app.js:s toppnivå (state, team,
   el, selectAgent …) och sätter window.ATBVaning.
   ============================================================ */
(function () {
  "use strict";

  const V = {
    pa: false, vy: "vaning", rum: null, jobbId: null, jobb: null, lins: "affarer", parm: null,
    main: null, sidebar: null, nyss: null, nivaFore: null, vaning: 0, inred: false,
  };
  const q = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const bildFor = (a) => (a && avatarSrcFor(a)) || "";
  const DAGAR = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

  function veckaNr(ms) {
    const d = new Date(ms); const dag = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dag + 3);
    const jan4 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  }
  // "Sigges kontor", "Måns kontor" — men ett rollnamn ("VD-assistent") får
  // ingen genitiv på ett personnamns vis.
  function kontorFor(a) {
    const n = String(a.name || "").trim();
    if (/^[A-ZÅÄÖ][a-zåäöé]+$/.test(n)) return (/[sxz]$/.test(n) ? n : n + "s") + " kontor";
    return n;
  }
  // Kundens initial på VD-kontoret: namnet från öppningsscenen om det finns.
  function chefNamn() {
    try { const s = JSON.parse(localStorage.getItem("atb_scen") || "null"); if (s && s.chef) return String(s.chef); } catch (_) { /* ingen scen */ }
    return "";
  }
  const initial = () => (chefNamn() || "Du").charAt(0).toUpperCase();

  function toast(t) {
    let n = q("#vn-toast");
    if (!n) { n = el("div", "vn-toast"); n.id = "vn-toast"; n.setAttribute("role", "status"); document.body.appendChild(n); }
    n.textContent = t; n.classList.add("syns");
    clearTimeout(toast.t); toast.t = setTimeout(() => n.classList.remove("syns"), 2800);
  }

  // ── läget ───────────────────────────────────────────────────────────────
  const lage = () => (firmanAktiv() ? firmanLage() : null);
  const jobben = () => V.jobb || [];
  const vantar = () => jobben().filter((j) => j.status === "levererad");
  const jobbFor = (agentId) => jobben().filter((j) => j.agentId === agentId && j.status !== "godkand" && j.status !== "avbruten");

  async function laddaJobb() {
    if (!harJobb()) { V.jobb = []; return; }
    try {
      const { jobb } = await jobbApi(`/api/jobb?team=${encodeURIComponent(state.slug)}`);
      V.jobb = Array.isArray(jobb) ? jobb : [];
      state.jobbVantar = V.jobb.filter((j) => j.status === "levererad");
    } catch (_) { V.jobb = V.jobb || []; }
  }

  // ── Huset: våningar och rumsbilder (2026-11-12) ─────────────────────────
  // Rena funktioner utan app.js-namn — test/vaningen.mjs kör dem ur källan.
  // ⟦HUSET-START⟧
  const RUM_PER_VANING = 6;
  // Sex rum per våning, i rummens ordning. Våning 1 är kontoret; resten
  // heter bara sitt nummer tills någon har en bättre idé.
  function delaVaningar(rum) {
    const ut = [];
    for (let i = 0; i < rum.length; i += RUM_PER_VANING) {
      const nr = ut.length + 1;
      ut.push({ nr, namn: nr === 1 ? "Våning 1 · Kontoret" : `Våning ${nr}`, rum: rum.slice(i, i + RUM_PER_VANING) });
    }
    return ut;
  }
  // Specialisternas rum: nyckelord i namnet först, sedan i taglinen, sedan i
  // rollen — "Månadsrapportören" (rollen säger "första projektet") är en
  // analytiker, inte en verkstad. Telefonen prövas före posten, så att
  // "kundtjänst" inte fastnar på "kund".
  const RUMBILDER = ["offert", "post", "bokforing", "telefon", "verkstad", "arkiv", "analys"];
  const RUMORD = [
    ["offert", /offert/],
    ["telefon", /telefon|kundtjänst|bokning/],
    ["post", /mejl|mail|kund|post|sms/],
    ["bokforing", /bokför|moms|ekonomi|faktur/],
    ["verkstad", /projekt|material|verkstad/],
    ["arkiv", /arkiv|avtal|dokument/],
    ["analys", /analys|siffror|rapport|statistik/],
  ];
  // [bild, styrka]: 0 = träff i namnet, 1 = taglinen, 2 = rollen.
  function nyckelTraff(a) {
    const falt = [a && a.name, a && a.tagline, a && a.role];
    for (let s = 0; s < falt.length; s++) {
      const t = String(falt[s] || "").toLowerCase();
      if (!t) continue;
      const hit = RUMORD.find(([, re]) => re.test(t));
      if (hit) return [hit[0], s];
    }
    return null;
  }
  const nyckelBild = (a) => (nyckelTraff(a) || [null])[0];
  const strangHash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.codePointAt(0)) >>> 0, 7);
  // Grannar är de tre rummen före och efter: i tre kolumner (dator) och två
  // (telefon) ligger varje sidogranne och varje granne ovanför eller under där.
  const grannIndex = (i, n) => [i - 3, i - 2, i - 1, i + 1, i + 2, i + 3].filter((k) => k >= 0 && k < n);
  // Sätter r.bild på varje rum. Specialisterna tar sin nyckelordsbild i
  // ordning efter hur säker träffen är (namnet före taglinen före rollen),
  // så att "Offertskrivaren" får offertrummet och inte VD:n vars tagline
  // nämner offerten. En bild som en granne redan har tas inte igen. Den som
  // blir utan får en stabil bild (ur rummets id) bland de som ingen annan har
  // än, och aldrig samma som en granne.
  function tilldelaRumbilder(rum) {
    const anvanda = new Set();
    const n = rum.length;
    const grannBilder = (i) => grannIndex(i, n).map((k) => rum[k].bild).filter(Boolean);
    const FAST = { du: "reception", vakant: "ledigt", mote: "mote", pentry: "pentry" };
    rum.forEach((r) => { delete r.bild; });
    rum.forEach((r) => { if (FAST[r.typ]) r.bild = FAST[r.typ]; else if (r.entry) r.bild = "assistent"; });
    rum.map((r, i) => ({ r, i, t: r.bild ? null : nyckelTraff(r.agent) }))
      .filter((x) => x.t)
      .sort((x, y) => x.t[1] - y.t[1] || x.i - y.i)
      .forEach(({ r, i, t }) => { if (!grannBilder(i).includes(t[0])) { r.bild = t[0]; anvanda.add(t[0]); } });
    rum.forEach((r, i) => {
      if (r.bild) return;
      const grannar = grannBilder(i);
      const kvar = RUMBILDER.filter((x) => !anvanda.has(x) && !grannar.includes(x));
      const pool = kvar.length ? kvar : RUMBILDER.filter((x) => !grannar.includes(x));
      r.bild = pool[strangHash(r.id) % pool.length];
      anvanda.add(r.bild);
    });
    return rum;
  }
  // ⟦HUSET-SLUT⟧
  const rumSrc = (b) => `../bild/huset/rum-${b}.webp`;
  const mobelSrc = (m) => `../bild/huset/mobel-${m}.webp`;

  // Rummen i den ordning de ritas: VD-kontoret, ingångsagentens kontor, de
  // anställda i byggets ordning, de som kommer enligt planen, och två
  // gemensamma rum vars förmåga låses upp av trappan.
  function rummen() {
    const entry = agentById(team.entryAgent) || team.agents[0];
    const lista = [{ id: "vd", typ: "du", namn: "VD-kontoret" }];
    if (entry) lista.push({ id: entry.id, typ: "agent", agent: entry, namn: kontorFor(entry), entry: true });
    team.agents.filter((a) => entry && a.id !== entry.id).forEach((a) =>
      lista.push({ id: a.id, typ: "agent", agent: a, namn: a.name }));
    (team.pending || []).forEach((a) => lista.push({ id: a.id, typ: "vakant", agent: a, namn: a.name }));
    lista.push({ id: "__mote", typ: "mote", namn: "Mötesrummet" });
    lista.push({ id: "__pentry", typ: "pentry", namn: "Pentryt" });
    return tilldelaRumbilder(lista);
  }
  const vaningFor = (id) => Math.max(0, delaVaningar(rummen()).findIndex((v) => v.rum.some((r) => r.id === id)));

  // Ett gemensamt rum är låst tills trappan öppnat dess panel.
  function rumLast(r, l) {
    if (r.typ === "mote") return !panelOppen(l, "mote");
    if (r.typ === "pentry") return !panelOppen(l, "rutiner");
    return r.typ === "vakant";
  }
  function lasText(r, l) {
    if (r.typ === "vakant") {
      const rk = l && l.rk;
      if (rk && rk.nasta === r.id && rk.dags) return "Klicka för att anställa";
      if (rk && rk.nasta === r.id) return "Nästa anställning";
      return "Enligt planen";
    }
    const id = r.typ === "mote" ? "mote" : "rutiner";
    const nivaFor = (window.ATBFirman && window.ATBFirman.PANELER && window.ATBFirman.PANELER[id] || {}).niva;
    return nivaFor ? `Öppnar på nivå ${nivaFor}` : "Låst";
  }

  // ── HUD ─────────────────────────────────────────────────────────────────
  function ritaHud() {
    const hud = q("#vn-hud"); if (!hud) return;
    const l = lage();
    const nu = Date.now();
    const v = vantar().length + (l && l.rk && l.rk.dags ? 1 : 0);
    let niva = "";
    if (l) {
      const pips = [1, 2, 3, 4, 5].map((n) => `<i class="${n < l.n.niva ? "full" : n === l.n.niva ? "nu" : ""}"></i>`).join("");
      niva = `<div class="vn-niva" title="${esc(l.n.kvar ? "Nästa: " + l.n.kvar : "")}"><div class="vn-niva-txt">Nivå ${l.n.niva} av 5<b>${esc(l.n.namn)}</b></div><div class="vn-pips" aria-hidden="true">${pips}</div></div>`;
    }
    hud.innerHTML = `<div class="vn-hud-inre">
      <a class="vn-firma" href="../" title="Till Mitt AI-team"><i class="vn-logo" aria-hidden="true"></i><span>${esc(team.company)}<small>${esc(V.vy === "rum" && V.rum ? (delaVaningar(rummen())[vaningFor(V.rum)] || {}).namn || "Huset" : "Huset")} · ${DAGAR[new Date(nu).getDay()]} · v. ${veckaNr(nu)}</small></span></a>
      ${niva}
      <nav class="vn-hudnav" aria-label="Huset">
        <button type="button" class="vn-hudknapp${V.vy === "vaning" ? " akt" : ""}" data-g="vaning">Huset</button>
        <button type="button" class="vn-hudknapp${V.vy === "kunder" ? " akt" : ""}" data-g="kunder">Kunderna</button>
        <button type="button" class="vn-hudknapp${V.vy === "rum" && V.rum === "vd" ? " akt" : ""}" data-g="vd">VD-kontoret${v ? `<span class="vn-prick">${v}</span>` : ""}</button>
        <button type="button" class="vn-hudknapp vn-ghost" data-g="lada" title="Allt som fanns i den gamla arbetsytan: veckostart, minne, rutiner, möten, kollegor">Arbetsytan</button>
      </nav></div>`;
    hud.querySelectorAll("[data-g]").forEach((b) => b.onclick = () => {
      const g = b.dataset.g;
      if (g === "vaning") visaVaning();
      else if (g === "kunder") visaKunder();
      else if (g === "vd") visaRum("vd");
      else oppnaLada();
    });
  }

  // ── vyerna ──────────────────────────────────────────────────────────────
  function visa(vy) {
    V.vy = vy;
    ["vaning", "kunder", "rum"].forEach((n) => { const e = q("#vn-" + n); if (e) e.hidden = n !== vy; });
    ritaHud();
    window.scrollTo(0, 0);
  }

  // Det som väntar i ett rum, och vad brickan säger.
  function rumLage(r, l) {
    if (r.typ === "du") return { rod: vantar().length + (l && l.rk && l.rk.dags ? 1 : 0), arbetar: false };
    if (r.typ !== "agent") return { rod: 0, arbetar: false };
    const pr = jobbFor(r.id);
    return { rod: pr.filter((j) => j.status === "levererad").length, arbetar: pr.length > 0 };
  }
  // Vem som sitter i rummet, med en rad om vad hen gör.
  function rumVem(r, l) {
    if (r.typ === "du") return { namn: "VD-kontoret", rad: "Du · det som väntar på dig", ikon: `<span class="vn-rr-du" aria-hidden="true">${esc(initial())}</span>` };
    if (r.typ === "mote") return { namn: "Mötesrummet", rad: rumLast(r, l) ? lasText(r, l) : "Låt flera tycka till" };
    if (r.typ === "pentry") {
      const n = (team.routines || []).length;
      return { namn: "Pentryt", rad: rumLast(r, l) ? lasText(r, l) : n ? `${n} ${n === 1 ? "rutin" : "rutiner"} på tavlan` : "Tavlan är tom" };
    }
    const a = r.agent;
    const bild = bildFor(a);
    const ikon = bild ? `<img src="${esc(bild)}" alt="" loading="lazy">` : `<span class="vn-rr-du" aria-hidden="true">${esc(a.icon || "•")}</span>`;
    if (r.typ === "vakant") return { namn: `+ Anställ ${a.name}`, rad: hiringReason(team, a.id) || lasText(r, l), ikon };
    const rad = r.entry ? (a.name === "VD-assistent" ? (a.tagline || "Ditt närmaste stöd") : "VD-assistent") : (a.tagline || a.role || "Specialist");
    return { namn: a.name, rad, ikon };
  }

  // Det som redan finns för att växa: nästa anställning i planen, annars
  // "Utveckla teamet". Ingen ny väg — samma dörrar som rummen och lådan har.
  function byggVaning() {
    const l = lage();
    const nasta = (l && l.rk && l.rk.nasta) || ((team.pending || [])[0] || {}).id;
    if (nasta) {
      if (!l || (l.rk && l.rk.dags)) return openHire(nasta);
      return klickRum(nasta);
    }
    return openGrow();
  }
  function byggText() {
    const l = lage();
    const id = (l && l.rk && l.rk.nasta) || ((team.pending || [])[0] || {}).id;
    const a = id && (team.pending || []).find((x) => x.id === id);
    return a ? `Nästa: ${a.name}` : "För fler kollegor";
  }

  function visaVaning(nr) {
    visa("vaning");
    const l = lage();
    const vaningar = delaVaningar(rummen());
    if (typeof nr === "number") V.vaning = nr;
    if (!(V.vaning >= 0 && V.vaning < vaningar.length)) V.vaning = 0;
    const vald = vaningar[V.vaning];
    const box = q("#vn-vaning");
    const totalt = vantar().length + (l && l.rk && l.rk.dags ? 1 : 0);
    // Våningslistan uppifrån och ner, som huset står: översta våningen först.
    const lista = vaningar.slice().reverse().map((v) => {
      const anstallda = v.rum.filter((r) => r.typ !== "vakant").length;
      const lediga = v.rum.length - anstallda;
      const ant = `${anstallda} av ${RUM_PER_VANING} rum${lediga ? ` · ${lediga} ${lediga === 1 ? "ledigt" : "lediga"}` : ""}`;
      return `<button type="button" class="vn-vn${v === vald ? " vald" : ""}" data-v="${v.nr - 1}" aria-pressed="${v === vald}"><b>${esc(v.namn)}</b><span>${esc(ant)}</span><span class="vn-bar"><i style="width:${Math.round((anstallda / RUM_PER_VANING) * 100)}%"></i></span></button>`;
    }).join("");
    const kort = vald.rum.map((r) => {
      const last = rumLast(r, l);
      const { rod, arbetar } = rumLage(r, l);
      const vem = rumVem(r, l);
      const kan = r.typ === "vakant" && l && l.rk && l.rk.nasta === r.id && l.rk.dags;
      const bricka = rod ? `<span class="vn-bricka">${rod} väntar</span>`
        : r.typ === "vakant" ? `<span class="vn-bricka lugn">${esc(lasText(r, l))}</span>`
        : arbetar ? `<span class="vn-bricka lugn">Arbetar</span>` : "";
      const cls = ["vn-rr", r.typ === "vakant" ? "ledig" : "", last && r.typ !== "vakant" ? "last" : "", kan ? "kan" : "", V.nyss === r.id ? "vn-bygg" : ""].filter(Boolean).join(" ");
      const etikett = `${r.namn}${rod ? `, ${rod} väntar på dig` : ""}${last ? `, ${lasText(r, l)}` : ""}`;
      return `<button type="button" class="${cls}" data-rum="${esc(r.id)}" aria-label="${esc(etikett)}">${bricka}
        <img class="vn-rr-bild" src="${rumSrc(r.bild)}" alt="" loading="lazy" width="360" height="360">
        <span class="vn-vem">${vem.ikon || ""}<span class="vn-vem-txt"><b>${esc(vem.namn)}</b><span>${esc(vem.rad)}</span></span></span></button>`;
    }).join("");
    box.innerHTML = `<div class="vn-hus">
      <aside class="vn-vaningar" aria-label="Våningarna">
        <div class="vn-hus-etikett">Huset</div>
        <button type="button" class="vn-vn tom" id="vn-byggvn"><b>+ Bygg en våning</b><span>${esc(byggText())}</span></button>
        ${lista}
        <p class="vn-hus-fot">Rutiner, underlag och regler finns i rummen — inred dem.</p>
      </aside>
      <section class="vn-golv">
        <div class="vn-golv-rubrik"><h1>${esc(vald.namn)}</h1><span>${totalt ? `${totalt} ${totalt === 1 ? "sak väntar" : "saker väntar"} på dig` : "Inget väntar på dig"}</span></div>
        <div class="vn-nasta-kort" id="vn-nasta"></div>
        <div class="vn-rumrut">${kort}</div>
      </section></div>`;
    ritaNasta(q("#vn-nasta"));
    box.querySelectorAll(".vn-rr").forEach((b) => b.onclick = () => klickRum(b.dataset.rum));
    box.querySelectorAll(".vn-vn[data-v]").forEach((b) => b.onclick = () => visaVaning(+b.dataset.v));
    q("#vn-byggvn").onclick = byggVaning;
    V.nyss = null;
  }

  // Ett nästa steg, inte en dashboard: samma kort som arbetsytan har haft
  // sedan SP1, i våningens kostym. Utan trappa (team utan plan) är steget
  // det som väntar, annars veckomötet.
  function ritaNasta(box) {
    const l = lage();
    let e = "Nästa steg", h, p = "", k, gå;
    if (l) {
      const steg = nastaStegFor(l);
      const hand = nastaStegHandling(steg);
      h = steg.text; p = hand.hint || (l.n.kvar ? `Firman: ${l.n.namn}. Nästa nivå: ${l.n.kvar}.` : `Firman: ${l.n.namn}.`);
      k = hand.label; gå = hand.act;
    } else if (vantar().length) {
      const j = vantar()[0]; const a = agentById(j.agentId);
      h = `${a ? a.name : "Teamet"} har lämnat en leverans: ${j.title}`; p = "Läs och godkänn, eller skicka tillbaka."; k = "Öppna leveransen"; gå = () => visaRum(j.agentId, j.id);
    } else {
      const a = agentById(team.entryAgent);
      h = `Håll veckomötet med ${a ? a.name : "teamet"}`; p = "Ett klick, så föreslår hen veckans fokus."; k = "Håll veckomötet"; gå = startWeek;
    }
    box.innerHTML = `<div><div class="vn-etikett">${esc(e)}</div><h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ""}</div><button type="button" class="vn-knapp vn-ockra">${esc(k)} →</button>`;
    box.querySelector("button").onclick = gå;
  }

  function klickRum(id) {
    const l = lage();
    const r = rummen().find((x) => x.id === id);
    if (!r) return;
    if (r.typ === "vakant") {
      if (l && l.rk && l.rk.nasta === id && l.rk.dags) return openHire(id);
      const skäl = hiringReason(team, id);
      if (l && l.rk && l.rk.nasta === id) {
        const krävs = Math.min(l.rk.anstallda.length + 2, 4);
        const krav = (window.ATBFirman.TRAPPAN[krävs - 2] || {}).krav || "";
        return toast(`${r.namn} anställs när: ${krav.charAt(0).toLowerCase() + krav.slice(1)}.${skäl ? " " + skäl : ""}`);
      }
      return toast(`${r.namn} står i rekryteringsplanen, efter de som kommer före.`);
    }
    if (r.typ === "mote") {
      if (rumLast(r, l)) return toast(`Mötesrummet öppnar på nivå 4 — när rutinerna suttit i tre veckor.`);
      return openMeeting();
    }
    if (r.typ === "pentry") {
      if (rumLast(r, l)) return toast("Tavlan med veckans rutiner tänds på nivå 3 — när du godkänt en leverans från er första specialist.");
      return oppnaPentry();
    }
    visaRum(id);
  }

  // Pentryt: veckans rutiner på whiteboarden. En rutin körs i rätt rum.
  function oppnaPentry() {
    const box = openOverlay("Pentryt · veckans rutiner");
    const rut = team.routines || [];
    if (!rut.length) { box.appendChild(el("p", "ovl-lead", "Inga stående rutiner än. VD-assistenten kan föreslå några i veckomötet.")); return; }
    box.appendChild(el("p", "ovl-lead", "Det som återkommer varje vecka. Bocka av när det är gjort — det är det som flyttar firmans trappa."));
    rut.forEach((rt) => {
      const a = agentById(rt.agentId) || agentById(team.entryAgent);
      const rad = el("div", "vn-rutin");
      const klar = routineDone(rt.label);
      rad.appendChild(el("span", "vn-rutin-dag", klar ? "klar ✓" : rt.day === todayDayNo() ? "i dag" : dayName(rt.day)));
      const t = el("div", "vn-rutin-txt"); t.appendChild(el("b", null, rt.label)); t.appendChild(el("span", null, a ? a.name : ""));
      rad.appendChild(t);
      const b = el("button", "vn-knapp", "Kör"); b.type = "button";
      b.onclick = () => { closeOverlay(); runRoutine(rt); };
      rad.appendChild(b);
      box.appendChild(rad);
    });
  }

  // OL4/OL5: teamet i kundens egen AI — kopplingen, projektinstruktionen och provet.
  function oppnaInstallera() {
    const box = openOverlay("Teamet i din egen Claude eller ChatGPT");
    const k = kopplingsRuta(); k.open = true;
    box.appendChild(k);
  }

  // Den gamla arbetsytan som en låda: allt som fanns där finns kvar.
  function oppnaLada() {
    const d = q("#vn-lada"); if (!d) return;
    d.hidden = false; document.body.classList.add("vn-lada-oppen");
    const st = q(".vn-lada-stang", d); if (st) st.focus();
  }
  function stangLada() {
    const d = q("#vn-lada"); if (d) d.hidden = true;
    document.body.classList.remove("vn-lada-oppen");
  }

  // ── rummen ──────────────────────────────────────────────────────────────
  // Våningen rummet ligger på, som en kort lista med rumsbilderna.
  function miniplan(akt) {
    const l = lage();
    const v = delaVaningar(rummen())[vaningFor(akt)];
    return `<div class="vn-etikett">${esc(v.namn)}</div><div class="vn-miniplan">` + v.rum.map((r) => {
      const last = rumLast(r, l);
      const rod = rumLage(r, l).rod;
      return `<button type="button" class="${r.id === akt ? "akt" : ""}${last ? " last" : ""}" data-rum="${esc(r.id)}"${r.id === akt ? ' aria-current="page"' : ""}><img src="${rumSrc(r.bild)}" alt="" loading="lazy"><span>${esc(r.typ === "agent" ? r.agent.name : r.namn)}</span>${rod ? `<i class="r" aria-label="${rod} väntar"></i>` : ""}</button>`;
    }).join("") + "</div>";
  }

  function visaRum(id, jobbId, opts) {
    opts = opts || {};
    if (id !== "vd" && !agentById(id)) return visaVaning();
    V.rum = id;
    V.inred = false;
    visa("rum");
    const box = q("#vn-rum");
    box.innerHTML = `<div class="vn-arbete"><aside class="vn-plan">${miniplan(id)}
      <button type="button" class="vn-knapp-ghost vn-tillbaka">← Hela huset</button></aside><section class="vn-innehall" id="vn-innehall"></section></div>`;
    box.querySelectorAll(".vn-miniplan button").forEach((b) => b.onclick = () => klickRum(b.dataset.rum));
    q(".vn-tillbaka", box).onclick = () => visaVaning(vaningFor(id));
    if (id === "vd") return vdKontoret();

    const a = agentById(id);
    const mappar = jobbFor(id).sort((x, y) => (y.status === "levererad") - (x.status === "levererad") || y.updatedAt - x.updatedAt);
    const godkanda = jobben().filter((j) => j.agentId === id && j.status === "godkand");
    V.jobbId = jobbId === undefined || jobbId === null ? (opts.samtal ? null : (mappar.find((j) => j.status === "levererad") || {}).id || null) : jobbId;
    const inn = q("#vn-innehall");
    const roll = id === team.entryAgent ? "VD-assistent · ditt närmaste stöd" : (a.tagline || a.role || "Specialist");
    let h = `<div class="vn-rumhuvud"><img class="vn-portratt" src="${esc(bildFor(a))}" alt=""><div><div class="vn-etikett">${esc(roll)}</div><h1>${esc(id === team.entryAgent ? kontorFor(a) : a.name)}</h1><p>${esc(a.job || a.tagline || "")}</p></div><button type="button" class="vn-knapp-ghost vn-inred-knapp" id="vn-inred">Inred rummet</button></div>`;
    h += `<div id="vn-irummet"></div>`;
    h += `<div class="vn-skrivbord"><div class="vn-etikett">På skrivbordet</div><div class="vn-mappar">`;
    const n = ((state.history && state.history[id]) || []).length;
    h += `<button type="button" class="vn-mapp${V.jobbId ? "" : " akt"}" data-j=""><b>Samtalet med ${esc(a.name)}</b><div class="s">${n ? n + " meddelanden" : "Inget sagt än"}</div></button>`;
    for (const j of mappar) {
      const steg = jobbSteg(j);
      const pct = Math.round((steg.nu / 3) * 100);
      h += `<button type="button" class="vn-mapp${j.id === V.jobbId ? " akt" : ""}" data-j="${esc(j.id)}"><b>${esc(j.title)}</b><div class="s ${j.status === "levererad" ? "vantar" : ""}">${j.status === "levererad" ? "● Väntar på dig" : esc(steg.namn[steg.nu])}${j.kund ? " · " + esc(j.kund) : ""}</div><div class="vn-stapel"><i style="width:${pct}%"></i></div></button>`;
    }
    if (harJobb()) h += `<button type="button" class="vn-mapp ny" id="vn-nytt">+ Nytt jobb</button>`;
    h += `</div>${godkanda.length ? `<p class="vn-dim vn-klara">${godkanda.length} godkända jobb ligger i arkivet · <button type="button" class="vn-lank" id="vn-arkiv">visa</button></p>` : ""}</div><div id="vn-yta"></div>`;
    inn.innerHTML = h;
    inn.querySelectorAll(".vn-mapp[data-j]").forEach((b) => b.onclick = () => visaRum(id, b.dataset.j || null, { samtal: !b.dataset.j }));
    const ny = q("#vn-nytt"); if (ny) ny.onclick = () => nyttJobb(id);
    const ark = q("#vn-arkiv"); if (ark) ark.onclick = openJobs.original || openJobs;
    q("#vn-inred").onclick = () => visaInred(id);
    ritaIRummet(q("#vn-irummet"), a);
    if (V.jobbId) { const j = jobben().find((x) => x.id === V.jobbId); if (j) return jobbYta(j); }
    samtalYta(id);
  }

  // ── inredningen ─────────────────────────────────────────────────────────
  // Mikael 2026-11-12: "användaren ska kunna inreda kontorsrummen efter sin
  // smak, även med funktioner". Vad som står i rummet bor i app.js
  // (inredningFor/inredningSpara, atb_inredning_<slug>), eftersom arkivskåpet
  // och diplomet ändrar agentens instruktion i systemFor. Här bor hur det syns.
  // `plats` är var möbeln står i den stora rumsbilden, i procent av bilden.
  const MOBLER = [
    { id: "kalender", namn: "Väggkalender", gor: "Veckorutinerna i rummet", plats: [16, 18, 20] },
    { id: "arkiv", namn: "Arkivskåp", gor: "Läser era underlag", plats: [6, 46, 21] },
    { id: "telefon", namn: "Telefon", gor: "Nås från er Claude eller ChatGPT", plats: [42, 64, 17] },
    { id: "whiteboard", namn: "Whiteboard", gor: "Mål och beslut från mötena", plats: [64, 20, 21] },
    { id: "brev", namn: "Brevkorg", gor: "Veckobrevet till mejlen", plats: [24, 62, 17] },
    { id: "diplom", namn: "Diplomet", gor: "Kontrollerade svenska regler", plats: [50, 13, 15] },
    { id: "lampa", namn: "Lampa", gor: "Bara för stämningen", plats: [28, 34, 16] },
    { id: "vaxt", namn: "Växt", gor: "Bara för att det är trevligt", plats: [70, 46, 21] },
  ];
  const TRIVSEL = ["lampa", "vaxt"];
  // De två möbler som ändrar vad agenten vet säger vad som går förlorat.
  // De andra visar bara saker som också finns på andra ställen.
  const UTAN = {
    arkiv: (n) => `Utan den läser ${n} inga underlag.`,
    diplom: (n) => `Utan det svarar ${n} utan regellistan.`,
  };

  // De senaste besluten från mötena (✓ Det här bestämde vi) — de sparas på
  // mötesanteckningen i samtalshistoriken, hos den som sammanställde.
  function senasteBeslut(n) {
    const ut = [];
    Object.values(state.history || {}).forEach((lista) => (lista || []).forEach((m) => {
      if (m && m.beslut && m.beslut.text) ut.push(m.beslut);
    }));
    return ut.sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, n);
  }

  // Det möblerna gör, i agentens rum. Arkivskåpet och diplomet verkar i
  // instruktionen; här visas bara att de står där.
  function ritaIRummet(box, a) {
    if (!box) return;
    const inr = inredningFor(a.id);
    const kort = [];
    if (inr.includes("kalender")) {
      const rut = (team.routines || []).filter((rt) => rt.agentId === a.id);
      const rader = rut.slice(0, 4).map((rt, i) => `<li><span class="d">${esc(routineDone(rt.label) ? "klar ✓" : rt.day === todayDayNo() ? "i dag" : dayName(rt.day))}</span><span class="t">${esc(rt.label)}</span><button type="button" class="vn-lank" data-rutin="${i}">Kör</button></li>`).join("");
      kort.push(`<div class="vn-ir"><img src="${mobelSrc("kalender")}" alt=""><div><div class="vn-etikett">Väggkalendern</div>${rut.length ? `<ul class="vn-ir-lista">${rader}</ul>` : `<p class="vn-dim">Inga veckorutiner hos ${esc(a.name)} än.</p>`}</div></div>`);
    }
    if (inr.includes("whiteboard")) {
      const bes = senasteBeslut(3);
      kort.push(`<div class="vn-ir"><img src="${mobelSrc("whiteboard")}" alt=""><div><div class="vn-etikett">Whiteboarden</div>${bes.length ? `<ul class="vn-ir-lista">${bes.map((b) => `<li><span class="d">${esc(b.at ? new Date(b.at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : "")}</span><span class="t">${esc(b.text)}</span></li>`).join("")}</ul>` : `<p class="vn-dim">Inga beslut än. De hamnar här när ni bestämt något i Mötesrummet.</p>`}</div></div>`);
    }
    const sma = [];
    if (inr.includes("arkiv")) {
      const n = loadDocs().filter((d) => d && d.on && d.text).length;
      sma.push(`<button type="button" class="vn-ir-liten" data-g="arkiv"><img src="${mobelSrc("arkiv")}" alt=""><span><b>Arkivskåpet</b>${n ? `Läser ${n} ${n === 1 ? "underlag" : "underlag"}` : "Inga underlag påslagna"}</span></button>`);
    }
    if (inr.includes("diplom")) sma.push(`<div class="vn-ir-liten"><img src="${mobelSrc("diplom")}" alt=""><span><b>Diplomet</b>Svarar efter de kontrollerade svenska reglerna</span></div>`);
    if (inr.includes("brev")) sma.push(`<button type="button" class="vn-ir-liten" data-g="brev"><img src="${mobelSrc("brev")}" alt=""><span><b>Brevkorgen</b>Veckobrevet till mejlen →</span></button>`);
    if (!kort.length && !sma.length && !inr.includes("telefon")) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="vn-irummet"><div class="vn-etikett">I rummet</div>${kort.length ? `<div class="vn-ir-rad">${kort.join("")}</div>` : ""}${sma.length ? `<div class="vn-ir-sma">${sma.join("")}</div>` : ""}<div id="vn-ir-telefon"></div></div>`;
    const rut = (team.routines || []).filter((rt) => rt.agentId === a.id);
    box.querySelectorAll("[data-rutin]").forEach((b) => b.onclick = () => runRoutine(rut[+b.dataset.rutin]));
    const ark = q('[data-g="arkiv"]', box); if (ark) ark.onclick = openMemory;
    const brev = q('[data-g="brev"]', box); if (brev) brev.onclick = openDigest;
    if (inr.includes("telefon")) {
      const t = q("#vn-ir-telefon", box);
      t.className = "vn-ir-telefon";
      t.innerHTML = `<img src="${mobelSrc("telefon")}" alt="">`;
      t.appendChild(kopplingsRuta());
    }
  }

  function visaInred(id) {
    const a = agentById(id);
    if (!a) return visaVaning();
    V.rum = id;
    V.inred = true;
    visa("rum");
    const r = rummen().find((x) => x.id === id) || { bild: "assistent" };
    const box = q("#vn-rum");
    const rita = () => {
      const inr = inredningFor(id);
      const funk = inr.filter((m) => !TRIVSEL.includes(m)).length;
      const n = String(a.name || "").trim();
      const namn = /^[A-ZÅÄÖ][a-zåäöé-]+$/.test(n) ? (/[sxz]$/.test(n) ? n : n + "s") + " rum" : `${n} · rummet`;
      const roll = id === team.entryAgent ? "VD-assistent" : (a.tagline || a.role || "Specialist");
      const scen = MOBLER.filter((m) => inr.includes(m.id)).map((m) =>
        `<img class="vn-inred-mobel" src="${mobelSrc(m.id)}" alt="${esc(m.namn)}" style="left:${m.plats[0]}%;top:${m.plats[1]}%;width:${m.plats[2]}%">`).join("");
      const val = MOBLER.map((m) => {
        const pa = inr.includes(m.id);
        const utan = !pa && UTAN[m.id] ? UTAN[m.id](a.name) : "";
        return `<button type="button" class="vn-mb${pa ? " pa" : ""}" data-m="${m.id}" aria-pressed="${pa}"><img src="${mobelSrc(m.id)}" alt=""><b>${esc(m.namn)}</b><span class="vn-mb-gor">${esc(m.gor)}</span>${utan ? `<span class="vn-mb-utan">${esc(utan)}</span>` : ""}<span class="vn-mb-lage">${pa ? "✓ I rummet" : "+ Ställ in"}</span></button>`;
      }).join("");
      box.innerHTML = `<div class="vn-inred">
        <div class="vn-inred-stor">
          <button type="button" class="vn-lank-tillbaka" id="vn-inred-tillbaka">← Tillbaka till ${esc(a.name)}</button>
          <div class="vn-inred-scen"><img class="vn-inred-rum" src="${rumSrc(r.bild)}" alt="${esc(namn)}">${scen}</div>
          <div class="vn-inred-namn"><h1>${esc(namn)}</h1><span>${esc(roll)} · ${inr.length} ${inr.length === 1 ? "möbel" : "möbler"} · ${funk} ${funk === 1 ? "funktion" : "funktioner"} på</span></div>
        </div>
        <div class="vn-inred-val">
          <h2>Inred rummet</h2>
          <p class="vn-inred-under">Välj det som passar er. Varje möbel ger ${esc(a.name)} något hen kan göra åt er — det gäller från nästa svar.</p>
          <div class="vn-mobler">${val}</div>
        </div></div>`;
      q("#vn-inred-tillbaka").onclick = () => visaRum(id, null, { samtal: true });
      box.querySelectorAll(".vn-mb").forEach((b) => b.onclick = () => {
        const m = b.dataset.m;
        const nu = inredningFor(id);
        const ny = nu.includes(m) ? nu.filter((x) => x !== m) : nu.concat(m);
        if (!inredningSpara(id, ny)) return toast("Kunde inte spara — webbläsarens lagring är full.");
        rita();
        const knapp = q(`.vn-mb[data-m="${m}"]`, box); if (knapp) knapp.focus();
      });
    };
    rita();
  }

  // Samtalet: portalens egen chatt, flyttad in i rummet. Allt den kan —
  // diktering, handlingarna under svaren, Godkänn som flyttar trappan — följer med.
  function samtalYta(id) {
    const yta = q("#vn-yta");
    yta.innerHTML = `<div class="vn-yta vn-samtal"><div class="vn-yta-topp"><div class="vn-etikett">Samtalet</div></div><div class="vn-chatt" id="vn-chatt"></div></div>`;
    q("#vn-chatt").appendChild(V.main);
    if (state.activeAgentId !== id || !q("#chat-log").childNodes.length) V.selectAgent(id);
    // Samtalsrutan tar fokus, och webbläsaren rullar då ner till den. Rummets
    // huvud och skrivbord ska synas först.
    setTimeout(() => window.scrollTo(0, 0), 60);
  }

  function jobbSteg(j) {
    const namn = ["Uppdrag", j.hamtadAt ? `Hämtad av ${j.hamtadAv || "AI"}` : "Pågår", "Din granskning", "Godkänd"];
    const nu = j.status === "godkand" ? 3 : j.status === "levererad" ? 2 : j.hamtadAt ? 1 : 0;
    return { namn, nu };
  }

  function jobbYta(j) {
    const a = agentById(j.agentId) || { name: j.agentId };
    const yta = q("#vn-yta");
    const s = jobbSteg(j);
    const steg = s.namn.map((t, i) => `<span class="${i < s.nu ? "klar" : i === s.nu ? (j.status === "levererad" ? "du" : "nu") : ""}">${i < s.nu ? "✓ " : ""}${esc(t)}</span>`).join("");
    const klar = j.status === "godkand";
    yta.innerHTML = `<div class="vn-yta"><div class="vn-yta-topp"><div class="vn-etikett">Jobb · ${esc(a.name)}${j.kund ? ` · <button type="button" class="vn-kundlank" id="vn-tillkund">Kund: ${esc(j.kund)} →</button>` : ""}</div>
      <h2>${esc(j.title)}</h2><div class="vn-steg">${steg}</div>
      ${j.status === "oppen" ? `<div class="vn-utfors">Görs av ${esc(a.name)} här <button type="button" data-ut="har">i samtalet</button> · eller i din egen <button type="button" data-ut="claude">↗ Claude</button><button type="button" data-ut="chatgpt">↗ ChatGPT</button></div>` : ""}</div>
      <div class="vn-yta-kropp"><div class="vn-leverans"><div class="vn-etikett">Leveransen${j.levereradVia ? ` · från ${esc(j.levereradVia === "portal" ? "teamet här" : j.levereradVia)}` : ""}</div><div class="vn-dok" id="vn-dok"></div>
        ${j.klartNar && j.klartNar.length ? `<div class="vn-klartnar"><div class="vn-etikett">Klart när</div><ul>${j.klartNar.map((k) => `<li><span class="bock${klar ? "" : " tom"}">${klar ? "✓" : ""}</span>${esc(k)}</li>`).join("")}</ul></div>` : ""}
        <div class="vn-beslut" id="vn-beslut"></div></div>
      <div class="vn-uppdrag"><div class="vn-etikett">Uppdraget</div><p>${esc(j.brief)}</p><div id="vn-koppla"></div></div></div></div>`;
    const dok = q("#vn-dok");
    if (j.leverans) renderMarkdown(dok, j.leverans);
    else dok.appendChild(el("p", "vn-dim", j.hamtadAt
      ? `${j.hamtadAv || "Din AI"} har hämtat jobbet. Leveransen dyker upp här när den lämnas, och då lyser en röd prick på våningen.`
      : `Leveransen hamnar här — gjord i samtalet med ${a.name}, eller i din egen Claude eller ChatGPT.`));
    const beslut = q("#vn-beslut");
    const knapp = (txt, cls, fn) => { const b = el("button", cls, txt); b.type = "button"; b.onclick = fn; beslut.appendChild(b); return b; };
    const gör = async (handling, extra) => {
      beslut.querySelectorAll("button").forEach((b) => (b.disabled = true));
      try {
        const före = lage();
        await jobbApi("/api/jobb/handling", { id: j.id, handling, ...extra });
        if (handling === "godkann" && firmanAktiv()) firmanBokaOchRita("leverans_godkand", j.agentId);
        await laddaJobb();
        // Lådans sidopanel bär sitt eget nästa steg-kort; det ska inte stå kvar på
        // en leverans som redan är godkänd.
        refreshSidebar();
        const efter = lage();
        if (före && efter && efter.n.niva > före.n.niva) nivaUpp(efter);
        else if (handling === "godkann") toast("Godkänt. Jobbet ligger i arkivet.");
        visaRum(j.agentId, handling === "godkann" || handling === "avbryt" ? null : j.id, { samtal: handling !== "oppna" });
      } catch (e) {
        toast(e.message);
        beslut.querySelectorAll("button").forEach((b) => (b.disabled = false));
      }
    };
    if (j.status === "levererad") {
      knapp("✓ Godkänn", "vn-knapp", () => gör("godkann"));
      knapp("Be om ändring", "vn-knapp-ghost", () => gör("oppna"));
    }
    // U14: en bra leverans blir nästa jobbs utgångspunkt (sparaSomMall i app.js).
    if ((j.status === "levererad" || klar) && j.leverans) {
      const m = knapp("Spara som mall", "vn-knapp-ghost", () => {
        const titel = sparaSomMall(j);
        m.disabled = true; m.textContent = "Sparad som mall ✓";
        toast(`Sparat som "${titel}". Välj den under "Utgå från mall" när du lägger upp nästa jobb.`);
      });
    }
    if (j.status === "oppen" && !j.leverans) knapp("Jag gjorde det själv — lämna leverans", "vn-knapp-ghost", () => egenLeverans(j));
    if (!klar) knapp("Stryk jobbet", "vn-knapp-ghost vn-stryk", () => { if (confirm(`Stryka jobbet "${j.title}"?`)) gör("avbryt"); });
    if (harJobb()) q("#vn-koppla").appendChild(kopplingsRuta());
    yta.querySelectorAll("[data-ut]").forEach((b) => b.onclick = () => {
      const fråga = `Hämta jobbet ${j.id} från Mitt AI-team och gör det. Lämna leveransen där när du är klar.`;
      if (b.dataset.ut === "claude") window.open("https://claude.ai/new?q=" + encodeURIComponent(fråga), "_blank", "noopener");
      else if (b.dataset.ut === "chatgpt") window.open("https://chatgpt.com/?q=" + encodeURIComponent(fråga), "_blank", "noopener");
      else {
        V.jobbId = null;
        visaRum(j.agentId, null, { samtal: true });
        const ta = q("#composer-input");
        if (ta) { ta.value = `Jobb: ${j.title}\n\n${j.brief}` + (j.klartNar.length ? `\n\nKlart när:\n${j.klartNar.map((k) => "- " + k).join("\n")}` : ""); ta.dispatchEvent(new Event("input")); ta.focus(); }
      }
    });
    const tk = q("#vn-tillkund"); if (tk) tk.onclick = () => visaKunder(orgIdFor(j.kund));
  }

  // Leveransen klistras in för hand — t.ex. ett svar från samtalet som är bra
  // nog att godkännas som jobbets leverans.
  function egenLeverans(j) {
    const box = openOverlay("Lämna leveransen");
    box.appendChild(el("p", "ovl-lead", `Klistra in det som blev resultatet av "${j.title}". Sedan granskar och godkänner du det som vanligt.`));
    const ta = el("textarea", "ovl-ta"); ta.rows = 10; box.appendChild(ta);
    const b = el("button", "btn-primary ovl-save", "Lämna leveransen"); b.type = "button"; box.appendChild(b);
    b.onclick = async () => {
      if (!ta.value.trim()) return;
      b.disabled = true;
      try { await jobbApi("/api/jobb/handling", { id: j.id, handling: "leverera", leverans: ta.value }); closeOverlay(); await laddaJobb(); visaRum(j.agentId, j.id); }
      catch (e) { b.disabled = false; toast(e.message); }
    };
    ta.focus();
  }

  function nyttJobb(agentId, kund) {
    const box = openOverlay("Nytt jobb");
    box.appendChild(el("p", "ovl-lead", "Ett jobb är ett uppdrag med ett tydligt slut: det är klart när du har godkänt leveransen."));
    const form = el("div", "jb-form"); box.appendChild(form);
    let vem = null;
    byggJobbForm(form, async () => { const val = vem ? vem.value : agentId; closeOverlay(); await laddaJobb(); visaRum(val); });
    vem = form.querySelector("select"); if (vem && agentId) vem.value = agentId;
    const kf = form.querySelector('input[placeholder="Organisation eller person"]'); if (kf && kund) kf.value = kund;
    const r = form.querySelector("input"); if (r) r.focus();
  }

  function nivaUpp(l) {
    const box = openOverlay(`Firman växer · nivå ${l.n.niva} av 5`);
    box.classList.add("vn-uppnadd");
    box.appendChild(el("h2", "vn-uppnadd-h", l.n.namn));
    const ul = el("ul");
    const F = window.ATBFirman;
    Object.keys(F.PANELER).forEach((id) => { const p = F.PANELER[id]; if (p.niva === l.n.niva && p.byggd !== false && !p.examen) ul.appendChild(el("li", null, "Öppnas nu: " + p.etikett.replace(/^\S+\s/, ""))); });
    if (l.rk && l.rk.dags && l.rk.nasta) { const a = (team.pending || []).find((x) => x.id === l.rk.nasta); if (a) ul.appendChild(el("li", null, `${a.name} kan anställas — rummet står färdigt`)); }
    if (l.n.kvar) ul.appendChild(el("li", null, "Nästa nivå: " + l.n.kvar));
    box.appendChild(ul);
    const b = el("button", "btn-primary ovl-save", "Se våningen →"); b.type = "button";
    b.onclick = () => { closeOverlay(); visaVaning(); };
    box.appendChild(b);
  }

  // ── VD-kontoret ─────────────────────────────────────────────────────────
  function vdKontoret() {
    const l = lage();
    const inn = q("#vn-innehall");
    let h = `<div class="vn-rumhuvud"><div class="vn-du-ikon">${esc(initial())}</div><div><div class="vn-etikett">Ditt rum · du är VD</div><h1>VD-kontoret</h1><p>Det som väntar på dig från hela våningen. Teamet förbereder, du bestämmer.</p></div></div>`;
    h += `<div class="vn-vdrad"><div class="vn-lada"><div class="vn-etikett">Väntar på dig</div><div id="vn-vantar"></div></div><div class="vn-lada"><div class="vn-etikett">Firmans trappa</div><div id="vn-trappa"></div></div></div>`;
    inn.innerHTML = h;
    const vbox = q("#vn-vantar");
    const rader = [];
    vantar().forEach((j) => rader.push({ a: agentById(j.agentId), t: j.title, s: `${(agentById(j.agentId) || {}).name || ""} · leverans att granska`, k: "Öppna", gå: () => visaRum(j.agentId, j.id) }));
    if (l && l.rk && l.rk.dags && l.rk.nasta) {
      const a = (team.pending || []).find((x) => x.id === l.rk.nasta);
      if (a) rader.push({ a, t: `Anställ ${a.name}`, s: hiringReason(team, a.id) || "Nästa i rekryteringsplanen", k: "Träffa", gå: () => openHire(a.id) });
    }
    if (!rader.length) {
      vbox.appendChild(el("p", "vn-dim vn-tomt", "Inget väntar på dig just nu. Teamet arbetar."));
      const nk = el("div", "vn-nasta-ljus"); ritaNasta(nk); vbox.appendChild(nk);
    }
    rader.forEach((r) => {
      const rad = el("div", "vn-vantar-rad");
      if (r.a) { const i = el("img"); i.src = bildFor(r.a); i.alt = ""; rad.appendChild(i); }
      const t = el("div"); t.appendChild(el("b", null, r.t)); t.appendChild(el("span", "vn-dim", r.s)); rad.appendChild(t);
      const b = el("button", "vn-knapp", r.k); b.type = "button"; b.onclick = r.gå; rad.appendChild(b);
      vbox.appendChild(rad);
    });
    const tbox = q("#vn-trappa");
    if (l) {
      const ol = el("ol", "vn-trappan");
      window.ATBFirman.TRAPPAN.forEach((s) => {
        const li = el("li", s.niva < l.n.niva ? "klar" : s.niva === l.n.niva ? "nu" : "");
        li.appendChild(el("span", "n", s.niva < l.n.niva ? "✓" : String(s.niva)));
        const d = el("div"); d.appendChild(el("b", null, s.namn));
        d.appendChild(el("div", "ul", s.niva < l.n.niva ? "Klart" : s.niva === l.n.niva ? "Nu: " + (l.n.kvar || s.krav.toLowerCase()) : "Kräver: " + s.krav.toLowerCase()));
        li.appendChild(d); ol.appendChild(li);
      });
      tbox.appendChild(ol);
    } else {
      tbox.appendChild(el("p", "vn-dim", "Ert team byggdes före trappan. Allt i arbetsytan står öppet."));
    }
    const pk = el("div", "vn-passerkort");
    const gi = el("img"); gi.src = window.ATBAvatars ? window.ATBAvatars.src(3, "avatars/") : ""; gi.alt = ""; pk.appendChild(gi);
    pk.appendChild(el("span", null, "Gunnars gamla passerkort ligger kvar i lådan. Det var där det började."));
    tbox.appendChild(pk);
    const verktyg = el("div", "vn-verktyg");
    [["Teamet i Claude & ChatGPT", oppnaInstallera], ["Veckomötet", startWeek], ["Minne & underlag", openMemory], ["Alla jobb", openJobs.original || openJobs], ["Hela arbetsytan", oppnaLada]].forEach(([t, fn]) => {
      const b = el("button", "vn-knapp-ghost", t); b.type = "button"; b.onclick = fn; verktyg.appendChild(b);
    });
    inn.appendChild(verktyg);
  }

  // ── kunderna ────────────────────────────────────────────────────────────
  // Organisationer (kommuner, föreningar, företag, privatpersoner) och
  // kontakter (människor). Mikael 2026-10-24: "det är det man gör som
  // företagare i B2B". Affärerna kommer ur jobben — kunden på ett jobb ÄR en
  // organisation, även innan någon fört in den — och registret delas sedan SP23 med
  // kundens egen AI: kopian ligger i atb_kunder_<slug>, sanningen i /api/firma
  // (firmaSynk och firmaSpeglaKunder i app.js).
  const ORGTYPER = ["Företag", "Förening", "Kommun", "Myndighet", "Privatperson", "Annan"];
  const regKey = () => "atb_kunder_" + state.slug;
  function register() {
    try { const r = JSON.parse(localStorage.getItem(regKey()) || "null"); if (r && r.org && r.pers) return r; } catch (_) { /* trasig post */ }
    return { org: {}, pers: {} };
  }
  function sparaRegister(r) {
    try { localStorage.setItem(regKey(), JSON.stringify(r)); } catch (_) { toast("Kunde inte spara — webbläsarens lagring är full."); return false; }
    // SP23: registret delas med kundens egen AI — Claude och ChatGPT ser samma kunder.
    firmaSpeglaKunder(r);
    return true;
  }
  const nyckel = (namn) => String(namn || "").trim().toLowerCase().replace(/\s+/g, " ");
  const nyttId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // Alla organisationer: registret plus jobbens kunder som ingen fört in.
  function organisationer() {
    const r = register();
    const ut = {};
    Object.entries(r.org).forEach(([id, o]) => { ut[id] = Object.assign({ id }, o); });
    const finns = new Set(Object.values(ut).map((o) => nyckel(o.namn)));
    jobben().forEach((j) => {
      const k = nyckel(j.kund);
      if (k && !finns.has(k)) { finns.add(k); ut["jobb:" + k] = { id: "jobb:" + k, namn: j.kund.trim(), typ: "", not: "", ur: "jobb" }; }
    });
    return ut;
  }
  function orgIdFor(kund) {
    const k = nyckel(kund);
    const o = Object.values(organisationer()).find((x) => nyckel(x.namn) === k);
    return o ? o.id : null;
  }
  const jobbForOrg = (o) => jobben().filter((j) => nyckel(j.kund) === nyckel(o.namn) && j.status !== "avbruten");
  const initialer = (n) => String(n || "?").split(/\s+/).map((d) => d[0] || "").join("").slice(0, 2).toUpperCase();
  const FASER = [["oppen", "Öppen"], ["hamtad", "Pågår"], ["levererad", "Väntar på dig"], ["godkand", "Klar"]];
  const fasFor = (j) => (j.status === "oppen" && j.hamtadAt ? "hamtad" : j.status);

  function visaKunder(orgId, lins) {
    visa("kunder");
    if (lins) V.lins = lins;
    const box = q("#vn-kunder");
    if (orgId) return parm(orgId);
    V.parm = null;
    const orgs = organisationer(), reg = register();
    const medKund = jobben().filter((j) => j.kund && j.status !== "avbruten");
    const LINSER = [["affarer", "Affärer"], ["org", "Organisationer"], ["kontakter", "Kontakter"]];
    let h = `<div class="vn-tavla-inre"><div class="vn-tavla-topp"><div><div class="vn-etikett vn-ljus">Kunderna</div><h1>Vilka gör ni affärer med?</h1><p>Allt på tavlan kommer ur jobben på våningen. Organisationer och kontakter för du in när du vill minnas något om dem.</p></div>
      <div class="vn-summa"><div>Organisationer<b>${Object.keys(orgs).length}</b></div><div>Jobb pågår<b>${medKund.filter((j) => j.status === "oppen").length}</b></div><div class="${vantar().length ? "rod" : ""}">Väntar på dig<b>${vantar().length}</b></div></div></div>
      <div class="vn-linser" role="tablist">${LINSER.map(([id, t]) => `<button type="button" role="tab" aria-selected="${V.lins === id}" class="${V.lins === id ? "akt" : ""}" data-lins="${id}">${t}</button>`).join("")}
      <span class="vn-linser-hoger"><button type="button" class="vn-hudknapp" id="vn-nyorg">+ Organisation</button><button type="button" class="vn-hudknapp" id="vn-nykontakt">+ Kontakt</button></span></div>`;
    if (V.lins === "affarer") {
      h += `<div class="vn-tavla">`;
      FASER.forEach(([fas, rubrik]) => {
        const i = medKund.filter((j) => fasFor(j) === fas);
        h += `<div class="vn-kol"><h3>${esc(rubrik)}<span>${i.length}</span></h3>`;
        if (!i.length) h += `<div class="tom">Inget här just nu</div>`;
        i.forEach((j) => {
          const a = agentById(j.agentId);
          const oid = orgIdFor(j.kund); const o = orgs[oid] || {};
          h += `<button type="button" class="vn-kund${fas === "levererad" ? " du-tur" : ""}" data-r="${esc(j.agentId)}" data-j="${esc(j.id)}"><span class="orgtyp">${esc(o.typ || "Kund")}</span><b>${esc(j.kund)}</b><div class="vad">${esc(j.title)}</div>
            <div class="nast">${a ? `<img src="${esc(bildFor(a))}" alt="">` : ""}<span>${esc(fas === "levererad" ? "Du: granska leveransen" : fas === "godkand" ? "Godkänt" : (a ? a.name : "") + (j.hamtadAv ? " · i " + j.hamtadAv : ""))}</span></div></button>`;
        });
        h += `</div>`;
      });
      h += `</div>`;
      if (!medKund.length) h += `<p class="vn-tavla-tom">Inga jobb har en kund än. Skriv kunden i fältet "Åt vem?" när du lägger upp ett jobb, så hamnar affären här.</p>`;
    } else if (V.lins === "org") {
      const lista = Object.values(orgs);
      h += lista.length ? `<div class="vn-orgnat">` + lista.map((o) => {
        const folk = Object.values(reg.pers).filter((p) => p.org === o.id);
        const aff = jobbForOrg(o);
        return `<button type="button" class="vn-orgkort" data-o="${esc(o.id)}"><span class="orgtyp">${esc(o.typ || "Ej ifylld")}</span><b>${esc(o.namn)}</b>${o.not ? `<div class="vad">${esc(o.not)}</div>` : ""}
          <div class="folk">${folk.map((p) => `<span title="${esc(p.namn)}">${esc(initialer(p.namn))}</span>`).join("")}<em>${folk.length} ${folk.length === 1 ? "kontakt" : "kontakter"}</em></div>
          ${aff.slice(0, 3).map((j) => `<div class="aff">${esc((FASER.find((f) => f[0] === fasFor(j)) || ["", ""])[1])} · ${esc(j.title)}</div>`).join("")}</button>`;
      }).join("") + `</div>` : `<p class="vn-tavla-tom">Inga organisationer än. Lägg till en, eller skriv en kund på ett jobb.</p>`;
    } else {
      const folk = Object.entries(reg.pers);
      h += folk.length ? `<div class="vn-kontaktlista">` + folk.map(([id, p]) => {
        const o = orgs[p.org];
        return `<button type="button" class="vn-kontakt" data-o="${esc(p.org || "")}" data-p="${esc(id)}"><span class="ini">${esc(initialer(p.namn))}</span><div><b>${esc(p.namn)}</b><div class="vad">${esc([p.roll, o && o.namn].filter(Boolean).join(" · "))}</div></div><div class="not">${esc(p.not || "")}</div></button>`;
      }).join("") + `</div>` : `<p class="vn-tavla-tom">Inga kontakter än. En kontakt är en människa: vem hen är, var hen jobbar, och det du vill komma ihåg om hen.</p>`;
    }
    h += `</div>`;
    box.innerHTML = h;
    box.querySelectorAll("[data-lins]").forEach((b) => b.onclick = () => visaKunder(null, b.dataset.lins));
    box.querySelectorAll(".vn-kund").forEach((b) => b.onclick = () => visaRum(b.dataset.r, b.dataset.j));
    box.querySelectorAll(".vn-orgkort").forEach((b) => b.onclick = () => visaKunder(b.dataset.o));
    box.querySelectorAll(".vn-kontakt").forEach((b) => b.onclick = () => (b.dataset.o ? visaKunder(b.dataset.o) : redigeraKontakt(b.dataset.p)));
    q("#vn-nyorg").onclick = () => redigeraOrg(null);
    q("#vn-nykontakt").onclick = () => redigeraKontakt(null);
  }

  function parm(orgId) {
    const orgs = organisationer(), reg = register();
    const o = orgs[orgId];
    if (!o) return visaKunder();
    V.parm = orgId;
    const folk = Object.entries(reg.pers).filter(([, p]) => p.org === orgId);
    const aff = jobbForOrg(o);
    const box = q("#vn-kunder");
    box.innerHTML = `<div class="vn-tavla-inre"><button type="button" class="vn-hudknapp" id="vn-tilltavlan">← Kunderna</button>
      <div class="vn-lada vn-parm"><div class="vn-etikett">${esc(o.typ || "Organisation")}</div><h1>${esc(o.namn)}</h1>${o.not ? `<p class="vn-dim">${esc(o.not)}</p>` : ""}
      <div class="vn-vdrad"><div><div class="vn-etikett">Jobben</div><div id="vn-parm-jobb"></div></div>
      <div><div class="vn-etikett">Kontakter</div><div id="vn-parm-folk"></div></div></div>
      <div class="vn-verktyg"><button type="button" class="vn-knapp" id="vn-parm-jobbny">+ Nytt jobb åt ${esc(o.namn)}</button><button type="button" class="vn-knapp-ghost" id="vn-parm-kontakt">+ Kontakt</button><button type="button" class="vn-knapp-ghost" id="vn-parm-red">${o.ur === "jobb" ? "För in i registret" : "Ändra"}</button></div></div></div>`;
    const jl = q("#vn-parm-jobb");
    if (!aff.length) jl.appendChild(el("p", "vn-dim", "Inget jobb åt dem än."));
    aff.sort((x, y) => y.updatedAt - x.updatedAt).forEach((j) => {
      const a = agentById(j.agentId);
      const b = el("button", "vn-projrad"); b.type = "button";
      if (a) { const i = el("img"); i.src = bildFor(a); i.alt = ""; b.appendChild(i); }
      const d = el("div"); d.appendChild(el("b", null, j.title)); d.appendChild(el("div", "vn-dim", a ? a.name : j.agentId)); b.appendChild(d);
      b.appendChild(el("span", "s" + (j.status === "levererad" ? " v" : ""), j.status === "levererad" ? "● Väntar på dig" : (FASER.find((f) => f[0] === fasFor(j)) || ["", ""])[1]));
      b.onclick = () => visaRum(j.agentId, j.id);
      jl.appendChild(b);
    });
    const fl = q("#vn-parm-folk");
    if (!folk.length) fl.appendChild(el("p", "vn-dim", "Inga kontakter än."));
    folk.forEach(([id, p]) => {
      const r = el("button", "vn-kontakt-ljus"); r.type = "button";
      r.appendChild(el("span", "ini", initialer(p.namn)));
      const d = el("div"); d.appendChild(el("b", null, p.namn));
      if (p.roll) d.appendChild(el("div", "vad", p.roll));
      if (p.not) d.appendChild(el("div", "not", p.not));
      r.appendChild(d); r.onclick = () => redigeraKontakt(id);
      fl.appendChild(r);
    });
    q("#vn-tilltavlan").onclick = () => visaKunder();
    q("#vn-parm-jobbny").onclick = () => nyttJobb(team.entryAgent, o.namn);
    q("#vn-parm-kontakt").onclick = () => redigeraKontakt(null, orgId);
    q("#vn-parm-red").onclick = () => redigeraOrg(orgId);
  }

  function formular(titel, falt, spara, tabort) {
    const box = openOverlay(titel);
    const ut = {};
    falt.forEach((f) => {
      const id = "vn-f-" + f.n;
      const lab = el("label", "ovl-label", f.l); lab.setAttribute("for", id);
      let n;
      if (f.val) { n = el("select", "ovl-input"); f.val.forEach(([v, t]) => { const o = el("option", null, t); o.value = v; n.appendChild(o); }); }
      else if (f.lang) { n = el("textarea", "ovl-ta"); n.rows = 3; }
      else n = el("input", "ovl-input");
      n.id = id; n.value = f.v || ""; if (f.ph) n.placeholder = f.ph;
      box.append(lab, n); ut[f.n] = n;
    });
    const rad = el("div", "vn-verktyg");
    const b = el("button", "btn-primary ovl-save", "Spara"); b.type = "button";
    b.onclick = () => { if (spara(Object.fromEntries(Object.entries(ut).map(([k, n]) => [k, n.value.trim()]))) !== false) closeOverlay(); };
    rad.appendChild(b);
    if (tabort) { const t = el("button", "vn-knapp-ghost", "Ta bort"); t.type = "button"; t.onclick = () => { if (confirm("Ta bort?")) { tabort(); closeOverlay(); } }; rad.appendChild(t); }
    box.appendChild(rad);
    const forsta = box.querySelector("input,textarea"); if (forsta) forsta.focus();
  }

  function redigeraOrg(orgId) {
    const orgs = organisationer();
    const o = orgId ? orgs[orgId] : null;
    formular(o && o.ur !== "jobb" ? "Ändra organisationen" : "Ny organisation", [
      { n: "namn", l: "Namn", v: o ? o.namn : "", ph: "T.ex. Sollentuna kommun" },
      { n: "typ", l: "Vad är det?", v: o ? o.typ : "Företag", val: ORGTYPER.map((t) => [t, t]) },
      { n: "not", l: "Att minnas (valfritt)", v: o ? o.not : "", lang: true, ph: "Avtal, vem som bestämmer, hur de vill bli kontaktade" },
    ], (v) => {
      if (!v.namn) { toast("Organisationen behöver ett namn."); return false; }
      const r = register();
      const id = o && o.ur !== "jobb" ? orgId : nyttId("o");
      r.org[id] = { namn: v.namn.slice(0, 120), typ: v.typ, not: v.not.slice(0, 600) };
      // Kontakter som hörde till kundnamnet ur jobben följer med till registret.
      if (o && o.ur === "jobb") Object.values(r.pers).forEach((p) => { if (p.org === orgId) p.org = id; });
      if (sparaRegister(r)) parm(id);
    }, o && o.ur !== "jobb" ? () => { const r = register(); delete r.org[orgId]; Object.values(r.pers).forEach((p) => { if (p.org === orgId) p.org = ""; }); sparaRegister(r); visaKunder(); } : null);
  }

  function redigeraKontakt(pid, orgId) {
    const r = register();
    const p = pid ? r.pers[pid] : null;
    const orgs = organisationer();
    formular(p ? "Ändra kontakten" : "Ny kontakt", [
      { n: "namn", l: "Namn", v: p ? p.namn : "", ph: "T.ex. Maria Lind" },
      { n: "roll", l: "Roll (valfritt)", v: p ? p.roll : "", ph: "T.ex. ordförande, inköp" },
      { n: "org", l: "Organisation", v: p ? p.org : (orgId || ""), val: [["", "Ingen"]].concat(Object.values(orgs).map((o) => [o.id, o.namn])) },
      { n: "not", l: "Att minnas (valfritt)", v: p ? p.not : "", lang: true, ph: "T.ex. nås bäst före 08, föredrar sms" },
    ], (v) => {
      if (!v.namn) { toast("Kontakten behöver ett namn."); return false; }
      const reg = register();
      const id = pid || nyttId("p");
      reg.pers[id] = { namn: v.namn.slice(0, 120), roll: v.roll.slice(0, 120), org: v.org, not: v.not.slice(0, 600) };
      if (sparaRegister(reg)) (v.org ? parm(v.org) : visaKunder(null, "kontakter"));
    }, p ? () => { const reg = register(); delete reg.pers[pid]; sparaRegister(reg); visaKunder(null, "kontakter"); } : null);
  }

  // ── start och krokar ────────────────────────────────────────────────────
  // Gäller köpta och riktiga team. Demoläget (exempelteamen, ?intern=1) har
  // den gamla vyn kvar: det har inga jobb och ingen trappa att visa.
  const aktiv = () => !state.demo && !!team && Array.isArray(team.agents) && team.agents.length > 0;

  async function start() {
    if (!aktiv()) return;
    const app = q(".app"); if (!app) return;
    V.pa = true;
    document.body.classList.add("vn-pa");
    V.main = q(".app > .main");
    V.sidebar = q(".app > .sidebar");
    const root = q("#root");
    const hud = el("header", "vn-hud"); hud.id = "vn-hud";
    root.insertBefore(hud, root.firstChild);
    ["vaning", "kunder", "rum"].forEach((n) => { const m = el("main", "vn-vy vn-" + n); m.id = "vn-" + n; m.hidden = true; root.appendChild(m); });
    // Arbetsytan som låda: sidopanelen flyttas dit, hel och hållen.
    const lada = el("div", "vn-ladan"); lada.id = "vn-lada"; lada.hidden = true;
    lada.setAttribute("role", "dialog"); lada.setAttribute("aria-label", "Arbetsytan");
    const st = el("button", "vn-lada-stang", "Stäng ×"); st.type = "button"; st.onclick = stangLada;
    lada.appendChild(st);
    if (V.sidebar) lada.appendChild(V.sidebar);
    const bak = el("div", "vn-lada-bak"); bak.onclick = stangLada; lada.appendChild(bak);
    root.appendChild(lada);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !q("#vn-lada").hidden) stangLada(); });
    visaVaning();
    await laddaJobb();
    const p = new URLSearchParams(location.search);
    // Jobben kom efter första ritningen. Står kunden redan i ett rum ritas det
    // om, annars ligger skrivbordet tomt tills hon går ut och in igen.
    if (p.get("vy") === "kunder") visaKunder(); else if (p.get("vy") === "vd") visaRum("vd");
    else if (V.vy === "vaning") visaVaning();
    else if (V.vy === "rum") visaRum(V.rum, V.jobbId, { samtal: !V.jobbId });
    else if (V.vy === "kunder") visaKunder(V.parm);
    ritaHud();
  }

  // Ritar om det som syns — efter en anställning, en bokning eller en synk.
  function omrita() {
    if (!V.pa) return;
    // Sidopanelen byts ut av refreshSidebar(); se till att den nya hamnar i lådan.
    const ny = q(".app > .sidebar");
    if (ny && q("#vn-lada")) { q("#vn-lada").insertBefore(ny, q(".vn-lada-bak")); V.sidebar = ny; }
    const l = lage();
    if (l && V.nivaFore != null && l.n.niva > V.nivaFore) { /* nivaUpp visas av den som godkände */ }
    V.nivaFore = l ? l.n.niva : null;
    if (V.vy === "vaning") visaVaning();
    else if (V.vy === "rum" && V.rum === "vd") visaRum("vd");
    else if (V.vy === "kunder") ritaHud();
    else ritaHud();
  }

  // Krokarna in i app.js. Allt som väljer en agent någonstans i portalen —
  // nästa steg, en rutin, introduktionen, lådans laglista — ska leda in i
  // agentens rum, annars händer det osynligt bakom våningen.
  function krokar() {
    if (typeof window.selectAgent !== "function" || window.selectAgent.vaning) return;
    const orig = window.selectAgent;
    V.selectAgent = orig;
    const ny = function (id, opts) {
      orig(id, opts);
      if (!V.pa || (opts && opts.boot)) return;
      stangLada();
      if (!(V.vy === "rum" && V.rum === id && !V.jobbId && !V.inred)) visaRum(id, null, { samtal: true });
    };
    ny.vaning = true;
    window.selectAgent = ny;
    if (typeof window.openJobs === "function" && !window.openJobs.vaning) {
      const origJ = window.openJobs;
      const nyJ = function () {
        if (!V.pa) return origJ();
        const j = vantar()[0];
        if (j) return visaRum(j.agentId, j.id);
        return origJ();
      };
      nyJ.vaning = true; nyJ.original = origJ;
      window.openJobs = nyJ;
    }
    if (typeof window.openHire === "function" && !window.openHire.vaning) {
      const origH = window.openHire;
      const nyH = function (id) { V.nyss = id; return origH(id); };
      nyH.vaning = true;
      window.openHire = nyH;
    }
  }
  krokar();

  window.ATBVaning = { start, omrita, aktiv, visaVaning, visaRum, visaKunder };
})();
