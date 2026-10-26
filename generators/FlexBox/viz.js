BUILD.FlexBox = function (c) {
  const {t, num} = c;
  const tok = String(V.sx).trim().split(/\s+/)[0].split('*')[0];
  let x = parseFloat(tok), y = num('y'), h = num('h');
  if (V.outside) { x -= 2*t; y -= 2*t; h -= 2*t; }
  const latch = num('latchsize')*t;
  let r = num('radius') || Math.min(y, h-latch)/2;
  r = Math.min(r, y/2); r = Math.min(r, Math.max(0, (h-latch)/2));
  if (!(x > 0 && y > 0) || h-2*r-latch <= 0) fail('Dimensions are inconsistent');
  const c4 = Math.PI*r/2, mid = y-2*r < t;
  return flexModel(c, {x, latch, start:[t+r, t], wallStartOp:7,
    ops:[['f', y-2*r], ['c', 90, r], ['f', h-2*r], ['c', 90, r], ['e', y-2*r], ['c', 90, r], ['latch', latch], ['f', h-2*r-latch], ['c', 90, r]],
    segs:[['F', h-2*r-latch], ...(mid ? [['X', 2*c4+y-2*r]] : [['X', c4], ['F', y-2*r], ['X', c4]]),
          ['F', h-2*r], ...(mid ? [['X', 2*c4+y-2*r]] : [['X', c4], ['e', y-2*r], ['X', c4]]), ['L', latch]]});
};
