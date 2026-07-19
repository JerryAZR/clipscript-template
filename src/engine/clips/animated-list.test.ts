import { describe, expect, it, vi } from "vitest";

// AnimatedListClip.tsx pulls in ../../font, which calls
// staticFile()/loadFont() at module scope and throws outside a Remotion
// render. The pure function under test doesn't need fonts.
vi.mock("../../font", () => ({ fontFamily: "monospace" }));
import { itemStartFrames } from "./AnimatedListClip";

describe("itemStartFrames", () => {
  it("returns no starts for empty items", () => {
    expect(itemStartFrames(0, 15, 300)).toEqual([]);
  });

  it("starts a single item at frame 0 even in a tiny window", () => {
    expect(itemStartFrames(1, 15, 300)).toEqual([0]);
    expect(itemStartFrames(1, 15, 1)).toEqual([0]);
  });

  it("applies the default stagger of 15 frames", () => {
    expect(itemStartFrames(3, undefined, 1000)).toEqual([0, 15, 30]);
  });

  it("honors a custom stagger when the window is long enough", () => {
    expect(itemStartFrames(4, 10, 1000)).toEqual([0, 10, 20, 30]);
  });

  it("keeps the requested stagger when the last item fits exactly", () => {
    // last start 20 < duration 21 -> no compression
    expect(itemStartFrames(3, 10, 21)).toEqual([0, 10, 20]);
  });

  it("compresses the stagger when the window is too short", () => {
    // ideal would be [0, 15, 30, 45]; only 19 frames of room for 3 gaps
    // -> effective stagger floor(19 / 3) = 6, last start 18 < 20
    expect(itemStartFrames(4, 15, 20)).toEqual([0, 6, 12, 18]);
  });

  it("never stretches the stagger to fill a long window", () => {
    expect(itemStartFrames(4, 6, 20)).toEqual([0, 6, 12, 18]);
  });

  it("drops to stagger 0 when the window is shorter than the item count", () => {
    expect(itemStartFrames(5, 15, 3)).toEqual([0, 0, 0, 0, 0]);
  });

  it("clamps a zero or negative window to everything at frame 0", () => {
    expect(itemStartFrames(3, 15, 0)).toEqual([0, 0, 0]);
    expect(itemStartFrames(3, 15, -10)).toEqual([0, 0, 0]);
  });

  it("treats an explicit stagger of 0 as all-at-once", () => {
    expect(itemStartFrames(3, 0, 1000)).toEqual([0, 0, 0]);
  });

  it("keeps every start inside the window for any shape", () => {
    for (const itemCount of [1, 2, 3, 7, 20]) {
      for (const stagger of [undefined, 1, 15, 100]) {
        for (const duration of [0, 1, 5, 45, 300]) {
          const starts = itemStartFrames(itemCount, stagger, duration);
          expect(starts).toHaveLength(itemCount);
          for (let i = 0; i < starts.length; i++) {
            expect(starts[i]).toBeGreaterThanOrEqual(0);
            // every item has started appearing before the clip ends
            // (for duration 0 there is no visible frame, so 0 is the clamp)
            expect(starts[i]).toBeLessThan(Math.max(1, duration));
            if (i > 0) {
              expect(starts[i]).toBeGreaterThanOrEqual(starts[i - 1]);
            }
          }
        }
      }
    }
  });

  it("is deterministic across repeated calls", () => {
    expect(itemStartFrames(4, 15, 20)).toEqual(itemStartFrames(4, 15, 20));
    expect(itemStartFrames(3, undefined, 1000)).toEqual(
      itemStartFrames(3, undefined, 1000),
    );
    expect(itemStartFrames(5, 15, 3)).toEqual(itemStartFrames(5, 15, 3));
  });
});
