BUILD.OpenBox = function (c) {
  const {t, num, F} = c, X = c.adj(num('x')), Y = c.adj(num('y'), 1), H = c.adj(num('h'), 1);
  if (!(X > 0 && Y > 0 && H > 0)) fail('Dimensions are inconsistent');
  const e = V.edgetype, ux = V3(1,0,0), uz = V3(0,0,1), P = [];
  const add = (w, h, ed, O, U, Vv, dir) => P.push(panel(rectOutline(w, h, ed, F), t, O, U, Vv, dir));
  add(X, H, e+e+'e'+e, V3(0,Y+t,0), ux, uz, V3(0,1,0));                     // back
  add(Y, H, e+'eef', V3(0,Y,0), V3(0,-1,0), uz, V3(-1,0,0));              // left (f on the back side)
  add(Y, H, e+'eef', V3(X+t,Y,0), V3(0,-1,0), uz, V3(1,0,0));             // right
  add(X, Y, 'efff', V3(0,0,-t), ux, V3(0,1,0), V3(0,0,-1));               // bottom
  return {kind:'box', panels:P};
};
