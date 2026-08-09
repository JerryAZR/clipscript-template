import { getThemeColors } from "@code-hike/lighter";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mix, readableColor } from "polished";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveRectValue } from "../../src/engine/types";
import type { CodeClipDef, Timeline, TimelineClip } from "../../src/engine/types";
import { offlineLighterOverride } from "../../src/calculate-metadata/webpack-override";
import { loadEpisodeTimeline } from "../../scripts/timeline-node";
import "../fixtures/kitchen-sink/register";

const EPSILON = 8;
// Code pane of code-1/code-2: rect 10%,10%,80%,80% of 1920x1080
const PANE = { x: 192, y: 108, w: 1536, h: 864 };
const TAB_HEIGHT = 36;
const CODE_TOP = PANE.y + TAB_HEIGHT;
const LINE_HEIGHT = 36;
// Presence threshold inside a clip's own pane (sparse clips like the
// countdown ring cover only a few % of their rect)
const PANE_CONTENT_RATIO = 0.002;

const frames = {} as Record<string, string>;
let outDir = "";
let expectedBackground = "";
let expectedBand = "";
let expectedCard = "";
let timeline: Timeline;
let samplePoints: Record<string, number> = {};

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

/** Clips visible at a frame (transitionOut tails included) */
const activeClipsAt = (frame: number) =>
  timeline.clips.filter(
    (c) => frame >= c.startFrame && frame < c.endFrame + (c.transitionOut ?? 0),
  );

const clipRegion = (clip: TimelineClip) => {
  if (!clip.rect) {
    throw new Error(`clip '${clip.id}' has no rect after resolution`);
  }
  return {
    x: Math.round(resolveRectValue(clip.rect.x, 1920)),
    y: Math.round(resolveRectValue(clip.rect.y, 1080)),
    w: Math.round(resolveRectValue(clip.rect.w, 1920)),
    h: Math.round(resolveRectValue(clip.rect.h, 1080)),
  };
};

describe("smoke: kitchen-sink fixture render", () => {
  beforeAll(async () => {
    timeline = await loadEpisodeTimeline("kitchen-sink");
    const clips = timeline.clips;
    const code1 = clips.find((c) => c.id === "code-1")! as unknown as TimelineClip<CodeClipDef>;
    const code2 = clips.find((c) => c.id === "code-2")!;
    const banner = clips.find((c) => c.id === "concepts-banner")!;
    const stepInterval = code1.stepInterval ?? 60;
    const transitionDuration = code1.transitionDuration ?? 30;

    const line = (id: string) => timeline.lines.find((l) => l.fullId === id)!;
    const introLine = line("intro.first");
    const spanLine = line("concepts.span");
    const terminalLine = line("showcase.terminal");
    const videoLine = line("showcase.video");
    const overlayLine = line("showcase.overlay");
    const cinematicLine = line("more.cinematic");
    const listLine = line("more.list");
    const progressLine = line("more.progress");
    const countdownLine = line("fence.countdown");
    const chapterLine = line("flair.chapter");
    const notifyLine = line("flair.notify");
    const stepsLine = line("flair.steps");

    samplePoints = {
      introTitle: introLine.startFrame + 30,
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
      countdownMid: countdownLine.startFrame + 45,
      chapterMid: chapterLine.startFrame + 50,
      notifyLate: notifyLine.endFrame - 10,
      stepsLate: stepsLine.endFrame - 10,
    };

    // Absolute expected colors, computed the same way the components do
    const themeColors = await getThemeColors("github-dark");
    expectedBackground = themeColors.background;
    // The header band: useCardColor(0.07)
    expectedBand = mix(0.07, readableColor(themeColors.background), themeColors.background);
    // The card body: useCardColor(0.04)
    expectedCard = mix(0.04, readableColor(themeColors.background), themeColors.background);

    outDir = fs.mkdtempSync(path.join(os.tmpdir(), "smoke-"));
    const serveUrl = await bundle({
      entryPoint: path.resolve("tests/smoke/entry.tsx"),
      webpackOverride: offlineLighterOverride,
    });
    const composition = await selectComposition({
      serveUrl,
      id: "kitchen-sink",
      inputProps: {
        episode: "kitchen-sink",
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

  it("renders the background image, header band and card colors", () => {
    const png = readPng(frames.settledV1);
    // The fixture's background is a gradient image; its top-left pixel is
    // rgb(10,26,46) - proves the backdrop renders (not the flat theme color)
    expect(channelDiff(pixel(png, 4, 4), [10, 26, 46])).toBeLessThanOrEqual(EPSILON);
    // Inside the header band: top-right corner of the tab row
    expect(
      channelDiff(pixel(png, PANE.x + PANE.w - 24, PANE.y + 12), hexToRgb(expectedBand)),
    ).toBeLessThanOrEqual(EPSILON);
  });

  it("shows the subtitle band only for lines that allow it", () => {
    // Dead-center of the bottom band; clear of the code pane (bottom edge 972)
    const BAND = { x: 860, y: 990, w: 200, h: 40 };
    const backdrop = [22, 50, 79]; // fixture background gradient near the bottom
    // A normal line: the pill + text cover the band region
    expect(
      regionRatio(readPng(frames.settledV1), backdrop, BAND, true),
    ).toBeGreaterThan(0.3);
    // intro.first opts out via subtitle = false: band region is bare backdrop
    expect(
      regionRatio(readPng(frames.introTitle), backdrop, BAND, true),
    ).toBeLessThan(0.01);
  });

  it("every active clip renders content inside its own pane", () => {
    const bg = hexToRgb(expectedBackground);
    for (const [name, frame] of Object.entries(samplePoints)) {
      const active = activeClipsAt(frame);
      expect(active.length, `no clip active at '${name}' (frame ${frame})`).toBeGreaterThan(0);
      const png = readPng(frames[name]);
      for (const clip of active) {
        expect(
          regionRatio(png, bg, clipRegion(clip), true),
          `clip '${clip.id}' renders nothing inside its pane at '${name}' (frame ${frame})`,
        ).toBeGreaterThan(PANE_CONTENT_RATIO);
      }
    }
  });

  it("spaces code lines one lineHeight apart (absolute geometry)", () => {
    // Relative-only checks cannot see uniformly-wrong layout (e.g. every line
    // rendering twice as tall): measure the vertical pitch of text runs in
    // the code pane against the same constant the scroll math uses.
    const png = readPng(frames.settledV1);
    const card = hexToRgb(expectedCard);
    const sampleXs = [40, 90, 150, 240, 360].map((dx) => PANE.x + dx);
    const rowHasText = (y: number) =>
      sampleXs.some((x) => channelDiff(pixel(png, x, y), card) > EPSILON);

    const rows: boolean[] = [];
    for (let y = PANE.y + 46; y < PANE.y + PANE.h - 8; y++) {
      rows.push(rowHasText(y));
    }
    // Autocorrelation: at the true line pitch, text rows map onto text rows.
    // Uniformly wrong geometry (e.g. doubled line height) peaks at the wrong
    // dy; blank source lines only lower the score, they don't shift the peak.
    let bestDy = 0;
    let bestScore = -1;
    for (let dy = 24; dy <= 72; dy++) {
      let matches = 0;
      for (let i = 0; i + dy < rows.length; i++) {
        if (rows[i] === rows[i + dy]) {
          matches++;
        }
      }
      const score = matches / (rows.length - dy);
      if (score > bestScore) {
        bestScore = score;
        bestDy = dy;
      }
    }
    expect(bestDy).toBeGreaterThanOrEqual(LINE_HEIGHT - 3);
    expect(bestDy).toBeLessThanOrEqual(LINE_HEIGHT + 3);
  });

  it("plays the embedded video", () => {
    // The picture actually changes over time
    expect(fullDiff(readPng(frames.videoEarly), readPng(frames.videoLate))).toBeGreaterThan(0.01);
  });

  it("reveals list items one by one", () => {
    const late = readPng(frames.listLate);
    // Early frame is missing the later items
    expect(
      cropDiff(readPng(frames.listEarly), late, 400, 450, 400, 450, 1100, 400),
    ).toBeGreaterThan(0.005);
  });

  it("holds a settled step static", () => {
    expect(fullDiff(readPng(frames.beforeEnd), readPng(frames.endOfCode1))).toBeLessThan(0.005);
  });

  it("chains clips seamlessly (code-1 end ≈ code-2 carry-in)", () => {
    // Cropped to the code pane: the chain boundary is also a line boundary,
    // so the subtitle band legitimately changes between these frames
    expect(
      cropDiff(
        readPng(frames.endOfCode1),
        readPng(frames.startOfCode2),
        PANE.x,
        PANE.y,
        PANE.x,
        PANE.y,
        PANE.w,
        PANE.h,
      ),
    ).toBeLessThan(0.005);
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
});
