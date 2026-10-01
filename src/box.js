import * as THREE from 'three';

// All measurements in centimetres (1 Three.js unit = 1 cm).
export const DEFAULT_DIMENSIONS = {
  outer: { w: 25, d: 22, h: 12 },
  inner: { w: 24, d: 19, h: 11 },
  lidThickness: 0.4,
  flapThickness: 0.4,
  // How far the front/left/right flaps reach down when folded closed.
  frontFlapLength: 11,
  sideFlapLength: 9,
};

const FACE_ORDER = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

const EDGE_COLOR = 0xb08968; // raw cardboard edge
const PLACEHOLDER_OUTSIDE = 0xd9b98c; // printed side placeholder
const PLACEHOLDER_INSIDE = 0xe8d9c3; // unprinted / inside placeholder

/**
 * Builds a thin slab (BoxGeometry) whose two large faces can later receive
 * independent "outside" / "inside" textures. The remaining four thin edge
 * faces share a single generic cardboard-edge material.
 */
function createSlab(width, height, depth, outsideFace, insideFace) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: EDGE_COLOR, roughness: 0.95 });
  const outsideMaterial = new THREE.MeshStandardMaterial({ color: PLACEHOLDER_OUTSIDE, roughness: 0.85 });
  const insideMaterial = new THREE.MeshStandardMaterial({ color: PLACEHOLDER_INSIDE, roughness: 0.85 });

  const materials = FACE_ORDER.map((face) => {
    if (face === outsideFace) return outsideMaterial;
    if (face === insideFace) return insideMaterial;
    return edgeMaterial;
  });

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, outsideMaterial, insideMaterial };
}

/**
 * Creates the full parametric box: a static tray (bottom + 4 walls) plus a
 * hinged lid carrying a front flap and two side flaps. Every panel is
 * returned in `panels` keyed by name so textures can be assigned per panel.
 *
 * Hinge convention: rotation 0 on every hinge means the panel lies flat,
 * continuing the flat die-cut net outward from its parent. Positive/negative
 * rotation folds it down to the closed position (angles pre-derived below).
 */
export function createShoeBox(dims = DEFAULT_DIMENSIONS) {
  const { outer, inner, lidThickness, flapThickness, frontFlapLength, sideFlapLength } = dims;

  const wallX = (outer.w - inner.w) / 2; // left/right wall thickness
  const wallZ = (outer.d - inner.d) / 2; // front/back wall thickness
  const floorY = outer.h - inner.h; // bottom thickness

  const group = new THREE.Group();
  const panels = {};

  // ---- Static tray: bottom + 4 walls ------------------------------------
  const bottom = createSlab(outer.w, floorY, outer.d, 'ny', 'py');
  bottom.mesh.position.set(0, floorY / 2, 0);
  group.add(bottom.mesh);
  panels.bottom = bottom;

  const front = createSlab(outer.w, outer.h, wallZ, 'pz', 'nz');
  front.mesh.position.set(0, outer.h / 2, outer.d / 2 - wallZ / 2);
  group.add(front.mesh);
  panels.front = front;

  const back = createSlab(outer.w, outer.h, wallZ, 'nz', 'pz');
  back.mesh.position.set(0, outer.h / 2, -outer.d / 2 + wallZ / 2);
  group.add(back.mesh);
  panels.back = back;

  const left = createSlab(wallX, outer.h, outer.d, 'nx', 'px');
  left.mesh.position.set(-outer.w / 2 + wallX / 2, outer.h / 2, 0);
  group.add(left.mesh);
  panels.left = left;

  const right = createSlab(wallX, outer.h, outer.d, 'px', 'nx');
  right.mesh.position.set(outer.w / 2 - wallX / 2, outer.h / 2, 0);
  group.add(right.mesh);
  panels.right = right;

  // ---- Hinged lid assembly ------------------------------------------------
  // Pivot sits on the top back edge of the tray; rotating around X opens/closes it.
  // Hinged along the LEFT wall (the 22 cm side), not the 25 cm side.
  const lidPivot = new THREE.Group();
  lidPivot.position.set(-outer.w / 2, outer.h, 0);
  group.add(lidPivot);

  const lid = createSlab(outer.w, lidThickness, outer.d, 'py', 'ny');
  lid.mesh.position.set(outer.w / 2, 0, 0);
  lidPivot.add(lid.mesh);
  panels.lidTop = lid;

  // Opposite-hinge flap: hinged at the lid's far edge, folds down to cover the right wall.
  // Keeps the panel name "lidFrontFlap" (and its finger-hole marker) for texture compatibility.
  const frontFlapPivot = new THREE.Group();
  frontFlapPivot.position.set(outer.w, lidThickness / 2, 0);
  lidPivot.add(frontFlapPivot);

  const frontFlap = createSlab(frontFlapLength, flapThickness, outer.d, 'py', 'ny');
  frontFlap.mesh.position.set(frontFlapLength / 2, 0, 0);
  frontFlapPivot.add(frontFlap.mesh);
  panels.lidFrontFlap = frontFlap;

  // Decorative finger-hole marker (visual only, not a true cut-out).
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 32),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, side: THREE.DoubleSide }),
  );
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(frontFlapLength * 0.35, flapThickness / 2 + 0.01, 0);
  frontFlapPivot.add(hole);
  panels.lidFrontFlapHoleMarker = { mesh: hole };

  // Front-covering flap: hinged at the lid's front edge, folds down to cover the front wall.
  const leftFlapPivot = new THREE.Group();
  leftFlapPivot.position.set(outer.w / 2, lidThickness / 2, outer.d / 2);
  lidPivot.add(leftFlapPivot);

  const leftFlap = createSlab(outer.w, flapThickness, sideFlapLength, 'py', 'ny');
  leftFlap.mesh.position.set(0, 0, sideFlapLength / 2);
  leftFlapPivot.add(leftFlap.mesh);
  panels.lidLeftFlap = leftFlap;

  // Back-covering flap: hinged at the lid's back edge, folds down to cover the back wall.
  const rightFlapPivot = new THREE.Group();
  rightFlapPivot.position.set(outer.w / 2, lidThickness / 2, -outer.d / 2);
  lidPivot.add(rightFlapPivot);

  const rightFlap = createSlab(outer.w, flapThickness, sideFlapLength, 'py', 'ny');
  rightFlap.mesh.position.set(0, 0, -sideFlapLength / 2);
  rightFlapPivot.add(rightFlap.mesh);
  panels.lidRightFlap = rightFlap;

  const hinges = { lidPivot, frontFlapPivot, leftFlapPivot, rightFlapPivot };

  // Pre-derived open/closed rotation angles (radians) for each hinge, see box.js comments.
  // lidPivot and frontFlapPivot rotate around Z (hinge line runs front-to-back);
  // leftFlapPivot and rightFlapPivot rotate around X (hinge line runs left-to-right).
  const anglePresets = {
    lidPivot: { open: Math.PI / 2, closed: 0 },
    frontFlapPivot: { open: 0, closed: -Math.PI / 2 },
    leftFlapPivot: { open: 0, closed: Math.PI / 2 },
    rightFlapPivot: { open: 0, closed: -Math.PI / 2 },
  };

  return { group, panels, hinges, anglePresets, computed: { wallX, wallZ, floorY } };
}
