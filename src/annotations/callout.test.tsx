import { getThemeColors } from "@code-hike/lighter";
import { Pre } from "codehike/code";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { processSnippet } from "../calculate-metadata/process-snippet";
import { ThemeColorsContext } from "../calculate-metadata/theme";
import { callout } from "./Callout";
import { diff } from "./Diff";
import { errorInline, errorMessage } from "./Error";
import { focus } from "./Focus";
import { del, ins } from "./InlineDiff";
import { tokenTransitions } from "./InlineToken";
import { mark } from "./Mark";

// Regression test for a bug seen downstream: the diff handler's Line wraps
// EVERY line in a flex row (for the +/− gutter), so an AnnotatedLine that
// returns bare [line, callout] siblings makes the callout box a flex item,
// floating to the right of the code line instead of stacking below it.
// The callout must be wrapped so the flex row sees a single child.

const CALLOUT_TEXT = "pushes into shared state";

type Tag = { name: string; attrs: string };

/** Tags enclosing the first occurrence of `text` in an HTML string,
 *  innermost last. */
const enclosingTags = (html: string, text: string): Tag[] => {
  const idx = html.indexOf(text);
  if (idx === -1) {
    throw new Error(`text not found in markup: ${text}`);
  }
  const stack: Tag[] = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = tagRe.exec(html)) && m.index < idx) {
    const [, closing, name, attrs] = m;
    if (closing) {
      const i = stack.map((t) => t.name).lastIndexOf(name);
      if (i >= 0) {
        stack.length = i;
      }
    } else if (!m[0].endsWith("/>")) {
      stack.push({ name, attrs });
    }
  }
  return stack;
};

const renderCallout = async () => {
  const highlighted = await processSnippet(
    {
      filename: "users.ts",
      value:
        "export const addUser = (user: User): void => {\n" +
        `  users.push(user); // !callout[9:13] ${CALLOUT_TEXT}\n` +
        "};\n",
    },
    "github-dark",
  );
  const themeColors = await getThemeColors("github-dark");
  // The engine's exact handler list (CodeTransition.tsx)
  return renderToStaticMarkup(
    createElement(
      ThemeColorsContext.Provider,
      { value: themeColors },
      createElement(Pre, {
        code: highlighted,
        handlers: [
          tokenTransitions,
          mark,
          diff,
          ins,
          del,
          focus,
          callout,
          errorInline,
          errorMessage,
        ],
      }),
    ),
  );
};

describe("callout annotation", () => {
  it("stacks the callout below the code line, not as a flex item beside it", async () => {
    const html = await renderCallout();
    const tags = enclosingTags(html, CALLOUT_TEXT);
    const calloutBox = tags[tags.length - 1];
    const parent = tags[tags.length - 2];
    const lineRow = tags[tags.length - 3];

    // Sanity: we really are inside the diff handler's flex line row
    expect(calloutBox.attrs).toContain("min-width");
    expect(lineRow.attrs).toContain("display:flex");

    // The regression: the callout's parent must not be the flex row itself -
    // line and callout share a single block wrapper inside it.
    expect(parent.name).toBe("div");
    expect(parent.attrs).not.toContain("display:flex");
  });
});
