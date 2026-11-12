// Bygger översikten för utveckla-projektet omgång 1 (2026-11-12) ovanpå den
// publicerade sidan. Tidigare rundor (2026-10-26, 2026-09-01) står kvar orörda
// under. Kör från repo-roten:
//   node granskning/2026-11-12/bygg.mjs <publicerad-version.html>
// Skriver granskning/2026-11-12/oversikt.html. Node och inte Python: Python i
// textläge på Windows skriver CRLF.
import { readFileSync, writeFileSync } from "node:fs";

const KÄLLA = process.argv[2];
const UT = "granskning/2026-11-12/oversikt.html";
const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const k = (s) => String(s).split("`").map((d, i) => (i % 2 ? `<code>${e(d)}</code>` : e(d))).join("");

// [id, rubrik, vad som hände / varför, vad som gjordes eller ska göras, plats, utfall]
// utfall: bekr (bekräftad av test eller blind expert), ejpr (byggd, ej prövad av expert),
// ved (vederlagd), oppen (nästa omgång), fraga (väntar på Mikael)
const P = [
  ["U1", "Enter på slutkortet startade om hela intervjufilmen", "Två experter, oberoende av varandra, svarade på måndagsfrågan, tryckte Enter där kortet sa “klicka för att fortsätta” och hamnade i filmens början. Sex minuter förlorade. Fokus låg på “Spela igen”.", "Fokus ligger på “Fortsätt intervjun”, och film-tangenten släpper igenom Enter på en länk. Riktigt klick: Enter tar kunden till Buildern. Källtest som fäller den gamla raden.", "index.html:653", "ejpr"],
  ["U2", "“Hoppa till samtalet” hoppade bara till “Ring upp”", "Kunden fick ändå ringa upp, klicka mikrofonen och vänta genom sex repliker.", "Hoppet landar vid måndagsfrågan med svarsrutan framme. Riktigt klick: frågan syns direkt. Ingen expert tryckte på knappen i slutprovet.", "index.html", "ejpr"],
  ["U3", "Startsidan sa inte vad tjänsten gör", "“Jag förstår inte vad det här är. Jag ska anställa en AI-figur och vet inte vad jag får.” (målaren, 30 s)", "En mening under rubriken: offerter, kundmejl, det som ska in, gratis att bygga. Slutprovet vid 30 s: “det står gratis att bygga och offerter och kundmejl, alltså mitt ärende.”", "index.html:246", "bekr"],
  ["U4", "Intervjun sa “sista” före sista frågan", "“En sista sak” följdes av fler frågor, och räknaren syntes sällan. Enter i svarsrutan skickade inte.", "Räknaren “Fråga N av högst 12” vid varje fråga, ordet “sista” bara på den tolfte, Enter skickar. Tre tester. Slutprovets expert nämnde varken räknare eller “sista”.", "builder/builder.js · functions/api/_build.js", "ejpr"],
  ["U5", "Intervjun raderades innan första steget sparats", "Fallerade researchsteget eller laddade kunden om var upp till tolv svar borta.", "Körningen sparas när bygget startar, intervjun raderas först när teamet finns. Tre tester.", "builder/builder.js", "bekr"],
  ["U6", "Formulärets text försvann vid fel, avbrott och F5", "Det kunden skrivit om sin vecka fanns bara i minnet.", "Utkast i localStorage, rensas när teamet är klart. Två tester.", "builder/builder.js", "bekr"],
  ["U7", "“Bygg ett till” kastade ett obetalt team utan att fråga", "Ett felklick på den sekundära knappraden, och en kvarts arbete var borta.", "En bekräftelsefråga när teamet inte är köpt. Två tester.", "builder/builder.js", "bekr"],
  ["U8", "SK3 hade ett hål: “Utöka teamet” fick plattformens minnesrader omärkta", "Rättelsen samma dag märkte Claudes rader i agenternas instruktion, men vägen som skriver en ny agents grundinstruktion skickade hela minnet.", "“Utöka teamet” får bara kundens egna rader; minnesförslagen ser plattformens som ogranskade. Två tester.", "portal/app.js", "bekr"],
  ["U9", "Att slå av och på ett underlag gjorde Claudes underlag “granskat”", "Märkningen försvann utan att kunden läst innehållet.", "Källan står kvar tills titel eller text ändras. Test mot riktig SQLite.", "functions/api/_firma.js", "bekr"],
  ["U10", "Kopplingen godtog en delsträng som företag vid skrivning", "Med “Bygg AB” och “Byggservice” hamnade minnet i det första.", "En delsträng som passar flera team avvisas med valen listade. Test.", "functions/mcp.js", "bekr"],
  ["U11", "Klienten väntade sju sekunder på spärrar som inte går över", "Månadstaket, byggets dygnstak och tom kredit provades om två gånger innan kunden fick beskedet.", "Permanenta felkoder ger beskedet direkt; tillfälliga provas om som förut. Två tester.", "atb-claude.js", "bekr"],
  ["U12", "iOS zoomade in när kunden tryckte i en textruta", "Fält under 16 px i portalen och Buildern.", "Minst 16 px på pekskärm, oförändrat på dator. Uppmätt i iPhone-emulering; test.", "portal/portal.css · builder/builder.css", "bekr"],
  ["U13", "Ändringar före första lyckade synk tappades tyst", "På dåligt nät vid laddning försvann det kunden skrev vid nästa omladdning.", "Köas även före synken, varning när första hämtningen fallerar, tre försök. Fyra tester.", "portal/app.js", "bekr"],
  ["U15", "Agenterna visste inte dagens datum", "Redovisningskonsulten frågade en förfallodag när kvartalsmomsen ska in; svaret talade om “augusti-kvartalet”.", "Dagens datum och de närmaste myndighetsdatumen ur årshjulet i varje instruktion. Slutprovet: “I dag, torsdag 12 november 2026 — sista dagen för momsdeklarationen för kvartal 3.”", "portal/app.js", "bekr"],
  ["U16", "“Kontrollera mot källan” var osynlig", "Agenten bad kunden trycka på knappen under svaret, men knappraden hade opacitet 0 utom vid hovring.", "Knapparna syns dämpade utan hovring. Slutprovets expert hittade och tryckte på den, men utan agentens uppmaning.", "portal/portal.css:777", "ejpr"],
  ["U18", "Varje inloggad kund fick ett konsolfel vid laddning", "Portalen prövade `teams/<slug>.js` för moln-team och fick HTML tillbaka.", "Skriptet prövas bara för inbyggda team. Riktigt klick: inget fel.", "portal/app.js", "bekr"],
  ["U14", "Ny: spara en godkänd leverans som mall", "Målaren utgår i dag från förra offerten i Word.", "Byggd: knappen i Våningens jobbkort och “Utgå från mall” i Nytt jobb. Vederlagd i slutprovet: webbyråägaren godkände först och letade sedan i arkivlistan och i Nytt jobb, där ingen mall fanns. Nästa: erbjud “utgå från ett godkänt jobb” direkt i Nytt jobb och i arkivet.", "portal/vaningen.js · portal/app.js", "ved"],
  ["U17", "Presentkortsmomsen besvarades fel", "Teamet sa “momsen redovisas när kortet löses in, inte när du säljer det”. För ett salongskort där momssatsen är känd vid försäljningen gäller motsatsen. Kontrollerat mot Skatteverket: “Du ska därför ta ut moms vid försäljningen” (enfunktionsvoucher); “Du ska inte ta ut någon moms när du säljer en flerfunktionsvoucher.”", "Inte byggt: en regel i faktabasen är skatteråd och ditt beslut. Texten är färdig att lägga in.", "portal/fakta-se.js · functions/api/_fakta.js", "fraga"],
  ["U19", "Teamet ser inte sina egna godkända jobb", "“Jag har ingen offert till Bageriet Korn” — fast den låg godkänd i arkivet. Teamloggen läser bara chatten.", "Lägg de senaste godkända leveranserna (rubrik, kund, datum) i instruktionen.", "portal/app.js (teamLogg)", "oppen"],
  ["U20", "Byggets fackspråk strömmas till kunden", "“Körningsmetadata”, “Hypoteser: 0”, “Nejen syns i texten” — “på ett språk jag inte talar”.", "En begriplig rad per steg i stället för rådokumentet.", "builder/builder.js · prompts/shared/research.md:282", "oppen"],
  ["U21", "Måndagsfrågan skärs av videorutans kant", "Ram 043: texten ligger över kanten bakom samtalsknapparna.", "Repliken under rutan.", "index.html", "oppen"],
  ["U22", "“Gör det här i chatten” fyller i men skickar inte", "Kunden fick klicka en gång till.", "Skicka direkt.", "portal/app.js:5773", "oppen"],
];
const BRICKA = { bekr: ["fixat", "Bekräftad"], ejpr: ["", "Byggd · ej prövad"], ved: ["repro", "Vederlagd"], oppen: ["matt", "Nästa omgång"], fraga: ["repro", "Din fråga"] };
const post = ([id, rub, varför, gjort, plats, ut]) => {
  const [kl, txt] = BRICKA[ut];
  const fixad = ut === "bekr" ? " fixad" : "";
  const nivå = ut === "oppen" || ut === "fraga" || ut === "ved" ? "avvikelse" : "anmarkning";
  return `<article class="post ${nivå}${fixad}" id="${id}">
  <div class="post-huvud"><span class="id">${id}</span><h3>${k(rub)}</h3><span class="bricka ${kl}">${txt}</span></div>
  <p>${k(varför)}</p>
  <div class="${ut === "bekr" || ut === "ejpr" || ut === "ved" ? "gjort" : "fix"}"><b>${ut === "oppen" || ut === "fraga" ? "Fix" : "Gjort"}</b>${k(gjort)}</div>
  <div class="fot"><span class="plats">${e(plats)}</span></div>
</article>`;
};
const grupp = (stämpel, kl, rubrik, under, filter) => {
  const poster = P.filter((p) => filter.includes(p[5]));
  return `<section><div class="wrap narrow">
    <div class="grad g-${kl}"><span class="stampel">${stämpel}</span><span class="rakning">${poster.length} poster</span></div>
    <h2>${rubrik}</h2><p class="undertext">${under}</p>
    ${poster.map(post).join("\n")}
  </div></section>`;
};

const FRÅGOR = [
  ["U17 · presentkortsmomsen", "Ska regeln om enfunktions- och flerfunktionsvoucher in i faktabasen? Texten och källan är färdiga. Rekommendation: ja, det är ett sakfel i ett av de tre benen."],
  ["Faktabasens instruktion", "Modellen hittade på i stället för att säga att den var osäker, trots instruktionen. Ska den skärpas (t.ex. “beror det på omständigheter: börja med ‘det beror på’”)? Rekommendation: ja, tillsammans med U17."],
  ["Utläggning", "Inget är utlagt — projektet har konton och betalning, så omgången byggdes på grenen `utveckla/2026-11-12` (taggen `omgang-1`) och prövades mot lokal emulator. Rekommendation: kör `driftsatt` från grenen när du läst igenom."],
  ["Avbruten betalning", "Den som ångrar sig i Stripe landar på ett till synes tomt formulär (`cancel_url` i `functions/api/checkout.js`). Betalflödet är ditt område. Rekommendation: `/builder/?tillbaka=1` som visar teamet igen."],
  ["Byggets IP-tak", "24 anrop per kvart och IP kan slå mitt i ett bygge när två delar uppkoppling. Det är kassaskyddet. Rekommendation: mät ett riktigt bygges antal anrop först."],
  ["Konkurrensen", "Anthropic har “Claude for Small Business”: färdiga arbetsflöden (måndagsbrief, offerter ur röstmemo) inne i Claude — men utan svenska och svenska regler. Ditt försvar är de tre benen. Vill du att nästa omgång lutar mot svenska regler (U17, SR6)?"],
  ["Nya vinklar (ur researchen, inte byggda)", "ROT/moms-checklista för hantverkare · fast pris som säljargument mot kreditmodellerna · redovisningsbyråer som återförsäljare · egen öppen mätning av AI i mikroföretag. Varje rör pengar eller målgrupp och är ditt beslut."],
  ["Holdouten", "Startsidan ändrades (U1–U3) och det är holdoutens område, så hennes slutsession hoppades över enligt reglerna. Hennes baslinje ligger förseglad i `playtests/holdout/baslinje.md`."],
];

const ny = `
<header class="top">
  <div class="wrap">
    <div class="eyebrow">Utveckla projektet · omgång 1 · 12 november 2026</div>
    <h1>Personalliggaren</h1>
    <p class="lede">Fyra blinda experter ur målgruppen använde tjänsten på riktigt mot en lokal kopia: en B&amp;B-värd, en målare, en redovisningskonsult och en webbyråägare. Målaren kom i första försöket aldrig förbi intervjun; <strong>efter omgången byggde hon ett team</strong>. Arton poster byggdes, tolv är bekräftade, en vederlades. <strong>Inget är utlagt</strong> — det väntar på dig.</p>
    <table class="liggare">
      <caption>Mätt 12 november 2026, grenen <code>utveckla/2026-11-12</code></caption>
      <tbody>
        <tr><td class="tal">575</td><td><span class="vad">gröna tester</span><br><span class="bas">542 före omgången; varje nytt test fäller den gamla koden</span></td></tr>
        <tr><td class="tal">12 / 18</td><td><span class="vad">byggda poster bekräftade</span><br><span class="bas">10 av test som är hela kriteriet, 2 av blind expert · 4 ej prövade · 1 vederlagd</span></td></tr>
        <tr><td class="tal">+909 / −37</td><td><span class="vad">rader över 20 filer</span><br><span class="bas">radsluten kontrollerade mot baslinjen, ingen ändring</span></td></tr>
        <tr><td class="tal">5</td><td><span class="vad">blinda sessioner</span><br><span class="bas">holdout på baslinjen, tre i omgången, två i slutprovet; svag blindhet (projektets instruktioner nådde agenterna)</span></td></tr>
        <tr><td class="tal">0</td><td><span class="vad">ElevenLabs-bilder</span><br><span class="bas">ingen post behövde en bild</span></td></tr>
      </tbody>
    </table>
  </div>
</header>

<section>
  <div class="wrap narrow">
    <h2>Vad experterna gjorde</h2>
    <p class="undertext">Kontrollpunkterna förseglas när de nås: <em>på väg · tvekar · ger upp</em>.</p>
    <table class="avfardat"><tbody>
      <tr><td class="pastaende"><b>Lena, målare · före</b><br>tvekar · tvekar · på väg · tvekar</td><td class="utfall">Enter på slutkortet startade om filmen två gånger. Tio intervjufrågor på 22 minuter, inget team. “Han hade gett upp vid filmen.”</td></tr>
      <tr><td class="pastaende"><b>Maria, redovisningskonsult · före</b><br>på väg · på väg · tvekar</td><td class="utfall">Momssatserna rätt, presentkortet grovt fel, kvartalet “augusti”. “Jag gissar inte” om personalfesten var hennes bästa ögonblick.</td></tr>
      <tr><td class="pastaende"><b>Lena, målare · efter</b><br>på väg · på väg · tvekar · på väg</td><td class="utfall">Byggde Holms Måleris team på 24 minuter: fyra agenter, fem rutiner, fem förslag som fick nej. Saknade ett färdigt exempel och förstod inte byggstegets fackspråk.</td></tr>
      <tr><td class="pastaende"><b>Johan, webbyrå · efter</b><br>tvekar · tvekar · tvekar</td><td class="utfall">Kvartalsmomsen “i dag, 12 november” var hans bästa ögonblick. Hittade ingen mall och teamet mindes inte sin egen godkända offert. Två av hans klagomål kom från testets uppsättning och är strukna.</td></tr>
    </tbody></table>
    <div class="runda"><b>Samma dag: SK3</b>Det kundens egen Claude eller ChatGPT sparar står nu i agenternas instruktion som uppgifter, aldrig som order, med källan utskriven. Kunden godkänner raderna under Minne &amp; underlag. U8 och U9 täppte två hål i samma rättelse.</div>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <h2>Börja här</h2>
    <ol class="borja">
      <li><div><span class="kod">U17</span> <b>Svara på presentkortsfrågan</b><p>Ett sakfel i ett av de tre benen, kontrollerat mot Skatteverket, med färdig text.</p></div></li>
      <li><div><span class="kod">U19</span> <b>Låt teamet se sina godkända jobb</b><p>Utan det går det inte att be om “som förra gången” — och det är det som slår den tomma chattrutan.</p></div></li>
      <li><div><span class="kod">driftsatt</span> <b>Lägg ut omgången</b><p>575 gröna, klickat igenom på riktigt. Två blockerare för nya kunder (U1, U5) ligger och väntar på grenen.</p></div></li>
    </ol>
  </div>
</section>

${grupp("Bekräftad", "anmarkning", "Byggt och bekräftat", "Av ett test som är hela kriteriet, eller av en blind expert i slutprovet.", ["bekr"])}
${grupp("Ej prövad", "anmarkning", "Byggt, men ingen expert hamnade där", "Klickat igenom på riktigt av orkestreraren; domen väntar på en blind expert.", ["ejpr"])}
${grupp("Vederlagd", "avvikelse", "Byggt, och det höll inte", "", ["ved"])}
${grupp("Nästa", "avvikelse", "Hittat i slutprovet, och din fråga", "Verifierade i koden eller i expertens bilder.", ["oppen", "fraga"])}

<section>
  <div class="wrap narrow">
    <h2>Frågor till dig</h2>
    <p class="undertext">Valet som gjordes tills vidare står i varje rad. Inget av detta är byggt.</p>
    <table class="avfardat"><tbody>
      ${FRÅGOR.map(([a, b]) => `<tr><td class="pastaende"><b>${k(a)}</b></td><td class="utfall">${k(b)}</td></tr>`).join("\n")}
    </tbody></table>
    <p class="fotnot">Reskontran: <code>playtests/ledger.json</code>. Arbetslistan med samma ID:n: <code>ROADMAP.md</code>, avsnittet “Utveckla-projektet omgång 1”. Research med källor: <code>playtests/research/omg1.md</code>.</p>
  </div>
</section>

<div class="forra-skylt" id="runda-2026-10-26">
  <div class="wrap narrow">
    <h2>Genomgången 26 oktober 2026</h2>
    <p>Står kvar oförändrad nedan. SK3 är gjord 12 november (se ovan).</p>
  </div>
</div>
`;

let s = readFileSync(KÄLLA, "utf8");
const i = s.indexOf("<title>Personalliggaren</title>");
if (i < 0) throw new Error("hittade inte titeln");
s = s.slice(i);
// Mobil: tabellerna med två spalter staplas, och långa kodord (sökvägar,
// grennamn) får brytas — annars var sidan 465 px bred vid 390 (426 redan
// i rundan 26 oktober).
const NY_CSS = `
code{overflow-wrap:anywhere}
@media (max-width:600px){.avfardat tr,.avfardat td{display:block;width:auto}.avfardat td.utfall{padding-top:0}}
`;
const st = s.indexOf("</style>");
s = s.slice(0, st) + NY_CSS + s.slice(st);
const j = s.indexOf("</style>") + "</style>".length;
const gammal = s.slice(j).replace("<h1>Personalliggaren</h1>", '<h2 style="font-size:clamp(30px,4.4vw,44px);margin-bottom:16px">Personalliggaren · 26 oktober</h2>');
s = s.slice(0, j) + ny + gammal;
writeFileSync(UT, s);
console.log(`${UT}: ${Buffer.byteLength(s)} byte, ${P.length} poster`);
