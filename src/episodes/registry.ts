import type { ClipComponent, Storyboard } from "../engine/types";
import { storyboard as codeTutorial } from "../examples/code-tutorial/storyboard";
import { storyboard as clipGallery } from "../examples/clip-gallery/storyboard";
import { storyboard as diffTool } from "../examples/diff-tool/storyboard";
import { storyboard as showcase } from "../examples/showcase/storyboard";

export type EpisodeModule = {
  storyboard: Storyboard;
  /** Episode-specific clips, merged over the shared registry at render time */
  clipComponents?: Record<string, ClipComponent>;
};

// Studio-visible episodes. The examples/* entries are the template's demo
// videos; a fresh copy replaces them with the user's own episodes.
const episodes: Record<string, EpisodeModule> = {
  "examples/showcase": { storyboard: showcase },
  "examples/code-tutorial": { storyboard: codeTutorial },
  "examples/clip-gallery": { storyboard: clipGallery },
  "examples/diff-tool": { storyboard: diffTool },
};

// Test fixtures (registered from tests/, e.g. the smoke suite's kitchen
// sink). Loadable by name but never listed in Studio.
const internalEpisodes: Record<string, EpisodeModule> = {};

export const registerInternalEpisode = (name: string, module: EpisodeModule) => {
  internalEpisodes[name] = module;
};

/** Registered Studio-visible episode names (Root registers one composition per name) */
export const listEpisodes = () => Object.keys(episodes);

export const getEpisode = (episode: string): EpisodeModule => {
  const module = episodes[episode] ?? internalEpisodes[episode];
  if (!module) {
    throw new Error(
      `Unknown episode '${episode}'. Registered episodes: ${[...Object.keys(episodes), ...Object.keys(internalEpisodes)].join(", ")}`,
    );
  }
  return module;
};
