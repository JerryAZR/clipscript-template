import { describe, expect, it } from "vitest";
import {
  applyPronunciation,
  defaultPronunciation,
  mergePronunciation,
} from "./pronunciation";

describe("applyPronunciation", () => {
  it("strips symbols via the default table without touching words", () => {
    expect(applyPronunciation("call useCurrentFrame()", defaultPronunciation)).toBe(
      "call useCurrentFrame",
    );
    expect(applyPronunciation('say "hi" <now>', defaultPronunciation)).toBe("say hi now");
  });

  it("applies longest keys first", () => {
    expect(applyPronunciation("a--b", { "--": " dash ", "-": " " })).toBe("a dash b");
  });

  it("collapses the whitespace removals leave behind", () => {
    expect(applyPronunciation("a ( b ) c", defaultPronunciation)).toBe("a b c");
  });

  it("does not touch the input when the map is empty", () => {
    expect(applyPronunciation("a(b)", {})).toBe("a(b)");
  });
});

describe("mergePronunciation", () => {
  it("later layers win", () => {
    expect(
      mergePronunciation({ a: "1", b: "2" }, { b: "3" }, undefined, { c: "4" }),
    ).toEqual({ a: "1", b: "3", c: "4" });
  });

  it("a line-level dict overrides the defaults", () => {
    const map = mergePronunciation(defaultPronunciation, { _: " underscore " });
    expect(applyPronunciation("foo_bar", map)).toBe("foo underscore bar");
  });
});
