import { describe, expect, it, vi } from "vitest";

// ProgressStepsClip.tsx pulls in clip-style.ts -> font.ts, which calls
// staticFile()/loadFont() at module scope and throws outside a Remotion
// render. The pure functions under test don't need fonts.
vi.mock("../../font", () => ({ fontFamily: "monospace" }));
import { effectiveStepInterval, progressStepsAt } from "./ProgressStepsClip";

describe("effectiveStepInterval", () => {
  it("applies the default interval of 24 frames", () => {
    expect(effectiveStepInterval(4, undefined, 1000)).toBe(24);
  });

  it("honors a custom interval when the window is long enough", () => {
    expect(effectiveStepInterval(4, 40, 1000)).toBe(40);
  });

  it("keeps the requested interval when the last step fits exactly", () => {
    // 4 steps x 10 frames = 40 <= duration - 1 -> no compression
    expect(effectiveStepInterval(4, 10, 41)).toBe(10);
  });

  it("compresses the interval when the window is too short", () => {
    // ideal would be 24; only 47 frames of room for 4 steps -> 47 / 4
    expect(effectiveStepInterval(4, 24, 48)).toBeCloseTo(47 / 4);
  });

  it("never stretches the interval to fill a long window", () => {
    expect(effectiveStepInterval(2, 10, 1000)).toBe(10);
  });

  it("clamps to the minimum interval for degenerate windows", () => {
    expect(effectiveStepInterval(5, 24, 1)).toBeCloseTo(0.01);
    expect(effectiveStepInterval(5, 24, 0)).toBeCloseTo(0.01);
    expect(effectiveStepInterval(5, 24, -10)).toBeCloseTo(0.01);
  });

  it("compresses below one frame per step rather than leaving steps unfinished", () => {
    // 20 steps in a 2-frame window -> interval 1/20, still all complete
    const interval = effectiveStepInterval(20, 24, 2);
    expect(interval).toBeCloseTo(1 / 20);
    const steps = progressStepsAt(1, 20, interval);
    expect(steps.every((s) => s.status === "complete")).toBe(true);
  });

  it("returns the requested interval for empty steps", () => {
    expect(effectiveStepInterval(0, 24, 100)).toBe(24);
    expect(effectiveStepInterval(0, undefined, 100)).toBe(24);
  });
});

describe("progressStepsAt", () => {
  it("returns no steps for an empty stepper", () => {
    expect(progressStepsAt(10, 0, 24)).toEqual([]);
  });

  it("starts with the first step active and the rest pending", () => {
    const steps = progressStepsAt(0, 3, 24);
    expect(steps.map((s) => s.status)).toEqual([
      "active",
      "pending",
      "pending",
    ]);
    expect(steps[0].fill).toBe(0);
  });

  it("fills the circle during the first 60% of the step window", () => {
    const interval = 10;
    expect(progressStepsAt(0, 1, interval)[0].fill).toBe(0);
    expect(progressStepsAt(3, 1, interval)[0].fill).toBeCloseTo(0.5);
    expect(progressStepsAt(6, 1, interval)[0].fill).toBe(1);
    expect(progressStepsAt(9, 1, interval)[0].fill).toBe(1);
  });

  it("marks a step complete after one full interval", () => {
    const interval = 10;
    expect(progressStepsAt(9, 2, interval).map((s) => s.status)).toEqual([
      "active",
      "pending",
    ]);
    expect(progressStepsAt(10, 2, interval).map((s) => s.status)).toEqual([
      "complete",
      "active",
    ]);
    expect(progressStepsAt(20, 2, interval).map((s) => s.status)).toEqual([
      "complete",
      "complete",
    ]);
  });

  it("sweeps the connector during the last 50% of the step window", () => {
    const interval = 10;
    expect(progressStepsAt(4, 2, interval)[0].line).toBe(0);
    expect(progressStepsAt(5, 2, interval)[0].line).toBe(0);
    expect(progressStepsAt(7.5, 2, interval)[0].line).toBeCloseTo(0.5);
    expect(progressStepsAt(10, 2, interval)[0].line).toBe(1);
  });

  it("keeps the last step's connector at zero", () => {
    expect(progressStepsAt(100, 3, 24)[2].line).toBe(0);
  });

  it("clamps negative frames to frame 0", () => {
    expect(progressStepsAt(-5, 2, 24)).toEqual(progressStepsAt(0, 2, 24));
  });

  it("is deterministic across repeated calls", () => {
    for (const frame of [0, 3, 11, 40, 200]) {
      expect(progressStepsAt(frame, 4, 24)).toEqual(
        progressStepsAt(frame, 4, 24),
      );
    }
  });

  it("completes every step inside the window for any shape", () => {
    for (const stepCount of [1, 2, 3, 7, 20]) {
      for (const stepInterval of [undefined, 1, 24, 100]) {
        for (const duration of [2, 5, 45, 300]) {
          const interval = effectiveStepInterval(
            stepCount,
            stepInterval,
            duration,
          );
          const steps = progressStepsAt(duration - 1, stepCount, interval);
          expect(steps).toHaveLength(stepCount);
          for (const step of steps) {
            // the stepper is never left unfinished when the clip ends
            expect(step.status).toBe("complete");
            expect(step.fill).toBeCloseTo(1);
          }
          for (let i = 0; i < stepCount - 1; i++) {
            expect(steps[i].line).toBeCloseTo(1);
          }
        }
      }
    }
  });
});
