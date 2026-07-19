import type { HighlightedCode } from "codehike/code";
import { staticFile } from "remotion";
import { processSnippet } from "../calculate-metadata/process-snippet";
import type { Theme } from "../calculate-metadata/theme";

/**
 * Pre-highlights every code step (async - must not happen during render).
 * Language comes from the file extension; ts/tsx additionally goes through
 * twoslash for `^?` type queries and compiler errors (see process-snippet.ts).
 */
export const highlightCodeSteps = async (
  episode: string,
  srcs: string[],
  theme: Theme,
): Promise<Record<string, HighlightedCode>> => {
  const entries = await Promise.all(
    srcs.map(async (src): Promise<[string, HighlightedCode]> => {
      const response = await fetch(staticFile(`${episode}/code/${src}`));
      if (!response.ok) {
        throw new Error(
          `code step '${src}' not found for episode '${episode}' (HTTP ${response.status})`,
        );
      }
      const value = await response.text();
      const highlighted = await processSnippet({ filename: src, value }, theme);
      return [src, highlighted];
    }),
  );
  return Object.fromEntries(entries);
};
