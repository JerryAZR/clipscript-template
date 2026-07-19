import { useCurrentFrame } from "remotion";

/**
 * Clip-local frame with the enter transition compensated: frame 0 is when the
 * clip has fully arrived, so content animations don't run during the slide-in.
 * Must be called inside a clip component (i.e. inside the clip's Sequence).
 */
export const useClipFrame = (transitionIn = 0): number =>
  Math.max(0, useCurrentFrame() - transitionIn);
