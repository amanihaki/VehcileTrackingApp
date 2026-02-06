import { describe, expect, it } from "vitest";
import type { RootState } from "../types";
import vehicleReducer, {
  appendVehicleDataPoint,
  resetVehicleData,
  selectSelectedPlate,
  selectVehicleModalData,
  setSelectedPlate,
} from "./vehicleSlice";

const getInitialState = (): RootState["vehicle"] => ({
  vehicleDataByPlate: {},
  selectedPlate: null,
});

describe("vehicleSlice", () => {
  describe("appendVehicleDataPoint", () => {
    it("creates vehicle data when plate is new", () => {
      const state = getInitialState();
      const next = vehicleReducer(
        state,
        appendVehicleDataPoint({
          plate: "DXB-123",
          speed: 50,
          lat: 25.2,
          lng: 55.3,
          status: "moving",
        })
      );
      expect(next.vehicleDataByPlate["DXB-123"]).toEqual({
        speeds: [50],
        positions: [{ lat: 25.2, lng: 55.3 }],
        status: "moving",
      });
    });

    it("appends to existing vehicle data", () => {
      const state: RootState["vehicle"] = {
        vehicleDataByPlate: {
          "DXB-123": {
            speeds: [10],
            positions: [{ lat: 25, lng: 55 }],
            status: "moving",
          },
        },
        selectedPlate: null,
      };
      const next = vehicleReducer(
        state,
        appendVehicleDataPoint({
          plate: "DXB-123",
          speed: 20,
          lat: 25.01,
          lng: 55.01,
          status: "moving",
        })
      );
      expect(next.vehicleDataByPlate["DXB-123"].speeds).toEqual([10, 20]);
      expect(next.vehicleDataByPlate["DXB-123"].positions).toHaveLength(2);
      expect(next.vehicleDataByPlate["DXB-123"].status).toBe("moving");
    });
  });

  describe("resetVehicleData", () => {
    it("resets vehicle data for plate", () => {
      const state: RootState["vehicle"] = {
        vehicleDataByPlate: {
          "DXB-123": {
            speeds: [10, 20],
            positions: [
              { lat: 25, lng: 55 },
              { lat: 25.01, lng: 55.01 },
            ],
            status: "moving",
          },
        },
        selectedPlate: null,
      };
      const next = vehicleReducer(state, resetVehicleData("DXB-123"));
      expect(next.vehicleDataByPlate["DXB-123"]).toEqual({
        speeds: [],
        positions: [],
        status: "",
      });
    });
  });

  describe("setSelectedPlate", () => {
    it("sets selected plate", () => {
      const state = getInitialState();
      const next = vehicleReducer(state, setSelectedPlate("DXB-123"));
      expect(next.selectedPlate).toBe("DXB-123");
    });

    it("clears selected plate with null", () => {
      const state: RootState["vehicle"] = {
        vehicleDataByPlate: {},
        selectedPlate: "DXB-123",
      };
      const next = vehicleReducer(state, setSelectedPlate(null));
      expect(next.selectedPlate).toBeNull();
    });
  });
});

describe("selectVehicleModalData", () => {
  it("returns null when no plate selected", () => {
    const state: RootState = {
      vehicle: { vehicleDataByPlate: {}, selectedPlate: null },
    };
    expect(selectVehicleModalData(state)).toBeNull();
  });

  it("returns null when plate has no data", () => {
    const state: RootState = {
      vehicle: {
        vehicleDataByPlate: {},
        selectedPlate: "DXB-123",
      },
    };
    expect(selectVehicleModalData(state)).toBeNull();
  });

  it("returns computed modal data when plate has data", () => {
    const state: RootState = {
      vehicle: {
        vehicleDataByPlate: {
          "DXB-123": {
            speeds: [10, 20, 30],
            positions: [
              { lat: 25, lng: 55 },
              { lat: 25.01, lng: 55.01 },
              { lat: 25.02, lng: 55.02 },
            ],
            status: "moving",
          },
        },
        selectedPlate: "DXB-123",
      },
    };
    const modal = selectVehicleModalData(state);
    expect(modal).not.toBeNull();
    expect(modal!.plate).toBe("DXB-123");
    expect(modal!.avgSpeed).toBe(20);
    expect(modal!.status).toBe("moving");
    expect(modal!.tripMileage).toBeGreaterThan(0);
  });
});

describe("selectSelectedPlate", () => {
  it("returns selected plate from state", () => {
    const state: RootState = {
      vehicle: { vehicleDataByPlate: {}, selectedPlate: "DXB-123" },
    };
    expect(selectSelectedPlate(state)).toBe("DXB-123");
  });
});
