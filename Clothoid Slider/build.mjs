// Inlines geometry.mjs into template.html so the widget is one standalone file
// that works from file:// (ES module imports are blocked there by CORS).
import { readFileSync, writeFileSync } from 'node:fs';

const geo = readFileSync('geometry.mjs', 'utf8').replace(/^export /gm, '');
const st = readFileSync('cam-st.mjs', 'utf8').replace(/^export /gm, '');
const cam = readFileSync('cam-table.json', 'utf8');   // produced by: node cam-emit.mjs
const tpl = readFileSync('template.html', 'utf8');
for (const m of ['/*__GEOMETRY__*/', '/*__CAM__*/', '/*__CAMST__*/']) {
  if (!tpl.includes(m)) throw new Error(`marker ${m} missing from template.html`);
}
writeFileSync('clothoid-slider.html', tpl
  .replace('/*__GEOMETRY__*/', geo.trim())
  .replace('/*__CAM__*/', 'const CAM = ' + cam.trim() + ';')
  .replace('/*__CAMST__*/', st.trim()));
console.log('wrote clothoid-slider.html');
