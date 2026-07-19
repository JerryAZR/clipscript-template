import { describe, expect, it } from "vitest";
import { calculateTimeline } from "./timeline";
import type { TitleClipDef } from "./types";

const line = (fullId: string, durationFrames: number) => ({
  fullId,
  text: fullId,
  durationFrames,
});

const titleClip = (
  overrides: Partial<TitleClipDef> & { id: string },
): TitleClipDef => ({
  type: "title",
  title: "t",
  rect: { x: 0, y: 0, w: "100%", h: "100%" },
  startAt: { line: "l1" },
  endAt: [{ line: "l1", end: true }],
  ...overrides,
});

describe("calculateTimeline", () => {
  it("lays lines back-to-back", () => {
    const timeline = calculateTimeline([line("l1", 60), line("l2", 90)], []);
    expect(timeline.lines[0]).toMatchObject({ startFrame: 0, endFrame: 60 });
    expect(timeline.lines[1]).toMatchObject({ startFrame: 60, endFrame: 150 });
    expect(timeline.totalFrames).toBe(150);
  });

  it("resolves clip start offset and end conditions", () => {
    const [clip] = calculateTimeline(
      [line("l1", 60), line("l2", 60)],
      [
        titleClip({
          id: "c",
          startAt: { line: "l1", offsetFrames: 10 },
          endAt: [{ line: "l2", offsetFrames: 15 }],
        }),
      ],
    ).clips;
    expect(clip).toMatchObject({ startFrame: 10, endFrame: 75 });
  });

  it("clip end is the max of multiple conditions", () => {
    const [clip] = calculateTimeline(
      [line("l1", 60), line("l2", 60)],
      [
        titleClip({
          id: "c",
          endAt: [
            { line: "l1", offsetFrames: 40 },
            { line: "l2", end: true },
          ],
        }),
      ],
    ).clips;
    expect(clip.endFrame).toBe(120);
  });

  it("sync fences hold the next line and end:true absorbs the fence", () => {
    const timeline = calculateTimeline(
      [line("l1", 60), line("l2", 60)],
      [
        titleClip({
          id: "fence",
          startAt: { line: "l1" },
          endAt: [{ line: "l1", offsetFrames: 100, sync: "l1" }],
        }),
        titleClip({
          id: "absorber",
          startAt: { line: "l1" },
          endAt: [{ line: "l1", end: true }],
        }),
      ],
    );
    // The fence pushes l2 to frame 100 instead of 60
    expect(timeline.lines[1].startFrame).toBe(100);
    // end:true resolves to the post-fence end of the line
    expect(timeline.clips[1].endFrame).toBe(100);
    expect(timeline.totalFrames).toBe(160);
  });

  it("extends totalFrames past the last line for an unfenced clip end", () => {
    const timeline = calculateTimeline(
      [line("l1", 60)],
      [titleClip({ id: "c", endAt: [{ line: "l1", offsetFrames: 120 }] })],
    );
    expect(timeline.totalFrames).toBe(120);
  });

  it("throws on unknown startAt line", () => {
    expect(() =>
      calculateTimeline(
        [line("l1", 60)],
        [titleClip({ id: "c", startAt: { line: "nope" } })],
      ),
    ).toThrow(/clip 'c' startAt references unknown line 'nope'/);
  });

  it("throws on unknown endAt line", () => {
    expect(() =>
      calculateTimeline(
        [line("l1", 60)],
        [titleClip({ id: "c", endAt: [{ line: "nope" }] })],
      ),
    ).toThrow(/clip 'c' endAt references unknown line 'nope'/);
  });

  it("throws on empty endAt", () => {
    expect(() =>
      calculateTimeline([line("l1", 60)], [titleClip({ id: "c", endAt: [] })]),
    ).toThrow(/clip 'c' has no endAt conditions/);
  });

  it("throws when end=true is combined with offsetFrames", () => {
    const clip = titleClip({
      id: "c",
      endAt: [{ line: "l1", end: true, offsetFrames: 5 } as never],
    });
    expect(() => calculateTimeline([line("l1", 60)], [clip])).toThrow(
      /clip 'c' endAt cannot combine end=true with offsetFrames/,
    );
  });

  it("throws when sync is before the condition line", () => {
    expect(() =>
      calculateTimeline(
        [line("l1", 60), line("l2", 60)],
        [
          titleClip({
            id: "c",
            endAt: [{ line: "l2", offsetFrames: 5, sync: "l1" }],
          }),
        ],
      ),
    ).toThrow(/condition sync 'l1' is before line 'l2'/);
  });

  it("throws on zero or negative clip duration", () => {
    expect(() =>
      calculateTimeline(
        [line("l1", 60)],
        [titleClip({ id: "c", endAt: [{ line: "l1" }] })],
      ),
    ).toThrow(/clip 'c' has zero or negative duration/);
  });

  it("throws when a clip's end condition precedes its start", () => {
    expect(() =>
      calculateTimeline(
        [line("l1", 60), line("l2", 60)],
        [titleClip({ id: "c", startAt: { line: "l2" }, endAt: [{ line: "l1" }] })],
      ),
    ).toThrow(/clip 'c' end was never resolved|end resolved before start/);
  });

  it("ignores a sync fence that lands before the natural line start", () => {
    const timeline = calculateTimeline(
      [line("l1", 60), line("l2", 60)],
      [
        titleClip({
          id: "c",
          endAt: [{ line: "l1", offsetFrames: 30, sync: "l1" }],
        }),
      ],
    );
    // The fence value (30) is before l1's natural end (60) - no delay
    expect(timeline.lines[1].startFrame).toBe(60);
  });
});
