import { AnnotationHandler, InnerLine } from "codehike/code";
import { rgba } from "polished";
import { interpolate, useCurrentFrame } from "remotion";

export const MARK_DEFAULT_DELAY = 35;
export const MARK_DEFAULT_DURATION = 15;
export const MARK_DEFAULT_COLOR = "#eab308";

// Query format: "<delay in frames> <duration in frames> <color>"
// e.g. `// !mark(1:2) 40 20 #22c55e` - all parts optional
export const parseMarkQuery = (query?: string) => {
  const parts = (query || "").split(" ").filter(Boolean);
  const delay = Number(parts[0]);
  const duration = Number(parts[1]);
  return {
    delay: Number.isNaN(delay) ? MARK_DEFAULT_DELAY : delay,
    duration: Number.isNaN(duration) ? MARK_DEFAULT_DURATION : duration,
    color: parts[2] || MARK_DEFAULT_COLOR,
  };
};

const useMarkProgress = (query?: string) => {
  const { delay, duration } = parseMarkQuery(query);
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], {
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
    const progress = useMarkProgress(annotation?.query);
    const { color } = parseMarkQuery(annotation?.query);
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
    const progress = useMarkProgress(annotation.query);
    const { color } = parseMarkQuery(annotation.query);
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
