import {Config} from '@remotion/cli/config';
import {offlineLighterOverride} from './src/calculate-metadata/webpack-override';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// See src/calculate-metadata/webpack-override.ts - fully offline highlighting
Config.overrideWebpackConfig(offlineLighterOverride);
