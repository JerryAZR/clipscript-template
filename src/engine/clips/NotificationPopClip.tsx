import { readableColor, rgba } from "polished";
import { interpolate, spring, useVideoConfig } from "remotion";
import {
  useAccentColor,
  useCardColor,
  useDimmedColor,
  useThemeColors,
} from "../../calculate-metadata/theme";
import { textStyles } from "../clip-style";
import { cardRadius } from "../code-style";
import type { ClipComponent, NotificationPopClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";
import { itemStartFrames } from "./AnimatedListClip";

/**
 * Notification toasts sliding in from the right, one after another (spring
 * slide + fade, staggered) - for "tests pass", "commit landed", "CI green"
 * beats. Port of the RVE notification-pop template: the heading/background
 * are dropped (the pane owns chrome), colors/fonts come from the theme, and
 * stagger timing reuses itemStartFrames so every toast appears even when the
 * clip window is too short for the requested stagger.
 */
export const NotificationPopClip: ClipComponent<NotificationPopClipDef> = ({
  clip,
}) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - only per-toast reveals are animated here
  const frame = useClipFrame(clip.transitionIn);
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const durationFrames = clip.endFrame - clip.startFrame;
  const starts = itemStartFrames(
    clip.notifications.length,
    clip.stagger ?? 20,
    durationFrames,
  );

  const accent = useAccentColor();
  const cardBackground = useCardColor(0.08);
  const foreground = themeColors.editor.foreground;
  const bodyColor = useDimmedColor(0.25, cardBackground);
  const borderColor = rgba(foreground, 0.15);
  const shadowColor = rgba(themeColors.background, 0.5);
  // Red count badge: the universal notification convention, same red the
  // diff annotations use for removed lines (documented universal convention)
  const badgeColor = "#f85149";
  const badgeTextColor = readableColor(badgeColor);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 20,
        padding: "0 64px",
        overflow: "hidden",
      }}
    >
      {clip.notifications.map((notif, i) => {
        // spring() handles negative frames, but clamp anyway so the start
        // offset stays an explicit part of the math
        const progress = spring({
          frame: Math.max(0, frame - starts[i]),
          fps,
          from: 0,
          to: 1,
          config: { damping: 14, stiffness: 180, mass: 0.6 },
        });
        const opacity = interpolate(progress, [0, 0.6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateX = interpolate(progress, [0, 1], [300, 0]);

        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              width: 480,
              boxSizing: "border-box",
              padding: "20px 24px",
              backgroundColor: cardBackground,
              border: `1px solid ${borderColor}`,
              borderRadius: cardRadius,
              boxShadow: `0 8px 32px ${shadowColor}`,
              color: foreground,
              opacity,
              transform: `translateX(${translateX}px)`,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: notif.color ?? accent,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={textStyles.body}>{notif.title}</div>
              {notif.body ? (
                <div
                  style={{
                    ...textStyles.bodySmall,
                    color: bodyColor,
                    marginTop: 4,
                  }}
                >
                  {notif.body}
                </div>
              ) : null}
            </div>
            {notif.badge !== undefined ? (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  right: -12,
                  minWidth: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: badgeColor,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: badgeTextColor,
                  ...textStyles.caption,
                  fontWeight: 700,
                }}
              >
                {notif.badge}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
