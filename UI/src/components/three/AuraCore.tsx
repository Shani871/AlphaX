/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CoreState } from '../../mock/mockSession';
import { AudioField } from './AudioField';

interface AuraCoreProps {
  state: CoreState;
  audioLevel?: number;
  audioLevels?: {
    bass: number;
    mid: number;
    treble: number;
  };
  className?: string;
  isHeroMode?: boolean;
}

class ThreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('Three.js / WebGL context notice:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const AuraCore: React.FC<AuraCoreProps> = ({
  state,
  audioLevel = 0.5,
  audioLevels = { bass: audioLevel, mid: audioLevel, treble: audioLevel },
  className = '',
  isHeroMode = false,
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2));

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionHandler);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fallback if WebGL fails
  const renderFallback = (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#000000]">
      <div className="w-24 h-24 rounded-full border border-[#7FFFD4]/40 animate-pulse bg-[#7FFFD4]/10" />
    </div>
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-transparent select-none ${className}`}
    >
      <ThreeErrorBoundary fallback={renderFallback}>
        <Canvas
          dpr={dpr}
          camera={{
            position: [0, isHeroMode ? 3.0 : 2.4, isHeroMode ? 4.8 : 3.6],
            fov: isHeroMode ? 48 : 44,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.2} />

          <Suspense fallback={null}>
            <AudioField
              state={state}
              audioLevels={audioLevels}
              reducedMotion={reducedMotion}
              isMobile={isMobile}
              scaleFactor={isHeroMode ? 1.35 : 1.15}
            />

            {!isMobile && (
              <EffectComposer multisampling={0}>
                <Bloom
                  luminanceThreshold={0.25}
                  luminanceSmoothing={0.8}
                  intensity={isHeroMode ? 0.6 : 0.5}
                  radius={0.3}
                  mipmapBlur={false}
                />
              </EffectComposer>
            )}
          </Suspense>
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
};

// AuraCore export
export default AuraCore;
