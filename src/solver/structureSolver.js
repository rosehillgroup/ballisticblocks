import {
  BLOCK_HEIGHT,
  BLOCK_DEPTH,
  STANDARD_LENGTH,
  LARGE_LENGTH,
  OVERLAP,
} from '../lib/constants.js';
import { computeMetrics } from './blockMetrics.js';

const STANDARD_ADVANCE = STANDARD_LENGTH - OVERLAP; // 305mm
const LARGE_ADVANCE = LARGE_LENGTH - OVERLAP;       // 458mm
const SHELL_DEPTH = STANDARD_ADVANCE;               // 305mm visual shell thickness
const EPS = 1;
const BUILDABLE_BASES = [
  STANDARD_LENGTH,        // family A: 610 + n*305
  LARGE_LENGTH + OVERLAP, // family B: 1068 + n*305
];

export function resolveBuildableDimensions(structureType, requested) {
  const safe = {
    lengthMM: sanitizeMM(requested.lengthMM),
    widthMM: sanitizeMM(requested.widthMM),
    depthMM: sanitizeMM(requested.depthMM),
  };

  if (structureType === 'straight') {
    const lengthMM = snapWallLengthMM(safe.lengthMM);
    return {
      requested: { lengthMM: safe.lengthMM },
      buildable: { lengthMM, widthMM: BLOCK_DEPTH * 4 },
      adjusted: lengthMM !== safe.lengthMM,
    };
  }

  if (structureType === 'uShape') {
    const widthMM = snapWallLengthMM(safe.widthMM);
    const depthMM = snapWallLengthMM(safe.depthMM);
    return {
      requested: { widthMM: safe.widthMM, depthMM: safe.depthMM },
      buildable: { widthMM, depthMM },
      adjusted: widthMM !== safe.widthMM || depthMM !== safe.depthMM,
    };
  }

  const lengthMM = snapWallLengthMM(safe.lengthMM);
  const widthMM = snapWallLengthMM(safe.widthMM);
  return {
    requested: { lengthMM: safe.lengthMM, widthMM: safe.widthMM },
    buildable: { lengthMM, widthMM },
    adjusted: lengthMM !== safe.lengthMM || widthMM !== safe.widthMM,
  };
}

function sanitizeMM(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function snapWallLengthMM(requestedMM) {
  if (requestedMM <= 0) return 0;

  const candidates = new Set();

  for (const base of BUILDABLE_BASES) {
    const n = Math.round((requestedMM - base) / STANDARD_ADVANCE);
    for (let delta = -2; delta <= 2; delta++) {
      const i = Math.max(0, n + delta);
      candidates.add(base + i * STANDARD_ADVANCE);
    }
  }

  let best = null;
  for (const value of candidates) {
    if (best === null) {
      best = value;
      continue;
    }
    const diff = Math.abs(value - requestedMM);
    const bestDiff = Math.abs(best - requestedMM);
    if (diff < bestDiff || (diff === bestDiff && value > best)) {
      best = value;
    }
  }

  return best ?? requestedMM;
}

export function solveStructure(structureType, dimensions, courses) {
  let placements;

  switch (structureType) {
    case 'straight':
      placements = solveStraightWall(dimensions.lengthMM, courses);
      break;
    case 'uShape':
      placements = solveUShape(dimensions.widthMM, dimensions.depthMM, courses);
      break;
    case 'rectangle':
    default:
      placements = solveRectangle(dimensions.lengthMM, dimensions.widthMM, courses);
      break;
  }

  const metrics = computeMetrics(placements, courses);
  return { placements, metrics };
}

export function solveRectangle(lengthMM, widthMM, courses) {
  const corners = [
    { id: 'sw', position: [0, 0], rotation: 0 },
    { id: 'se', position: [lengthMM, 0], rotation: -Math.PI / 2 },
    { id: 'ne', position: [lengthMM, widthMM], rotation: Math.PI },
    { id: 'nw', position: [0, widthMM], rotation: Math.PI / 2 },
  ];

  const walls = [
    { id: 'south', start: [0, 0], rotation: 0, length: lengthMM, startHasCorner: true, endHasCorner: true },
    { id: 'east', start: [lengthMM, 0], rotation: -Math.PI / 2, length: widthMM, startHasCorner: true, endHasCorner: true },
    { id: 'north', start: [lengthMM, widthMM], rotation: Math.PI, length: lengthMM, startHasCorner: true, endHasCorner: true },
    { id: 'west', start: [0, widthMM], rotation: Math.PI / 2, length: widthMM, startHasCorner: true, endHasCorner: true },
  ];

  return solveLayout(courses, corners, walls);
}

export function solveStraightWall(lengthMM, courses) {
  const corners = [
    { id: 'left', position: [0, 0], rotation: 0 },
    { id: 'right', position: [lengthMM, 0], rotation: -Math.PI / 2 },
  ];

  const walls = [
    { id: 'straight', start: [0, 0], rotation: 0, length: lengthMM, startHasCorner: true, endHasCorner: true },
  ];

  return solveLayout(courses, corners, walls);
}

export function solveUShape(widthMM, depthMM, courses) {
  // Connected chain:
  // left wall -> rear-left corner -> back wall -> rear-right corner -> right wall
  // Only the two rear corners are physical corner columns.
  const corners = [
    { id: 'back-left', position: [0, depthMM], rotation: Math.PI / 2 },
    { id: 'back-right', position: [widthMM, depthMM], rotation: Math.PI },
  ];

  const walls = [
    {
      id: 'left',
      start: [0, depthMM],
      rotation: Math.PI / 2,
      length: depthMM,
      startHasCorner: true,
      endHasCorner: false,
      openEndRebalance: true,
    },
    {
      id: 'back',
      start: [0, depthMM],
      rotation: 0,
      length: widthMM,
      startHasCorner: true,
      endHasCorner: true,
      depthFlip: true,
    },
    {
      id: 'right',
      start: [widthMM, depthMM],
      rotation: Math.PI / 2,
      length: depthMM,
      startHasCorner: true,
      endHasCorner: false,
      openEndRebalance: true,
      depthFlip: true,
    },
  ];

  return solveLayout(courses, corners, walls);
}

function solveLayout(courses, corners, walls) {
  const placements = [];
  let idCounter = 0;

  function nextId() {
    return `block_${idCounter++}`;
  }

  for (let course = 0; course < courses; course++) {
    const y = course * BLOCK_HEIGHT;
    const cornerType = course % 2 === 0 ? 'cornerA' : 'cornerB';
    const showTopRib = course === courses - 1;

    for (const corner of corners) {
      placements.push(makeCornerBlock(corner, cornerType, y, course, showTopRib, nextId));
    }

    for (const wall of walls) {
      placements.push(...fillWallRun(wall, y, course, showTopRib, nextId));
    }
  }

  return placements;
}

function makeCornerBlock(corner, cornerType, y, courseIndex, showTopRib, nextId) {
  return {
    id: nextId(),
    type: cornerType,
    position: [corner.position[0], y, corner.position[1]],
    rotation: corner.rotation,
    courseIndex,
    wallId: `corner-${corner.id}`,
    showTopRib,
    renderLength: STANDARD_ADVANCE,
    renderDepth: SHELL_DEPTH,
    renderOffset: 0,
  };
}

function fillWallRun(wall, y, courseIndex, showTopRib, nextId) {
  const blocks = [];
  const baseDirX = Math.cos(wall.rotation);
  const baseDirZ = -Math.sin(wall.rotation);
  const walkSign = wall.reverse ? -1 : 1;
  const dirX = baseDirX * walkSign;
  const dirZ = baseDirZ * walkSign;
  const flip = wall.depthFlip || false;

  const fillStart = wall.startHasCorner ? STANDARD_ADVANCE : 0;
  const fillEnd = wall.length - (wall.endHasCorner ? STANDARD_ADVANCE : 0);
  const effectiveLength = fillEnd - fillStart;

  if (effectiveLength <= 0) {
    return blocks;
  }

  const lastAnchor = wall.endHasCorner
    ? fillEnd - STANDARD_LENGTH + OVERLAP
    : fillEnd - STANDARD_LENGTH;

  const maxBlockEnd = wall.endHasCorner ? fillEnd + OVERLAP : fillEnd;

  let cursor = fillStart;
  let lastPlacedCursor = -1;
  let placedLeadStandard = false;

  if (wall.startHasCorner && wall.preferStandardAfterCorner) {
    if (cursor + STANDARD_LENGTH <= maxBlockEnd + EPS) {
      blocks.push(makeBlock(
        'standard', cursor, wall.start, dirX, dirZ, y, wall.rotation,
        courseIndex, wall.id, showTopRib, nextId, flip
      ));
      lastPlacedCursor = cursor;
      cursor += STANDARD_ADVANCE;
      placedLeadStandard = true;
    }
  }

  if (!placedLeadStandard && cursor + LARGE_LENGTH <= maxBlockEnd + EPS) {
    blocks.push(makeBlock(
      'large', cursor, wall.start, dirX, dirZ, y, wall.rotation,
      courseIndex, wall.id, showTopRib, nextId, flip
    ));
    lastPlacedCursor = cursor;
    cursor += LARGE_ADVANCE;
  }

  while (cursor <= lastAnchor + EPS) {
    blocks.push(makeBlock(
      'standard', cursor, wall.start, dirX, dirZ, y, wall.rotation,
      courseIndex, wall.id, showTopRib, nextId, flip
    ));
    lastPlacedCursor = cursor;
    cursor += STANDARD_ADVANCE;
  }

  if (lastPlacedCursor + EPS < lastAnchor && lastAnchor > fillStart) {
    blocks.push(makeBlock(
      'standard', lastAnchor, wall.start, dirX, dirZ, y, wall.rotation,
      courseIndex, wall.id, showTopRib, nextId, flip
    ));
  }

  assignShellLengths(blocks, fillEnd);
  if (wall.openEndRebalance) {
    rebalanceUShapeOpenEndTail(blocks, fillEnd);
  }
  return blocks;
}

function assignShellLengths(blocks, fillEnd) {
  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];
    const next = i < blocks.length - 1 ? blocks[i + 1].cursorAlongWall : fillEnd;
    const maxLength = current.type === 'large' ? LARGE_LENGTH : STANDARD_LENGTH;
    const shellLength = Math.max(0, Math.min(maxLength, next - current.cursorAlongWall));
    current.renderLength = shellLength;
    current.renderDepth = SHELL_DEPTH;
    current.renderOffset = 0;
  }
}

/**
 * U-shape open-front visual termination:
 * keep placements unchanged, but split a long terminal open-end shell so the
 * very front reads as a clean 305mm wall end rather than a 610mm stub.
 */
function rebalanceUShapeOpenEndTail(blocks, fillEnd) {
  if (blocks.length < 2) return;

  const last = blocks[blocks.length - 1];
  const prev = blocks[blocks.length - 2];
  const terminalSpan = fillEnd - last.cursorAlongWall;

  if (terminalSpan <= STANDARD_ADVANCE + EPS) {
    return;
  }

  // Shift the terminal cap forward and let the previous segment fill up to it.
  const shift = terminalSpan - STANDARD_ADVANCE;
  const prevTargetLength = (last.cursorAlongWall + shift) - prev.cursorAlongWall;
  const prevMaxLength = prev.type === 'large' ? LARGE_LENGTH : STANDARD_LENGTH;

  if (prevTargetLength <= prevMaxLength + EPS) {
    prev.renderLength = Math.max(0, Math.min(prevMaxLength, prevTargetLength));
    last.renderLength = STANDARD_ADVANCE;
    last.renderOffset = shift;
  }
}

function makeBlock(type, cursor, start, dirX, dirZ, y, rotation, courseIndex, wallId, showTopRib, nextId, depthFlip) {
  return {
    id: nextId(),
    type,
    position: [
      start[0] + cursor * dirX,
      y,
      start[1] + cursor * dirZ,
    ],
    cursorAlongWall: cursor,
    rotation,
    courseIndex,
    wallId,
    showTopRib,
    renderOffset: 0,
    depthFlip: depthFlip || false,
  };
}
