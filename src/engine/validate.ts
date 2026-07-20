import type { CodeClipDef, TimelineClip, TimelineLine } from "./types";

export type ValidationInput = {
  lines: TimelineLine[];
  clips: TimelineClip[];
  totalFrames: number;
  /** step src -> rendered line count, for code scroll checks */
  lineCounts: Record<string, number>;
};

/** Gaps up to this many frames between clips are tolerated (rounding) */
const MIN_GAP_FRAMES = 3;

/**
 * Storyboard sanity checks beyond what resolution already enforces.
 * Returns warnings for suspicious-but-legal states; throws for hard errors
 * (duplicate clip ids break React keys and make every error message
 * ambiguous). Pure: plain data in, strings out - the caller logs them.
 */
export const validateStoryboard = ({
  lines,
  clips,
  totalFrames,
  lineCounts,
}: ValidationInput): string[] => {
  const warnings: string[] = [];

  const seen = new Set<string>();
  for (const clip of clips) {
    if (seen.has(clip.id)) {
      throw new Error(`duplicate clip id '${clip.id}'`);
    }
    seen.add(clip.id);
  }

  // Coverage: every frame without a clip is pure background - usually an
  // anchoring mistake. transitionOut tails count as covered (the clip is
  // still fading out, visibly present).
  const gapMsg = (from: number, to: number) => {
    const near = lines.find((l) => from < l.endFrame);
    return `frames ${from}-${to} (around line '${near?.fullId ?? "?"}') have no clip - black frames`;
  };
  const intervals = clips
    .map(
      (c) =>
        [c.startFrame, c.endFrame + (c.transitionOut ?? 0)] as const,
    )
    .sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  for (const [start, end] of intervals) {
    if (start - cursor > MIN_GAP_FRAMES) {
      warnings.push(gapMsg(cursor, start));
    }
    cursor = Math.max(cursor, end);
  }
  if (totalFrames - cursor > MIN_GAP_FRAMES) {
    warnings.push(gapMsg(cursor, totalFrames));
  }

  for (const clip of clips) {
    const duration = clip.endFrame - clip.startFrame;
    if ((clip.transitionIn ?? 0) > duration) {
      warnings.push(
        `clip '${clip.id}': transitionIn (${clip.transitionIn}) exceeds the clip duration (${duration})`,
      );
    }

    if (clip.type === "code") {
      const codeClip = clip as TimelineClip<CodeClipDef>;
      if (codeClip.scrollTo !== undefined) {
        const lastStep = codeClip.steps[codeClip.steps.length - 1];
        const count = lineCounts[lastStep];
        if (count !== undefined && codeClip.scrollTo > count) {
          warnings.push(
            `clip '${clip.id}': scrollTo ${codeClip.scrollTo} exceeds '${lastStep}' line count ${count} - the pane will show bottom whitespace`,
          );
        }
      }
    }

    if (clip.rect) {
      for (const [key, value] of Object.entries(clip.rect)) {
        if (typeof value === "string" && value.endsWith("%")) {
          const parsed = parseFloat(value);
          if (parsed < 0 || parsed > 100) {
            warnings.push(
              `clip '${clip.id}': rect.${key} is ${value}, outside 0-100%`,
            );
          }
        }
      }
    }
  }

  return warnings;
};
