// The exact cam function for the closed clothoid oval.
//
// Master = position along the ORANGE path. Slave = position along the BLUE path.
//
// The lap is one straight-plus-curve unit repeated twice, so the cam is periodic:
//     f(so + SO_HALF) = f(so) + SB_HALF          (1061.018 master -> 750 slave)
// Only that unit needs a table; TwinCAT repeats it.
//
// Inside the unit the clothoid inverts in closed form. On the first clothoid half
//     so = sb + 99*theta,  theta = c*(sb-250)^2/2
// is a quadratic in (sb-250), so sb is a square root of so. The second half is the
// point reflection of the first about the curve midpoint.

import { L_STRAIGHT, L_CURVE, OFFSET, C_SHARP, L_BLUE, SO_HALF, SB_HALF,
         S_C1_IN, S_C1_OUT, S_C2_IN, S_C2_OUT, kappa, wrap } from './geometry.mjs';

export { SO_HALF, SB_HALF };

/** Master at the curve entry, inside the unit. */
export const SO_ENTRY = L_STRAIGHT;                                   // 250
/** Master and slave at the apex, where curvature peaks. */
export const SO_APEX = L_STRAIGHT + L_CURVE / 2 + (OFFSET * Math.PI) / 2;   // 655.509
export const SB_APEX = L_STRAIGHT + L_CURVE / 2;                      // 500

const A_Q = OFFSET * C_SHARP;   // coefficient of the quadratic master law

/** The cam over one half-period unit, so in [0, SO_HALF]. */
function fUnit(so) {
  if (so <= SO_ENTRY) return so;
  if (so <= SO_APEX) return L_STRAIGHT + (Math.sqrt(1 + 2 * A_Q * (so - L_STRAIGHT)) - 1) / A_Q;
  return 2 * SB_APEX - fUnit(2 * SO_APEX - so);
}

/** Exact cam value: blue arc length for a given orange arc length. Periodic. */
export function f(so) {
  const k = Math.floor(so / SO_HALF);
  return k * SB_HALF + fUnit(so - k * SO_HALF);
}

/** dSlave/dMaster. Continuous everywhere on the lap. */
export function f1(so) { return 1 / (1 + OFFSET * kappa(f(so))); }

/**
 * d2Slave/dMaster2. Jumps wherever kappa' jumps: at each curve entry, apex and
 * exit. Pass side=-1 to take the value approaching a breakpoint from the left.
 */
export function f2(so, side = +1) {
  const sb = f(so);
  const u = wrap(sb);
  let t = null;
  if (u >= S_C1_IN && u <= S_C1_OUT) t = u - S_C1_IN;
  else if (u >= S_C2_IN && u <= S_C2_OUT) t = u - S_C2_IN;
  else if (u <= 1e-9 || u >= L_BLUE - 1e-9) t = L_CURVE;   // lap wrap sits at a curve exit

  let kp;                                       // kappa'(sb)
  if (t === null) kp = 0;
  else if (Math.abs(t) < 1e-9) kp = side > 0 ? C_SHARP : 0;          // curve entry
  else if (Math.abs(t - L_CURVE) < 1e-9) kp = side > 0 ? 0 : -C_SHARP; // curve exit
  // At the apex kappa' flips from +c to -c, so the LEFT side (side=-1) is +c.
  else if (Math.abs(t - L_CURVE / 2) < 1e-9) kp = -side * C_SHARP;
  else kp = t < L_CURVE / 2 ? C_SHARP : -C_SHARP;

  return (-OFFSET * kp) / (1 + OFFSET * kappa(sb)) ** 3;
}
