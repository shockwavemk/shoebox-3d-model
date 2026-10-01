import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { createShoeBox, DEFAULT_DIMENSIONS } from './box.js';
import { loadDiscoveredTextures } from './textures.js';

const app = document.getElementById('app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(45, 35, 45);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, DEFAULT_DIMENSIONS.outer.h / 2, 0);
controls.enableDamping = true;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(30, 50, 20);
sun.castShadow = true;
scene.add(sun);

const groundGeo = new THREE.PlaneGeometry(400, 400);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const { group, panels, hinges, anglePresets } = createShoeBox(DEFAULT_DIMENSIONS);
scene.add(group);

loadDiscoveredTextures(panels);

// ---- GUI: hinge control, defaults to the box fully open --------------------
const gui = new GUI({ title: 'Box assembly' });
const state = {
  lid: THREE.MathUtils.radToDeg(anglePresets.lidPivot.open),
  frontFlap: THREE.MathUtils.radToDeg(anglePresets.frontFlapPivot.open),
  leftFlap: THREE.MathUtils.radToDeg(anglePresets.leftFlapPivot.open),
  rightFlap: THREE.MathUtils.radToDeg(anglePresets.rightFlapPivot.open),
};

function applyState() {
  hinges.lidPivot.rotation.z = THREE.MathUtils.degToRad(state.lid);
  hinges.frontFlapPivot.rotation.z = THREE.MathUtils.degToRad(state.frontFlap);
  hinges.leftFlapPivot.rotation.x = THREE.MathUtils.degToRad(state.leftFlap);
  hinges.rightFlapPivot.rotation.x = THREE.MathUtils.degToRad(state.rightFlap);
}
applyState();

gui.add(state, 'lid', -5, 100, 1).name('Lid (° )').onChange(applyState);
gui.add(state, 'frontFlap', -100, 10, 1).name('Front flap (°)').onChange(applyState);
gui.add(state, 'leftFlap', -10, 100, 1).name('Left flap (°)').onChange(applyState);
gui.add(state, 'rightFlap', -100, 10, 1).name('Right flap (°)').onChange(applyState);

const presets = {
  open: () => {
    state.lid = THREE.MathUtils.radToDeg(anglePresets.lidPivot.open);
    state.frontFlap = THREE.MathUtils.radToDeg(anglePresets.frontFlapPivot.open);
    state.leftFlap = THREE.MathUtils.radToDeg(anglePresets.leftFlapPivot.open);
    state.rightFlap = THREE.MathUtils.radToDeg(anglePresets.rightFlapPivot.open);
    applyState();
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  },
  closed: () => {
    state.lid = THREE.MathUtils.radToDeg(anglePresets.lidPivot.closed);
    state.frontFlap = THREE.MathUtils.radToDeg(anglePresets.frontFlapPivot.closed);
    state.leftFlap = THREE.MathUtils.radToDeg(anglePresets.leftFlapPivot.closed);
    state.rightFlap = THREE.MathUtils.radToDeg(anglePresets.rightFlapPivot.closed);
    applyState();
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  },
};
gui.add(presets, 'open').name('Preset: fully open');
gui.add(presets, 'closed').name('Preset: closed');

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
