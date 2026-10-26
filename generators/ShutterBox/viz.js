// ==== ShutterBox: sliding-door box (flexible roller shutter) ====
// Port of gens/ShutterBox.py: sides (finger holes along the floor, the polygonal arcs and the vertical wall),
// end walls, bottom, polygonal walls with mitre fingers (a/A = angle 90/n, b/B = half), L rails, corner pieces,
// flexible door (slotted strip wound into the slideway) + handle.
function sbFL(F, ang) {   // FingerJointBase.fingerLength -> [l1, l2]
  const t = F.t, ex = F.extra;
  if (ang >= 90 || ang <= -90) return [t + ex, 0];
  if (ang < 0) return [Math.sin(-ang*RAD)*t + ex, 0];
  const a = 90 - (180 - ang)/2, fl = t*Math.tan(a*RAD), b = 90 - 2*a;
  return [fl + ex, -Math.sin(b*RAD)*fl];
}
function sbEdge(ch, F, a) {   // {sw: startWidth, mg: margin, h: finger depth, pos, fing}
  if ('fFaAbB'.includes(ch)) {
    const ang = 'aA'.includes(ch) ? a : 'bB'.includes(ch) ? a/2 : 90, [l1, l2] = sbFL(F, ang), pos = ch === ch.toLowerCase(), h = l1 - l2;
    return {sw: pos ? l2 : l1, mg: pos ? h : 0, h, pos, fing: true};
  }
  return {sw: ch === 'E' ? F.t : 0, mg: 0, h: 0, pos: true, fing: false};
}
function sbFing(T, len, pos, F, h) {
  let p = 0;
  for (const [o, f] of fingerLayout(len, pos, F)) { const s = pos ? -90 : 90;
    T.edge(o - p); T.corner(s); T.edge(h); T.corner(-s); T.edge(f); T.corner(-s); T.edge(h); T.corner(s); p = o + f; }
  T.edge(len - p);
}
function sbClean(pts) {
  const o = [];
  for (const p of pts) if (!o.length || Math.hypot(p[0]-o[o.length-1][0], p[1]-o[o.length-1][1]) > 1e-7) o.push(p);
  if (o.length > 1 && Math.hypot(o[0][0]-o[o.length-1][0], o[0][1]-o[o.length-1][1]) < 1e-7) o.pop();
  return o;
}
// rectangularWall generalised to the a/A/b/B/E edges (inner space = [0,w]x[0,hh]); E = [bottom, right, top, left]
function sbWall(w, hh, E, F, a) {
  const I = [...E].map(ch => sbEdge(ch, F, a)), sp = i => I[i].sw + I[i].mg, T = turtle(sp(3), I[0].mg), lens = [w, hh, w, hh];
  for (let i = 0; i < 4; i++) {
    const e = I[i], e2 = I[(i+1) % 4];
    if (e.fing) sbFing(T, lens[i], e.pos, F, e.h); else T.edge(lens[i]);
    T.edge(e2.sw); T.corner(90); T.edge(e.sw);
  }
  T.pts.pop();
  return sbClean(T.pts.map(p => [p[0] - sp(3), p[1] - sp(0)]));
}
// frame in the style of Boxes.py moveTo (degrees)
function sbFrame(x, y, a) {
  const f = {x, y, a, mv(dx, dy, da) { const c = Math.cos(f.a*RAD), s = Math.sin(f.a*RAD); f.x += dx*c - dy*s; f.y += dx*s + dy*c; f.a += da; },
    holes(out, F, x0, y0, len) {   // fingerHolesAt(x0, y0, len, 0) from the current frame
      const c = Math.cos(f.a*RAD), s = Math.sin(f.a*RAD), bx = f.x + x0*c - y0*s, by = f.y + x0*s + y0*c, hw = (F.w + F.play)/2, p = F.play/2;
      for (const [o, fw] of fingerLayout(len, true, F))
        out.push([[o-p, -hw], [o+fw+p, -hw], [o+fw+p, hw], [o-p, hw]].map(([lx, ly]) => [bx + lx*c - ly*s, by + lx*s + ly*c]));
    }};
  return f;
}
// path of the door's neutral line in the (y,z) plane: segments ['s', len] | ['c', deg(+left), R]
function sbPath(y0, z0, hd0, segs, L) {
  let y = y0, z = z0, hd = hd0, s = 0; const out = [{s, y, z, hd}];
  for (const sg of segs) {
    if (s >= L - 1e-9) break;
    if (sg[0] === 's') { const len = Math.min(sg[1], L - s); y += Math.cos(hd*RAD)*len; z += Math.sin(hd*RAD)*len; s += len; out.push({s, y, z, hd}); continue; }
    const R = sg[2], sgn = Math.sign(sg[1]), len = Math.min(Math.abs(sg[1])*RAD*R, L - s), n = Math.max(1, Math.ceil(len/2)), tot = sgn*len/R;
    const cy = y - sgn*R*Math.sin(hd*RAD), cz = z + sgn*R*Math.cos(hd*RAD), py = y - cy, pz = z - cz, h0 = hd, s0 = s;
    for (let j = 1; j <= n; j++) { const an = tot*j/n, co = Math.cos(an), si = Math.sin(an);
      out.push({s: s0 + len*j/n, y: cy + co*py - si*pz, z: cz + si*py + co*pz, hd: h0 + an/RAD}); }
    const q = out[out.length-1]; y = q.y; z = q.z; hd = q.hd; s = q.s;
  }
  return out;
}
// door: flat strip (L x Wd, thickness t) wound along the path; flex slots + handle holes = cut-out texture
function sbDoor(c, pts, L, Wd, x0) {
  const {t, F} = c, nrm = q => [-Math.sin(q.hd*RAD), Math.cos(q.hd*RAD)];
  const k = Math.max(2, Math.min(12, 8192/L, 4096/Wd)), cv = document.createElement('canvas'); cv.width = Math.ceil(L*k); cv.height = Math.ceil(Wd*k);
  const g2 = cv.getContext('2d'); g2.fillStyle = '#d9b27a'; g2.fillRect(0, 0, cv.width, cv.height);
  g2.globalCompositeOperation = 'destination-out';
  const cut = (u0, u1, v0, v1) => g2.fillRect(u0*k, (Wd - v1)*k, (u1-u0)*k, (v1-v0)*k);
  g2.strokeStyle = '#000'; g2.lineWidth = Math.max(0.3*k, 1.5); g2.lineCap = 'butt';
  for (const [u, segs] of flexLines(L - 2*t, Wd, c.fl, c.burn)) for (const [y0, y1] of segs) {
    g2.beginPath(); g2.moveTo((2*t + u)*k, (Wd - y0)*k); g2.lineTo((2*t + u)*k, (Wd - y1)*k); g2.stroke(); }
  const hw = (F.w + F.play)/2, p = F.play/2;   // fingerHolesAt(t, t, h-2t): handle holes
  for (const [o, f] of fingerLayout(Wd - 2*t, true, F)) cut(t - hw, t + hw, t + o - p, t + o + f + p);
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshStandardMaterial({map: tex, alphaTest: .5, side: THREE.DoubleSide, roughness: .8});
  const g = new THREE.Group(), pos3 = (q, off, v) => { const n = nrm(q); return [x0 + v, q.y + off*n[0], q.z + off*n[1]]; };
  const strip = secs => {   // secs = [{a:[x,y,z], b:[...], ua:[u,v], ub:[u,v]}]
    const pos = [], uv = [], idx = [];
    secs.forEach((s, i) => { pos.push(...s.a, ...s.b); uv.push(...s.ua, ...s.ub); if (i) { const q = 2*(i-1); idx.push(q, q+2, q+1, q+1, q+2, q+3); } });
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    bg.setIndex(idx); bg.computeVertexNormals(); g.add(new THREE.Mesh(bg, mat)); };
  const h2 = t/2, u = q => q.s/L;
  for (const off of [h2, -h2]) strip(pts.map(q => ({a: pos3(q, off, 0), b: pos3(q, off, Wd), ua: [u(q), 0], ub: [u(q), 1]})));
  for (const [v, tv] of [[0, .003], [Wd, .997]]) strip(pts.map(q => ({a: pos3(q, -h2, v), b: pos3(q, h2, v), ua: [u(q), tv], ub: [u(q), tv]})));
  for (const [q, tu] of [[pts[0], .002], [pts[pts.length-1], .998]])
    strip([{a: pos3(q, -h2, 0), b: pos3(q, h2, 0), ua: [tu, .003], ub: [tu, .003]}, {a: pos3(q, -h2, Wd), b: pos3(q, h2, Wd), ua: [tu, .997], ub: [tu, .997]}]);
  return {g, dir: V3(0, 0, 1), unfold: null, pts: []};
}

BUILD.ShutterBox = function (c) {
  const {t, num, F} = c, n = 3, a = 90/n, X = num('x'), l = num('y'), h = num('h'), dbl = V.style === 'double';
  let r = num('radius');
  if (!(X > 0 && l > 0 && h > 0) || !isFinite(r)) fail('Dimensions are inconsistent');
  if (!r) r = h/2;
  r = Math.min(r, h/2);
  if (r <= 2.5*t) fail('Radius too small (must exceed 2.5 x thickness)');
  if (l - (dbl ? 2 : 1)*r <= 0) fail('Dimensions are inconsistent (y too short for the radius)');
  const ls = 2*Math.sin(a/2*RAD)*(r - 2.5*t), hasV = h - 2*r > 2*t, ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const add = (o, O, U, Vv, dir) => { const p = panel(o, t, O, U, Vv, dir); P.push(p); return p; };

  // ---- sides (y x h): outline + finger holes (floor, polygonal arcs, vertical wall) ----
  const holes = [], S = sbFrame(0, 0, 0);
  if (dbl) {
    const S2 = sbFrame(0, 0, 0);
    S2.holes(holes, F, r, 2*t, l - 2*r);
    S2.mv(r, 2.5*t, 180 - a/2);
    for (let i = 0; i < n; i++) { S2.holes(holes, F, 0, 0.5*t, ls); S2.mv(ls, 0, -a); }
    if (hasV) { S2.mv(0, 0, a/2); S2.holes(holes, F, 0, 0.5*t, h - 2*r); }
  } else S.holes(holes, F, 0, 2*t, l - r);
  S.mv(l - r, 2.5*t, a/2);
  for (let i = 0; i < n; i++) { S.holes(holes, F, 0, -0.5*t, ls); S.mv(ls, 0, a); }
  if (hasV) { S.mv(0, 0, -a/2); S.holes(holes, F, 0, -0.5*t, h - 2*r); }
  const T = turtle(0, 0);
  T.fingers(l, true, F); T.corner(90); T.fingers(h - r, true, F);
  T.corner(-90); T.edge(t); T.corner(90); T.corner(90, r + t);
  if (dbl) { T.edge(l - 2*r); T.corner(90, r + t); T.corner(90); T.edge(t); T.corner(-90); T.fingers(h - r, true, F); }
  else { T.edge(l - r); T.corner(90); T.edge(t); T.fingers(h, true, F); }
  T.pts.pop();
  const side = {pts: sbClean(T.pts), holes};
  add(side, V3(-t,0,0), uy, uz, V3(-1,0,0)); add(side, V3(X,0,0), uy, uz, V3(1,0,0));

  // ---- end walls (x x h) and bottom ----
  add(sbWall(X, dbl ? h - r : h, dbl ? 'fFeF' : 'fFEF', F, a), V3(0,0,0), ux, uz, V3(0,-1,0));
  add(sbWall(X, h - r, 'fFeF', F, a), V3(0,l+t,0), ux, uz, V3(0,1,0));
  add(sbWall(l, X, 'FFFF', F, a), V3(0,0,0), uy, ux, V3(0,0,-1));

  // ---- polygonal walls (arcs of radius r-2.5t as n chords of length ls) + floor + vertical wall ----
  const slab = (y, z, hd, w, e) => { const co = Math.cos(hd*RAD), si = Math.sin(hd*RAD);
    add(sbWall(w, X, e, F, a), V3(0, y, z), V3(0, co, si), ux, V3(0, si, -co)); };
  const right = (y0, floorLen, floorE) => {   // floor, then arc upwards, then vertical wall (right side)
    let y = y0, z = 2.5*t;
    slab(y, z, 0, floorLen, floorE); y += floorLen;
    const R = r - 2.5*t;
    for (let k = 0; k < n; k++) {
      const hd = a/2 + k*a, e = k === 0 ? 'fafB' : k === n-1 ? (hasV ? 'fbfA' : 'fefA') : 'fafA';
      slab(y, z, hd, ls, e); y += Math.cos(hd*RAD)*ls; z += Math.sin(hd*RAD)*ls;
    }
    if (hasV) slab(l - 2.5*t, r, 90, h - 2*r, 'fefB');
  };
  if (dbl) {
    if (hasV) slab(2.5*t, h - r, 270, h - 2*r, 'fBfe');
    let y = 2.5*t, z = r;
    for (let k = 0; k < n; k++) {
      const hd = 270 + a/2 + k*a, e = k === 0 ? (hasV ? 'fAfb' : 'fAfe') : k === n-1 ? 'fBfa' : 'fAfa';
      slab(y, z, hd, ls, e); y += Math.cos(hd*RAD)*ls; z += Math.sin(hd*RAD)*ls;
    }
    right(r, l - 2*r, 'fbfb');
  } else right(0, l - r, 'fbfe');

  // ---- L rails (rails / rails2): plates of t glued against the inside of the sides, grouped around the centres of the upper arcs ----
  const rail = (R1, R2, bref) => {
    const T2 = turtle(0, 0);
    if (dbl) { T2.edge(l - 2*r); T2.corner(90, R1); T2.corner(90); T2.edge(t); T2.corner(90); T2.corner(-90, R2); T2.edge(l - 2*r); T2.corner(-90, R2);
      T2.corner(90); T2.edge(t); T2.corner(90); T2.corner(90, R1); }
    else { T2.edge(l - r); T2.corner(90, R1); T2.corner(90); T2.edge(t); T2.corner(90); T2.corner(-90, R2); T2.edge(l - r); T2.corner(90); T2.edge(t); T2.corner(90); }
    T2.pts.pop();
    const a0 = dbl ? r : 0;
    return sbClean(T2.pts.map(p => [p[0] + a0, bref - p[1]]));   // (a,b) = (world y, world z)
  };
  const rOut = rail(r + t, r, h + t), rIn = rail(r - 1.5*t, r - 2.5*t, h - 1.5*t);
  for (const [xo, dx] of [[0, -1], [X - t, 1]]) for (const o of [rOut, rIn]) add(o, V3(xo,0,0), uy, uz, V3(dx,0,0));

  // ---- corner pieces (cornerRadius): fill the bottom angle, on both sides ----
  const T3 = turtle(0, 0); T3.edge(r); T3.corner(90); T3.edge(r); T3.corner(180); T3.corner(-90, r); T3.pts.pop();
  const cr = sbClean(T3.pts);
  for (const [xo, dx] of [[0, -1], [X - t, 1]]) {
    add(cr.map(p => [l - r + p[0], p[1]]), V3(xo,0,0), uy, uz, V3(dx,0,0));
    if (dbl) add(cr.map(p => [r - p[0], p[1]]), V3(xo,0,0), uy, uz, V3(dx,0,0));
  }

  // ---- flexible door (closed: along the upper rails) + handle ----
  const Wd = X - 0.2*t, rho = r - 0.75*t, L = dbl ? l - 2*r + Math.PI*r + 3*t : l - r + Math.PI*r/2 + 3*t, x0 = 0.1*t;
  const pts = dbl
    ? sbPath(r - rho, h - r, 90, [['c', -90, rho], ['s', l - 2*r], ['c', -90, rho], ['s', h - 2*r], ['c', -90, rho], ['s', l - 2*r]], L)
    : sbPath(0, h - 0.75*t, 0, [['s', l - r], ['c', -90, rho], ['s', h - 2*r], ['c', -90, rho], ['s', l - r]], L);
  P.push(sbDoor(c, pts, L, Wd, x0));
  const q0 = pts[0], hd0 = q0.hd*RAD, nn = [-Math.sin(hd0), Math.cos(hd0)], hx = [Math.cos(hd0), Math.sin(hd0)];
  add(sbWall(2*t, Wd - 2*t, 'eeef', F, a), V3(x0 + t, q0.y + nn[0]*t/2 + hx[0]*0.5*t, q0.z + nn[1]*t/2 + hx[1]*0.5*t), V3(0, nn[0], nn[1]), ux, V3(0, nn[0], nn[1]));
  return {kind: 'box', panels: P};
};
