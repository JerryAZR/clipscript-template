import { mix, readableColor } from "polished";
import { useThemeColors } from "../calculate-metadata/theme";

// Opt-in: render above <CodeTransition> in Main.tsx to show the current
// step's file name (each step's `meta` is set to its file name by
// process-snippet.ts). Kept outside <Pre> on purpose: it is not part of
// the token-transition snapshot, so it swaps instantly between steps.
export const FileName = ({ meta }: { readonly meta: string }) => {
  const themeColors = useThemeColors();

  const color = readableColor(themeColors.background);
  const backgroundColor = mix(0.08, color, themeColors.background);

  return (
    <div
      style={{
        backgroundColor,
        color: themeColors.editor.foreground,
        opacity: 0.8,
        padding: "0.25rem 1rem",
        marginBottom: "0.5rem",
        width: "fit-content",
        fontSize: "0.7em",
        userSelect: "none",
      }}
    >
      {meta}
    </div>
  );
};
