// ---- RegularStarBox : two n-gon half boxes, cross-halved walls (port of regularstarbox.py) ----
// helpers (copy of RegularBox.js, prefix rs)
function rsFL(F, ang) {
  const t = F.t, ex = F.extra;
  if (ang >= 90 || ang <= -90) return [t + ex, 0];
  if (ang < 0) return [Math.sin(-ang*RAD)*t + ex, 0];
  const a = 90 - (180 - ang)/2, fl = t*Math.tan(a*RAD), b = 90 - 2*a;
  return [fl + ex, -Math.sin(b*RAD)*fl];
}
function rsFingers(T, len, pos, F, h) {
  let p = 0;
  for (const [o, f] of fingerLayout(len, pos, F)) { const s = pos ? -90 : 90;
    T.edge(o - p); T.corner(s); T.edge(h); T.corner(-s); T.edge(f); T.corner(-s); T.edge(h); T.corner(s); p = o + f; }
  T.edge(len - p);
}
function rsFinger(F, pos, ang) {
  const [l1, l2] = rsFL(F, ang), h = l1 - l2;
  return {sw: pos ? l2 : l1, mg: pos ? h : 0, draw:(T, l) => rsFingers(T, l, pos, F, h)};
}
function rsClean(pts) { const o = []; for (const p of pts) { const q = o[o.length-1]; if (!q || Math.hypot(p[0]-q[0], p[1]-q[1]) > 1e-7) o.push(p); }
  if (o.length > 1 && Math.hypot(o[0][0]-o[o.length-1][0], o[0][1]-o[o.length-1][1]) < 1e-6) o.pop(); return o; }
function rsWall(w, h, eds) {
  const sp = e => e.sw + e.mg, T = turtle(sp(eds[3]), eds[0].mg), lens = [w, h, w, h];
  for (let i = 0; i < 4; i++) { const e = eds[i], e2 = eds[(i+1)%4];
    e.draw(T, lens[i]); T.edge(e2.sw); T.corner(90); T.edge(e.sw); }
  const dx = sp(eds[3]), dy = sp(eds[0]);
  return rsClean(T.pts.map(p => [p[0]-dx, p[1]-dy]));
}
function rsPlate(n, sh, side, e) {
  const T = turtle(-side/2, -(sh + e.sw)), k = e.sw*Math.tan(Math.PI/n);
  for (let i = 0; i < n; i++) { e.draw(T, side); T.edge(k); T.corner(360/n); T.edge(k); }
  return rsClean(T.pts);
}
// SlotEdge (outset by t) : two slots near the ends of the top edge, shallow recess t between them
function rsSlot(t, n, sh, h) {
  return {sw:t, mg:0, draw:(T, len) => {
    const li0 = 2*sh*Math.tan(Math.PI/(2*n)), ls2 = t/Math.tan(Math.PI/n), ls1 = t/Math.sin(Math.PI/n);
    const lo = (len - li0 - 2*ls1)/2, li = li0 - 2*ls2, d = h/2;
    if (!(li > 0)) fail('Box too small for this number of sides');
    T.edge(lo-1); T.corner(90, 1); T.edge(d+t-1); T.corner(-90); T.edge(ls1+ls2); T.corner(-90); T.edge(d-t); T.corner(90, t);
    T.edge(li-2*t);
    T.corner(90, t); T.edge(d-t); T.corner(-90); T.edge(ls1+ls2); T.corner(-90); T.edge(d+t-1); T.corner(90, 1); T.edge(lo-1);
  }};
}

BUILD.RegularStarBox = function (c) {
  const {t, F, num} = c, n = Math.round(num('n'));
  let r = num('radius'), h = num('h');
  if (V.outside) { r -= t/Math.cos(Math.PI/n); h = c.adj(h); }
  if (!(r > 0 && h > 0)) fail('Inconsistent dimensions');
  const sh = r*Math.cos(Math.PI/n), side = 2*r*Math.sin(Math.PI/n);
  const f = rsFinger(F, true, 90), Fn = rsFinger(F, false, 90), g = rsFinger(F, true, 360/n), G = rsFinger(F, false, 360/n), e = rsSlot(t, n, sh, h);
  const A = n % 2 ? [[f, g, e, G]] : [[f, G, e, G], [f, g, e, g]];
  const P = [], plate = rsPlate(n, sh, side, Fn), ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1);
  P.push(panel(plate, t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
  const al = Math.PI/n;
  P.push(panel(plate, t, V3(0,0,h), V3(Math.cos(al), Math.sin(al), 0), V3(-Math.sin(al), Math.cos(al), 0), V3(0,0,1)));
  const outl = A.map(eds => rsWall(side, h, eds).map(p => [p[0] - side/2, p[1]]));
  for (let s = 0; s < 2; s++) for (let k = 0; k < n; k++) {
    const th = (-90 + 360*k/n)*RAD + s*al, nn = V3(Math.cos(th), Math.sin(th), 0), tau = V3(-Math.sin(th), Math.cos(th), 0);
    const pts = outl[n % 2 ? 0 : k % 2];
    P.push(s === 0 ? panel(pts, t, nn.clone().multiplyScalar(sh), tau, uz, nn)
                   : panel(pts, t, nn.clone().multiplyScalar(sh).add(V3(0, 0, h)), tau.clone().negate(), V3(0,0,-1), nn));
  }
  warn('Slot arcs of radius 1 mm drawn as in the generator; vertical assembly inferred (half boxes head to tail, offset by 180°/n).');
  return {kind:'box', panels:P};
};
USED.RegularStarBox = ['h','radius','n'];
NOTES.RegularStarBox = '3D layout (two half boxes interlocked in a star) inferred from the code, not checked against a photo. ';
