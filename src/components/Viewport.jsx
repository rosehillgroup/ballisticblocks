import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import BlockScene from './BlockScene.jsx';
import BlockLegend from './BlockLegend.jsx';
import useConfiguratorStore from '../stores/configuratorStore.js';
import { stackedHeight } from '../lib/constants.js';

export default function Viewport() {
  const structureType = useConfiguratorStore((s) => s.structureType);
  const buildableDimensions = useConfiguratorStore((s) => s.buildableDimensions);
  const courses = useConfiguratorStore((s) => s.courses);
  const viewMode = useConfiguratorStore((s) => s.viewMode);

  const sceneRootKey = useMemo(() => {
    const length = buildableDimensions.lengthMM ?? 0;
    const width = buildableDimensions.widthMM ?? 0;
    const depth = buildableDimensions.depthMM ?? 0;
    return `${structureType}|${length}|${width}|${depth}|${courses}`;
  }, [structureType, buildableDimensions, courses]);

  return (
    <div className="viewport-container">
      <Canvas
        key={sceneRootKey}
        shadows
        camera={{ position: [5000, 4000, 5000], fov: 45, near: 10, far: 200000 }}
        gl={{ antialias: true }}
      >
        <SceneContents key={sceneRootKey} viewMode={viewMode} />
      </Canvas>
      {viewMode === 'technical' && <BlockLegend />}
    </div>
  );
}

function SceneContents({ viewMode }) {
  const controlsRef = useRef();
  const structureType = useConfiguratorStore((s) => s.structureType);
  const buildableDimensions = useConfiguratorStore((s) => s.buildableDimensions);
  const courses = useConfiguratorStore((s) => s.courses);
  const isPresentationMode = viewMode === 'presentation';

  const footprint = useMemo(() => {
    if (structureType === 'straight') {
      return {
        lengthMM: buildableDimensions.lengthMM || 0,
        widthMM: buildableDimensions.widthMM || 1200,
      };
    }
    if (structureType === 'uShape') {
      return {
        lengthMM: buildableDimensions.widthMM || 0,
        widthMM: buildableDimensions.depthMM || 0,
      };
    }
    return {
      lengthMM: buildableDimensions.lengthMM || 0,
      widthMM: buildableDimensions.widthMM || 0,
    };
  }, [structureType, buildableDimensions]);

  // Auto-fit camera when dimensions change
  const target = useMemo(() => {
    const { lengthMM, widthMM } = footprint;
    const heightMM = stackedHeight(courses);
    return new THREE.Vector3(lengthMM / 2, heightMM / 2, widthMM / 2);
  }, [footprint, courses]);

  useEffect(() => {
    if (!controlsRef.current) return;

    const { lengthMM, widthMM } = footprint;
    const heightMM = stackedHeight(courses);
    const maxDim = Math.max(lengthMM, widthMM, heightMM);

    controlsRef.current.target.copy(target);
    controlsRef.current.object.position.set(
      lengthMM / 2 + maxDim * 1.0,
      heightMM + maxDim * 0.5,
      widthMM / 2 + maxDim * 1.0
    );
    controlsRef.current.update();
  }, [footprint, courses, target]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isPresentationMode ? 0.54 : 0.4} />
      <directionalLight
        position={[10000, 15000, 10000]}
        intensity={isPresentationMode ? 0.78 : 0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15000}
        shadow-camera-right={15000}
        shadow-camera-top={15000}
        shadow-camera-bottom={-15000}
        shadow-camera-near={1}
        shadow-camera-far={50000}
        shadow-bias={-0.002}
      />
      <hemisphereLight
        args={['#dfe8f2', '#907a62', isPresentationMode ? 0.26 : 0.3]}
      />
      {isPresentationMode && (
        <directionalLight
          position={[0, 12000, 0]}
          intensity={0.16}
          castShadow={false}
        />
      )}
      {isPresentationMode && (
        <directionalLight
          position={[-9000, 7000, 5000]}
          intensity={0.24}
          castShadow={false}
        />
      )}

      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial
          color={isPresentationMode ? '#d3d7dc' : '#e8e8e8'}
          roughness={1}
        />
      </mesh>

      {/* Grid */}
      <gridHelper
        args={[20000, 40, '#cccccc', '#e0e0e0']}
        position={[0, 0, 0]}
      />

      {/* Blocks */}
      <BlockScene />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        target={target}
        enableDamping
        dampingFactor={0.1}
        minDistance={500}
        maxDistance={100000}
      />
    </>
  );
}
