// ---- CardBox : playing-card box with sliding lid (port of cardbox.py) ----
function cbClean(pts) { const o = []; for (const p of pts) { const q = o[o.length-1]; if (!q || Math.hypot(p[0]-q[0], p[1]-q[1]) > 1e-7) o.push(p); }
  if (o.length > 1 && Math.hypot(o[0][0]-o[o.length-1][0], o[0][1]-o[o.length-1][1]) < 1e-6) o.pop(); return o; }
function cbSections(s) {   // argparseSections : "65*4", "130/2", "65 70"
  const out = [];
  for (const part of String(s).trim().split(/\s+|:/)) { let m;
    if ((m = /^(\d+(?:\.\d+)?)\/(\d+)$/.exec(part))) for (let i = 0; i < +m[2]; i++) out.push(+m[1]/+m[2]);
    else if ((m = /^(\d+(?:\.\d+)?)\*(\d+)$/.exec(part))) for (let i = 0; i < +m[2]; i++) out.push(+m[1]);
    else if (isFinite(parseFloat(part)) && /^\d+(\.\d+)?$/.test(part)) out.push(parseFloat(part));
    else fail('sx: format not understood'); }
  if (!out.length || out.length > 40 || out.some(v => !(v > 0))) fail('sx: invalid sections');
  return out;
}
function cbWall(w, h, eds) {   // rectangularWall, eds = [bottom, right, top, left] specs {sw, mg, draw}
  const sp = e => e.sw + e.mg, T = turtle(sp(eds[3]), eds[0].mg), lens = [w, h, w, h];
  for (let i = 0; i < 4; i++) { const e = eds[i], e2 = eds[(i+1)%4];
    e.draw(T, lens[i]); T.edge(e2.sw); T.corner(90); T.edge(e.sw); }
  const dx = sp(eds[3]), dy = sp(eds[0]);
  return cbClean(T.pts.map(p => [p[0]-dx, p[1]-dy]));
}
// fingerHolesAt(pos, 0, len, 90) : rectangles centred on line u=pos (along 'v') or v=pos (along 'u')
function cbHoles(F, pos, len, along) {
  const p = F.play, hw = (F.w + p)/2, out = [];
  for (const [o, f] of fingerLayout(len, true, F)) { const a0 = o - p/2, a1 = o + f + p/2;
    out.push(along === 'v' ? [[pos-hw, a0], [pos+hw, a0], [pos+hw, a1], [pos-hw, a1]] : [[a0, pos-hw], [a1, pos-hw], [a1, pos+hw], [a0, pos+hw]]); }
  return out;
}

BUILD.CardBox = function (c) {
  const {t, F, num} = c, sx = cbSections(V.sx), n = sx.length, right = V.openingdirection === 'right';
  const hRaw = num('h'), yRaw = num('y');
  const H = V.outside ? hRaw - 3*t : hRaw, X = (n + 1)*t + sx.reduce((a, b) => a + b, 0);
  const Y = V.outside ? yRaw - 2*t : right ? yRaw + 2*t : yRaw;
  if (!(H > 0 && Y > 4*t)) fail('Inconsistent dimensions');
  const fh = V.fingerhole === 'custom' ? num('fingerhole_depth') : V.fingerhole === 'deep' ? hRaw - t - 10 : Math.min(hRaw/4, 35);
  if (!isFinite(fh)) fail('Invalid value');
  const f = {sw:0, mg:F.extra, draw:null}, fin = (pos) => { const h1 = t + F.extra; return {sw:0, mg:h1, draw:(T, l) => cbFing(T, l, pos, F, h1)}; };
  function cbFing(T, len, pos, FF, h) { let p = 0;
    for (const [o, ff] of fingerLayout(len, pos, FF)) { const s = pos ? -90 : 90;
      T.edge(o - p); T.corner(s); T.edge(h); T.corner(-s); T.edge(ff); T.corner(-s); T.edge(h); T.corner(s); p = o + ff; }
    T.edge(len - p); }
  const E = {
    e: {sw:0, mg:0, draw:(T, l) => T.edge(l)},
    E: {sw:t, mg:0, draw:(T, l) => T.edge(l)},                       // outset by t
    f: {sw:0, mg:t + F.extra, draw:(T, l) => cbFing(T, l, true, F, t + F.extra)},
    F: {sw:t + F.extra, mg:0, draw:(T, l) => cbFing(T, l, false, F, t + F.extra)},
    a: {sw:0, mg:0, draw:(T, l) => { T.corner(90); T.edge(t); T.corner(-90); T.edge(l); T.corner(-90); T.edge(t); T.corner(90); }},   // InsetEdge : slot for the lid
    A: {sw:0, mg:0, draw:(T, l) => { const d = fh - 10;                                                                              // FingerHoleEdge : U cutout
      if (l/2 - 10 < 0 || d < 0) return T.edge(l);
      T.edge(l/2 - 10); T.corner(90); T.edge(d); T.corner(-180, 10); T.edge(d); T.corner(90); T.edge(l/2 - 10); }},
  };
  const wall = (w, h, s, holes = []) => ({pts:cbWall(w, h, [...s].map(ch => E[ch])), holes});
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const lidParts = [], add = (o, O, U, Vv, dir, lid) => { const q = panel(o, t, O, U, Vv, dir); P.push(q); if (lid) lidParts.push(q); };
  const H1 = H + t;                           // inner height of outer walls
  const divX = []; { let pos = .5*t; for (const s of sx.slice(0, -1)) { pos += s + t; divX.push(pos); } }
  // bottom
  add(wall(X, Y, 'ffff', divX.flatMap(p => cbHoles(F, p, Y, 'v'))), V3(0,0,-t), ux, uy, V3(0,0,-1));
  const dh = divX.flatMap(p => cbHoles(F, p, H, 'v'));     // divider holes in the two 'f'-pair walls
  if (!right) {
    add(wall(X, H1, 'FFEF', dh), V3(0,Y+t,0), ux, uz, V3(0,1,0));                       // back (top E : raised by t)
    add(wall(X, H1, 'FFaF', dh), V3(0,0,0), ux, uz, V3(0,-1,0));                        // front (top a : slot for the lid)
    add(wall(Y, H1, 'FfFf'), V3(-t,0,0), uy, uz, V3(-1,0,0));  add(wall(Y, H1, 'FfFf'), V3(X,0,0), uy, uz, V3(1,0,0));   // outer sides
    add(wall(Y, H, 'Aeee'), V3(t,0,H), uy, V3(0,0,-1), V3(1,0,0));                     // inner sides (glued inside), cutout at the top
    add(wall(Y, H, 'Aeee'), V3(X,0,H), uy, V3(0,0,-1), V3(-1,0,0));
    add(wall(Y, t, 'eefe'), V3(t,0,H1), uy, V3(-1,0,0), V3(0,0,1));                    // rails (lips) on top of the sides
    add(wall(Y, t, 'feee'), V3(X,0,H1), uy, V3(-1,0,0), V3(0,0,1));
    add(wall(X - .2*t, Y, 'eeFe'), V3(.1*t, Y, H1), ux, V3(0,-1,0), V3(0,0,1), 1);          // lid (F edge = grip end, front)
    add(wall(X - .2*t, t, 'fEeE'), V3(.1*t, -t, H1), ux, V3(0,-1,0), V3(0,0,1), 1);         // lid lip
    if (V.add_lidtopper) add(wall(X - 2.2*t, Y, 'eeee'), V3(1.1*t, 0, H1), ux, uy, V3(0,0,1), 1);
  } else {
    add(wall(Y, H1, 'FFEF'), V3(-t,0,0), uy, uz, V3(-1,0,0));                           // left end (top E)
    add(wall(Y, H1, 'FFaF'), V3(X,0,0), uy, uz, V3(1,0,0));                             // right end (top a : lid exit)
    add(wall(X, H1, 'FfFf', dh), V3(0,0,0), ux, uz, V3(0,-1,0));  add(wall(X, H1, 'FfFf', dh), V3(0,Y+t,0), ux, uz, V3(0,1,0));   // front, back
    add(wall(Y, H, 'Aeee'), V3(t,0,H), uy, V3(0,0,-1), V3(1,0,0));                     // inner sides (against the end walls)
    add(wall(Y, H, 'Aeee'), V3(X,0,H), uy, V3(0,0,-1), V3(-1,0,0));
    add(wall(X, t, 'feee'), V3(0,0,H1), ux, uy, V3(0,0,1));                            // rails (lips) on top of front / back
    add(wall(X, t, 'eefe'), V3(0,Y-t,H1), ux, uy, V3(0,0,1));
    add(wall(X, Y - .2*t, 'eFee'), V3(0,.1*t,H), ux, uy, V3(0,0,1), 1);                    // lid (F edge = grip end, right)
    add(wall(Y - .2*t, t, 'fEeE'), V3(X+t,.1*t,H1), uy, ux, V3(0,0,1), 1);                 // lid lip
    if (V.add_lidtopper) add(wall(X, Y - 2.2*t, 'eeee'), V3(0,1.1*t,H1), ux, uy, V3(0,0,1), 1);
    let x0 = t; for (const s of sx) { add(wall(s, H, 'eeee'), V3(x0, t, 0), ux, uz, V3(0,-1,0)); add(wall(s, H, 'eeee'), V3(x0, Y, 0), ux, uz, V3(0,1,0)); x0 += s + t; }   // inlays (front/back, glued inside)
  }
  divX.forEach(p => add(wall(H, Y, 'fAff'), V3(p + t/2, 0, 0), uz, uy, V3(1,0,0)));      // dividers
  return {kind:'box', panels:P, openers:[{parts:lidParts, slide:right ? V3(X, 0, 0) : V3(0, -Y, 0)}]};   // lid slides along its rails over the rail length (X or Y), towards the open end
};
