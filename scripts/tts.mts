/**
 * Narration voiceover pipeline: narration.toml -> voiceover/<lineId>.mp3
 * Content-hash cached: only lines whose text/provider settings changed are
 * re-synthesized.
 *
 * Providers:
 *   edge  (default) - free Microsoft Edge Read Aloud API via msedge-tts
 *   openai          - any OpenAI-compatible TTS endpoint (POST <baseUrl>/audio/speech)
 *
 * Usage: npx tsx scripts/tts.mts --episode <name>
 *   [--provider edge|openai] [--voice v]
 *   [--rate +0%]                          edge only
 *   [--url u] [--model m] [--speed 1.0] [--key k | --key-path p]   openai only
 *
 * Defaults come from tts.config.toml (optional; see tts.config.example.toml).
 * CLI flags override the config file.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { parse as parseToml } from "smol-toml";
import { parseNarration } from "../src/engine/narration";
import { mintJwt } from "./ssh-jwt";

const args = process.argv.slice(2);
const argOf = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const episode = argOf("episode");
if (!episode) {
  throw new Error(
    "usage: npx tsx scripts/tts.mts --episode <name> [--provider p] [--voice v] [--rate r] [--url u] [--model m] [--speed s] [--key k | --key-path p]",
  );
}

// --- Provider config: tts.config.toml defaults, CLI flags override ---------

type EdgeConfig = { provider: "edge"; voice: string; rate: string };
type OpenAIConfig = {
  provider: "openai";
  baseUrl: string;
  model: string;
  voice?: string;
  speed: number;
  /** Bearer token: static (apiKey) or minted per run from an SSH key (keyPath) */
  token?: string;
};
type TtsConfig = EdgeConfig | OpenAIConfig;

const CONFIG_PATH = "tts.config.toml";
const fileConfig: Record<string, unknown> = fs.existsSync(CONFIG_PATH)
  ? (parseToml(fs.readFileSync(CONFIG_PATH, "utf8")) as Record<string, unknown>)
  : {};

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const section = (name: string) =>
  typeof fileConfig[name] === "object" && fileConfig[name] !== null
    ? (fileConfig[name] as Record<string, unknown>)
    : {};

const resolveConfig = (): TtsConfig => {
  const provider = argOf("provider") ?? str(fileConfig.provider) ?? "edge";
  if (provider === "edge") {
    const edge = section("edge");
    return {
      provider,
      voice: argOf("voice") ?? str(edge.voice) ?? "en-US-AriaNeural",
      rate: argOf("rate") ?? str(edge.rate) ?? "+0%",
    };
  }
  if (provider === "openai") {
    const openai = section("openai");
    const baseUrl = argOf("url") ?? str(openai.baseUrl);
    const model = argOf("model") ?? str(openai.model);
    if (!baseUrl || !model) {
      throw new Error(
        "provider 'openai' needs baseUrl and model - set them in tts.config.toml [openai] or pass --url/--model",
      );
    }
    const speedRaw = argOf("speed") ?? num(openai.speed);
    const speed = speedRaw === undefined ? 1.0 : Number(speedRaw);
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new Error(`invalid speed '${speedRaw}' (expected a positive number)`);
    }
    // Static key wins; otherwise mint a per-run JWT from the SSH key (the
    // GLM-TTS-Server flow: scripts/make_token.py in that repo)
    const keyPath = argOf("key-path") ?? str(openai.keyPath);
    const token =
      argOf("key") ?? str(openai.apiKey) ?? (keyPath ? mintJwt(keyPath) : undefined);
    return {
      provider,
      baseUrl: baseUrl.replace(/\/+$/, ""),
      model,
      voice: argOf("voice") ?? str(openai.voice),
      speed,
      token,
    };
  }
  throw new Error(`unknown TTS provider '${provider}' (expected 'edge' or 'openai')`);
};

const config = resolveConfig();

// --- Synthesizers ----------------------------------------------------------

// Created lazily on first use: setMetadata fetches the voice list, so an
// openai-provider run must not pay (or fail on) that network call.
let edgeClient: MsEdgeTTS | undefined;

const synthesizeEdge = async (text: string, file: string, cfg: EdgeConfig) => {
  if (!edgeClient) {
    edgeClient = new MsEdgeTTS();
    await edgeClient.setMetadata(
      cfg.voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );
  }
  const { audioStream } = edgeClient.toStream(text, { rate: cfg.rate });
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(file);
    audioStream.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
    audioStream.on("error", reject);
  });
};

const synthesizeOpenAI = async (text: string, file: string, cfg: OpenAIConfig) => {
  // Local GPU inference can be slow; 2min per line is generous.
  // The browser-ish User-Agent is required: RunPod's proxy sits behind
  // Cloudflare bot protection and 403s non-browser agents (error 1010).
  const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (tts.mts)",
      ...(cfg.token ? { authorization: `Bearer ${cfg.token}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      input: text,
      voice: cfg.voice,
      response_format: "mp3",
      speed: cfg.speed,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 500);
    throw new Error(`TTS request failed: HTTP ${res.status} ${body}`);
  }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
};

const synthesize = (text: string, file: string) =>
  config.provider === "edge"
    ? synthesizeEdge(text, file, config)
    : synthesizeOpenAI(text, file, config);

// --- Cache -----------------------------------------------------------------

const lines = parseNarration(
  fs.readFileSync(path.join("public", episode, "narration.toml"), "utf8"),
);

const outDir = path.join("public", episode, "voiceover");
fs.mkdirSync(outDir, { recursive: true });

const cachePath = path.join(outDir, ".tts-cache.json");
const cache: Record<string, string> = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

// Everything that changes the audio goes into the hash (never the apiKey)
const hashOf = (text: string) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        provider: config.provider,
        voice: config.voice,
        text,
        ...(config.provider === "edge"
          ? { rate: config.rate }
          : { baseUrl: config.baseUrl, model: config.model, speed: config.speed }),
      }),
    )
    .digest("hex")
    .slice(0, 16);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// TTS endpoints are occasionally unstable - retry with backoff per line, and
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
        console.log(
          `FAIL   ${line.fullId} (${MAX_ATTEMPTS} attempts): ${err instanceof Error ? err.message : err}`,
        );
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
