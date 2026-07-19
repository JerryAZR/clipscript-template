import type { ClipComponent, StoryboardClip } from "../types";
import { CodeClip } from "./CodeClip";
import { OverlayClip } from "./OverlayClip";
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
};
