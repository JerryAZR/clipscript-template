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
    scrollTo: 8,
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

// Showcase: terminal beside the code, a video embed spanning two lines,
// and an overlay card stacked on top of it
const showcaseClips: Storyboard["clips"] = [
  {
    id: "code-3",
    type: "code",
    key: "main",
    steps: ["v3.ts"],
    rect: { x: "5%", y: "15%", w: "42%", h: "70%" },
    startAt: { line: "showcase.terminal" },
    endAt: [{ line: "showcase.terminal", end: true }],
  },
  {
    id: "terminal-1",
    type: "terminal",
    steps: [
      {
        cwd: "~/app",
        command: "npm install",
        output: ["added 361 packages in 21s"],
      },
      {
        cwd: "~/app",
        command: "npm run lint",
        output: ["> template-code-hike@1.0.0 lint", "> tsc && eslint src"],
      },
    ],
    rect: { x: "53%", y: "15%", w: "42%", h: "70%" },
    startAt: { line: "showcase.terminal" },
    endAt: [{ line: "showcase.terminal", end: true }],
  },
  {
    id: "video-1",
    type: "video",
    src: "cargo-run.mp4",
    paneTitle: "cargo run",
    rect: { x: "10%", y: "15%", w: "55%", h: "70%" },
    startAt: { line: "showcase.video" },
    endAt: [{ line: "showcase.overlay", end: true }],
  },
  {
    id: "overlay-1",
    type: "overlay",
    title: "Note",
    text: "Overlay cards stack on top\nfor tips and callouts.",
    rect: { x: "55%", y: "55%", w: "35%", h: "25%" },
    zIndex: 10,
    startAt: { line: "showcase.overlay" },
    endAt: [{ line: "showcase.overlay", end: true }],
  },
];

// Batch-2 clips: cinematic chapter title, staggered list, progress checklist
const moreClips: Storyboard["clips"] = [
  {
    id: "cinematic-1",
    type: "cinematic-title",
    title: "More Clips",
    subtitle: "titles, lists and checklists",
    rect: { x: 0, y: 0, w: "100%", h: "100%" },
    startAt: { line: "more.cinematic" },
    endAt: [{ line: "more.cinematic", end: true }],
  },
  {
    id: "list-1",
    type: "animated-list",
    items: [
      "Narration is the master clock",
      "Clips anchor to lines, never frames",
      "State chains carry code across clips",
    ],
    rect: { x: "15%", y: "15%", w: "70%", h: "70%" },
    transitionIn: 15,
    startAt: { line: "more.list" },
    endAt: [{ line: "more.list", end: true }],
  },
  {
    id: "progress-1",
    type: "progress",
    title: "In this demo",
    items: [
      { text: "Titles and layouts", status: "done" },
      { text: "Code clips and state chains", status: "done" },
      {
        text: "Showcase clips",
        status: "current",
        children: [
          { text: "Terminal and video", status: "done" },
          { text: "Lists and progress", status: "current" },
        ],
      },
      { text: "The framework demo video", status: "todo" },
    ],
    rect: { x: "20%", y: "10%", w: "60%", h: "80%" },
    transitionIn: 15,
    startAt: { line: "more.progress" },
    endAt: [{ line: "more.progress", end: true }],
  },
];

export const storyboard: Storyboard = {
  clips: [
    ...introClips,
    ...conceptClips,
    ...codeClips,
    ...showcaseClips,
    ...moreClips,
  ],
};
