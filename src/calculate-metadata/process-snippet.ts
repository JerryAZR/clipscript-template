import { highlight } from "codehike/code";
import { PublicFolderFile } from "./get-files";
import { Theme } from "./theme";
import { inlineDiffFromLine } from "./word-diff";

/**
 * Pure syntax highlighting via Code Hike (TextMate grammars), language
 * inferred from the file extension. No semantic layer: twoslash was dropped
 * (it only ever served ts/tsx type callouts and error squiggles, unused by
 * real episodes, at the cost of a 12MB vendored compiler lib set).
 */
export const processSnippet = async (step: PublicFolderFile, theme: Theme) => {
  const extension = step.filename.split(".").pop()!;
  const highlighted = await highlight(
    {
      lang: extension,
      meta: step.filename,
      value: step.value,
    },
    theme,
  );
  return expandFromAnnotations(highlighted);
};

type Highlighted = Awaited<ReturnType<typeof highlight>>;

/**
 * Desugars `!from <old line>` trailing comments (token-level diff) into the
 * synthetic `ins`/`del` inline annotations rendered by InlineDiff.tsx.
 * Code Hike parses a range-less trailing annotation as a block annotation
 * covering exactly its own line, which is what we intercept here.
 */
const expandFromAnnotations = (highlighted: Highlighted): Highlighted => {
  const froms = highlighted.annotations.filter((a) => a.name === "from");
  if (froms.length === 0) return highlighted;

  const lines = highlighted.code.split("\n");
  const synthetics = [];
  for (const annotation of froms) {
    // `!from` is authored range-less, so Code Hike parses it as a block
    // annotation covering exactly its own line; anything else is misuse.
    // (Local guard: isBlockAnnotation is not in codehike's runtime bundle.)
    if (
      !("fromLineNumber" in annotation) ||
      annotation.fromLineNumber !== annotation.toLineNumber
    ) {
      throw new Error(
        `!from must be a trailing comment on a single line, got ${JSON.stringify(annotation)}`,
      );
    }
    if (!annotation.query) {
      throw new Error(
        `!from on line ${annotation.fromLineNumber} needs the old version of the line as its argument`,
      );
    }
    const newLine = lines[annotation.fromLineNumber - 1] ?? "";
    if (newLine.trim() === "") {
      throw new Error(
        `!from on line ${annotation.fromLineNumber}: the new line is blank - use line-level !diff - for removed lines`,
      );
    }
    // Code Hike trims the annotation query, so the old line lost its leading
    // whitespace; re-align it with the new line's indentation or the diff
    // would report the indent itself as inserted.
    const indent = newLine.match(/^\s*/)?.[0] ?? "";
    const inline = inlineDiffFromLine(
      annotation.fromLineNumber,
      indent + annotation.query,
      newLine,
    );
    if (inline.length === 0) {
      console.warn(
        `!from on line ${annotation.fromLineNumber}: old and new line are identical, nothing to show`,
      );
    }
    synthetics.push(...inline);
  }

  return {
    ...highlighted,
    annotations: [
      ...highlighted.annotations.filter((a) => a.name !== "from"),
      ...synthetics,
    ],
  };
};
