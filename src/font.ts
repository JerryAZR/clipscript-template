import { staticFile } from "remotion";

// Local fonts (public/fonts/) instead of Google Fonts: no network
// dependency at render time, so renders are reproducible offline.
export const fontFamily = "Fira Code";

type FontSpec = { url: string; weight: string };

/**
 * Load fonts via the FontFace API directly, fire-and-forget - NOT via
 * @remotion/fonts loadFont(), which holds a delayRender handle until the
 * font resolves. A font load that never settles (seen in real renders: the
 * bundle-server fetch stalling under concurrency; FontFace.load() wedging
 * in a fresh page on the frame-retry path) then times the handle out and
 * kills the whole render, with the font error masking the real one.
 * Characterized by tests/font-load.
 *
 * The load starts immediately (module scope below, like before); the
 * blocking gate for calculateMetadata is waitUntilDone(), and it is
 * bounded: if the load ever wedges, we proceed after the timeout with a
 * loud warning and code clips render in a fallback monospace for that tab
 * instead of the render dying.
 */
export const createFontLoader = (fonts: FontSpec[], timeoutMs = 15_000) => {
  // FontFace only exists in the browser; under Node (vitest) there is no
  // DOM to load fonts into, so resolve immediately.
  let settled = typeof FontFace === "undefined";
  const ready =
    typeof FontFace === "undefined"
      ? Promise.resolve()
      : Promise.all(
          fonts.map(({ url, weight }) =>
            new FontFace(fontFamily, `url('${url}') format('truetype')`, {
              weight,
            })
              .load()
              .then((face) => {
                document.fonts.add(face);
              })
              // A failed font means fallback glyphs, not a failed render
              .catch((err: unknown) => {
                console.warn(
                  `[font] ${fontFamily} (${weight}) failed to load; ` +
                    `continuing with fallback font`,
                  err,
                );
              }),
          ),
        ).then(() => {
          settled = true;
        });

  return {
    /** True once every font has loaded (or failed) - exposed for tests. */
    isSettled: () => settled,
    /** Bounded wait for calculateMetadata; loud warning on expiry. */
    waitUntilDone: () =>
      Promise.race([
        ready,
        new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
      ]).then(() => {
        if (!settled) {
          console.warn(
            `[font] ${fontFamily} did not finish loading within ` +
              `${timeoutMs}ms; continuing with fallback font`,
          );
        }
      }),
  };
};

const loader = createFontLoader([
  { url: staticFile("fonts/FiraCode-Regular.ttf"), weight: "400" },
  { url: staticFile("fonts/FiraCode-Bold.ttf"), weight: "700" },
]);

export const waitUntilDone = loader.waitUntilDone;

export const fontSize = 40;
export const tabSize = 3;
export const horizontalPadding = 60;
export const verticalPadding = 84;
