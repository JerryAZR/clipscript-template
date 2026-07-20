import { AnnotationHandler, BlockAnnotation, InnerLine } from "codehike/code";

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
    const removed = annotation?.query.trim().startsWith("-");
    const color = removed ? "#f85149" : "#3fb950";

    return (
      // Flex row: InnerLine is block-level in this Code Hike version, so a
      // bare fragment would stack the gutter above the code and double every
      // line's height. The gutter stays in flow (always reserved, so
      // switching between diff and non-diff steps never shifts the code).
      // The column's background and separator are pane-level chrome drawn by
      // the code clip itself - here we only place the sign.
      <div style={{ display: "flex" }}>
        <span
          style={{
            width: "2ch",
            flexShrink: 0,
            userSelect: "none",
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
