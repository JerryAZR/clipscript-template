import type { ClipComponent, StoryboardClip } from "../types";
import { AnimatedListClip } from "./AnimatedListClip";
import { CinematicTitleClip } from "./CinematicTitleClip";
import { CodeClip } from "./CodeClip";
import { OverlayClip } from "./OverlayClip";
import { ProgressClip } from "./ProgressClip";
import { TerminalClip } from "./TerminalClip";
import { TitleClip } from "./TitleClip";
import { VideoClip } from "./VideoClip";

// Optional per key: clip types land incrementally, and episode registries
// may cover types the shared registry doesn't
type SharedClipComponents = {
  [K in StoryboardClip["type"]]?: ClipComponent<
    Extract<StoryboardClip, { type: K }>
  >;
};

export const sharedClipComponents: SharedClipComponents = {
  title: TitleClip,
  code: CodeClip,
  terminal: TerminalClip,
  video: VideoClip,
  overlay: OverlayClip,
  "cinematic-title": CinematicTitleClip,
  "animated-list": AnimatedListClip,
  progress: ProgressClip,
};
