import { describe, expect, it } from "vitest";
import { getEpisode } from "./registry";

describe("getEpisode", () => {
  it("returns the demo episode", () => {
    expect(getEpisode("demo").storyboard.clips.length).toBeGreaterThan(0);
  });

  it("throws on unknown episode, listing registered ones", () => {
    expect(() => getEpisode("nope")).toThrow(
      /Unknown episode 'nope'. Registered episodes: demo/,
    );
  });
});
