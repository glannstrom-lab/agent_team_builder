// Splitsar in projektets egna woff2 som data-URI i /*TYPSNITT*/-markören.
import { readFileSync, writeFileSync } from 'node:fs';
const ROT = new URL("../../fonts/", import.meta.url);
const b64 = f => readFileSync(new URL(f, ROT)).toString('base64');
const face = (fam, fil, vikt, stil = 'normal') =>
`@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${b64(fil)}) format('woff2');font-weight:${vikt};font-style:${stil};font-display:swap;}`;
const css = [
  face('Archivo', 'archivo-var-latin.woff2', '100 900'),
  face('Karla', 'karla-var-latin.woff2', '200 800'),
  face('IBM Plex Mono', 'ibm-plex-mono-500-latin.woff2', '500'),
  face('IBM Plex Mono', 'ibm-plex-mono-400-latin.woff2', '400'),
].join('\n');
const mal = process.argv[2];
const html = readFileSync(mal, 'utf8');
if (!html.includes('/*TYPSNITT*/')) { console.error('Markören /*TYPSNITT*/ saknas i ' + mal); process.exit(1); }
writeFileSync(mal, html.replace('/*TYPSNITT*/', css));
console.log('Splitsade in ' + css.length + ' tecken typsnitt-CSS i ' + mal);
