BUILD.ClosedBox = function (c) {
  const {t, num, F} = c, X = c.adj(num('x')), Y = c.adj(num('y')), H = c.adj(num('h'));
  if (!(X > 0 && Y > 0 && H > 0)) fail('Dimensions are inconsistent');
  const ux = V3(1,0,0), uy = V3(0,1,0), uz = V3(0,0,1), P = [];
  const add = (w, h, e, O, U, Vv, dir) => P.push(panel(rectOutline(w, h, e, F), t, O, U, Vv, dir));
  add(X, H, 'FFFF', V3(0,0,0), ux, uz, V3(0,-1,0));          // front (y in [-t,0])
  add(X, H, 'FFFF', V3(0,Y+t,0), ux, uz, V3(0,1,0));         // back
  add(Y, H, 'FfFf', V3(-t,0,0), uy, uz, V3(-1,0,0));         // left
  add(Y, H, 'FfFf', V3(X,0,0), uy, uz, V3(1,0,0));           // right
  add(X, Y, 'ffff', V3(0,0,-t), ux, uy, V3(0,0,-1));         // bottom
  add(X, Y, 'ffff', V3(0,0,H), ux, uy, V3(0,0,1));           // top
  return {kind:'box', panels:P};
};
