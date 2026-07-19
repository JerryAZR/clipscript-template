import type { ClipComponent, Storyboard } from "../engine/types";
import { storyboard as demo } from "./demo/storyboard";

export type EpisodeModule = {
  storyboard: Storyboard;
  /** Episode-specific clips, merged over the shared registry at render time */
  clipComponents?: Record<string, ClipComponent>;
};

const episodes: Record<string, EpisodeModule> = {
  demo: { storyboard: demo },
};

export const getEpisode = (episode: string): EpisodeModule => {
  const module = episodes[episode];
  if (!module) {
    throw new Error(
      `Unknown episode '${episode}'. Registered episodes: ${Object.keys(episodes).join(", ")}`,
    );
  }
  return module;
};
