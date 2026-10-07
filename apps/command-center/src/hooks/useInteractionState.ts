import { useCallback, useMemo, useState } from 'react';

/**
 * Hover and focus tracking for Pressables. React Native only reports `pressed`
 * in its style callback, so hover (web pointer) and focus (keyboard, web and
 * hardware keyboards) are tracked through the Pressable event props.
 */
export function useInteractionState() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  const handlers = useMemo(
    () => ({ onHoverIn, onHoverOut, onFocus, onBlur }),
    [onHoverIn, onHoverOut, onFocus, onBlur],
  );
  return { hovered, focused, handlers };
}
