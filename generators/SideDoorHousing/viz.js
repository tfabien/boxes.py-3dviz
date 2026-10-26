// ---- shared helpers (function declarations only, identical in every module) ----
var XWS = null;   // StackableSettings {sw, h, w, hd, a} (edge 's'), if used
function xwStep(T, out) { if (out > 1e-5) { T.corner(-90); T.edge(out); T.corner(90); } else if (out < -1e-5) { T.corner(90); T.edge(-out); T.corner(-90); } }
function xwOne(ch, F) { const ex = F.t + F.extra; return ({e:[0,0], f:[0,ex], F:[ex,0], h:[F.ew+F.t,0], E:[F.t,0], s:[XWS ? XWS.sw : 0, 0]})[ch] || [0,0]; }   // [startWidth, margin]
function xwInfo(s, F) {   // s = character or compound edge [[char,len],...] (CompoundEdge)
  if (typeof s === 'string') { const [sw, mg] = xwOne(s, F); return {sw, ew:sw, mg}; }
  const a = s.map(q => xwOne(q[0], F)), sw = a[0][0];
  return {sw, ew:a[a.length-1][0], mg:Math.max(...a.map(q => q[0]+q[1])) - sw};
}
function xwGrv() {   // GroovedSettings from the form
  const n = k => parseFloat(V['Grooved_'+k]);
  return {style:V.Grooved_style, tri:n('tri_angle'), arc:n('arc_angle'), width:n('width'), gap:n('gap'), margin:n('margin'), inverse:!!V.Grooved_inverse, interleave:!!V.Grooved_interleave};
}
function xwGroove(T, len, G) {   // GroovedEdge 'z'
  if (!len) return;
  if (!(G.width >= 0 && G.width <= 1)) fail('Grooved: width must be in [0, 1]');
  if (!(G.margin >= 0 && G.margin <= 0.5)) fail('Grooved: margin must be in [0, 0.5]');
  if (!(G.gap >= 0 && G.gap <= 1)) fail('Grooved: gap must be in [0, 1]');
  const count = Math.max(0, Math.floor((1 - 2*G.margin + G.gap)/(G.width + G.gap))), inside = Math.max(0, count*(G.width + G.gap) - G.gap);
  const margin = (1 - inside)/2*len, gap = G.gap*len, w = G.width*len;
  let inv = G.inverse ? 1 : -1; if (G.interleave && G.inverse && count % 2 === 0) inv = -inv;
  T.edge(margin);
  for (let i = 0; i < count; i++) {
    if (i > 0) { T.edge(gap); if (G.interleave) inv = -inv; }
    if (G.style === 'flat') T.edge(w);
    else if (G.style === 'arc') { const a = G.arc/2, sl = w/Math.sin(a*RAD)/2; T.corner(-inv*a); T.corner(inv*a, sl); T.corner(inv*a, sl); T.corner(-inv*a); }
    else if (G.style === 'softarc') { const a = G.arc/2, sl = w/Math.sin(a*RAD)/4; T.corner(-inv*a, sl); T.corner(inv*a, sl); T.corner(inv*a, sl); T.corner(-inv*a, sl); }
    else { const sl = w/Math.cos(G.tri*RAD)/2; T.corner(-inv*G.tri); T.edge(sl); T.corner(2*inv*G.tri); T.edge(sl); T.corner(-inv*G.tri); }
  }
  T.edge(margin);
}
function xwStack(T, len, F, holes) {   // StackableEdge 's': feet + finger holes
  const S = XWS, r = S.h/2/(1 - Math.cos(S.a*RAD)), l = r*Math.sin(S.a*RAD);
  if (len - 2*S.w - 4*l < -1e-6) fail('Stackable: edge too short for the feet');
  const x0 = T.x, y0 = T.y, c = Math.cos(T.hd), sn = Math.sin(T.hd), yc = S.h + S.hd + 0.5*F.t, hw = (F.w + F.play)/2, p = F.play/2;
  for (const [o, f] of fingerLayout(len, true, F))
    holes.push([[o-p, yc-hw], [o+f+p, yc-hw], [o+f+p, yc+hw], [o-p, yc+hw]].map(([lx, ly]) => [x0 + lx*c - ly*sn, y0 + lx*sn + ly*c]));
  T.edge(S.w); T.corner(S.a, r); T.corner(-S.a, r); T.edge(len - 2*S.w - 4*l); T.corner(-S.a, r); T.corner(S.a, r); T.edge(S.w);
}
function xwDraw(T, s, len, F, holes, G) {
  if (typeof s !== 'string') { let last = xwInfo(s[0][0], F).sw; for (const [ch, l] of s) { xwStep(T, xwInfo(ch, F).sw - last); xwDraw(T, ch, l, F, holes, G); last = xwInfo(ch, F).ew; } return; }
  if (s === 'z') return xwGroove(T, len, G);
  if (s === 's') return xwStack(T, len, F, holes);
  drawEdge(T, s, len, F, holes);   // f, F, h; e and E = straight
}
// generalised rectangularWall (compound edges, E, z): inner space = [0,w]x[0,h]; E = [bottom, right, top, left]
function xwWall(w, h, E, F, G, ign = []) {   // ign = ignore_widths of rectangularWall
  const I = E.map(s => xwInfo(s, F)), sp = i => I[i].sw + I[i].mg, holes = [], lens = [w, h, w, h], T = turtle(sp(3), I[0].mg);
  for (let i = 0; i < 4; i++) {
    let l = lens[i], e1 = E[i], e2 = E[(i+1) % 4], i1 = I[i], i2 = I[(i+1) % 4];
    if (ign.includes(2*i-1) || ign.includes(2*i+7)) l += I[(i+3) % 4].ew;
    if (ign.includes(2*i)) { l += i2.sw; i2 = xwInfo('e', F); }
    if (ign.includes(2*i+1)) i1 = xwInfo('e', F);
    xwDraw(T, e1, l, F, holes, G); T.edge(i2.sw); T.corner(90); T.edge(i1.ew);
  }
  T.pts.pop();
  const sh = p => [p[0] - sp(3), p[1] - sp(0)], pts = [];
  for (const p of T.pts.map(sh)) if (!pts.length || Math.hypot(p[0]-pts[pts.length-1][0], p[1]-pts[pts.length-1][1]) > 1e-7) pts.push(p);
  return {pts, holes:holes.map(hh => hh.map(sh))};
}
// FingerHoles (fingerHolesAt): holes along direction angDeg from (x,y), in inner-space coordinates
function xwHoles(x, y, len, angDeg, F) {
  const a = angDeg*RAD, c = Math.cos(a), s = Math.sin(a), p = F.play, out = [];
  for (const [o, f] of fingerLayout(len, true, F)) { const cx = o + f/2, hl = (f + p)/2, hw = (F.w + p)/2;
    out.push([[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([lx, ly]) => [x + (cx+lx)*c - ly*s, y + (cx+lx)*s + ly*c])); }
  return out;
}
function xwCirc(x, y, d, n = 24) { const o = []; for (let i = 0; i < n; i++) o.push([x + d/2*Math.cos(2*Math.PI*i/n), y + d/2*Math.sin(2*Math.PI*i/n)]); return o; }
function xwRRect(x, y, dx, dy, r) {   // centred rectangularHole, rounded corners
  r = Math.min(r, dx/2, dy/2); if (r < 1e-6) return [[x-dx/2, y-dy/2], [x+dx/2, y-dy/2], [x+dx/2, y+dy/2], [x-dx/2, y+dy/2]];
  const o = [], cs = [[x+dx/2-r, y+dy/2-r, 0], [x-dx/2+r, y+dy/2-r, 90], [x-dx/2+r, y-dy/2+r, 180], [x+dx/2-r, y-dy/2+r, 270]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= 6; i++) { const a = (a0 + 15*i)*RAD; o.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]); }
  return o;
}


// SideDoorHousing: floor, ceiling, 2 sides, side doors (y axis) with bottom strips; door(s) at the end y = Y (and y = 0 if double_door)
function sdhLatchHole(posx, t, T0) {   // Console2.latch_hole: closed polygon in the edge's local frame
  const s = 0.1*t, p0 = [1.5*t, -90, t, -90, t - 0.5*s, 90], p1 = p0.concat([2*t], p0.slice().reverse()), q = p1.slice(0, -1), path = q.concat([3*t], q.slice().reverse());
  const T = turtle(posx, 2*t); T.hd = Math.PI; path.forEach((v, i) => i % 2 ? T.corner(v) : T.edge(v)); T.pts.pop(); return T.pts;
}
BUILD.SideDoorHousing = function (c) {
  const {t, num, F} = c, X = num('x'), Y = num('y'), H = num('h'), dd = !!V.double_door, lp = 3*t, G = null;
  if (!(X > 0 && Y > 0 && H > 7.1*t)) fail('Dimensions are inconsistent');
  let be = V.bottom_edge;
  if (be === 's') {
    const k = n => parseFloat(V['Stackable_' + n]);
    XWS = {h:k('height')*t, w:k('width')*t, hd:k('holedistance')*t, a:k('angle')};
    XWS.sw = XWS.h + XWS.hd + t;
    if (![XWS.h, XWS.w, XWS.hd, XWS.a].every(isFinite) || XWS.a < 20 || XWS.a > 260 || XWS.h <= 0) fail('Stackable: invalid values (angle 20..260, height > 0)');
    if (k('bottom_stabilizers') > 0) warn('Stabilizer strips (bottom_stabilizers) not drawn.');
  }
  const bw = xwInfo(be, F).ew, Ld = H - 4.05*t - lp, Hd = H - 1.1*t, ign = [1, 6];
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const add = (o, O, U, Vv, dir) => P.push(panel(o, t, O, U, Vv, dir));
  // floor + ceiling (E = protrudes by t in front of the doors; F = side notches)
  add(rectOutline(X, Y, 'ffff', F), V3(0,0,-t), ux, uy, V3(0,0,-1));
  if (dd) add(xwWall(X, Y, ['E','F','E','F'], F, G), V3(0,0,H), ux, uy, V3(0,0,1));
  else add(xwWall(X, Y, ['E','F','F','F'], F, G), V3(0,Y,H+t), ux, V3(0,-1,0), V3(0,0,1));   // E on the door side (y = Y), F on the fixed wall side
  // sides: u = y (door at u = y); latch holes at the top
  const re = [['f', bw + t], ['e', H - t]], le = dd ? [['e', H - t], ['f', bw + t]] : 'f';
  for (const sx of [-1, 1]) {
    const w = xwWall(Y, H, [be, re, 'f', le], F, G, ign), sq = (u, v) => [[u-.55*t, v-.55*t], [u+.55*t, v-.55*t], [u+.55*t, v+.55*t], [u-.55*t, v+.55*t]];
    w.holes.push(sq(Y - 1.55*t, H - lp)); if (dd) w.holes.push(sq(1.55*t, H - lp));
    add(w, V3(sx < 0 ? -t : X, 0, 0), uy, uz, V3(sx, 0, 0));
  }
  // ends: low strip (x by t, down to the foot) + door (x by (h-1.1t), eEeE) + 2 glued lips; without double door: full-height back wall
  const ends = dd ? [1, 0] : [1];
  for (const e of ends) {
    const y0 = e ? Y : 0, sgn = e ? 1 : -1;   // sgn: from outside to inside = -sgn along y
    add(xwWall(X, t, [be, 'F', 'e', 'F'], F, G, ign), V3(0, e ? Y + t : 0, 0), ux, uz, V3(0, sgn, 0));
    const d = xwWall(X, Hd, ['e','E','e','E'], F, G);
    d.holes.push(...xwHoles(0.5*t, 0, Ld, 90, F), ...xwHoles(X - 0.5*t, Hd - (3.05*t + lp), Ld, 270, F));
    d.holes.push(sdhLatchHole(H - 1.2*t - lp, t).map(([lx, ly]) => [X - ly, lx]), sdhLatchHole(lp, t).map(([lx, ly]) => [ly, Hd - lx]));
    add(d, V3(0, e ? Y + t : 0, t), ux, uz, V3(0, sgn, 0.3));
    // lips: 2t x Ld "EeEf", fingers in the door's hole rows
    const lip = () => xwWall(2*t, Ld, ['E','e','E','f'], F, G), zr = t + Hd - (3.05*t + lp) - Ld;
    const xl = e ? t : 0, xr = e ? X : X - t;   // the lip slab extends along W = U x V (negative x if e, positive otherwise)
    add(lip(), V3(xl, y0, t), V3(0, -sgn, 0), uz, V3(0, -sgn, 0));
    add(lip(), V3(xr, y0, zr), V3(0, -sgn, 0), uz, V3(0, -sgn, 0));
  }
  if (!dd) add(xwWall(X, H, [be, 'F', 'f', 'F'], F, G, ign), V3(0, 0, 0), ux, uz, V3(0,-1,0));
  warn('Latches, clamps and springs not drawn.');
  return {kind:'box', panels:P};
};
