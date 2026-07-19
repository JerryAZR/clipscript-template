import { AnnotationHandler, InnerLine } from "codehike/code";

// Opt-in: add to the handlers array in CodeTransition.tsx to show line numbers.
// Enable it for all steps or none - toggling it between steps shifts token
// positions, which token transitions would animate as a sideways jump.
export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <div style={{ display: "flex" }}>
        <span
          style={{
            minWidth: `${width}ch`,
            marginRight: "1.5ch",
            textAlign: "right",
            opacity: 0.35,
            userSelect: "none",
          }}
        >
          {props.lineNumber}
        </span>
        <InnerLine merge={props} style={{ flex: 1 }} />
      </div>
    );
  },
};
