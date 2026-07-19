# Narration and voiceover

## narration.toml

One flat `[[lines]]` list per episode at `public/<episode>/narration.toml`:

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

## Voiceover

```bash
npx tsx scripts/tts.mts --episode <name> [--voice en-US-AriaNeural] [--rate +0%]
```

- Uses edge-tts (free, no API key). One mp3 per line at
  `public/<episode>/voiceover/<lineId>.mp3` (gitignored).
- Content-hash cached (`voice|rate|text`): only changed lines re-synthesize.
  3 attempts per line with backoff; failures are reported at the end (exit 1)
  and re-running resumes from the cache.
- Browse voices: `npx msedge-tts --voices` or the Azure voice list. Chinese
  narration works well with `zh-CN-YunxiNeural`.

## Durations

At load time the engine measures each line's real duration from its mp3
(Mediabunny). Lines without an mp3 get an estimate (~15 chars/sec) and stay
silent - episodes render fine before TTS runs, and timing tightens
automatically once voiceover exists.

## Replacing the pipeline

When quality matters, replace `scripts/tts.mts` with your own TTS pipeline
(e.g. an OpenAI-compatible TTS API). The engine only cares that
`voiceover/<lineId>.mp3` files exist - nothing else changes.
