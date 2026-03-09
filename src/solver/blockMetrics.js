import {
  BLOCK_HEIGHT,
  STANDARD_WEIGHT_KG,
  LARGE_WEIGHT_KG,
  STANDARD_PALLET_COUNT,
  LARGE_PALLET_COUNT,
  TRUCK_CAPACITY_KG,
  CONTAINER_20FT_KG,
  CONTAINER_40FT_KG,
} from '../lib/constants.js';

/**
 * Compute metrics from a list of block placements.
 * Ported from Security_2025_deploy/ballistic_block_calculator_280525.html lines 686-806
 */
export function computeMetrics(placements, courses) {
  const counts = {
    standard: 0,
    large: 0,
    cornerA: 0,
    cornerB: 0,
  };

  for (const p of placements) {
    counts[p.type] = (counts[p.type] || 0) + 1;
  }

  const totalBlocks = counts.standard + counts.large + counts.cornerA + counts.cornerB;

  // Weight: standard/corner = 34kg, large = 47kg
  const standardWeight = (counts.standard + counts.cornerA + counts.cornerB) * STANDARD_WEIGHT_KG;
  const largeWeight = counts.large * LARGE_WEIGHT_KG;
  const totalWeight = standardWeight + largeWeight;

  // Pallets: standard-size blocks (incl corners) = 24/pallet, large = 16/pallet
  const standardBlocksTotal = counts.standard + counts.cornerA + counts.cornerB;
  const standardPallets = Math.ceil(standardBlocksTotal / STANDARD_PALLET_COUNT);
  const largePallets = Math.ceil(counts.large / LARGE_PALLET_COUNT);
  const totalPallets = standardPallets + largePallets;

  // Structure height
  const structureHeight = courses * BLOCK_HEIGHT;

  // Truck loads (26 tonne capacity)
  const truckLoads = Math.ceil(totalWeight / TRUCK_CAPACITY_KG);
  const truckCapacityPercent = Math.round((totalWeight / TRUCK_CAPACITY_KG) * 100);

  // Container sizing
  let containerText;
  if (totalWeight <= CONTAINER_20FT_KG) {
    containerText = 'Fits 20ft container';
  } else if (totalWeight <= CONTAINER_40FT_KG) {
    containerText = 'Requires 40ft container';
  } else {
    const containers = Math.ceil(totalWeight / CONTAINER_20FT_KG);
    containerText = `${containers} containers needed`;
  }

  return {
    counts,
    totalBlocks,
    totalWeight,
    standardPallets,
    largePallets,
    totalPallets,
    structureHeight,
    truckLoads,
    truckCapacityPercent,
    containerText,
  };
}
