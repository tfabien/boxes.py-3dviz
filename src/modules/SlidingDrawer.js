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


// SlidingDrawer: outer case (open at the front) + drawer (tall front face with grooved handle)
USED.SlidingDrawer = ['x','y','h','hi','play','Grooved_style','Grooved_arc_angle','Grooved_tri_angle','Grooved_width','Grooved_gap','Grooved_margin','Grooved_inverse','Grooved_interleave'];
NOTES.SlidingDrawer = 'Tall drawer front placed on the opening side (deduced from the grip groove); drawer centred using the play. ';
BUILD.SlidingDrawer = function (c) {
  const {t, num, F} = c, G = xwGrv();
  let x = c.adj(num('x')), y = c.adj(num('y')), h = c.adj(num('h'));
  let hi = num('hi') ? c.adj(num('hi')) : h;
  const p = num('play')*t;
  y += t;
  if (!V.outside) { x += 4*t + 2*p; y += 3*t + 2*p; h += 3*t + 2*p; hi += 3*t + 2*p; }
  const x2 = x - (2*t + 2*p), y2 = y - (2*t + 2*p), h2 = h - (t + 2*p); hi -= (t + 2*p);
  if (![x2, y2, h2, hi, x, y, h].every(v => v > 0)) fail('Dimensions are inconsistent');
  if (hi > h2 + 1e-9) fail('hi must be <= h');
  const split = Math.abs(hi - h2) > 1e-9;
  const e1 = split ? [['F', hi], ['E', h2 - hi]] : 'F', e2 = split ? [['E', h2 - hi], ['F', hi]] : 'F';
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [], x0 = p + t, y0 = p + t, z0 = p + t;
  const add = (o, O, U, Vv, dir) => { const q = panel(o, t, O, U, Vv, dir); P.push(q); return q; };
  const dr = (a, b, d) => V3(a, b, 0).multiplyScalar(1).add(V3(0, -d, 0));   // explode: outwards + drawer pulled towards the front
  // drawer (inner cavity [x0,x0+x2] x [y0,y0+y2], floor z0)
  add(xwWall(x2, h2, ['F', e1, 'z', e2], F, G), V3(x0, y0 - t, z0), ux, uz, V3(0,-1,-0.3));                          // tall front face (groove on top)
  add(xwWall(x2, hi, ['F','F','e','F'], F, G), V3(x0, y0 + y2 + t, z0), ux, uz, V3(0,0.6,0.3));                    // low back wall
  add(xwWall(y2, hi, ['f','f','e','f'], F, G), V3(x0 - t, y0, z0), uy, uz, dr(-1, 0, 0.5));                         // sides
  add(xwWall(y2, hi, ['f','f','e','f'], F, G), V3(x0 + x2, y0, z0), uy, uz, dr(1, 0, 0.5));
  add(xwWall(y2, x2, ['F','f','F','f'], F, G), V3(x0, y0, z0), uy, ux, V3(0,-0.5,-1));                              // drawer bottom (u=y, v=x)
  // outer case: cavity [0,x] x [0,y] x [0,h], open at y=0
  add(xwWall(y, x, ['F','F','F','e'], F, G), V3(0, 0, 0), uy, ux, V3(0,0,-1));                                      // underside
  add(xwWall(y, x, ['F','F','F','e'], F, G), V3(0, 0, h + t), uy, ux, V3(0,0,1));                                   // top
  add(xwWall(y, h, ['f','f','f','e'], F, G), V3(-t, 0, 0), uy, uz, V3(-1,0,0));
  add(xwWall(y, h, ['f','f','f','e'], F, G), V3(x, 0, 0), uy, uz, V3(1,0,0));
  add(xwWall(x, h, ['f','F','f','F'], F, G), V3(0, y + t, 0), ux, uz, V3(0,1,0));                                   // back
  // opening: the whole drawer (5 parts) slides out of the open face (y = 0), keeping ~t of overlap
  const travel = Math.min(0.8*(y2 + 2*t), y - p - t);
  return {kind:'box', panels:P, openers:[{parts:P.slice(0, 5), slide:V3(0, -travel, 0)}]};
};
