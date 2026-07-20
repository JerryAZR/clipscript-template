import { getThemeColors } from "@code-hike/lighter";
import { measureText } from "@remotion/layout-utils";
import { HighlightedCode } from "codehike/code";
import { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import {
  fontFamily,
  fontSize,
  horizontalPadding,
  tabSize,
  waitUntilDone,
} from "../font";
import { Props } from "../CodeHikeDemo";
import { getFiles } from "./get-files";
import { processSnippet } from "./process-snippet";
import { schema } from "./schema";

export const calculateMetadata: CalculateMetadataFunction<
  Props & z.infer<typeof schema>
> = async ({ props }) => {
  const contents = await getFiles(props.episode);

  await waitUntilDone();
  const widthPerCharacter = measureText({
    text: "A",
    fontFamily,
    fontSize,
    validateFontIsLoaded: true,
  }).width;

  const defaultStepDuration = 90;

  const themeColors = await getThemeColors(props.theme);

  const twoSlashedCode: HighlightedCode[] = [];
  for (const snippet of contents) {
    twoSlashedCode.push(await processSnippet(snippet, props.theme));
  }

  // Measure the processed code (annotation comments and twoslash
  // directives removed), not the raw file contents
  const maxCharacters = Math.max(
    ...twoSlashedCode
      .map(({ code }) => code.split("\n"))
      .flat()
      .map((line) => line.replaceAll("\t", " ".repeat(tabSize)).length),
  );
  const codeWidth = widthPerCharacter * maxCharacters;

  // MP4 requires an even width
  const even = (value: number) => Math.ceil(value / 2) * 2;

  // "fixed" caps the code box so long lines wrap (with the word-wrap
  // handler); "auto" sizes the video to the longest line
  const width =
    props.width.type === "fixed"
      ? even(props.width.value)
      : Math.max(1080, even(codeWidth + horizontalPadding * 2));
  const effectiveCodeWidth =
    props.width.type === "fixed"
      ? Math.min(codeWidth, width - horizontalPadding * 2)
      : codeWidth;

  return {
    durationInFrames: contents.length * defaultStepDuration,
    width,
    props: {
      episode: props.episode,
      theme: props.theme,
      width: props.width,
      steps: twoSlashedCode,
      themeColors,
      codeWidth: effectiveCodeWidth,
    },
  };
};
