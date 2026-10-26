// ---- BayonetBox : 5 glued discs, bayonet lugs (port of bayonetbox.py) ----
function bayClean(pts) { const o = []; for (const p of pts) { const q = o[o.length-1]; if (!q || Math.hypot(p[0]-q[0], p[1]-q[1]) > 1e-7) o.push(p); }
  if (o.length > 1 && Math.hypot(o[0][0]-o[o.length-1][0], o[0][1]-o[o.length-1][1]) < 1e-6) o.pop(); return o; }
function bayCircle(r, N = 90, cx = 0, cy = 0) { return Array.from({length:N}, (_, i) => [cx + r*Math.cos(2*Math.PI*i/N), cy + r*Math.sin(2*Math.PI*i/N)]); }
// closed lug contour: start (x0,0) heading -90 ; per lug: arc a1 @r1, step out .5t, arc a2 @r2, step in .5t
function bayLoop(x0, l, a1, r1, a2, r2, t) {
  const T = turtle(x0, 0); T.hd = -Math.PI/2;
  for (let i = 0; i < l; i++) { T.corner(a1, r1); T.corner(90); T.edge(.5*t); T.corner(-90); T.corner(a2, r2); T.corner(-90); T.edge(.5*t); T.corner(90); }
  return bayClean(T.pts);
}

// BayonetBox has no finger-joint parameters in its form, but the engine's common() validates them: give them neutral defaults (unused here).
const bayCommon0 = common;
common = function () {
  if (TYPE === 'BayonetBox') for (const [k, v] of Object.entries({FingerJoint_space:'2.0', FingerJoint_finger:'2.0', FingerJoint_surroundingspaces:'2.0', FingerJoint_play:'0.0',
      FingerJoint_extra_length:'0.0', FingerJoint_edge_width:'1.0', FingerJoint_width:'1.0'})) if (V[k] === undefined) V[k] = v;
  return bayCommon0();
};

BUILD.BayonetBox = function (c) {
  const {t, num} = c, l = Math.round(num('lugs')), pin = num('alignment_pins');
  let d = num('diameter');
  if (!V.outside) d -= 3*t;
  if (!(l >= 2) || l > 200) fail('lugs: between 2 and 200');
  if (!(d > 6*t)) fail('Diameter too small');
  const r = d/2, p = 0.05*t, a = 180/l, disc = bayCircle(r, 120);
  const pins = rad => [0, 1, 2].map(i => bayCircle(Math.max(pin/2, 0.01), 12, rad*Math.cos(2*Math.PI*i/3), rad*Math.sin(2*Math.PI*i/3)));
  const outerPins = pins(r - t/2), innerPins = pins(r - 2*t - p);
  const R1 = r - 1.5*t, R2 = r - 2.5*t;
  const Wi = bayLoop(R1, l, -4/3*a, R1, -2/3*a, r - t, t);
  const Wo = bayLoop(R1 + p, l, -2/3*a, R1 + p, -4/3*a, r - t + p, t);
  const W4 = bayLoop(R1, l, -1.3*a, R1 + p, -0.7*a, r - t + p, t);
  const ux = V3(1,0,0), uy = V3(0,1,0), P = [];
  const add = (o, k, dirz) => { const q = panel(o, t, V3(0, 0, k*t), ux, uy, V3(0, 0, dirz)); P.push(q); return q; };
  // top group (inner rings + lid) is built twisted into the locked position: rotated by 2/3 a (the free travel of its lugs in the pockets of the outer rings)
  const tw = 2/3*a, rot = pts => pts.map(([x, y]) => [x*Math.cos(tw*RAD) - y*Math.sin(tw*RAD), x*Math.sin(tw*RAD) + y*Math.cos(tw*RAD)]);
  const rh = o => ({pts:rot(o.pts), holes:o.holes.map(rot)});
  add({pts:disc, holes:outerPins}, 0, -2);                                        // 1: solid
  add({pts:disc, holes:[...outerPins, bayCircle(R1)]}, 1, -1);                      // 2: outer ring
  add({pts:disc, holes:[...outerPins, Wo]}, 2, 0);                                  // 3: outer ring with lugs
  const top = [add(rh({pts:Wi, holes:[bayCircle(R2), ...innerPins]}), 2, 0)];                         // 3: inner ring with lugs (top part)
  add({pts:disc, holes:[...outerPins, W4]}, 3, 1);                    // 4: outer ring, lugs pointing inwards
  top.push(add(rh({pts:bayCircle(R1), holes:[bayCircle(R2), ...innerPins]}), 3, 1));              // 4: inner ring
  top.push(add(rh({pts:disc, holes:innerPins}), 4, 2));                                           // 5: solid lid
  warn('Stack order 1 (bottom) to 5 (top) inferred; inner rings attached to the lid (glued), glue the outer rings to the base.');
  return {kind:'box', panels:P, openers:[{parts:top, point:V3(0,0,0), axis:V3(0,0,1), angle:-tw}]};   // unlock : twist back by 2/3 a (lugs line up with the pockets)
};
