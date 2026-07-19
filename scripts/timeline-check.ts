import fs from "node:fs";
import { parseNarration, estimateDurationFrames } from "../src/engine/narration";
import { calculateTimeline } from "../src/engine/timeline";
import { getEpisode } from "../src/episodes/registry";

const { storyboard } = getEpisode("demo");
const narration = parseNarration(
  fs.readFileSync("public/demo/narration.toml", "utf8"),
);
const lines = narration.map((l) => ({
  ...l,
  durationFrames: estimateDurationFrames(l.text, 30),
}));
const t = calculateTimeline(lines, storyboard.clips);
console.log("totalFrames", t.totalFrames);
for (const l of t.lines) console.log(l.fullId, l.startFrame, l.endFrame);
for (const c of t.clips) console.log("clip", c.id, c.startFrame, c.endFrame);
