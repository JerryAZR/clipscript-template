---
name: clip-development
description: Writing custom clip types for the clip engine - component contract, conventions, registration
metadata:
  tags: clips, components, engine, development, custom
---

## When to use

Use this skill when writing a new clip type (a custom visual block for episodes), or changing how an existing clip renders. For engine internals (timeline, state resolver, transitions machinery), load the `engine-internals` skill instead.

## The clip contract

A clip component is `React.FC<{ clip: TimelineClip<T> }>` where `T` is the clip's def type. It renders inside a `<Sequence>` sized by the clip's `rect`, so `useCurrentFrame()` is clip-local and the component should fill 100%x100% of its pane. The clip arrives **fully resolved**: absolute `startFrame`/`endFrame`, inherited fields applied. Components never see subtitle lines, stores, or other clips.

Resolution guarantees you can rely on: `rect` is always set (ClipPane throws otherwise); code clips always have chain carry-in steps prepended, `scrollFrom`, and `filename` (the state resolver fills or throws). Authoring-optional fields stay optional in the type - trust the guarantees, don't re-default them.

A complete minimal clip:

```tsx
import { useThemeColors } from "../../calculate-metadata/theme";
import { centeredPaneStyle, textStyles } from "../clip-style";
import type { ClipComponent, OverlayClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

export const OverlayClip: ClipComponent<OverlayClipDef> = ({ clip }) => {
  // Content choreography starts after the renderer-owned pane transition
  const frame = useClipFrame(clip.transitionIn);
  const themeColors = useThemeColors();

  return (
    <div style={{
      ...centeredPaneStyle,
      ...textStyles.body,
      color: themeColors.editor.foreground,
    }}>
      {clip.text}
    </div>
  );
};
```

## Adding a clip type

1. Add the def to the `StoryboardClip` union in `src/engine/types.ts` (`ClipCommon & { type: "myclip", ... }`).
2. Write the component in `src/engine/clips/MyClip.tsx`.
3. Register it in `src/engine/clips/index.ts` (`sharedClipComponents`), or in an episode's `clipComponents` (in `src/episodes/registry.ts`) for episode-specific clips.
4. Exercise it in the kitchen-sink fixture (`tests/fixtures/kitchen-sink/storyboard.ts`) and add a smoke assertion if it adds framework behavior.

## Conventions (all enforced by review)

- **Frame-driven only.** No CSS transitions/animations, no WAAPI, no wall-clock time, no `Math.random`.
- **Renderer owns transitions.** The pane's enter/exit fade is the renderer's. Clip content animates after `useClipFrame(clip.transitionIn)` - never re-animate the entrance.
- **Theme colors.** `useThemeColors()` + `polished` (`mix`, `readableColor`, `rgba`, `darken`). No hardcoded colors except universal conventions (diff red/green, terminal traffic lights). Card backgrounds: `useCardColor()` (0.04 elevation; 0.08 for cards above other content).
- **Text styles.** Use the presets in `src/engine/clip-style.ts` (`textStyles.display/heading1-3/subtitle/bodyLarge/body/bodySmall/caption`) instead of inventing sizes - spread and override (`{...textStyles.body, color}`). Code metrics stay in `src/engine/code-style.ts`.
- **Fail loudly** on missing/invalid config, naming the clip id.
- **Keep layout stable** if the clip type will ever be chained or transitioned - token positions are measured, geometry shifts show as jumps.
- **Pure logic first.** Frame math (like `terminalLinesAt`) goes in an exported pure function with vitest coverage; the component is a thin shell.

## References

- Writing Code Hike annotation handlers (for code-like clips) - [rules/annotation-handlers.md](rules/annotation-handlers.md)
- Porting RVE template recipes into clips - [rules/rve-recipes.md](rules/rve-recipes.md)
- Existing clips to imitate: `src/engine/clips/OverlayClip.tsx` (simplest), `TerminalClip.tsx` (pure-math pattern), `CodeClip.tsx` (complex)
