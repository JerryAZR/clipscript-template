import { describe, expect, test } from "vitest";
import {
  annotateSeries,
  annotateStatic,
  lineCommentToken,
  lineSimilarity,
} from "./annotate-diff";
import { processSnippet } from "./process-snippet";

describe("lineCommentToken", () => {
  test("known families", () => {
    expect(lineCommentToken("v1.ts")).toBe("//");
    expect(lineCommentToken("app.py")).toBe("#");
    expect(lineCommentToken("q.sql")).toBe("--");
    expect(lineCommentToken("v3.diff.ts")).toBe("//");
  });

  test("unknown extension throws", () => {
    expect(() => lineCommentToken("x.weird")).toThrow(/no line comment token/);
  });
});

describe("lineSimilarity", () => {
  test("identical lines score 1, disjoint lines score 0", () => {
    expect(lineSimilarity("abc", "abc")).toBe(1);
    expect(lineSimilarity("aaa", "xxx")).toBe(0);
  });
});

describe("annotateSeries (animated)", () => {
  test("pure addition marks only the new file", () => {
    const { annotated, reports } = annotateSeries(["a\nb\n", "a\nb\nc\n"], "f.ts");
    expect(annotated[0]).toBe("a\nb\n");
    expect(annotated[1]).toBe("a\nb\n// !diff(1:1) +\nc\n");
    expect(reports[0]).toMatchObject({ added: 1, removed: 0, inline: 0, fallbacks: [] });
  });

  test("pure removal marks only the old file", () => {
    const { annotated, reports } = annotateSeries(["a\nb\nc\n", "a\nc\n"], "f.ts");
    expect(annotated[0]).toBe("a\n// !diff(1:1) -\nb\nc\n");
    expect(annotated[1]).toBe("a\nc\n");
    expect(reports[0]).toMatchObject({ added: 0, removed: 1, inline: 0 });
  });

  test("similar modified pair collapses to a trailing !from", () => {
    const { annotated, reports } = annotateSeries(
      ["const timeout = 1000;\n", "const timeout = 2000;\n"],
      "f.ts",
    );
    expect(annotated[0]).toBe("const timeout = 1000;\n");
    expect(annotated[1]).toBe(
      "const timeout = 2000;  // !from const timeout = 1000;\n",
    );
    expect(reports[0]).toMatchObject({ added: 0, removed: 0, inline: 1 });
  });

  test("dissimilar pair falls back to line-level diff", () => {
    const { annotated, reports } = annotateSeries(
      ["aaa bbb ccc\n", "xxx yyy zzz\n"],
      "f.ts",
    );
    expect(annotated[0]).toBe("// !diff(1:1) -\naaa bbb ccc\n");
    expect(annotated[1]).toBe("// !diff(1:1) +\nxxx yyy zzz\n");
    expect(reports[0].fallbacks).toEqual([{ newStartLine: 1, removed: 1, added: 1 }]);
  });

  test("1-to-2 split pairs the similar opener inline and marks the expansion", () => {
    // "x = foo(" is similar enough to pair inline; the leftover expansion
    // lines are plain additions
    const { annotated, reports } = annotateSeries(
      ["x = foo(a, b)\n", "x = foo(\n  a,\n  b,\n)\n"],
      "f.ts",
    );
    expect(annotated[0]).toBe("x = foo(a, b)\n");
    expect(annotated[1]).toBe(
      "x = foo(  // !from x = foo(a, b)\n  // !diff(1:3) +\n  a,\n  b,\n)\n",
    );
    expect(reports[0]).toMatchObject({ added: 3, removed: 0, inline: 1, fallbacks: [] });
  });

  test("mixed hunk: modified line pairs inline, pure removal goes line-level", () => {
    const { annotated, reports } = annotateSeries(
      ["const timeout = 1000;\ngone\n", "const timeout = 2000;\n"],
      "f.ts",
    );
    expect(annotated[0]).toBe("const timeout = 1000;\n// !diff(1:1) -\ngone\n");
    expect(annotated[1]).toBe("const timeout = 2000;  // !from const timeout = 1000;\n");
    expect(reports[0]).toMatchObject({ added: 0, removed: 1, inline: 1, fallbacks: [] });
  });

  test("a new line that already contains the comment token can't go inline", () => {
    const { annotated, reports } = annotateSeries(
      ["x = 1\n", "x = 2 // set x\n"],
      "f.ts",
    );
    expect(annotated[1]).toBe("// !diff(1:1) +\nx = 2 // set x\n");
    expect(reports[0].fallbacks).toHaveLength(1);
  });

  test("chain: the middle file carries inbound + and outbound - markers", () => {
    const { annotated } = annotateSeries(
      ["a\nc\n", "a\nb\nc\n", "a\nb\n"],
      "f.ts",
    );
    expect(annotated[0]).toBe("a\nc\n");
    expect(annotated[1]).toBe("a\n// !diff(1:1) +\nb\n// !diff(1:1) -\nc\n");
    expect(annotated[2]).toBe("a\nb\n");
  });

  test("python files annotate with #", () => {
    const { annotated } = annotateSeries(["x = 1\n", "x = 2\n"], "f.py");
    expect(annotated[1]).toBe("x = 2  # !from x = 1\n");
  });

  test("marker comments match the indented code line's indent", () => {
    const { annotated } = annotateSeries(
      ["def f():\n    return 1\n", "def f():\n    return 1\n    print(1)\n"],
      "f.py",
    );
    expect(annotated[1]).toBe("def f():\n    return 1\n    # !diff(1:1) +\n    print(1)\n");
  });

  test("already-annotated input throws", () => {
    expect(() =>
      annotateSeries(["a\n// !diff(1:1) -\nb\n", "a\n"], "f.ts"),
    ).toThrow(/pristine/);
    expect(() => annotateSeries(["a\n"], "f.ts")).toThrow(/at least two/);
  });
});

describe("annotateStatic", () => {
  test("merged view: context, inline pair, removal block in git order", () => {
    // removed lines of a hunk come before its added lines, even when the
    // inline-paired line preceded the removal in the old file
    const { text, report } = annotateStatic(
      "one\nconst timeout = 1000;\ngone\nthree\n",
      "one\nconst timeout = 2000;\nthree\n",
      "f.ts",
    );
    expect(text).toBe(
      "one\n" +
        "// !diff(1:1) -\n" +
        "gone\n" +
        "const timeout = 2000;  // !from const timeout = 1000;\n" +
        "three\n",
    );
    expect(report).toMatchObject({ added: 0, removed: 1, inline: 1, fallbacks: [] });
  });

  test("rewrite hunk shows - block before + block", () => {
    const { text, report } = annotateStatic(
      "aaa bbb ccc\nkeep\n",
      "xxx yyy zzz\nkeep\n",
      "f.ts",
    );
    expect(text).toBe(
      "// !diff(1:1) -\naaa bbb ccc\n// !diff(1:1) +\nxxx yyy zzz\nkeep\n",
    );
    expect(report.fallbacks).toHaveLength(1);
  });

  test("1-to-3 expansion hunk: one - line, one + marker over the run", () => {
    const { text, report } = annotateStatic(
      "head\nx = foo(a, b)\ntail\n",
      "head\nx = foo(\n  a,\n  b,\n)\ntail\n",
      "f.ts",
    );
    expect(text).toBe(
      "head\n" +
        "x = foo(  // !from x = foo(a, b)\n" +
        "  // !diff(1:3) +\n" +
        "  a,\n" +
        "  b,\n" +
        ")\n" +
        "tail\n",
    );
    expect(report).toMatchObject({ added: 3, removed: 0, inline: 1 });
  });
});

describe("round-trip through processSnippet", () => {
  test("generated annotations parse into the expected synthetic annotations", async () => {
    const { annotated } = annotateSeries(
      ["const timeout = 1000;\n", "const timeout = 2000;\n"],
      "f.ts",
    );
    const highlighted = await processSnippet(
      { filename: "f.ts", value: annotated[1] },
      "github-dark",
    );
    expect(highlighted.annotations).toEqual([
      {
        name: "ins",
        query: "",
        lineNumber: 1,
        fromColumn: 17,
        toColumn: 20,
        data: { removed: "1000" },
      },
    ]);
  });

  test("generated line markers parse as diff block annotations", async () => {
    const { annotated } = annotateSeries(["a\nb\nc\n", "a\nc\n"], "f.ts");
    const highlighted = await processSnippet(
      { filename: "f.ts", value: annotated[0] },
      "github-dark",
    );
    expect(highlighted.annotations).toEqual([
      { name: "diff", query: "-", fromLineNumber: 2, toLineNumber: 2 },
    ]);
    // and the marker comment itself is stripped from the rendered code
    expect(highlighted.code).toBe("a\nb\nc\n");
  });
});
