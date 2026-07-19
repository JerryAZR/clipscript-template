import { AnnotationHandler, InnerLine } from "codehike/code";
import { rgba } from "polished";
import { interpolate, useCurrentFrame } from "remotion";

// Query carries style only (an optional color) - timing is the framework's
// job, not the marker's: `// !mark(1:2) #22c55e` or bare `// !mark(1:2)`
export const MARK_DELAY = 35;
export const MARK_DURATION = 15;
export const MARK_DEFAULT_COLOR = "#eab308";

const colorOf = (query?: string) => query?.trim() || MARK_DEFAULT_COLOR;

const useMarkProgress = () => {
  const frame = useCurrentFrame();
  return interpolate(frame, [MARK_DELAY, MARK_DELAY + MARK_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const mark: AnnotationHandler = {
  name: "mark",
  // No `onlyIfAnnotated`: the wrapper must render for every line so the
  // layout stays identical between steps with and without marks,
  // otherwise token transitions would animate the layout shift.
  Line: ({ annotation, ...props }) => {
    const progress = useMarkProgress();
    const color = colorOf(annotation?.query);
    return (
      <div
        style={{
          borderLeft: "2px solid",
          borderLeftColor: annotation
            ? rgba(color, progress * 0.9)
            : "transparent",
          backgroundColor: annotation
            ? rgba(color, progress * 0.15)
            : "transparent",
        }}
      >
        <InnerLine merge={props} />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const progress = useMarkProgress();
    const color = colorOf(annotation.query);
    return (
      <div
        style={{
          display: "inline-block",
          backgroundColor: rgba(color, progress * 0.25),
          outline: `1px solid ${rgba(color, progress * 0.6)}`,
          borderRadius: 4,
          padding: "0 0.125rem",
          margin: "0 -0.125rem",
        }}
      >
        {children}
      </div>
    );
  },
};
