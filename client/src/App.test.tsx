import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./pages/CarTrackingMap", () => ({
  default: function MockCarTrackingMap() {
    return <div data-testid="car-tracking-map">Car Tracking Map</div>;
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders CarTrackingMap page", () => {
    render(<App />);
    expect(screen.getByTestId("car-tracking-map")).toBeInTheDocument();
    expect(screen.getByText("Car Tracking Map")).toBeInTheDocument();
  });
});
