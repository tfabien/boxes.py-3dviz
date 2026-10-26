(function(){
// ---- helpers (port of Boxes.py edge widths / rectangularWall with angled finger joints) ----
// FingerJointBase.fingerLength(angle) -> [fingerlength+extra, spacerecess]
function fjl(a, F) {
  if (a >= 90 || a <= -90) return [F.t + F.extra, 0];
  if (a < 0) return [Math.sin(-a*RAD)*F.t + F.extra, 0];
  const aa = 90 - (180 - a)/2, fl = F.t*Math.tan(aa*RAD), b = 90 - 2*aa;
  return [fl + F.extra, -Math.sin(b*RAD)*fl];
}
// {sw: startWidth, mg: margin} of edge char ch (e f F h E s); f/F honour the joint angle
function EM(ch, F, st, ang = 90) {
  if (ch === 'f') { const [a, b] = fjl(ang, F); return {sw:b, mg:a - b}; }
  if (ch === 'F') return {sw:fjl(ang, F)[0], mg:0};
  if (ch === 'h') return {sw:F.ew + F.t, mg:0};
  if (ch === 'E') return {sw:F.t, mg:0};
  if (ch === 's') return {sw:st.h + st.hd + F.t, mg:0};
  return {sw:0, mg:0};
}
function fing(T, len, pos, F, h) {
  let p0 = 0;
  for (const [o, f] of fingerLayout(len, pos, F)) { const s = pos ? -90 : 90;
    T.edge(o - p0); T.corner(s); T.edge(h); T.corner(-s); T.edge(f); T.corner(-s); T.edge(h); T.corner(s); p0 = o + f; }
  T.edge(len - p0);
}
function holeLine(T, len, yc, F, holes) {
  const x0 = T.x, y0 = T.y, c = Math.cos(T.hd), s = Math.sin(T.hd), hw = (F.w + F.play)/2, p = F.play/2;
  for (const [o, f] of fingerLayout(len, true, F))
    holes.push([[o-p, yc-hw], [o+f+p, yc-hw], [o+f+p, yc+hw], [o-p, yc+hw]].map(([lx, ly]) => [x0 + lx*c - ly*s, y0 + lx*s + ly*c]));
}
// StackableBaseEdge (bottom): feet
function stack(T, len, st) {
  if (!st.h) return T.edge(len);
  const r = st.h/2/(1 - Math.cos(st.ang*RAD)), l = r*Math.sin(st.ang*RAD);
  T.edge(st.w); T.corner(st.ang, r); T.corner(-st.ang, r); T.edge(len - 2*st.w - 4*l);
  T.corner(-st.ang, r); T.corner(st.ang, r); T.edge(st.w);
}
function draw(T, ch, len, F, st, holes, ang = 90) {
  if (ch === 'f' || ch === 'F') { const [a, b] = fjl(ang, F); return fing(T, len, ch === 'f', F, a - b); }
  if (ch === 'h') { holeLine(T, len, F.ew + F.t/2, F, holes); return T.edge(len); }
  if (ch === 's') { holeLine(T, len, st.h + st.hd + F.t/2, F, holes); return stack(T, len, st); }
  T.edge(len);
}
// rectangularWall: inner rect = [0,w]x[0,h]; ed = 4 chars (bottom,right,top,left); o.ang = joint angle per edge; o.ig = ignore_widths
function rect(w, h, ed, F, st, o = {}) {
  ed = Array.isArray(ed) ? ed : ed.split('');
  const ig = o.ig || [], an = o.ang || [90, 90, 90, 90], M = i => EM(ed[i], F, st, an[i]), sp = i => M(i).sw + M(i).mg;
  const holes = [], T = turtle(ig.includes(7) ? 0 : sp(3), M(0).mg), lens = [w, h, w, h];
  for (let i = 0; i < 4; i++) {
    const i1 = (i+1) % 4, ip = (i+3) % 4; let l = lens[i], s1 = M(i).sw, s2 = M(i1).sw;
    if (ig.includes(2*i-1) || ig.includes(2*i+7)) l += M(ip).sw;
    if (ig.includes(2*i)) { l += M(i1).sw; s2 = 0; }
    if (ig.includes(2*i+1)) s1 = 0;
    draw(T, ed[i], l, F, st, holes, an[i]);
    T.edge(s2); T.corner(90); T.edge(s1);
  }
  T.pts.pop();
  const ox = sp(3), oy = sp(0), sh = p => [p[0] - ox, p[1] - oy];
  return {pts:T.pts.map(sh), holes:holes.map(hh => hh.map(sh))};
}
// closed polygon of equal edges ch, exterior angle turn, inner polygon starting at (0,0) heading +x (floor of AngledBox)
function polyOutline(lens, turn, ch, F, st) {
  const sw = EM(ch, F, st).sw, T = turtle(0, -sw), holes = [], tn = Math.tan(turn/2*RAD);
  for (const l of lens) { draw(T, ch, l, F, st, holes); T.edge(sw*tn); T.corner(turn); T.edge(sw*tn); }
  T.pts.pop(); return {pts:T.pts, holes};
}
// plain walk (no edges): vertices of the polygon given [len, turn, len, turn...]
function walk(B, x0 = 0, y0 = 0, h0 = 0) {
  const T = turtle(x0, y0), V = []; T.hd = h0*RAD;
  for (let i = 0; i < B.length; i += 2) { V.push({x:T.x, y:T.y, th:T.hd/RAD, len:B[i]}); T.edge(B[i]); T.corner(B[i+1]); }
  return V;
}
function inPoly(p, poly) {
  let r = false;
  for (let i = 0, j = poly.length-1; i < poly.length; j = i++) { const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1]) + a[0]) r = !r; }
  return r;
}
// rounded rectangle hole (rectangularHole with r) centred at cx,cy
function rrect(cx, cy, dx, dy, r) {
  r = Math.min(r, dx/2, dy/2); const out = [], n = 6;
  [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]].forEach(([sx, sy, a0]) => {
    const ccx = cx + sx*(dx/2 - r), ccy = cy + sy*(dy/2 - r);
    for (let i = 0; i <= n; i++) { const a = (a0 + 90*i/n)*RAD; out.push([ccx + r*Math.cos(a), ccy + r*Math.sin(a)]); } });
  return out;
}
// rectangular hole centred at (lx,ly) in the turtle frame
function holeRect(T, lx, ly, dx, dy, holes) {
  const c = Math.cos(T.hd), s = Math.sin(T.hd);
  holes.push([[lx-dx/2, ly-dy/2], [lx+dx/2, ly-dy/2], [lx+dx/2, ly+dy/2], [lx-dx/2, ly+dy/2]].map(([a, b]) => [T.x + a*c - b*s, T.y + a*s + b*c]));
}
// holes that touch the outline are shrunk by eps (Boxes would open a slot); keep only holes entirely inside `poly`
function addHole(o, pts, W, H, poly) {
  const e = 0.01, q = pts.map(([a, b]) => [Math.min(Math.max(a, e), W-e), Math.min(Math.max(b, e), H-e)]);
  if (q.every(p => inPoly(p, poly))) { o.holes.push(q); return true; } return false;
}
const SDEF = t => ({h:2*t, w:4*t, hd:t, ang:60});   // StackableSettings defaults (relative values x thickness)
const ST = (c) => V.Stackable_angle === undefined ? SDEF(c.t) :
  ({h:c.num('Stackable_height')*c.t, w:c.num('Stackable_width')*c.t, hd:c.num('Stackable_holedistance')*c.t, ang:c.num('Stackable_angle')});

BUILD.Console2 = function (c) {
  const {t, num, F} = c, st = ST(c), ang = num('angle'), hf = num('front_height'), ft = t + F.extra;
  let x = num('x'), y = num('y'), h = num('h');
  const bot = V.bottom_edge === 's' || V.bottom_edge === 'F' || V.bottom_edge === 'h' || V.bottom_edge === 'e' ? V.bottom_edge : 'e';
  const swb = EM(bot, F, st).sw, mgb = EM(bot, F, st).mg;
  const rb = V.removable_backwall, rp = V.removable_panel, gp = V.glued_panel;
  const backTop = rb ? 'e' : 'f', topBack = rb ? 'E' : 'F';
  if (V.outside) { x -= 2*t; y -= 2*t; h = h - swb - mgb - t; }
  if (!(x > 0 && y > 0 && h > 0 && ang > 0 && ang <= 90 && hf >= 0)) fail('Inconsistent dimensions');
  const d1 = t*Math.sin(ang*RAD), d2 = t*Math.cos(ang*RAD);
  const pl = Math.min((h - hf)/Math.cos((90-ang)*RAD), y/Math.cos(ang*RAD));
  if (!(pl > 0)) fail('Inconsistent dimensions (front_height >= h)');
  const top = y - pl*Math.cos(ang*RAD), H = hf + pl*Math.sin(ang*RAD);
  const B = top > 0.1*t ? [y, 90, hf, 90-ang, pl, ang, top, 90, H, 90] : [y, 90, hf, 90-ang, pl, ang+90, H, 90];
  const has10 = B.length === 10, lp = 6*t, hb = B[B.length-2];
  warn('Hardware (latches, guides, clips, crossbars) not drawn.');
  // side plates
  const sideOutline = () => { const T = turtle(t, 0), holes = [];
    draw(T, bot, B[0], F, st, holes); T.corner(90);
    fing(T, B[2] + swb - d1, true, F, ft); T.edge(d1); T.corner(B[3]);
    if (rp) holeRect(T, 3*t, 1.5*t, 2.5*t, 1.05*t, holes);
    if (!rp && !gp) fing(T, B[4], true, F, ft); else T.edge(B[4]);
    if (rp) holeRect(T, -3*t, 1.5*t, 2.5*t, 1.05*t, holes);
    if (has10) { T.corner(B[5]); T.edge(d2); fing(T, B[6] - d2, true, F, ft); }
    T.corner(B[B.length-3]);
    if (rb) { holeRect(T, lp, 1.55*t, 1.1*t, 1.1*t, holes); T.edge(hb - t); fing(T, t + swb, true, F, ft); }
    else fing(T, hb + swb, true, F, ft);
    T.corner(B[B.length-1]); T.pts.pop(); return {pts:T.pts, holes}; };
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const so = sideOutline();
  P.push(panel(so, t, V3(-t, -t, -swb), uy, uz, V3(-1,0,0)));
  P.push(panel(so, t, V3(x, -t, -swb), uy, uz, V3(1,0,0)));
  // floor
  P.push(panel(rect(B[0], x, 'ffff', F, st), t, V3(0,0,0), uy, ux, V3(0,0,-1)));
  // front face (rises from the floor)
  P.push(panel(rect(B[2] - d1, x, ['F','e','F',bot], F, st, {ig:[7,4]}), t, V3(0, y, 0), uz, ux, V3(0,1,0)));
  // inclined panel: from (Y=y, Z=hf) along the slope
  const th = 180 - ang, co = Math.cos(th*RAD), si = Math.sin(th*RAD), pv = V3(0, si, -co);
  let po, ox = 0;
  if (gp) po = rect(B[4], x, 'EEEE', F, st);
  else if (rp) { po = rect(B[4], x - 2*t, 'hEhE', F, st); ox = t; }
  else po = rect(B[4], x, 'FEFE', F, st);
  const panelP = panel(po, t, V3(ox, y, hf), V3(0, co, si), ux, pv); P.push(panelP);
  // top (if present): from the back towards the panel, back edge = top_back_edge; V inverted (X from x to 0)
  if (has10) P.push(panel(rect(B[6] - d2, x, ['F','e','F',topBack], F, st), t, V3(x, 0, H), uy, V3(-1,0,0), uz));
  // back wall: from top to bottom (U = -Z)
  const dn = V3(0,0,-1), bd = V3(0,-1,0); let backP = null;
  if (rb) {
    backP = panel(rect(hb - 1.05*t, x, 'EeEe', F, st), t, V3(0, 0, H), dn, ux, bd); P.push(backP);
    P.push(panel(rect(t, x, ['F', bot, 'F', 'e'], F, st, {ig:[0,3]}), t, V3(0, 0, t), dn, ux, bd));
  } else P.push(panel(rect(hb, x, ['F', bot, 'F', backTop], F, st, {ig:[0,3]}), t, V3(0, 0, H), dn, ux, bd));
  const openers = [];
  if (backP) openers.push({parts:[backP], slide:V3(0, -0.8*hb, 0)});   // removable back wall: pulled out towards the rear
  if (rp) openers.push({parts:[panelP], slide:pv.clone().multiplyScalar(0.6*B[4])});   // removable panel: lifted outwards
  return {kind:'box', panels:P, openers};
};

})();
