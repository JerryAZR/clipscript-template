import { AnnotationHandler, InnerLine, InnerPre, InnerToken } from "codehike/code";

// Opt-in: add to the handlers array in CodeTransition.tsx to wrap long lines
// instead of letting them overflow (only relevant with a fixed composition
// width; with `width: "auto"` the video is sized to fit the longest line).
// Continuation lines hang-indent to the line's original indentation.
export const wordWrap: AnnotationHandler = {
  name: "word-wrap",
  Pre: (props) => <InnerPre merge={props} style={{ whiteSpace: "pre-wrap" }} />,
  Line: (props) => (
    <InnerLine merge={props}>
      <div
        style={{
          textIndent: `${-props.indentation}ch`,
          marginLeft: `${props.indentation}ch`,
        }}
      >
        {props.children}
      </div>
    </InnerLine>
  ),
  Token: (props) => <InnerToken merge={props} style={{ textIndent: 0 }} />,
};
