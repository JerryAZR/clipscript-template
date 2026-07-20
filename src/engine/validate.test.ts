import { describe, expect, it } from "vitest";
import type { CodeClipDef, OverlayClipDef, TimelineClip } from "./types";
import { validateStoryboard, ValidationInput } from "./validate";

const line = (fullId: string, startFrame: number, endFrame: number) => ({
  fullId,
  text: fullId,
  startFrame,
  endFrame,
  audio: null,
});

const clip = (
  overrides: Partial<TimelineClip<OverlayClipDef>> & { id: string },
): TimelineClip => ({
  type: "overlay",
  text: "t",
  rect: { x: 0, y: 0, w: "100%", h: "100%" },
  startAt: { line: "l1" },
  endAt: [{ line: "l1", end: true }],
  startFrame: 0,
  endFrame: 100,
  ...overrides,
});

const codeClip = (
  overrides: Partial<TimelineClip<CodeClipDef>> & { id: string },
): TimelineClip => ({
  type: "code",
  steps: ["a.ts"],
  rect: { x: 0, y: 0, w: "100%", h: "100%" },
  startAt: { line: "l1" },
  endAt: [{ line: "l1", end: true }],
  startFrame: 0,
  endFrame: 100,
  ...overrides,
});

const validate = (
  clips: TimelineClip[],
  overrides?: Partial<ValidationInput>,
) =>
  validateStoryboard({
    lines: [line("l1", 0, 200)],
    clips,
    totalFrames: 100,
    lineCounts: {},
    ...overrides,
  });

describe("validateStoryboard", () => {
  it("throws on duplicate clip ids", () => {
    expect(() => validate([clip({ id: "a" }), clip({ id: "a" })])).toThrow(
      /duplicate clip id 'a'/,
    );
  });

  it("warns on uncovered frames at the start, middle and end", () => {
    const warnings = validate(
      [
        clip({ id: "a", startFrame: 40, endFrame: 90 }),
        clip({ id: "b", startFrame: 120, endFrame: 160 }),
      ],
      { totalFrames: 200 },
    );
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toMatch(/frames 0-40.*'l1'.*no clip/);
    expect(warnings[1]).toMatch(/frames 90-120/);
    expect(warnings[2]).toMatch(/frames 160-200/);
  });

  it("tolerates tiny gaps and counts transitionOut tails as covered", () => {
    expect(
      validate([
        clip({ id: "a", endFrame: 100 }),
        clip({ id: "b", startFrame: 103, endFrame: 200 }),
      ]),
    ).toHaveLength(0);
    // A 20-frame gap covered by a transitionOut tail is not a gap
    expect(
      validate([
        clip({ id: "a", endFrame: 100, transitionOut: 20 }),
        clip({ id: "b", startFrame: 115, endFrame: 200 }),
      ]),
    ).toHaveLength(0);
  });

  it("warns when transitionIn exceeds the clip duration", () => {
    const warnings = validate(
      [clip({ id: "a", endFrame: 20, transitionIn: 30 })],
      { totalFrames: 20 },
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/transitionIn \(30\) exceeds the clip duration \(20\)/);
  });

  it("warns when scrollTo exceeds the last step's line count", () => {
    const warnings = validate([
      codeClip({ id: "c", steps: ["a.ts", "b.ts"], scrollTo: 45 }),
    ], { lineCounts: { "a.ts": 30, "b.ts": 41 } });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/scrollTo 45 exceeds 'b.ts' line count 41/);
  });

  it("accepts scrollTo within range and ignores unscrolled/non-code clips", () => {
    expect(
      validate([codeClip({ id: "c", scrollTo: 41 })], {
        lineCounts: { "a.ts": 41 },
      }),
    ).toHaveLength(0);
    expect(validate([clip({ id: "a" })])).toHaveLength(0);
  });

  it("warns on rect percentages outside 0-100%", () => {
    const warnings = validate([
      clip({ id: "a", rect: { x: "-10%", y: 0, w: "120%", h: "100%" } }),
    ]);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/rect\.x is -10%/);
    expect(warnings[1]).toMatch(/rect\.w is 120%/);
  });

  it("accepts a fully covered timeline", () => {
    expect(
      validate([
        clip({ id: "a", endFrame: 100 }),
        clip({ id: "b", startFrame: 100, endFrame: 200 }),
      ]),
    ).toHaveLength(0);
  });
});
