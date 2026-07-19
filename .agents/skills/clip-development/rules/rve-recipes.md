# Porting RVE template recipes

The `reactvideoeditor/remotion-templates` repo (81 single-file Remotion
animations) is a recipe book for clip ideas. The full inventory with
assessments (Will port / Niche / Not compatible) is in `doc/clip-inventory.md`.

## What the recipes are like

- Single-file, zero-prop demo components with hardcoded content/colors.
- Clean 10-30 line `spring`/`interpolate` recipes - that math is the value.
- NOT drop-in components: full-frame assumptions, no props, some broken
  (`next/image` imports, CSS keyframes, per-render `Math.random`).
- Reference checkout lives at `../remotion-templates` (sibling repo).

## Porting checklist

1. Extract the animation math (springs, keyframe curves, stagger patterns).
2. Rebuild as a `ClipComponent<T>` with a typed def - content comes from the
   storyboard, never hardcoded.
3. Make it theme-aware (`useThemeColors()` + `polished`).
4. Keep it frame-driven; RVE recipes already are (except ken-burns, which uses
   CSS keyframes - rewrite with `interpolate`).
5. Sizing: recipes assume full HD; scale to the clip's rect.

## Per-recipe notes

- **cinematic-title-intro** - title spring-in + growing underline; the episode
  opener upgrade.
- **animated-list** - staggered slide+fade+scale per item; drive items from config.
- **notification-pop** - toast stack; each toast `{ title, body, icon? }`.
- **text-highlight** - background bar sweeping under words sequentially.
- **chapter-title** - chapter number + extending rule lines.
- **progress-steps** - circles fill + connectors draw; bevy's `progress` covers
  this use case already.
- **stat-counter** - count-up numbers with comma formatting.
- **lower-third** - name/title bar with a 3-spring stagger (best recipe in the repo).
- **matrix-rain** - falling code background; already deterministic and
  `useVideoConfig`-sized.

## Licensing

MIT claimed in the repo README (no LICENSE file). Port recipes, don't copy
files wholesale, and keep the attribution header from the source file.
