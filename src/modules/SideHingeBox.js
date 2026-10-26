// ===== HX helpers (hinge boxes): generic rectangularWall with edge objects (port of Boxes.py). Same copy in each hinge module. =====
function hxT(T, H) {
  T.H = H;
  const loc = (lx, ly) => { const c = Math.cos(T.hd), s = Math.sin(T.hd); return [T.x + lx*c - ly*s, T.y + lx*s + ly*c]; };
  T.poly = (...a) => a.forEach((q, i) => { if (i % 2) { if (Array.isArray(q)) T.corner(q[0], q[1]); else T.corner(q); } else T.edge(q); });
  T.step = o => { if (o > 1e-5) { T.corner(-90); T.edge(o); T.corner(90); } else if (o < -1e-5) { T.corner(90); T.edge(-o); T.corner(-90); } };
  T.hole = (cx, cy, r) => { const p = []; for (let i = 0; i < 28; i++) p.push(loc(cx + r*Math.cos(i*Math.PI/14), cy + r*Math.sin(i*Math.PI/14))); H.push(p); };
  T.rhole = (cx, cy, w, h) => H.push([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([a, b]) => loc(cx + a, cy + b)));
  return T;
}
var HX_PLAIN = {sw:0, ew:0, mg:0, draw:(T, l) => T.edge(l)};
function hxE(e, c) {
  if (typeof e !== 'string') return e;
  const F = c.F, w = edgeW(F), ch = /[efFh]/.test(e) ? e : 'e';
  return {sw:w.sw[ch], ew:w.sw[ch], mg:w.mg[ch], draw:(T, l, H) => drawEdge(T, ch, l, F, H)};
}
function hxComp(types, lens, c) {   // CompoundEdge
  const E = types.map(e => hxE(e, c));
  return {sw:E[0].sw, ew:E[E.length-1].ew, mg:Math.max(...E.map(e => e.mg + e.sw)) - E[0].sw,
    draw:(T, l, H) => { let lw = E[0].sw; E.forEach((e, i) => { T.step(e.sw - lw); e.draw(T, lens[i], H); lw = e.ew; }); }};
}
// rectangularWall(w, h, edges[bottom,right,top,left], ignore_widths) -> {pts, holes} with inner rectangle [0,w]x[0,h]
function hxWall(w, h, edges, c, ign = []) {
  const E = [...edges].map(e => hxE(e, c)), H = [], sp = e => e.sw + e.mg, x0 = ign.includes(7) ? 0 : sp(E[3]);
  const T = hxT(turtle(x0, E[0].mg), H), lens = [w, h, w, h];
  for (let i = 0; i < 4; i++) {
    let l = lens[i], e1 = E[i], e2 = E[(i+1)%4];
    if (ign.includes(2*i-1) || ign.includes(2*i+7)) l += E[(i+3)%4].ew;
    if (ign.includes(2*i)) { l += E[(i+1)%4].sw; e2 = HX_PLAIN; }
    if (ign.includes(2*i+1)) e1 = HX_PLAIN;
    E[i].draw(T, l, H);
    T.edge(e2.sw); T.corner(90); T.edge(e1.ew);
  }
  const ox = x0, oy = sp(E[0]), dd = [];
  T.pts.forEach(p => { const q = [p[0]-ox, p[1]-oy], l = dd[dd.length-1]; if (!l || Math.hypot(q[0]-l[0], q[1]-l[1]) > 1e-6) dd.push(q); });
  if (Math.hypot(dd[0][0]-dd[dd.length-1][0], dd[0][1]-dd[dd.length-1][1]) < 1e-6) dd.pop();
  return {pts:dd, holes:H.map(hh => hh.map(p => [p[0]-ox, p[1]-oy]))};
}
function hxChestCfg(c, form) {
  const t = c.t;
  if (!form) return {t, p:2*t, s:t, play:.1*t, fjb:false, fjl:false};
  const h = {t, p:c.num('ChestHinge_pin_height')*t, s:c.num('ChestHinge_hinge_strength')*t, play:c.num('ChestHinge_play')*t, fjb:!!V.ChestHinge_finger_joints_on_box, fjl:!!V.ChestHinge_finger_joints_on_lid};
  if (![h.p, h.s, h.play].every(isFinite)) fail('Invalid value');
  if (h.p/t < 1.2) fail('ChestHinge: pin_height must be >= 1.2');
  return h;
}
// ChestHinge edges: o/O (box), p/P (lid), q (pins), Q (plain, opposite)
function hxChest(k, h, c) {
  const {t, p, s, play, fjb, fjl} = h, pinh = Math.sqrt((0.9*p)**2 - t*t), Fe = hxE('F', c), rev = k === 'O' || k === 'P';
  const run = (T, poly, rest) => { if (rev) { rest(); T.poly(...poly.slice().reverse()); } else { T.poly(...poly); rest(); } };
  if (k === 'o' || k === 'O') return {sw:rev ? p+s : 0, ew:rev ? 0 : p+s, mg:rev ? 0 : p+s, draw:(T, l) => {
    if (rev) { T.hole(l+t, 0, p); T.rhole(l+.5*t, -.5*pinh, t, pinh); } else { T.hole(-t, -s-p, p); T.rhole(-.5*t, -s-p-.5*pinh, t, pinh); }
    run(T, [0, -180, t, [270, p+s], 0, -90, fjb ? t-s : l+t-p-s], () => { if (fjb) Fe.draw(T, l-p, T.H); }); }};
  if (k === 'p' || k === 'P') return {sw:rev ? play+p+s : 0, ew:rev ? 0 : play+p+s, mg:rev ? 0 : play+p+s, draw:(T, l) =>
    run(T, [0, -180, t, -180, 0, [-90, p+s+play], 0, 90, fjl ? t-s-play : l+t-p-s-play], () => { if (fjl) Fe.draw(T, l-p, T.H); })};
  if (k === 'q') return {sw:0, ew:0, mg:play+p+s, draw:(T, l) => {
    const poly = [0, -90, play+s+p-pinh, -90, t, 90, pinh, 90];
    T.poly(...poly);
    if (fjl) { T.edge(t); Fe.draw(T, l, T.H); T.edge(t); T.poly(0, ...poly.slice().reverse()); } else T.poly(l+2*t, ...poly.slice().reverse()); }};
  return {sw:p+s, ew:p+s, mg:0, draw:(T, l) => T.edge(l)};   // Q
}
function hxAdd(P, c, w, h, edges, ign, O, U, Vv, dir) { P.push(panel(hxWall(w, h, edges, c, ign), c.t, O, U, Vv, dir)); }
// ===== end HX =====

// ---- SideHingeBox: side hinge, inner box + outer shell (literal ports of Inner2SidesEdge / Outer2SidesEdge) ----
function shInner(c, g, rev) {   // Inner2SidesEdge ; g = {x, hi, hc, fh}
  const t = c.t, burn = c.burn, htl = g.hi + t - g.hc, hts = g.hc - t, ch = htl - Math.sqrt(htl*htl - hts*hts), ang = Math.asin(hts/htl)/RAD;
  return {sw:0, ew:0, mg:rev ? 0 : t, draw:(T, l, H) => {
    const hole = () => T.rhole((rev ? -1 : 1)*(g.hc - t - burn), g.hc - t, 1.5*t, t), fingers = () => hxE('f', c).draw(T, g.fh, H);
    let path = [g.hi - g.fh - ch, [90-ang, 0], 0, [ang, htl], t + g.x - g.hc]; if (rev) path.reverse();
    const corner = () => T.poly(...path);
    (rev ? [corner, fingers, hole] : [hole, fingers, corner]).forEach(f => f()); }};
}
function shOuter(c, g, rev) {   // Outer2SidesEdge ; g = {x, ho, hc, hr, fh}
  const t = c.t, burn = c.burn;
  return {sw:0, ew:0, mg:rev ? 0 : t, draw:(T, l, H) => {
    const fingers = () => hxE('f', c).draw(T, g.fh, H);
    let path = [0, -90, t, 90, g.ho - g.fh - g.hc, [90, g.hc], t + g.x - g.hc]; if (rev) path.reverse();
    const corner = () => T.poly(...path), hole = () => { const cx = (rev ? -1 : 1)*(g.hc - g.x - t - burn); T.hole(cx, g.hc, g.hr); T.rhole(cx, g.hc, t, 1.5*t); };
    (rev ? [hole, corner, fingers] : [fingers, corner, hole]).forEach(f => f()); }};
}
var shNoop = m => ({sw:0, ew:0, mg:m, draw:T => T.corner(-90)});
BUILD.SideHingeBox = function (c) {
  const {t, num} = c, pl = num('play')*t, hr = num('hinge_radius'), hc = num('hinge_center') || 2*t + hr, latches = Math.round(num('cherrymx_latches'));
  if (![pl, hr, hc].every(isFinite) || hr <= 0) fail('Invalid value');
  let x = num('x'), yi = num('y'), hi = num('h');
  if (V.outside) { x -= 2*t; yi -= 4*t + 2*pl; hi -= 2*t; }
  const yo = yi + 2*(t + pl), ho = hi + t, fhi = 2*hc - t, gap = Math.sqrt(Math.abs(2*hc*hc - (hc-t)**2)) - hc, fho = ho - gap - 2*hc;
  if (!(x > 0 && yi > 0 && hi > 0) || fhi <= 0 || fho <= 0 || hc - t >= hi + t - hc || fhi > hi) fail('Dimensions are inconsistent');
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), nz = V3(0,0,-1), P3 = [];
  const add = (w, h, e, O, U, Vv, d) => hxAdd(P3, c, w, h, e, [], O, U, Vv, d);
  const gi = {x, hi, hc, fh:fhi}, go = {x, ho, hc, hr, fh:fho}, X = x, hout = hi;
  // inner box: cavity [0,x] x [0,yi] x [0,hi], hinged end on the +x side
  add(X, yi, 'FFFF', V3(0,0,-t), ux, uy, nz);
  add(yi, hi, 'fFeF', V3(-t,0,0), uy, uz, V3(-1,0,0));                                                     // D: solid side
  add(X, hi, ['f', shInner(c, gi, false), shNoop(0), 'f'], V3(0,yi+t,0), ux, uz, V3(0,1,0));                // C (back)
  add(X, hi, ['f','f', shInner(c, gi, true), shNoop(t)], V3(X,-t,0), V3(-1,0,0), uz, V3(0,-1,0));          // A (front)
  add(yi, fhi, 'eFfF', V3(X+t,0,fhi), uy, nz, V3(1,0,0));                                                  // inner B (short side, resting on the bottom)
  // outer shell hanging from the top plate (z=hi): walls at y in [-2t-p, -t-p] and [yi+t+p, yi+2t+p], E covers side D
  add(X, yo, 'FEFF', V3(X,yi+t+pl,hout), V3(-1,0,0), V3(0,-1,0), uz);                                      // top plate
  add(X, ho, ['f', shOuter(c, go, false), shNoop(0), 'E'], V3(0,yi+t+pl,hout), ux, nz, V3(0,1,0));          // outer back
  add(X, ho, ['f','E', shOuter(c, go, true), shNoop(t)], V3(X,-t-pl,hout), V3(-1,0,0), nz, V3(0,-1,0));     // outer front
  add(yo, fho, 'fFeF', V3(X+t,-(t+pl),hout), uy, nz, V3(1,0,0));                                           // outer B (short side hanging from the plate)
  if (latches) warn('Cherry MX latches (holes, parts, button) are not drawn.');
  warn('Auxiliary parts (2t x 1.5t shims) are not drawn; box shown closed (inner + shell).');
  // outer shell (plate, walls A/C, short side B') around the pivot: x=X+t-hc, z=hc-t, y axis
  return {kind:'box', panels:P3, openers:[{parts:P3.slice(5), point:V3(X+t-hc,0,hc-t), axis:V3(0,1,0), angle:100}]};
};
USED.SideHingeBox = ['x','y','h','play','hinge_center','hinge_radius','FingerJoint_edge_width','FingerJoint_width'];
NOTES.SideHingeBox = 'Hinged side outlines and hinge holes are faithful; Cherry MX latches are not drawn. ';
