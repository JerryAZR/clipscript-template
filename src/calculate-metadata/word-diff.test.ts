import { describe, expect, test } from "vitest";
import { diffWords, inlineDiffFromLine } from "./word-diff";

describe("diffWords", () => {
  test("identical lines are all same", () => {
    expect(diffWords("import os", "import os")).toEqual([
      { type: "same", text: "import os" },
    ]);
  });

  test("append insertion", () => {
    expect(diffWords("import os", "import os, sys")).toEqual([
      { type: "same", text: "import os" },
      { type: "ins", text: ", sys" },
    ]);
  });

  test("middle insertion", () => {
    expect(diffWords("foo(a, c)", "foo(a, b, c)")).toEqual([
      { type: "same", text: "foo(a, " },
      { type: "ins", text: "b, " },
      { type: "same", text: "c)" },
    ]);
  });

  test("rename is del + ins", () => {
    expect(diffWords("old_var = f()", "renamed_var = f()")).toEqual([
      { type: "del", text: "old_var" },
      { type: "ins", text: "renamed_var" },
      { type: "same", text: " = f()" },
    ]);
  });

  test("middle deletion", () => {
    expect(diffWords("foo(a, b, c)", "foo(a, c)")).toEqual([
      { type: "same", text: "foo(a, " },
      { type: "del", text: "b, " },
      { type: "same", text: "c)" },
    ]);
  });

  test("trailing deletion", () => {
    expect(diffWords("foo(a, b, c)", "foo(a, b)")).toEqual([
      { type: "same", text: "foo(a, b" },
      { type: "del", text: ", c" },
      { type: "same", text: ")" },
    ]);
  });
});

describe("inlineDiffFromLine", () => {
  test("identical lines produce no annotations", () => {
    expect(inlineDiffFromLine(1, "x = 1", "x = 1")).toEqual([]);
  });

  test("append insertion greens the inserted span", () => {
    // "import os, sys": ", sys" is columns 10-14
    expect(inlineDiffFromLine(1, "import os", "import os, sys")).toEqual([
      { name: "ins", query: "", lineNumber: 1, fromColumn: 10, toColumn: 14, data: undefined },
    ]);
  });

  test("rename pairs removed text onto the green span", () => {
    // "renamed_var = f()": "renamed_var" is columns 1-11
    expect(inlineDiffFromLine(2, "old_var = f()", "renamed_var = f()")).toEqual([
      {
        name: "ins",
        query: "",
        lineNumber: 2,
        fromColumn: 1,
        toColumn: 11,
        data: { removed: "old_var" },
      },
    ]);
  });

  test("middle deletion anchors where the text used to be", () => {
    // "foo(a, c)": "b, " sat before "c" at column 8
    expect(inlineDiffFromLine(1, "foo(a, b, c)", "foo(a, c)")).toEqual([
      {
        name: "del",
        query: "b, ",
        lineNumber: 1,
        fromColumn: 8,
        toColumn: 8,
        data: { position: "before" },
      },
    ]);
  });

  test("deletion before a closing paren anchors on the paren", () => {
    // "foo(a, b)": removed ", c" sat before ")" at column 9
    expect(inlineDiffFromLine(1, "foo(a, b, c)", "foo(a, b)")).toEqual([
      {
        name: "del",
        query: ", c",
        lineNumber: 1,
        fromColumn: 9,
        toColumn: 9,
        data: { position: "before" },
      },
    ]);
  });

  test("trailing deletion injects after the last column", () => {
    // "x = call(a)" -> "x = call()": hmm, this deletes "a" mid-line; use a true
    // trailing case: "return x" -> "return"
    expect(inlineDiffFromLine(1, "return x", "return")).toEqual([
      {
        name: "del",
        query: " x",
        lineNumber: 1,
        fromColumn: 6,
        toColumn: 6,
        data: { position: "after" },
      },
    ]);
  });

  test("two independent replacements on one line", () => {
    // "a x b" -> "a y b" plus "c = 1" -> "c = 2" style; single line:
    // old "foo(a, b)" new "foo(x, y)"
    expect(inlineDiffFromLine(1, "foo(a, b)", "foo(x, y)")).toEqual([
      {
        name: "ins",
        query: "",
        lineNumber: 1,
        fromColumn: 5,
        toColumn: 5,
        data: { removed: "a" },
      },
      {
        name: "ins",
        query: "",
        lineNumber: 1,
        fromColumn: 8,
        toColumn: 8,
        data: { removed: "b" },
      },
    ]);
  });

  test("trailing whitespace is ignored (comment stripping leaves it behind)", () => {
    // an annotated line keeps the spaces that preceded the comment; they must
    // not diff as a bogus insertion
    expect(inlineDiffFromLine(1, "import os", "import os, sys  ")).toEqual([
      { name: "ins", query: "", lineNumber: 1, fromColumn: 10, toColumn: 14, data: undefined },
    ]);
    expect(inlineDiffFromLine(1, "return x  ", "return")).toEqual([
      {
        name: "del",
        query: " x",
        lineNumber: 1,
        fromColumn: 6,
        toColumn: 6,
        data: { position: "after" },
      },
    ]);
  });

  test("indented lines: columns count the indentation", () => {
    // old line re-aligned with the new line's indent (process-snippet does
    // this rejoin because Code Hike trims the query)
    expect(
      inlineDiffFromLine(
        3,
        "  if (user.age < 0) {",
        "  if (user.age < 0 || user.age > 150) {",
      ),
    ).toEqual([
      {
        name: "ins",
        query: "",
        lineNumber: 3,
        fromColumn: 19,
        toColumn: 36,
        data: undefined,
      },
    ]);
  });
});
