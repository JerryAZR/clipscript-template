import type { Storyboard } from "../../engine/types";

// Introduction: one full-screen title spanning two narration lines
const introClips: Storyboard["clips"] = [
  {
    id: "intro-title",
    type: "title",
    title: "Clip Engine",
    subtitle: "Narration-driven videos",
    rect: { x: 0, y: 0, w: "100%", h: "100%" },
    startAt: { line: "intro.first" },
    endAt: [{ line: "intro.second", end: true }],
  },
];

// Core concepts: split-screen, mid-line start, span + sync fence
const conceptClips: Storyboard["clips"] = [
  {
    id: "concepts-left",
    type: "title",
    title: "Clips",
    subtitle: "modular visual blocks",
    rect: { x: 0, y: 0, w: "50%", h: "100%" },
    transitionIn: 15,
    startAt: { line: "concepts.clips" },
    endAt: [{ line: "concepts.span", end: true }],
  },
  {
    id: "concepts-right",
    type: "title",
    title: "Timeline",
    subtitle: "computed from narration",
    rect: { x: "50%", y: 0, w: "50%", h: "100%" },
    transitionIn: 15,
    startAt: { line: "concepts.clips", offsetFrames: 20 },
    endAt: [{ line: "concepts.span", end: true }],
  },
  {
    // Bottom banner appearing on "concepts.timing"; its sync fence holds the
    // timeline for 150 frames before the next line may start
    id: "concepts-banner",
    type: "title",
    title: "Anchored to lines",
    rect: { x: "25%", y: "75%", w: "50%", h: "15%" },
    zIndex: 10,
    startAt: { line: "concepts.timing" },
    endAt: [{ line: "concepts.timing", offsetFrames: 150, sync: "concepts.timing" }],
  },
];

// Code clips: a keyed chain over one evolving file. code-2 inherits rect,
// filename, the carry-in step (v2) and scroll state from code-1.
const codeClips: Storyboard["clips"] = [
  {
    id: "code-1",
    type: "code",
    key: "main",
    steps: ["v1.ts", "v2.ts"],
    filename: "users.ts",
    rect: { x: "10%", y: "10%", w: "80%", h: "80%" },
    startAt: { line: "code.intro" },
    endAt: [{ line: "code.intro", end: true }],
  },
  {
    id: "code-2",
    type: "code",
    key: "main",
    steps: ["v3.ts"],
    scrollTo: 20,
    startAt: { line: "code.chain" },
    endAt: [{ line: "code.chain", end: true }],
  },
];

export const storyboard: Storyboard = {
  clips: [...introClips, ...conceptClips, ...codeClips],
};
