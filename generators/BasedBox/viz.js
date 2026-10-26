BUILD.BasedBox = function (c) {
  const {t, num, F} = c, top = supported(V.top_edge), X = c.adj(num('x')), Y = c.adj(num('y')), H = c.sub(num('h'), c.spc(top) + t);
  if (!(X > 0 && Y > 0 && H > 0)) fail('Dimensions are inconsistent');
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const add = (w, h, e, O, U, Vv, dir) => P.push(panel(rectOutline(w, h, e, F), t, O, U, Vv, dir));
  add(Y, H, 'ff'+top+'f', V3(-t,0,0), uy, uz, V3(-1,0,0));  add(Y, H, 'ff'+top+'f', V3(X,0,0), uy, uz, V3(1,0,0));
  add(X, H, 'fF'+top+'F', V3(0,0,0), ux, uz, V3(0,-1,0));   add(X, H, 'fF'+top+'F', V3(0,Y+t,0), ux, uz, V3(0,1,0));
  add(X, Y, 'hhhh', V3(0,0,-t), ux, uy, V3(0,0,-1));
  addLid(P, c, top, X, Y, H);
  return {kind:'box', panels:P};
};
