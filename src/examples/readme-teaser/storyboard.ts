import { rects } from "../../engine/clip-style";
import type { Storyboard } from "../../engine/types";

const FADE = 12;

export const storyboard: Storyboard = {
  subtitles: true,
  clips: [
    {
      id: "title",
      type: "cinematic-title",
      title: "clipscript",
      subtitle: "narration-driven videos",
      rect: rects.full,
      transitionIn: FADE,
      transitionOut: FADE,
      startAt: { line: "title" },
      endAt: [{ line: "title", end: true }],
    },
    {
      id: "code",
      type: "code",
      steps: ["v1.ts", "v2.ts"],
      filename: "user.ts",
      rect: rects.large,
      stepInterval: 23,
      transitionDuration: 23,
      transitionIn: FADE,
      transitionOut: FADE,
      startAt: { line: "code" },
      endAt: [{ line: "code", end: true }],
    },
    {
      id: "terminal",
      type: "terminal",
      steps: [
        {
          cwd: "~/video",
          command: "npx remotion render my-episode",
          output: ["Rendered 300/300 frames", "out/my-episode.mp4"],
        },
      ],
      rect: rects.large,
      typeSpeed: 1.5,
      pauseAfterCommand: 6,
      outputLineDelay: 6,
      transitionIn: FADE,
      transitionOut: FADE,
      startAt: { line: "terminal" },
      endAt: [{ line: "terminal", end: true }],
    },
    {
      id: "workflow",
      type: "progress-steps",
      title: "From script to video",
      steps: ["Script", "Voiceover", "Storyboard", "Render"],
      rect: rects.large,
      stepInterval: 14,
      transitionIn: FADE,
      transitionOut: FADE,
      startAt: { line: "progress" },
      // Tuned after voiceover so the fade-out finishes before the GIF loops
      endAt: [{ line: "progress", offsetFrames: 50 }],
    },
  ],
};
