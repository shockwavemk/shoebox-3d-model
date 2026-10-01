# Panel textures

Drop PNG/JPG artwork here using the naming convention below. The dev server
picks them up automatically (no code changes needed) — just refresh the page.

Convention: `<panel>-outside.png` / `<panel>-inside.png` (jpg/jpeg/webp also work).

| File prefix          | Panel                          | Flat size (W × H, cm) | Suggested px @ 300dpi |
|-----------------------|--------------------------------|------------------------|------------------------|
| `bottom-`             | Tray floor (outside=underside) | 25 × 22                | 2953 × 2598            |
| `front-`              | Tray front wall                | 25 × 12                | 2953 × 1417            |
| `back-`               | Tray back wall                 | 25 × 12                | 2953 × 1417            |
| `left-`               | Tray left wall                 | 22 × 12                | 2598 × 1417            |
| `right-`              | Tray right wall                | 22 × 12                | 2598 × 1417            |
| `lid-top-`            | Lid top panel                  | 25 × 22                | 2953 × 2598            |
| `lid-front-flap-`     | Flap opposite the hinge (has finger hole) | 11 × 22      | 1299 × 2598            |
| `lid-left-flap-`      | Front-covering flap            | 25 × 9                 | 2953 × 1063            |
| `lid-right-flap-`     | Back-covering flap             | 25 × 9                 | 2953 × 1063            |

Example: `lid-top-outside.png` + `lid-top-inside.png`.

Notes:
- The lid hinges on the left wall (22 cm side). `lid-front-flap` is the panel
  opposite the hinge (finger hole); `lid-left-flap`/`lid-right-flap` cover the
  tray's front/back walls — the panel names stayed the same across that
  change, only their physical location did.
- Every panel accepts both an `-outside` and an `-inside` image independently;
  a missing file just keeps the current placeholder color.
- UV mapping is the geometry default (straight box projection), so image
  orientation/mirroring may need a flip once real artwork is loaded — check
  it in the viewer and re-export flipped if needed.
- Sizes above assume the default dimensions in `src/box.js`; if you change
  the box dimensions there, recompute sizes accordingly.
