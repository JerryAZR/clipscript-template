# Subtitles and voiceover

## subtitles.toml

One flat `[[lines]]` list per episode at `public/<episode>/subtitles.toml`. A
line's `text` is both what the subtitle band shows and (via pronunciation
replacement) what TTS speaks:

```toml
# Comments organize topics for reviewers
[[lines]]
id = "intro.first"
text = "Welcome to the episode."

[[lines]]
id = "intro.second"
text = "One line per sentence, one point per line."
```

- `id` is used verbatim in storyboards (`startAt`/`endAt`). Dotted prefixes
  (`intro.*`, `code.*`) are a convention for readability, not engine semantics.
- Keep lines short and single-pointed - they are the pacing unit of the video.
- Text lives ONLY here. Storyboards reference ids, never text.
- `subtitle = false` hides a line from the subtitle band (title beats).

## Voiceover

```bash
npx tsx scripts/tts.mts --episode <name>   # flags override tts.config.toml
```

- One mp3 per line at `public/<episode>/voiceover/<lineId>.mp3` (gitignored).
- Content-hash cached (provider + voice + rate/speed + text): only changed
  lines re-synthesize. 3 attempts per line with backoff; failures are
  reported at the end (exit 1) and re-running resumes from the cache.

### Providers

Defaults live in `tts.config.toml` (gitignored; copy
`tts.config.example.toml`). CLI flags (`--provider/--voice/--rate/--url/
--model/--speed/--key`) override the file for one-off runs.

- **edge** (default) - free, no API key. `--voice en-US-AriaNeural`,
  `--rate +0%`. Browse voices: `npx msedge-tts --voices` or the Azure voice
  list. Chinese voiceover works well with `zh-CN-YunxiNeural`.
- **openai** - any OpenAI-compatible endpoint (`POST <baseUrl>/audio/speech`,
  e.g. a local GLM-TTS-Server). Needs `baseUrl` + `model`; `voice` and
  `speed` are optional. Auth: `apiKey` (static Bearer token) or `keyPath`
  (SSH private key; a short-lived JWT is minted per run, for
  GLM-TTS-Server-style public-key JWT auth). A browser-like User-Agent is
  sent automatically - RunPod's proxy 403s non-browser agents (Cloudflare).

## Durations

At load time the engine measures each line's real duration from its mp3
(Mediabunny). Lines without an mp3 get an estimate (~15 chars/sec) and stay
silent - episodes render fine before TTS runs, and timing tightens
automatically once voiceover exists.

## Pronunciation

Subtitle text is for display; TTS speaks a replaced version of it. Layers,
later wins, plain substring replace with longest key first:

1. Built-in symbol defaults (brackets, quotes, `::`, ...; see
   `src/engine/pronunciation.ts`)
2. `[pronunciation]` in `tts.config.toml` (+ `useDefaults = false` kill switch)
3. `public/<episode>/pronunciation.toml` (flat TOML table)
4. A line's own table in subtitles.toml: `pronunciation = { "ECS" = "E-C-S" }`

The cache hash covers the spoken text, so map edits re-synthesize exactly the
affected lines. When spoken differs from displayed, tts.mts logs the spoken
form. Substring matching can over-fire (`"DOTS"` hits `"DOTSIZE"`) - keep
keys specific.

## Replacing the pipeline

The engine only cares that `voiceover/<lineId>.mp3` files exist. For a TTS
backend that is not OpenAI-compatible, replace `scripts/tts.mts` with your
own pipeline writing the same files - nothing else changes.
