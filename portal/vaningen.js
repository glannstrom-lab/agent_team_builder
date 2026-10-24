/* ============================================================
   Mitt AI-team — Våningen (SP16/SP20, skiss 14 gjord skarp 2026-10-24)

   Mikael: "en design som ett riktigt företag, designat som ett spel ...
   kontor som innehåller de aktuella arbetsuppgifterna, tydliga arbetsytor
   med pågående projekt." Ledstången samma dag: begriplighet och översikt,
   inte funktionalitet.

   Portalen öppnar på kontorsvåningen sedd ovanifrån. Varje anställd har ett
   rum, jobben ligger som mappar på skrivbordet, och en röd prick betyder att
   något väntar på kunden. Kunden är VD:n (KA14) och har VD-kontoret. De som
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
    main: null, sidebar: null, nyss: null, nivaFore: null,
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

  // Rummen i den ordning de ritas: VD-kontoret, ingångsagentens kontor, de
  // anställda i byggets ordning, de som kommer enligt planen, och två
  // gemensamma rum vars förmåga låses upp av trappan.
  function rummen() {
    const entry = agentById(team.entryAgent) || team.agents[0];
    const lista = [{ id: "vd", typ: "du", namn: "VD-kontoret", golv: "#E3D6BF" }];
    if (entry) lista.push({ id: entry.id, typ: "agent", agent: entry, namn: kontorFor(entry), golv: "#DFE3D6" });
    team.agents.filter((a) => entry && a.id !== entry.id).forEach((a, i) =>
      lista.push({ id: a.id, typ: "agent", agent: a, namn: a.name, golv: i % 2 ? "#E6DCCB" : "#E8DCC8" }));
    (team.pending || []).forEach((a) => lista.push({ id: a.id, typ: "vakant", agent: a, namn: a.name }));
    lista.push({ id: "__mote", typ: "mote", namn: "Mötesrummet", golv: "#E2DACB" });
    lista.push({ id: "__pentry", typ: "pentry", namn: "Pentryt", golv: "#D8D2C7" });
    // Planritningen: tre rum per rad (5 + 5 + 4 rutor), första raden djupare.
    const BREDD = [5, 5, 4];
    let y = 0;
    for (let i = 0; i < lista.length; i += 3) {
      const h = i === 0 ? 4 : 3;
      let x = 0;
      lista.slice(i, i + 3).forEach((r, k) => { Object.assign(r, { x, y, w: BREDD[k], h }); x += BREDD[k]; });
      y += h;
    }
    lista.djup = y;
    return lista;
  }

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
      <a class="vn-firma" href="../" title="Till Mitt AI-team">${esc(team.company)}<small>Våning 1 · ${DAGAR[new Date(nu).getDay()]} · v. ${veckaNr(nu)}</small></a>
      ${niva}
      <nav class="vn-hudnav" aria-label="Våningen">
        <button type="button" class="vn-hudknapp${V.vy === "vaning" ? " akt" : ""}" data-g="vaning">Våningen</button>
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

  // ── isometrin ───────────────────────────────────────────────────────────
  const SK = 46;
  const iso = (x, y, z = 0) => [(x - y) * 0.866 * SK, (x + y) * 0.5 * SK - z * SK];
  const pts = (a) => a.map(([x, y, z]) => iso(x, y, z).map((n) => n.toFixed(1)).join(",")).join(" ");
  const poly = (a, fill, extra = "") => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
  function lada(x, y, z, w, d, h, topp, v, hgr) {
    return "<g>" +
      poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], v) +
      poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], hgr) +
      poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], topp) + "</g>";
  }
  const vaggar = (r) => lada(r.x, r.y, 0, r.w, 0.14, 1.15, "#2B241C", "#F4EEE4", "#D9CFBF") + lada(r.x, r.y, 0, 0.14, r.h, 1.15, "#2B241C", "#E9E1D3", "#E3D9C9");
  function skrivbord(cx, cy, mappar) {
    let s = lada(cx - 0.85, cy - 0.15, 0, 1.7, 0.75, 0.42, "#8A6A48", "#6B5136", "#5A442D");
    s += lada(cx - 0.35, cy - 0.05, 0.42, 0.7, 0.06, 0.38, "#1E1913", "#2B241C", "#151210");
    mappar.slice(0, 6).forEach((j, i) => {
      const f = j.status === "levererad" ? "#9C3B2E" : i % 2 ? "#A9741F" : "#C9B48E";
      s += lada(cx + 0.35, cy + 0.12 + i * 0.02, 0.42 + i * 0.05, 0.38, 0.3, 0.045, f, "#6B5136", "#5A442D");
    });
    return s;
  }
  const stol = (cx, cy) => lada(cx - 0.22, cy - 0.75, 0, 0.44, 0.44, 0.3, "#3A3128", "#2B241C", "#221C16");
  function vaxt(x, y) {
    const [a1, b1] = iso(x + 0.16, y + 0.16, 0.62), [a2, b2] = iso(x + 0.1, y + 0.2, 0.78);
    return lada(x, y, 0, 0.32, 0.32, 0.28, "#5E554A", "#4A4036", "#3A3128") +
      `<circle cx="${a1}" cy="${b1}" r="12" fill="#4F7A54"/><circle cx="${a2}" cy="${b2}" r="9" fill="#5F8A63"/>`;
  }
  const hylla = (r) => lada(r.x + 0.5, r.y + 0.15, 0, Math.min(1.4, r.w - 1.2), 0.32, 0.9, "#6B5136", "#8A6A48", "#5A442D");
  function portratt(r, cx, cy) {
    const [px, py] = iso(cx, cy - 0.45, 1.25);
    const src = bildFor(r.agent);
    const id = "vnc-" + String(r.id).replace(/[^a-z0-9-]/gi, "");
    if (!src) return `<circle cx="${px}" cy="${py}" r="21.5" fill="#FCFAF6"/><text x="${px}" y="${py + 7}" text-anchor="middle" font-size="18">${esc(r.agent.icon || "•")}</text>`;
    return `<g><clipPath id="${id}"><circle cx="${px}" cy="${py}" r="19"/></clipPath><circle cx="${px}" cy="${py}" r="21.5" fill="#FCFAF6"/>` +
      `<image href="${esc(src)}" x="${px - 19}" y="${py - 19}" width="38" height="38" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/></g>`;
  }
  function duMarke(cx, cy) {
    const [px, py] = iso(cx, cy - 0.45, 1.25);
    return `<circle cx="${px}" cy="${py}" r="21.5" fill="#FCFAF6"/><circle cx="${px}" cy="${py}" r="19" fill="#1E1913"/>` +
      `<text x="${px}" y="${py + 6}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="16" fill="#FCFAF6">${esc(initial())}</text>`;
  }
  function tagg(r, namn, status, rod, last) {
    const [tx, ty] = iso(r.x + r.w / 2, r.y + r.h / 2, last ? 0.45 : 2.35);
    const [gx, gy] = iso(r.x + r.w / 2, r.y + r.h / 2, 1.5);
    const kort = namn.length > 26 ? namn.slice(0, 25) + "…" : namn;
    const bredd = Math.max(kort.length * 8.1, status.length * 6.6) + 28;
    let s = `<g class="vn-tagg${last ? " last" : ""}">`;
    if (!last) s += `<line x1="${tx}" y1="${ty + 20}" x2="${gx}" y2="${gy}" stroke="#FCFAF6" stroke-width="1" opacity=".5"/>`;
    s += `<rect class="bas" x="${tx - bredd / 2}" y="${ty - 20}" width="${bredd}" height="40" rx="5"/>`;
    s += `<text class="namn" x="${tx}" y="${ty - 3}" text-anchor="middle">${esc(kort)}</text>`;
    s += `<text class="status" x="${tx}" y="${ty + 12}" text-anchor="middle">${esc(status)}</text>`;
    if (rod) s += `<g class="vn-puls"><circle cx="${tx + bredd / 2 - 2}" cy="${ty - 19}" r="10" fill="#9C3B2E"/><text x="${tx + bredd / 2 - 2}" y="${ty - 15}" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="#fff">${rod}</text></g>`;
    return s + "</g>";
  }

  function ritaSvg(svg) {
    const l = lage();
    const R = rummen();
    const ordning = [...R].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    let s = lada(-0.2, -0.2, -0.35, 14.4, R.djup + 0.4, 0.35, "#3A3128", "#2B241C", "#221C16");
    for (const r of ordning) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 0.2;
      const golv = [[r.x, r.y, 0], [r.x + r.w, r.y, 0], [r.x + r.w, r.y + r.h, 0], [r.x, r.y + r.h, 0]];
      if (rumLast(r, l)) {
        const kan = r.typ === "vakant" && l && l.rk && l.rk.nasta === r.id && l.rk.dags;
        s += `<g class="vn-rum" tabindex="0" role="button" data-rum="${esc(r.id)}" aria-label="${esc(r.namn)}, ${esc(lasText(r, l))}">`;
        s += poly(golv, kan ? "rgba(169,116,31,.16)" : "rgba(185,174,156,.10)", `class="golv golvkant" stroke="${kan ? "#A9741F" : "#8A7F70"}" stroke-dasharray="6 5" stroke-width="1.5"`);
        if (kan) { const [bx, by] = iso(cx, cy, 0); s += `<text class="vn-blink" x="${bx}" y="${by + 4}" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" letter-spacing="1" fill="#D9A54A">+ ANSTÄLL</text>`; }
        s += tagg(r, r.namn, lasText(r, l), 0, !kan) + "</g>";
        continue;
      }
      const mappar = r.typ === "agent" ? jobbFor(r.id) : [];
      const rod = r.typ === "du" ? vantar().length + (l && l.rk && l.rk.dags ? 1 : 0) : mappar.filter((j) => j.status === "levererad").length;
      s += `<g class="vn-rum${V.nyss === r.id ? " vn-bygg" : ""}" tabindex="0" role="button" data-rum="${esc(r.id)}" aria-label="${esc(r.namn)}${rod ? ", " + rod + " väntar på dig" : ""}">`;
      s += poly(golv, r.golv, `class="golv golvkant" stroke="#2B241C" stroke-width="1"`);
      for (let i = 1; i < r.w; i++) s += `<polyline points="${pts([[r.x + i, r.y, 0], [r.x + i, r.y + r.h, 0]])}" stroke="#000" stroke-opacity=".05" fill="none"/>`;
      s += vaggar(r);
      if (r.typ === "du" || r.typ === "agent") {
        s += hylla(r) + stol(cx, cy) + skrivbord(cx, cy, r.typ === "du" ? vantar() : mappar);
        s += r.typ === "du" ? duMarke(cx, cy) : portratt(r, cx, cy);
        s += vaxt(r.x + r.w - 0.6, r.y + 0.35);
        const status = r.typ === "du"
          ? (rod ? `${rod} väntar på dig` : "Inget väntar")
          : (mappar.length ? `${mappar.length} ${mappar.length === 1 ? "jobb" : "jobb"} på bordet` : (r.agent.id === team.entryAgent ? "Håller ihop veckan" : "Redo för jobb"));
        s += tagg(r, r.typ === "du" ? "VD-kontoret · du" : r.namn, status, rod, false);
      } else if (r.typ === "pentry") {
        s += poly([[r.x + 0.8, r.y + 0.15, 0.35], [r.x + 3.4, r.y + 0.15, 0.35], [r.x + 3.4, r.y + 0.15, 1.0], [r.x + 0.8, r.y + 0.15, 1.0]], "#FFFFFF", `stroke="#5E554A"`);
        const n = Math.min(3, (team.routines || []).length);
        for (let i = 0; i < n; i++) s += `<polyline points="${pts([[r.x + 1.0, r.y + 0.16, 0.85 - i * 0.16], [r.x + 2.6 - i * 0.3, r.y + 0.16, 0.85 - i * 0.16]])}" stroke="#A9741F" stroke-width="2" fill="none"/>`;
        s += lada(r.x + r.w - 1.6, r.y + 0.15, 0, 1.4, 0.55, 0.85, "#B9AE9C", "#E8E1D5", "#CFC7BA");
        s += lada(cx - 0.5, cy + 0.3, 0, 1, 1, 0.65, "#8A6A48", "#6B5136", "#5A442D");
        s += tagg(r, "Pentryt", (team.routines || []).length ? "Veckans rutiner på tavlan" : "Tavlan är tom", 0, false);
      } else if (r.typ === "mote") {
        s += lada(cx - 1.1, cy - 0.5, 0, 2.2, 1.1, 0.42, "#8A6A48", "#6B5136", "#5A442D");
        s += tagg(r, "Mötesrummet", "Håll ett möte", 0, false);
      }
      s += "</g>";
    }
    // Viewbox ur rummens hörn, så att våningen växer med teamet.
    const hörn = [iso(-0.2, -0.2, 2.8), iso(14.2, -0.2, 2.8), iso(-0.2, R.djup + 0.2, -0.4), iso(14.2, R.djup + 0.2, -0.4)];
    const xs = hörn.map((p) => p[0]), ys = hörn.map((p) => p[1]);
    const mx = Math.min(...xs) - 40, my = Math.min(...ys) - 30;
    svg.setAttribute("viewBox", `${mx.toFixed(0)} ${my.toFixed(0)} ${(Math.max(...xs) - mx + 40).toFixed(0)} ${(Math.max(...ys) - my + 20).toFixed(0)}`);
    svg.innerHTML = s;
    // Skylten mäts efter ritningen: en uppskattad teckenbredd räckte inte för
    // långa jobbnamn ("Ekonomi-avstämningsagenten"), och texten stack ut.
    svg.querySelectorAll(".vn-tagg").forEach((g) => {
      const rect = g.querySelector("rect.bas"); if (!rect) return;
      let w = 0;
      g.querySelectorAll("text.namn, text.status").forEach((t) => { try { w = Math.max(w, t.getComputedTextLength()); } catch (_) { /* inte ritad */ } });
      if (!w) return;
      const mitt = +rect.getAttribute("x") + +rect.getAttribute("width") / 2;
      const ny = w + 26;
      rect.setAttribute("x", (mitt - ny / 2).toFixed(1)); rect.setAttribute("width", ny.toFixed(1));
      const prick = g.querySelector(".vn-puls");
      if (prick) { const nx = (mitt + ny / 2 - 2).toFixed(1); prick.querySelectorAll("circle, text").forEach((n) => n.setAttribute(n.tagName === "circle" ? "cx" : "x", nx)); }
    });
    svg.querySelectorAll(".vn-rum").forEach((g) => {
      const gå = () => klickRum(g.dataset.rum);
      g.addEventListener("click", gå);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); gå(); } });
    });
    V.nyss = null;
  }

  // ── vyerna ──────────────────────────────────────────────────────────────
  function visa(vy) {
    V.vy = vy;
    ["vaning", "kunder", "rum"].forEach((n) => { const e = q("#vn-" + n); if (e) e.hidden = n !== vy; });
    ritaHud();
    window.scrollTo(0, 0);
  }

  function visaVaning() {
    visa("vaning");
    const box = q("#vn-vaning");
    box.innerHTML = `<div class="vn-scen"><div class="vn-rutnat"></div><svg id="vn-svg" role="img" aria-label="Kontorsvåningen sedd ovanifrån"></svg></div>
      <div class="vn-nasta"><div class="vn-nasta-kort" id="vn-nasta"></div></div><div class="vn-rumlista" id="vn-rumlista"></div>`;
    ritaSvg(q("#vn-svg"));
    ritaNasta(q("#vn-nasta"));
    const l = lage();
    q("#vn-rumlista").innerHTML = rummen().map((r) => {
      const last = rumLast(r, l);
      const pr = r.typ === "agent" ? jobbFor(r.id) : [];
      const rod = r.typ === "du" ? vantar().length : pr.filter((j) => j.status === "levererad").length;
      const sub = last ? lasText(r, l) : rod ? rod + " väntar på dig" : pr.length ? pr.length + " jobb" : "";
      return `<button type="button" class="${last ? "last" : ""}" data-rum="${esc(r.id)}">${esc(r.namn)}<span>${esc(sub)}</span></button>`;
    }).join("");
    q("#vn-rumlista").querySelectorAll("button").forEach((b) => b.onclick = () => klickRum(b.dataset.rum));
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
  function miniplan(akt) {
    const R = rummen(); const l = lage();
    return `<div class="vn-miniplan" style="aspect-ratio:14/${R.djup}">` + R.map((r) => {
      const last = rumLast(r, l);
      const rod = r.typ === "du" ? vantar().length : r.typ === "agent" && jobbFor(r.id).some((j) => j.status === "levererad");
      const st = `left:${(r.x / 14) * 100}%;top:${(r.y / R.djup) * 100}%;width:calc(${(r.w / 14) * 100}% - 4px);height:calc(${(r.h / R.djup) * 100}% - 4px)`;
      return `<button type="button" style="${st}" class="${r.id === akt ? "akt" : ""} ${last ? "last" : ""}" data-rum="${esc(r.id)}" title="${esc(r.namn)}">${esc(r.typ === "du" ? "VD" : r.namn)}${rod ? '<span class="r"></span>' : ""}</button>`;
    }).join("") + "</div>";
  }

  function visaRum(id, jobbId, opts) {
    opts = opts || {};
    if (id !== "vd" && !agentById(id)) return visaVaning();
    visa("rum");
    V.rum = id;
    const box = q("#vn-rum");
    box.innerHTML = `<div class="vn-arbete"><aside class="vn-plan"><div class="vn-etikett">Våningen</div>${miniplan(id)}
      <button type="button" class="vn-knapp-ghost vn-tillbaka">← Hela våningen</button></aside><section class="vn-innehall" id="vn-innehall"></section></div>`;
    box.querySelectorAll(".vn-miniplan button").forEach((b) => b.onclick = () => klickRum(b.dataset.rum));
    q(".vn-tillbaka", box).onclick = visaVaning;
    ritaHud();
    if (id === "vd") return vdKontoret();

    const a = agentById(id);
    const mappar = jobbFor(id).sort((x, y) => (y.status === "levererad") - (x.status === "levererad") || y.updatedAt - x.updatedAt);
    const godkanda = jobben().filter((j) => j.agentId === id && j.status === "godkand");
    V.jobbId = jobbId === undefined || jobbId === null ? (opts.samtal ? null : (mappar.find((j) => j.status === "levererad") || {}).id || null) : jobbId;
    const inn = q("#vn-innehall");
    const roll = id === team.entryAgent ? "VD-assistent · ditt närmaste stöd" : (a.tagline || a.role || "Specialist");
    let h = `<div class="vn-rumhuvud"><img class="vn-portratt" src="${esc(bildFor(a))}" alt=""><div><div class="vn-etikett">${esc(roll)}</div><h1>${esc(id === team.entryAgent ? kontorFor(a) : a.name)}</h1><p>${esc(a.job || a.tagline || "")}</p></div></div>`;
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
    if (V.jobbId) { const j = jobben().find((x) => x.id === V.jobbId); if (j) return jobbYta(j); }
    samtalYta(id);
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
      if (!(V.vy === "rum" && V.rum === id && !V.jobbId)) visaRum(id, null, { samtal: true });
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
