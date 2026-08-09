/**
 * Pronunciation: how subtitle text is spoken by TTS, without touching what is
 * displayed. A flat map of term -> spoken replacement, applied as plain
 * substring replacement, longest key first (so "--" beats "-"-shaped
 * prefixes). Substring matching can over-fire ("DOTS" would rewrite
 * "DOTSIZE") - keep keys specific.
 *
 * Layers, later wins: built-in defaults < tts.config.toml [pronunciation]
 * < public/<episode>/pronunciation.toml < a line's own pronunciation table.
 */

/** Symbol cleanup every episode wants: brackets and quotes are silence or
 *  worse ("open curly brace") when spoken. Disable with useDefaults = false. */
export const defaultPronunciation: Record<string, string> = {
  "--": " ",
  "::": " ",
  _: "-",
  "[": " ",
  "]": " ",
  "(": " ",
  ")": " ",
  "{": " ",
  "}": " ",
  '"': " ",
  "<": " ",
  ">": " ",
};

export const mergePronunciation = (
  ...layers: (Record<string, string> | undefined)[]
): Record<string, string> => Object.assign({}, ...layers);

export const applyPronunciation = (
  text: string,
  map: Record<string, string>,
): string => {
  let out = text;
  for (const src of Object.keys(map).sort((a, b) => b.length - a.length)) {
    out = out.split(src).join(map[src]);
  }
  return out.replace(/ {2,}/g, " ").trim();
};
