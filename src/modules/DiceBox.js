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

// ---- DiceBox: dice box, chest hinge, trays with hexagonal holes ----
function dbPolyHole(cx, cy, r, a, n, cr, burn) {   // regularPolygonHole (rounded corners)
  const r_ = Math.max(r, burn + 1e-9) - burn, cr_ = Math.max(cr, burn) - burn, side = 2*r_*Math.sin(Math.PI/n);
  const s = Math.sqrt(2*cr_*cr_*(1 - Math.cos(2*Math.PI/n))), b = Math.sin(Math.PI/n)/Math.sin(2*Math.PI/n)*s, flat = side - 2*b;
  const T = turtle(cx, cy); T.hd = a*RAD; T.edge(r_); T.hd += (90 + 180/n)*RAD; T.edge(b);
  const k = T.pts.length - 1;
  for (let i = 0; i < n; i++) { T.edge(flat); T.corner(360/n, cr_); }
  return T.pts.slice(k, -1);
}
BUILD.DiceBox = function (c) {
  const {t, num} = c, hc = hxChestCfg(c, true);
  const X = c.adj(num('x')), Y = c.adj(num('y')), H = c.adj(num('h')), hl = c.adj(num('lidheight'));
  const hy = hc.p + hc.s, hy2 = hc.play + hc.p + hc.s, pp = hc.p;
  if (!(X > 0 && Y > 0)) fail('Dimensions are inconsistent');
  if (hl - hy2 + t < 0) fail('Lid is too low for the hinge');
  if (H - hy + t < 0) fail('Box is too low for the hinge');
  const o = hxChest('o', hc, c), O = hxChest('O', hc, c), p = hxChest('p', hc, c), P = hxChest('P', hc, c), q = hxChest('q', hc, c);
  const eBack = ['F', hxComp(['e','F'], [hy-t, H-hy+t], c), 'F', hxComp(['F','e'], [H-hy+t, hy-t], c)];
  const plateE = ['f', hxComp(['f','e'], [Y-pp, pp], c), 'f', hxComp(['e','f'], [pp, Y-pp], c)];
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P3 = [];
  const add = (w, h, e, ign, Oo, U, Vv, d) => hxAdd(P3, c, w, h, e, ign, Oo, U, Vv, d);
  // dice tray: hexagonal holes + magnets (diceCB callback, coordinates of the inner rectangle)
  const plate = (z, d) => {
    const w = hxWall(X, Y, plateE, c), xi = num('x') - 2*t, yi = num('y') - 2*t, cr = num('hex_hole_corner_radius');
    const apo = (Math.min(xi, yi) - 4*t)/6, r = apo*2/Math.sqrt(3), pr = 2*apo + t, xc = xi/2, yc = yi/2, ctr = [[xc, yc]];
    for (let i = 0; i < 6; i++) ctr.push([xc + pr*Math.cos(i*Math.PI/3), yc + pr*Math.sin(i*Math.PI/3)]);
    if (apo > 0) ctr.forEach(([x, y]) => w.holes.push(dbPolyHole(x, y, r, 30, 6, cr, c.burn)));
    const md = num('magnet_diameter'), mo = t + md/2, circ = (x, y) => { const q2 = []; for (let i = 0; i < 28; i++) q2.push([x + md/2*Math.cos(i*Math.PI/14), y + md/2*Math.sin(i*Math.PI/14)]); w.holes.push(q2); };
    circ(mo, mo); circ(xi - mo, mo);
    P3.push(panel(w, t, V3(0,0,z), ux, uy, d));
  };
  const hb = H - hy + t, hlb = hl - hy2 + t, zr = H + t + hy2, zl0 = H + 2*t;   // hinge axis at z = H+t
  add(X, Y, 'ffff', [], V3(0,0,-t), ux, uy, V3(0,0,-1));                                       // bottom
  add(X, H, 'FFFF', [1,2,5,6], V3(0,0,0), ux, uz, V3(0,-1,0));                                  // box front
  add(X, H, eBack, [], V3(X,Y+t,H), V3(-1,0,0), V3(0,0,-1), V3(0,1,0));                          // box back (flipped)
  add(Y, hb, ['F','f',o,'f'], [5,6], V3(-t,0,0), uy, uz, V3(-1,0,0));                           // box left side
  add(Y, hb, [O,'f','F','f'], [5,6], V3(X+t,0,H-hy+t), uy, V3(0,0,-1), V3(1,0,0));              // box right side (flipped)
  plate(H, uz);                                                                                  // box tray
  plate(H + t, uz);                                                                              // lid tray
  add(X, hl, 'FFFF', [1,2,5,6], V3(0,0,zl0), ux, uz, V3(0,-1,0));                               // lid front
  add(X, hlb, ['F','F',q,'F'], [], V3(X,Y+t,H+hl+2*t), V3(-1,0,0), V3(0,0,-1), V3(0,1,0));       // lid back (q at the bottom)
  add(Y, hlb, [P,'f','F','f'], [5,6], V3(-t,0,zr), uy, uz, V3(-1,0,0));                          // lid left side
  add(Y, hlb, ['F','f',p,'f'], [5,6], V3(X+t,0,H+hl+2*t), uy, V3(0,0,-1), V3(1,0,0));            // lid right side (flipped)
  add(X, Y, 'ffff', [], V3(0,0,H+hl+2*t), ux, uy, uz);                                           // top
  warn('Hinge: outlines are ported literally; discs/pins are not drawn; lid shown closed.');
  // axis = centre of the rings: y=Y+t, z=H+t
  return {kind:'box', panels:P3, openers:[{parts:P3.slice(6), point:V3(0,Y+t,H+t), axis:V3(-1,0,0), angle:105}]};
};
USED.DiceBox = ['x','y','h','lidheight','hex_hole_corner_radius','magnet_diameter','ChestHinge_finger_joints_on_box','ChestHinge_finger_joints_on_lid','ChestHinge_hinge_strength','ChestHinge_pin_height','ChestHinge_play','FingerJoint_edge_width','FingerJoint_width'];
NOTES.DiceBox = 'Hexagonal holes and magnets are drawn; hinge discs and pins are not drawn. ';
