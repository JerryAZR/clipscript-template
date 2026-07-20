import { AnnotationHandler, InnerLine } from "codehike/code";

// `// !focus(1:3)` keeps the annotated lines at full opacity and dims the rest.
// Opacity-only, so `onlyIfAnnotated` is safe: it never changes the layout.
export const focus: AnnotationHandler = {
  name: "focus",
  onlyIfAnnotated: true,
  Line: ({ annotation, ...props }) => {
    return (
      <InnerLine merge={props} style={{ opacity: annotation ? 1 : 0.3 }} />
    );
  },
};
