import type { CSSProperties } from "react";
import { fontFamily } from "../font";
import type { Rect } from "./types";

/**
 * Named text-style presets for clip content (think Word's Heading 1/Body).
 * Pick the nearest preset instead of inventing a size - a 30px here and a
 * 34px there reads as sloppy when two clips share a frame. Presets are
 * color-free: colors come from useThemeColors() at the use site.
 */
export const textStyles = {
  /** Full-screen display type (openers, chapter numbers, countdown digits) */
  display: { fontFamily, fontSize: 128, fontWeight: 700, lineHeight: 1.1 },
  /** Full-pane title cards */
  heading1: { fontFamily, fontSize: 72, fontWeight: 700, lineHeight: 1.2 },
  /** Section headings inside a pane */
  heading2: { fontFamily, fontSize: 48, fontWeight: 700, lineHeight: 1.2 },
  /** Card titles (overlay cards, small headings) */
  heading3: { fontFamily, fontSize: 36, fontWeight: 700, lineHeight: 1.3 },
  /** Secondary line under display/heading1 */
  subtitle: { fontFamily, fontSize: 36, fontWeight: 400, lineHeight: 1.3 },
  /** Emphasized primary content (progress items, big list entries) */
  bodyLarge: { fontFamily, fontSize: 40, fontWeight: 600, lineHeight: 1.4 },
  /** Default content text */
  body: { fontFamily, fontSize: 32, fontWeight: 500, lineHeight: 1.4 },
  /** Nested/secondary content */
  bodySmall: { fontFamily, fontSize: 26, fontWeight: 400, lineHeight: 1.4 },
  /** Hints, tab-ish labels */
  caption: { fontFamily, fontSize: 24, fontWeight: 400, lineHeight: 1.4 },
} satisfies Record<string, CSSProperties>;

export type TextStyleName = keyof typeof textStyles;

/**
 * Standard pane rects (the layout counterpart of textStyles). Pick the
 * nearest preset; use a custom rect only as an explicit, scene-specific
 * choice (inset cards, asymmetric layouts).
 */
export const rects = {
  /** Full-bleed: title pages, full-frame backgrounds */
  full: { x: 0, y: 0, w: "100%", h: "100%" },
  /** The standard single window (file, terminal, video) */
  large: { x: "10%", y: "10%", w: "80%", h: "80%" },
  /** Smaller centered window with more breathing room */
  medium: { x: "20%", y: "20%", w: "60%", h: "60%" },
  /** Left half of a side-by-side pair (comparisons, source + output) */
  splitLeft: { x: "5%", y: "10%", w: "44%", h: "80%" },
  /** Right half of a side-by-side pair */
  splitRight: { x: "51%", y: "10%", w: "44%", h: "80%" },
} satisfies Record<string, Rect>;

export type RectName = keyof typeof rects;

/** Height of the pane title area rendered by ClipPane when clip.paneTitle is set */
export const TITLE_BAR_HEIGHT = 88;

/** The standard full-pane centered container most text clips start from */
export const centeredPaneStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};
