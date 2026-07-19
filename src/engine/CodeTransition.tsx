/* eslint-disable @remotion/non-pure-animation -- frame arrives as a prop but is derived from useCurrentFrame() upstream; still purely frame-driven */
import { AnnotationHandler, HighlightedCode, InnerLine, Pre } from "codehike/code";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { Easing, interpolate, useDelayRender } from "remotion";

import {
  calculateTransitions,
  getStartingSnapshot,
  TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import { callout } from "../annotations/Callout";
import { diff } from "../annotations/Diff";
import { errorInline, errorMessage } from "../annotations/Error";
import { focus } from "../annotations/Focus";
import { tokenTransitions } from "../annotations/InlineToken";
import { mark } from "../annotations/Mark";
import { applyStyle } from "../utils";
import { codeFontFamily, codeFontSize, codeLineHeight, codeTabSize } from "./code-style";

// Wraps every line in a .ch-line div so the snapshot matcher can operate on
// whole lines instead of tokens (for big rewrites where token diffing is soup)
const lineTransitions: AnnotationHandler = {
  name: "line-transitions",
  Line: (props) => (
    <div className="ch-line">
      <InnerLine merge={props} />
    </div>
  ),
};

/**
 * Frame-driven code morph between two highlighted states. Unlike the version
 * in src/CodeTransition.tsx (old Main composition), the frame is passed in by
 * the parent and the component is re-keyed per step, so state resets are
 * handled by React remounting.
 */
export function CodeTransition({
  oldCode,
  newCode,
  frame,
  durationInFrames = 30,
  transition = "token",
}: {
  readonly oldCode: HighlightedCode | null;
  readonly newCode: HighlightedCode;
  /** Frames since this step started */
  readonly frame: number;
  readonly durationInFrames?: number;
  readonly transition?: "token" | "line";
}) {
  const ref = React.useRef<HTMLPreElement>(null);
  const [oldSnapshot, setOldSnapshot] =
    useState<TokenTransitionsSnapshot | null>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = React.useState(() => delayRender());

  // Step 0 morphs "from itself" (static display). Skipping the transition
  // machinery also avoids a bogus snapshot: Sequences premount offscreen
  // (top: -999999px), so a mount-time snapshot measures garbage positions.
  const isStatic = oldCode !== null && oldCode.code === newCode.code;

  const prevCode: HighlightedCode = useMemo(() => {
    return oldCode || { ...newCode, tokens: [], annotations: [] };
  }, [newCode, oldCode]);

  const code = useMemo(() => {
    return isStatic || oldSnapshot ? newCode : prevCode;
  }, [isStatic, newCode, prevCode, oldSnapshot]);

  const selector = transition === "line" ? ".ch-line" : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (isStatic) {
      continueRender(handle);
      return;
    }
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!, { selector }));
      return;
    }
    const transitions = calculateTransitions(ref.current!, oldSnapshot, {
      selector,
    });
    transitions.forEach(({ element, keyframes, options }) => {
      const delay = durationInFrames * options.delay;
      const duration = durationInFrames * options.duration;
      const linearProgress = interpolate(
        frame,
        [delay, delay + duration],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
      const progress = interpolate(linearProgress, [0, 1], [0, 1], {
        easing: Easing.bezier(0.17, 0.67, 0.76, 0.91),
      });

      applyStyle({
        element,
        keyframes,
        progress,
        linearProgress,
      });
    });
    continueRender(handle);
  });

  const handlers: AnnotationHandler[] = useMemo(() => {
    return [
      transition === "line" ? lineTransitions : tokenTransitions,
      mark,
      diff,
      focus,
      callout,
      errorInline,
      errorMessage,
    ];
  }, [transition]);

  const style: React.CSSProperties = useMemo(() => {
    return {
      position: "relative",
      margin: 0,
      fontSize: codeFontSize,
      lineHeight: codeLineHeight,
      fontFamily: codeFontFamily,
      tabSize: codeTabSize,
    };
  }, []);

  return <Pre ref={ref} code={code} handlers={handlers} style={style} />;
}
