import type { VehicleStatus } from "./vehicle";

export interface PlaybackMeta {
  firstTimestamp?: string;
  lastTimestamp?: string;
}

export interface LastVehicleState {
  lng: number;
  lat: number;
  angle: number;
  status: VehicleStatus;
}
