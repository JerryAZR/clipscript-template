# terminal clip

Simulated terminal: types commands and reveals output, fully deterministic.

```ts
{
  id: "terminal-1",
  type: "terminal",
  steps: [
    { cwd: "~/app", command: "npm install", output: ["added 361 packages in 21s"] },
    { cwd: "~/app", command: "npm run lint", output: ["> tsc && eslint src"] },
  ],
  rect: rects.splitRight,          // right half of a side-by-side pair
  startAt: { line: "showcase.terminal" },
  endAt: [{ line: "showcase.terminal", end: true }],
}
```

## Config fields

- `steps` (required) - `{ cwd?, command, output? }[]`. Each command is typed,
  pauses, then its output lines appear one by one.
- `typeSpeed` - chars per frame (default 1).
- `pauseAfterCommand` - frames to wait after typing (default 15).
- `outputLineDelay` - frames between output lines (default 10).
- `showCursor` - blinking block cursor (default true).

Prompt shows `cwd` when provided (`~/app $`). Pure simulation - no assets, no
actual command execution. Source: `src/engine/clips/TerminalClip.tsx`.
