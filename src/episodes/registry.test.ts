import { describe, expect, it } from "vitest";
import { getEpisode, listEpisodes, registerInternalEpisode } from "./registry";

describe("getEpisode", () => {
  it("returns a registered episode", () => {
    expect(getEpisode("examples/showcase").storyboard.clips.length).toBeGreaterThan(0);
  });

  it("resolves internal episodes without listing them in Studio", () => {
    registerInternalEpisode("test-internal", { storyboard: { clips: [] } });
    expect(getEpisode("test-internal").storyboard.clips).toEqual([]);
    expect(listEpisodes()).not.toContain("test-internal");
  });

  it("throws on unknown episode, listing registered ones", () => {
    expect(() => getEpisode("nope")).toThrow(
      /Unknown episode 'nope'. Registered episodes: examples\/showcase/,
    );
  });
});
