// Repro-only bundle entry for tests/font-load/font-load.test.ts. Two minimal
// compositions around a font URL that never responds:
//
// - font-load-vulnerable mirrors src/font.ts's loadFont() pattern: the
//   delayRender handle is held until FontFace.load() settles, so a wedged
//   font load hard-fails the whole render.
// - font-load-bounded drives the production loader (src/font.ts
//   createFontLoader) with the same wedged URL: the bounded calculateMetadata
//   gate expires, and the render continues with a fallback font and a loud
//   warning.
//
// The URL arrives via input props (the test's hanging server picks a free
// port at runtime), so the vulnerable variant calls loadFont() during the
// render pass instead of at module scope like production - the machinery
// under test (an unbounded delayRender handle held by the font load) is
// identical either way.
//
// Never loaded by Studio.
import { loadFont } from "@remotion/fonts";
import { Composition, registerRoot } from "remotion";
import type { CSSProperties } from "react";
import { createFontLoader, fontFamily } from "../../src/font";

type ReproProps = { fontUrl: string };

const REPRO_FONT_FAMILY = fontFamily;
const BOUNDED_WAIT_MS = 1500;
const FALLBACK_WARNING =
  "[font-load-repro] font not loaded; continuing with fallback font";

const container: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0d1117",
  color: "#e6edf3",
  fontSize: 48,
  fontFamily: `${REPRO_FONT_FAMILY}, monospace`,
};

const VulnerableFont = ({ fontUrl }: ReproProps) => {
  loadFont({ family: REPRO_FONT_FAMILY, url: fontUrl, weight: "400" });
  return <div style={container}>Hello</div>;
};

/** One loader per page, keyed by first use - mirrors src/font.ts's
 *  module-scope singleton, but parameterized by the prop-driven URL. */
let loader: ReturnType<typeof createFontLoader> | null = null;
const getLoader = (fontUrl: string) =>
  (loader ??= createFontLoader(
    [{ url: fontUrl, weight: "400" }],
    BOUNDED_WAIT_MS,
  ));

const BoundedFont = ({ fontUrl }: ReproProps) => {
  // Kick the load here too: each render page is a fresh module instance and
  // calculateMetadata does not necessarily re-run in it. If the load never
  // settled, warn - deterministic signal for the test via onBrowserLog.
  if (!getLoader(fontUrl).isSettled()) {
    console.warn(FALLBACK_WARNING);
  }
  return <div style={container}>Hello</div>;
};

const ReproRoot = () => (
  <>
    <Composition
      id="font-load-vulnerable"
      component={VulnerableFont}
      durationInFrames={30}
      fps={30}
      width={320}
      height={180}
      defaultProps={{ fontUrl: "http://127.0.0.1:1/unused.ttf" }}
    />
    <Composition
      id="font-load-bounded"
      component={BoundedFont}
      durationInFrames={30}
      fps={30}
      width={320}
      height={180}
      defaultProps={{ fontUrl: "http://127.0.0.1:1/unused.ttf" }}
      calculateMetadata={async ({ props }) => {
        await getLoader(props.fontUrl).waitUntilDone();
        return { props };
      }}
    />
  </>
);

registerRoot(ReproRoot);
