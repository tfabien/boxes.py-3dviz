// ==== BrickSorter: stackable / nestable sieve for bricks ====
(function () {
  const SIEVE = {large_sieve:[30, 5], medium_sieve:[20, 5], small_sieve:[15, 4], tiny_sieve:[10, 3]};
  const LEVELS = ['large_sieve', 'medium_sieve', 'small_sieve', 'tiny_sieve', 'bottom'];
  function roundRect(x0, y0, w, h, r) {   // bottom-left corner (x0,y0)
    r = Math.min(r, w/2, h/2); if (!(r > 0)) return [[x0, y0], [x0+w, y0], [x0+w, y0+h], [x0, y0+h]];
    const pts = [], n = 6, cx = x0 + w/2, cy = y0 + h/2;
    [[1,1,0],[-1,1,90],[-1,-1,180],[1,-1,270]].forEach(([sx, sy, a0]) => { for (let i = 0; i <= n; i++) { const a = (a0 + 90*i/n)*RAD;
      pts.push([cx + sx*(w/2 - r) + r*Math.cos(a), cy + sy*(h/2 - r) + r*Math.sin(a)]); } });
    return pts;
  }
  BUILD.BrickSorter = function (c) {
    const {t, num, F} = c, lvl = V.level, idx = LEVELS.indexOf(lvl), rad = num('radius'), wig = num('wiggle');
    if (!isFinite(rad + wig)) fail('Invalid value');
    // nesting: edge_width is the class constant (3), not the FingerJoint_edge_width setting
    const nest = a => a - (2*t + wig)*idx;
    const ex = t + F.extra, bW = F.ew + t;     // adjustSize : F = ex, h = edge_width + t
    const x = nest(num('x')) - 2*ex, y = nest(num('y')) - 2*t, h = num('h') - ((3 + 1)*t)*idx - idx*2 - bW;
    if (!(x > 0 && y > 0 && h > 0)) fail('Dimensions are inconsistent');
    const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
    P.push(panel(rectOutline(x, h, 'hFeF', F), t, V3(0,0,0), ux, uz, V3(0,-1,0)));
    P.push(panel(rectOutline(x, h, 'hFeF', F), t, V3(0,y+t,0), ux, uz, V3(0,1,0)));
    P.push(panel(rectOutline(y, h, 'hfef', F), t, V3(-t,0,0), uy, uz, V3(-1,0,0)));
    P.push(panel(rectOutline(y, h, 'hfef', F), t, V3(x,0,0), uy, uz, V3(1,0,0)));
    const plate = rectOutline(x, y, 'ffff', F);
    if (lvl !== 'bottom') {
      const [size, g] = SIEVE[lvl];
      const grid = (inner) => { const n = Math.trunc((inner - g)/(size + g)), gs = (size + g)*n + g; return [n, (inner - gs)/2]; };
      const [xc, xo] = grid(x), [yc, yo] = grid(y);
      if (xc*yc > 2500) fail('Too many holes');
      for (let i = 0; i < xc; i++) for (let j = 0; j < yc; j++)
        plate.holes.push(roundRect(x - xo - size - i*(size + g) - g, y - yo - size - j*(size + g) - g, size, size, rad));
    }
    P.push(panel(plate, t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
    return {kind:'box', panels:P};
  };
  USED.BrickSorter = ['x','y','h','level','radius','wiggle','FingerJoint_edge_width','FingerJoint_width'];
  NOTES.BrickSorter = 'Only one level is shown at a time ("level" setting), as in the generator. ';
})();
