import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { getRenderShellGeometry } from '../geometry/blockGeometry.js';
import { BLOCK_HEIGHT, COURSE_RISE, BLOCK_DEPTH, STANDARD_LENGTH, LARGE_LENGTH } from '../lib/constants.js';
import useConfiguratorStore from '../stores/configuratorStore.js';

const BLOCK_TYPES = ['standard', 'large', 'cornerA', 'cornerB', 'largeCornerA', 'largeCornerB'];
const SHELL_BASE_COLORS = {
  standard: '#5c7a99',    // blue
  large: '#e8a840',       // orange
  cornerA: '#c0392b',     // red
  cornerB: '#27ae60',     // green
  largeCornerA: '#922d22', // dark red
  largeCornerB: '#1e8449', // dark green
};
const PRESENTATION_COLOR = '#5e6369'; // dark rubber graphite
const PRESENTATION_ROUGHNESS = 0.74;
const PRESENTATION_METALNESS = 0.01;

// Polygon offset per type to reduce z-fighting between overlapping block types
const POLYGON_OFFSET = { standard: 1, large: 2, cornerA: 3, cornerB: 4, largeCornerA: 5, largeCornerB: 6 };

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3(1, 1, 1);
const upAxis = new THREE.Vector3(0, 1, 0);

/**
 * InstancedMesh rendering for all blocks.
 * One InstancedMesh per block type for maximum performance.
 */
export default function BlockScene() {
  const placements = useConfiguratorStore((s) => s.placements);
  const structureType = useConfiguratorStore((s) => s.structureType);
  const buildableDimensions = useConfiguratorStore((s) => s.buildableDimensions);
  const courses = useConfiguratorStore((s) => s.courses);
  const viewMode = useConfiguratorStore((s) => s.viewMode);
  const isPresentationMode = viewMode === 'presentation';
  const useUShapePresentationShell =
    structureType === 'uShape' && isPresentationMode;

  // Group placements by block type
  const grouped = useMemo(() => {
    const groups = {};
    for (const type of BLOCK_TYPES) {
      groups[type] = [];
    }
    for (const p of placements) {
      if (groups[p.type]) {
        groups[p.type].push(p);
      }
    }
    return groups;
  }, [placements]);

  return (
    <group>
      {useUShapePresentationShell ? (
        <UShapePresentationShell
          widthMM={buildableDimensions.widthMM || 0}
          depthMM={buildableDimensions.depthMM || 0}
          courses={courses}
        />
      ) : (
        <>
          {BLOCK_TYPES.map((type) => (
            <BlockTypeInstances
              key={`${type}-${grouped[type].length}`}
              blockType={type}
              placements={grouped[type]}
              isPresentationMode={isPresentationMode}
            />
          ))}
        </>
      )}
    </group>
  );
}

function UShapePresentationShell({ widthMM, depthMM, courses }) {
  const geometry = useMemo(() => getRenderShellGeometry(), []);
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: PRESENTATION_COLOR,
      roughness: PRESENTATION_ROUGHNESS,
      metalness: PRESENTATION_METALNESS,
      side: THREE.FrontSide,
      flatShading: false,
    });
  }, []);

  if (widthMM <= 0 || depthMM <= 0 || courses < 1) {
    return null;
  }

  return (
    <group>
      {Array.from({ length: courses }).map((_, course) => {
        const y = course * COURSE_RISE;
        return (
          <group key={`u-presentation-course-${course}`}>
            <mesh
              geometry={geometry}
              material={material}
              position={[0, y, 0]}
              scale={[BLOCK_DEPTH, BLOCK_HEIGHT, depthMM]}
              castShadow
              renderOrder={1}
            />
            <mesh
              geometry={geometry}
              material={material}
              position={[widthMM - BLOCK_DEPTH, y, 0]}
              scale={[BLOCK_DEPTH, BLOCK_HEIGHT, depthMM]}
              castShadow
              renderOrder={1}
            />
            <mesh
              geometry={geometry}
              material={material}
              position={[0, y, depthMM - BLOCK_DEPTH]}
              scale={[widthMM, BLOCK_HEIGHT, BLOCK_DEPTH]}
              castShadow
              renderOrder={1}
            />
          </group>
        );
      })}
    </group>
  );
}

function BlockTypeInstances({ blockType, placements, isPresentationMode }) {
  const meshRef = useRef();

  const geometry = useMemo(() => getRenderShellGeometry(), []);

  const material = useMemo(() => {
    const color = isPresentationMode ? PRESENTATION_COLOR : SHELL_BASE_COLORS[blockType];
    const roughness = isPresentationMode ? PRESENTATION_ROUGHNESS : 0.85;
    const metalness = isPresentationMode ? PRESENTATION_METALNESS : 0.05;

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      side: THREE.FrontSide,
      flatShading: isPresentationMode ? false : true,
      polygonOffset: true,
      polygonOffsetFactor: POLYGON_OFFSET[blockType],
      polygonOffsetUnits: 1,
    });
  }, [blockType, isPresentationMode]);

  const count = placements.length;

  useEffect(() => {
    if (!meshRef.current || count === 0) return;

    const mesh = meshRef.current;
    mesh.count = count;

    for (let i = 0; i < count; i++) {
      const p = placements[i];
      const renderLength = getRenderLengthMM(p);
      const renderDepth = getRenderDepthMM(p);
      const renderOffset = getRenderOffsetMM(p);
      const dirX = Math.cos(p.rotation);
      const dirZ = -Math.sin(p.rotation);

      // depthFlip: shift origin so the shell extends in the opposite depth direction
      // Depth direction in world space is [sin(θ), 0, cos(θ)]; flip by offsetting -renderDepth along it
      const depthOffsetX = p.depthFlip ? -Math.sin(p.rotation) * renderDepth : 0;
      const depthOffsetZ = p.depthFlip ? -Math.cos(p.rotation) * renderDepth : 0;

      tempPosition.set(
        p.position[0] + dirX * renderOffset + depthOffsetX,
        p.position[1],
        p.position[2] + dirZ * renderOffset + depthOffsetZ
      );
      tempQuaternion.setFromAxisAngle(upAxis, p.rotation);
      tempScale.set(renderLength, BLOCK_HEIGHT, renderDepth);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, count, blockType, material]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      count={count}
      castShadow
      renderOrder={POLYGON_OFFSET[blockType]}
    />
  );
}

function getRenderLengthMM(placement) {
  if (typeof placement.renderLength === 'number') {
    return placement.renderLength;
  }
  const isLarge = placement.type === 'large' || placement.type.startsWith('largeCo');
  return isLarge ? LARGE_LENGTH : STANDARD_LENGTH;
}

function getRenderDepthMM(placement) {
  if (typeof placement.renderDepth === 'number') {
    return placement.renderDepth;
  }
  return BLOCK_DEPTH;
}

function getRenderOffsetMM(placement) {
  if (typeof placement.renderOffset === 'number') {
    return placement.renderOffset;
  }
  return 0;
}
