import fs from "node:fs";
import { loadEpisodeTimeline } from "./timeline-node";

// Prints an episode's computed timeline: line frame ranges and resolved
// clip frame ranges. Measured voiceover durations when mp3s exist, estimates
// otherwise (matching the engine). Usage: npx tsx scripts/timeline-check.ts <episode>
const episode = process.argv[2];
if (!episode) {
  throw new Error("usage: npx tsx scripts/timeline-check.ts <episode>");
}
// Test fixtures self-register from tests/fixtures/<name>/register.ts
if (/^[a-z0-9-]+$/i.test(episode) && fs.existsSync(`tests/fixtures/${episode}/register.ts`)) {
  await import(`../tests/fixtures/${episode}/register.ts`);
}
const t = await loadEpisodeTimeline(episode);
console.log("totalFrames", t.totalFrames);
for (const l of t.lines) {
  console.log(l.fullId, l.startFrame, l.endFrame);
}
for (const c of t.clips) {
  console.log("clip", c.id, c.startFrame, c.endFrame);
}
