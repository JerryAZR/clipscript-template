# Clip inventory — RVE templates + bevy engine clips

Complete inventory of port candidates. Assessments:

- **Will port** — legit use cases for programming tutorial / dev-log videos exist.
- **Niche** — portable, but no concrete use case right now; revisit on demand.
- **Not compatible** — doesn't fit the clip model (transitions belong to the
  pane-transition style field; layouts are covered natively by rect panes).

Summaries for RVE items come from the repo's README. See `checklist.md` for the
prioritized development list.

## RVE templates (81)

### Charts & data
| Template | Summary | Assessment |
|---|---|---|
| chart-animation | Animated SVG bar chart with staggered growth | Niche |
| line-chart | SVG polyline drawing left-to-right | Niche |
| pie-chart | Segmented circle with sequential reveals | Niche |
| donut-chart | Ring chart with animated segments | Niche |
| area-chart | Gradient-filled area under a line | Niche |
| progress-bars | Horizontal bars filling to widths | Niche |
| stat-counter | Large number counting up | **Will port** — milestone numbers (tests, lines changed) |
| comparison-chart | Side-by-side before/after metrics | Niche |
| circular-progress | Animated progress ring | Niche |

### Text
| Template | Summary | Assessment |
|---|---|---|
| animated-text | Character-by-character text reveal | Niche (superseded by cinematic-title-intro) |
| bounce-text | Spring bounce entrance | Niche |
| bubble-pop-text | Characters pop in inside bubbles | Niche |
| floating-bubble-text | Floating label with sine-wave wobble | Niche |
| glitch-text | RGB split glitch with decay | Niche (stingers) |
| popping-text | Spring-based scale pop entrance | Niche |
| pulsing-text | Continuous scale pulse | Niche |
| slide-text | Directional slide-in text | Niche |
| typewriter-subtitle | Char-by-char typing with cursor | Niche (terminal covers typing) |

### Content animation
| Template | Summary | Assessment |
|---|---|---|
| animated-list | Staggered list item entrance | **Will port** — outlines, summaries |
| card-flip | 3D card flip front/back | Not compatible (transition between contents) |
| countdown-timer | 5-4-3-2-1-GO with spring scale | Niche |
| notification-pop | Stacking notification toasts | **Will port** — dev-log beats (tests pass, commit landed) |
| particle-explosion | Burst particles from centre | Niche (celebration accent) |
| progress-steps | Step indicator filling in sequence | Niche (bevy `progress` covers the use case better) |
| rotating-carousel | 3D rotating card carousel | Niche |
| sound-wave | Audio waveform bar visualiser | Niche (revisit when voiceover lands) |
| text-highlight | Sequential word highlighting | **Will port** — emphasize key terms in overlays |

### Background
| Template | Summary | Assessment |
|---|---|---|
| bokeh-circles | Floating soft circles with drift | Niche |
| geometric-patterns | Rotating/scaling geometric shapes | Niche |
| gradient-shift | Slowly shifting ambient gradient | Niche (title-page backdrop candidate) |
| grid-pulse | Dot grid with ripple wave pulse | Niche |
| liquid-wave | Flowing SVG wave shapes | Niche |
| matrix-rain | Falling code rain columns | Niche (framework-demo flair) |
| noise-grain | Subtle film grain overlay | Niche |
| pixel-transition | Pixelated grid reveal | Not compatible (transition) |
| starfield | Flying-through-space star effect | Niche |

### Cinematic
| Template | Summary | Assessment |
|---|---|---|
| camera-shake | Decaying shake for impact moments | Niche (error-impact accent) |
| film-burn | Warm light leak overlay | Niche |
| ken-burns | Pan and zoom for images | Niche (screenshot pan/zoom) |
| letterbox-reveal | Black bars retracting to reveal | Not compatible (transition/reveal) |
| parallax-pan | Multi-layer parallax scrolling | Niche (also imports next/image — broken) |
| spotlight-reveal | Expanding circle clip-path reveal | Not compatible (transition/reveal) |
| vignette-pulse | Pulsing darkened edges overlay | Niche |
| whip-pan | Fast horizontal pan with motion blur | Not compatible (transition) |
| zoom-pulse | Rhythmic zoom in/out pulse | Niche |

### Transition
| Template | Summary | Assessment |
|---|---|---|
| blinds-transition | Horizontal blinds opening | Not compatible (transition) |
| clock-wipe | Radial clock-hand sweep | Not compatible (transition) |
| cross-dissolve | Classic cross-fade between scenes | Not compatible (fade is our default already) |
| fade-through-black | Dip to black between scenes | Not compatible (transition) |
| iris-transition | Circular iris close/open | Not compatible (transition) |
| morph-transition | Scale-and-fade morph | Not compatible (transition) |
| push-transition | New scene pushes old off-screen | Not compatible (transition) |
| slide-wipe | Spring-driven panel slide | Not compatible (transition) |
| zoom-through | Zoom in then zoom out reveal | Not compatible (transition) |

### Logo & branding
| Template | Summary | Assessment |
|---|---|---|
| logo-blur-reveal | Focus-pull blur to sharp | Niche |
| logo-bounce-drop | Drop from above with bounce | Niche |
| logo-fade-reveal | Fade in with subtle scale-up | Niche |
| logo-glitch-reveal | RGB split glitch decaying to clean | Niche |
| logo-scale-rotate | Spinning scale entrance | Niche |
| logo-spin-reveal | 3D Y-axis spin reveal | Niche |
| logo-split-reveal | Left/right halves expanding | Niche |
| logo-stroke-draw | SVG stroke drawing animation | Niche |
| logo-typewriter | Icon + typed company name | Niche |

### Intro & outro
| Template | Summary | Assessment |
|---|---|---|
| chapter-title | Chapter number with extending lines | **Will port** — numbered section cards |
| cinematic-title-intro | Title spring-in with growing underline | **Will port** — episode opener |
| countdown-intro | Ring countdown 3-2-1-GO | Niche |
| credits-roll | Scrolling movie-style credits | Niche |
| end-card | Outro with subscribe CTA | Niche (bevy `outro-summary` covers recaps) |
| lower-third | News-style name/title bar | **Will port** — speaker/topic context |
| quote-card | Animated quotation with attribution | Niche |
| subscribe-reminder | Floating subscribe overlay | Niche |
| title-split | Split text meeting in centre | Niche (same purpose as cinematic-title-intro) |

### Image & media
| Template | Summary | Assessment |
|---|---|---|
| gallery-grid | Staggered 2x3 grid reveal | Niche |
| image-carousel | Horizontal sliding with centre focus | Niche |
| image-comparison-slider | Before/after sliding divider | Niche (UI before/after) |
| image-zoom-reveal | Zoom-out focus-pull reveal | Niche |
| masonry-gallery | Pinterest-style staggered grid | Niche |
| photo-stack | Overlapping frames with rotation | Niche |
| picture-in-picture | PiP overlay layout | Not compatible (rect panes cover this natively) |
| polaroid-frame | Polaroid-style photo with drop-in | Niche |
| split-screen | Two panels sliding to meet | Not compatible (rect panes cover this natively) |

## Bevy engine clips (11)

| Clip | Summary | Assessment |
|---|---|---|
| code | Code steps with token morphs | **Done** (milestone 2) |
| title | Basic centered title | **Done** (milestone 1; cinematic-title-intro upgrades this category) |
| terminal | Simulated command typing + output | **Will port** — installs, test runs, git ops |
| video | Timeline-aligned screen recording | **Will port** — showing the app/tool running |
| overlay | zIndex callout card (title + text) | **Will port** — notes/asides over other content |
| progress | Episode outline with done/current/todo | **Will port** — roadmap checklist |
| outro-summary | Bullet recap card | **Will port** — episode wrap-up |
| outro-teaser | "Next episode" card | Niche |
| mask | Flat color overlay | Niche |
| mermaid | Pre-rendered mermaid diagrams | Niche (deferred: adds mermaid dep + font-loading complexity) |
| atlas | Sprite atlas tile viewer (game-specific) | Niche |
| diagram | Custom React diagram registry | Not compatible (episode `clipComponents` seam already covers it) |
