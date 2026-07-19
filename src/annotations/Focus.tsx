import { AnnotationHandler, InnerLine } from "codehike/code";
import { interpolate, useCurrentFrame } from "remotion";

// `// !focus(1:3)` keeps the annotated lines at full opacity and dims the rest.
// Opacity-only, so `onlyIfAnnotated` is safe: it never changes the layout.
export const focus: AnnotationHandler = {
  name: "focus",
  onlyIfAnnotated: true,
  Line: ({ annotation, ...props }) => {
    const frame = useCurrentFrame();
    const dimmed = interpolate(frame, [35, 50], [1, 0.3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return <InnerLine merge={props} style={{ opacity: annotation ? 1 : dimmed }} />;
  },
};
