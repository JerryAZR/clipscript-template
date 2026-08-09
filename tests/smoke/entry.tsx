// Smoke-test-only bundle entry: registers the kitchen-sink fixture and
// exposes it as a composition for renderStill. Never loaded by Studio.
import { Composition, registerRoot } from "remotion";
import { defaultTheme } from "../../src/calculate-metadata/theme";
import {
  EPISODE_FPS,
  episodeCalculateMetadata,
  episodeSchema,
} from "../../src/engine/calculate-metadata";
import { Episode } from "../../src/engine/Episode";
import "../fixtures/kitchen-sink/register";

const SmokeRoot = () => (
  <Composition
    id="kitchen-sink"
    component={Episode}
    defaultProps={{
      episode: "kitchen-sink",
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
);

registerRoot(SmokeRoot);
