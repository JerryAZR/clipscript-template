import type { SubtitleLine } from "./subtitles";
import type { StoryboardClip, Timeline, TimelineLine } from "./types";

type LineWithDuration = SubtitleLine & {
  durationFrames: number;
  audio?: string | null;
};

type ClipState = {
  startFrame: number | null;
  endFrame: number | null;
  conditionValues: (number | null)[];
};

const syncOf = (cond: StoryboardClip["endAt"][number]): string =>
  "sync" in cond && cond.sync ? cond.sync : cond.line;

/**
 * Condition-driven fence algorithm: subtitle lines are laid back-to-back,
 * and clips anchor to them. A `sync` condition "fences" the timeline - the
 * next line does not start until the condition's frame is reached.
 * Ported from the bevy project's scripts/engine/timeline.py.
 */
export const calculateTimeline = (
  lines: LineWithDuration[],
  clips: StoryboardClip[],
): Timeline => {
  const lineIndex = new Map(lines.map((line, i) => [line.fullId, i]));

  // Validate references before computing anything
  for (const clip of clips) {
    if (!lineIndex.has(clip.startAt.line)) {
      throw new Error(
        `clip '${clip.id}' startAt references unknown line '${clip.startAt.line}'`,
      );
    }
    if (clip.endAt.length === 0) {
      throw new Error(`clip '${clip.id}' has no endAt conditions`);
    }
    for (const cond of clip.endAt) {
      if (!lineIndex.has(cond.line)) {
        throw new Error(
          `clip '${clip.id}' endAt references unknown line '${cond.line}'`,
        );
      }
      // The TS union makes this unrepresentable, but plain-JS storyboards
      // can still smuggle it in (the Python original validates it too)
      if (
        cond.end &&
        (cond as { offsetFrames?: number }).offsetFrames !== undefined
      ) {
        throw new Error(
          `clip '${clip.id}' endAt cannot combine end=true with offsetFrames`,
        );
      }
      const sync = syncOf(cond);
      if (!lineIndex.has(sync)) {
        throw new Error(
          `clip '${clip.id}' endAt sync references unknown line '${sync}'`,
        );
      }
      if (lineIndex.get(sync)! < lineIndex.get(cond.line)!) {
        throw new Error(
          `clip '${clip.id}' condition sync '${sync}' is before line '${cond.line}'`,
        );
      }
    }
  }

  const states: ClipState[] = clips.map((clip) => ({
    startFrame: null,
    endFrame: null,
    conditionValues: clip.endAt.map(() => null),
  }));

  const resolveClipEnd = (clip: StoryboardClip, state: ClipState) => {
    if (state.conditionValues.some((value) => value === null)) {
      return;
    }
    if (state.startFrame === null) {
      throw new Error(`clip '${clip.id}' end resolved before start`);
    }
    const end = Math.max(...(state.conditionValues as number[]));
    if (end <= state.startFrame) {
      throw new Error(
        `clip '${clip.id}' has zero or negative duration: start=${state.startFrame}, end=${end}`,
      );
    }
    state.endFrame = end;
  };

  const timelineLines: TimelineLine[] = [];
  let nextStart = 0;

  for (const line of lines) {
    const lineStart = nextStart;
    nextStart += line.durationFrames;
    timelineLines.push({
      fullId: line.fullId,
      text: line.text,
      startFrame: lineStart,
      endFrame: nextStart,
      audio: line.audio ?? null,
      subtitle: line.subtitle !== false,
    });

    // Resolve clip starts, ordinary end conditions and sync fences
    clips.forEach((clip, ci) => {
      const state = states[ci];
      if (clip.startAt.line === line.fullId) {
        state.startFrame = lineStart + (clip.startAt.offsetFrames ?? 0);
      }
      clip.endAt.forEach((cond, ki) => {
        if (cond.end) {
          return;
        }
        if (cond.line === line.fullId) {
          state.conditionValues[ki] = lineStart + (cond.offsetFrames ?? 0);
          resolveClipEnd(clip, state);
        }
        if (syncOf(cond) === line.fullId) {
          const value = state.conditionValues[ki];
          if (value === null) {
            throw new Error(
              `clip '${clip.id}' sync line '${line.fullId}' reached before condition value for '${cond.line}' was resolved`,
            );
          }
          nextStart = Math.max(nextStart, value);
        }
      });
    });

    // `end: true` conditions resolve to this line's end, after fences
    clips.forEach((clip, ci) => {
      const state = states[ci];
      clip.endAt.forEach((cond, ki) => {
        if (cond.end && cond.line === line.fullId) {
          state.conditionValues[ki] = nextStart;
          resolveClipEnd(clip, state);
        }
      });
    });
  }

  clips.forEach((clip, ci) => {
    const state = states[ci];
    if (state.startFrame === null) {
      throw new Error(
        `clip '${clip.id}' start was never resolved (startAt line '${clip.startAt.line}' not reached)`,
      );
    }
    if (state.endFrame === null) {
      const unresolved = clip.endAt
        .filter((_, ki) => state.conditionValues[ki] === null)
        .map((cond) => cond.line);
      throw new Error(
        `clip '${clip.id}' end was never resolved; unresolved conditions reference: ${unresolved.join(", ")}`,
      );
    }
  });

  const resolvedStates = states as {
    startFrame: number;
    endFrame: number;
    conditionValues: number[];
  }[];

  // Deliberate deviation from the Python original, which returns nextStart
  // only and thereby truncates clips whose (unfenced) end lands past the
  // final line. Extending the video to the last clip end is less surprising.
  const totalFrames = Math.max(
    nextStart,
    ...resolvedStates.map((state) => state.endFrame),
  );

  return {
    lines: timelineLines,
    clips: clips.map((clip, ci) => ({
      ...clip,
      startFrame: resolvedStates[ci].startFrame,
      endFrame: resolvedStates[ci].endFrame,
    })),
    totalFrames,
  };
};
