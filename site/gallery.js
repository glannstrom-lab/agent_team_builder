/* ============================================================
   Galleriets avatar-injektion (statiska showcase-sidor)
   Showcase-sidorna är handskriven HTML med emoji i .card .icon och
   .org .node. Detta script byter ut emojin mot porträtt ur
   portal/avatars/ — deterministiskt seedat på sidans företag
   (body[data-team]) och i kanonisk ordning (VD-assistent, VD,
   specialister), så att galleriet och portalen visar samma faces.
   Faller tyst tillbaka till emoji om något saknas.
   ============================================================ */
(function () {
  if (!window.ATBAvatars) return;
  const BASE = "../portal/avatars/";
  const seed = (document.body && document.body.dataset.team) || document.title || "team";
  const pool = window.ATBAvatars.pool(seed);
  if (!pool.length) return;
  let k = 0;
  const nextSrc = () => window.ATBAvatars.src(pool[(k++) % pool.length], BASE);

  // Kanonisk kort-ordning: VD-assistent (.is-cos), VD (.is-ceo), sedan
  // specialister i DOM-ordning — samma ordning som portalen tilldelar i.
  const cards = Array.from(document.querySelectorAll(".cards .card"));
  const cos = cards.filter((c) => c.classList.contains("is-cos"));
  const ceo = cards.filter((c) => c.classList.contains("is-ceo"));
  const spec = cards.filter((c) => !c.classList.contains("is-cos") && !c.classList.contains("is-ceo"));

  const cosSrcs = [], ceoSrcs = [], specSrcs = [];
  [...cos, ...ceo, ...spec].forEach((card) => {
    const src = nextSrc();
    setCardIcon(card, src);
    if (card.classList.contains("is-cos")) cosSrcs.push(src);
    else if (card.classList.contains("is-ceo")) ceoSrcs.push(src);
    else specSrcs.push(src);
  });

  // Spegla till org-noderna via roll-klass + ordning.
  applyNodes(".org .node.cos", cosSrcs);
  applyNodes(".org .node.ceo", ceoSrcs);
  applyNodes(".org .node.spec", specSrcs);

  function setCardIcon(card, src) {
    const icon = card.querySelector(".card-top .icon");
    if (!icon) return;
    const emoji = icon.textContent;
    icon.textContent = "";
    icon.classList.add("has-img");
    const img = mkImg("ava-img", src);
    img.onerror = () => { icon.classList.remove("has-img"); icon.textContent = emoji; };
    icon.appendChild(img);
  }

  function applyNodes(sel, srcs) {
    Array.from(document.querySelectorAll(sel)).forEach((node, i) => {
      const src = srcs[i] != null ? srcs[i] : (srcs.length ? srcs[srcs.length - 1] : nextSrc());
      const nm = node.querySelector(".nm");
      if (!nm) return;
      // Släng en ev. ledande emoji (men inte å/ä/ö eller vanliga bokstäver).
      const name = nm.textContent.replace(
        /^([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]️?)\s*/u,
        ""
      ).trim();
      nm.textContent = "";
      nm.appendChild(mkImg("ava-inline", src));
      nm.appendChild(document.createTextNode(name));
    });
  }

  function mkImg(cls, src) {
    const img = document.createElement("img");
    img.className = cls; img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    return img;
  }
})();
