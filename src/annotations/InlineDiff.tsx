import { AnnotationHandler } from "codehike/code";
import { rgba } from "polished";
import { CSSProperties } from "react";
import { DIFF_ADD_COLOR, DIFF_REMOVE_COLOR } from "./Diff";

// Token-level diff rendering for the synthetic annotations produced by
// word-diff.ts (via the `!from` authoring annotation - see process-snippet.ts).
// Authors never write `ins`/`del` by hand: one trailing comment carries at
// most one annotation, and a replacement needs both a green span and an
// injected struck span, which only the desugar pass can emit together.
//
// Like every other annotation these appear instantly with their code state -
// no fades - so chained clips stay visually continuous.

const highlightStyle = (color: string): CSSProperties => ({
  display: "inline-block",
  backgroundColor: rgba(color, 0.25),
  outline: `1px solid ${rgba(color, 0.6)}`,
  borderRadius: 4,
  padding: "0 0.125rem",
  margin: "0 -0.125rem",
});

const removedStyle: CSSProperties = {
  ...highlightStyle(DIFF_REMOVE_COLOR),
  textDecoration: "line-through",
};

// Green span over inserted/new text. `data.removed` (replacement) prepends
// the old text struck through, so `old_var` -> `renamed_var` reads as
// "old_var(struck) renamed_var(green)" on one line.
export const ins: AnnotationHandler = {
  name: "ins",
  Inline: ({ annotation, children }) => {
    const removed: string | undefined = annotation.data?.removed?.trim();
    return (
      <>
        {removed ? (
          <>
            <span style={removedStyle}>{removed}</span>{" "}
          </>
        ) : null}
        <span style={highlightStyle(DIFF_ADD_COLOR)}>{children}</span>
      </>
    );
  },
};

// Pure deletion: the removed text (in the query) is injected struck through
// next to the anchor token - before it by default, after it when the removal
// was at the end of the line (`data.position`). The anchor itself renders
// normally. The separating space keeps the struck text readable against its
// neighbor; leading/trailing whitespace in the query is trimmed away.
export const del: AnnotationHandler = {
  name: "del",
  Inline: ({ annotation, children }) => {
    const struck = <span style={removedStyle}>{annotation.query.trim()}</span>;
    return annotation.data?.position === "after" ? (
      <>
        {children} {struck}
      </>
    ) : (
      <>
        {struck} {children}
      </>
    );
  },
};
