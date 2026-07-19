import { getThemeColors } from "@code-hike/lighter";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mix, readableColor } from "polished";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveCodeState } from "../../src/engine/clips/code-state";
import { measureAudioDuration } from "../../src/engine/audio";
import { estimateDurationFrames, parseNarration } from "../../src/engine/narration";
import { calculateTimeline } from "../../src/engine/timeline";
import type { CodeClipDef, TimelineClip } from "../../src/engine/types";
import { getEpisode } from "../../src/episodes/registry";
import { offlineLighterOverride } from "../../src/calculate-metadata/webpack-override";

const EPSILON = 8;
// Code pane of code-1/code-2: rect 10%,10%,80%,80% of 1920x1080
const PANE = { x: 192, y: 108, w: 1536, h: 864 };
const TAB_HEIGHT = 36;
const CODE_TOP = PANE.y + TAB_HEIGHT;
const LINE_HEIGHT = 36;

const frames = {} as Record<string, string>;
let outDir = "";
let expectedBackground = "";
let expectedBand = "";

const readPng = (file: string) => PNG.sync.read(fs.readFileSync(file));

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const pixel = (png: PNG, x: number, y: number) => {
  const i = (Math.round(y) * png.width + Math.round(x)) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
};

const channelDiff = (a: number[], b: number[]) =>
  Math.max(...a.map((v, i) => Math.abs(v - b[i])));

/** Fraction of pixels matching a color within a region (invert=true: differing) */
const regionRatio = (
  png: PNG,
  color: number[],
  region: { x: number; y: number; w: number; h: number },
  invert = false,
) => {
  let count = 0;
  for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      const differs = channelDiff(pixel(png, x, y), color) > EPSILON;
      if (differs === invert) {
        count++;
      }
    }
  }
  return count / (region.w * region.h);
};

/** Fraction of pixels differing between two same-size regions of two frames */
const cropDiff = (
  a: PNG,
  b: PNG,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  w: number,
  h: number,
) => {
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (channelDiff(pixel(a, ax + x, ay + y), pixel(b, bx + x, by + y)) > EPSILON) {
        count++;
      }
    }
  }
  return count / (w * h);
};

const fullDiff = (a: PNG, b: PNG) => cropDiff(a, b, 0, 0, 0, 0, a.width, a.height);

describe("smoke: Episode demo render", () => {
  beforeAll(async () => {
    const { storyboard } = getEpisode("demo");
    const narration = parseNarration(
      fs.readFileSync(path.resolve("public/demo/narration.toml"), "utf8"),
    );
    // Mirror the engine: measured durations from voiceover mp3s when present
    const lines = await Promise.all(
      narration.map(async (line) => {
        const mp3 = path.resolve(`public/demo/voiceover/${line.fullId}.mp3`);
        if (fs.existsSync(mp3)) {
          const seconds = await measureAudioDuration(
            new Blob([fs.readFileSync(mp3)]),
          );
          return { ...line, durationFrames: Math.max(1, Math.round(seconds * 30)) };
        }
        return { ...line, durationFrames: estimateDurationFrames(line.text, 30) };
      }),
    );
    const rawTimeline = calculateTimeline(lines, storyboard.clips);
    const clips = resolveCodeState(rawTimeline.clips);
    const code1 = clips.find((c) => c.id === "code-1")! as unknown as TimelineClip<CodeClipDef>;
    const code2 = clips.find((c) => c.id === "code-2")!;
    const banner = clips.find((c) => c.id === "concepts-banner")!;
    const stepInterval = code1.stepInterval ?? 60;
    const transitionDuration = code1.transitionDuration ?? 30;

    const introLine = rawTimeline.lines.find((l) => l.fullId === "intro.first")!;
    const spanLine = rawTimeline.lines.find((l) => l.fullId === "concepts.span")!;
    const terminalLine = rawTimeline.lines.find((l) => l.fullId === "showcase.terminal")!;
    const videoLine = rawTimeline.lines.find((l) => l.fullId === "showcase.video")!;
    const overlayLine = rawTimeline.lines.find((l) => l.fullId === "showcase.overlay")!;
    const cinematicLine = rawTimeline.lines.find((l) => l.fullId === "more.cinematic")!;
    const listLine = rawTimeline.lines.find((l) => l.fullId === "more.list")!;
    const progressLine = rawTimeline.lines.find((l) => l.fullId === "more.progress")!;

    const samplePoints: Record<string, number> = {
      introTitle: introLine.startFrame + 15,
      conceptsMid: spanLine.startFrame + Math.floor((spanLine.endFrame - spanLine.startFrame) / 2),
      bannerFrame: banner.startFrame + 30,
      settledV1: code1.startFrame + 40,
      midMorph: code1.startFrame + stepInterval + 8,
      beforeEnd: code1.endFrame - 2,
      endOfCode1: code1.endFrame - 1,
      startOfCode2: code2.startFrame,
      afterScroll: code2.startFrame + 45,
      midMorph2: code2.startFrame + stepInterval + transitionDuration / 2,
      terminalMid: terminalLine.startFrame + 60,
      videoEarly: videoLine.startFrame + 30,
      videoLate: overlayLine.startFrame + 30,
      overlayFrame: overlayLine.startFrame + 30,
      cinematicMid: cinematicLine.startFrame + 60,
      // After the pane fade + first item's reveal, but before the last item starts
      listEarly: listLine.startFrame + 35,
      listLate: listLine.endFrame - 5,
      progressMid: progressLine.startFrame + 45,
    };

    // Absolute expected colors, computed the same way the components do
    const themeColors = await getThemeColors("github-dark");
    expectedBackground = themeColors.background;
    // The header band: useCardColor(0.07)
    expectedBand = mix(0.07, readableColor(themeColors.background), themeColors.background);

    outDir = fs.mkdtempSync(path.join(os.tmpdir(), "smoke-"));
    const serveUrl = await bundle({
      entryPoint: path.resolve("src/index.ts"),
      webpackOverride: offlineLighterOverride,
    });
    const composition = await selectComposition({
      serveUrl,
      id: "Episode",
      inputProps: {
        episode: "demo",
        theme: "github-dark",
        timeline: null,
        themeColors: null,
        highlightedCode: null,
      },
    });

    for (const [name, frame] of Object.entries(samplePoints)) {
      const output = path.join(outDir, `${name}.png`);
      await renderStill({ composition, serveUrl, frame, output });
      frames[name] = output;
    }
  }, 600_000);

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it("uses the expected theme background, band and card colors", () => {
    const png = readPng(frames.settledV1);
    expect(channelDiff(pixel(png, 4, 4), hexToRgb(expectedBackground))).toBeLessThanOrEqual(EPSILON);
    // Inside the header band: top-right corner of the tab row
    expect(
      channelDiff(pixel(png, PANE.x + PANE.w - 24, PANE.y + 12), hexToRgb(expectedBand)),
    ).toBeLessThanOrEqual(EPSILON);
  });

  it("every sampled frame contains content", () => {
    const bg = hexToRgb(expectedBackground);
    for (const file of Object.values(frames)) {
      const png = readPng(file);
      // Guards against broken/blank renders. Legitimately sparse frames
      // (a single revealed list item mid-stagger) cover ~0.3-0.5% of pixels.
      expect(
        regionRatio(png, bg, { x: 0, y: 0, w: png.width, h: png.height }, true),
      ).toBeGreaterThan(0.003);
    }
  });

  it("renders the title clip", () => {
    const png = readPng(frames.introTitle);
    const bg = hexToRgb(expectedBackground);
    expect(
      regionRatio(png, bg, { x: 480, y: 430, w: 960, h: 220 }, true),
    ).toBeGreaterThan(0.005);
  });

  it("renders the split panes and the banner overlay", () => {
    const bg = hexToRgb(expectedBackground);
    const png = readPng(frames.conceptsMid);
    // Left and right 50% panes
    expect(regionRatio(png, bg, { x: 200, y: 400, w: 600, h: 300 }, true)).toBeGreaterThan(0.005);
    expect(regionRatio(png, bg, { x: 1100, y: 400, w: 600, h: 300 }, true)).toBeGreaterThan(0.005);
    // Banner overlay while it is visible (it ends at frame 394)
    const banner = readPng(frames.bannerFrame);
    expect(regionRatio(banner, bg, { x: 480, y: 810, w: 960, h: 160 }, true)).toBeGreaterThan(0.005);
  });

  it("renders the terminal next to the code pane", () => {
    const png = readPng(frames.terminalMid);
    const bg = hexToRgb(expectedBackground);
    // Code pane (x 5%-47%) and terminal pane (x 53%-95%)
    expect(regionRatio(png, bg, { x: 200, y: 300, w: 600, h: 400 }, true)).toBeGreaterThan(0.005);
    expect(regionRatio(png, bg, { x: 1100, y: 300, w: 600, h: 400 }, true)).toBeGreaterThan(0.005);
  });

  it("plays the embedded video", () => {
    const early = readPng(frames.videoEarly);
    const bg = hexToRgb(expectedBackground);
    // Video pane content present
    expect(regionRatio(early, bg, { x: 300, y: 300, w: 800, h: 400 }, true)).toBeGreaterThan(0.005);
    // ...and the picture actually changes over time
    expect(fullDiff(early, readPng(frames.videoLate))).toBeGreaterThan(0.01);
  });

  it("renders the overlay card above the video", () => {
    const png = readPng(frames.overlayFrame);
    const bg = hexToRgb(expectedBackground);
    // Overlay rect (x 55%-90%, y 55%-80%)
    expect(regionRatio(png, bg, { x: 1060, y: 600, w: 660, h: 260 }, true)).toBeGreaterThan(0.005);
  });

  it("holds a settled step static", () => {
    expect(fullDiff(readPng(frames.beforeEnd), readPng(frames.endOfCode1))).toBeLessThan(0.005);
  });

  it("chains clips seamlessly (code-1 end ≈ code-2 carry-in)", () => {
    expect(fullDiff(readPng(frames.endOfCode1), readPng(frames.startOfCode2))).toBeLessThan(0.005);
  });

  it("keeps the filename tab identical across the chain", () => {
    // Cropping the tab strip makes the check ~50x more sensitive than full-frame
    expect(
      cropDiff(
        readPng(frames.endOfCode1),
        readPng(frames.startOfCode2),
        PANE.x,
        PANE.y,
        PANE.x,
        PANE.y,
        PANE.w,
        TAB_HEIGHT,
      ),
    ).toBeLessThan(0.02);
  });

  it("animates the morph (mid-morph differs from both endpoints)", () => {
    const mid = readPng(frames.midMorph);
    expect(fullDiff(mid, readPng(frames.settledV1))).toBeGreaterThan(0.015);
    // Guards against an instant snap to the final state
    expect(fullDiff(mid, readPng(frames.beforeEnd))).toBeGreaterThan(0.01);
  });

  it("scrolls to the configured line", () => {
    // code-1 scrolls to line 8, code-2 to line 20: the 3 lines at the code top
    // of afterScroll must be the same lines found (20-8)*36px lower at startOfCode2.
    const a = readPng(frames.afterScroll);
    const b = readPng(frames.startOfCode2);
    const expectedShift = (20 - 8) * LINE_HEIGHT;
    let best = 1;
    for (let dy = -10; dy <= 10; dy += 2) {
      best = Math.min(
        best,
        cropDiff(a, b, PANE.x, CODE_TOP, PANE.x, CODE_TOP + expectedShift + dy, PANE.w, 3 * LINE_HEIGHT),
      );
    }
    expect(best).toBeLessThan(0.03);
  });

  it("morphs to the next step after the scroll", () => {
    expect(fullDiff(readPng(frames.afterScroll), readPng(frames.midMorph2))).toBeGreaterThan(0.02);
  });

  it("renders the cinematic title with its accent underline", () => {
    const png = readPng(frames.cinematicMid);
    const bg = hexToRgb(expectedBackground);
    // Title + underline around the screen center
    expect(
      regionRatio(png, bg, { x: 560, y: 380, w: 800, h: 320 }, true),
    ).toBeGreaterThan(0.005);
  });

  it("reveals list items one by one", () => {
    const bg = hexToRgb(expectedBackground);
    const late = readPng(frames.listLate);
    // List pane settled: items present in the lower rows too
    expect(
      regionRatio(late, bg, { x: 400, y: 450, w: 1100, h: 400 }, true),
    ).toBeGreaterThan(0.005);
    // Early frame is missing the later items
    expect(
      cropDiff(
        readPng(frames.listEarly),
        late,
        400,
        450,
        400,
        450,
        1100,
        400,
      ),
    ).toBeGreaterThan(0.005);
  });

  it("renders the progress checklist", () => {
    const png = readPng(frames.progressMid);
    const bg = hexToRgb(expectedBackground);
    // Heading + items inside the progress pane (x 20%-80%, y 10%-90%)
    expect(
      regionRatio(png, bg, { x: 500, y: 200, w: 900, h: 700 }, true),
    ).toBeGreaterThan(0.005);
  });
});
