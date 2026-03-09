import {
  BLOCK_HEIGHT,
  BLOCK_DEPTH,
  SPINE_DEPTH,
  NUB_DEPTH,
  STANDARD_LENGTH,
  LARGE_LENGTH,
  STANDARD_WEIGHT_KG,
  LARGE_WEIGHT_KG,
  CORNER_JUNCTION_SPAN,
  OVERLAP,
} from './constants.js';

/**
 * Block type definitions with physical properties and 2D footprint polygons.
 * Polygons are defined as [x, z] coordinate arrays in mm (plan view).
 * X = length axis, Z = depth axis. Extruded along Y to BLOCK_HEIGHT.
 */

const standardNubOffset = (STANDARD_LENGTH - 305) / 2; // 152.5mm
const largeNubOffset = (LARGE_LENGTH - 458) / 2; // 152.5mm

// Standard T-shape footprint shared by standard, cornerA, and cornerB.
// Corner blocks differ only in solver metadata and rotation, not outer geometry.
const STANDARD_POLYGON = [
  [0, 0],
  [STANDARD_LENGTH, 0],
  [STANDARD_LENGTH, SPINE_DEPTH],
  [standardNubOffset + 305, SPINE_DEPTH],
  [standardNubOffset + 305, BLOCK_DEPTH],
  [standardNubOffset, BLOCK_DEPTH],
  [standardNubOffset, SPINE_DEPTH],
  [0, SPINE_DEPTH],
];

export const BLOCK_SPECS = {
  standard: {
    id: 'standard',
    label: 'Standard Block',
    length: STANDARD_LENGTH,
    height: BLOCK_HEIGHT,
    depth: BLOCK_DEPTH,
    nubWidth: 305,
    nubDepth: NUB_DEPTH,
    weight: STANDARD_WEIGHT_KG,
    polygon: STANDARD_POLYGON,
  },

  large: {
    id: 'large',
    label: 'Large Block',
    length: LARGE_LENGTH,
    height: BLOCK_HEIGHT,
    depth: BLOCK_DEPTH,
    nubWidth: 458,
    nubDepth: NUB_DEPTH,
    weight: LARGE_WEIGHT_KG,
    // T-shape footprint: wider nub
    polygon: [
      [0, 0],
      [LARGE_LENGTH, 0],
      [LARGE_LENGTH, SPINE_DEPTH],
      [largeNubOffset + 458, SPINE_DEPTH],
      [largeNubOffset + 458, BLOCK_DEPTH],
      [largeNubOffset, BLOCK_DEPTH],
      [largeNubOffset, SPINE_DEPTH],
      [0, SPINE_DEPTH],
    ],
  },

  cornerA: {
    id: 'cornerA',
    label: 'Corner Block A',
    length: STANDARD_LENGTH,
    height: BLOCK_HEIGHT,
    depth: BLOCK_DEPTH,
    weight: STANDARD_WEIGHT_KG,
    // Same T-shape as standard block; differs only in solver role/rotation
    polygon: STANDARD_POLYGON,
    meta: {
      origin: [0, 0],
      // Virtual junction coverage extents (not physical block size).
      junctionArm1End: [CORNER_JUNCTION_SPAN, 0],
      junctionArm2End: [0, CORNER_JUNCTION_SPAN],
      fillStart: CORNER_JUNCTION_SPAN - OVERLAP, // 305mm from corner anchor
      junctionEnvelope: [CORNER_JUNCTION_SPAN, CORNER_JUNCTION_SPAN],
    },
  },

  cornerB: {
    id: 'cornerB',
    label: 'Corner Block B',
    length: STANDARD_LENGTH,
    height: BLOCK_HEIGHT,
    depth: BLOCK_DEPTH,
    weight: STANDARD_WEIGHT_KG,
    // Same T-shape as standard block; differs only in solver role/rotation
    polygon: STANDARD_POLYGON,
    meta: {
      origin: [0, 0],
      // Virtual junction coverage extents (not physical block size).
      junctionArm1End: [CORNER_JUNCTION_SPAN, 0],
      junctionArm2End: [0, CORNER_JUNCTION_SPAN],
      fillStart: CORNER_JUNCTION_SPAN - OVERLAP, // 305mm from corner anchor
      junctionEnvelope: [CORNER_JUNCTION_SPAN, CORNER_JUNCTION_SPAN],
    },
  },
};
