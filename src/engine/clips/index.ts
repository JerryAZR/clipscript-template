import type { ClipComponent, StoryboardClip } from "../types";
import { CodeClip } from "./CodeClip";
import { TitleClip } from "./TitleClip";

type SharedClipComponents = {
  [K in StoryboardClip["type"]]: ClipComponent<
    Extract<StoryboardClip, { type: K }>
  >;
};

export const sharedClipComponents: SharedClipComponents = {
  title: TitleClip,
  code: CodeClip,
};
