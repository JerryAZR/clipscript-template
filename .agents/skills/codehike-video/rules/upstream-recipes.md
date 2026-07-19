# Upstream Code Hike recipes

The `codehike` npm package ships no built-in handlers - everything on codehike.org/docs is a copy-paste recipe written for **websites** (hover, clicks, Tailwind classes, sometimes `localStorage`/`matchMedia`). They need adaptation before they work in video: replace interaction state with `useCurrentFrame()` timing and Tailwind with inline styles (see [writing-handlers.md](writing-handlers.md)).

Reference sources, if the sibling repos are still checked out: `../codehike/apps/web/components/annotations/*.tsx` (implementations) and `../codehike/apps/web/content/docs/code/*.mdx` (docs). Otherwise see https://codehike.org/docs/code/.

Not included in this template, roughly by usefulness:

- **tooltip** - like `callout` but hover-triggered; a frame-timed variant would duplicate what our `callout` already does.
- **classname** - attach CSS classes to annotated lines/tokens; pointless here without a stylesheet, use inline styles instead.
- **link / autolink** - clickable links in code; meaningless in rendered video.
- **collapse / fold** - hide code behind expandable toggles; interactive, but a "fade out irrelevant lines" variant could be built like `focus`.
- **footnotes** - numbered markers with a footnote list below the code; adaptable if narration needs it.
- **copy-button**, **tabs**, **language-switcher** - UI chrome for docs sites; not applicable to video.
- **transpile** - show transpiled output (e.g. TS→JS); build-time docs feature. For video, generate the second step yourself as another file in the episode folder.
- **ruler / pill / icons** - website-specific decorations.

Also avoid these `codehike/utils` modules in Remotion:

- `codehike/utils/selection` - click/scroll selection state.
- `codehike/utils/static-fallback` - media-query static/dynamic swap via `matchMedia`/`localStorage`.
