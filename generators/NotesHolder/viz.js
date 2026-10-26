// ==== NotesHolder: note / coaster holder, open fronts, dividers ====
(function () {
  const stepT = (T, out) => { if (out > 1e-5) { T.corner(-90); T.edge(out); T.corner(90); } else if (out < -1e-5) { T.corner(90); T.edge(-out); T.corner(-90); } };
  const rowHoles = (T, len, F, yc, holes) => {   // finger holes along the current edge, at yc from the edge
    const x0 = T.x, y0 = T.y, c = Math.cos(T.hd), s = Math.sin(T.hd), hw = (F.w + F.play)/2, p = F.play/2;
    for (const [o, f] of fingerLayout(len, true, F))
      holes.push([[o-p, yc-hw], [o+f+p, yc-hw], [o+f+p, yc+hw], [o-p, yc+hw]].map(([lx, ly]) => [x0 + lx*c - ly*s, y0 + lx*s + ly*c])); };
  // edge descriptors {sw: start width, ew: end width, draw}
  const FEET_MSG = 'Feet (Stackable width/angle) too wide for an edge: the generator then draws a degenerate outline, shortened here.';
  function edgeObj(ch, F, S) {
    const ex = F.t + F.extra, hS = S.height + S.hd + F.t;
    const r = S.height/2/(1 - Math.cos(S.angle*RAD)), l = r*Math.sin(S.angle*RAD);
    const feet = (T, len, half) => {
      let mid = len - (half ? S.width + 2*l : 2*S.width + 4*l);
      if (mid < 0) { if (!WARNS.some(w => w.msg === FEET_MSG)) warn(FEET_MSG); mid = 0; }
      T.edge(S.width); T.corner(S.angle, r); T.corner(-S.angle, r); T.edge(mid);
      if (!half) { T.corner(-S.angle, r); T.corner(S.angle, r); T.edge(S.width); } };
    if (ch === 's') return {sw:hS, ew:hS, draw:(T, len, H) => { rowHoles(T, len, F, S.height + S.hd + F.t/2, H); feet(T, len, false); }};
    if (ch === 'H') return {sw:hS, ew:S.hd + F.t, draw:(T, len, H) => { rowHoles(T, len, F, S.height + S.hd + F.t/2, H); feet(T, len, true); }};
    const sw = {e:0, f:0, F:ex, h:F.ew + F.t}[ch];
    return {sw, ew:sw, draw:(T, len, H) => drawEdge(T, ch, len, F, H)};
  }
  const plain = ref => ({sw:ref.sw, ew:ref.ew, draw:(T, len) => T.edge(len)});
  function compound(parts) {   // [[edge, length], ...]
    return {sw:parts[0][0].sw, ew:parts[parts.length-1][0].ew, draw:(T, len, H) => {
      let last = parts[0][0].sw;
      for (const [e, l] of parts) { stepT(T, e.sw - last); e.draw(T, l, H); last = e.ew; } }};
  }
  function uslot(ch, F, S, o, t) {   // USlotEdge
    const e = edgeObj(ch, F, S);
    return {sw:e.sw, ew:e.ew, draw:(T, l, H) => {
      const d = l*(1 - o/100)/2, r = Math.min(3*t, (l - 2*d)/2);
      e.draw(T, d, H); stepT(T, -e.ew);
      T.corner(90); T.corner(-90, r); T.edge(l - 2*d - 2*r); T.corner(-90, r); T.corner(90);
      stepT(T, e.sw); e.draw(T, d, H); }};
  }
  function outline(w, h, E) {
    const T = turtle(0, -E[0].sw), lens = [w, h, w, h], holes = [];
    for (let i = 0; i < 4; i++) { E[i].draw(T, lens[i], holes); T.edge(E[(i+1)%4].sw); T.corner(90); T.edge(E[i].ew); }
    T.pts.pop(); return {pts:T.pts, holes};
  }
  const mirror = (o, w) => ({pts:o.pts.map(p => [w - p[0], p[1]]), holes:o.holes.map(hh => hh.map(p => [w - p[0], p[1]]))});
  function parseSx(s) {
    const out = [];
    for (const tok of String(s).trim().split(/\s+/)) { const [v, n] = tok.split('*'), val = parseFloat(v), cnt = n === undefined ? 1 : parseInt(n);
      if (!isFinite(val) || !(cnt >= 0)) fail('Invalid sx'); for (let i = 0; i < cnt; i++) out.push(val); }
    if (!out.length) fail('Invalid sx'); return out;
  }

  BUILD.NotesHolder = function (c) {
    const {t, num, F} = c, Y = num('y'), H = num('h'), b = V.bottom_edge, o = Math.max(0, Math.min(num('opening'), 100));
    const sx = parseSx(V.sx), n = sx.length, X = sx.reduce((a, v) => a + v, 0) + (n-1)*t;
    const S = {angle:num('Stackable_angle'), height:num('Stackable_height')*t, width:num('Stackable_width')*t, hd:num('Stackable_holedistance')*t};
    if (!isFinite(o + Y + H + S.angle + S.height + S.width + S.hd) || !(X > 0 && Y > 0 && H > 0) || sx.some(v => v <= 0)) fail('Dimensions are inconsistent');
    if (S.angle < 20 || S.angle > 260) fail('Stackable: angle must be between 20 and 260');
    if (b !== 'e' && o <= 0) fail('opening = 0: the Boxes.py generator fails here (front_edge undefined)');
    if (b === 's' && num('Stackable_bottom_stabilizers') > 0) warn('Reinforcement strips (bottom_stabilizers) are not drawn.');
    const E = ch => edgeObj(ch, F, S), ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
    const bE = E(b), b2 = E(b === 's' ? 'H' : b), b3 = E(b === 's' ? 'h' : b), e0 = E('e'), ef = E('f'), eF = E('F');
    const k = (1 - o/100)/2, S0 = i => sx.slice(0, i).reduce((a, v) => a + v + t, 0);
    // vertical holes (full height/length len) for the dividers, at position px
    const vHoles = (px, len) => { const hw = (F.w + F.play)/2, p = F.play/2;
      return fingerLayout(len, true, F).map(([q, f]) => [[px-hw, q-p], [px+hw, q-p], [px+hw, q+f+p], [px-hw, q+f+p]]); };
    // side walls
    P.push(panel(outline(Y, H, [bE, eF, e0, eF]), t, V3(-t,0,0), uy, uz, V3(-1,0,0)));
    P.push(panel(outline(Y, H, [bE, eF, e0, eF]), t, V3(X,0,0), uy, uz, V3(1,0,0)));
    // front (side 0) and back (side 1, flipped local frame: U = -x, sx reversed) walls
    for (const side of [0, 1]) {
      const arr = side ? sx.slice().reverse() : sx, s0 = i => arr.slice(0, i).reduce((a, v) => a + v + t, 0);
      const place = (u0, w, o2, mir) => panel(mir ? mirror(o2, w) : o2, t, side ? V3(X - u0, Y, 0) : V3(u0, 0, 0), side ? V3(-1,0,0) : ux, uz, V3(0, side ? 1 : -1, 0));
      if (side && !V.back_openings) {
        const o2 = outline(X, H, [bE, ef, e0, ef]); for (let i = 0; i < n-1; i++) o2.holes.push(...vHoles(s0(i+1) - t/2, H));
        P.push(place(0, X, o2));
      } else {
        const w0 = arr[0]*k, wl = arr[n-1]*k;
        P.push(place(0, w0, outline(w0, H, [b2, e0, e0, ef]), false));
        for (let i = 0; i < n-1; i++) { const l = arr[i]*k, r = arr[i+1]*k, w = l + r + t;
          const o2 = outline(w, H, [compound([[b3, l], [plain(b3), t], [b3, r]]), e0, e0, e0]); o2.holes.push(...vHoles(l + t/2, H));
          P.push(place(s0(i) + arr[i] - l, w, o2, false)); }
        P.push(place(s0(n-1) + arr[n-1] - wl, wl, outline(wl, H, [b2, e0, e0, ef]), true));
      }
    }
    // bottom
    if (b !== 'e') {
      const oc = b === 'f' ? 'h' : 'f', oe = E(oc), ou = uslot(oc, F, S, o, t);
      const comp = lst => compound(lst.flatMap((v, i) => (i ? [[plain(oe), t]] : []).concat([[ou, v]])));
      const front = comp(sx), back = V.back_openings ? comp(sx.slice().reverse()) : oe;
      const pl = outline(X, Y, [front, oe, back, oe]);
      for (let i = 0; i < n-1; i++) {
        const px = S0(i+1) - t/2, hw = (F.w + F.play)/2, p = F.play/2;
        for (const [q, f] of fingerLayout(Y, true, F)) pl.holes.push([[px-hw, q-p], [px+hw, q-p], [px+hw, q+f+p], [px-hw, q+f+p]]);
      }
      P.push(panel(pl, t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
    }
    // dividers (y x h) between the sections
    for (let i = 0; i < n-1; i++) P.push(panel(outline(Y, H, [b === 'e' ? e0 : ef, ef, e0, ef]), t, V3(S0(i) + sx[i], 0, 0), uy, uz, V3(0,0,1)));
    return {kind:'box', panels:P};
  };
})();
