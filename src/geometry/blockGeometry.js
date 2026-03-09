import * as THREE from 'three';
import { BLOCK_SPECS } from '../lib/blockSpecs.js';
import { BLOCK_HEIGHT } from '../lib/constants.js';

/**
 * Block geometry in world-space:
 *   X = along wall face (length)
 *   Y = vertical (height), 0 at base, BLOCK_HEIGHT at top
 *   Z = depth, 0 at exterior face, +Z going inward
 *
 * Non-indexed geometry with explicit per-face normals for clean sharp edges.
 */

// Cache is rebuilt when this module re-executes (HMR or full reload)
const geometryCache = {};
let renderShellGeometry = null;

export function getBlockGeometry(blockType) {
  if (geometryCache[blockType]) {
    return geometryCache[blockType];
  }

  const spec = BLOCK_SPECS[blockType];
  if (!spec) throw new Error(`Unknown block type: ${blockType}`);

  const polygon = spec.polygon; // [[x, z], ...] in plan view

  // Reuse cached geometry if another block type shares the same polygon
  for (const [cachedType, cachedGeom] of Object.entries(geometryCache)) {
    if (BLOCK_SPECS[cachedType].polygon === polygon) {
      geometryCache[blockType] = cachedGeom;
      return cachedGeom;
    }
  }

  const geometry = buildBlockGeometry(polygon, BLOCK_HEIGHT);
  geometryCache[blockType] = geometry;
  return geometry;
}

/**
 * Build non-indexed BufferGeometry with explicit normals.
 * Each face has its own vertices so normals are sharp (like BoxGeometry).
 */
function buildBlockGeometry(polygon, height) {
  const positions = [];
  const normals = [];
  const n = polygon.length;

  // --- Triangulate the polygon cap using THREE.ShapeGeometry ---
  const shape = new THREE.Shape();
  shape.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < n; i++) {
    shape.lineTo(polygon[i][0], polygon[i][1]);
  }
  shape.closePath();

  const shapeGeom = new THREE.ShapeGeometry(shape);
  const shapePos = shapeGeom.attributes.position.array;
  const shapeIdx = shapeGeom.index ? shapeGeom.index.array : null;

  // Extract triangulated faces as world XZ vertices from ShapeGeometry indices.
  const capTriangles = [];
  if (shapeIdx) {
    for (let i = 0; i < shapeIdx.length; i += 3) {
      const ai = shapeIdx[i] * 3;
      const bi = shapeIdx[i + 1] * 3;
      const ci = shapeIdx[i + 2] * 3;
      capTriangles.push([
        [shapePos[ai], shapePos[ai + 1]],
        [shapePos[bi], shapePos[bi + 1]],
        [shapePos[ci], shapePos[ci + 1]],
      ]);
    }
  } else {
    // Inline vertices — fan triangulation fallback
    for (let i = 1; i < n - 1; i++) {
      capTriangles.push([
        [polygon[0][0], polygon[0][1]],
        [polygon[i][0], polygon[i][1]],
        [polygon[i + 1][0], polygon[i + 1][1]],
      ]);
    }
  }
  shapeGeom.dispose();

  // --- Top face (y = height, normal +Y) ---
  // ShapeGeometry triangles are CCW in XY; mapped to XZ they face -Y.
  // Reverse to [a, c, b] so top is +Y.
  for (const [[ax, az], [bx, bz], [cx, cz]] of capTriangles) {
    positions.push(
      ax, height, az,
      cx, height, cz,
      bx, height, bz,
    );
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  }

  // --- Bottom face (y = 0, normal -Y) ---
  for (const [[ax, az], [bx, bz], [cx, cz]] of capTriangles) {
    positions.push(
      ax, 0, az,
      bx, 0, bz,
      cx, 0, cz,
    );
    normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
  }

  // --- Side faces (one quad per polygon edge, split into 2 triangles) ---
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;

    const x0 = polygon[i][0], z0 = polygon[i][1];
    const x1 = polygon[next][0], z1 = polygon[next][1];

    // Edge direction in XZ plane
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.sqrt(dx * dx + dz * dz);

    // Outward normal (perpendicular to edge, pointing outward for CW polygon)
    const nx = dz / len;
    const nz = -dx / len;

    // 4 corners of the side quad:
    // bl = (x0, 0, z0), br = (x1, 0, z1), tl = (x0, h, z0), tr = (x1, h, z1)
    // Winding must match outward normal (dz, 0, -dx)
    // Triangle 1: bl, tr, br
    positions.push(
      x0, 0, z0,
      x1, height, z1,
      x1, 0, z1,
    );
    normals.push(nx, 0, nz, nx, 0, nz, nx, 0, nz);

    // Triangle 2: bl, tl, tr
    positions.push(
      x0, 0, z0,
      x0, height, z0,
      x1, height, z1,
    );
    normals.push(nx, 0, nz, nx, 0, nz, nx, 0, nz);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

export function preloadGeometries() {
  for (const type of Object.keys(BLOCK_SPECS)) {
    getBlockGeometry(type);
  }
}

/**
 * Overlap-safe visual shell geometry.
 * Unit prism anchored at local origin, scaled per instance in BlockScene.
 */
export function getRenderShellGeometry() {
  if (renderShellGeometry) {
    return renderShellGeometry;
  }

  const geom = new THREE.BoxGeometry(1, 1, 1);
  geom.translate(0.5, 0.5, 0.5); // anchor at [0,0,0] instead of centered
  renderShellGeometry = geom.toNonIndexed();
  geom.dispose();
  return renderShellGeometry;
}
