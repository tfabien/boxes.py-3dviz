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


// SlidingLidBox: box with slides (lower/upper rails) + sliding lid; the front is at y = Y, the back at y = 0
BUILD.SlidingLidBox = function (c) {
  const {t, num, F} = c;
  let be = V.bottom_edge;
  if (be === 's') { warn('Bottom edge "s" (stackable) drawn as "F".'); be = 'F'; }
  const gap = (1 + num('margin_t'))*t;
  let X = num('x'), Y = num('y'), H = num('h');
  if (V.outside) { X = c.adj(X); Y = c.adj(Y); H = c.sub(H, c.spc('F') + c.spc(be)) - gap; }
  const rail = num('rail')*t, rm = rail - c.burn, hp = H + gap, ms = num('margin_s')*t, lidY = X - 2*ms;
  if (![X, Y, H, lidY, X - 2*rm, rail, rm].every(v => v > 0)) fail('Dimensions are inconsistent');
  const lip = V.lid_type === 'lip';
  if (lip && lidY - 2*rm <= 0) fail('Lid too narrow for the lip');
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const add = (o, O, U, Vv, dir) => { const q = panel(o, t, O, U, Vv, dir); P.push(q); return q; };
  const hz = H - 0.5*t;   // height of the lower rail holes (the top of the rail is flush at H)
  // side walls: u = y (u=0: back), right edge "fE" on the front side
  for (const sx of [-1, 1]) {
    const w = xwWall(Y, hp, [be, [['f', H], ['E', gap]], 'F', 'f'], F);
    w.holes.push(...xwHoles(Y, hz, Y, 180, F));   // lowerRailHoles: along the whole wall
    add(w, V3(sx < 0 ? -t : X, 0, 0), uy, uz, V3(sx, 0, 0));
  }
  P.push(panel(rectOutline(X, Y, 'ffff', F), t, V3(0,0,-t), ux, uy, V3(0,0,-1)));                         // bottom
  // upper rails (horizontal plate z in [hp, hp+t]) and lower rails (z in [H-t, H])
  const top = xwWall(Y, rail, ['f','E','e','e'], F), bot = xwWall(Y, rail, ['f','e','e','f'], F);
  add(top, V3(0, 0, hp + t), uy, ux, V3(-1,0,1));  add(top, V3(X, 0, hp), uy, V3(-1,0,0), V3(1,0,1));
  add(bot, V3(0, 0, H), uy, ux, V3(-1,0,0));       add(bot, V3(X, 0, H - t), uy, V3(-1,0,0), V3(1,0,0));
  // lid (on top of the lower rails); E = protrudes by t at the front
  const lidEdges = lip ? ['e', [['E', rm], ['f', lidY - 2*rm], ['E', rm]], 'e', 'e'] : ['e','E','e','e'], lid = xwWall(Y, lidY, lidEdges, F);
  if (V.lid_type === 'hole') lid.holes.push(xwRRect(Y - num('hole_width'), lidY/2, num('hole_width'), num('hole_length'), num('hole_radius')));
  const lidParts = [add(lid, V3(ms, 0, H + t), uy, ux, V3(0,1,0.4))];
  if (lip) lidParts.push(add(xwWall(lidY - 2*rm, gap, ['F','e','e','e'], F), V3(ms + rm, Y + t, H + t), ux, uz, V3(0,1,0.4)));   // front lip
  // back wall (y in [-t,0], height H+gap, lower rail holes) and front wall (y in [Y,Y+t], height H)
  const back = xwWall(X, hp, [be, 'F', [['E', rm], ['f', X - 2*rm], ['E', rm]], 'F'], F);
  back.holes.push(...xwHoles(0, hz, rail, 0, F), ...xwHoles(X, hz, rail, 180, F));
  add(back, V3(0, 0, 0), ux, uz, V3(0,-1,0));
  add(xwWall(X, H, [be, 'F', 'e', 'F'], F), V3(0, Y + t, 0), ux, uz, V3(0,1,0));
  add(xwWall(X - 2*rm, rail, ['F','e','e','e'], F), V3(rm, 0, hp), ux, uy, V3(0,-1,1));                 // small back rail
  // opening: the lid slides forwards (+y) along the rails, over 85 % of the depth
  return {kind:'box', panels:P, openers:[{parts:lidParts, slide:V3(0, 0.85*Y, 0)}]};
};
