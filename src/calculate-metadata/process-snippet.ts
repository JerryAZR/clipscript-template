import { highlight } from "codehike/code";
import { PublicFolderFile } from "./get-files";
import { Theme } from "./theme";

/**
 * Pure syntax highlighting via Code Hike (TextMate grammars), language
 * inferred from the file extension. No semantic layer: twoslash was dropped
 * (it only ever served ts/tsx type callouts and error squiggles, unused by
 * real episodes, at the cost of a 12MB vendored compiler lib set).
 */
export const processSnippet = async (step: PublicFolderFile, theme: Theme) => {
  const extension = step.filename.split(".").pop()!;
  return highlight(
    {
      lang: extension,
      meta: step.filename,
      value: step.value,
    },
    theme,
  );
};
