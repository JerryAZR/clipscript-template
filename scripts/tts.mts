/**
 * Narration voiceover pipeline: narration.toml -> voiceover/<lineId>.mp3
 * via edge-tts (free Microsoft Edge Read Aloud API). Content-hash cached:
 * only lines whose text/voice/rate changed are re-synthesized.
 *
 * Usage: npx tsx scripts/tts.mts --episode <name> [--voice en-US-AriaNeural] [--rate +0%]
 *
 * When quality matters, replace this script with your own TTS pipeline
 * (e.g. an OpenAI-compatible TTS API) writing the same files:
 * public/<episode>/voiceover/<lineId>.mp3
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { parseNarration } from "../src/engine/narration";

const args = process.argv.slice(2);
const argOf = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const episode = argOf("episode");
if (!episode) {
  throw new Error("usage: npx tsx scripts/tts.mts --episode <name> [--voice v] [--rate r]");
}
const voice = argOf("voice") ?? "en-US-AriaNeural";
const rate = argOf("rate") ?? "+0%";

const lines = parseNarration(
  fs.readFileSync(path.join("public", episode, "narration.toml"), "utf8"),
);

const outDir = path.join("public", episode, "voiceover");
fs.mkdirSync(outDir, { recursive: true });

const cachePath = path.join(outDir, ".tts-cache.json");
const cache: Record<string, string> = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

const hashOf = (text: string) =>
  createHash("sha256").update(`${voice}|${rate}|${text}`).digest("hex").slice(0, 16);

const tts = new MsEdgeTTS();
await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

const synthesize = async (text: string, file: string) => {
  const { audioStream } = tts.toStream(text, { rate });
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(file);
    audioStream.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
    audioStream.on("error", reject);
  });
};

const wanted = new Set<string>();
let synthesized = 0;
for (const line of lines) {
  const filename = `${line.fullId}.mp3`;
  wanted.add(filename);
  const file = path.join(outDir, filename);
  const hash = hashOf(line.text);

  if (cache[line.fullId] === hash && fs.existsSync(file)) {
    console.log(`skip   ${line.fullId}`);
    continue;
  }

  try {
    await synthesize(line.text, file);
  } catch {
    console.log(`retry  ${line.fullId}`);
    await synthesize(line.text, file);
  }
  cache[line.fullId] = hash;
  synthesized++;
  console.log(`done   ${line.fullId}`);
}

// Garbage-collect audio for removed lines
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith(".mp3") && !wanted.has(file)) {
    fs.rmSync(path.join(outDir, file));
    console.log(`gc     ${file}`);
  }
}

fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
console.log(
  `\n${lines.length} lines, ${synthesized} synthesized, ${lines.length - synthesized} cached`,
);
