import type { VehicleData } from "./vehicle";

/** Vehicle slice state */
export interface VehicleState {
  vehicleDataByPlate: Record<string, VehicleData>;
  selectedPlate: string | null;
}

export interface RootState {
  vehicle: VehicleState;
}
