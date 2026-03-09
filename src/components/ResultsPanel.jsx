import useConfiguratorStore from '../stores/configuratorStore.js';
import { exportConfigurationPDF } from '../lib/pdfExport.js';
import { BLOCK_DEPTH } from '../lib/constants.js';

export default function ResultsPanel() {
  const structureType = useConfiguratorStore((s) => s.structureType);
  const metrics = useConfiguratorStore((s) => s.metrics);

  const handleExportPDF = () => {
    const state = useConfiguratorStore.getState();
    exportConfigurationPDF(state);
  };

  if (!metrics) {
    return (
      <div className="results-panel">
        <p className="results-empty">Configure dimensions to see results</p>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div className="results-cards">
        <div className="result-card">
          <h3>Total Blocks</h3>
          <div className="card-value">{metrics.totalBlocks.toLocaleString()}</div>
          <div className="card-subtitle">all types</div>
        </div>

        <div className="result-card">
          <h3>Total Weight</h3>
          <div className="card-value">{(metrics.totalWeight / 1000).toFixed(1)}</div>
          <div className="card-subtitle">tonnes</div>
        </div>

        <div className="result-card">
          <h3>Structure Height</h3>
          <div className="card-value">{(metrics.structureHeight / 1000).toFixed(2)}</div>
          <div className="card-subtitle">metres</div>
        </div>

        <div className="result-card">
          <h3>Pallets Required</h3>
          <div className="card-value">{metrics.totalPallets}</div>
          <div className="card-subtitle">standard pallets</div>
        </div>
      </div>

      <div className="results-breakdown">
        <div className="breakdown-section">
          <h4>Block Breakdown</h4>
          <div className="breakdown-row">
            <span className="block-swatch standard"></span>
            <span>Standard Blocks</span>
            <span className="breakdown-value">{metrics.counts.standard}</span>
          </div>
          <div className="breakdown-row">
            <span className="block-swatch large"></span>
            <span>Large Blocks</span>
            <span className="breakdown-value">{metrics.counts.large}</span>
          </div>
          <div className="breakdown-row">
            <span className="block-swatch cornerA"></span>
            <span>Corner Block A</span>
            <span className="breakdown-value">{metrics.counts.cornerA}</span>
          </div>
          <div className="breakdown-row">
            <span className="block-swatch cornerB"></span>
            <span>Corner Block B</span>
            <span className="breakdown-value">{metrics.counts.cornerB}</span>
          </div>
        </div>

        <div className="breakdown-section">
          <h4>Logistics</h4>
          <div className="breakdown-row">
            <span>Standard Pallets</span>
            <span className="breakdown-value">{metrics.standardPallets} (24/pallet, incl. corners)</span>
          </div>
          {metrics.largePallets > 0 && (
            <div className="breakdown-row">
              <span>Large Pallets</span>
              <span className="breakdown-value">{metrics.largePallets} (16/pallet)</span>
            </div>
          )}
          <div className="breakdown-row">
            <span>Truck Loads (26t)</span>
            <span className="breakdown-value">
              {metrics.truckLoads <= 1
                ? `${metrics.truckCapacityPercent}%`
                : `${metrics.truckLoads} trucks`}
            </span>
          </div>
          <div className="breakdown-row">
            <span>Shipping</span>
            <span className="breakdown-value">{metrics.containerText}</span>
          </div>
        </div>

        <div className="breakdown-section">
          <h4>Structure Geometry</h4>
          <div className="breakdown-row">
            <span>Perimeter</span>
            <span className="breakdown-value">{(metrics.perimeterMM / 1000).toFixed(2)} m</span>
          </div>
          {structureType !== 'straight' && (
            <div className="breakdown-row">
              <span>Internal Area</span>
              <span className="breakdown-value">{metrics.internalAreaM2.toFixed(1)} m²</span>
            </div>
          )}
          <div className="breakdown-row">
            <span>Wall Thickness</span>
            <span className="breakdown-value">{BLOCK_DEPTH} mm</span>
          </div>
          <div className="breakdown-row">
            <span>Weight per Metre</span>
            <span className="breakdown-value">{metrics.weightPerMetre.toLocaleString()} kg/m</span>
          </div>
        </div>
      </div>

      <button className="pdf-export-btn" onClick={handleExportPDF}>
        Download PDF Summary
      </button>
    </div>
  );
}
