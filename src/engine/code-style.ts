import { fontFamily } from "../font";

/**
 * Single source of truth for code rendering in the engine. Scroll math reads
 * lineHeightPx from here, so it can never drift from the rendered style
 * (the bevy project hardcoded LINE_HEIGHT = 28 separately - it drifted).
 */
export const codeFontFamily = fontFamily;
export const codeFontSize = 24;
export const codeLineHeight = 1.5;
export const lineHeightPx = codeFontSize * codeLineHeight;
export const codeTabSize = 3;

export const cardPadding = 16;
export const cardRadius = 12;

/** Filename tab row height: vertical padding + small text line */
export const codeTabHeight = cardPadding + codeFontSize * 0.7 * codeLineHeight;
