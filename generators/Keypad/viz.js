// ---- Keypad : box with stacked key plates and mechanical-switch cutouts (port of keypad.py + keyboard.py) ----
function kpClean(pts) { const o = []; for (const p of pts) { const q = o[o.length-1]; if (!q || Math.hypot(p[0]-q[0], p[1]-q[1]) > 1e-7) o.push(p); }
  if (o.length > 1 && Math.hypot(o[0][0]-o[o.length-1][0], o[0][1]-o[o.length-1][1]) < 1e-6) o.pop(); return o; }
function kpWall(w, h, eds) {
  const sp = e => e.sw + e.mg, T = turtle(sp(eds[3]), eds[0].mg), lens = [w, h, w, h];
  for (let i = 0; i < 4; i++) { const e = eds[i], e2 = eds[(i+1)%4];
    e.draw(T, lens[i]); T.edge(e2.sw); T.corner(90); T.edge(e.sw); }
  const dx = sp(eds[3]), dy = sp(eds[0]);
  return kpClean(T.pts.map(p => [p[0]-dx, p[1]-dy]));
}
function kpFing(T, len, pos, FF, h) { let p = 0;
  for (const [o, ff] of fingerLayout(len, pos, FF)) { const s = pos ? -90 : 90;
    T.edge(o - p); T.corner(s); T.edge(h); T.corner(-s); T.edge(ff); T.corner(-s); T.edge(h); T.corner(s); p = o + ff; }
  T.edge(len - p); }
function kpCircle(cx, cy, d, N = 16) { return Array.from({length:N}, (_, i) => [cx + d/2*Math.cos(2*Math.PI*i/N), cy + d/2*Math.sin(2*Math.PI*i/N)]); }
function kpRoundSquare(cx, cy, size, r, N = 5) {   // rounded square (outer_hole : 15.6, r = 2 ; simple cutout : 14, r = .2)
  const h = size/2 - r, pts = [];
  for (const [sx, sy] of [[1,1],[-1,1],[-1,-1],[1,-1]]) { const a0 = Math.atan2(sy, sx) - Math.PI/4;
    for (let i = 0; i <= N; i++) { const a = a0 + (Math.PI/2)*i/N; pts.push([cx + sx*h + r*Math.cos(a), cy + sy*h + r*Math.sin(a)]); } }
  return pts;
}
// castle_shaped_plate_cutout (burn ignored)
function kpCastle(cx, cy) {
  const half = [0.98, 90, 0.81, -90, 3.5, -90, 0.81, 90, 2.505], full = [...half, 0, ...half.slice().reverse()];
  const btn = []; for (let i = 0; i < 4; i++) btn.push(...full, -90);
  const T = turtle(cx - 7.8 + 0.81, cy - 7.8 + 0.81); T.hd = Math.PI/2;
  btn.forEach((v, i) => i % 2 ? T.corner(v) : T.edge(v));
  return kpClean(T.pts);
}

BUILD.Keypad = function (c) {
  const {t, F, num} = c, h = num('h'), top1 = num('top1_thickness'), top2 = V.top2_enable ? num('top2_thickness') : 0;
  if (!(h > 0) || !(top1 > 0) || !isFinite(top2) || (V.top2_enable && !(top2 > 0))) fail('Invalid value');
  // columns_definition (argparseColumnsDefinition)
  const cols = [];
  for (const s of String(V.columns_definition).split('/')) {
    const m = /^\s*(\d+)\s*@?\s*(\d*\.?\d*)(?:\s*x\s*(\d+))?\s*$/.exec(s);
    if (!m) fail('columns_definition: format not understood');
    const nk = parseInt(m[1]), off = m[2] ? parseFloat(m[2]) : 0, rep = m[3] ? parseInt(m[3]) : 1;
    for (let i = 0; i < rep; i++) cols.push([off, nk]);
  }
  if (!cols.length || cols.length > 30 || cols.reduce((a, q) => a + q[1], 0) > 300 || cols.some(q => !(q[1] > 0))) fail('Invalid columns_definition');
  const BTN = 15.6, GAP = 4, PAD = 10, TRI = 25, sp = BTN + GAP, border = 2*PAD - GAP;
  const X = cols.length*sp + border, Y = Math.max(...cols.map(([o, k]) => o + k*sp)) + border;
  const T2 = t + top1 + top2, F2 = Object.assign({}, F, {t:T2});
  const mk = (FF, pos) => { const h1 = FF.t + FF.extra; return {sw:pos ? 0 : h1, mg:pos ? h1 : 0, draw:(T, l) => kpFing(T, l, pos, FF, h1)}; };
  const E = {f:mk(F, true), F:mk(F, false), G:mk(F2, false), e:{sw:t, mg:0, draw:(T, l) => T.edge(l)}};   // 'e' here = OutSetEdge (E)
  const wall = (w, hh, s) => kpWall(w, hh, [...s].map(ch => E[ch === 'E' ? 'e' : ch]));
  const trHoles = (len, v0) => { const p = F.play, hw = (F.w + p)/2, out = [];
    for (const [o, f] of fingerLayout(TRI, true, F)) { const a0 = o - p/2, a1 = o + f + p/2;
      for (const mir of [false, true]) { const [u0, u1] = mir ? [len - a1, len - a0] : [a0, a1]; out.push([[u0, v0-hw], [u1, v0-hw], [u1, v0+hw], [u0, v0+hw]]); } }
    return out; };
  const P = [], ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), vh = h - 1.5*t;
  const add = (o, th, O, U, Vv, dir) => P.push(panel(o, th, O, U, Vv, dir));
  // walls : G (deep notches) at the top, E (outset by t) at the bottom, v axis pointing down
  const wx = {pts:wall(X, h, 'GFEF'), holes:trHoles(X, vh)}, wy = {pts:wall(Y, h, 'GfEf'), holes:trHoles(Y, vh)};
  add(wx, t, V3(X,0,h), V3(-1,0,0), V3(0,0,-1), V3(0,-1,0));   add(wx, t, V3(0,Y,h), ux, V3(0,0,-1), V3(0,1,0));
  add(wy, t, V3(0,0,h), uy, V3(0,0,-1), V3(-1,0,0));           add(wy, t, V3(X,Y,h), V3(0,-1,0), V3(0,0,-1), V3(1,0,0));
  // key grid
  const keys = []; cols.forEach(([off, nk], j) => { for (let i = 0; i < nk; i++) keys.push([PAD + BTN/2 + j*sp, PAD + BTN/2 + off + i*sp]); });
  const castle = String(V.cutout_type).toLowerCase() === 'castle';
  const plate = (holesFor, th, z) => { const o = rectOutline(X, Y, 'ffff', F); o.holes = holesFor; add(o, th, V3(0,0,z), ux, uy, V3(0,0,1)); };
  let z = h;   // stack from the bottom : hotplug (top2), support (t), key plate (top1)
  if (V.top2_enable) {
    const hs = 1.27, g = (x, y, d) => kpCircle(hs*x, hs*y, d), pin = 2.9;
    plate(keys.flatMap(([kx, ky]) => { const l = [g(0,0,4), g(-3,2,pin), g(2,4,pin)];
      if (V.pcb_mount_enable) l.push(g(-4,0,1.7), g(4,0,1.7)); if (V.led_enable) l.push(g(-1,-4,1), g(1,-4,1)); if (V.diode_enable) l.push(g(-3,-4,1), g(3,-4,1));
      return l.map(p => p.map(q => [q[0] + kx, q[1] + ky])); }), top2, z);
    z += top2;
  }
  plate(keys.map(([kx, ky]) => castle ? kpRoundSquare(kx, ky, BTN, 2) : kpRoundSquare(kx, ky, 14, 0.2)), t, z); z += t;   // support : outer_hole (simple : square without notch)
  plate(keys.map(([kx, ky]) => castle ? kpCastle(kx, ky) : kpRoundSquare(kx, ky, 14, 0.2)), top1, z);                  // key plate
  // bottom plate (recessed, screwed on the 4 corner triangles) + triangles
  const trh = TRI/3, bp = {pts:[[0,0],[X,0],[X,Y],[0,Y]], holes:[[trh,trh],[X-trh,trh],[X-trh,Y-trh],[trh,Y-trh]].map(([x, y]) => kpCircle(x, y, 3))};
  add(bp, t, V3(0,0,0), ux, uy, V3(0,0,-1));
  const tri = (() => { const T = turtle(0, 0), f = mk(F, true); f.draw(T, TRI); T.corner(90); f.draw(T, TRI); T.corner(135); T.edge(TRI*Math.SQRT2); return kpClean(T.pts); })();
  for (const [cx, cy, sx, sy] of [[0,0,1,1],[X,0,-1,1],[X,Y,-1,-1],[0,Y,1,-1]])
    add(tri, t, V3(cx + TRI*sx, cy, sx*sy > 0 ? 2*t : t), V3(-sx,0,0), V3(0,sy,0), V3(0,0,-1));
  warn('Screw holes of the triangles and the notch of the "simple" support are not drawn.');
  return {kind:'box', panels:P};
};
