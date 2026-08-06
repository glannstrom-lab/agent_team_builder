/* ============================================================
   Vertikaler — renderar branschkatalog (grid) och en
   landningssida per bransch (?v=<slug>) från window.VERTICALS.
   Statiskt, ingen nyckel, delar designsystem med galleriet.
   ============================================================ */

const esc = (s) => (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const getV = () => new URLSearchParams(location.search).get("v");

// PNG:erna ligger i portal/avatars/ — refereras härifrån med detta prefix.
const AVATAR_BASE = "../portal/avatars/";
// Stabil avatar-nummer-serie för en bransch (seedat på branschnamnet) — samma
// serie används både för korten här och för demo-utkastet, så faces matchar.
const avatarPool = (name) => (window.ATBAvatars ? window.ATBAvatars.pool(name) : []);
const avatarSrcN = (n) => (window.ATBAvatars ? window.ATBAvatars.src(n, AVATAR_BASE) : "");
const VERTS = window.VERTICALS || [];
const bySlug = (slug) => VERTS.find((v) => v.slug === slug);

function nav() {
  return `<div class="hubnav"><div class="inner">
    <a class="home" href="../"><span class="dot"></span> Mitt AI-team</a>
    <a class="np" href="./">Branscher</a>
    <a class="np" href="../site/">Exempel</a>
    <a class="np" href="../portal/">Logga in</a>
    <a class="nav-cta" href="../index.html#priser">Priser</a>
  </div></div>`;
}

// ---------- grid (alla branscher) ----------
function renderGrid() {
  const cards = VERTS.map((v, i) => `
    <a class="gcard reveal${i % 3 === 1 ? " d1" : i % 3 === 2 ? " d2" : ""}" href="?v=${esc(v.slug)}">
      <div class="gtop"><div class="gicon">${esc(v.icon)}</div><div><h3>${esc(v.name)}</h3><div class="gsub">${esc(v.tagline)}</div></div></div>
      <div class="gdesc">${esc(v.intro)}</div>
      <div class="gmeta"><span class="gtag mode">Live-demo</span><span class="gtag">${v.agents.length} agenter</span></div>
      <div class="go">Se teamet →</div>
    </a>`).join("");

  document.getElementById("root").innerHTML = `
    ${nav()}
    <section class="hero" style="min-height:auto;padding-top:80px;padding-bottom:40px;">
      <div class="wrap">
        <div class="badge"><span class="dot"></span> För din bransch</div>
        <h1>Ett AI-team byggt för<br /><span class="grad">just er bransch</span></h1>
        <p class="sub">Varje verksamhet har sin egen vecka. Välj er bransch och se hur ett skräddarsytt team skulle se ut — vilka agenter, vilka jobb, var tiden vinns.</p>
      </div>
    </section>
    <section style="padding-top:0;">
      <div class="wrap"><div class="gallery">${cards}</div>
      <p style="color:var(--text-dim);font-size:14px;margin-top:36px;text-align:center;">Hittar ni inte er bransch? Det gör inget — metoden utgår alltid från er specifika vecka. <a href="../index.html#kontakt" style="color:var(--accent-2);">Hör av er</a> så tittar vi tillsammans.</p>
      </div>
    </section>
    ${footer()}`;
  observeReveal();
}

// ---------- single (en bransch) ----------
function renderSingle(v) {
  const pains = v.pains.map((p) => `
    <div class="moment reveal"><div class="mtxt"><div class="mname">${esc(p)}</div></div><span class="fit high">Passar AI</span></div>`).join("");

  const pool = avatarPool(v.name);
  const iconHtml = (a, i) => {
    const n = pool[i % (pool.length || 1)];
    return n
      ? `<div class="icon has-img"><img class="ava-img" src="${esc(avatarSrcN(n))}" alt="" loading="lazy" decoding="async" /></div>`
      : `<div class="icon">${esc(a.icon)}</div>`;
  };
  const agents = v.agents.map((a, i) => `
    <div class="card reveal${i === 0 ? " is-cos" : ""}">
      <div class="card-top">${iconHtml(a, i)}<div><h3>${esc(a.name)}</h3>
      <span class="tag ${i === 0 ? "always" : "special"}">${i === 0 ? "Alltid närvarande" : "Specialist"}</span></div></div>
      <p class="job">${esc(a.role)}</p>
    </div>`).join("");

  const primary = v.demoTeam
    ? `<a class="btn-lg btn-primary-lg" href="../portal/?team=${esc(v.demoTeam)}&demo=1">Prova teamet live →</a>`
    : `<a class="btn-lg btn-primary-lg js-demo" href="#" role="button">Prova teamet live →</a>`;

  document.getElementById("root").innerHTML = `
    ${nav()}
    <section class="hero" style="min-height:auto;padding-top:80px;padding-bottom:50px;">
      <div class="wrap">
        <a class="backline" href="./">← Alla branscher</a>
        <div class="badge"><span class="dot"></span> ${esc(v.icon)} ${esc(v.name)}</div>
        <h1><span class="grad">${esc(v.tagline)}</span></h1>
        <p class="sub">${esc(v.intro)}</p>
        <div class="cta-row">${primary}<a class="btn-lg btn-ghost" href="../index.html#priser">Se priser</a></div>
        <p class="sub" style="margin-top:12px;font-size:14px;">Teamet kör på er egen AI-nyckel — <a href="../index.html#forbrukning" style="color:var(--accent-2)">normalt 2–4 kr i månaden, och så skaffar ni nyckeln på fem minuter</a>.</p>
      </div>
    </section>

    <section style="padding-top:10px;">
      <div class="wrap">
        <div class="section-head"><div class="eyebrow"><span class="dot"></span> Veckan idag</div>
        <h2 class="section-title">Det som äter er tid</h2></div>
        <div class="moments">${pains}</div>
      </div>
    </section>

    <section style="padding-top:10px;">
      <div class="wrap">
        <div class="section-head"><div class="eyebrow"><span class="dot"></span> Förslag på team</div>
        <h2 class="section-title">Ett team som tar det</h2>
        <p class="section-lead">Ett exempel — ert riktiga team byggs utifrån just er vecka, så det kan se annorlunda ut.</p>
        ${v.sizeNote ? `<p class="section-lead" style="color:var(--text-dim);font-size:14.5px;">${esc(v.sizeNote)}</p>` : ""}</div>
        <div class="cards">${agents}</div>
      </div>
    </section>

    <section style="padding-top:10px;">
      <div class="wrap narrow">
        <div class="decision reveal">
          <div class="meta-label">Ett konkret första steg</div>
          <div class="big">${esc(v.firstTask)}</div>
          <div class="cta-row" style="margin-top:24px;">${primary}<a class="btn-lg btn-ghost" href="../index.html#kontakt">Boka ett samtal →</a></div>
        </div>
      </div>
    </section>
    ${footer()}`;
  if (!v.demoTeam) {
    document.querySelectorAll(".js-demo").forEach((b) =>
      b.addEventListener("click", (e) => { e.preventDefault(); openDraftDemo(v); })
    );
  }
  observeReveal();
}

// Bygger ett lättviktigt demo-team från branschens exempelagenter och öppnar
// portalen i demoläge (__vertical + ?demo=1) — live-demo utan nyckel, för varje bransch.
// Egen localStorage-nyckel (inte atb_draft_team) så en branschdemo aldrig
// skriver över ett team som byggts live i Buildern.
function openDraftDemo(v) {
  const pool = avatarPool(v.name);
  const agents = v.agents.map((a, i) => ({
    id: "agent-" + i,
    name: a.name,
    icon: a.icon,
    avatarN: pool.length ? pool[i % pool.length] : undefined,
    role: i === 0 ? "Arbetspartner" : "Specialist",
    tagline: a.role,
    always: i === 0,
    // Riktig systemprompt — kopplar användaren in sin nyckel efter demon ska
    // agenten svara i sin roll, inte som en tom generisk chatt.
    system: agentSystem(v, a, i),
  }));
  const team = {
    company: v.name,
    tagline: v.tagline,
    language: "sv",
    // Ingen defaultModel: modellen är låst i atb-claude.js sedan 2026-08-05 och
    // fältet lästes bort ur portalen. Ett värde här hade bara varit en osann
    // uppgift i en fil som är gjord för att läsas.
    entryAgent: agents[0].id,
    agents,
  };
  try { localStorage.setItem("atb_vertical_demo_team", JSON.stringify(team)); } catch (_) {}
  window.open("../portal/?team=__vertical&demo=1", "_blank");
}

// Systemprompt för en demo-agent, byggd av branschdatat. Exempelteamet är
// generiskt (inte kundanpassat), så prompten säger det ärligt och ber om
// konkret kontext istället för att låtsas veta.
function agentSystem(v, a, i) {
  const colleagues = v.agents.filter((x) => x !== a).map((x) => `- ${x.name}: ${x.role}`).join("\n");
  return [
    i === 0
      ? `Du är ${a.name}, VD-assistent och primär arbetspartner i ett AI-team för ett företag i branschen ${v.name.toLowerCase()}.`
      : `Du är ${a.name}, specialist i ett AI-team för ett företag i branschen ${v.name.toLowerCase()}.`,
    ``,
    `DITT JOBB: ${a.role}`,
    ``,
    `Vanliga tidstjuvar i branschen som teamet finns för att ta:`,
    v.pains.map((p) => `- ${p}`).join("\n"),
    ``,
    i === 0 ? `DITT TEAM (hänvisa rätt när en fråga hör hemma hos en kollega):\n${colleagues}\n` : null,
    `ARBETSSÄTT: Det här är ett exempel-team för branschen — det är inte anpassat till användarens specifika företag än. Be om konkreta underlag och kontext (företagets namn, hur deras vecka ser ut, exempel på dokument) istället för att gissa. Leverera utkast användaren bara behöver granska.`,
    `VIKTIGT: Slutbeslut, juridik och allt som skickas till kund ligger alltid hos människan.`,
    `Svara på svenska.`,
  ].filter((x) => x !== null).join("\n");
}

function footer() {
  return `<footer><div class="wrap">
    <div class="built"><span class="dot"></span> Mitt AI-team</div>
    <div class="fstats">Skräddarsydda AI-team för små och medelstora företag.</div>
  </div></footer>`;
}

function observeReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

// ---------- boot ----------
function boot() {
  document.documentElement.classList.add("js");
  const slug = getV();
  const v = slug ? bySlug(slug) : null;
  if (slug && v) renderSingle(v);
  else renderGrid();
}
boot();
