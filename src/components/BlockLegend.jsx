import { BLOCK_COLORS } from '../lib/constants.js';

const legendItems = [
  { type: 'standard', label: 'Standard Block' },
  { type: 'large', label: 'Large Block' },
  { type: 'cornerA', label: 'Corner A' },
  { type: 'cornerB', label: 'Corner B' },
  { type: 'largeCornerA', label: 'Large Corner A' },
  { type: 'largeCornerB', label: 'Large Corner B' },
];

export default function BlockLegend() {
  return (
    <div className="block-legend">
      {legendItems.map(({ type, label }) => (
        <div key={type} className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: BLOCK_COLORS[type] }}
          />
          <span className="legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
