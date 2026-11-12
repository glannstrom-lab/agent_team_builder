// U12: iOS Safari zoomar in när ett fält har text under 16 px. Varje CSS-fil som
// sätter en mindre storlek på ett fält måste ha en pekskärmsregel som höjer
// ALLA fält till minst 16 px — utan att röra datorns storlek.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const FILER = ['portal/portal.css', 'portal/vaningen.css', 'builder/builder.css', 'site/showcase.css'];
const FALT = /(^|[\s,>+~(])(input|textarea|select)\b|\.(setup-field|fin|ovl-ta|ovl-input|composer-input|model-select)\b|\bselect\./;

// Delar CSS:en i [väljare, kropp]-par, platt (media-block packas upp).
function regler(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const ut = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) ut.push([m[1].trim(), m[2]]);
  return ut;
}

function underSexton(kropp) {
  const m = /(?:^|;|\s)font-size:\s*([\d.]+)px/.exec(kropp);
  return m && parseFloat(m[1]) < 16;
}

test('fältregler under 16 px täcks av en pekskärmsregel som sätter minst 16 px', () => {
  for (const fil of FILER) {
    let css;
    try { css = readFileSync(fil, 'utf8'); } catch { continue; }
    const smala = regler(css).filter(([v, k]) => FALT.test(v) && underSexton(k));
    if (!smala.length) continue;
    const block = [...css.matchAll(/@media[^{]*\(hover:\s*none\)[^{]*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)].map(m => m[1]);
    const tacker = block.some(b => regler(b).some(([v, k]) => {
      const m = /font-size:\s*(?:max\(\s*)?([\d.]+)px/.exec(k);
      return m && parseFloat(m[1]) >= 16 && /\binput\b/.test(v) && /\btextarea\b/.test(v) && /\bselect\b/.test(v);
    }));
    assert.ok(tacker, `${fil}: fält under 16 px (${smala.map(s => s[0]).join(' ; ')}) men ingen (hover: none)-regel för input, textarea, select som sätter minst 16px`);
  }
});

test('portalens och byggarens CSS har pekskärmsregeln', () => {
  for (const fil of ['portal/portal.css', 'builder/builder.css']) {
    assert.match(readFileSync(fil, 'utf8'), /\(hover:\s*none\)/, `${fil} saknar (hover: none)-regeln`);
  }
});
