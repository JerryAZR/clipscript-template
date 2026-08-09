import { rects } from "../../engine/clip-style";
import type { Storyboard } from "../../engine/types";

// Hardening a user store: a real walkthrough. One line, one beat - each
// clip morphs in exactly one thing (a code change or an annotation).
// focus/mark point at existing code; diff marks code added in that step.

const titleClips: Storyboard["clips"] = [
  {
    id: "title",
    type: "cinematic-title",
    title: "Hardening a User Store",
    subtitle: "a step-by-step refactor",
    rect: rects.full,
    startAt: { line: "title" },
    endAt: [{ line: "title", end: true }],
  },
];

// The chain: v1 (plain) -> v1-focus (focus fades in) -> v2 (guard, diff)
// -> v2-mark (guard diff clears, leak mark fades in) -> v3 (fallback, diff)
const codeClips: Storyboard["clips"] = [
  {
    id: "code-intro",
    type: "code",
    key: "tut",
    steps: ["v1.ts"],
    filename: "users.ts",
    rect: rects.large,
    scrollTo: 8,
    startAt: { line: "intro.file" },
    endAt: [{ line: "intro.file", end: true }],
  },
  {
    id: "code-focus",
    type: "code",
    key: "tut",
    steps: ["v1-focus.ts"],
    startAt: { line: "focus.adduser" },
    endAt: [{ line: "focus.adduser", end: true }],
  },
  {
    id: "code-guard",
    type: "code",
    key: "tut",
    steps: ["v2.ts"],
    startAt: { line: "change.guard" },
    endAt: [{ line: "change.guard", end: true }],
  },
  {
    id: "code-leak",
    type: "code",
    key: "tut",
    steps: ["v2-mark.ts"],
    scrollTo: 24,
    startAt: { line: "mark.leak" },
    endAt: [{ line: "explain.leak", end: true }],
  },
  {
    id: "code-remove",
    type: "code",
    key: "tut",
    steps: ["v2-minus.ts"],
    // stepInterval shortened so the morph settles before the line ends
    stepInterval: 45,
    startAt: { line: "change.fallback" },
    endAt: [{ line: "change.fallback", end: true }],
  },
  {
    id: "code-fallback",
    type: "code",
    key: "tut",
    steps: ["v3.ts"],
    stepInterval: 45,
    startAt: { line: "change.default" },
    endAt: [{ line: "change.default", end: true }],
  },
];

const testClips: Storyboard["clips"] = [
  {
    id: "term-guard",
    type: "terminal",
    steps: [
      {
        cwd: "~/store",
        command: "npm test",
        output: ["✓ rejects negative ages", "Tests  1 passed (1)"],
      },
    ],
    rect: rects.medium,
    transitionIn: 15,
    startAt: { line: "test.run" },
    endAt: [{ line: "test.run", end: true }],
  },
  {
    id: "term-final",
    type: "terminal",
    steps: [
      {
        cwd: "~/store",
        command: "npm test",
        output: [
          "✓ rejects negative ages",
          "✓ falls back when location is missing",
          "Tests  2 passed (2)",
        ],
      },
    ],
    rect: rects.medium,
    transitionIn: 15,
    startAt: { line: "test.again" },
    endAt: [{ line: "test.again", end: true }],
  },
];

// The leak explanation card, next to the marked line (once the mark is in)
const overlayClips: Storyboard["clips"] = [
  {
    id: "leak-card",
    type: "overlay",
    title: "The leak",
    text: "location?: string\nundefined when missing",
    rect: { x: "55%", y: "60%", w: "32%", h: "24%" },
    zIndex: 10,
    transitionIn: 15,
    startAt: { line: "explain.leak" },
    endAt: [{ line: "explain.leak", end: true }],
  },
];

const recapClips: Storyboard["clips"] = [
  {
    id: "recap-list",
    type: "animated-list",
    items: ["Guard the input", "Then double-check the output"],
    rect: rects.medium,
    transitionIn: 15,
    startAt: { line: "recap" },
    endAt: [{ line: "recap", end: true }],
  },
];

export const storyboard: Storyboard = {
  clips: [
    ...titleClips,
    ...codeClips,
    ...testClips,
    ...overlayClips,
    ...recapClips,
  ],
};
