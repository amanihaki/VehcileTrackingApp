export type VehicleStatus = "moving" | "stopped" | "idle";

export enum VehicleStatusEnum {
  MOVING = "moving",
  STOPPED = "stopped",
  IDLE = "idle",
}

export interface Position {
  lat: number;
  lng: number;
}

export interface VehicleDataPoint {
  lat: number;
  lng: number;
  angle: number;
  speed: number;
  status: VehicleStatus;
  timestamp: string;
}

export interface VehicleData {
  speeds: number[];
  positions: Position[];
  status: string;
}

export interface VehicleModalState {
  plate: string;
  avgSpeed: number;
  tripMileage: number;
  status: string;
}

export interface VehicleDataMessage {
  plate: string;
  data: VehicleDataPoint;
}
