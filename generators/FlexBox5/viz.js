BUILD.FlexBox5 = function (c) {
  const {t, num} = c;
  let x = num('x'), h = num('h'), dt = num('top_diameter'), db = num('bottom_diameter');
  if (V.outside) { x -= 2*t; h -= 2*t; dt -= 2*t; db -= 2*t; }
  const latch = num('latchsize')*t;
  x = Math.max(x, latch + 2*t + (dt+db)/2);
  const r1 = dt/2, r2 = db/2, dc = x - r1 - r2;
  if (dc <= 0 || r1 <= 0 || r2 <= 0 || h <= 0) fail('Dimensions are inconsistent');
  const sn = (r1-r2)/dc; if (Math.abs(sn) > 1) fail('Diameters are too different for this center distance');
  const a = Math.asin(sn)/RAD, l = dc*Math.cos(a*RAD), c1 = (180+2*a)*RAD*r1, c2 = (180-2*a)*RAD*r2;
  return flexModel(c, {x:h, latch, start:[r2, t], wallStartOp:3,
    ops:[['f', l], ['c', 180+2*a, r1], ['latch', latch], ['f', l-latch], ['c', 180-2*a, r2]],
    segs:[['F', l-latch], ['X', c2], ['F', l], ['X', c1], ['L', latch]]});
};
