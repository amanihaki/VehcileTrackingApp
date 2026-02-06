import type { Position } from "../types";

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateAverageSpeed(speeds: number[]): number {
  if (speeds.length === 0) return 0;
  return speeds.reduce((acc, s) => acc + s, 0) / speeds.length;
}

export function calculateTripMileage(positions: Position[]): number {
  if (positions.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    total += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  return total;
}
