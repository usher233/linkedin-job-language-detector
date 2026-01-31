import { describe, it, expect } from "bun:test";

describe("Badge Module", () => {
  it("exports createBadge function", async () => {
    const badges = await import("../src/content/badges.js");
    expect(typeof badges.createBadge).toBe("function");
  });

  it("exports injectBadge function", async () => {
    const badges = await import("../src/content/badges.js");
    expect(typeof badges.injectBadge).toBe("function");
  });
});
