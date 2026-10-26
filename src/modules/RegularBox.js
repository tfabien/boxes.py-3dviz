// ---- RegularBox : frustum / prism with n-gon base, angled finger joints (port of regularbox.py) ----
// Helpers shared (by copy) with RegularStarBox.js : prefix "ag".
function agFL(F, ang) {   // FingerJointBase.fingerLength(angle) -> [length, spacerecess]
  const t = F.t, ex = F.extra;
  if (ang >= 90 || ang <= -90) return [t + ex, 0];
  if (ang < 0) return [Math.sin(-ang*RAD)*t + ex, 0];
  const a = 90 - (180 - ang)/2, fl = t*Math.tan(a*RAD), b = 90 - 2*a;
  return [fl + ex, -Math.sin(b*RAD)*fl];
}
function agFingers(T, len, pos, F, h) {
  let p = 0;
  for (const [o, f] of fingerLayout(len, pos, F)) { const s = pos ? -90 : 90;
    T.edge(o - p); T.corner(s); T.edge(h); T.corner(-s); T.edge(f); T.corner(-s); T.edge(h); T.corner(s); p = o + f; }
  T.edge(len - p);
}
// edge spec: sw = startWidth, mg = margin, draw(T, len)
const agPlain = (sw = 0) => ({sw, mg:0, draw:(T, l) => T.edge(l)});
function agFinger(F, pos, ang) {
  const [l1, l2] = agFL(F, ang), h = l1 - l2;
  return {sw: pos ? l2 : l1, mg: pos ? h : 0, draw:(T, l) => agFingers(T, l, pos, F, h)};
}
function agClean(pts) { const o = []; for (const p of pts) { const q = o[o.length-1]; if (!q || Math.hypot(p[0]-q[0], p[1]-q[1]) > 1e-7) o.push(p); }
  if (o.length > 1 && Math.hypot(o[0][0]-o[o.length-1][0], o[0][1]-o[o.length-1][1]) < 1e-6) o.pop(); return o; }
// rectangularWall with arbitrary edge specs (bottom, right, top, left); inner rectangle = [0,w]x[0,h]
function agWall(w, h, eds) {
  const sp = e => e.sw + e.mg, T = turtle(sp(eds[3]), eds[0].mg), lens = [w, h, w, h];
  for (let i = 0; i < 4; i++) { const e = eds[i], e2 = eds[(i+1)%4];
    e.draw(T, lens[i]); T.edge(e2.sw); T.corner(90); T.edge(e.sw); }
  const dx = sp(eds[3]), dy = sp(eds[0]);
  return agClean(T.pts.map(p => [p[0]-dx, p[1]-dy]));
}
// polygonWall (correct_corners=False): borders = [len, angle, len, angle, ...] closed
function agPoly(b, chars, ed) {
  const T = turtle(0, 0);
  for (let i = 0; i < b.length; i += 2) { ed(chars[(i/2) % chars.length]).draw(T, b[i]); T.corner(b[i+1]); }
  return agClean(T.pts);
}
const agRegPoly = (n, r) => ({r, sh:r*Math.cos(Math.PI/n), side:2*Math.sin(Math.PI/n)*r});
// regularPolygonWall (outline centred on the polygon centre)
function agPlate(n, sh, side, e) {
  const T = turtle(-side/2, -(sh + e.sw)), k = e.sw*Math.tan(Math.PI/n);
  for (let i = 0; i < n; i++) { e.draw(T, side); T.edge(k); T.corner(360/n); T.edge(k); }
  return agClean(T.pts);
}
const agCircle = (r, N = 48) => Array.from({length:N}, (_, i) => [r*Math.cos(2*Math.PI*i/N), r*Math.sin(2*Math.PI*i/N)]);
const agNgon = (n, apo) => { const R = apo/Math.cos(Math.PI/n); return Array.from({length:n}, (_, i) => { const a = -Math.PI/2 - Math.PI/n + 2*Math.PI*i/n; return [R*Math.cos(a), R*Math.sin(a)]; }); };

BUILD.RegularBox = function (c) {
  const {t, F, num} = c, n = Math.round(num('n'));
  if (!(n >= 3) || n > 60) fail('n must be between 3 and 60');
  const top = V.top, bottom = V.bottom, hIn = num('h');
  let rb = num('radius_bottom'), rt = num('radius_top'), h = hIn;
  if (V.outside) {
    const k = t/Math.cos(Math.PI/n);
    rb -= k; rt -= k;
    if (top === 'none') h = hIn - t;
    else if (top.includes('lid') && top !== 'angled lid') h = hIn - 3*t;
    else h = hIn - 2*t;
  }
  if (!(rb > 0 && rt > 0 && h > 0)) fail('Inconsistent dimensions');
  const P0 = agRegPoly(n, rb), P1 = agRegPoly(n, rt), sh0 = P0.sh, sh1 = P1.sh, side0 = P0.side, side1 = P1.side;
  let l = Math.hypot(P0.r - P1.r, h);
  const sa = (side1 - side0)/2/l; if (Math.abs(sa) >= 1) fail('Inconsistent dimensions');
  const a = Math.asin(sa)/RAD, ca = Math.cos(a*RAD), ar = Math.cos(Math.PI/n)/ca;
  if (ar >= 1) fail('Inconsistent dimensions (angle)');
  const phi = 180 - 2*Math.asin(ar)/RAD, beta = Math.atan((sh1 - sh0)/h)/RAD, aBot = 90 + beta, aTop = 90 - beta;
  const specs = {e:agPlain(), g:agFinger(F, true, phi), G:agFinger(F, false, phi), y:agFinger(F, true, aBot), Y:agFinger(F, false, aBot),
                 z:agFinger(F, true, aTop), Z:agFinger(F, false, aTop)};
  const ed = ch => specs[ch] || specs.e;
  const finTop = ['closed','hole','angled hole','round lid','angled lid2','bayonet mount'].includes(top);
  const finBot = ['closed','hole','angled hole','round lid','angled lid2'].includes(bottom);
  if (top === 'bayonet mount') warn('Bayonet: top approximated by a closed plate (discs and lugs not drawn).');
  if (P0.r !== P1.r) warn('Wall length computed (like the generator) from the radii, not the apothems: slight play possible.');
  const t_ = specs.G.sw, dTop = Math.max(0, -t_*Math.sin(a*RAD)), dBot = Math.max(0, t_*Math.sin(a*RAD));
  l -= dTop + dBot;
  const be = finBot ? 'y' : 'e', te = finTop ? 'z' : 'e';
  let wallA, wallB;   // [borders, edge chars]
  if (n % 2) {
    wallA = [[side0, 90-a, dBot, 0, l, 0, dTop, 90+a, side1, 90+a, dTop, -90, t_, 90, l, 90, t_, -90, dBot, 90-a], be+'ege'+te+'eeGee'];
    wallB = wallA;
  } else {
    wallA = [[side0, 90-a, dBot, -90, t_, 90, l, 90, t_, -90, dTop, 90+a, side1, 90+a, dTop, -90, t_, 90, l, 90, t_, -90, dBot, 90-a], be+'eeGee'+te+'eeGee'];
    wallB = [[side0, 90-a, dBot, 0, l, 0, dTop, 90+a, side1, 90+a, dTop, 0, l, 0, dBot, 90-a], be+'ege'+te+'ege'];
  }
  const P = [], ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1);
  const sdir = V3(0,0,0);
  for (let k = 0; k < n; k++) {
    const th = (-90 + 360*k/n)*RAD, nn = V3(Math.cos(th), Math.sin(th), 0), tau = V3(-Math.sin(th), Math.cos(th), 0);
    sdir.copy(nn).multiplyScalar(sh1 - sh0).add(V3(0, 0, h)).normalize();
    const w = (n % 2 || k % 2 === 0) ? wallA : wallB, pts = agPoly(w[0], w[1], ed).map(p => [p[0] - side0/2, p[1]]);
    P.push(panel(pts, t, nn.clone().multiplyScalar(sh0), tau, sdir.clone(), nn));
  }
  // bottom / top closures
  const end = (type, sgn, z0, sh, side, ch) => {
    const zs = (zIn, thick = t) => V3(0, 0, sgn > 0 ? zIn : zIn - thick), dir = V3(0, 0, sgn);
    const plate = (e, zOff, holes = []) => P.push(panel({pts:agPlate(n, sh, side, e), holes}, t, zs(z0 + sgn*zOff), ux, uy, dir));
    if (type === 'none') return;
    if (type === 'angled lid') { plate(agPlain(), -t); plate(agPlain(t), 0); return; }   // 'e' plug inside, 'E' cover outside
    const hole = type === 'hole' || type === 'round lid' ? [agCircle(sh - t)] : type === 'angled hole' || type === 'angled lid2' ? [agNgon(n, sh - t)] : [];
    plate(ed(ch), 0, hole);
    if (type === 'round lid') P.push(panel(agCircle(sh), t, zs(z0 + sgn*t), ux, uy, dir));
    if (type === 'angled lid2') plate(agPlain(t), t);
  };
  end(bottom, -1, 0, sh0, side0, 'Y');
  end(top, 1, h, sh1, side1, 'Z');
  return {kind:'box', panels:P};
};
USED.RegularBox = ['h','radius_bottom','radius_top','n','top','bottom'];
NOTES.RegularBox = 'Angled fingers ported from FingerJointEdge(angle). Lid styles: round discs/plates drawn, holes (circle/polygon) approximated. ';
