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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// edge-tts is occasionally unstable - retry with backoff per line, and
// persist the cache after every line so a failed run still resumes cheaply
const MAX_ATTEMPTS = 3;
const writeCache = () => fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

const wanted = new Set<string>();
const failed: string[] = [];
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

  let attempt = 0;
  for (;;) {
    try {
      attempt++;
      await synthesize(line.text, file);
      break;
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS) {
        console.log(`FAIL   ${line.fullId} (${MAX_ATTEMPTS} attempts)`);
        failed.push(line.fullId);
        break;
      }
      console.log(`retry  ${line.fullId} (attempt ${attempt} failed, backing off)`);
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }

  if (!failed.includes(line.fullId)) {
    cache[line.fullId] = hash;
    writeCache();
    synthesized++;
    console.log(`done   ${line.fullId}`);
  }
}

// Garbage-collect audio for removed lines
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith(".mp3") && !wanted.has(file)) {
    fs.rmSync(path.join(outDir, file));
    console.log(`gc     ${file}`);
  }
}

writeCache();
console.log(
  `\n${lines.length} lines, ${synthesized} synthesized, ${lines.length - synthesized - failed.length} cached, ${failed.length} failed`,
);
if (failed.length > 0) {
  console.log(`failed lines: ${failed.join(", ")} - re-run to retry (cache is resumable)`);
  process.exitCode = 1;
}
