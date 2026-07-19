import { rgba } from "polished";
import { Easing, interpolate } from "remotion";
import { useDimmedColor, useThemeColors } from "../../calculate-metadata/theme";
import { centeredPaneStyle, textStyles } from "../clip-style";
import { cardRadius } from "../code-style";
import { itemStartFrames } from "./AnimatedListClip";
import type {
  ClipComponent,
  ProgressClipDef,
  ProgressItem,
} from "../types";
import { useClipFrame } from "../useClipFrame";

type FlatItem = {
  text: string;
  status: ProgressItem["status"];
  isChild: boolean;
};

const flattenItems = (items: ProgressItem[]): FlatItem[] => {
  const result: FlatItem[] = [];
  for (const item of items) {
    result.push({ text: item.text, status: item.status, isChild: false });
    for (const child of item.children ?? []) {
      result.push({ text: child.text, status: child.status, isChild: true });
    }
  }
  return result;
};

const ITEM_STAGGER = 10;
const ITEM_FADE = 15;

/**
 * Progress checklist: an outline of the episode with done/current/todo
 * states. Done items are dimmed with a green check, the current item is
 * accented with a gently pulsing marker, todo items are dimmed with an
 * empty marker. The renderer owns the pane opacity transition - this clip
 * only staggers its items in once the pane has arrived.
 */
export const ProgressClip: ClipComponent<ProgressClipDef> = ({ clip }) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - no whole-pane opacity animation here
  const frame = useClipFrame(clip.transitionIn);
  const themeColors = useThemeColors();

  const foreground = themeColors.editor.foreground;
  const accent = themeColors.editor.infoForeground;
  const dim = useDimmedColor(0.55);
  // Universal diff-green convention, same value as the diff annotation
  const doneColor = "#3fb950";

  const flatItems = flattenItems(clip.items);
  // Same stagger guarantee as the list clip: compressed if the window is
  // short, so trailing items can never silently never-appear
  const starts = itemStartFrames(
    flatItems.length,
    ITEM_STAGGER,
    clip.endFrame - clip.startFrame,
  );

  return (
    <div
      style={{
        ...centeredPaneStyle,
        color: foreground,
      }}
    >
      {clip.title ? (
        <div style={{ ...textStyles.heading2, marginBottom: 40 }}>
          {clip.title}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {flatItems.map((item, i) => {
          const isDone = item.status === "done";
          const isCurrent = item.status === "current";

          const entrance = interpolate(
            frame,
            [starts[i], starts[i] + ITEM_FADE],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            },
          );
          const translateY = interpolate(entrance, [0, 1], [12, 0]);

          // Frame-driven breathing pulse on the current item's marker
          const pulse = isCurrent
            ? 1 + 0.15 * Math.abs(Math.sin(frame / 8))
            : 1;

          const icon = isDone ? "✓" : isCurrent ? "▶" : "○";
          const iconColor = isDone ? doneColor : isCurrent ? accent : dim;
          const textColor = isDone ? dim : isCurrent ? accent : dim;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: entrance,
                transform: `translateY(${translateY}px)`,
                marginTop: item.isChild ? 12 : i === 0 ? 0 : 28,
                padding: item.isChild ? "4px 16px 4px 56px" : "8px 16px",
                borderRadius: cardRadius,
                backgroundColor: isCurrent ? rgba(accent, 0.1) : "transparent",
              }}
            >
              <span
                style={{
                  fontSize: item.isChild ? 22 : 32,
                  color: iconColor,
                  width: 36,
                  textAlign: "center",
                  transform: `scale(${pulse})`,
                }}
              >
                {icon}
              </span>
              <span
                style={{
                  ...(item.isChild ? textStyles.bodySmall : textStyles.bodyLarge),
                  // undefined would wipe the preset's weight - only override when current
                  ...(isCurrent ? { fontWeight: 700 } : {}),
                  color: isCurrent ? foreground : textColor,
                  textDecoration: isDone ? "line-through" : "none",
                  textDecorationColor: dim,
                  textDecorationThickness: 2,
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
