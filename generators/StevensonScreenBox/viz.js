// ==== StevensonScreenBox: louvred weather shelter (tilted slats) ====
(function () {
  const geom = (c, maxH) => {   // calculate_slat_geometry
    const t = c.t, a = c.num('slat_angle')*RAD, ov = c.num('slat_overlap'), depth = c.num('slat_depth')*t;
    const bboxH = t*Math.cos(a) + depth*Math.sin(a), pitch = bboxH*(1 - ov), n = Math.floor((maxH - bboxH)/pitch) + 1;
    return {n, pitch, h:n*pitch, depth, a};
  };
  // row of holes (rectangles): origin (ox,oy), direction e, normal n, band [b0,b1] on the n side, positions from fingerLayout(len)
  const row = (ox, oy, e, nrm, b0, b1, len, F, mapX) => fingerLayout(len, true, F).map(([o, f]) => {
    const p = F.play/2;
    return [[o-p, b0], [o+f+p, b0], [o+f+p, b1], [o-p, b1]].map(([lx, ly]) => {
      const x = ox + e[0]*lx + nrm[0]*ly, y = oy + e[1]*lx + nrm[1]*ly; return [mapX ? mapX(x) : x, y]; }); });
  const roundedRect = (u0, v0, u1, v1, r) => { const T = turtle(u0 + r, v0), w = u1 - u0, h = v1 - v0;
    T.edge(w - 2*r); T.corner(90, r); T.edge(h - 2*r); T.corner(90, r); T.edge(w - 2*r); T.corner(90, r); T.edge(h - 2*r); T.corner(90, r); return T.pts.slice(0, -1); };

  BUILD.StevensonScreenBox = function (c) {
    const {t, num, F} = c, X = num('x'), Y = num('y'), H = num('h'), th = num('top_slope')*RAD, ang = num('slat_angle'), glued = V.roof_top === 'glued';
    if (![X, Y, H, th, ang, num('slat_overlap'), num('slat_depth'), num('bottom_width')].every(isFinite) || !(X > 0 && Y > 0 && H > 0)) fail('Dimensions are inconsistent');
    const h1 = H + X*Math.sin(th), frontH = h1 - Math.sin(th)*2*t - t, backH = H, minV = 2*t;
    const fs = geom(c, frontH - minV), bs = geom(c, backH - minV);
    if (fs.n < 1 || bs.n < 1) fail('Height too small for the slats');
    if (fs.n > 200 || bs.n > 200) fail('Too many slats');
    const lf = frontH - fs.h, lb = backH - bs.h;   // height of the (upper) vertical strips
    const aw = Math.atan((h1 - H)/X), sw_ = Math.sin(aw), cw = Math.cos(aw);   // actual slope of the walls' top edge
    const ca = Math.cos(ang*RAD), sa = Math.sin(ang*RAD);
    const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
    // ---- side walls (trapezoids: back h on the left, front h1 on the right) ----
    const side = trapOutline(X, H, h1, glued ? 'eeee' : 'eefe', F);
    const hw = (F.w + F.play)/2;
    for (let i = 0; i < bs.n; i++) side.holes.push(...row(t, i*bs.pitch, [ca, sa], [-sa, ca], t/2 - hw, t/2 + hw, bs.depth, F));
    for (let i = 0; i < fs.n; i++) side.holes.push(...row(t, i*fs.pitch, [ca, sa], [-sa, ca], t/2 - hw, t/2 + hw, fs.depth, F, x => X - x));
    // holes of the upper strips: along the normal (downwards) to the top edge, at px from the front-top corner
    const dv = [-cw, -sw_], nv = [sw_, -cw];
    const stripHoles = (px, len) => row(X + dv[0]*px, h1 + dv[1]*px, nv, [-dv[0], -dv[1]], -hw, hw, len, F);
    const pxF = Math.sin(th)*lf + t, pxB = X/Math.cos(th) - t;
    side.holes.push(...stripHoles(pxF, lf), ...stripHoles(pxB, lb));
    P.push(panel(side, t, V3(-t,0,0), uy, uz, V3(-1,0,0)));
    P.push(panel(side, t, V3(Y,0,0), uy, uz, V3(1,0,0)));
    // ---- slats: Y x depth, "efef" ----
    const slat = rectOutline(Y, fs.depth, 'efef', F), slatB = rectOutline(Y, bs.depth, 'efef', F);
    for (let i = 0; i < bs.n; i++) P.push(panel(slatB, t, V3(0, t, i*bs.pitch), ux, V3(0, ca, sa), V3(0,-1,0)));
    for (let i = 0; i < fs.n; i++) P.push(panel(slat, t, V3(Y, X - t, i*fs.pitch), V3(-1,0,0), V3(0, -ca, sa), V3(0,1,0)));
    // ---- upper strips (perpendicular to the roof) ----
    const strip = (len, px, dirY) => {
      const Py = X + dv[0]*px, Pz = h1 + dv[1]*px;   // point on the top edge; thickness centred on it (W = (0, cw, sw))
      P.push(panel(rectOutline(Y, len, 'efef', F), t, V3(0, Py - t/2*cw, Pz - t/2*sw_), ux, V3(0, sw_, -cw), V3(0, dirY, 0))); };
    strip(lf, pxF, 1); strip(lb, pxB, -1);
    // ---- roof: plate with flanges of t, rounded corners r=t, finger holes on the sides ----
    const L = X/Math.cos(th), roof = {pts:roundedRect(-2*t, -t, Y + 2*t, L + t, t), holes:[]};
    if (!glued) for (const [xc] of [[-t/2], [Y + t/2]]) roof.holes.push(...fingerLayout(L, true, F).map(([o, f]) => {
      const p = F.play/2; return [[xc-hw, o-p], [xc+hw, o-p], [xc+hw, o+f+p], [xc-hw, o+f+p]]; }));
    P.push(panel(roof, t, V3(0, 0, H), ux, V3(0, cw, sw_), V3(0, -sw_, cw)));
    warn('Base plate, 2 brackets and 2 mounting hooks are not drawn.');
    if (glued) warn('Glued roof: marker engraving is not drawn.');
    return {kind:'box', panels:P};
  };
})();
