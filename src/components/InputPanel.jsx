import useConfiguratorStore from '../stores/configuratorStore.js';
import { BLOCK_HEIGHT } from '../lib/constants.js';

export default function InputPanel() {
  const structureType = useConfiguratorStore((s) => s.structureType);
  const wallLength = useConfiguratorStore((s) => s.wallLength);
  const wallWidth = useConfiguratorStore((s) => s.wallWidth);
  const straightLength = useConfiguratorStore((s) => s.straightLength);
  const uWidth = useConfiguratorStore((s) => s.uWidth);
  const uDepth = useConfiguratorStore((s) => s.uDepth);
  const courses = useConfiguratorStore((s) => s.courses);
  const buildableDimensions = useConfiguratorStore((s) => s.buildableDimensions);
  const dimensionsAdjusted = useConfiguratorStore((s) => s.dimensionsAdjusted);
  const setStructureType = useConfiguratorStore((s) => s.setStructureType);
  const setWallLength = useConfiguratorStore((s) => s.setWallLength);
  const setWallWidth = useConfiguratorStore((s) => s.setWallWidth);
  const setStraightLength = useConfiguratorStore((s) => s.setStraightLength);
  const setUWidth = useConfiguratorStore((s) => s.setUWidth);
  const setUDepth = useConfiguratorStore((s) => s.setUDepth);
  const setCourses = useConfiguratorStore((s) => s.setCourses);
  const viewMode = useConfiguratorStore((s) => s.viewMode);
  const setViewMode = useConfiguratorStore((s) => s.setViewMode);

  const requestedSummary = formatRequestedSummary(structureType, {
    wallLength,
    wallWidth,
    straightLength,
    uWidth,
    uDepth,
  });
  const buildableSummary = formatBuildableSummary(structureType, buildableDimensions);

  return (
    <aside className="input-panel">
      <h2 className="panel-title">Structure Dimensions</h2>

      <div className="form-group">
        <label htmlFor="structureType">Structure Type</label>
        <select
          id="structureType"
          value={structureType}
          onChange={(e) => setStructureType(e.target.value)}
        >
          <option value="rectangle">Rectangle / Enclosure</option>
          <option value="straight">Straight Wall</option>
          <option value="uShape">U-Shaped Sangar</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="viewMode">View Mode</label>
        <select
          id="viewMode"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value="presentation">Presentation</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      {structureType === 'rectangle' && (
        <>
          <div className="form-group">
            <label htmlFor="wallLength">Wall Length (metres)</label>
            <input
              id="wallLength"
              type="number"
              min="1.5"
              max="100"
              step="0.1"
              value={wallLength}
              onChange={(e) => setWallLength(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="wallWidth">Wall Width (metres)</label>
            <input
              id="wallWidth"
              type="number"
              min="1.5"
              max="100"
              step="0.1"
              value={wallWidth}
              onChange={(e) => setWallWidth(parseFloat(e.target.value) || 0)}
            />
          </div>
        </>
      )}

      {structureType === 'straight' && (
        <div className="form-group">
          <label htmlFor="straightLength">Wall Length (metres)</label>
          <input
            id="straightLength"
            type="number"
            min="1.5"
            max="100"
            step="0.1"
            value={straightLength}
            onChange={(e) => setStraightLength(parseFloat(e.target.value) || 0)}
          />
        </div>
      )}

      {structureType === 'uShape' && (
        <>
          <div className="form-group">
            <label htmlFor="uWidth">Width (metres)</label>
            <input
              id="uWidth"
              type="number"
              min="1.5"
              max="100"
              step="0.1"
              value={uWidth}
              onChange={(e) => setUWidth(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="uDepth">Depth (metres)</label>
            <input
              id="uDepth"
              type="number"
              min="1.5"
              max="100"
              step="0.1"
              value={uDepth}
              onChange={(e) => setUDepth(parseFloat(e.target.value) || 0)}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="courses">Number of Courses (Height)</label>
        <select
          id="courses"
          value={courses}
          onChange={(e) => setCourses(parseInt(e.target.value, 10))}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'Course' : 'Courses'} ({((n * BLOCK_HEIGHT) / 1000).toFixed(2)}m)
            </option>
          ))}
        </select>
      </div>

      <div className="spec-box">
        <h4>Block Specifications</h4>
        <div className="spec-row">
          <span>Standard Block</span>
          <span>610×305×239mm (34kg)</span>
        </div>
        <div className="spec-row">
          <span>Large Block</span>
          <span>763×305×239mm (47kg)</span>
        </div>
        <div className="spec-row">
          <span>Corner A</span>
          <span>610×305×239mm (34kg)</span>
        </div>
        <div className="spec-row">
          <span>Corner B</span>
          <span>610×305×239mm (34kg)</span>
        </div>
      </div>

      <div className="info-box">
        <strong>Requested:</strong> {requestedSummary}
        <br />
        <strong>Buildable:</strong> {buildableSummary}
        {dimensionsAdjusted && (
          <>
            <br />
            <strong>Adjusted to nearest buildable size.</strong>
          </>
        )}
      </div>

      <div className="info-box">
        <strong>Interlocking Design:</strong> T-shaped blocks nest together with 305mm overlap to eliminate bullet penetration seams. FB6 certified (BS EN1522/23).
      </div>
    </aside>
  );
}

function formatRequestedSummary(structureType, values) {
  if (structureType === 'straight') {
    return `${values.straightLength.toFixed(3)} m`;
  }
  if (structureType === 'uShape') {
    return `${values.uWidth.toFixed(3)} m x ${values.uDepth.toFixed(3)} m`;
  }
  return `${values.wallLength.toFixed(3)} m x ${values.wallWidth.toFixed(3)} m`;
}

function formatBuildableSummary(structureType, dims = {}) {
  const fmt = (mm) => `${(mm / 1000).toFixed(3)} m`;

  if (structureType === 'straight') {
    return fmt(dims.lengthMM || 0);
  }
  if (structureType === 'uShape') {
    return `${fmt(dims.widthMM || 0)} x ${fmt(dims.depthMM || 0)}`;
  }
  return `${fmt(dims.lengthMM || 0)} x ${fmt(dims.widthMM || 0)}`;
}
