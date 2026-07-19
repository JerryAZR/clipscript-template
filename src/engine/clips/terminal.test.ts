import { describe, expect, it, vi } from "vitest";

// TerminalClip.tsx pulls in code-style.ts -> font.ts, which calls
// staticFile()/loadFont() at module scope and throws outside a Remotion
// render. The pure function under test doesn't need fonts.
vi.mock("../../font", () => ({ fontFamily: "monospace" }));
import {
  terminalLinesAt,
  type TerminalConfig,
  type TerminalStep,
} from "./TerminalClip";

const fast: TerminalConfig = {
  typeSpeed: 1,
  pauseAfterCommand: 4,
  outputLineDelay: 3,
};

describe("terminalLinesAt", () => {
  it("returns no lines for empty steps", () => {
    expect(terminalLinesAt([], fast, 100)).toEqual([]);
  });

  it("shows the prompt with an empty typed command at frame 0", () => {
    const [line] = terminalLinesAt([{ command: "ls" }], fast, 0);
    expect(line).toEqual({
      kind: "typed",
      prompt: "$ ",
      text: "",
      cursor: true,
    });
  });

  it("types one char per frame at the default speed", () => {
    const steps: TerminalStep[] = [{ command: "ls" }];
    expect(terminalLinesAt(steps, fast, 1)[0].text).toBe("l");
    expect(terminalLinesAt(steps, fast, 1)[0].kind).toBe("typed");
    // "ls" needs ceil(2/1) = 2 frames; fully typed at frame 2
    expect(terminalLinesAt(steps, fast, 2)[0]).toMatchObject({
      kind: "command",
      text: "ls",
    });
  });

  it("honors typeSpeed > 1 (chars per frame)", () => {
    const steps: TerminalStep[] = [{ command: "abcdef" }];
    const cfg: TerminalConfig = { ...fast, typeSpeed: 2 };
    expect(terminalLinesAt(steps, cfg, 1)[0].text).toBe("ab");
    expect(terminalLinesAt(steps, cfg, 2)[0].text).toBe("abcd");
    // ceil(6/2) = 3 frames
    expect(terminalLinesAt(steps, cfg, 3)[0].kind).toBe("command");
  });

  it("honors fractional typeSpeed (frames per char)", () => {
    const steps: TerminalStep[] = [{ command: "ab" }];
    const cfg: TerminalConfig = { ...fast, typeSpeed: 0.5 };
    expect(terminalLinesAt(steps, cfg, 0)[0].text).toBe("");
    expect(terminalLinesAt(steps, cfg, 1)[0].text).toBe("");
    expect(terminalLinesAt(steps, cfg, 2)[0].text).toBe("a");
    // ceil(2/0.5) = 4 frames
    expect(terminalLinesAt(steps, cfg, 4)[0].kind).toBe("command");
  });

  it("keeps the full command with cursor during the pause, no output yet", () => {
    const steps: TerminalStep[] = [{ command: "ls", output: ["a.ts"] }];
    // command done at 2, pause is 4 -> output starts after frame 2+4=6
    for (const frame of [2, 3, 4, 5]) {
      const lines = terminalLinesAt(steps, fast, frame);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({ kind: "command", text: "ls", cursor: true });
    }
    // first output line appears one outputLineDelay after the pause
    expect(terminalLinesAt(steps, fast, 8)).toHaveLength(1);
    expect(terminalLinesAt(steps, fast, 9)).toHaveLength(2);
    expect(terminalLinesAt(steps, fast, 9)[1]).toEqual({
      kind: "output",
      prompt: "",
      text: "a.ts",
      cursor: true,
    });
  });

  it("reveals output lines one per outputLineDelay", () => {
    const steps: TerminalStep[] = [
      { command: "ls", output: ["one", "two", "three"] },
    ];
    // command 2 frames + pause 4 = 6; lines at 6+3, 6+6, 6+9
    expect(terminalLinesAt(steps, fast, 9)).toHaveLength(2);
    expect(terminalLinesAt(steps, fast, 12)).toHaveLength(3);
    expect(terminalLinesAt(steps, fast, 14)).toHaveLength(3);
    expect(terminalLinesAt(steps, fast, 15)).toHaveLength(4);
    expect(
      terminalLinesAt(steps, fast, 15).map((l) => l.text),
    ).toEqual(["ls", "one", "two", "three"]);
  });

  it("runs steps back-to-back: step 2 starts right after step 1", () => {
    const steps: TerminalStep[] = [
      { command: "ls", output: ["a"] }, // 2 + 4 + 3 = 9 frames
      { cwd: "~/app", command: "pwd", output: ["/app"] }, // 3 + 4 + 3 = 10
    ];
    // Step boundary at frame 9: first char of step 2 not yet typed
    const at9 = terminalLinesAt(steps, fast, 9);
    expect(at9.map((l) => l.text)).toEqual(["ls", "a", ""]);
    expect(at9[2]).toMatchObject({
      kind: "typed",
      prompt: "~/app $ ",
      cursor: true,
    });
    expect(at9[0].cursor).toBe(false);
    // Step 2 fully typed at 9+3=12, output at 12+4+3=19
    expect(terminalLinesAt(steps, fast, 12)[2]).toMatchObject({
      kind: "command",
      text: "pwd",
    });
    const at19 = terminalLinesAt(steps, fast, 19);
    expect(at19).toHaveLength(4);
    expect(at19[3]).toMatchObject({ kind: "output", text: "/app", cursor: true });
    // Long after everything: all lines stay, cursor on the last one
    const at100 = terminalLinesAt(steps, fast, 100);
    expect(at100).toHaveLength(4);
    expect(at100.map((l) => l.cursor)).toEqual([false, false, false, true]);
  });

  it("leaves the cursor on the command line when a step has no output", () => {
    const steps: TerminalStep[] = [{ command: "ls" }];
    const lines = terminalLinesAt(steps, fast, 50);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ kind: "command", text: "ls", cursor: true });
  });

  it("handles an empty command (still shows prompt and consumes a frame)", () => {
    const steps: TerminalStep[] = [{ command: "", output: ["ok"] }];
    const lines = terminalLinesAt(steps, fast, 0);
    expect(lines[0]).toMatchObject({ kind: "typed", prompt: "$ ", text: "" });
    // commandFrames = max(1, 0) = 1, pause 4, delay 3 -> output at 1+4+3=8
    expect(terminalLinesAt(steps, fast, 8)).toHaveLength(2);
  });

  it("applies the documented defaults", () => {
    const steps: TerminalStep[] = [{ command: "ab", output: ["x"] }];
    // defaults: typeSpeed 1, pauseAfterCommand 15, outputLineDelay 10
    expect(terminalLinesAt(steps, {}, 2)[0].kind).toBe("command");
    expect(terminalLinesAt(steps, {}, 16)).toHaveLength(1);
    expect(terminalLinesAt(steps, {}, 26)).toHaveLength(1);
    expect(terminalLinesAt(steps, {}, 27)).toHaveLength(2);
  });

  it("is deterministic across repeated calls", () => {
    const steps: TerminalStep[] = [
      { command: "echo hi", output: ["hi"] },
      { command: "exit" },
    ];
    for (const frame of [0, 3, 11, 40, 200]) {
      expect(terminalLinesAt(steps, fast, frame)).toEqual(
        terminalLinesAt(steps, fast, frame),
      );
    }
  });

  it("clamps negative frames to frame 0", () => {
    const steps: TerminalStep[] = [{ command: "ls" }];
    expect(terminalLinesAt(steps, fast, -5)).toEqual(
      terminalLinesAt(steps, fast, 0),
    );
  });
});
