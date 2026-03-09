import {
  STANDARD_LENGTH,
  LARGE_LENGTH,
  OVERLAP,
  CORNER_JUNCTION_SPAN,
} from '../lib/constants.js';

/**
 * Fill a single straight wall segment with blocks.
 *
 * @param {number} wallLength - Total wall length in mm (exterior dimension)
 * @param {number} courseIndex - 0-based course index
 * @param {string} wallId - 'south' | 'north' | 'east' | 'west'
 * @param {number} wallStartX - X position where wall fill starts (after corner)
 * @param {number} wallStartZ - Z position of wall
 * @param {number} rotation - Y-axis rotation in radians for blocks on this wall
 * @param {number} totalCourses - Total number of courses (for top rib)
 * @returns {Array} Block placement objects
 */
export function solveWall(wallLength, courseIndex, wallId, wallStartX, wallStartZ, rotation, totalCourses) {
  const isOddCourse = courseIndex % 2 === 0; // course 0 = odd (first)
  const placements = [];

  // Effective fill length: wall length minus virtual corner-junction coverage on both ends.
  // This is not a physical 610mm corner block depth.
  const effectiveLength = wallLength - 2 * CORNER_JUNCTION_SPAN;

  if (effectiveLength <= 0) return placements;

  // Net advance of each block type after first block overlap:
  // First block on wall covers its full length (minus overlap with corner)
  // Large block net advance: 763 - 305 = 458mm
  // Standard block net advance: 610 - 305 = 305mm
  const largeAdvance = LARGE_LENGTH - OVERLAP; // 458mm
  const standardAdvance = STANDARD_LENGTH - OVERLAP; // 305mm

  let cursor = 0;
  let blockIndex = 0;

  if (isOddCourse) {
    // Odd course: LARGE first, then standards
    if (cursor + LARGE_LENGTH <= effectiveLength + OVERLAP) {
      placements.push(createPlacement(
        'large', cursor, wallStartX, wallStartZ, rotation, courseIndex, wallId, totalCourses
      ));
      cursor = largeAdvance;
      blockIndex++;
    }

    // Fill remainder with standard blocks
    while (cursor + STANDARD_LENGTH <= effectiveLength + OVERLAP) {
      placements.push(createPlacement(
        'standard', cursor, wallStartX, wallStartZ, rotation, courseIndex, wallId, totalCourses
      ));
      cursor += standardAdvance;
      blockIndex++;
    }
  } else {
    // Even course: standards first, then LARGE at end
    const totalFillNeeded = effectiveLength;

    // Calculate how many standard blocks fit before the large block
    // Large at end occupies largeAdvance from its start to wall end
    const standardZone = totalFillNeeded - largeAdvance;

    // Fill with standards
    while (cursor + STANDARD_LENGTH <= standardZone + OVERLAP && cursor < standardZone) {
      placements.push(createPlacement(
        'standard', cursor, wallStartX, wallStartZ, rotation, courseIndex, wallId, totalCourses
      ));
      cursor += standardAdvance;
      blockIndex++;
    }

    // Place large block at end
    if (cursor < totalFillNeeded) {
      placements.push(createPlacement(
        'large', cursor, wallStartX, wallStartZ, rotation, courseIndex, wallId, totalCourses
      ));
      cursor += largeAdvance;
      blockIndex++;
    }
  }

  return placements;
}

let placementIdCounter = 0;

export function resetPlacementIds() {
  placementIdCounter = 0;
}

function createPlacement(type, cursorAlongWall, wallStartX, wallStartZ, rotation, courseIndex, wallId, totalCourses) {
  const id = `block_${placementIdCounter++}`;
  const showTopRib = courseIndex === totalCourses - 1;

  // The cursor is the distance along the wall from the corner edge.
  // We need to convert this to world XZ coordinates based on wall orientation.
  // The rotation and wallStart handle the transformation at the scene level.

  return {
    id,
    type,
    cursorAlongWall,
    wallStartX,
    wallStartZ,
    rotation,
    courseIndex,
    wallId,
    showTopRib,
  };
}
