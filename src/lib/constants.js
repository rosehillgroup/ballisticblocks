// Brand colours (matching Security_2025_deploy site)
export const COLORS = {
  navy: '#1a365d',
  navyLight: '#2d4a71',
  orange: '#ff6b35',
  orangeHover: '#e55a2b',
  orangeGradient: '#f7931e',
  white: '#ffffff',
  bgLight: '#f8f9fa',
  border: '#e9ecef',
  text: '#333333',
  textSecondary: '#6c757d',
};

// Block material colours for 3D (distinct for debugging, will refine later)
export const BLOCK_COLORS = {
  standard: '#5c7a99',   // steel blue
  large: '#e8a840',      // amber/gold
  cornerA: '#c0392b',    // red
  cornerB: '#27ae60',    // green
  highlight: '#ff6b35',
};

// Global block dimensions (mm)
export const BLOCK_HEIGHT = 239;
export const BLOCK_DEPTH = 305;
export const SPINE_DEPTH = 152; // 31 + 90 + 31
export const NUB_DEPTH = 153;

// Interlocking
export const STANDARD_LENGTH = 610;
export const LARGE_LENGTH = 763;
export const OVERLAP = 305; // half-overlap interlock
// Virtual corner-junction span used by solver/debug metadata.
// Physical corner block dimensions remain 610 x 305 x 239 mm.
export const CORNER_JUNCTION_SPAN = 610;
export const CORNER_ARM_WIDTH = 305;

// Logistics
export const STANDARD_WEIGHT_KG = 34;
export const LARGE_WEIGHT_KG = 47;
export const STANDARD_PALLET_COUNT = 24;
export const LARGE_PALLET_COUNT = 16;
export const TRUCK_CAPACITY_KG = 26000;
export const CONTAINER_20FT_KG = 28000;
export const CONTAINER_40FT_KG = 52000;

// Default inputs
export const DEFAULTS = {
  structureType: 'rectangle',
  wallLength: 6.0, // metres
  wallWidth: 4.0,
  straightLength: 6.0,
  uWidth: 4.0,
  uDepth: 3.0,
  courses: 5,
};
