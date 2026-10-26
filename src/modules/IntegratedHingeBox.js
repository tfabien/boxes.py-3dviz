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

// ---- IntegratedHingeBox: chest hinge (ChestHinge o/O, p/P, q, Q) - literal port of the outlines ----
BUILD.IntegratedHingeBox = function (c) {
  const {t, num} = c, hl = num('lidheight'), hc = hxChestCfg(c, true);
  const X = c.adj(num('x')), Y = c.adj(num('y')), H = c.adj(num('h')), hy = hc.p + hc.s, hy2 = hc.play + hc.p + hc.s;
  if (!(X > 0 && Y > 0)) fail('Dimensions are inconsistent');
  if (hl - hy2 < 0) fail('Lid is too low for the hinge');
  if (H - hy < 0) fail('Box is too low for the hinge');
  const o = hxChest('o', hc, c), O = hxChest('O', hc, c), p = hxChest('p', hc, c), P = hxChest('P', hc, c), q = hxChest('q', hc, c);
  const eBack = ['F', hxComp(['F','e'], [H-hy, hy], c), 'e', hxComp(['e','F'], [hy, H-hy], c)];
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P3 = [], zr = H + hy2, zt = H + hl;   // zr: reference line of the bottom of the lid sides; hinge axis at z=H
  const add = (w, h, e, ign, Oo, U, Vv, d) => hxAdd(P3, c, w, h, e, ign, Oo, U, Vv, d);
  add(Y, H-hy, ['F','f',O,'f'], [2], V3(X+t,Y,0), V3(0,-1,0), uz, V3(1,0,0));
  add(Y, hl-hy2, [p,'f','F','f'], [1], V3(X+t,Y,zr), V3(0,-1,0), uz, V3(1,0,0));
  add(Y, H-hy, ['F','f',o,'f'], [5], V3(-t,0,0), uy, uz, V3(-1,0,0));
  add(Y, hl-hy2, [P,'f','F','f'], [6], V3(-t,0,zr), uy, uz, V3(-1,0,0));
  add(X, H, 'FFeF', [], V3(0,0,0), ux, uz, V3(0,-1,0));
  add(X, H, eBack, [], V3(0,Y+t,0), ux, uz, V3(0,1,0));
  add(X, hl, 'FFeF', [], V3(X,0,zt), V3(-1,0,0), V3(0,0,-1), V3(0,-1,0));           // lid front: F edge on top (rotated by 180 deg)
  add(X, hl-hy2, ['F','F',q,'F'], [], V3(X,Y+t,zt), V3(-1,0,0), V3(0,0,-1), V3(0,1,0)); // lid back: q (pins) at the bottom
  add(X, Y, 'ffff', [], V3(0,0,-t), ux, uy, V3(0,0,-1));
  add(X, Y, 'ffff', [], V3(0,0,zt), ux, uy, uz);
  warn('Hinge: outlines/holes are ported literally; hinge discs/pins are not drawn; lid shown closed.');
  // axis = centre of the hinge rings: y=Y+t, z=H
  return {kind:'box', panels:P3, openers:[{parts:[1,3,6,7,9].map(i => P3[i]), point:V3(0,Y+t,H), axis:V3(-1,0,0), angle:105}]};
};
USED.IntegratedHingeBox = ['x','y','h','lidheight','ChestHinge_finger_joints_on_box','ChestHinge_finger_joints_on_lid','ChestHinge_hinge_strength','ChestHinge_pin_height','ChestHinge_play','FingerJoint_edge_width','FingerJoint_width'];
NOTES.IntegratedHingeBox = 'Chest hinge outlines are faithful; hinge discs and pins are not drawn. ';
