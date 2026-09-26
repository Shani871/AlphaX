/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';

export interface FrequencyBands {
  bass: number;
  mid: number;
  treble: number;
}

/**
 * Smooths raw frequency band inputs to prevent sudden jarring jumps
 * in particle animation and shader uniforms.
 */
export function useAudioLevels(rawLevels: FrequencyBands, smoothing = 0.85): FrequencyBands {
  const smoothedRef = useRef<FrequencyBands>({ bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    smoothedRef.current = {
      bass: smoothedRef.current.bass * smoothing + rawLevels.bass * (1 - smoothing),
      mid: smoothedRef.current.mid * smoothing + rawLevels.mid * (1 - smoothing),
      treble: smoothedRef.current.treble * smoothing + rawLevels.treble * (1 - smoothing),
    };
  }, [rawLevels, smoothing]);

  return smoothedRef.current;
}
