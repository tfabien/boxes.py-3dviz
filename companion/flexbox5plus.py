# FlexBox5Plus: FlexBox5 + turning latch + inner reinforcements + unfolding jig.
#
# Installation: copy this file into boxes/generators/ of your Boxes.py installation (it is picked up
# automatically by the web generator and by the command line), then for example:
#   python scripts/boxes FlexBox5Plus --reinforcements=2 --turn_latch=1 --format=svg > box.svg
#
# Options added to FlexBox5 (everything else is unchanged, same settings):
#
# * reinforcements / reinforcement_width: N reinforcement frames evenly spread between the two side plates.
#   A reinforcement is the side plate (same fingers on the straight parts, without the latch tab) hollowed out
#   to a band of width reinforcement_width (mm). Its fingers go through the flexible wall: the wall gets holes
#   (same positions as the fingers) at the height of each frame, on the rigid parts only.
#
# * reinforcement_open / reinforcement_fillet: the reinforcements are open on the latch side (the arc of the top
#   diameter) so the inside stays accessible: C shape. The value is the length cut in addition to the arc, along
#   the straight sides (negative = closed ring). Both ends are aligned on a finger (top and bottom); cut fingers have
#   no hole in the wall. reinforcement_fillet = radius of the rounded inner corners of the opening.
#
# * flex_jig / flex_unfold_auto / flex_unfold_adjust / flex_jig_height: unfolding jig. The flexible wall is glued
#   to paper or fabric while it is held stretched, so that the box closes without forcing the slits. Two combs
#   carry the same fingers as the wall, spaced by the *unfolded* length of the flexible zone; with reinforcements,
#   one extra comb per frame has its teeth at the (unfolded) positions of the reinforcement holes. The stretch of
#   each zone is estimated as t / r (thickness over arc radius) and flex_unfold_adjust adds percentage points.
#   (The "stretch" setting of the Boxes.py form has no effect on FlexBox5 itself.)
#
# * turn_latch / latch_width / latch_height / latch_margin / latch_hole: turning latch.
#   - 2 "butterfly" (bone shaped) pieces of length latch_width and end height latch_height, to be glued on both
#     sides of the closing tab of the flexible wall;
#   - a round hole (diameter latch_hole) in the closing tab, vertically centred, close to the right end
#     (latch_height/2 + latch_margin): pivot of the latch.

import math

import boxes
from boxes import *
from boxes.generators.flexbox5 import FlexBox5


class FlexBox5Plus(FlexBox5):
    """Box with living hinge and round corners, with optional turning latch, inner reinforcements and unfolding jig"""

    ui_group = "FlexBox"

    def __init__(self) -> None:
        FlexBox5.__init__(self)
        self.argparser.add_argument(
            "--reinforcements", action="store", type=int, default=0,
            help="number of reinforcement rings inside the box (0 = none)")
        self.argparser.add_argument(
            "--reinforcement_width", action="store", type=float, default=10.0,
            help="width of the band of a reinforcement ring in mm")
        self.argparser.add_argument(
            "--reinforcement_open", action="store", type=float, default=10.0,
            help="reinforcements are open on the latch side (C shape): length cut in addition to the arc, along the "
                 "straight sides, in mm (negative = closed ring)")
        self.argparser.add_argument(
            "--reinforcement_fillet", action="store", type=float, default=3.0,
            help="radius of the rounded inner corners at the open ends of the reinforcements in mm (0 = square)")
        self.argparser.add_argument(
            "--flex_jig", action="store", type=boolarg, default=False,
            help="also cut the unfolding jig: 2 combs that hold the flexible wall stretched while paper or fabric is "
                 "glued on it, plus one comb per reinforcement to pass through the reinforcement holes")
        self.argparser.add_argument(
            "--flex_unfold_auto", action="store", type=boolarg, default=True,
            help="start from an estimate of the stretch of each flexible zone computed from thickness and radius (t / r)")
        self.argparser.add_argument(
            "--flex_unfold_adjust", action="store", type=float, default=0.0,
            help="added to the estimate, in percentage points of the arc length (positive = more unfolded, slits more open)")
        self.argparser.add_argument(
            "--flex_jig_height", action="store", type=float, default=12.0,
            help="height of the body of the unfolding jig combs in mm")
        self.argparser.add_argument(
            "--turn_latch", action="store", type=boolarg, default=False,
            help="add a turning latch (2 butterfly pieces and a pivot hole)")
        self.argparser.add_argument(
            "--latch_width", action="store", type=float, default=30.0,
            help="length of the latch butterflies in mm")
        self.argparser.add_argument(
            "--latch_height", action="store", type=float, default=12.0,
            help="height of the latch butterflies at their ends in mm")
        self.argparser.add_argument(
            "--latch_margin", action="store", type=float, default=3.0,
            help="clearance between the latch and the edges of the flexible piece in mm")
        self.argparser.add_argument(
            "--latch_hole", action="store", type=float, default=4.0,
            help="diameter of the latch pivot hole in mm")

    # ---- fingers: list of (position, width) as in FingerJointEdge, and the fingers kept by the opening ----------
    def _fingerList(self, length):
        e = self.edges["f"]
        st = e.settings
        fingers, leftover = e.calcFingers(length, None)
        s, f = st.space, st.finger
        if fingers == 0 and f and leftover > 0.75 * st.thickness and leftover > 4 * st.play:
            fingers = 1
            f = leftover = leftover / 2.
        return [(leftover / 2. + i * (s + f), f) for i in range(fingers)]

    def _cuts(self):
        """Cut of the reinforcement ring, measured from the tangent points on the latch side (the arc of the top
        diameter) and aligned on a finger: (xb, td) = distance of the right edge of the last bottom finger kept,
        distance of the edge of the first top finger kept (after the plain latch part). reinforcement_open is the
        minimum distance."""
        c = self.reinforcement_open
        l, ls = self.l, self.latchsize
        xb = [l - (o + f) for o, f in self._fingerList(l)]
        xt = [ls + o for o, f in self._fingerList(l - ls)]

        def pick(xs):
            ok = [x for x in xs if x >= c - 1e-9]
            return min(ok) if ok else (max(xs) if xs else c)
        return pick(xb), pick(xt)

    def _keepFinger(self, which, o, f):
        # which 0: top part (F(l - latchsize) of the wall), 1: bottom part (F(l)); keep the fingers on the closed side
        if self.reinforcement_open < 0:
            return True
        xb, td = self._cuts()
        if which == 0:
            return self.latchsize + o >= td - 1e-9
        return self.l - (o + f) >= xb - 1e-9

    def _fingerEdgePartial(self, length, keep, start, end):
        st = self.edges["f"].settings
        h = st.thickness + st.extra_length
        pos = start
        for o, f in self._fingerList(length):
            if not keep(o, f):
                continue
            self.edge(o - pos)
            self.polyline(0, -90, h, 90, f, 90, h, -90)
            pos = o + f
        self.edge(end - pos)

    # ---- flexible wall: reinforcement holes and latch pivot -------------------------------------------------
    def _wallHoles(self):
        t = self.thickness
        l, ls = self.l, self.latchsize
        c2 = math.radians(180 - 2 * self.a) * self.bottom_diameter / 2.
        hw = self.h + 2 * t                      # height of the wall (y axis of the panel)
        n = self.reinforcements
        # rigid parts: F(l - latchsize) at u=0, F(l) after the bottom arc; one hole per reinforcement finger kept
        st = self.edges["f"].settings
        for i in range(n):
            zc = t + (i + 1) * (hw - 2 * t) / (n + 1)
            for which, (u0, length) in enumerate(((0, l - ls), (l - ls + c2, l))):
                for o, f in self._fingerList(length):
                    if self._keepFinger(which, o, f):
                        self.rectangularHole(u0 + o + f / 2., zc, f + st.play, st.width + st.play)
        if self.turn_latch:
            H, m = self.latch_height, self.latch_margin
            c1 = math.radians(180 + 2 * self.a) * self.top_diameter / 2.
            total = 2 * l + c1 + c2
            d = H / 2. + m                       # distance from the pivot to the right end of the closing tab
            zc = hw / 2.                         # pivot vertically centred
            self.hole(total - d, zc, self.latch_hole / 2.)

    def surroundingWall(self, move=None):
        t = self.thickness

        r1, r2 = self.top_diameter / 2., self.bottom_diameter / 2
        h = self.h
        a = self.a
        l = self.l

        c1 = math.radians(180 + 2 * a) * r1
        c2 = math.radians(180 - 2 * a) * r2

        tw = 2 * l + c1 + c2
        th = h + 2.5 * t

        if self.move(tw, th, move, True):
            return

        self.moveTo(0, 0.25 * t)

        if self.reinforcements or self.turn_latch:
            self._wallHoles()

        self.edges["F"](l - self.latchsize, False)
        self.edges["X"](c2, h + 2 * t)
        self.edges["F"](l, False)
        self.edges["X"](c1, h + 2 * t)
        self.latch(self.latchsize, False)
        self.edge(h + 2 * t)
        self.latch(self.latchsize, False, True)
        self.edge(c1)
        self.edges["F"](l, False)
        self.edge(c2)
        self.edges["F"](l - self.latchsize, False)
        self.corner(90)
        self.edge(h + 2 * t)
        self.corner(90)

        self.move(tw, th, move)

    # ---- reinforcement: hollowed side plate without the latch tab -------------------------------------------
    def flexBoxRing(self, move=None):
        t = self.thickness
        r1, r2 = self.top_diameter / 2., self.bottom_diameter / 2
        a, l, w = self.a, self.l, self.reinforcement_width

        tw, th = l + r1 + r2, 2 * max(r1, r2) + 2 * t

        if self.move(tw, th, move, True):
            return

        c = self.reinforcement_open
        if c >= 0:
            # ring open on the latch side (arc of the top diameter): a single C-shaped contour
            ls = self.latchsize
            xb, td = self._cuts()
            e_b = l - xb                              # end of the bottom edge, from the tangent point of the bottom arc
            fr = min(self.reinforcement_fillet, w)
            L2 = l - ls
            if td - ls > L2 or e_b < 0 or fr > min(e_b, l - td):
                raise ValueError("reinforcement_open is too large")
            ang = 180 + 2 * a
            p2x = l + r1 * math.sin(math.radians(ang))   # start of the top edge (end of the top diameter arc)
            p2y = r1 - r1 * math.cos(math.radians(ang))
            self.moveTo(r2, t)
            self.moveTo(p2x + td * math.cos(math.radians(ang)), p2y + td * math.sin(math.radians(ang)), ang)
            # top edge: from the finger closest to the latch to the bottom diameter arc
            self._fingerEdgePartial(L2, lambda o, f: o >= td - ls - 1e-9, td - ls, L2)
            self.corner(180 - 2 * a, r2)
            self._fingerEdgePartial(l, lambda o, f: o + f <= e_b + 1e-9, 0, e_b)
            self.corner(90)                          # bottom end: in line with the last finger
            self.edge(w - fr)
            self.corner(90, fr)                      # small fillet on the inner corner
            self.edge(e_b - fr)
            self.corner(-(180 - 2 * a), r2 - w)
            self.edge(l - td - fr)
            self.corner(90, fr)
            self.edge(w - fr)                        # top end: in line with the finger
            self.corner(90)
            self.move(tw, th, move, label="Reinforcement")
            return

        self.moveTo(r2, t)

        self.edges["f"](l)
        self.corner(180 + 2 * a, r1)
        self.edge(self.latchsize)
        self.edges["f"](l - self.latchsize)
        self.corner(180 - 2 * a, r2)

        # hollow: same circle centres, radii reduced by w, drawn clockwise
        # (the kerf compensation is then done on the right side for a hole)
        self.moveTo(0, w, 180)
        self.corner(-(180 - 2 * a), r2 - w)
        self.edge(l)
        self.corner(-(180 + 2 * a), r1 - w)
        self.edge(l)

        self.move(tw, th, move, label="Reinforcement")

    # ---- unfolding of the flexible part: estimated stretch and jig (combs) ----------------------------------
    def _flexElong(self):
        """Relative stretch (0.05 = 5 %) of the unfolded flexible zones: (top diameter arc, bottom diameter arc).

        The wall, glued flat with the slits open, must have on its outer face the length of the outer arc:
        (r + t) / r - 1 = t / r. Estimate = t / r (paper or fabric on the outer face); flex_unfold_adjust is added
        to it (in percentage points). Without the estimate (flex_unfold_auto=0) only the adjustment applies."""
        t = self.thickness
        r1, r2 = self.top_diameter / 2., self.bottom_diameter / 2.
        adj = self.flex_unfold_adjust / 100.
        e1 = (t / r1 if self.flex_unfold_auto else 0.) + adj
        e2 = (t / r2 if self.flex_unfold_auto else 0.) + adj
        return max(-0.5, e1), max(-0.5, e2)

    def _jigFingers(self, ring):
        """Teeth of a comb in the jig coordinate system: the fingers of the wall notches (ring=False) or of the
        reinforcement holes (ring=True, only the fingers kept by the opening); the second rigid part is shifted
        by the unfolded flexible zone."""
        l, ls = self.l, self.latchsize
        L2 = l - ls
        e1, e2 = self._flexElong()
        c2 = math.radians(180 - 2 * self.a) * self.bottom_diameter / 2.
        u2 = L2 + c2 * (1 + e2)                                  # start of the 2nd rigid part, flexible zone unfolded
        keep = (lambda which, o, f: self._keepFinger(which, o, f)) if ring else (lambda which, o, f: True)
        fingers = [(o, f) for o, f in self._fingerList(L2) if keep(0, o, f)]
        fingers += [(u2 + o, f) for o, f in self._fingerList(l) if keep(1, o, f)]
        return fingers, u2 + l

    def _comb(self, fingers, W, label, move=None):
        t = self.thickness
        h = t + self.edges["f"].settings.extra_length
        H = self.flex_jig_height

        if self.move(W, H + h, move, True):
            return

        self.edge(W)
        self.corner(90)
        self.edge(H)
        self.corner(90)
        pos = W                                                   # top edge, right to left: teeth pointing up
        for x, f in sorted(fingers, key=lambda q: -q[0]):
            self.edge(pos - (x + f))
            self.polyline(0, -90, h, 90, f, 90, h, -90)
            pos = x
        self.edge(pos)
        self.corner(90)
        self.edge(H)
        self.corner(90)

        self.move(W, H + h, move, label=label)

    def jigComb(self, move=None):
        """Comb: same fingers as the wall (rigid parts), but spaced by the unfolded length of the flexible zone.
        The notches of the wall are fitted onto the teeth; the flexible zone stays stretched between the two rigid parts."""
        fingers, W = self._jigFingers(False)
        self._comb(fingers, W, "Jig", move)

    def jigCombRing(self, move=None):
        """Reinforcement comb: teeth at the (unfolded) positions of the reinforcement holes; it is passed through the
        holes of the wall at the height of a reinforcement, as the reinforcement itself would."""
        fingers, W = self._jigFingers(True)
        self._comb(fingers, W, "Reinforcement jig", move)

    # ---- latch butterfly ------------------------------------------------------------------------------------
    def latchPiece(self, move=None):
        W, H = self.latch_width, self.latch_height
        rc = H / 4.
        s = 0.15 * H                              # depth of the waist
        L = W - 2 * rc
        half = 2 * math.degrees(math.atan2(2 * s, L))
        R = L / (2 * math.sin(math.radians(half)))

        if self.move(W, H, move, True):
            return

        self.moveTo(rc, 0)
        for _ in range(2):
            self.corner(half)
            self.corner(-2 * half, R)
            self.corner(half)
            self.corner(90, rc)
            self.edge(H - 2 * rc)
            self.corner(90, rc)

        self.move(W, H, move, label="Latch")

    def render(self):
        if self.reinforcements < 0:
            raise ValueError("reinforcements must be >= 0")
        if self.outside:
            self.x = self.adjustSize(self.x)
            self.h = self.adjustSize(self.h)
            self.top_diameter = self.adjustSize(self.top_diameter)
            self.bottom_diameter = self.adjustSize(self.bottom_diameter)

        t = self.thickness
        if self.turn_latch and self.latch_width + 2 * self.latch_margin > self.h + 2 * t:
            raise ValueError("latch_width is too large for the height of the box")
        self.latchsize *= self.thickness
        d_t, d_b = self.top_diameter, self.bottom_diameter
        self.x = max(self.x, self.latchsize + 2 * t + (d_t + d_b) / 2)

        d_c = self.x - d_t / 2. - d_b / 2.
        self.a = math.degrees(math.asin((d_t - d_b) / 2 / d_c))
        self.l = d_c * math.cos(math.radians(self.a))

        if self.reinforcements and self.reinforcement_width >= min(d_t, d_b) / 2.:
            raise ValueError("reinforcement_width must be smaller than the smallest radius")

        more = self.reinforcements or self.turn_latch or self.flex_jig
        self.surroundingWall(move="up")
        self.flexBoxSide(move="right")
        self.flexBoxSide(move="mirror right" if more else "mirror")
        for i in range(self.reinforcements):
            self.flexBoxRing(move="right")
        if self.turn_latch:
            self.latchPiece(move="right")
            self.latchPiece(move="right")
        if self.flex_jig:                                      # jigs: one column below the other parts
            self.jigComb(move="up")
            self.jigComb(move="up")
            for i in range(self.reinforcements):
                self.jigCombRing(move="up")
