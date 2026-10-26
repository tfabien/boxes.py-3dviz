# FlexBox5Plus: reinforcements, turning latch and unfolding jig

> This document belongs to the `flexbox5plus` branch. The main branch does not contain this generator.

`FlexBox5Plus` is **not** part of upstream Boxes.py. It is `FlexBox5` plus two options, implemented both in this viewer and as a Boxes.py generator (`boxes/generators/flexbox5plus.py`, in the [tfabien/boxes.py](https://github.com/tfabien/boxes.py) fork) that produces the real cut plan:

![FlexBox5Plus exploded, with two C-shaped reinforcements and the latch open](doc-assets/flexbox5plus.png)

- **Reinforcements** (`reinforcements`, `reinforcement_width`, `reinforcement_open`, `reinforcement_fillet`): *N* evenly spaced inner frames. A reinforcement is the side plate, hollowed out to a band of the chosen width, with the same finger joints; the flexible wall gets matching finger holes at each frame's height. The frame is **open on the latch side** (the side of the box that opens): the cut is aligned on a finger at both ends and the inner corners get a small fillet.
- **Turning latch** (`turn_latch`, `latch_width`, `latch_height`, `latch_margin`, `latch_hole`): two "butterfly" (bone-shaped) pieces glued on both sides of the closing tab of the flexible wall, pivoting on a round hole of the tab. The hole sits close to the end of the tab (`latch_height/2 + latch_margin`) and vertically centred.

- **Unfolding jig** (`flex_jig`, `flex_unfold_auto`, `flex_unfold_adjust`, `flex_jig_height`): lets you glue paper or fabric on the flexible wall *while it is held stretched*, so the glued wall keeps the right length and the box closes without forcing the slits. The generator cuts two **combs** carrying the same fingers as the wall, but spaced by the *unfolded* length of the flexible zone: fit the notches of the wall edge onto the teeth, glue the paper/fabric on the face that will be the outside of the box, let it dry. The stretch of each flexible zone is estimated as `t / r` (thickness over the radius of the arc: the outer face is longer than the inner one by that ratio, e.g. 11 % for a 3 mm wall on a 27 mm radius); `flex_unfold_adjust` adds or removes percentage points on top (negative = less unfolded), and `flex_unfold_auto=0` drops the estimate so only the adjustment applies. With reinforcements, one extra **reinforcement comb** per frame is cut: its teeth sit at the unfolded positions of the reinforcement holes (only the fingers kept by the opening), so it can be passed through those holes at the height of each frame to hold the wall stretched there too. The viewer shows the estimate in red under the title and draws the combs next to the bottom plate.

> The `Flex_stretch` ("étirement") setting of the Boxes.py form has **no effect on FlexBox5** (nor on FlexBox, FlexBox2/3/4): upstream only uses it in `surroundingWall` (rounded boxes) and `Shoe`. That is why changing it changes nothing; use the unfolding parameters above instead.

![Cut plan produced by flexbox5plus.py](doc-assets/flexbox5plus-plan.svg)

## Producing the cut plan locally

The cut plan of this variant cannot come from the public Boxes.py site, so the **Generate** button talks to a tiny local server:

1. Install Boxes.py (a checkout is enough) and its Python dependencies (`affine`, `markdown`, `numpy`, `pillow`, `PyYAML`, `qrcode`, `rectpack`, `shapely`, `svgpathtools`, `typing_extensions`).
2. Use the [tfabien/boxes.py](https://github.com/tfabien/boxes.py) fork (it contains `boxes/generators/flexbox5plus.py`), or copy that file into `boxes/generators/` of your checkout.
3. Run `python companion/boxes_local_server.py` or `companion/start_server.bat` (it looks for Boxes.py next to itself, in `BOXES_SRC`, or in a temp install) and keep it running. It listens on `127.0.0.1:8777` only.
4. Click **Generate**: the plan opens in a new tab. Restart the server after editing the generator.

The same server answers for any Boxes.py generator (`http://127.0.0.1:8777/<Generator>?<parameters>`), which is handy to compare the 3D model with the real output.

> `boxes_local_server.py` and `start_server.bat` live in [`companion/`](companion/); `flexbox5plus.py` lives in the Boxes.py fork.
