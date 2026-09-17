// Is the frozen cam-table.json still valid for the current geometry, and do the
// generated artefacts agree with it? Run after touching geometry.mjs or cam.mjs.
import { readFileSync } from 'node:fs';
import { camError } from './cam-fit.mjs';
import { SO_HALF, SB_HALF } from './cam.mjs';
import { L_ORANGE, L_BLUE } from './geometry.mjs';

const CAM = JSON.parse(readFileSync('cam-table.json', 'utf8'));
let bad = 0;
const say = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) bad++; };

console.log('cam-table.json vs current geometry');
say(Math.abs(CAM.masterPeriod - SO_HALF) < 5e-5, `master period ${CAM.masterPeriod} = SO_HALF ${SO_HALF.toFixed(4)}`);
say(Math.abs(CAM.slavePeriod - SB_HALF) < 5e-5, `slave period ${CAM.slavePeriod} = SB_HALF ${SB_HALF}`);
say(Math.abs(CAM.lapMaster - L_ORANGE) < 5e-5, `lap master ${CAM.lapMaster} = L_ORANGE ${L_ORANGE.toFixed(4)}`);
say(Math.abs(CAM.lapSlave - L_BLUE) < 5e-5, `lap slave ${CAM.lapSlave} = L_BLUE ${L_BLUE}`);

for (const k of Object.keys(CAM.variants)) {
  const v = CAM.variants[k];
  const now = camError(v.points, 3000);
  say(Math.abs(now - v.err) < 2e-5,
    `${k}-point table: stored ${(v.err * 1000).toFixed(2)} um, recomputed now ${(now * 1000).toFixed(2)} um`);
  const first = v.points[0], last = v.points[v.points.length - 1];
  say(Math.abs(last.x - CAM.masterPeriod) < 5e-4, `${k}-point table ends exactly one master period on`);
  say(Math.abs(last.y - CAM.slavePeriod) < 5e-4, `${k}-point table ends exactly one slave period on`);
  say(Math.abs(first.a - last.a) < 1e-9, `${k}-point table wraps with matching acceleration`);
  say(Math.abs(first.v - last.v) < 1e-9, `${k}-point table wraps with matching velocity`);
}

console.log('\ngenerated artefacts vs cam-table.json');
const st = readFileSync('Cam_Clothoid.txt', 'utf8');
const rec = CAM.variants[CAM.recommended].points;
say(st.includes(`// Clothoid oval cam, ${rec.length} points`), `Cam_Clothoid.txt declares ${rec.length} points`);
for (const p of rec) {
  say(st.includes(`MasterPos := ${p.x.toFixed(4)};`), `  MasterPos ${p.x.toFixed(4)} present`);
  say(st.includes(`SlaveAcc := ${(Object.is(p.a, -0) ? 0 : p.a).toFixed(9)};`), `  SlaveAcc ${p.a.toFixed(9)} present`);
}
say(/Periodic := TRUE/.test(st), 'Cam_Clothoid.txt selects the table as periodic');

console.log('\nstructured-text house style');
{
  const TAB = 4, COL = 56;
  const expand = s => {                       // column of the ":=" with tabs expanded
    let c = 0;
    for (const ch of s) { if (ch === '\t') c = Math.floor(c / TAB) * TAB + TAB; else c++; }
    return c;
  };
  const lines = st.split('\n');
  const asgLines = lines.filter(l => l.includes(':=') && !l.trim().startsWith('//'));
  const offset = asgLines.filter(l => expand(l.slice(0, l.indexOf(':='))) !== COL);
  say(offset.length === 0, `all ${asgLines.length} assignments put ":=" at column ${COL}`
    + (offset.length ? ` — ${offset.length} off, first: ${JSON.stringify(offset[0])}` : ''));

  const want = ['MasterPos', 'SlavePos', 'PointIndex', 'FunctionType', 'PointType',
    'RelIndexNextPoint', 'SlaveVelo', 'SlaveAcc', 'SlaveJerk'];
  const got = lines.filter(l => l.includes('.camPoints[point].'))
    .map(l => l.match(/\.camPoints\[point\]\.(\w+)/)[1]);
  const blocks = got.length / want.length;
  say(Number.isInteger(blocks) && blocks === rec.length, `${blocks} point blocks of ${want.length} fields`);
  say(got.slice(0, want.length).join() === want.join(), 'field order matches the sample');
  say(lines.some(l => /^\tpoint\t+:= 1;$/.test(l)), 'point index line is tab-indented once');
  say(lines.filter(l => l.includes('.camPoints[')).every(l => l.startsWith('\t\t\t')),
    'field lines are tab-indented three times');
  say(st.includes('_Camming.camPoints[point].MasterPos'), 'instance is named _Camming');
  say(!st.includes('    '), 'no space indentation anywhere');
}

const html = readFileSync('clothoid-slider.html', 'utf8');
say(html.includes(`"masterPeriod": ${CAM.masterPeriod}`), 'widget carries the same master period');
say(html.includes('const A0 = 65, B0 = 180'), 'widget uses A at 65 mm and B at 180 mm');
say(html.includes('MOTIONFUNCTYPE_POLYNOM5_MM'), 'widget can export the same structured text');

console.log(bad ? `\n${bad} CHECK(S) FAILED` : '\nall in sync');
process.exit(bad ? 1 : 0);
