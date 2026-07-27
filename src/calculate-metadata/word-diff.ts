import { InlineAnnotation } from "codehike/code";
import { diffWordsWithSpace } from "diff";

/**
 * Token-level ("inline") diff for the `!from` annotation: the author puts the
 * full OLD version of a line in a trailing comment (`// !from int old_var = f()`)
 * and the renderer shows the mutation inline - new spans on a green background,
 * removed text injected before them struck through on a red background.
 *
 * This module turns (old line, new line) into synthetic inline annotations
 * consumed by the `ins`/`del` handlers in src/annotations/InlineDiff.tsx:
 * - a pure insertion emits `ins` over the inserted span (green)
 * - a replacement emits `ins` over the new span with `data.removed` carrying
 *   the old text (struck red prefix rendered by the handler)
 * - a pure deletion emits `del` anchored on the column where the removed text
 *   used to sit (struck red injection, no green)
 *
 * The diff itself is jsdiff's word diff (whitespace-significant, so code
 * punctuation aligns on word boundaries). A future "diff two step files"
 * helper should run diffLines to pair up changed lines, then reuse
 * inlineDiffFromLine on each modified pair.
 */

export type DiffOp = { type: "same" | "del" | "ins"; text: string };

/**
 * Word-level diff of two single lines, as an op sequence in new-line order.
 * Pure wrapper over jsdiff with the project's same/del/ins vocabulary.
 */
export const diffWords = (oldLine: string, newLine: string): DiffOp[] =>
  diffWordsWithSpace(oldLine, newLine).map((part) => ({
    type: part.added ? "ins" : part.removed ? "del" : "same",
    text: part.value,
  }));

/**
 * Maps a word diff onto synthetic inline annotations for one line.
 * Columns are 1-based and inclusive, matching Code Hike's inline annotations.
 * Returns [] when the lines are identical (caller decides how to complain).
 */
export const inlineDiffFromLine = (
  lineNumber: number,
  oldLine: string,
  newLine: string,
): InlineAnnotation[] => {
  // Trailing whitespace is never meaningful (comment stripping leaves some
  // behind on annotated lines) and would diff as a bogus insertion.
  const oldText = oldLine.trimEnd();
  const newText = newLine.trimEnd();
  const ops = diffWords(oldText, newText);
  const annotations: InlineAnnotation[] = [];

  let column = 1;
  // A deletion immediately followed by an insertion is a replacement: the
  // removed text rides on the `ins` annotation so the handler can render it
  // struck right before the green span. A deletion not followed by an
  // insertion becomes a standalone `del` injection.
  let pendingDel: { text: string; column: number } | null = null;

  const flushDel = () => {
    if (!pendingDel) return;
    if (pendingDel.column > newText.length) {
      // Removed text was at the very end of the line: anchor on the last
      // column and let the handler inject after it (a past-the-end anchor
      // would match no token and crash Code Hike's grouping).
      const last = Math.max(1, newText.length);
      annotations.push({
        name: "del",
        query: pendingDel.text,
        lineNumber,
        fromColumn: last,
        toColumn: last,
        data: { position: "after" },
      });
    } else {
      annotations.push({
        name: "del",
        query: pendingDel.text,
        lineNumber,
        fromColumn: pendingDel.column,
        toColumn: pendingDel.column,
        data: { position: "before" },
      });
    }
    pendingDel = null;
  };

  for (const op of ops) {
    if (op.type === "same") {
      flushDel();
      column += op.text.length;
    } else if (op.type === "del") {
      flushDel();
      pendingDel = { text: op.text, column };
    } else {
      const removed = pendingDel?.text;
      pendingDel = null;
      annotations.push({
        name: "ins",
        query: "",
        lineNumber,
        fromColumn: column,
        toColumn: column + op.text.length - 1,
        data: removed !== undefined ? { removed } : undefined,
      });
      column += op.text.length;
    }
  }
  flushDel();
  return annotations;
};
