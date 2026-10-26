BUILD.UnevenHeightBox = function (c) {
  const {t, num, F} = c, b = V.bottom_edge === 'F' || V.bottom_edge === 'h' || V.bottom_edge === 'e' ? V.bottom_edge : (V.bottom_edge === 's' ? (warn("Edge 's' drawn as 'F'."), 'F') : 'F');
  const X = c.adj(num('x')), Y = c.adj(num('y')), hs = [0,1,2,3].map(i => c.sub(num('height'+i), c.spc(b) + (V.add_lid ? t : 0)));
  if (!(X > 0 && Y > 0) || hs.some(h => !(h > 0))) fail('Dimensions are inconsistent');
  if (V.add_lid) warn('Lid not drawn.');
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const add = (w, h0, h1, e, O, U, dir) => P.push(panel(trapOutline(w, h0, h1, e, F), t, O, U, uz, dir));
  add(X, hs[0], hs[1], b+'Fe'+'F', V3(0,0,0), ux, V3(0,-1,0));                         // front
  add(Y, hs[1], hs[2], b+'fe'+'f', V3(X,0,0), uy, V3(1,0,0));                          // right
  add(X, hs[2], hs[3], b+'Fe'+'F', V3(X,Y,0), V3(-1,0,0), V3(0,1,0));                  // back
  add(Y, hs[3], hs[0], b+'fe'+'f', V3(0,Y,0), V3(0,-1,0), V3(-1,0,0));                 // left
  if (b !== 'e') P.push(panel(rectOutline(X, Y, 'ffff', F), t, V3(0,0,-t), ux, uy, V3(0,0,-1)));
  return {kind:'box', panels:P};
};
