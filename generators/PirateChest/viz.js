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

// ---- PirateChest: chest with a polygonal lid, chest hinges (default ChestHinge settings) ----
// polygonal lid side (topside): returns the outline (reference-rectangle frame) + smooth edges [{x,y,hd,len}] in traversal order
function pcTopside(c, hc, y, n, bottom) {
  const t = c.t, hy2 = hc.play + hc.p + hc.s, side = 2*Math.tan(Math.PI/(2*(n-1)))*(y/2), a = 180/(n-1);
  const be = hxChest(bottom, hc, c), fe = hxE('f', c), H = [];
  const T = hxT(turtle(t, be.mg), H), S = turtle(0, 0), edges = [];
  be.draw(T, y); T.corner(90);
  S.x = y; S.y = bottom === 'p' ? -hy2 : 0; S.hd = 90*RAD;
  const lens = [];
  for (let i = 0; i < n; i++) lens.push(i === 0 ? (bottom === 'p' ? side/2 + hy2 : side/2) : i === n-1 ? (bottom === 'P' ? side/2 + hy2 : side/2) : side);
  lens.forEach((l, i) => {
    edges.push({x:S.x, y:S.y, hd:S.hd, len:l}); fe.draw(T, l, H); S.edge(l);
    if (i < n-1) { T.corner(a); S.hd += a*RAD; }
  });
  T.corner(90);
  const oy = hy2, dd = [];
  T.pts.forEach(p => { const q = [p[0]-t, p[1]-oy], l = dd[dd.length-1]; if (!l || Math.hypot(q[0]-l[0], q[1]-l[1]) > 1e-6) dd.push(q); });
  if (Math.hypot(dd[0][0]-dd[dd.length-1][0], dd[0][1]-dd[dd.length-1][1]) < 1e-6) dd.pop();
  return {pts:dd, edges, side};
}
BUILD.PirateChest = function (c) {
  const {t, num} = c, n = Math.round(num('n')), hc = hxChestCfg(c, false);
  const X = c.adj(num('x')), Y = c.adj(num('y')), hy = hc.p + hc.s, hy2 = hc.play + hc.p + hc.s;
  let h = c.sub(num('h'), t);
  if (!(n >= 3)) fail('Number of lid sides must be >= 3');
  if (!(X > 0 && Y > 0)) fail('Dimensions are inconsistent');
  h -= hy; if (h < 0) fail('Box is too low for the hinge');
  const o = hxChest('o', hc, c), O = hxChest('O', hc, c), q = hxChest('q', hc, c), Q = hxChest('Q', hc, c);
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P3 = [];
  const add = (w, hh, e, ign, Oo, U, Vv, d) => hxAdd(P3, c, w, hh, e, ign, Oo, U, Vv, d);
  add(X, Y, 'FFFF', [], V3(0,0,-t), ux, uy, V3(0,0,-1));
  add(X, h, ['f','F',Q,'F'], [2,5], V3(0,0,0), ux, uz, V3(0,-1,0));                                    // front
  add(Y, h, ['f','f',o,'f'], [5], V3(-t,0,0), uy, uz, V3(-1,0,0));                                     // side (hinge o on the back side)
  add(Y, h, ['f','f',O,'f'], [2], V3(X+t,Y,0), V3(0,-1,0), uz, V3(1,0,0));                             // side (hinge O on the back side)
  add(X, h+hy, ['f', hxComp(['F','e'], [h, hy], c), 'e', hxComp(['e','F'], [hy, h], c)], [], V3(0,Y+t,0), ux, uz, V3(0,1,0));   // back
  // lid: hinge axis at z = h+hy, reference line of the bottom of the sides at z = h+hy+hy2
  const zr = h + hy + hy2, pl = pcTopside(c, hc, Y, n, 'p'), pr = pcTopside(c, hc, Y, n, 'P');
  P3.push(panel(pl, t, V3(X+t,Y,zr), V3(0,-1,0), uz, V3(1,0,0)));
  P3.push(panel(pr, t, V3(-t,0,zr), uy, uz, V3(-1,0,0)));
  // top panels: one slab per polygon edge, placed outside (mitre joints g/G/H approximated as straight notches)
  const g = pl.edges.map(e => { const dx = Math.cos(e.hd), dz = Math.sin(e.hd);
    return {A:[Y - e.x, zr + e.y], B:[Y - (e.x + dx*e.len), zr + e.y + dz*e.len], len:e.len}; });
  const cen = [0, 0]; g.forEach(e => { cen[0] += e.A[0] + e.B[0]; cen[1] += e.A[1] + e.B[1]; }); cen[0] /= 2*g.length; cen[1] /= 2*g.length;
  g.forEach((e, j) => {
    const Bp = e.B, Ap = e.A, dy = (Ap[0]-Bp[0])/e.len, dz = (Ap[1]-Bp[1])/e.len;   // from the bottom (back side) upwards
    const outw = [-dz, dy], mid = [(Ap[0]+Bp[0])/2 - cen[0], (Ap[1]+Bp[1])/2 - cen[1]], flip = outw[0]*mid[0] + outw[1]*mid[1] < 0;
    // U = +x donne W = (0,-dz,dy) ; sinon U = -x
    const wy = -dz, wz = dy, inward = wy*mid[0] + wz*mid[1] < 0, back = j === g.length-1, front = j === 0;
    const edges = back ? [q,'F','f','F'] : front ? ['F','F','e','F'] : ['F','F','f','F'];
    const Uu = inward ? V3(-1,0,0) : ux, xo = inward ? X : 0;
    hxAdd(P3, c, X, e.len, edges, [], V3(xo, Bp[0], Bp[1]), Uu, V3(0,dy,dz), V3(0, (inward ? -1 : 1)*wy, (inward ? -1 : 1)*wz));
  });
  warn('Mitre joints (g/G/H) of the lid are drawn as straight notches; hinges: outlines ported literally (discs/pins not drawn); chest hinge uses default settings (the form only has "Hinge" settings, which this generator does not use).');
  // axis = centre of the rings: y=Y+t, z=h+hy
  return {kind:'box', panels:P3, openers:[{parts:P3.slice(5), point:V3(0,Y+t,h+hy), axis:V3(-1,0,0), angle:110}]};
};
