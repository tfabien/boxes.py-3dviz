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

// ---- HingeBox: box with a lid on cabinet hinges (CabinetHinge u/U) ----
function hxCabinet(c, top) {
  const t = c.t, n = Math.round(c.num('CabinetHinge_eyes_per_hinge')), p = c.num('CabinetHinge_play')*t, e = c.num('CabinetHinge_eye')*t,
        sp = c.num('CabinetHinge_spacing')*t, hn0 = Math.round(c.num('CabinetHinge_hinges')), tp = top ? 1 : 0;
  if (![n, p, e, sp, hn0].every(isFinite) || n < 1) fail('Invalid value (hinges)');
  let poly = top ? [sp, 90, e+p] : [sp+p, 90, e+p, 0];
  for (let i = 0; i < n; i++) {
    if ((i % 2) ^ tp) poly.push(...(i === 0 ? [-90, t+2*p, 90] : [90, t+2*p, 90]));
    else poly.push(t-p, -90, t, -90, t-p);
  }
  if ((n % 2) ^ tp) poly.push(0, e+p, 90, p+sp); else { poly.pop(); poly.push(-90, e+p, 90, sp); }
  const width = (t+p)*n + p + 2*sp;
  return {sw:0, ew:0, mg:0, draw:(T, l) => {
    const hn = Math.min(hn0, Math.floor(l/width));
    if (hn < 1) { warn('Hinge is too wide for the edge (drawn straight).'); return T.edge(l); }
    if (hn === 1) T.edge((l-width)/2);
    for (let j = 0; j < hn; j++) {
      for (let i = 0; i < n; i++) if (!(((i % 2) ^ tp))) T.rhole(sp + .5*t + p + i*(t+p), e + 2.5*t, t, t);
      T.poly(...poly);
      if (j < hn-1) T.edge((l - hn*width)/(hn-1));
    }
    if (hn === 1) T.edge((l-width)/2); }};
}
BUILD.HingeBox = function (c) {
  const {t, num} = c, hl = num('lidheight');
  let X = c.adj(num('x')), Y = c.adj(num('y')), H = c.adj(num('h')), s = c.sub(num('splitlid'), t);
  if (!(X > 0 && Y > 0 && H > 0 && hl > 0)) fail('Dimensions are inconsistent');
  if (s > X || s < 0) s = 0;
  const u = hxCabinet(c, false), U = hxCabinet(c, true), P = [], ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1);
  const add = (w, h, e, O, Uu, Vv, d) => hxAdd(P, c, w, h, e, [], O, Uu, Vv, d);
  // box (bottom z=0): front (e, or u if the lid is split), back u
  add(X, H, ['F','F', s ? u : 'e', 'F'], V3(0,0,0), ux, uz, V3(0,-1,0));
  add(X, H, ['F','F', u, 'F'], V3(0,Y+t,0), ux, uz, V3(0,1,0));
  add(Y, H, 'Ffef', V3(-t,0,0), uy, uz, V3(-1,0,0));  add(Y, H, 'Ffef', V3(X,0,0), uy, uz, V3(1,0,0));
  add(X, Y, 'ffff', V3(0,0,-t), ux, uy, V3(0,0,-1));
  // lid (z from H to H+hl)
  add(X, hl, [U,'F','F','F'], V3(0,Y+t,H), ux, uz, V3(0,1,0));
  const zt = H + hl, top = V3(0,0,1);
  if (s) {
    add(X, hl, [U,'F','F','F'], V3(0,0,H), ux, uz, V3(0,-1,0));
    add(s, hl, 'eeFf', V3(-t,0,H), uy, uz, V3(-1,0,0));              // front half: f on the front wall side (y=0)
    add(s, hl, 'efFe', V3(X+t,s,H), V3(0,-1,0), uz, V3(1,0,0));
    add(Y-s, hl, 'efFe', V3(-t,s,H), uy, uz, V3(-1,0,0));            // back half: f on the back wall side (y=Y)
    add(Y-s, hl, 'eeFf', V3(X+t,Y,H), V3(0,-1,0), uz, V3(1,0,0));
    add(X, s, 'ffef', V3(0,0,zt), ux, uy, top);
    add(X, Y-s, 'efff', V3(0,s,zt), ux, uy, top);
  } else {
    add(X, hl, 'eFFF', V3(0,0,H), ux, uz, V3(0,-1,0));
    add(Y, hl, 'efFf', V3(-t,0,H), uy, uz, V3(-1,0,0));  add(Y, hl, 'efFf', V3(X,0,H), uy, uz, V3(1,0,0));
    add(X, Y, 'ffff', V3(0,0,zt), ux, uy, top);
  }
  warn('Hinge parts (eyelets to insert + pin) are not drawn; the lid is shown closed.');
  // opening: axis at the joint, inner face of the back wall ('inside' eyes: axis on the junction line; y position approximated)
  return {kind:'box', panels:P, openers:[{parts:P.slice(5), point:V3(0,Y,H), axis:V3(-1,0,0), angle:105}]};
};
