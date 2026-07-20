import { mix, readableColor, rgba } from "polished";
import { spring, useVideoConfig } from "remotion";
import { useDimmedColor, useThemeColors } from "../../calculate-metadata/theme";
import { centeredPaneStyle, textStyles } from "../clip-style";
import type { ClipComponent, ProgressStepsClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

/**
 * Port of the RVE `progress-steps` template (reactvideoeditor/remotion-templates,
 * MIT): numbered circles connected by filling lines, advancing one step at a
 * time. RVE specifics dropped on purpose: the gradient page background (our
 * panes are transparent), gradient fills (flat theme accent instead), and a
 * CSS `transition: border-color` (forbidden here - the border color is
 * interpolated from the frame instead).
 */

const DEFAULT_STEP_INTERVAL = 24; // RVE: 0.8s at 30fps
/**
 * Lower bound so the interval math never divides by zero. Only reachable
 * when the window has sub-frame room per step, where the stepper renders
 * as effectively finished anyway.
 */
const MIN_STEP_INTERVAL = 0.01;
/** Float tolerance for frame comparisons (i * interval accumulates error) */
const EPSILON = 1e-6;
/** The circle fills during the first 60% of its step window (RVE recipe) */
const FILL_PORTION = 0.6;
/** The connector to the next step sweeps during the last 50% (RVE recipe) */
const LINE_START_PORTION = 0.5;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Frames per step advance. Steps start every `stepInterval` frames (default
 * 24). If the narration window is too short for steps x stepInterval, the
 * interval is compressed (never stretched) so the last step still completes
 * on the last visible frame: the stepper runs faster, it is never left
 * unfinished when the clip ends.
 */
export const effectiveStepInterval = (
  stepCount: number,
  stepInterval: number | undefined,
  durationFrames: number,
): number => {
  const requested = Math.max(0, stepInterval ?? DEFAULT_STEP_INTERVAL);
  if (stepCount <= 0) {
    return requested;
  }
  // Step i starts at i * interval and needs its own interval to finish, so
  // count * interval must fit in [0, durationFrames - 1]
  const fitsInWindow = Math.max(0, durationFrames - 1) / stepCount;
  return Math.max(MIN_STEP_INTERVAL, Math.min(requested, fitsInWindow));
};

export type ProgressStepState = {
  status: "pending" | "active" | "complete";
  /** 0..1 fill of the circle (1 from 60% of the step window on) */
  fill: number;
  /** 0..1 sweep of the connector leaving this step (always 0 for the last) */
  line: number;
  /** Clip-local frame at which this step activates (for the pop spring) */
  start: number;
};

/**
 * Pure frame math: per-step state at a clip-local frame. A step is pending
 * before its start, active for one interval (circle fills + pulses, outgoing
 * connector sweeps), complete afterwards. Deterministic: no randomness, no
 * time, same inputs always yield the same state.
 */
export const progressStepsAt = (
  frame: number,
  stepCount: number,
  interval: number,
): ProgressStepState[] => {
  const f = Math.max(0, frame);
  const safeInterval = Math.max(MIN_STEP_INTERVAL, interval);
  return Array.from({ length: Math.max(0, stepCount) }, (_, i) => {
    const start = i * safeInterval;
    const fill = clamp01((f - start) / (safeInterval * FILL_PORTION));
    const status =
      f < start - EPSILON
        ? "pending"
        : f < start + safeInterval - EPSILON
          ? "active"
          : "complete";
    const line =
      i < stepCount - 1
        ? clamp01(
            (f - (start + safeInterval * LINE_START_PORTION)) /
              (safeInterval * (1 - LINE_START_PORTION)),
          )
        : 0;
    return { status, fill, line, start };
  });
};

const CIRCLE_SIZE = 64;
const CIRCLE_BORDER = 4;
const COLUMN_WIDTH = 160;
const CONNECTOR_WIDTH = 120;
const CONNECTOR_HEIGHT = 4;
/** Vertical room reserved for the label below the circle (marginTop + line) */
const LABEL_RESERVE = 48;

/**
 * Horizontal stepper: numbered circles connected by filling lines, advancing
 * one step at a time. The active circle fills with the theme accent and
 * pulses (spring pop + gentle breathing, like ProgressClip's current marker),
 * then the connecting line sweeps to the next step. The renderer owns the
 * pane opacity transition - this clip only advances the stepper once the
 * pane has arrived.
 */
export const ProgressStepsClip: ClipComponent<ProgressStepsClipDef> = ({
  clip,
}) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - no whole-pane opacity animation here
  const frame = useClipFrame(clip.transitionIn);
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const foreground = themeColors.editor.foreground;
  const accent = themeColors.editor.infoForeground;
  const dim = useDimmedColor(0.55);
  const track = useDimmedColor(0.8);

  const interval = effectiveStepInterval(
    clip.steps.length,
    clip.stepInterval,
    clip.endFrame - clip.startFrame,
  );
  const steps = progressStepsAt(frame, clip.steps.length, interval);

  return (
    <div
      style={{
        ...centeredPaneStyle,
        color: foreground,
      }}
    >
      {clip.title ? (
        <div style={{ ...textStyles.heading2, marginBottom: 64 }}>
          {clip.title}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center" }}>
        {clip.steps.map((label, i) => {
          const step = steps[i];
          const isPending = step.status === "pending";
          const isActive = step.status === "active";

          // Spring pop when the step activates (RVE recipe), plus a gentle
          // frame-driven breathing pulse while active
          const pop = isActive
            ? spring({
                frame: Math.max(0, frame - step.start),
                fps,
                config: { damping: 8, stiffness: 150, mass: 0.4 },
              })
            : 1;
          const breathe = isActive ? 1 + 0.06 * Math.abs(Math.sin(frame / 8)) : 1;
          const scale = isPending ? 1 : (0.9 + 0.2 * pop) * breathe;

          // Frame-driven border/color ramp (the RVE CSS transition, ported)
          const borderColor = mix(step.fill, accent, track);
          const numberColor = isPending
            ? dim
            : step.status === "complete"
              ? readableColor(accent)
              : foreground;
          const labelColor = isPending ? dim : isActive ? accent : foreground;

          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: COLUMN_WIDTH,
                }}
              >
                <div
                  style={{
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: "50%",
                    border: `${CIRCLE_BORDER}px solid ${borderColor}`,
                    backgroundColor: rgba(accent, step.fill),
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: `scale(${scale})`,
                  }}
                >
                  <span
                    style={{
                      ...textStyles.body,
                      fontWeight: 700,
                      color: numberColor,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
                <span
                  style={{
                    ...textStyles.bodySmall,
                    ...(isActive ? { fontWeight: 700 } : {}),
                    color: labelColor,
                    marginTop: 12,
                    height: 36,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
              {i < clip.steps.length - 1 ? (
                <div
                  style={{
                    width: CONNECTOR_WIDTH,
                    height: CONNECTOR_HEIGHT,
                    backgroundColor: track,
                    borderRadius: CONNECTOR_HEIGHT / 2,
                    overflow: "hidden",
                    marginBottom: LABEL_RESERVE,
                  }}
                >
                  <div
                    style={{
                      width: `${step.line * 100}%`,
                      height: "100%",
                      backgroundColor: accent,
                      borderRadius: CONNECTOR_HEIGHT / 2,
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
