import * as G from './geometry.mjs';
import * as C from './cam.mjs';

const f = (v, n = 3) => Number(v).toFixed(n);

console.log('--- closed form f(so) agrees with the bisection solver, over a full lap ---');
let worst = 0, at = 0;
for (let so = 0; so <= G.L_ORANGE; so += 0.05) {
  const e = Math.abs(C.f(so) - G.orangeToBlue(so));
  if (e > worst) { worst = e; at = so; }
}
console.log('max |closed form - bisection| =', worst.toExponential(2), 'mm at so =', f(at, 1));

console.log('\n--- periodicity  f(so + SO_HALF) = f(so) + SB_HALF ---');
worst = 0;
for (let so = 0; so <= 2 * G.SO_HALF; so += 0.05) {
  worst = Math.max(worst, Math.abs(C.f(so + G.SO_HALF) - (C.f(so) + G.SB_HALF)));
}
console.log('max mismatch:', worst.toExponential(2), 'mm   (master period', f(C.SO_HALF), '-> slave period', f(C.SB_HALF) + ')');

console.log('\n--- breakpoints inside one unit (cam acceleration jumps here) ---');
console.log('curve entry so =', f(C.SO_ENTRY), ' apex so =', f(C.SO_APEX), ' curve exit so =', f(C.SO_HALF));
for (const [name, so] of [['entry', C.SO_ENTRY], ['apex', C.SO_APEX], ['exit', C.SO_HALF]]) {
  console.log(`  ${name.padEnd(6)} f'=${f(C.f1(so), 6)}   f'' left ${f(C.f2(so, -1), 7).padStart(10)}  right ${f(C.f2(so, +1), 7).padStart(10)}`);
}

console.log('\n--- slope matches the geometry identity  1/(1 + 99*kappa) ---');
worst = 0;
for (let so = 0; so <= G.L_ORANGE; so += 0.1) {
  worst = Math.max(worst, Math.abs(C.f1(so) - 1 / (1 + G.OFFSET * G.kappa(C.f(so)))));
}
console.log('max mismatch:', worst.toExponential(2));

console.log("\n--- second derivative by finite difference vs the analytic value ---");
worst = 0;
for (let so = 5; so <= G.L_ORANGE - 5; so += 0.37) {
  // skip a window around each breakpoint, where the second derivative really jumps
  const r = so % C.SO_HALF;
  if ([0, C.SO_ENTRY, C.SO_APEX, C.SO_HALF].some(b => Math.abs(r - b) < 1.5)) continue;
  const h = 0.05;
  const fd = (C.f(so + h) - 2 * C.f(so) + C.f(so - h)) / (h * h);
  worst = Math.max(worst, Math.abs(fd - C.f2(so)));
}
console.log('max mismatch:', worst.toExponential(2), '(finite-difference noise floor)');

console.log('\n--- what A and B read off the one table ---');
const A0 = 65, B0 = 180;
console.log(`A is at master = travel + ${A0}; B at master = travel + ${B0}, both modulo ${f(G.L_ORANGE)}.`);
console.log('Master zero is where the left curve meets the bottom straight.');
console.log('One lap of travel is', f(G.L_ORANGE), 'mm of master and', f(G.L_BLUE), 'mm of slave.');
