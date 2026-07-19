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
  rect: Rect;
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

export type StoryboardClip = TitleClipDef;

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
