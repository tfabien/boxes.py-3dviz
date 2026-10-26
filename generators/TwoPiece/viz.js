// ==== TwoPiece: two-piece box (the lid caps the base) ====
BUILD.TwoPiece = function (c) {
  const {t, num} = c, p = num('play')*t;
  let x = num('x'), y = num('y'), h = num('h'), hi = num('hi') || h;
  if (!isFinite(p)) fail('Invalid value');
  if (V.outside) { x -= 4*t + 2*p; y -= 4*t + 2*p; h -= 2*t; hi -= 2*t; }
  if (!(x > 0 && y > 0 && h > 0 && hi > 0)) fail('Dimensions are inconsistent');
  const F = Object.assign({}, c.F, {ew: c.F.ew + p});   // the "f" setting is modified: edge_width + play (shared with "h")
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [], d = 2*(t + p), ro = (w, hh, e) => rectOutline(w, hh, e, F);
  // inner shell (height hi): cavity [0,x]x[0,y], standing on the "hhhh" plate
  P.push(panel(ro(x, hi, 'fFeF'), t, V3(0,0,0), ux, uz, V3(0,-1,0)));    P.push(panel(ro(x, hi, 'fFeF'), t, V3(0,y+t,0), ux, uz, V3(0,1,0)));
  P.push(panel(ro(y, hi, 'ffef'), t, V3(-t,0,0), uy, uz, V3(-1,0,0)));   P.push(panel(ro(y, hi, 'ffef'), t, V3(x,0,0), uy, uz, V3(1,0,0)));
  P.push(panel(ro(x, y, 'hhhh'), t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
  // outer shell (height h, dimensions + d) hanging under the "FFFF" plate (lid); v axis pointing down
  const o = -(t + p), Xo = x + d, Yo = y + d;
  P.push(panel(ro(Xo, h, 'fFeF'), t, V3(o,o-t,h), ux, V3(0,0,-1), V3(0,-1,0)));       P.push(panel(ro(Xo, h, 'fFeF'), t, V3(o,y+t+p,h), ux, V3(0,0,-1), V3(0,1,0)));
  P.push(panel(ro(Yo, h, 'ffef'), t, V3(o,o,h), uy, V3(0,0,-1), V3(-1,0,0)));          P.push(panel(ro(Yo, h, 'ffef'), t, V3(x+t+p+t,o,h), uy, V3(0,0,-1), V3(1,0,0)));
  P.push(panel(ro(Xo, Yo, 'FFFF'), t, V3(o,o,h), ux, uy, V3(0,0,1)));
  return {kind:'box', panels:P, openers:[{parts:P.slice(5), slide:V3(0, 0, hi + 2*t)}]};   // outer shell + lid: lift straight up
};
