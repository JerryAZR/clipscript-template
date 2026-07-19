import { rgba, readableColor } from "polished";
import {
  useCardColor,
  useThemeColors,
} from "../../calculate-metadata/theme";
import {
  cardPadding,
  codeFontSize,
  codeTabHeight,
} from "../code-style";

// Mac traffic lights: a universal convention, not themeable
const trafficLights = ["#ff5f56", "#ffbd2e", "#27c93f"];
const LIGHTS_WIDTH = 3 * 14 + 2 * 8;

const FileIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      d="M4 1.5h5l3 3v10H4z"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
    <path d="M9 1.5v3h3" stroke="currentColor" strokeWidth={1.2} />
  </svg>
);

const TerminalIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      d="M3 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 12.5h5"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  </svg>
);

const icons = {
  file: FileIcon,
  terminal: TerminalIcon,
};

/**
 * Window-chrome header band for card clips (code, terminal): traffic lights
 * on the left, a centered icon + title, an elevated band with a divider
 * below - GNOME/macOS editor style.
 */
export const CardHeader = ({
  title,
  icon,
}: {
  title: string;
  icon?: keyof typeof icons;
}) => {
  const themeColors = useThemeColors();
  const band = useCardColor(0.07);
  const divider = rgba(readableColor(themeColors.background), 0.08);
  const Icon = icon ? icons[icon] : null;

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
      <span style={{ display: "flex", gap: 8, width: LIGHTS_WIDTH }}>
        {trafficLights.map((color) => (
          <span
            key={color}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: color,
            }}
          />
        ))}
      </span>
      <span
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontWeight: 600,
        }}
      >
        {Icon ? <Icon /> : null}
        {title}
      </span>
      {/* balance the traffic lights so the title is truly centered */}
      <span style={{ width: LIGHTS_WIDTH }} />
    </div>
  );
};
