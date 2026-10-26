// ==== Crate: stackable crate (s/S edges) with handles ====
(function () {
  // rectangularWall generalised to the 's' (feet + finger holes) and 'S' (top recess) edges in addition to e f F h
  function outline(w, h, edges, F, S) {
    const ex = F.t + F.extra, sw = {e:0, f:0, F:ex, h:F.ew + F.t, s:S.height + S.hd + F.t, S:0}, mg = {e:0, f:ex, F:0, h:0, s:0, S:0};
    const sp = c => sw[c] + mg[c], T = turtle(sp(edges[3]), mg[edges[0]]), lens = [w, h, w, h], holes = [];
    const r = S.height/2/(1 - Math.cos(S.angle*RAD)), l = r*Math.sin(S.angle*RAD);
    function stackEdge(len, bottom) {
      if (bottom) {   // finger holes at (height+holedistance+t/2) from the edge
        const x0 = T.x, y0 = T.y, c = Math.cos(T.hd), s = Math.sin(T.hd), yc = S.height + S.hd + F.t/2, hw = (F.w + F.play)/2, p = F.play/2;
        for (const [o, f] of fingerLayout(len, true, F))
          holes.push([[o-p, yc-hw], [o+f+p, yc-hw], [o+f+p, yc+hw], [o-p, yc+hw]].map(([lx, ly]) => [x0 + lx*c - ly*s, y0 + lx*s + ly*c]));
      }
      const mid = len - 2*S.width - 4*l, p = bottom ? 1 : -1;
      if (mid < 0) fail('Crate: feet (Stackable_width) too wide for the edge length');
      T.edge(S.width); T.corner(p*S.angle, r); T.corner(-p*S.angle, r); T.edge(mid);
      T.corner(-p*S.angle, r); T.corner(p*S.angle, r); T.edge(S.width);
    }
    for (let i = 0; i < 4; i++) {
      const e = edges[i], e2 = edges[(i+1)%4];
      if (e === 's' || e === 'S') stackEdge(lens[i], e === 's'); else drawEdge(T, e, lens[i], F, holes);
      T.edge(sw[e2]); T.corner(90); T.edge(sw[e]);
    }
    T.pts.pop();
    const sh2 = p => [p[0] - sp(edges[3]), p[1] - sp(edges[0])];
    return {pts:T.pts.map(sh2), holes:holes.map(hh => hh.map(sh2))};
  }
  function roundRect(cx, cy, w, h, r) {
    r = Math.min(r, w/2, h/2); const pts = [];
    [[1,1,0],[-1,1,90],[-1,-1,180],[1,-1,270]].forEach(([sx, sy, a0]) => {
      const n = r > 0 ? 8 : 1;
      for (let i = 0; i <= (r > 0 ? n : 0); i++) { const a = (a0 + 90*i/n)*RAD;
        pts.push(r > 0 ? [cx + sx*(w/2 - r) + r*Math.cos(a), cy + sy*(h/2 - r) + r*Math.sin(a)] : [cx + sx*w/2, cy + sy*h/2]); }
    });
    return pts;
  }
  BUILD.Crate = function (c) {
    const {t, num, F} = c, X = num('x'), Y = num('y'), H = num('h'), stack = V.MakeStackable;
    if (!(X > 0 && Y > 0 && H > 0)) fail('Dimensions are inconsistent');
    const S = {angle:num('Stackable_angle'), height:num('Stackable_height')*t, width:num('Stackable_width')*t, hd:num('Stackable_holedistance')*t};
    if (!isFinite(S.angle + S.height + S.width + S.hd)) fail('Invalid value');
    if (S.angle < 20 || S.angle > 260) fail('Stackable: angle must be between 20 and 260');
    const hr = num('HandleRadius'), hw = num('HandleWidth'), hh = num('HandleHeight'), ho = num('HandleOffset');
    if (![hr, hw, hh, ho].every(isFinite)) fail('Invalid value');
    const hy = hh/2 + ho - (stack ? S.height : 0);   // hole centre, measured from the top edge downwards
    const front = stack ? 'sfSf' : 'hfef', side = stack ? 'sFSF' : 'hFeF';
    const P = [], ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1);
    const wall = (w, edges, O, U, dir) => {
      const o = outline(w, H, edges, F, S); o.holes.push(roundRect(w/2, H - hy, hw, hh, hr));
      P.push(panel(o, t, O, U, uz, dir)); };
    wall(X, front, V3(0,0,0), ux, V3(0,-1,0));  wall(X, front, V3(0,Y+t,0), ux, V3(0,1,0));
    wall(Y, side, V3(-t,0,0), uy, V3(-1,0,0));  wall(Y, side, V3(X,0,0), uy, V3(1,0,0));
    P.push(panel(rectOutline(X, Y, 'ffff', F), t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
    if (stack && num('Stackable_bottom_stabilizers') > 0) warn('Reinforcement strips (bottom_stabilizers) are not drawn.');
    if (!stack && num('FingerJoint_bottom_lip') > 0) warn('Bottom lip (bottom_lip) is not drawn.');
    if (V.AddPatternMask) warn('Pattern mask (annotations) is not drawn.');
    return {kind:'box', panels:P};
  };
  USED.Crate = ['x','y','h','HandleOffset','HandleWidth','HandleHeight','HandleRadius','MakeStackable','Stackable_angle','Stackable_height','Stackable_width','Stackable_holedistance','FingerJoint_edge_width','FingerJoint_width'];
  NOTES.Crate = 'No "outside" parameter (inner dimensions). The s/S feet/recesses are modelled; auxiliary parts (strips, lip, mask) are not drawn. ';
})();
