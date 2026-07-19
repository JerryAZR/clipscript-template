import { describe, expect, it, vi } from "vitest";
import type { CodeClipDef, Rect, TimelineClip } from "../types";
import { resolveCodeState } from "./code-state";

const rect: Rect = { x: "10%", y: "10%", w: "80%", h: "80%" };

const codeClip = (
  overrides: Partial<TimelineClip<CodeClipDef>> & { id: string },
): TimelineClip<CodeClipDef> => ({
  type: "code",
  steps: ["v1.ts"],
  rect,
  startAt: { line: "l1" },
  endAt: [{ line: "l1", end: true }],
  startFrame: 0,
  endFrame: 100,
  ...overrides,
});

const asCodeClips = (clips: TimelineClip[]) =>
  clips as TimelineClip<CodeClipDef>[];

describe("resolveCodeState", () => {
  it("defaults unkeyed clips (scrollFrom 0, filename from basename)", () => {
    const [clip] = asCodeClips(resolveCodeState([codeClip({ id: "c" })]));
    expect(clip).toMatchObject({ scrollFrom: 0, filename: "v1.ts" });
  });

  it("first clip in a chain uses its own steps and defaults", () => {
    const [clip] = asCodeClips(resolveCodeState([codeClip({ id: "c", key: "k" })]));
    expect(clip).toMatchObject({
      steps: ["v1.ts"],
      scrollFrom: 0,
      filename: "v1.ts",
    });
  });

  it("requires a rect when there is nothing to inherit", () => {
    expect(() =>
      resolveCodeState([codeClip({ id: "c", key: "k", rect: undefined })]),
    ).toThrow(/clip 'c' has no rect/);
  });

  it("threads step, scroll, rect and filename through a chain", () => {
    const [first, second] = asCodeClips(resolveCodeState([
      codeClip({
        id: "c1",
        key: "k",
        steps: ["v1.ts", "v2.ts"],
        scrollTo: 12,
        filename: "users.ts",
        endFrame: 100,
      }),
      // c2 omits rect and filename - both must be inherited from c1
      codeClip({
        id: "c2",
        key: "k",
        steps: ["v3.ts"],
        rect: undefined,
        startFrame: 200,
        endFrame: 300,
      }),
    ]));

    // c2 inherits the carry-in step, scroll, rect and filename from c1
    expect(second).toMatchObject({
      steps: ["v2.ts", "v3.ts"],
      scrollFrom: 12,
      rect,
      filename: "users.ts",
    });
    expect(first.scrollFrom).toBe(0);
  });

  it("lets a chained clip override inherited fields", () => {
    const ownRect: Rect = { x: 0, y: 0, w: "50%", h: "100%" };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const [, second] = asCodeClips(resolveCodeState([
      codeClip({ id: "c1", key: "k", steps: ["v1.ts"], filename: "a.ts" }),
      codeClip({
        id: "c2",
        key: "k",
        steps: ["v2.ts"],
        rect: ownRect,
        filename: "b.ts",
        startFrame: 200,
      }),
    ]));
    expect(second).toMatchObject({ rect: ownRect, filename: "b.ts" });
    // ...but a different top-left corner warns
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/top-left corner moved/));
    warn.mockRestore();
  });

  it("throws when same-key clips overlap including the transitionOut tail", () => {
    expect(() =>
      resolveCodeState([
        codeClip({ id: "c1", key: "k", endFrame: 100, transitionOut: 20 }),
        codeClip({ id: "c2", key: "k", startFrame: 110 }),
      ]),
    ).toThrow(/clips 'c1' and 'c2' \(key 'k'\) overlap/);
  });

  it("allows back-to-back chaining when the tail fits", () => {
    expect(() =>
      resolveCodeState([
        codeClip({ id: "c1", key: "k", endFrame: 100, transitionOut: 20 }),
        codeClip({ id: "c2", key: "k", startFrame: 120 }),
      ]),
    ).not.toThrow();
  });

  it("threads in timeline order, not storyboard order", () => {
    const [second, first] = [
      codeClip({ id: "c2", key: "k", steps: ["v2.ts"], startFrame: 200 }),
      codeClip({ id: "c1", key: "k", steps: ["v1.ts"], startFrame: 0 }),
    ];
    const resolved = asCodeClips(resolveCodeState([second, first]));
    // resolved[0] is c2 (array order preserved), chained from c1
    expect(resolved[0].steps).toEqual(["v1.ts", "v2.ts"]);
  });

  it("throws on empty steps", () => {
    expect(() => resolveCodeState([codeClip({ id: "c", steps: [] })])).toThrow(
      /clip 'c' has no steps/,
    );
  });

  it("warns when transitionDuration exceeds stepInterval", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveCodeState([
      codeClip({ id: "c", stepInterval: 20, transitionDuration: 30 }),
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/morphs will overlap/));
    warn.mockRestore();
  });

  it("honors an explicit filename on unkeyed clips", () => {
    const [clip] = asCodeClips(
      resolveCodeState([codeClip({ id: "c", filename: "custom.ts" })]),
    );
    expect(clip.filename).toBe("custom.ts");
  });

  it("keeps stores of different keys isolated", () => {
    const [, b1, a2] = asCodeClips(
      resolveCodeState([
        codeClip({ id: "a1", key: "a", steps: ["a1.ts"], filename: "a.ts", startFrame: 0 }),
        codeClip({ id: "b1", key: "b", steps: ["b1.ts"], filename: "b.ts", startFrame: 100 }),
        codeClip({ id: "a2", key: "a", steps: ["a2.ts"], rect: undefined, startFrame: 200 }),
      ]),
    );
    // a2 chains from a1, not from the interleaved b1
    expect(a2.steps).toEqual(["a1.ts", "a2.ts"]);
    expect(a2.filename).toBe("a.ts");
    expect(b1.steps).toEqual(["b1.ts"]);
  });
});
