import { jsPDF } from 'jspdf';
import { stackedHeight, STANDARD_LENGTH } from './constants.js';

const NAVY = [26, 54, 93];       // #1a365d
const ORANGE = [255, 107, 53];   // #ff6b35
const WHITE = [255, 255, 255];
const TEXT = [51, 51, 51];        // #333333
const GRAY = [108, 117, 125];    // #6c757d
const LIGHT_BG = [248, 249, 250]; // #f8f9fa
const RULE = [200, 200, 200];

const PAGE_LEFT = 20;
const PAGE_RIGHT = 190;
const COL_RIGHT = PAGE_RIGHT;

/**
 * Generate and download a PDF summary of the current configuration.
 */
export function exportConfigurationPDF(state) {
  const {
    structureType,
    wallLength,
    wallWidth,
    straightLength,
    uWidth,
    uDepth,
    courses,
    buildableDimensions,
    dimensionsAdjusted,
    metrics,
  } = state;

  if (!metrics) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  // --- Header bar ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 32, 'F');

  // Orange accent stripe
  doc.setFillColor(...ORANGE);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Ballistic Block Configurator', PAGE_LEFT, 15);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Rosehill Security', PAGE_LEFT, 24);

  y = 44;

  // --- Structure Configuration ---
  y = sectionHeading(doc, 'Structure Configuration', y);

  const typeLabel = {
    rectangle: 'Rectangle / Enclosure',
    straight: 'Straight Wall',
    uShape: 'U-Shaped Sangar',
  }[structureType] || structureType;

  y = tableRow(doc, 'Structure Type', typeLabel, y);
  y = tableRow(doc, 'Requested Dimensions', formatRequested(structureType, { wallLength, wallWidth, straightLength, uWidth, uDepth }), y);
  y = tableRow(doc, 'Buildable Dimensions', formatBuildable(structureType, buildableDimensions), y);
  if (dimensionsAdjusted) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Adjusted to nearest buildable size', PAGE_LEFT + 2, y);
    y += 5;
  }
  y = tableRow(doc, 'Structure Height', `${(stackedHeight(courses) / 1000).toFixed(2)} m  (${courses} ${courses === 1 ? 'course' : 'courses'})`, y);

  y += 4;

  // --- Block Breakdown ---
  y = sectionHeading(doc, 'Block Breakdown', y);

  y = tableRow(doc, 'Standard Blocks', String(metrics.counts.standard), y);
  y = tableRow(doc, 'Large Blocks', String(metrics.counts.large), y);
  y = tableRow(doc, 'Corner Block A', String(metrics.counts.cornerA), y);
  y = tableRow(doc, 'Corner Block B', String(metrics.counts.cornerB), y);

  // Totals with highlight
  y += 2;
  doc.setDrawColor(...RULE);
  doc.line(PAGE_LEFT, y, COL_RIGHT, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT);
  y = tableRow(doc, 'Total Blocks', String(metrics.totalBlocks), y, true);
  y = tableRow(doc, 'Total Weight', `${(metrics.totalWeight / 1000).toFixed(1)} tonnes  (${metrics.totalWeight.toLocaleString()} kg)`, y, true);
  doc.setFont('helvetica', 'normal');

  y += 4;

  // --- Logistics ---
  y = sectionHeading(doc, 'Logistics', y);

  y = tableRow(doc, 'Standard Pallets', `${metrics.standardPallets}  (24/pallet, incl. corners)`, y);
  if (metrics.largePallets > 0) {
    y = tableRow(doc, 'Large Pallets', `${metrics.largePallets}  (16/pallet)`, y);
  }
  const truckText = metrics.truckLoads <= 1
    ? `${metrics.truckCapacityPercent}% of 26t truck`
    : `${metrics.truckLoads} truck loads (26t each)`;
  y = tableRow(doc, 'Truck Loads', truckText, y);
  y = tableRow(doc, 'Shipping', metrics.containerText, y);

  y += 4;

  // --- Structure Geometry ---
  y = sectionHeading(doc, 'Structure Geometry', y);

  y = tableRow(doc, 'Perimeter', `${(metrics.perimeterMM / 1000).toFixed(2)} m`, y);
  if (structureType !== 'straight') {
    y = tableRow(doc, 'Internal Area', `${metrics.internalAreaM2.toFixed(1)} m²`, y);
  }
  y = tableRow(doc, 'Wall Thickness', `${STANDARD_LENGTH} mm`, y);
  y = tableRow(doc, 'Weight per Metre', `${metrics.weightPerMetre.toLocaleString()} kg/m`, y);

  y += 4;

  // --- Block Specifications ---
  y = sectionHeading(doc, 'Block Specifications', y);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  y = tableRow(doc, 'Standard Block', '610 × 305 × 239 mm  (34 kg)', y);
  y = tableRow(doc, 'Large Block', '763 × 305 × 239 mm  (47 kg)', y);
  y = tableRow(doc, 'Corner Block A', '610 × 305 × 239 mm  (34 kg)', y);
  y = tableRow(doc, 'Corner Block B', '610 × 305 × 239 mm  (34 kg)', y);

  // --- Footer ---
  const footerY = 275;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(PAGE_LEFT, footerY, COL_RIGHT, footerY);

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('FB6 certified (BS EN1522/23). T-shaped blocks nest with 305mm overlap to eliminate bullet penetration seams.', PAGE_LEFT, footerY + 5);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, PAGE_LEFT, footerY + 10);
  doc.text('rosehillsecurity.com', COL_RIGHT, footerY + 10, { align: 'right' });

  // --- Download ---
  doc.save('ballistic-block-configuration.pdf');
}

function sectionHeading(doc, title, y) {
  doc.setFillColor(...LIGHT_BG);
  doc.rect(PAGE_LEFT - 2, y - 4, COL_RIGHT - PAGE_LEFT + 4, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(title, PAGE_LEFT, y);
  return y + 8;
}

function tableRow(doc, label, value, y, bold = false) {
  doc.setFontSize(10);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(...TEXT);
  doc.text(label, PAGE_LEFT + 2, y);
  doc.text(value, COL_RIGHT - 2, y, { align: 'right' });
  return y + 6;
}

function formatRequested(structureType, v) {
  if (structureType === 'straight') return `${v.straightLength.toFixed(3)} m`;
  if (structureType === 'uShape') return `${v.uWidth.toFixed(3)} m × ${v.uDepth.toFixed(3)} m`;
  return `${v.wallLength.toFixed(3)} m × ${v.wallWidth.toFixed(3)} m`;
}

function formatBuildable(structureType, dims = {}) {
  const fmt = (mm) => `${(mm / 1000).toFixed(3)} m`;
  if (structureType === 'straight') return fmt(dims.lengthMM || 0);
  if (structureType === 'uShape') return `${fmt(dims.widthMM || 0)} × ${fmt(dims.depthMM || 0)}`;
  return `${fmt(dims.lengthMM || 0)} × ${fmt(dims.widthMM || 0)}`;
}
