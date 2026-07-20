import { getThemeColors } from "@code-hike/lighter";
import { mix, readableColor } from "polished";
import React from "react";
import { z } from "zod";

export type ThemeColors = Awaited<ReturnType<typeof getThemeColors>>;

export const themeSchema = z.enum([
  "dark-plus",
  "dracula-soft",
  "dracula",
  "github-dark",
  "github-dark-dimmed",
  "github-light",
  "light-plus",
  "material-darker",
  "material-default",
  "material-lighter",
  "material-ocean",
  "material-palenight",
  "min-dark",
  "min-light",
  "monokai",
  "nord",
  "one-dark-pro",
  "poimandres",
  "slack-dark",
  "slack-ochin",
  "solarized-dark",
  "solarized-light",
]);

export type Theme = z.infer<typeof themeSchema>;

export const defaultTheme: Theme = "github-dark";

export const ThemeColorsContext = React.createContext<ThemeColors | null>(null);

export const useThemeColors = () => {
  const themeColors = React.useContext(ThemeColorsContext);
  if (!themeColors) {
    throw new Error("ThemeColorsContext not found");
  }

  return themeColors;
};

/**
 * The standard card background (foreground mixed over the theme background).
 * elevation 0.04 is the default card; 0.08 for cards stacked above other
 * content (overlays). Use this instead of re-deriving the mix per clip.
 */
export const useCardColor = (elevation = 0.04) => {
  const themeColors = useThemeColors();
  return mix(
    elevation,
    readableColor(themeColors.background),
    themeColors.background,
  );
};

/**
 * The theme accent (prompt markers, bullets, rings, underlines). One named
 * place so the convention is findable and changeable.
 */
export const useAccentColor = () => useThemeColors().editor.infoForeground;

/**
 * Dimmed/secondary text color: the editor foreground mixed toward a base
 * (the theme background by default; pass useCardColor() for text sitting on
 * a card). Use this instead of inventing a per-clip dimming recipe.
 */
export const useDimmedColor = (amount: number, base?: string) => {
  const themeColors = useThemeColors();
  return mix(amount, base ?? themeColors.background, themeColors.editor.foreground);
};

export const ThemeProvider = ({
  children,
  themeColors,
}: {
  readonly children: React.ReactNode;
  readonly themeColors: ThemeColors;
}) => {
  return (
    <ThemeColorsContext.Provider value={themeColors}>
      {children}
    </ThemeColorsContext.Provider>
  );
};
