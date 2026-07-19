import type { CodeClipDef, Rect, TimelineClip } from "../types";

type CodeStore = {
  step: string;
  scroll: number;
  rect: Rect;
  filename: string;
  /** whether the last clip had a pane title bar (shifts the content area) */
  paneTitle: boolean;
  /** endFrame + transitionOut of the last clip in the chain */
  tailFrame: number;
  clipId: string;
};

const basename = (path: string) => path.split("/").pop() ?? path;

/**
 * Threads code/scroll/rect/filename state through same-key code clips in
 * timeline order: each keyed clip inherits the store unless it overrides a
 * field, then updates the store with its final state. Plain data in, plain
 * data out - the component never sees the store or the keys.
 */
export const resolveCodeState = (clips: TimelineClip[]): TimelineClip[] => {
  const stores = new Map<string, CodeStore>();
  const resolved = [...clips];

  const byStartFrame = clips
    .map((_, i) => i)
    .sort((a, b) => clips[a].startFrame - clips[b].startFrame);

  for (const i of byStartFrame) {
    const clip = clips[i];
    if (clip.type !== "code") {
      continue;
    }
    const codeClip = clip as TimelineClip<CodeClipDef>;

    if (codeClip.steps.length === 0) {
      throw new Error(`clip '${clip.id}' has no steps`);
    }
    const stepInterval = codeClip.stepInterval ?? 60;
    const transitionDuration = codeClip.transitionDuration ?? 30;
    if (transitionDuration > stepInterval) {
      console.warn(
        `clip '${clip.id}': transitionDuration (${transitionDuration}) > stepInterval (${stepInterval}) - morphs will overlap`,
      );
    }

    if (!codeClip.key) {
      resolved[i] = {
        ...codeClip,
        scrollFrom: 0,
        filename:
          codeClip.filename ?? basename(codeClip.steps[codeClip.steps.length - 1]),
      };
      continue;
    }

    const store = stores.get(codeClip.key);
    if (store && codeClip.startFrame < store.tailFrame) {
      throw new Error(
        `clips '${store.clipId}' and '${clip.id}' (key '${codeClip.key}') overlap, including the transitionOut tail - chained clips must not cross-fade`,
      );
    }
    if (store && codeClip.rect) {
      const { x, y } = codeClip.rect;
      if (x !== store.rect.x || y !== store.rect.y) {
        console.warn(
          `clip '${clip.id}' (key '${codeClip.key}'): top-left corner moved between chained clips - the code will appear to jump`,
        );
      }
    }
    if (store && Boolean(codeClip.paneTitle) !== store.paneTitle) {
      console.warn(
        `clip '${clip.id}' (key '${codeClip.key}'): paneTitle differs between chained clips - the title bar shifts the content area, the code will appear to jump`,
      );
    }

    const scrollFrom = store?.scroll ?? 0;
    const steps = store ? [store.step, ...codeClip.steps] : codeClip.steps;
    const rect = codeClip.rect ?? store?.rect;
    if (!rect) {
      throw new Error(
        `clip '${clip.id}' has no rect and there is no earlier clip in key '${codeClip.key}' to inherit one from`,
      );
    }
    const filename =
      codeClip.filename ?? store?.filename ?? basename(steps[steps.length - 1]);

    stores.set(codeClip.key, {
      step: steps[steps.length - 1],
      scroll: codeClip.scrollTo ?? scrollFrom,
      rect,
      filename,
      paneTitle: Boolean(codeClip.paneTitle),
      tailFrame: codeClip.endFrame + (codeClip.transitionOut ?? 0),
      clipId: clip.id,
    });

    resolved[i] = { ...codeClip, steps, scrollFrom, rect, filename };
  }

  return resolved;
};
