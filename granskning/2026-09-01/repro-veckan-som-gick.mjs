// Reproducerar RE1: "Veckan som gick" utlöses vid veckans FÖRSTA öppning, och
// läser då en rutinlogg som routLoad() just nollställt — alltså alltid tom.
// Kör den riktiga koden ur portal/app.js, inte en kopia.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../../portal/app.js', import.meta.url), 'utf8');

// Plocka ut de tre funktionerna verbatim ur källan.
const ut = (namn) => {
  const i = src.indexOf(`function ${namn}(`);
  if (i < 0) throw new Error(`hittar inte ${namn}`);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1);
  }
};
const kalla = [ut('isoWeek'), ut('routLoad'), ut('sparadTid')].join('\n\n');

const lager = {};
const localStorage = {
  getItem: (k) => (k in lager ? lager[k] : null),
  setItem: (k, v) => { lager[k] = String(v); },
};
const state = { slug: 'demo' };
const fabrik = new Function('localStorage', 'state', kalla + '\nreturn { isoWeek, routLoad, sparadTid };');
const { isoWeek, routLoad, sparadTid } = fabrik(localStorage, state);

const rutiner = [
  { label: 'Veckans kundbrev', timeEstimate: 45 },
  { label: 'Fakturagenomgång', timeEstimate: 60 },
  { label: 'Uppföljning offerter', timeEstimate: 30 },
];

// Förra veckan: kunden bockade av alla tre. Så här ser posten ut i localStorage.
const förraVeckan = isoWeek().replace(/W(\d+)$/, (_, n) => 'W' + (+n - 1));
lager['atb_rout_demo'] = JSON.stringify({
  week: förraVeckan,
  done: rutiner.map((r) => ({ label: r.label, at: Date.now() - 3 * 86400000 })),
});

console.log('Sparad rutinlogg i webbläsaren :', lager['atb_rout_demo']);
console.log('Innevarande ISO-vecka          :', isoWeek());
console.log('');

// Måndag morgon, nya veckans första öppning. pulseNewWeek blir true här
// (lastVisit !== isoWeek()), och kortet "Ny vecka" anropar weekReview().
const klaraR = routLoad().done;                       // exakt raden i weekReview()
const tid = sparadTid(rutiner, klaraR);

console.log('weekReview() läser routLoad().done →', JSON.stringify(klaraR));
console.log('Avklarade rutiner i underlaget    :', klaraR.length, 'st');
console.log('Sparad tid i underlaget           :', tid.minuter, 'minuter');
console.log('');
console.log('Vad kunden FAKTISKT gjorde förra veckan:',
  JSON.parse(lager['atb_rout_demo']).done.length, 'rutiner =',
  sparadTid(rutiner, JSON.parse(lager['atb_rout_demo']).done).minuter, 'minuter');
console.log('');
console.log(klaraR.length === 0
  ? 'REPRODUCERAT: återblicken över förra veckan rapporterar noll rutiner och noll sparad tid.'
  : 'Gick inte att reproducera.');
