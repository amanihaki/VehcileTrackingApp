import { describe, expect, it } from "vitest";
import {
  calculateAverageSpeed,
  calculateDistance,
  calculateTripMileage,
} from "./calculations";

describe("calculateDistance", () => {
  it("returns 0 for same point", () => {
    expect(calculateDistance(25.2, 55.3, 25.2, 55.3)).toBe(0);
  });

  it("returns positive distance for two different points", () => {
    const d = calculateDistance(25.0, 55.0, 25.01, 55.01);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(10);
  });

  it("is symmetric", () => {
    expect(calculateDistance(25.1, 55.2, 25.2, 55.3)).toBe(
      calculateDistance(25.2, 55.3, 25.1, 55.2)
    );
  });
});

describe("calculateAverageSpeed", () => {
  it("returns 0 for empty array", () => {
    expect(calculateAverageSpeed([])).toBe(0);
  });

  it("returns the value for single speed", () => {
    expect(calculateAverageSpeed([50])).toBe(50);
  });

  it("returns mean for multiple speeds", () => {
    expect(calculateAverageSpeed([10, 20, 30])).toBe(20);
    expect(calculateAverageSpeed([0, 100])).toBe(50);
  });
});

describe("calculateTripMileage", () => {
  it("returns 0 for empty or single position", () => {
    expect(calculateTripMileage([])).toBe(0);
    expect(calculateTripMileage([{ lat: 25, lng: 55 }])).toBe(0);
  });

  it("returns distance for two positions", () => {
    const mileage = calculateTripMileage([
      { lat: 25, lng: 55 },
      { lat: 25.01, lng: 55.01 },
    ]);
    expect(mileage).toBeGreaterThan(0);
  });

  it("sums segment distances for multiple positions", () => {
    const a = { lat: 25.0, lng: 55.0 };
    const b = { lat: 25.01, lng: 55.0 };
    const c = { lat: 25.02, lng: 55.0 };
    const total = calculateTripMileage([a, b, c]);
    const ab = calculateTripMileage([a, b]);
    const bc = calculateTripMileage([b, c]);
    expect(total).toBeCloseTo(ab + bc, 10);
  });
});
