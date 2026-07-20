import { Composition } from "remotion";
import { CodeHikeDemo } from "./CodeHikeDemo";

import { calculateMetadata } from "./calculate-metadata/calculate-metadata";
import { schema } from "./calculate-metadata/schema";
import { defaultTheme } from "./calculate-metadata/theme";
import { EPISODE_FPS, episodeCalculateMetadata, episodeSchema } from "./engine/calculate-metadata";
import { Episode } from "./engine/Episode";
import { listEpisodes } from "./episodes/registry";

export const RemotionRoot = () => {
  return (
    <>
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
      <Composition
        id="Episode"
        component={Episode}
        defaultProps={{
          episode: "demo",
          theme: defaultTheme,
          timeline: null,
          themeColors: null,
          highlightedCode: null,
        }}
        fps={EPISODE_FPS}
        width={1920}
        height={1080}
        calculateMetadata={episodeCalculateMetadata}
        schema={episodeSchema}
      />
      {/* One composition per registered episode, so Studio lists them */}
      {listEpisodes().map((name) => (
        <Composition
          key={name}
          id={name}
          component={Episode}
          defaultProps={{
            episode: name,
            theme: defaultTheme,
            timeline: null,
            themeColors: null,
            highlightedCode: null,
          }}
          fps={EPISODE_FPS}
          width={1920}
          height={1080}
          calculateMetadata={episodeCalculateMetadata}
          schema={episodeSchema}
        />
      ))}
    </>
  );
};
