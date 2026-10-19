// Characterization test for the font-loading failure seen in real usage
// (see the alchemy-journey-devlog incident: a full render died with a
// font delayRender timeout masking the real error).
//
// A localhost server accepts the font request and never responds, so the
// font fetch pends forever - a deterministic stand-in for a wedged font
// load, whatever the organic cause (bundle-server stall under concurrency,
// fresh-page wedge on the frame-retry path).
//
// - "vulnerable" pins the failure mode of src/font.ts's loadFont() pattern:
//   the wedged load holds a delayRender handle, the timeout hard-kills the
//   render, and the error blames the font.
// - "bounded" pins the fix candidate's behavior: the same wedged load
//   degrades to a fallback font with a loud warning, and the render
//   succeeds.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import type { BrowserLog } from "@remotion/renderer";
import fs from "node:fs";
import http from "node:http";
import type net from "node:net";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RENDER_TIMEOUT_MS = 7000; // renderer minimum for timeoutInMilliseconds

let server: http.Server;
let fontUrl = "";
let serveUrl = "";
let outDir = "";
const sockets = new Set<net.Socket>();

beforeAll(async () => {
  // Accepts connections and never responds: the fetch stays pending
  // forever (no response, no CORS verdict, no error).
  server = http.createServer(() => undefined);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", resolve),
  );
  const { port } = server.address() as net.AddressInfo;
  fontUrl = `http://127.0.0.1:${port}/FontLoadRepro.ttf`;

  serveUrl = await bundle({
    entryPoint: path.resolve("tests/font-load/entry.tsx"),
  });
  outDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-load-"));
}, 600_000);

afterAll(async () => {
  for (const socket of sockets) {
    socket.destroy();
  }
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(outDir, { recursive: true, force: true });
});

describe("font-load: a wedged font load must not kill the render", () => {
  it("vulnerable pattern: delayRender timeout hard-fails the render, blaming the font", async () => {
    const composition = await selectComposition({
      serveUrl,
      id: "font-load-vulnerable",
      inputProps: { fontUrl },
    });
    const error: Error = await renderStill({
      composition,
      serveUrl,
      frame: 0,
      output: path.join(outDir, "vulnerable.png"),
      timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    }).then(
      () => {
        throw new Error("expected renderStill to reject");
      },
      (err: Error) => err,
    );
    // The render died on the font's delayRender handle - this is also the
    // message that would mask a retry-triggering original error.
    expect(error.message).toMatch(/delayRender\(\)/);
    expect(error.message).toMatch(/Loading font/);
  }, 120_000);

  it("bounded-wait pattern: the same wedged load degrades to a fallback font", async () => {
    const browserLogs: string[] = [];
    const composition = await selectComposition({
      serveUrl,
      id: "font-load-bounded",
      inputProps: { fontUrl },
    });
    const output = path.join(outDir, "bounded.png");
    await renderStill({
      composition,
      serveUrl,
      frame: 0,
      output,
      onBrowserLog: (log: BrowserLog) => {
        browserLogs.push(log.text);
      },
    });
    expect(fs.existsSync(output)).toBe(true);
    expect(
      browserLogs.some((text) => text.includes("[font-load-repro]")),
    ).toBe(true);
  }, 120_000);
});
