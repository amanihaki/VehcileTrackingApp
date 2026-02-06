import { useRef } from "react";
import { ANIMATION_CONFIG } from "../constants/animation";
import type { VehicleStatus } from "../types";
import { easeInOutQuad, interpolateAngle } from "../utils/animation";

interface AnimationParams {
  plate: string;
  fromLng: number;
  fromLat: number;
  fromAngle: number;
  toLng: number;
  toLat: number;
  toAngle: number;
  status: VehicleStatus;
  durationMs?: number;
}

interface PathAnimation {
  animateTo: (
    params: AnimationParams,
    onUpdate: (
      lng: number,
      lat: number,
      angle: number,
      status: VehicleStatus
    ) => void,
    onComplete: (lng: number, lat: number) => void
  ) => void;
  cancel: () => void;
}

export function usePathAnimation(): PathAnimation {
  const animationFrameRef = useRef<number | null>(null);

  const animateTo = (
    params: AnimationParams,
    onUpdate: (
      lng: number,
      lat: number,
      angle: number,
      status: VehicleStatus
    ) => void,
    onComplete: (lng: number, lat: number) => void
  ) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const {
      fromLng,
      fromLat,
      fromAngle,
      toLng,
      toLat,
      toAngle,
      status,
      durationMs = ANIMATION_CONFIG.DURATION_MS,
    } = params;

    const start = performance.now();

    const step = (now: number) => {
      const rawT = Math.min(1, (now - start) / durationMs);
      const t = easeInOutQuad(rawT);

      const lng = fromLng + (toLng - fromLng) * t;
      const lat = fromLat + (toLat - fromLat) * t;
      const angle = interpolateAngle(fromAngle, toAngle, t);

      onUpdate(lng, lat, angle, status);

      if (rawT < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
        onComplete(toLng, toLat);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const cancel = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  return { animateTo, cancel };
}
