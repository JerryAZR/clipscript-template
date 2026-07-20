import { mix } from "polished";
import { useAccentColor, useCardColor, useThemeColors } from "../../calculate-metadata/theme";
import { CardHeader } from "./CardHeader";
import {
  cardPadding,
  cardRadius,
  codeFontFamily,
  codeFontSize,
  codeLineHeight,
} from "../code-style";
import type { ClipComponent, TerminalClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

export type TerminalStep = TerminalClipDef["steps"][number];

export type TerminalConfig = {
  /** Characters per frame (default 1) */
  typeSpeed?: number;
  /** Frames to pause after a command is fully typed (default 15) */
  pauseAfterCommand?: number;
  /** Frames between output lines appearing (default 10) */
  outputLineDelay?: number;
};

export type TerminalLine = {
  /**
   * "typed" while the command is still being typed, "command" once fully
   * typed, "output" for output lines. The prompt itself is not a separate
   * line - it rides along in the `prompt` field of typed/command lines.
   */
  kind: "typed" | "command" | "output";
  /** Prompt prefix on typed/command lines (e.g. "~/app $ "), "" on output */
  prompt: string;
  text: string;
  /** True on the line the block cursor sits on (always the last line) */
  cursor: boolean;
};

/**
 * Pure frame math: which terminal lines are visible at `frame`. Steps run in
 * order - type the command at typeSpeed chars/frame, pause, reveal output one
 * line per outputLineDelay, then move to the next step. Deterministic: no
 * randomness, no time, same frame always yields the same lines.
 */
export const terminalLinesAt = (
  steps: TerminalStep[],
  config: TerminalConfig,
  frame: number,
): TerminalLine[] => {
  const typeSpeed = config.typeSpeed ?? 1;
  const pauseAfterCommand = config.pauseAfterCommand ?? 15;
  const outputLineDelay = config.outputLineDelay ?? 10;

  const lines: TerminalLine[] = [];
  let remaining = Math.max(0, Math.floor(frame));

  for (const step of steps) {
    const prompt = `${step.cwd ? `${step.cwd} ` : ""}$ `;
    const output = step.output ?? [];
    const commandFrames = Math.max(1, Math.ceil(step.command.length / typeSpeed));
    const stepFrames =
      commandFrames + pauseAfterCommand + output.length * outputLineDelay;

    if (remaining >= stepFrames) {
      // Whole step is done, keep its lines visible and move on
      lines.push({ kind: "command", prompt, text: step.command, cursor: false });
      for (const text of output) {
        lines.push({ kind: "output", prompt: "", text, cursor: false });
      }
      remaining -= stepFrames;
      continue;
    }

    // The playhead is inside this step
    if (remaining < commandFrames) {
      const typedChars = Math.min(
        step.command.length,
        Math.floor(remaining * typeSpeed),
      );
      lines.push({
        kind: "typed",
        prompt,
        text: step.command.slice(0, typedChars),
        cursor: false,
      });
      break;
    }

    lines.push({ kind: "command", prompt, text: step.command, cursor: false });
    remaining -= commandFrames;

    if (remaining < pauseAfterCommand) {
      break;
    }
    remaining -= pauseAfterCommand;

    const shown = Math.min(output.length, Math.floor(remaining / outputLineDelay));
    for (let i = 0; i < shown; i++) {
      lines.push({ kind: "output", prompt: "", text: output[i], cursor: false });
    }
    break;
  }

  // The cursor sits on the last visible line - while typing, during the
  // pause, on freshly revealed output, and after everything is done
  if (lines.length > 0) {
    lines[lines.length - 1].cursor = true;
  }
  return lines;
};

// Mac traffic lights live in CardHeader (shared window chrome)

export const TerminalClip: ClipComponent<TerminalClipDef> = ({ clip }) => {
  const frame = useClipFrame(clip.transitionIn);
  const themeColors = useThemeColors();

  if (clip.steps.length === 0) {
    throw new Error(`clip '${clip.id}': terminal clip has no steps`);
  }

  const lines = terminalLinesAt(clip.steps, clip, frame);
  const showCursor = clip.showCursor ?? true;
  const blinkOn = Math.floor(frame / 15) % 2 === 0;

  const cardBackground = useCardColor();
  const textColor = themeColors.editor.foreground;
  const outputColor = mix(0.4, cardBackground, textColor);
  const promptColor = useAccentColor();

  const title = clip.steps.find((step) => step.cwd)?.cwd ?? "terminal";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: cardBackground,
        borderRadius: cardRadius,
        overflow: "hidden",
        fontFamily: codeFontFamily,
        fontSize: codeFontSize,
        lineHeight: codeLineHeight,
      }}
    >
      <CardHeader title={title} icon="terminal" />
      <div style={{ flex: 1, overflow: "hidden", padding: `0 ${cardPadding}px` }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              whiteSpace: "pre",
              color: line.kind === "output" ? outputColor : textColor,
            }}
          >
            {line.kind !== "output" ? (
              <span style={{ color: promptColor }}>{line.prompt}</span>
            ) : null}
            {line.text}
            {showCursor && line.cursor ? (
              <span
                style={{
                  display: "inline-block",
                  width: "0.6em",
                  height: "1.1em",
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                  backgroundColor: textColor,
                  opacity: blinkOn ? 1 : 0,
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
