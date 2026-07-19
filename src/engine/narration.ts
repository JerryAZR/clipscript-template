import { staticFile } from "remotion";
import { parse } from "smol-toml";
import { z } from "zod";

export type NarrationLine = {
  fullId: string;
  text: string;
};

const narrationSchema = z.object({
  lines: z.array(z.object({ id: z.string(), text: z.string() })),
});

/**
 * Rough estimate used when a line has no voiceover audio yet (silent episodes).
 * Replaced by measured mp3 durations at this same seam once TTS lands.
 */
export const ESTIMATED_CHARS_PER_SECOND = 15;

export const estimateDurationFrames = (text: string, fps: number): number =>
  Math.max(fps, Math.round((text.length / ESTIMATED_CHARS_PER_SECOND) * fps));

export const parseNarration = (toml: string): NarrationLine[] => {
  const parsed = narrationSchema.parse(parse(toml));
  if (parsed.lines.length === 0) {
    throw new Error("narration.toml has no lines");
  }

  const seen = new Set<string>();
  return parsed.lines.map(({ id, text }) => {
    if (seen.has(id)) {
      throw new Error(`Duplicate narration line id '${id}'`);
    }
    seen.add(id);
    // Ids are used verbatim - dotted namespacing ("states.why-states-1")
    // is an authoring convention, not engine semantics
    return { fullId: id, text };
  });
};

export const loadNarration = async (
  episode: string,
): Promise<NarrationLine[]> => {
  const response = await fetch(staticFile(`${episode}/narration.toml`));
  if (!response.ok) {
    throw new Error(
      `narration.toml not found for episode '${episode}' (HTTP ${response.status})`,
    );
  }
  return parseNarration(await response.text());
};
