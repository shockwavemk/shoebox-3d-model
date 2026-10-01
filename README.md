# Shoe Box 3D Model

Interactive Three.js preview of a shoe box: a static tray (bottom + 4 walls)
plus a hinged lid with a front flap (finger hole) and two side flaps —
matching the hand-drawn dieline sketch.

## Dimensions

- Outer: 25 × 22 × 12 cm (W × D × H)
- Inner: 24 × 19 × 11 cm

Wall/floor thickness is derived automatically from the outer/inner
difference. Edit `DEFAULT_DIMENSIONS` in [src/box.js](src/box.js) to change
any of this.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. Drag to rotate, scroll to zoom. The panel on the
right lets you:
- move each hinge (lid, front flap, left flap, right flap) independently
- jump to an "fully open" or "closed" preset

## Adding your artwork

Every panel has an independent **outside** and **inside** material:

`bottom`, `front`, `back`, `left`, `right`, `lidTop`, `lidFrontFlap`,
`lidLeftFlap`, `lidRightFlap`.

Drop PNG/JPG files into [src/textures/](src/textures/) using the naming
convention documented in [src/textures/README.md](src/textures/README.md)
(e.g. `lid-top-outside.png`) and refresh the dev server — no code changes
needed. Panels without a matching file keep their placeholder color.

## Notes / simplifications

- The finger hole in the front flap is a decorative dark circle overlay, not
  a true geometric cut-out.
- Flap shapes are simple rectangles (not the rounded "ear" shapes visible in
  the reference photos) — good enough for placing/previewing artwork; refine
  the geometry in `src/box.js` if the exact silhouette matters.
