// Closed clothoid oval, AT2050-0500 style.
//
//   blue  = track centreline, one lap = 1500 mm:
//             [   0,  250]  bottom straight,  heading 0
//             [ 250,  750]  right U-turn,     heading 0 -> pi
//             [ 750, 1000]  top straight,     heading pi
//             [1000, 1500]  left U-turn,      heading pi -> 2pi
//   orange = true parallel offset 99 mm to the OUTSIDE of the oval.
//
// Each U-turn is a symmetric clothoid pair with no constant-radius arc:
//   kappa(t) = c*t for 0<=t<=250, kappa(t) = c*(500-t) for 250<=t<=500,
// with c chosen so each turn is exactly pi. Curvature is therefore continuous
// everywhere on the lap and zero at every straight/curve join.

export const L_STRAIGHT = 250;   // mm, each straight
export const L_CURVE = 500;      // mm, arc length of each 180 deg curve module
export const OFFSET = 99;        // mm, lateral offset of the orange path
export const L_BLUE = 2 * (L_STRAIGHT + L_CURVE);   // 1500 mm, one lap

// blue arc length at each segment boundary
export const S_C1_IN = L_STRAIGHT;                    //  250  bottom straight -> right curve
export const S_C1_OUT = S_C1_IN + L_CURVE;            //  750  right curve -> top straight
export const S_C2_IN = S_C1_OUT + L_STRAIGHT;         // 1000  top straight -> left curve
export const S_C2_OUT = S_C2_IN + L_CURVE;            // 1500  left curve -> bottom straight

export const C_SHARP = Math.PI / ((L_CURVE / 2) ** 2);
export const KAPPA_MAX = C_SHARP * (L_CURVE / 2);
export const R_MIN = 1 / KAPPA_MAX;

export const wrap = s => ((s % L_BLUE) + L_BLUE) % L_BLUE;

/** Heading gained inside one U-turn, t in [0, L_CURVE]. Runs 0 -> pi. */
function turn(t) {
  if (t <= 0) return 0;
  if (t >= L_CURVE) return Math.PI;
  if (t <= L_CURVE / 2) return (C_SHARP * t * t) / 2;
  const r = L_CURVE - t;
  return Math.PI - (C_SHARP * r * r) / 2;
}

/** Cumulative heading (rad) at blue arc length s. Gains 2*pi per lap. */
export function theta(s) {
  const lap = Math.floor(s / L_BLUE);
  const u = s - lap * L_BLUE;
  let th;
  if (u <= S_C1_IN) th = 0;
  else if (u <= S_C1_OUT) th = turn(u - S_C1_IN);
  else if (u <= S_C2_IN) th = Math.PI;
  else th = Math.PI + turn(u - S_C2_IN);
  return th + lap * 2 * Math.PI;
}

/** Curvature (1/mm) at blue arc length s. Always >= 0: the lap turns one way. */
export function kappa(s) {
  const u = wrap(s);
  let t = null;
  if (u > S_C1_IN && u < S_C1_OUT) t = u - S_C1_IN;
  else if (u > S_C2_IN && u < S_C2_OUT) t = u - S_C2_IN;
  if (t === null) return 0;
  return t <= L_CURVE / 2 ? C_SHARP * t : C_SHARP * (L_CURVE - t);
}

// --- Orange arc length -------------------------------------------------------
// Q(s) = P(s) + d*n_right(s)  =>  dQ/ds = (1 + d*kappa) * T, and integral(kappa ds)
// is just the heading, so the master/slave map has a closed form.

/** Orange arc length at blue arc length s. Strictly increasing. */
export function blueToOrange(s) {
  return s + OFFSET * theta(s);
}

export const L_ORANGE = blueToOrange(L_BLUE);   // 1500 + 99*2pi

// The lap is one straight-plus-curve unit repeated twice, so the cam repeats
// after half a lap: SO_HALF of master buys SB_HALF of slave.
export const SO_HALF = L_ORANGE / 2;            // 750 + 99*pi
export const SB_HALF = L_BLUE / 2;              // 750

/** Inverse of blueToOrange, by bisection within a lap. */
export function orangeToBlue(so) {
  const lap = Math.floor(so / L_ORANGE);
  const r = so - lap * L_ORANGE;
  let lo = 0, hi = L_BLUE;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    if (blueToOrange(mid) < r) lo = mid; else hi = mid;
  }
  return lap * L_BLUE + (lo + hi) / 2;
}

// --- Cartesian positions -----------------------------------------------------
// No closed form for the clothoid, so integrate one lap once (Simpson per step)
// and interpolate. Positions are periodic in s.

const N = 30000;
const H = L_BLUE / N;
const XS = new Float64Array(N + 1);
const YS = new Float64Array(N + 1);

XS[0] = -L_STRAIGHT;   // s = 0 sits at the left end of the bottom straight
YS[0] = 0;
for (let i = 0; i < N; i++) {
  const s0 = i * H, sm = s0 + H / 2, s1 = s0 + H;
  const t0 = theta(s0), tm = theta(sm), t1 = theta(s1);
  XS[i + 1] = XS[i] + (H / 6) * (Math.cos(t0) + 4 * Math.cos(tm) + Math.cos(t1));
  YS[i + 1] = YS[i] + (H / 6) * (Math.sin(t0) + 4 * Math.sin(tm) + Math.sin(t1));
}

/** Perpendicular distance between the two straights. */
export const TRACK_SEP = YS[Math.round(S_C1_OUT / H)];

/** Point on the blue path at arc length s (periodic). */
export function bluePoint(s) {
  const u = wrap(s) / H;
  const i = Math.min(Math.floor(u), N - 1);
  const fr = u - i;
  return { x: XS[i] + (XS[i + 1] - XS[i]) * fr, y: YS[i] + (YS[i + 1] - YS[i]) * fr };
}

/** Point on the orange path, given the BLUE arc length of its normal foot. */
export function orangePoint(s) {
  const p = bluePoint(s);
  const th = theta(s);
  // right-hand normal = (sin th, -cos th); the lap turns left, so this is the outside
  return { x: p.x + OFFSET * Math.sin(th), y: p.y - OFFSET * Math.cos(th) };
}

/** Full state of one carrier, addressed by its position along the ORANGE path. */
export function carrierAt(so) {
  const sb = orangeToBlue(so);
  return { so, sb, blue: bluePoint(sb), orange: orangePoint(sb), theta: theta(sb), kappa: kappa(sb) };
}
