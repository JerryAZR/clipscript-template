import type { FC } from "react";

export type RectValue = number | `${number}%`;

export type Rect = {
  x: RectValue;
  y: RectValue;
  w: RectValue;
  h: RectValue;
};

/** Resolves a rect value against an absolute dimension (px or "NN%") */
export const resolveRectValue = (value: RectValue, dimension: number): number => {
  if (typeof value === "number") {
    return value;
  }
  if (value.endsWith("%")) {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return (parsed / 100) * dimension;
    }
  }
  // The storyboard only allows numbers or "%"-strings - anything else is a bug
  throw new Error(
    `Invalid rect value ${JSON.stringify(value)}; expected a number or a percentage string.`,
  );
};

export type ClipEndCondition =
  | { line: string; offsetFrames?: number; sync?: string; end?: false }
  | { line: string; end: true };

/**
 * Internal mixin holding the fields every clip shares, so each member of the
 * StoryboardClip union is a short intersection. Only needed when defining new
 * clip types in the engine - episode storyboards use StoryboardClip / *ClipDef.
 */
export type ClipCommon = {
  id: string;
  /**
   * Optional at authoring time so chained clips can inherit it from their
   * key-chain store. The renderer throws if a resolved clip has no rect.
   */
  rect?: Rect;
  /** Stacking order (default 0); use ~10 for overlays above other panes */
  zIndex?: number;
  startAt: { line: string; offsetFrames?: number };
  endAt: ClipEndCondition[];
  /** Frames of slide-in transition at clip start */
  transitionIn?: number;
  /** Frames of slide-out transition after clip end */
  transitionOut?: number;
  /**
   * Optional pane title bar rendered by the pane (ClipPane) above the clip
   * content. Distinct from content-level title fields on title/overlay/
   * progress clips: this is pane chrome, identical for every clip type.
   */
  paneTitle?: string;
};

export type TitleClipDef = ClipCommon & {
  type: "title";
  title: string;
  subtitle?: string;
};

export type CodeClipDef = ClipCommon & {
  type: "code";
  /** Persistence chain id - clips with the same key share code/scroll state */
  key?: string;
  /** Code files in public/<episode>/code/. After resolution: effective list with the chain carry-in prepended */
  steps: string[];
  /** Tab label. Default: basename of the last step */
  filename?: string;
  /** Frames between step morphs (default 60) */
  stepInterval?: number;
  /** Morph length in frames (default 30) */
  transitionDuration?: number;
  /** Morph granularity (default "token"; "line" survives big rewrites) */
  transition?: "token" | "line";
  /** Injected by the state resolver, not authored: rendered line to start scrolled at */
  scrollFrom?: number;
  /** Rendered line to scroll to, 1-based (default: stay at scrollFrom) */
  scrollTo?: number;
  /** Scroll animation length in frames (default 30; 0 = snap) */
  scrollDuration?: number;
};

export type TerminalClipDef = ClipCommon & {
  type: "terminal";
  /**
   * Commands to type out, each followed by its output lines. The window
   * title comes from the first step's cwd (default: "terminal").
   */
  steps: { cwd?: string; command: string; output?: string[] }[];
  /** Characters per frame (default 1) */
  typeSpeed?: number;
  /** Frames to pause after a command is fully typed (default 15) */
  pauseAfterCommand?: number;
  /** Frames between output lines appearing (default 10) */
  outputLineDelay?: number;
  /** Blinking block cursor (default true) */
  showCursor?: boolean;
};

export type VideoClipDef = ClipCommon & {
  type: "video";
  /** Video file in public/<episode>/video/ */
  src: string;
  /** Skip this many frames of the recording (default 0) */
  startFrom?: number;
  playbackRate?: number;
  /** Default true */
  muted?: boolean;
  /** Default false */
  loop?: boolean;
};

export type OverlayClipDef = ClipCommon & {
  type: "overlay";
  title?: string;
  text: string;
};

export type CinematicTitleClipDef = ClipCommon & {
  type: "cinematic-title";
  title: string;
  subtitle?: string;
};

export type AnimatedListClipDef = ClipCommon & {
  type: "animated-list";
  items: string[];
  /** Frames between consecutive items appearing (default 15) */
  stagger?: number;
};

export type ProgressItem = {
  text: string;
  status: "done" | "current" | "todo";
  children?: { text: string; status: "done" | "current" | "todo" }[];
};

export type ProgressClipDef = ClipCommon & {
  type: "progress";
  /** Heading above the checklist (optional) */
  title?: string;
  items: ProgressItem[];
};

export type StoryboardClip =
  | TitleClipDef
  | CodeClipDef
  | TerminalClipDef
  | VideoClipDef
  | OverlayClipDef
  | CinematicTitleClipDef
  | AnimatedListClipDef
  | ProgressClipDef;

export type Storyboard = {
  clips: StoryboardClip[];
};

/**
 * Code clip pacing defaults, shared by the state resolver and the component.
 * Kept here (not code-style.ts) so pure logic can use them without pulling
 * in the font-loading module chain.
 */
export const defaultStepInterval = 60;
export const defaultTransitionDuration = 30;

// Runtime layer: what the timeline compiler emits

export type TimelineLine = {
  fullId: string;
  text: string;
  startFrame: number;
  endFrame: number;
  audio: string | null;
};

export type TimelineClip<T extends StoryboardClip = StoryboardClip> = T & {
  startFrame: number;
  endFrame: number;
};

export type Timeline = {
  lines: TimelineLine[];
  clips: TimelineClip[];
  totalFrames: number;
};

export type ClipComponent<T extends StoryboardClip = StoryboardClip> = FC<{
  clip: TimelineClip<T>;
}>;
