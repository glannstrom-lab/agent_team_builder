/* ============================================================
   Agent Team Builder — delad avatar-tilldelning
   Ett porträtt per agent över ALLA webbytor (portal, builder,
   verticals, galleri). De 25 färdiga porträtten ligger i
   portal/avatars/avatar-01.png … avatar-25.png.

   Tilldelningen är deterministisk och STABIL:
   • Samma företagsnamn ger samma uppsättning faces varje gång
     (seedad Fisher–Yates på namnet — ingen Math.random).
   • Tilldelningen sker i KANONISK ordning (VD-assistent, VD, sedan
     specialister), inte i DOM-/listordning, så samma agent får samma
     avatar oavsett vilken yta som renderar teamet.

   Varje yta lagrar bara avatar-NUMRET (1..25) på agenten (`avatarN`)
   och bygger själv sökvägen med rätt bas-prefix via src(), eftersom
   PNG:erna ligger under portal/ men refereras från olika kataloger:
     portal/    → "avatars/"
     builder/   → "../portal/avatars/"
     verticals/ → "../portal/avatars/"
     site/      → "../portal/avatars/"
   ============================================================ */
(function (g) {
  const COUNT = 25;

  function hashStr(s) {
    s = String(s == null ? "" : s);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // Liten seedad PRNG (mulberry32) — deterministisk.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Seedad permutation av [1..25] för ett givet företagsnamn.
  function pool(seed) {
    const p = Array.from({ length: COUNT }, (_, i) => i + 1);
    const rnd = mulberry32(hashStr(seed));
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
  }
  // Bygg sökväg till ett porträtt. base = katalog-prefix (t.ex. "avatars/").
  function src(n, base) {
    return (base || "") + "avatar-" + String(n).padStart(2, "0") + ".png";
  }
  // Kanonisk rang: VD-assistent först, VD näst, specialister sist (i listordning).
  function rank(a) {
    if (a && a.id === "vd-assistent") return 0;
    if (a && a.id === "vd") return 1;
    return 2;
  }
  // Sätter agent.avatarN (1..25) på varje agent som saknar både avatarN och
  // ett uttryckligt avatar-fält. Muterar och returnerar team-objektet.
  function assign(team) {
    if (!team || !Array.isArray(team.agents)) return team;
    const seed = team.company || team.slug || "team";
    const p = pool(seed);
    const order = team.agents
      .map((a, i) => ({ a, i }))
      .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i);
    order.forEach((entry, k) => {
      const a = entry.a;
      if (a.avatarN == null && !a.avatar) a.avatarN = p[k % COUNT];
    });
    return team;
  }

  g.ATBAvatars = { COUNT, hashStr, pool, src, rank, assign };
})(typeof window !== "undefined" ? window : this);
