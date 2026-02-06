import { createSlice } from "@reduxjs/toolkit";
import type { RootState, VehicleModalState } from "../types";
import {
  calculateAverageSpeed,
  calculateTripMileage,
} from "../utils/calculations";

const initialState: RootState["vehicle"] = {
  vehicleDataByPlate: {},
  selectedPlate: null,
};

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {
    appendVehicleDataPoint(
      state,
      action: {
        payload: {
          plate: string;
          speed: number;
          lat: number;
          lng: number;
          status: string;
        };
      }
    ) {
      const { plate, speed, lat, lng, status } = action.payload;
      if (!state.vehicleDataByPlate[plate]) {
        state.vehicleDataByPlate[plate] = {
          speeds: [],
          positions: [],
          status,
        };
      }
      const v = state.vehicleDataByPlate[plate];
      v.speeds.push(speed);
      v.positions.push({ lat, lng });
      v.status = status;
    },
    resetVehicleData(state, action: { payload: string }) {
      const plate = action.payload;
      state.vehicleDataByPlate[plate] = {
        speeds: [],
        positions: [],
        status: "",
      };
    },
    setSelectedPlate(state, action: { payload: string | null }) {
      state.selectedPlate = action.payload;
    },
  },
});

export const { appendVehicleDataPoint, resetVehicleData, setSelectedPlate } =
  vehicleSlice.actions;

export const selectVehicleDataByPlate = (state: RootState) =>
  state.vehicle.vehicleDataByPlate;
export const selectSelectedPlate = (state: RootState) =>
  state.vehicle.selectedPlate;

/** Computed modal data for the selected plate, or null if none selected */
export const selectVehicleModalData = (
  state: RootState
): VehicleModalState | null => {
  const plate = state.vehicle.selectedPlate;
  if (!plate) return null;
  const data = state.vehicle.vehicleDataByPlate[plate];
  if (!data) return null;
  return {
    plate,
    avgSpeed: calculateAverageSpeed(data.speeds),
    tripMileage: calculateTripMileage(data.positions),
    status: data.status,
  };
};

export default vehicleSlice.reducer;
