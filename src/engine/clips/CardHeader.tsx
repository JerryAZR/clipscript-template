import { rgba, readableColor } from "polished";
import type { ReactNode } from "react";
import {
  useCardColor,
  useThemeColors,
} from "../../calculate-metadata/theme";
import {
  cardPadding,
  codeFontSize,
  codeTabHeight,
} from "../code-style";

/**
 * Window-chrome header band for card clips (code, terminal): a slightly
 * elevated band with a divider below it, GNOME/macOS editor style. Content
 * is up to the clip (centered filename, traffic lights + title, ...).
 */
export const CardHeader = ({ children }: { children: ReactNode }) => {
  const themeColors = useThemeColors();
  const band = useCardColor(0.07);
  const divider = rgba(readableColor(themeColors.background), 0.08);

  return (
    <div
      style={{
        height: codeTabHeight,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        padding: `0 ${cardPadding}px`,
        backgroundColor: band,
        borderBottom: `1px solid ${divider}`,
        fontSize: codeFontSize * 0.7,
        color: themeColors.editor.foreground,
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
};
