import type { Storyboard } from "../../engine/types";

// annotate-diff showcase: pristine sources -> tool invocation -> raw outputs
// -> storyboard wiring -> rendered result (animated and static diff views).
// The gen/ assets are the tool's real output:
//   npx tsx scripts/annotate-diff.mts [--static] --out public/diff-tool/code/gen \
//     public/diff-tool/code/v1.ts public/diff-tool/code/v2.ts

export const storyboard: Storyboard = {
  clips: [
    {
      id: "intro-title",
      type: "cinematic-title",
      title: "annotate-diff",
      subtitle: "diff views, generated",
      rect: { x: 0, y: 0, w: "100%", h: "100%" },
      startAt: { line: "intro.title" },
      endAt: [{ line: "intro.title", end: true }],
    },

    // 1. the two pristine versions, side by side
    {
      id: "source-v1",
      type: "code",
      steps: ["v1.ts"],
      filename: "v1.ts",
      rect: { x: "4%", y: "8%", w: "44%", h: "84%" },
      transitionIn: 15,
      startAt: { line: "prepare.sources" },
      endAt: [{ line: "prepare.sources", end: true }],
    },
    {
      id: "source-v2",
      type: "code",
      steps: ["v2.ts"],
      filename: "v2.ts",
      rect: { x: "52%", y: "8%", w: "44%", h: "84%" },
      transitionIn: 15,
      startAt: { line: "prepare.sources", offsetFrames: 20 },
      endAt: [{ line: "prepare.sources", end: true }],
    },

    // 2. the command and its report
    {
      id: "invoke-terminal",
      type: "terminal",
      steps: [
        {
          cwd: "…/public/diff-tool",
          command: "npx tsx scripts/annotate-diff.mts --out code/gen v1.ts v2.ts",
          output: [
            "wrote code/gen/v1.ts",
            "wrote code/gen/v2.ts",
            "v1.ts -> v2.ts: 6 added, 1 removed, 1 inline - fallback at line 20 (1->2)",
          ],
        },
      ],
      rect: { x: "10%", y: "28%", w: "80%", h: "36%" },
      transitionIn: 15,
      startAt: { line: "invoke.command" },
      endAt: [{ line: "invoke.command", end: true }],
    },

    // 3. the raw generated file (plain text copy - markers visible as text)
    {
      id: "output-raw",
      type: "code",
      steps: ["gen/v2.txt"],
      filename: "gen/v2.ts",
      rect: { x: "5%", y: "10%", w: "90%", h: "80%" },
      scrollTo: 5,
      transitionIn: 15,
      startAt: { line: "outputs.text" },
      endAt: [{ line: "outputs.text", end: true }],
    },

    // 4. storyboard wiring
    {
      id: "wire-steps",
      type: "code",
      steps: ["steps.ts"],
      filename: "storyboard.ts",
      rect: { x: "20%", y: "30%", w: "60%", h: "40%" },
      transitionIn: 15,
      startAt: { line: "wire.storyboard" },
      endAt: [{ line: "wire.storyboard", end: true }],
    },

    // 5. the rendered result: animated morph over the generated pair,
    //    then the static merged diff (chained - same top-left corner)
    {
      id: "result-animated",
      type: "code",
      key: "result",
      steps: ["gen/v1.ts", "gen/v2.ts"],
      filename: "users.ts",
      rect: { x: "10%", y: "10%", w: "80%", h: "80%" },
      scrollTo: 8,
      stepInterval: 45,
      startAt: { line: "result.animated" },
      endAt: [{ line: "result.animated", end: true }],
    },
    {
      id: "result-static",
      type: "code",
      key: "result",
      steps: ["gen/v2.diff.ts"],
      filename: "users.diff.ts",
      scrollTo: 12,
      // the chain carries gen/v2.ts in as the initial step - morph to the
      // static diff view almost immediately so the beat is mostly static
      stepInterval: 15,
      startAt: { line: "result.static" },
      endAt: [{ line: "result.static", end: true }],
    },
  ],
};
