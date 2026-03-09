import { create } from 'zustand';
import { solveStructure, resolveBuildableDimensions } from '../solver/structureSolver.js';
import { DEFAULTS } from '../lib/constants.js';

const initialResolved = resolveBuildableDimensions(
  DEFAULTS.structureType,
  {
    lengthMM: DEFAULTS.wallLength * 1000,
    widthMM: DEFAULTS.wallWidth * 1000,
    depthMM: DEFAULTS.uDepth * 1000,
  }
);

const useConfiguratorStore = create((set, get) => ({
  // --- Inputs ---
  structureType: DEFAULTS.structureType,
  wallLength: DEFAULTS.wallLength,
  wallWidth: DEFAULTS.wallWidth,
  straightLength: DEFAULTS.straightLength,
  uWidth: DEFAULTS.uWidth,
  uDepth: DEFAULTS.uDepth,
  courses: DEFAULTS.courses,

  // --- Solver Output ---
  placements: [],
  metrics: null,
  buildableDimensions: initialResolved.buildable,
  dimensionsAdjusted: initialResolved.adjusted,

  // --- UI State ---
  hoveredBlockId: null,
  viewMode: 'presentation',

  // --- Actions ---
  setStructureType: (value) => {
    set({ structureType: value });
    get().solve();
  },

  setWallLength: (value) => {
    set({ wallLength: value });
    get().solve();
  },

  setWallWidth: (value) => {
    set({ wallWidth: value });
    get().solve();
  },

  setStraightLength: (value) => {
    set({ straightLength: value });
    get().solve();
  },

  setUWidth: (value) => {
    set({ uWidth: value });
    get().solve();
  },

  setUDepth: (value) => {
    set({ uDepth: value });
    get().solve();
  },

  setCourses: (value) => {
    set({ courses: value });
    get().solve();
  },

  setHoveredBlockId: (id) => set({ hoveredBlockId: id }),
  setViewMode: (value) => set({ viewMode: value }),

  solve: () => {
    const {
      structureType,
      wallLength,
      wallWidth,
      straightLength,
      uWidth,
      uDepth,
      courses,
    } = get();

    let requestedDimensions;

    if (structureType === 'straight') {
      requestedDimensions = { lengthMM: straightLength * 1000 };
      if (requestedDimensions.lengthMM <= 0 || courses < 1) {
        set({ placements: [], metrics: null });
        return;
      }
    } else if (structureType === 'uShape') {
      requestedDimensions = { widthMM: uWidth * 1000, depthMM: uDepth * 1000 };
      if (requestedDimensions.widthMM <= 0 || requestedDimensions.depthMM <= 0 || courses < 1) {
        set({ placements: [], metrics: null });
        return;
      }
    } else {
      requestedDimensions = { lengthMM: wallLength * 1000, widthMM: wallWidth * 1000 };
      if (requestedDimensions.lengthMM <= 0 || requestedDimensions.widthMM <= 0 || courses < 1) {
        set({ placements: [], metrics: null });
        return;
      }
    }

    const resolved = resolveBuildableDimensions(structureType, requestedDimensions);
    const result = solveStructure(structureType, resolved.buildable, courses);
    set({
      placements: result.placements,
      metrics: result.metrics,
      buildableDimensions: resolved.buildable,
      dimensionsAdjusted: resolved.adjusted,
    });
  },
}));

export default useConfiguratorStore;
