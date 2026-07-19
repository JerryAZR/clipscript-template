import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Local fonts (public/fonts/) instead of Google Fonts: no network
// dependency at render time, so renders are reproducible offline.
export const fontFamily = "Fira Code";

const fontReady = Promise.all([
  loadFont({
    family: fontFamily,
    url: staticFile("fonts/FiraCode-Regular.ttf"),
    weight: "400",
  }),
  loadFont({
    family: fontFamily,
    url: staticFile("fonts/FiraCode-Bold.ttf"),
    weight: "700",
  }),
]).then(() => undefined);

export const waitUntilDone = () => fontReady;

export const fontSize = 40;
export const tabSize = 3;
export const horizontalPadding = 60;
export const verticalPadding = 84;
