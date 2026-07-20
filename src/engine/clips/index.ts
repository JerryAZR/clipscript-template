import type { ClipComponent, StoryboardClip } from "../types";
import { AnimatedListClip } from "./AnimatedListClip";
import { ChapterTitleClip } from "./ChapterTitleClip";
import { CinematicTitleClip } from "./CinematicTitleClip";
import { CodeClip } from "./CodeClip";
import { CountdownClip } from "./CountdownClip";
import { NotificationPopClip } from "./NotificationPopClip";
import { OverlayClip } from "./OverlayClip";
import { ProgressClip } from "./ProgressClip";
import { ProgressStepsClip } from "./ProgressStepsClip";
import { TerminalClip } from "./TerminalClip";
import { VideoClip } from "./VideoClip";

// Optional per key: clip types land incrementally, and episode registries
// may cover types the shared registry doesn't
type SharedClipComponents = {
  [K in StoryboardClip["type"]]?: ClipComponent<
    Extract<StoryboardClip, { type: K }>
  >;
};

export const sharedClipComponents: SharedClipComponents = {
  "cinematic-title": CinematicTitleClip,
  code: CodeClip,
  terminal: TerminalClip,
  video: VideoClip,
  overlay: OverlayClip,
  "animated-list": AnimatedListClip,
  progress: ProgressClip,
  countdown: CountdownClip,
  "chapter-title": ChapterTitleClip,
  "notification-pop": NotificationPopClip,
  "progress-steps": ProgressStepsClip,
};
