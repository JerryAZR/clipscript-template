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
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 0;
    const removed = annotation?.query.trim().startsWith("-");
    const color = removed ? "#f85149" : "#3fb950";

    return (
      // Flex row: InnerLine is block-level in this Code Hike version, so a
      // bare fragment would stack the gutter above the code and double every
      // line's height. The gutter stays in flow (always reserved, so
      // switching between diff and non-diff steps never shifts the code).
      <div style={{ display: "flex" }}>
        <span
          style={{
            width: "2ch",
            flexShrink: 0,
            userSelect: "none",
            opacity,
            color,
          }}
        >
          {annotation ? (removed ? "-" : "+") : ""}
        </span>
        <InnerLine merge={props} />
      </div>
    );
  },
};
