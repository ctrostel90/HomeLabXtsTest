import * as G from './geometry.mjs';

const f = (v, n = 3) => Number(v).toFixed(n);
console.log('--- lap constants ---');
console.log('heading after one lap (deg):', f(G.theta(G.L_BLUE) * 180 / Math.PI), '(want 360)');
console.log('kappa max (1/mm):', f(G.KAPPA_MAX, 6), ' R min (mm):', f(G.R_MIN));
console.log('blue lap length:', f(G.L_BLUE));
console.log('orange lap length:', f(G.L_ORANGE), ' = 1500 + 198*pi =', f(1500 + 198 * Math.PI));
console.log('track separation:', f(G.TRACK_SEP));
console.log('cam half period: master', f(G.SO_HALF), ' slave', f(G.SB_HALF));

console.log('\n--- the loop actually closes ---');
const p0 = G.bluePoint(0), pL = { x: G.bluePoint(G.L_BLUE - 1e-9).x, y: G.bluePoint(G.L_BLUE - 1e-9).y };
// integrate the raw lap without wrapping to see the true closure residual
let x = -250, y = 0; const n = 300000, h = G.L_BLUE / n;
for (let i = 0; i < n; i++) {
  const s0 = i * h, sm = s0 + h / 2, s1 = s0 + h;
  x += (h / 6) * (Math.cos(G.theta(s0)) + 4 * Math.cos(G.theta(sm)) + Math.cos(G.theta(s1)));
  y += (h / 6) * (Math.sin(G.theta(s0)) + 4 * Math.sin(G.theta(sm)) + Math.sin(G.theta(s1)));
}
console.log('start   :', f(p0.x), f(p0.y));
console.log('after 1 lap:', f(x), f(y));
console.log('closure gap:', Math.hypot(x - p0.x, y - p0.y).toExponential(2), 'mm');

console.log('\n--- corners ---');
for (const [name, s] of [['bottom straight -> right curve', G.S_C1_IN],
                         ['right curve -> top straight', G.S_C1_OUT],
                         ['top straight -> left curve', G.S_C2_IN],
                         ['left curve -> bottom straight', G.S_C2_OUT]]) {
  const p = G.bluePoint(s);
  console.log(`${name.padEnd(32)} s=${String(s).padStart(4)}  (${f(p.x, 1).padStart(7)}, ${f(p.y, 1).padStart(6)})  heading ${f(G.theta(s) * 180 / Math.PI, 1).padStart(6)} deg  kappa ${G.kappa(s).toExponential(1)}`);
}

console.log('\n--- offset really is 99 mm everywhere, and outside ---');
let worst = 0;
for (let s = 0; s <= G.L_BLUE; s += 0.5) {
  const b = G.bluePoint(s), o = G.orangePoint(s);
  worst = Math.max(worst, Math.abs(Math.hypot(o.x - b.x, o.y - b.y) - 99));
}
console.log('max deviation from 99 mm:', worst.toExponential(2), 'mm');

let len = 0, prev = G.orangePoint(0);
for (let i = 1; i <= 600000; i++) {
  const cur = G.orangePoint((i * G.L_BLUE) / 600000);
  len += Math.hypot(cur.x - prev.x, cur.y - prev.y);
  prev = cur;
}
console.log('orange lap by integration:', f(len), ' closed form:', f(G.L_ORANGE));

console.log('\n--- cam half-period identity  f(so + SO_HALF) = f(so) + 750 ---');
worst = 0;
for (let so = 0; so <= G.SO_HALF; so += 0.05) {
  worst = Math.max(worst, Math.abs(G.orangeToBlue(so + G.SO_HALF) - (G.orangeToBlue(so) + G.SB_HALF)));
}
console.log('max mismatch:', worst.toExponential(2), 'mm');

console.log('\n--- A and B around one lap, 115 mm pitch on orange ---');
const A0 = 65, B0 = 180, PITCH = B0 - A0;
console.log('   u      soA     soB   |    sbA     sbB   | blue pitch | ratio');
let minP = Infinity, minAt = 0, maxP = -Infinity;
for (let u = 0; u <= G.L_ORANGE + 1e-9; u += G.L_ORANGE / 24) {
  const a = G.orangeToBlue(A0 + u), b = G.orangeToBlue(B0 + u);
  const bp = b - a;
  if (bp < minP) { minP = bp; minAt = u; }
  maxP = Math.max(maxP, bp);
  console.log(`${f(u, 1).padStart(7)} ${f(A0 + u, 1).padStart(7)} ${f(B0 + u, 1).padStart(7)} | ${f(a, 1).padStart(7)} ${f(b, 1).padStart(7)} | ${f(bp, 2).padStart(9)} | ${f(bp / PITCH, 3)}`);
}
for (let u = 0; u <= G.L_ORANGE; u += 0.05) {
  const bp = G.orangeToBlue(B0 + u) - G.orangeToBlue(A0 + u);
  if (bp < minP) { minP = bp; minAt = u; }
  maxP = Math.max(maxP, bp);
}
console.log('\nblue pitch range over a lap:', f(minP, 2), '..', f(maxP, 2), 'mm; tightest at travel', f(minAt, 1));

console.log('\n--- how many carriers fit at 115 mm orange pitch ---');
console.log('orange lap / 115 =', f(G.L_ORANGE / 115, 3), '(not an integer, so a fully closed train needs a different pitch)');
console.log('18 carriers ->', f(G.L_ORANGE / 18, 2), 'mm pitch;  19 carriers ->', f(G.L_ORANGE / 19, 2), 'mm');

console.log('\n--- drawing bounds ---');
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
for (let s = 0; s <= G.L_BLUE; s += 0.5) {
  for (const p of [G.bluePoint(s), G.orangePoint(s)]) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
}
console.log('x:', f(x0, 1), '..', f(x1, 1), '   y:', f(y0, 1), '..', f(y1, 1));
