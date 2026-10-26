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

BUILD.HalfBox = function (c) {
  const {t, num, F} = c, st = SDEF(t), x = num('x'), h = num('h'), d = num('ClampingSize');
  // argparseSections
  let sy = [];
  for (const part of String(V.sy).trim().split(/\s|:/)) {
    let m;
    if ((m = /^(\d+(\.\d+)?)\/(\d+)$/.exec(part))) sy.push(...Array(+m[3]).fill(+m[1]/+m[3]));
    else if ((m = /^(\d+(\.\d+)?)\*(\d+)$/.exec(part))) sy.push(...Array(+m[3]).fill(+m[1]));
    else { if (part === '' || !isFinite(+part)) fail('Invalid sy'); sy.push(+part); } }
  if (!sy.length) sy = [0];
  if (!(x > 0 && h > 0)) fail('Inconsistent dimensions');
  const l = Math.hypot(x, h), b = Math.asin(x/l)/RAD, cc = Math.asin(h/l)/RAD;
  const h1 = 2*t/x*h, l1 = 2*t/x*l, x2 = 2*t/h*x, l2 = 2*t/h*l, sturdy = V.Sturdy, clamp = V.Clamping, ft = t + F.extra;
  if (V.Mounting) warn('Mounting edge (Mounting) drawn as a straight edge.');
  if (clamp && sturdy) warn('Clamping slots (Sturdy): only the inner part is cut.');
  if (!sturdy) sy = [0, ...sy, 0];
  const width = sy.reduce((a, q) => a + q, 0) + (sy.length - 1)*t;
  const cs = []; { let p = -0.5*t; for (const q of sy.slice(0, -1)) { p += q + t; cs.push(p); } }   // centres of the holes / supports
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [], eps = 0.01;
  const lines = (o, len, W) => { for (const vc of cs) { const hw = (F.w + F.play)/2, p = F.play/2;
    for (const [q, f] of fingerLayout(len, true, F)) o.holes.push([[q-p, Math.max(vc-hw, eps)], [q+f+p, Math.max(vc-hw, eps)], [q+f+p, Math.min(vc+hw, W-eps)], [q-p, Math.min(vc+hw, W-eps)]]); } return o; };
  const bot = lines(rect(x, width, sturdy ? 'fffe' : 'efee', F, st), x, width);
  P.push(panel(bot, t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
  const back = lines(rect(h, width, sturdy ? 'fefF' : 'eeeF', F, st), h, width);
  P.push(panel(back, t, V3(x+t,0,0), uz, uy, V3(1,0,0)));
  // support triangles (x by h) with finger edges on x and h
  const tri = [[0,0], [x,0], [x,h]];
  const support = () => { const T = turtle(0, 0); fing(T, x, true, F, ft); T.corner(90); fing(T, h, true, F, ft); T.corner(180-b); T.edge(l); T.corner(180-cc); T.pts.pop();
    const o = {pts:T.pts, holes:[]};
    if (clamp) { const A = sturdy ? [[x/2, d/2 - t/2, d, d+t], [x - d/2 + t/2, h/2, d+t, d]] : [[x/2, d/2, d, d], [x - d/2, h/2, d, d]];
      for (const [cx, cy, dx, dy] of A) if (!addHole(o, rrect(cx, cy, dx, dy, d/8), x, h, tri)) warn('Clamping hole outside the part, ignored.'); }
    return o; };
  cs.forEach(vc => P.push(panel(support(), t, V3(0, vc + t/2, 0), ux, uz, V3(0,0,1))));
  if (sturdy) {
    const side = (yy, dv) => { const T = turtle(0, 0), holes = [];
      draw(T, 'e', x2, F, st, holes); draw(T, 'h', x, F, st, holes); draw(T, 'e', 2*t, F, st, holes); T.corner(90);
      draw(T, 'e', 2*t, F, st, holes); draw(T, 'h', h, F, st, holes); T.edge(h1); T.corner(180-b); T.edge(l + l1 + l2); T.corner(180-cc); T.pts.pop();
      const o = {pts:T.pts, holes};
      if (clamp) for (const [cx, cy] of [[x/2 + x2, 2*t + d/2], [x2 + x - d/2, h/2 + 2*t]]) { const q = rrect(cx, cy, d, d, d/8);
        if (q.every(p => inPoly(p, o.pts))) o.holes.push(q); else warn('Clamping hole outside the part, ignored.'); }
      return panel(o, t, V3(-x2, yy, -2*t), ux, uz, dv); };
    P.push(side(0, V3(0,-1,0))); P.push(side(width + t, V3(0,1,0)));
  }
  return {kind:'box', panels:P};
};

})();
