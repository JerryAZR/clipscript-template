import type { FC } from "react";

export type RectValue = number | `${number}%`;

export type Rect = {
  x: RectValue;
  y: RectValue;
  w: RectValue;
  h: RectValue;
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
  zIndex?: number;
  startAt: { line: string; offsetFrames?: number };
  endAt: ClipEndCondition[];
  /** Frames of slide-in transition at clip start */
  transitionIn?: number;
  /** Frames of slide-out transition after clip end */
  transitionOut?: number;
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
  /** Commands to type out, each followed by its output lines */
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

export type StoryboardClip =
  | TitleClipDef
  | CodeClipDef
  | TerminalClipDef
  | VideoClipDef
  | OverlayClipDef;

export type Storyboard = {
  clips: StoryboardClip[];
};

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
