import { loadEpisodeTimeline } from "./timeline-node";

// Prints the demo episode's computed timeline: line frame ranges and resolved
// clip frame ranges. Measured voiceover durations when mp3s exist, estimates
// otherwise (matching the engine). Usage: npx tsx scripts/timeline-check.ts [episode]
const t = await loadEpisodeTimeline(process.argv[2] ?? "demo");
console.log("totalFrames", t.totalFrames);
for (const l of t.lines) {
  console.log(l.fullId, l.startFrame, l.endFrame);
}
for (const c of t.clips) {
  console.log("clip", c.id, c.startFrame, c.endFrame);
}
