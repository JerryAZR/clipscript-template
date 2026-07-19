import { AnnotationHandler, BlockAnnotation, InnerLine } from "codehike/code";
import { interpolate, useCurrentFrame } from "remotion";
import { MARK_DELAY, MARK_DURATION } from "./Mark";

// `// !diff(1:2) +` marks lines as added (green), `// !diff(1:2) -` as removed (red).
// Composes with the `mark` handler by re-emitting a colored mark annotation,
// so `mark` must be present in the handlers array as well.
export const diff: AnnotationHandler = {
  name: "diff",
  transform: (annotation: BlockAnnotation) => {
    const removed = annotation.query.trim().startsWith("-");
    const color = removed ? "#f85149" : "#3fb950";
    return [annotation, { ...annotation, name: "mark", query: color }];
  },
  // Like `mark`, no `onlyIfAnnotated` so the layout never changes between steps.
  Line: ({ annotation, ...props }) => {
    const frame = useCurrentFrame();
    const opacity = annotation
      ? interpolate(
          frame,
          [MARK_DELAY, MARK_DELAY + MARK_DURATION],
          [0, 0.8],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 0;
    const removed = annotation?.query.trim().startsWith("-");

    return (
      <>
        <span
          style={{
            // Absolutely positioned so the sign never shifts the code layout
            position: "absolute",
            marginLeft: "-2ch",
            opacity,
            userSelect: "none",
          }}
        >
          {annotation ? (removed ? "-" : "+") : null}
        </span>
        <InnerLine merge={props} />
      </>
    );
  },
};
