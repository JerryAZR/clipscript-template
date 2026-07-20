import { AnnotationHandler, InnerLine } from "codehike/code";
import { rgba } from "polished";

// Query carries style only (an optional color) - timing is the framework's
// job, not the marker's: `// !mark(1:2) #22c55e` or bare `// !mark(1:2)`.
// Annotations appear instantly with their code state; they never re-fade,
// which keeps chained clips visually continuous.
export const MARK_DEFAULT_COLOR = "#eab308";

const colorOf = (query?: string) => query?.trim() || MARK_DEFAULT_COLOR;

export const mark: AnnotationHandler = {
  name: "mark",
  // No `onlyIfAnnotated`: the wrapper must render for every line so the
  // layout stays identical between steps with and without marks,
  // otherwise token transitions would animate the layout shift.
  Line: ({ annotation, ...props }) => {
    const color = colorOf(annotation?.query);
    return (
      <div
        style={{
          borderLeft: "2px solid",
          borderLeftColor: annotation ? rgba(color, 0.9) : "transparent",
          backgroundColor: annotation
            ? rgba(color, 0.15)
            : "transparent",
        }}
      >
        <InnerLine merge={props} />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const color = colorOf(annotation.query);
    return (
      <div
        style={{
          display: "inline-block",
          backgroundColor: rgba(color, 0.25),
          outline: `1px solid ${rgba(color, 0.6)}`,
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
