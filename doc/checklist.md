# Development checklist — clip porting

Everything marked **Will port** in `clip-inventory.md`, prioritized. One clip
per purpose; similar-purpose leftovers stay Niche in the inventory.

## Batch 1 — core utility

- [x] **terminal** (bevy) — simulated command typing + output.
  Use case: installs, builds, test runs, git operations. Pure simulation, no assets.
- [x] **video** (bevy) — timeline-aligned screen recording embed.
  Use case: showing the app/tool/game running.
- [x] **overlay** (bevy) — zIndex callout card (title + text).
  Use case: notes, corrections, asides over code or video.

## Batch 2 — structure

- [x] **cinematic-title-intro** (RVE) — spring title with growing underline.
  Use case: episode opener. Replaces the plain title page for anything that
  needs to feel like an intro.
- [x] **animated-list** (RVE) — staggered bullet reveals.
  Use case: "what we'll cover", summaries, checklists narrated one by one.
- [x] **progress** (bevy) — outline with done/current/todo states.
  Use case: episode roadmap, multi-part progress. Needs de-sinicizing.
- [x] **countdown** (RVE countdown-intro, was Niche) — ring countdown + GO.
  Use case: sync-fence demos (holds the timeline until it reaches zero);
  rarely used in typical tutorials but the perfect fence showcase.

## Batch 3 — flair

- [x] **notification-pop** (RVE) — stacking toasts.
  Use case: "tests pass", "commit landed", "CI green" beats.
- [x] **chapter-title** (RVE) — numbered chapter card with extending lines.
  Use case: multi-chapter tutorials (distinct purpose from the episode opener).
- [x] **progress-steps** (RVE) — horizontal stepper with animated advance.
  Ported as a candidate progress tracker alongside bevy **progress**:
  stepper wins on animation, checklist wins on hierarchy/nesting.
  Default tracker TBD after use in real episodes.

## Later (unscheduled)

- [ ] **stat-counter** (RVE) — count-up numbers. Use case: milestone stats.
- [ ] **lower-third** (RVE) — name/title bar. Use case: speaker or topic context.
- [ ] **outro-summary** (bevy) — bullet recap card. Use case: episode wrap-up.

## Consolidation decisions (one clip per purpose)

- Episode opener: **cinematic-title-intro** wins over title-split, animated-text,
  bounce-text, popping-text, slide-text (all Niche).
- Outline/progress: bevy **progress** vs RVE **progress-steps** - both ported
  (batch 2 / batch 3) as candidates; default tracker TBD after real use.
- Outro recap: bevy **outro-summary** wins over RVE end-card.
- Typing effect: **terminal** covers it; typewriter-subtitle stays Niche.
- **text-highlight** stays Niche/not planned: worth reading as a pattern
  (per-word timing inside text), but not a clip - the terminal typewriter
  covers the common need, and overlay text stays static.
- Transitions (RVE transition category, letterbox-reveal, spotlight-reveal,
  whip-pan, pixel-transition, card-flip) are not clips - they are candidates for
  the pane-transition style field if/when we add it.
- Split-screen and picture-in-picture are not clips - rect panes cover them natively.

## Framework work (not clips, sequential)

- [x] TTS pipeline (narration.toml → voiceover mp3s, hash-cached) + measured durations.
- [x] Validation/lint pass (coverage, transition sanity, scroll continuity).
- [ ] Skill updates for the new authoring workflow.
