import {Config} from '@remotion/cli/config';
import {offlineLighterOverride} from './src/calculate-metadata/webpack-override';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Full renders stalled once on a font fetch under concurrency; stills never
// hit it. 60s instead of the 28s default (see doc/authoring-friction.md).
Config.setDelayRenderTimeoutInMilliseconds(60000);

// See src/calculate-metadata/webpack-override.ts - fully offline highlighting
Config.overrideWebpackConfig(offlineLighterOverride);
