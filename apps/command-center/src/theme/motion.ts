import { useReducedMotion } from 'react-native-reanimated';
import { duration, spring, type DurationToken } from './tokens';

/**
 * The only way components should obtain animation timings. When the OS asks
 * for reduced motion every non-essential duration collapses to 0.
 */
export function useMotion() {
  const reduceMotion = useReducedMotion();
  return {
    reduceMotion,
    duration: (token: DurationToken) => (reduceMotion ? 0 : duration[token]),
    spring,
  };
}
