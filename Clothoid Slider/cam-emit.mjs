// Runs the cam fit and freezes the result to cam-table.json so the build is
// reproducible and the browser never has to run the optimiser.
import { writeFileSync } from 'node:fs';
import { fitLayout, camError } from './cam-fit.mjs';
import { f, SO_HALF, SB_HALF } from './cam.mjs';
import { L_ORANGE, L_BLUE } from './geometry.mjs';

const round = (v, n) => Number(v.toFixed(n));
const out = {
  recommended: 7,
  masterPeriod: round(SO_HALF, 4),
  slavePeriod: round(SB_HALF, 4),
  lapMaster: round(L_ORANGE, 4),
  lapSlave: round(L_BLUE, 4),
  variants: {},
};

for (const m of [1, 2, 3]) {
  const r = fitLayout(m);
  out.variants[r.n] = {
    points: r.pts.map(p => ({
      x: round(p.x, 4), y: round(p.y, 4), v: round(p.v, 7), a: round(p.a, 9), seg: p.seg,
    })),
    err: r.err,
  };
}

for (const k of Object.keys(out.variants)) {
  const e = camError(out.variants[k].points, 4000);
  out.variants[k].err = e;
  console.log(`${k} points -> worst error ${e.toExponential(3)} mm  (rounded table, 4000 samples/segment)`);
}

// --- independent check: evaluate the table periodically over a FULL lap -------
const P = out.variants[out.recommended].points;
function camPeriodic(x) {
  const k = Math.floor(x / SO_HALF);
  const r = x - k * SO_HALF;
  let i = 0;
  while (i < P.length - 2 && r > P[i + 1].x) i++;
  const p0 = P[i], p1 = P[i + 1], h = p1.x - p0.x, t = (r - p0.x) / h;
  let v;
  if (p0.seg === 'Polynomial1') v = p0.y + (p1.y - p0.y) * t;
  else {
    const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
    v = (1 - 10 * t3 + 15 * t4 - 6 * t5) * p0.y +
        (t - 6 * t3 + 8 * t4 - 3 * t5) * h * p0.v +
        (t2 / 2 - 1.5 * t3 + 1.5 * t4 - t5 / 2) * h * h * p0.a +
        (10 * t3 - 15 * t4 + 6 * t5) * p1.y +
        (-4 * t3 + 7 * t4 - 3 * t5) * h * p1.v +
        (t3 / 2 - t4 + t5 / 2) * h * h * p1.a;
  }
  return k * SB_HALF + v;
}
let worst = 0, at = 0;
for (let x = 0; x <= L_ORANGE; x += 0.01) {
  const e = Math.abs(camPeriodic(x) - f(x));
  if (e > worst) { worst = e; at = x; }
}
console.log(`\nfull lap sweep of the ${out.recommended}-point periodic table: worst ${worst.toExponential(3)} mm at master ${at.toFixed(1)} mm`);
console.log('slave after one lap:', camPeriodic(L_ORANGE).toFixed(6), '(want', L_BLUE + ')');
console.log('wrap continuity: a at row 0 =', P[0].a, ' a at last row =', P[P.length - 1].a);

writeFileSync('cam-table.json', JSON.stringify(out, null, 2));
console.log('wrote cam-table.json');
