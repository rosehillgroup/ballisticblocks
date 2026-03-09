import useConfiguratorStore from '../stores/configuratorStore.js';
import { exportConfigurationPDF } from '../lib/pdfExport.js';

export default function ResultsPanel() {
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
            <span>Standard Pallets (24/pallet)</span>
            <span className="breakdown-value">{metrics.standardPallets}</span>
          </div>
          {metrics.largePallets > 0 && (
            <div className="breakdown-row">
              <span>Large Pallets (16/pallet)</span>
              <span className="breakdown-value">{metrics.largePallets}</span>
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
      </div>

      <button className="pdf-export-btn" onClick={handleExportPDF}>
        Download PDF Summary
      </button>
    </div>
  );
}
