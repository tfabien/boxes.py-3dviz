BUILD.FlexBox5Plus = function (c) {
  const {t, num, F} = c;
  let x = num('x'), h = num('h'), dt = num('top_diameter'), db = num('bottom_diameter');
  if (V.outside) { x -= 2*t; h -= 2*t; dt -= 2*t; db -= 2*t; }
  const latch = num('latchsize')*t;
  x = Math.max(x, latch + 2*t + (dt+db)/2);
  const r1 = dt/2, r2 = db/2, dc = x - r1 - r2;
  if (dc <= 0 || r1 <= 0 || r2 <= 0 || h <= 0) fail('Dimensions are inconsistent');
  const sn = (r1-r2)/dc; if (Math.abs(sn) > 1) fail('Diameters are too different for this center distance');
  const a = Math.asin(sn)/RAD, l = dc*Math.cos(a*RAD), c1 = (180+2*a)*RAD*r1, c2 = (180-2*a)*RAD*r2, Hw = h + 2*t;
  const n = Math.max(0, Math.floor(num('reinforcements')) || 0), w = num('reinforcement_width');
  const ro = num('reinforcement_open'), rf = num('reinforcement_fillet'), fAdj = num('flex_unfold_adjust'), jh = num('flex_jig_height');
  const lw = num('latch_width'), lh = num('latch_height'), ld = num('latch_hole'), lm = num('latch_margin');
  if (![w, lw, lh, ld, lm, ro, rf, fAdj, jh].every(isFinite)) fail('Invalid value');
  // cuts aligned on a finger, on the latch side (see flexbox5plus.py: _cuts)
  const xb = fingerLayout(l, true, F).map(q => l - (q[0] + q[1])), xt = fingerLayout(l - latch, true, F).map(q => latch + q[0]);
  const pick = xs => { const ok = xs.filter(x => x >= ro - 1e-9); return ok.length ? Math.min(...ok) : (xs.length ? Math.max(...xs) : ro); };
  const xbc = pick(xb), tdc = pick(xt), eb = l - xbc, fr = Math.min(rf, w);
  if (n && ro >= 0 && (tdc - latch > l - latch || eb < 0 || fr > Math.min(eb, l - tdc))) fail('reinforcement_open is too large');
  if (n && w >= Math.min(r1, r2)) fail('reinforcement_width must be smaller than the smallest radius');
  if (V.turn_latch && lw + 2*lm > Hw) fail('latch_width is too large for the height of the box');
  const total = 2*l + c1 + c2, rowsZ = [], holes = [];
  for (let i = 0; i < n; i++) rowsZ.push(t + (i+1)*(Hw - 2*t)/(n+1));
  const upiv = total - (lh/2 + lm), zpiv = Hw/2;     // pivot close to the right end, vertically centred
  if (V.turn_latch) {
    holes.push({c:[upiv, zpiv, ld/2]});                                                        // pivot (languette de fermeture)
  }
  const spec = {x:h, latch, start:[r2, t], wallStartOp:3,
    ops:[['f', l], ['c', 180+2*a, r1], ['latch', latch], ['f', l-latch], ['c', 180-2*a, r2]],
    segs:[['F', l-latch], ['X', c2], ['F', l], ['X', c1], ['L', latch]], rowsZ, holes,
    keepFinger: (which, o, f) => ro < 0 || (which === 0 ? latch + o >= tdc - 1e-9 : l - (o + f) >= xbc - 1e-9)};
  const m = flexModel(c, spec);
  // reinforcements: side plate without the latch tab, hollowed out (same circle centres, radii reduced by w)
  if (n) {
    const ring = flexModel(c, {x:h, latch, start:[r2, t], wallStartOp:3,
      ops:[['f', l], ['c', 180+2*a, r1], ['e', latch], ['f', l-latch], ['c', 180-2*a, r2]], segs:[['F', l]]});
    const hole = flexModel(c, {x:h, latch, start:[r2, t+w], wallStartOp:0,
      ops:[['e', l], ['c', 180+2*a, r1-w], ['e', l], ['c', 180-2*a, r2-w]], segs:[['F', l]]});
    const ux = V3(1,0,0), uy = V3(0,1,0);
    let outline = {pts:ring.outline, holes:[hole.outline.slice().reverse()]};
    if (ro >= 0) {   // ring open on the latch side: C-shaped outline (same path as flexbox5plus.py)
      const fp = (T, len, keep, start, end) => { const hh = t + F.extra; let pos = start;
        for (const [o, f] of fingerLayout(len, true, F)) { if (!keep(o, f)) continue;
          T.edge(o - pos); T.corner(-90); T.edge(hh); T.corner(90); T.edge(f); T.corner(90); T.edge(hh); T.corner(-90); pos = o + f; }
        T.edge(end - pos); };
      const Tp = turtle(r2, t); Tp.edge(l); Tp.corner(180+2*a, r1);          // start of the top edge
      const T = turtle(Tp.x + tdc*Math.cos(Tp.hd), Tp.y + tdc*Math.sin(Tp.hd)), L2 = l - latch; T.hd = Tp.hd;
      fp(T, L2, (o, f) => o >= tdc - latch - 1e-9, tdc - latch, L2); T.corner(180-2*a, r2);
      fp(T, l, (o, f) => o + f <= eb + 1e-9, 0, eb);
      T.corner(90); T.edge(w - fr); T.corner(90, fr); T.edge(eb - fr); T.corner(-(180-2*a), r2 - w);
      T.edge(l - tdc - fr); T.corner(90, fr); T.edge(w - fr); T.corner(90);
      T.pts.pop();
      outline = {pts:T.pts, holes:[]};
    }
    rowsZ.forEach(zc => m.extras.push(panel(outline, t, V3(0, 0, zc - t/2), ux, uy, V3(0, 0, (zc - Hw/2)/(Hw/2 || 1)))));
  }
  // turning latch: 2 butterfly pieces on both sides of the closing tab, pivoting on the round hole; k=0 locked (vertical), k=1 free (90°)
  if (V.turn_latch) {
    const q = m.wallAt(upiv), hd = q.hd, nx = Math.sin(hd), ny = -Math.cos(hd), tx = Math.cos(hd), ty = Math.sin(hd);
    const rc = lh/4, s2 = 0.15*lh, L2 = lw - 2*rc, half = 2*Math.atan2(2*s2, L2)/RAD, R = L2/(2*Math.sin(half*RAD));
    const T = turtle(rc, 0);
    for (let i = 0; i < 2; i++) { T.corner(half); T.corner(-2*half, R); T.corner(half); T.corner(90, rc); T.edge(lh-2*rc); T.corner(90, rc); }
    T.pts.pop();
    const bar = T.pts.map(p => [p[1] - lh/2, p[0] - lw/2]);        // long axis along z (locked)
    const U = V3(tx, ty, 0), Vz = V3(0, 0, 1), N = V3(nx, ny, 0), P0 = V3(q.x, q.y, zpiv);
    const outer = panel(bar, t, P0.clone().add(N.clone().multiplyScalar(t)), U, Vz, N.clone());
    const inner = panel(bar, t, P0.clone().sub(N.clone().multiplyScalar(t)), U, Vz, N.clone().negate());
    m.extras.push(outer, inner);
    m.openers = [{parts:[outer, inner], point:P0.clone().add(N.clone().multiplyScalar(t/2)), axis:N, angle:90}];
    m.latchParts = [outer, inner]; m.pivotU = upiv; m.latchShare = 0.4;   // opening: latch first, then the door unfolds
  }
  // unfolding of the flexible part: estimated stretch t/r (+ adjustment) and comb jig (see flexbox5plus.py: _flexElong, jigComb)
  const e1 = Math.max(-.5, (V.flex_unfold_auto ? t/r1 : 0) + fAdj/100), e2 = Math.max(-.5, (V.flex_unfold_auto ? t/r2 : 0) + fAdj/100);
  warn('Unfolded flexible zone stretch: top arc {0} %, bottom arc {1} %.', (e1*100).toFixed(1), (e2*100).toFixed(1));
  if (V.flex_jig) {   // combs: wall notches (x2) + one comb per reinforcement (teeth at the reinforcement holes)
    const L2 = l - latch, u2 = L2 + c2*(1 + e2), W = u2 + l, hh = t + F.extra;
    const comb = (fingers, row) => {
      const Tj = turtle(0, 0); Tj.edge(W); Tj.corner(90); Tj.edge(jh); Tj.corner(90);
      let pos = W;
      for (const [x, f] of fingers.slice().sort((p, q) => q[0] - p[0])) { Tj.edge(pos - (x + f)); Tj.corner(-90); Tj.edge(hh); Tj.corner(90); Tj.edge(f); Tj.corner(90); Tj.edge(hh); Tj.corner(-90); pos = x; }
      Tj.edge(pos); Tj.corner(90); Tj.edge(jh); Tj.corner(90); Tj.pts.pop();
      m.extras.push(panel(Tj.pts, t, V3(m.bb.minX, m.bb.maxY + 30 + row*(jh + hh + 8), 0), V3(1,0,0), V3(0,1,0), V3(0,1,0)));
    };
    const all = fingerLayout(L2, true, F).concat(fingerLayout(l, true, F).map(q => [u2 + q[0], q[1]]));
    comb(all, 0); comb(all, 1);
    const ringF = fingerLayout(L2, true, F).filter(q => spec.keepFinger(0, q[0], q[1])).concat(fingerLayout(l, true, F).filter(q => spec.keepFinger(1, q[0], q[1])).map(q => [u2 + q[0], q[1]]));
    for (let i = 0; i < n; i++) comb(ringF, 2 + i);
  }
  return m;
};
