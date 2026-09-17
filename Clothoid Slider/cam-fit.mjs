// Fit the closed-loop clothoid cam with as few points as possible, using the
// Beckhoff segment types Polynomial1 (straight) and Polynomial5_MM (curve).
//
// Only the half-period unit is fitted: master [0, SO_HALF], slave [0, SB_HALF].
// The table is periodic, so TwinCAT repeats it for the rest of the lap. The unit
// is a 250 mm straight followed by one 180 deg clothoid curve.
//
// The unit is itself point-symmetric about the curve apex, so the table is
// generated from its first half: mirror x about SO_APEX, y about SB_APEX, keep
// the velocity, flip the sign of the acceleration.

import { f, f1, f2, SO_ENTRY, SO_APEX, SB_APEX, SO_HALF, SB_HALF } from './cam.mjs';

const LINE = 'Polynomial1', P5 = 'Polynomial5_MM';

// ------------------------------------------------------------------ evaluation
function evalSeg(p0, p1, x) {
  const h = p1.x - p0.x, t = (x - p0.x) / h;
  if (p0.seg === LINE) return p0.y + (p1.y - p0.y) * t;
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
  return (1 - 10 * t3 + 15 * t4 - 6 * t5) * p0.y +
         (t - 6 * t3 + 8 * t4 - 3 * t5) * h * p0.v +
         (t2 / 2 - 1.5 * t3 + 1.5 * t4 - t5 / 2) * h * h * p0.a +
         (10 * t3 - 15 * t4 + 6 * t5) * p1.y +
         (-4 * t3 + 7 * t4 - 3 * t5) * h * p1.v +
         (t3 / 2 - t4 + t5 / 2) * h * h * p1.a;
}

/** Worst |cam - exact| over the unit, which by periodicity bounds the whole lap. */
export function camError(pts, per = 260) {
  let worst = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i].x, b = pts[i + 1].x;
    for (let j = 0; j <= per; j++) {
      const x = a + ((b - a) * j) / per;
      worst = Math.max(worst, Math.abs(evalSeg(pts[i], pts[i + 1], x) - f(x)));
    }
  }
  return worst;
}

// ------------------------------------------------------------------ table build
/**
 * One periodic unit.
 *   xs   : interior knot masters in (SO_ENTRY, SO_APEX), ascending
 *   accs : accelerations at [SO_ENTRY, ...xs]
 * The first and last rows are the same physical point one period apart, so they
 * carry the same acceleration: the one arriving from the previous curve.
 */
export function buildTable(xs, accs) {
  const head = [
    { x: 0, y: 0, v: 1, a: 0, seg: LINE },
    { x: SO_ENTRY, y: SO_ENTRY, v: 1, a: accs[0], seg: P5 },
    ...xs.map((x, i) => ({ x, y: f(x), v: f1(x), a: accs[i + 1], seg: P5 })),
  ];
  const mirror = p => ({ x: 2 * SO_APEX - p.x, y: 2 * SB_APEX - p.y, v: p.v, a: -p.a, seg: P5 });
  const pts = [...head];
  for (let i = head.length - 1; i >= 1; i--) pts.push(mirror(head[i]));
  const last = pts[pts.length - 1];
  last.seg = LINE;          // the next unit opens with its own straight
  pts[0].a = last.a;        // same point, one period earlier
  return pts;
}

// ------------------------------------------------------------------ Nelder-Mead
function nelderMead(fn, x0, steps, iters = 4000) {
  const n = x0.length;
  let simplex = [x0.slice()];
  for (let i = 0; i < n; i++) { const p = x0.slice(); p[i] += steps[i]; simplex.push(p); }
  let val = simplex.map(fn);
  for (let it = 0; it < iters; it++) {
    const ord = val.map((v, i) => i).sort((a, b) => val[a] - val[b]);
    simplex = ord.map(i => simplex[i]); val = ord.map(i => val[i]);
    if (Math.abs(val[n] - val[0]) < 1e-12) break;
    const cen = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cen[j] += simplex[i][j] / n;
    const refl = cen.map((c, j) => c + (c - simplex[n][j])), fr = fn(refl);
    if (fr < val[0]) {
      const exp = cen.map((c, j) => c + 2 * (c - simplex[n][j])), fe = fn(exp);
      if (fe < fr) { simplex[n] = exp; val[n] = fe; } else { simplex[n] = refl; val[n] = fr; }
    } else if (fr < val[n - 1]) { simplex[n] = refl; val[n] = fr; }
    else {
      const con = cen.map((c, j) => c + 0.5 * (simplex[n][j] - c)), fc = fn(con);
      if (fc < val[n]) { simplex[n] = con; val[n] = fc; }
      else for (let i = 1; i <= n; i++) {
        simplex[i] = simplex[i].map((v, j) => simplex[0][j] + 0.5 * (v - simplex[0][j]));
        val[i] = fn(simplex[i]);
      }
    }
  }
  const best = val.indexOf(Math.min(...val));
  return { x: simplex[best], fx: val[best] };
}

// ------------------------------------------------------------------ the search
/** Optimise a layout with m interior knots per curve half. Yields 3 + 2m points. */
export function fitLayout(m) {
  const lo = SO_ENTRY, hi = SO_APEX;
  const AS = 1e3;                                   // acceleration parameter scale
  const x0 = [];
  for (let i = 1; i <= m; i++) x0.push(lo + (hi - lo) * Math.pow(i / (m + 1), 0.6));
  const seed = [...x0, f2(lo, +1) * AS, ...x0.map(x => f2(x) * AS)];

  const decode = p => {
    const xs = p.slice(0, m).slice().sort((a, b) => a - b)
      .map(x => Math.min(hi - 1e-3, Math.max(lo + 1e-3, x)));
    return buildTable(xs, p.slice(m).map(a => a / AS));
  };
  // A near-zero-length segment can fake the apex acceleration jump. That is not a
  // usable cam table, so penalise short segments.
  const MIN_GAP = 30;
  const obj = p => {
    const pts = decode(p);
    let pen = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const g = pts[i + 1].x - pts[i].x;
      if (g < MIN_GAP) pen += (MIN_GAP - g) * 10;
    }
    return camError(pts, 90) + pen;
  };
  const steps = [...new Array(m).fill(25), ...new Array(m + 1).fill(0.4)];
  let best = nelderMead(obj, seed, steps);
  for (let r = 0; r < 40; r++) {                    // restarts to escape local minima
    const from = r % 3 === 0 ? seed : best.x;
    const jit = from.map((v, i) => v + (Math.random() - 0.5) * steps[i] * (r < 20 ? 1.4 : 0.5));
    const cand = nelderMead(obj, jit, steps.map(s => s * (r < 20 ? 1 : 0.4)));
    if (cand.fx < best.fx) best = cand;
  }
  const pts = decode(best.x);
  return { pts, err: camError(pts, 900), n: pts.length };
}

// ------------------------------------------------------------------ report
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('cam-fit.mjs')) {
  const fm = (v, n = 3) => Number(v).toFixed(n);
  console.log('Periodic cam unit: master 0 .. ' + fm(SO_HALF) + ', slave 0 .. ' + fm(SB_HALF));
  console.log('Repeat it twice for a full lap.\n');
  console.log('points   interior/half   worst error (mm)');
  const results = [];
  for (const m of [1, 2, 3]) {
    const r = fitLayout(m);
    results.push(r);
    console.log(`${String(r.n).padStart(6)}   ${String(m).padStart(13)}   ${fm(r.err, 4).padStart(16)}`);
  }
  for (const r of results) {
    console.log(`\n=== ${r.n} points, worst error ${fm(r.err, 4)} mm ===`);
    console.log(' #  segment            master (mm)     slave (mm)    slave velo   slave acc (1/mm)    gap');
    r.pts.forEach((p, i) => {
      const gap = i ? fm(p.x - r.pts[i - 1].x, 1) : '';
      console.log(`${String(i).padStart(2)}  ${p.seg.padEnd(18)} ${fm(p.x, 3).padStart(11)} ${fm(p.y, 3).padStart(14)} ${fm(p.v, 6).padStart(13)} ${fm(p.a, 7).padStart(18)} ${gap.padStart(7)}`);
    });
  }
  console.log('\nA enters at master 65 mm, B at 180 mm, both modulo ' + fm(2 * SO_HALF) + ' per lap.');
}
