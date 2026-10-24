import {
  AnnotationHandler,
  InlineAnnotation,
  InnerLine,
  Pre,
} from "codehike/code";
import { mix, readableColor } from "polished";
import { useThemeColors } from "../calculate-metadata/theme";

export const callout: AnnotationHandler = {
  name: "callout",
  transform: (annotation: InlineAnnotation) => {
    const { name, query, lineNumber, fromColumn, toColumn, data } = annotation;
    return {
      name,
      query,
      fromLineNumber: lineNumber,
      toLineNumber: lineNumber,
      data: { ...data, column: (fromColumn + toColumn) / 2 },
    };
  },
  AnnotatedLine: ({ annotation, ...props }) => {
    const { column, codeblock } = annotation.data;
    const { indentation } = props;

    const themeColors = useThemeColors();

    const color = readableColor(themeColors.background);
    const calloutColor = mix(0.08, color, themeColors.background);

    return (
      // Single block wrapper: the diff handler's Line wraps every line in a
      // flex row (for the +/− gutter). Returning bare [line, callout]
      // siblings would make the callout a flex item, floating to the right
      // of the code line instead of stacking below it.
      <div>
        <InnerLine merge={props} />
        <div
          style={{
            minWidth: `${column + 4}ch`,
            marginLeft: `${indentation}ch`,
            width: "fit-content",
            backgroundColor: calloutColor,
            padding: "1rem 2rem",
            position: "relative",
            marginTop: "0.25rem",
            whiteSpace: "pre-wrap",
            color: themeColors.editor.foreground,
          }}
        >
          <div
            style={{
              left: `${column - indentation - 1}ch`,
              position: "absolute",
              width: "1rem",
              height: "1rem",
              transform: "rotate(45deg) translateY(-50%)",
              top: "-2px",
              backgroundColor: calloutColor,
            }}
          />
          {codeblock ? (
            <Pre
              code={codeblock}
              style={{ margin: 0, fontFamily: "inherit" }}
            />
          ) : (
            annotation.data.children || annotation.query
          )}
        </div>
      </div>
    );
  },
};
