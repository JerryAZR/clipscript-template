import type { WebpackOverrideFn } from "@remotion/bundler";

// @code-hike/lighter's browser build fetches themes and grammars from
// lighter.codehike.org at render time. Alias to the node build instead:
// it loads the same files from its own dist/ via literal dynamic imports,
// which webpack bundles - fully offline highlighting. The node build's
// network fallback dynamically imports the "https" builtin; stub it out,
// the local-file path never touches it in the browser bundle.
//
// Used by remotion.config.ts (CLI/Studio) and by the smoke test's
// programmatic bundle() call - keep them on the same override.
export const offlineLighterOverride: WebpackOverrideFn = (
  currentConfiguration,
) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...currentConfiguration.resolve?.alias,
        "@code-hike/lighter": "@code-hike/lighter/dist/index.esm.mjs",
      },
      fallback: {
        ...currentConfiguration.resolve?.fallback,
        https: false,
      },
    },
  };
};
