// ==== EngravingFrame: frame for an engraving (front + back plate + walls) ====
(function () {
  function roundRect(cx, cy, w, h, r) {
    r = Math.min(r, w/2, h/2); if (!(r > 0)) return [[cx-w/2, cy-h/2], [cx+w/2, cy-h/2], [cx+w/2, cy+h/2], [cx-w/2, cy+h/2]];
    const pts = [], n = 8;
    [[1,1,0],[-1,1,90],[-1,-1,180],[1,-1,270]].forEach(([sx, sy, a0]) => { for (let i = 0; i <= n; i++) { const a = (a0 + 90*i/n)*RAD;
      pts.push([cx + sx*(w/2 - r) + r*Math.cos(a), cy + sy*(h/2 - r) + r*Math.sin(a)]); } });
    return pts;
  }
  // rounded rectangle (outline) of w x h, origin at the bottom-left corner, via the turtle (like polyline [90, r])
  function rounded(w, h, r) {
    const T = turtle(r, 0);
    T.edge(w - 2*r); T.corner(90, r); T.edge(h - 2*r); T.corner(90, r); T.edge(w - 2*r); T.corner(90, r); T.edge(h - 2*r); T.corner(90, r);
    return T.pts.slice(0, -1);
  }
  const pl = (T, ...a) => a.forEach((v, i) => { if (i % 2 === 0) T.edge(v); else T.corner(v); });   // polyline: length, angle, ...
  const rowH = (x0, yc, len, F) => { const hw = (F.w + F.play)/2, p = F.play/2;   // holes along x (angle 0)
    return fingerLayout(len, true, F).map(([o, f]) => [[x0+o-p, yc-hw], [x0+o+f+p, yc-hw], [x0+o+f+p, yc+hw], [x0+o-p, yc+hw]]); };
  const rowV = (xc, y0, len, F) => { const hw = (F.w + F.play)/2, p = F.play/2;   // holes along y (angle 90)
    return fingerLayout(len, true, F).map(([o, f]) => [[xc-hw, y0+o-p], [xc+hw, y0+o-p], [xc+hw, y0+o+f+p], [xc-hw, y0+o+f+p]]); };
  function outline(w, h, E) {   // rectangularWall with edges {sw, ew, draw}
    const T = turtle(0, -E[0].sw), lens = [w, h, w, h], holes = [];
    for (let i = 0; i < 4; i++) { E[i].draw(T, lens[i]); T.edge(E[(i+1)%4].sw); T.corner(90); T.edge(E[i].ew); }
    T.pts.pop(); return {pts:T.pts, holes};
  }

  BUILD.EngravingFrame = function (c) {
    const {t, num, F} = c, EW = num('EngravingWidth'), EH = num('EngravingHeight'), ET = num('EngravingThickness'), m = num('Margin'),
      FT = num('FrameThickness'), Ro = num('FrameOuterCornersRadius'), Ri = num('FrameInnerCornersRadius'), ang = num('BackSupportAngle');
    if (![EW, EH, ET, m, FT, Ro, Ri, ang].every(isFinite) || !(EW > 0 && EH > 0 && ET > 0) || FT < 3*t) fail('Dimensions are inconsistent');
    const Wf = EW + 2*FT, Hf = EH + 2*FT, Wb = EW + 2*t + m, Hb = EH + 2*t + m, D = ET + m;
    const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
    const cx0 = FT - m/2 - t, cz0 = FT - m/2 - t;   // corner of the cavity (side plates, bottom)
    // front plate (cover) and frame plate (finger holes); XZ planes, thickness along -y
    const frame = (cover) => {
      const o = {pts:rounded(Wf, Hf, Ro), holes:[roundRect(FT + EW/2, FT + EH/2, EW, EH, Ri)]};
      if (!cover) {
        o.holes.push(...rowH(cx0, FT - m/2 - 1.5*t, Wb, F), ...rowV(FT - m/2 - 1.5*t, cz0, Hb, F), ...rowV(FT + EW + m/2 + 1.5*t, cz0, Hb, F));
        if (V.AddDummyFingers) o.holes.push(...rowH(cx0, FT + EH + m/2 + 1.5*t, Wb, F));
      }
      return o; };
    if (V.AddCoveringFrontPlate) P.push(panel(frame(true), t, V3(0,0,0), ux, uz, V3(0,-1,0)));
    P.push(panel(frame(false), t, V3(0,t,0), ux, uz, V3(0,-1,0)));
    // walls: sides (Hb x D, "fEfE"), bottom (Wb x D, "fefe")
    const eE = {sw:t, ew:t, draw:(T, l) => T.edge(l)}, eN = {sw:0, ew:0, draw:(T, l) => T.edge(l)}, eF = {sw:0, ew:0, draw:(T, l) => T.fingers(l, true, F)};
    const side = () => outline(Hb, D, [eF, eE, eF, eE]);
    // left side: slab x in [cx0-t, cx0], u along z, v along y (starting at y = t)
    P.push(panel(side(), t, V3(cx0, t, cz0), uz, uy, V3(-1,0,0)));
    P.push(panel(side(), t, V3(cx0 + Wb + t, t, cz0), uz, uy, V3(1,0,0)));
    P.push(panel(outline(Wb, D, [eF, eN, eF, eN]), t, V3(cx0, t, cz0 - t), ux, uy, V3(0,0,-1)));
    // back plate: exact port of backplate() (F notches at the bottom, right, left; top open)
    const T = turtle(t, 0);
    pl(T, t, 90, t, -90);
    T.fingers(Wb, false, F);
    pl(T, 0, -90, t, 90, t, 90, t, -90, t, 90, t, 90, t, -90);
    T.fingers(Hb, false, F);
    pl(T, 0, -90, t, 90, t, 90, t, -90, t, 90, t, 90, t, -90, Wb, -90, t, 90, t, 90, t, -90, t, 90, t, 90, t, -90);
    T.fingers(Hb, false, F);
    pl(T, 0, -90, t, 90, t, 90, t, -90, t, 90);
    const gap = Math.hypot(T.x - T.pts[0][0], T.y - T.pts[0][1]);
    if (gap > 1e-3) warn('Back plate: outline not closed (gap {0} mm).', gap.toFixed(2));
    const bp = T.pts.slice(0, -1).map(p => [p[0] - 2*t, p[1] - 2*t]);
    P.push(panel(bp, t, V3(cx0, t + D + t, cz0), ux, uz, V3(0,1,0)));
    // engraved plate (thickness EngravingThickness), placed in the cavity
    P.push(panel(rounded(EW + 2*t, EH + 2*t, t), ET, V3(cx0 + m/2, t + m/2 + ET, cz0 + m/2), ux, uz, V3(0,0,0)));
    if (ang > 0) warn('Rear support (feet, vertical/horizontal plates, spacers) is not drawn.');
    if (V.AddDummyFingers) warn('Dummy fingers plate is not drawn.');
    return {kind:'box', panels:P};
  };
})();
