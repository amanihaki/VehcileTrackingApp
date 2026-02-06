import { describe, expect, it } from "vitest";
import { easeInOutQuad, interpolateAngle } from "./animation";

describe("easeInOutQuad", () => {
  it("returns 0 at t=0", () => {
    expect(easeInOutQuad(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeInOutQuad(1)).toBe(1);
  });

  it("returns 0.5 at t=0.5", () => {
    expect(easeInOutQuad(0.5)).toBe(0.5);
  });

  it("is between 0 and 1 for t in (0,1)", () => {
    expect(easeInOutQuad(0.25)).toBeGreaterThan(0);
    expect(easeInOutQuad(0.25)).toBeLessThan(1);
    expect(easeInOutQuad(0.75)).toBeGreaterThan(0);
    expect(easeInOutQuad(0.75)).toBeLessThan(1);
  });
});

describe("interpolateAngle", () => {
  it("returns from at t=0", () => {
    expect(interpolateAngle(90, 180, 0)).toBe(90);
  });

  it("returns to at t=1", () => {
    expect(interpolateAngle(90, 180, 1)).toBe(180);
  });

  it("interpolates linearly for simple case", () => {
    expect(interpolateAngle(0, 90, 0.5)).toBe(45);
  });

  it("handles 360 wrap (shortest path)", () => {
    const result = interpolateAngle(350, 10, 0.5);
    expect(result % 360).toBeCloseTo(0, 0);
  });
});
