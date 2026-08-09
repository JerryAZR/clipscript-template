import { Composition, Folder } from "remotion";
import { CodeHikeDemo } from "./CodeHikeDemo";

import { calculateMetadata } from "./calculate-metadata/calculate-metadata";
import { schema } from "./calculate-metadata/schema";
import { defaultTheme } from "./calculate-metadata/theme";
import { EPISODE_FPS, episodeCalculateMetadata, episodeSchema } from "./engine/calculate-metadata";
import { Episode } from "./engine/Episode";
import { listEpisodes } from "./episodes/registry";

// Composition ids cannot contain slashes, so nested episode names
// ("examples/showcase") render as "examples-showcase"
const compositionId = (episode: string) => episode.replaceAll("/", "-");

const episodeDefaults = (episode: string) => ({
  episode,
  theme: defaultTheme,
  timeline: null,
  themeColors: null,
  highlightedCode: null,
});

const EpisodeComposition = ({ episode }: { episode: string }) => (
  <Composition
    id={compositionId(episode)}
    component={Episode}
    defaultProps={episodeDefaults(episode)}
    fps={EPISODE_FPS}
    width={1920}
    height={1080}
    calculateMetadata={episodeCalculateMetadata}
    schema={episodeSchema}
  />
);

export const RemotionRoot = () => {
  const examples = listEpisodes().filter((name) => name.startsWith("examples/"));
  const userEpisodes = listEpisodes().filter((name) => !name.startsWith("examples/"));
  return (
    <>
      <Folder name="examples">
        {/* Hand-rolled Code Hike token transitions, outside the clip engine */}
        <Composition
          id="codehike-demo"
          component={CodeHikeDemo}
          defaultProps={{
            steps: null,
            themeColors: null,
            episode: "codehike-demo",
            theme: defaultTheme,
            codeWidth: null,
            width: {
              type: "auto",
            },
          }}
          fps={30}
          height={1080}
          calculateMetadata={calculateMetadata}
          schema={schema}
        />
        {examples.map((name) => (
          <EpisodeComposition key={name} episode={name} />
        ))}
      </Folder>
      {/* One composition per registered user episode, so Studio lists them */}
      {userEpisodes.map((name) => (
        <EpisodeComposition key={name} episode={name} />
      ))}
    </>
  );
};
