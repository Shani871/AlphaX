/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CoreState } from '../../mock/mockSession';

interface AudioFieldProps {
  state: CoreState;
  audioLevels: {
    bass: number;
    mid: number;
    treble: number;
  };
  reducedMotion: boolean;
  isMobile?: boolean;
  scaleFactor?: number;
}

// Generate soft circular radial gradient sprite texture at 128x128px (never small, keeps particles sharp)
function getSoftSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(232, 236, 255, 0.35)');
    gradient.addColorStop(0.8, 'rgba(159, 180, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export const AudioField: React.FC<AudioFieldProps> = ({
  state,
  audioLevels,
  reducedMotion,
  isMobile = false,
  scaleFactor = 1.0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const starfieldRef = useRef<THREE.Points>(null);
  const spriteTexture = useMemo(() => getSoftSpriteTexture(), []);

  // Track interruption snap and easing
  const interruptionTimer = useRef<number>(0);
  const previousState = useRef<CoreState>(state);

  // 1. Generate Logarithmic Spiral Point Distribution & Base Colors
  // Mathematical spiral: r = a * e^(b * theta)
  const { positions, baseColors, pointCount } = useMemo(() => {
    const numArms = 3;
    const pointsPerArm = isMobile ? 650 : 1300;
    const corePoints = isMobile ? 450 : 950;
    const totalPoints = numArms * pointsPerArm + corePoints;

    const pos = new Float32Array(totalPoints * 3);
    const cols = new Float32Array(totalPoints * 3);

    let idx = 0;

    // A. Dense hot white-blue galactic core
    for (let i = 0; i < corePoints; i++) {
      const u = Math.random();
      const radius = Math.pow(u, 2) * (0.75 * scaleFactor);
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 0.16 * (1 - radius / (0.75 * scaleFactor));

      pos[idx * 3] = Math.cos(angle) * radius;
      pos[idx * 3 + 1] = height;
      pos[idx * 3 + 2] = Math.sin(angle) * radius;

      // Bright white core fading to cool blue
      const whiteRatio = Math.max(0, 1 - radius / (0.5 * scaleFactor));
      cols[idx * 3] = 0.95 + whiteRatio * 0.05; // R
      cols[idx * 3 + 1] = 0.96 + whiteRatio * 0.04; // G
      cols[idx * 3 + 2] = 1.0; // B
      idx++;
    }

    // B. Logarithmic Spiral Arms: r = a * e^(b * theta)
    const a = 0.22 * scaleFactor;
    const b = 0.28;
    const maxTheta = Math.PI * 4.2; // ~2.1 full rotations

    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * 2 * Math.PI) / numArms;

      for (let p = 0; p < pointsPerArm; p++) {
        const progress = p / pointsPerArm;
        const theta = Math.pow(progress, 0.85) * maxTheta;
        const r = a * Math.exp(b * theta);

        // Scatter/jitter perpendicular to arm, expanding with distance
        const jitterR = (Math.random() - 0.5) * (0.08 + progress * 0.38) * scaleFactor;
        const jitterTheta = (Math.random() - 0.5) * (0.12 + progress * 0.25);
        const effectiveR = Math.max(0.1, r + jitterR);
        const effectiveAngle = theta + armOffset + jitterTheta;

        const verticalSpread = (Math.random() - 0.5) * (0.06 + progress * 0.22) * scaleFactor;

        pos[idx * 3] = Math.cos(effectiveAngle) * effectiveR;
        pos[idx * 3 + 1] = verticalSpread;
        pos[idx * 3 + 2] = Math.sin(effectiveAngle) * effectiveR;

        // Two-tone color: 85% cool white-to-blue (#E8ECFF -> #9FB4FF), 15% warm amber (#F2C88F)
        const isWarmAmber = Math.random() < 0.15 + progress * 0.15; // weighted towards outer arms

        if (isWarmAmber) {
          // Warm amber #F2C88F = (0.95, 0.78, 0.56)
          cols[idx * 3] = 0.95;
          cols[idx * 3 + 1] = 0.78;
          cols[idx * 3 + 2] = 0.56;
        } else {
          // Cool white-blue (#E8ECFF fading to #9FB4FF)
          const falloff = progress;
          cols[idx * 3] = 0.91 - falloff * 0.29; // 0.91 -> 0.62 (#9FB4FF)
          cols[idx * 3 + 1] = 0.93 - falloff * 0.22; // 0.93 -> 0.71
          cols[idx * 3 + 2] = 1.0; // 1.0 -> 1.0
        }

        idx++;
      }
    }

    return { positions: pos, baseColors: cols, pointCount: totalPoints };
  }, [isMobile, scaleFactor]);

  // 2. Background Starfield (200-400 points, dimmer, further back)
  const starfieldPositions = useMemo(() => {
    const count = isMobile ? 180 : 350;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = (4.5 + Math.random() * 3.5) * scaleFactor;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);
    }
    return pos;
  }, [isMobile, scaleFactor]);

  // Buffer geometries created once (useMemo, never rebuilt per frame)
  const galaxyGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(baseColors), 3));
    return geom;
  }, [positions, baseColors]);

  const starfieldGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(starfieldPositions, 3));
    return geom;
  }, [starfieldPositions]);

  // Handle instant interruption snap
  useEffect(() => {
    if (state === 'AI_INTERRUPTED') {
      interruptionTimer.current = 1.0; // full red snap
    }
    previousState.current = state;
  }, [state]);

  // Frame loop for motion, rotation, audio reactivity & state tinting
  useFrame((_, delta) => {
    if (!groupRef.current || !pointsRef.current) return;

    // Decay interruption snap over ~250ms
    if (interruptionTimer.current > 0) {
      interruptionTimer.current = Math.max(0, interruptionTimer.current - delta * 4.0);
    }

    // Motion & Audio Reactivity
    if (!reducedMotion) {
      // mid band modulates rotation speed multiplier (1.0x to 1.6x)
      const midMultiplier = 1.0 + (audioLevels.mid || 0) * 0.6;
      let baseSpeed = 0.12;

      if (state === 'IDLE') {
        baseSpeed = 0.05;
      } else if (state === 'AI_INTERRUPTED') {
        baseSpeed = 0.0; // rotation briefly halts
      } else if (state === 'AI_SPEAKING') {
        baseSpeed = 0.09;
      }

      groupRef.current.rotation.y += baseSpeed * midMultiplier * delta;

      // Subtle wobble tilt
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0008) * 0.08 + 0.35;
      groupRef.current.rotation.z = Math.cos(Date.now() * 0.0006) * 0.04;
    } else {
      groupRef.current.rotation.x = 0.35;
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
    }

    // Scale driven by bass frequency band
    const targetScale =
      state === 'IDLE'
        ? 0.95
        : 1.0 + (state === 'USER_SPEAKING' || state === 'AI_SPEAKING' ? (audioLevels.bass || 0) * 0.14 : 0.02);

    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Dynamic vertex tinting based on state
    const colorAttr = galaxyGeometry.attributes.color as THREE.BufferAttribute;
    const colors = colorAttr.array as Float32Array;

    const isInterrupted = interruptionTimer.current > 0.05;
    const isTranslating = state === 'TRANSLATING';
    const isSpeakingUser = state === 'USER_SPEAKING';
    const isSpeakingAI = state === 'AI_SPEAKING';
    const isIdle = state === 'IDLE';

    // Treble modulates random sparkle/twinkle on a small subset
    const trebleSparkle = !reducedMotion && (audioLevels.treble || 0) > 0.3;

    for (let i = 0; i < pointCount; i++) {
      const idx = i * 3;
      const baseR = baseColors[idx];
      const baseG = baseColors[idx + 1];
      const baseB = baseColors[idx + 2];

      const x = positions[idx];
      const z = positions[idx + 2];
      const distFromCenter = Math.sqrt(x * x + z * z);
      const isInner = distFromCenter < 1.3 * scaleFactor;

      let r = baseR;
      let g = baseG;
      let b = baseB;

      if (isInterrupted) {
        // Instant snap to danger red (#EF4B52) in core
        const interpWeight = interruptionTimer.current * Math.max(0, 1 - distFromCenter / (1.5 * scaleFactor));
        r = THREE.MathUtils.lerp(r, 0.94, interpWeight);
        g = THREE.MathUtils.lerp(g, 0.29, interpWeight);
        b = THREE.MathUtils.lerp(b, 0.32, interpWeight);
      } else if (isTranslating) {
        // Amber wash across whole spiral (#E3A54A)
        r = THREE.MathUtils.lerp(r, 0.89, 0.5);
        g = THREE.MathUtils.lerp(g, 0.65, 0.5);
        b = THREE.MathUtils.lerp(b, 0.29, 0.5);
      } else if (isSpeakingUser && isInner) {
        // Shift toward success green (#3ECF8E)
        const greenWeight = Math.max(0, 1 - distFromCenter / (1.3 * scaleFactor)) * (0.6 + (audioLevels.bass || 0) * 0.4);
        r = THREE.MathUtils.lerp(r, 0.24, greenWeight);
        g = THREE.MathUtils.lerp(g, 0.81, greenWeight);
        b = THREE.MathUtils.lerp(b, 0.56, greenWeight);
      } else if (isSpeakingAI && isInner) {
        // Shift toward primary blue (#5B7FFF)
        const blueWeight = Math.max(0, 1 - distFromCenter / (1.3 * scaleFactor)) * 0.75;
        r = THREE.MathUtils.lerp(r, 0.36, blueWeight);
        g = THREE.MathUtils.lerp(g, 0.5, blueWeight);
        b = THREE.MathUtils.lerp(b, 1.0, blueWeight);
      } else if (isIdle) {
        // Dim base
        r *= 0.45;
        g *= 0.45;
        b *= 0.45;
      }

      // Treble sparkle flicker on small random subset
      if (trebleSparkle && Math.random() < 0.04) {
        r = Math.min(1, r * 1.5);
        g = Math.min(1, g * 1.5);
        b = Math.min(1, b * 1.5);
      }

      // Smooth lerp to target color
      colors[idx] = THREE.MathUtils.lerp(colors[idx], r, 0.15);
      colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], g, 0.15);
      colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], b, 0.15);
    }

    colorAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {/* Background Starfield Layer */}
      <points ref={starfieldRef} geometry={starfieldGeometry}>
        <pointsMaterial
          size={0.035 * (scaleFactor > 1.1 ? 1.2 : 1.0)}
          color="#A3AAB5"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Main Spiral Galaxy Points */}
      <points ref={pointsRef} geometry={galaxyGeometry}>
        <pointsMaterial
          size={isMobile ? 0.055 : scaleFactor > 1.1 ? 0.075 : 0.065}
          map={spriteTexture}
          vertexColors
          transparent
          opacity={state === 'IDLE' ? 0.5 : 0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
