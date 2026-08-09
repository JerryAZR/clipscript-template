import { rects } from "../../engine/clip-style";
import type { Storyboard } from "../../engine/types";

// Hook: the video's own script on screen while the narration calls it out
const hookClips: Storyboard["clips"] = [
  {
    id: "meta-script",
    type: "code",
    steps: ["showcase-narration.toml"],
    filename: "narration.toml",
    rect: rects.medium,
    transitionIn: 15,
    startAt: { line: "hook.compiled" },
    endAt: [{ line: "hook.script", end: true }],
  },
];

// What it is: the title page
const introClips: Storyboard["clips"] = [
  {
    id: "intro-title",
    type: "cinematic-title",
    title: "Clip Engine",
    subtitle: "narration-driven videos",
    rect: rects.full,
    startAt: { line: "intro.framework" },
    endAt: [{ line: "intro.clock", end: true }],
  },
];

// Code clips: morphs, diffs, annotations. v3 carries diff + focus + errors.
const codeClips: Storyboard["clips"] = [
  {
    id: "code-main",
    type: "code",
    key: "code",
    steps: ["v1.ts", "v2.ts"],
    filename: "users.ts",
    rect: rects.large,
    scrollTo: 8,
    startAt: { line: "code.pain" },
    endAt: [{ line: "code.morph", end: true }],
  },
  {
    id: "code-annotations",
    type: "code",
    key: "code",
    steps: ["v3.ts"],
    scrollTo: 20,
    startAt: { line: "code.annotations" },
    endAt: [{ line: "code.annotations", end: true }],
  },
];

// Terminal + layout composition
const layoutClips: Storyboard["clips"] = [
  {
    id: "term-1",
    type: "terminal",
    steps: [
      {
        cwd: "~/video",
        command: "npm test",
        output: ["Test Files  9 passed (9)", "Tests  95 passed (95)"],
      },
      {
        cwd: "~/video",
        command: "npx remotion render examples-showcase",
        output: ["Rendered 2216/2216 frames", "+ out/episode.mp4"],
      },
    ],
    rect: rects.medium,
    transitionIn: 15,
    startAt: { line: "term.deterministic" },
    endAt: [{ line: "term.deterministic", end: true }],
  },
  {
    id: "layout-code",
    type: "code",
    key: "code",
    steps: ["v3.ts"],
    rect: { x: "5%", y: "15%", w: "45%", h: "70%" },
    startAt: { line: "layout.panes" },
    endAt: [{ line: "layout.panes", end: true }],
  },
  {
    id: "layout-overlay",
    type: "overlay",
    title: "Compose",
    text: "rects + zIndex\n= any layout",
    rect: { x: "58%", y: "45%", w: "30%", h: "25%" },
    zIndex: 10,
    transitionIn: 15,
    startAt: { line: "layout.panes", offsetFrames: 30 },
    endAt: [{ line: "layout.panes", end: true }],
  },
];

// Structure: a chapter card hands over to the two progress trackers mid-line
const structClips: Storyboard["clips"] = [
  {
    id: "struct-chapter",
    type: "chapter-title",
    chapter: 1,
    title: "Staying organized",
    rect: rects.full,
    transitionOut: 15,
    startAt: { line: "struct.chapters" },
    endAt: [{ line: "struct.chapters", offsetFrames: 60 }],
  },
  {
    id: "struct-checklist",
    type: "progress",
    title: "In this episode",
    items: [
      { text: "Write the script", status: "done" },
      { text: "Place the clips", status: "current" },
      { text: "Render", status: "todo" },
    ],
    rect: { x: "6%", y: "20%", w: "36%", h: "60%" },
    transitionIn: 15,
    startAt: { line: "struct.chapters", offsetFrames: 60 },
    endAt: [{ line: "struct.chapters", end: true }],
  },
  {
    id: "struct-steps",
    type: "progress-steps",
    steps: ["Script", "Voiceover", "Storyboard", "Render"],
    rect: { x: "46%", y: "20%", w: "52%", h: "60%" },
    transitionIn: 15,
    startAt: { line: "struct.chapters", offsetFrames: 60 },
    endAt: [{ line: "struct.chapters", end: true }],
  },
];

// The fence: narration waits for the countdown. The offset (200) exceeds the
// line's audio length, so the timeline is held past the last word until the
// "GO!" has landed - that hold IS the demo.
const fenceClips: Storyboard["clips"] = [
  {
    id: "fence-countdown",
    type: "countdown",
    seconds: 3,
    rect: { x: "35%", y: "15%", w: "30%", h: "70%" },
    startAt: { line: "fence.hold" },
    endAt: [{ line: "fence.hold", offsetFrames: 200, sync: "fence.hold" }],
  },
];

// Authoring: the two files side by side (their CardHeader tabs label them)
const authorClips: Storyboard["clips"] = [
  {
    id: "author-script",
    type: "code",
    steps: ["showcase-narration.toml"],
    filename: "narration.toml",
    rect: rects.splitLeft,
    startAt: { line: "author.files" },
    endAt: [{ line: "author.retime", end: true }],
  },
  {
    id: "author-storyboard",
    type: "code",
    steps: ["showcase-storyboard.ts"],
    filename: "storyboard.ts",
    rect: rects.splitRight,
    transitionIn: 15,
    startAt: { line: "author.files", offsetFrames: 15 },
    endAt: [{ line: "author.retime", end: true }],
  },
];

// Outro
const outroClips: Storyboard["clips"] = [
  {
    id: "outro-list",
    type: "animated-list",
    items: ["Local fonts", "Local highlighting", "Offline renders"],
    rect: rects.medium,
    transitionIn: 15,
    startAt: { line: "outro.offline" },
    endAt: [{ line: "outro.offline", end: true }],
  },
  {
    id: "outro-title",
    type: "cinematic-title",
    title: "Clip Engine",
    subtitle: "make your next tutorial write itself",
    rect: rects.full,
    transitionIn: 15,
    startAt: { line: "outro.cta" },
    endAt: [{ line: "outro.cta", end: true }],
  },
];

export const storyboard: Storyboard = {
  clips: [
    ...hookClips,
    ...introClips,
    ...codeClips,
    ...layoutClips,
    ...structClips,
    ...fenceClips,
    ...authorClips,
    ...outroClips,
  ],
};
