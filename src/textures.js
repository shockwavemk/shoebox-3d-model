import * as THREE from 'three';

// Auto-discovers any images dropped into ./textures at build/dev time.
// Vite resolves this glob to a map of relative path -> final asset URL.
const discovered = import.meta.glob('./textures/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

// Build a lookup: "front-outside" -> "/resolved/asset/url.png"
const urlByBaseName = {};
for (const [path, url] of Object.entries(discovered)) {
  const baseName = path.split('/').pop().replace(/\.[^.]+$/, '');
  urlByBaseName[baseName] = url;
}

const textureLoader = new THREE.TextureLoader();

/**
 * Panel-name -> file-basename prefix used for texture lookup, e.g. panel
 * "lidFrontFlap" reads files named "lid-front-flap-outside.png" / "...-inside.png".
 * Drop matching files into src/textures/ (see src/textures/README.md).
 */
export const PANEL_FILE_PREFIX = {
  bottom: 'bottom',
  front: 'front',
  back: 'back',
  left: 'left',
  right: 'right',
  lidTop: 'lid-top',
  lidFrontFlap: 'lid-front-flap',
  lidLeftFlap: 'lid-left-flap',
  lidRightFlap: 'lid-right-flap',
};

function applyTexture(material, url) {
  textureLoader.load(url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  });
}

/**
 * Scans src/textures/ for files matching the naming convention and applies
 * them to the matching panel's outside/inside material. Panels without a
 * matching file simply keep their placeholder color.
 */
export function loadDiscoveredTextures(panels) {
  for (const [panelName, prefix] of Object.entries(PANEL_FILE_PREFIX)) {
    const panel = panels[panelName];
    if (!panel) continue;

    const outsideUrl = urlByBaseName[`${prefix}-outside`];
    if (outsideUrl) applyTexture(panel.outsideMaterial, outsideUrl);

    const insideUrl = urlByBaseName[`${prefix}-inside`];
    if (insideUrl) applyTexture(panel.insideMaterial, insideUrl);
  }
}
