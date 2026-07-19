import { describe, expect, it } from "vitest";
import { estimateDurationFrames, parseNarration } from "./narration";

describe("parseNarration", () => {
  it("parses a flat lines list, ids verbatim", () => {
    const lines = parseNarration(`
# a comment
[[lines]]
id = "intro.first"
text = "Hello."

[[lines]]
id = "concepts.clips"
text = "World."
`);
    expect(lines).toEqual([
      { fullId: "intro.first", text: "Hello." },
      { fullId: "concepts.clips", text: "World." },
    ]);
  });

  it("throws on duplicate ids", () => {
    expect(() =>
      parseNarration(`
[[lines]]
id = "a"
text = "one"

[[lines]]
id = "a"
text = "two"
`),
    ).toThrow(/Duplicate narration line id 'a'/);
  });

  it("throws on empty narration", () => {
    expect(() => parseNarration(`lines = []`)).toThrow(/has no lines/);
  });

  it("throws on malformed input", () => {
    expect(() => parseNarration(`not = "toml lines"`)).toThrow();
  });
});

describe("estimateDurationFrames", () => {
  it("estimates from text length with a one-second floor", () => {
    expect(estimateDurationFrames("123456789012345", 30)).toBe(30); // 15 chars = 1s
    expect(estimateDurationFrames("hi", 30)).toBe(30); // floor
    expect(estimateDurationFrames("x".repeat(150), 30)).toBe(300);
  });
});
