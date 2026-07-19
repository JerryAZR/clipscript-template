import { Composition } from "remotion";
import { Main } from "./Main";

import { calculateMetadata } from "./calculate-metadata/calculate-metadata";
import { schema } from "./calculate-metadata/schema";
import { defaultTheme } from "./calculate-metadata/theme";
import { EPISODE_FPS, episodeCalculateMetadata, episodeSchema } from "./engine/calculate-metadata";
import { Episode } from "./engine/Episode";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
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
    </>
  );
};
