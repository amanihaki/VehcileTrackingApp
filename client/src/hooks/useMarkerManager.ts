import mapboxgl from "mapbox-gl";
import { useRef } from "react";
import IdleIcon from "../assets/idle-icon.svg";
import MarkerIcon from "../assets/navigation-final-cropped.svg";
import StoppedIcon from "../assets/stop-icon.svg";
import { MARKER_CONFIG } from "../constants/map";
import type { VehicleStatus } from "../types";

interface MarkerManager {
  ensureMainMarker: (
    carId: string,
    lng: number,
    lat: number,
    heading: number,
    onClick: (carId: string) => void,
  ) => mapboxgl.Marker;
  setOverlayMarker: (
    key: string,
    lng: number,
    lat: number,
    heading: number,
    iconUrl: string,
    carId: string,
    onClick: (carId: string) => void,
  ) => void;
  removeOverlayMarker: (key: string) => void;
  updateCarMarker: (
    carId: string,
    lng: number,
    lat: number,
    heading: number,
    status: VehicleStatus,
    onMarkerClick: (carId: string) => void,
  ) => mapboxgl.Marker | undefined;
  getMarker: (carId: string) => mapboxgl.Marker | undefined;
}

export function useMarkerManager(
  mapRef: React.RefObject<mapboxgl.Map | null>,
): MarkerManager {
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const overlayMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});

  const ensureMainMarker = (
    carId: string,
    lng: number,
    lat: number,
    heading: number,
    onClick: (carId: string) => void,
  ): mapboxgl.Marker => {
    let marker = markersRef.current[carId];
    if (!marker && mapRef.current) {
      const el = document.createElement("div");
      el.className = "marker-outer";
      el.style.width = `${MARKER_CONFIG.MAIN_SIZE}px`;
      el.style.height = `${MARKER_CONFIG.MAIN_SIZE}px`;
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";

      const inner = document.createElement("div");
      inner.className = "marker-inner";
      inner.style.width = "100%";
      inner.style.height = "100%";
      inner.style.backgroundImage = `url(${MarkerIcon})`;
      inner.style.backgroundSize = "cover";
      inner.style.backgroundRepeat = "no-repeat";
      inner.style.backgroundPosition = "center";
      inner.style.transformOrigin = "center center";
      inner.style.transform = `rotate(${heading}deg)`;
      el.appendChild(inner);

      marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      el.addEventListener("click", () => onClick(carId));
      markersRef.current[carId] = marker;
      return marker;
    }

    if (marker) {
      marker.setLngLat([lng, lat]);
      const inner = marker
        .getElement()
        .querySelector(".marker-inner") as HTMLDivElement;
      if (inner) {
        inner.style.transform = `rotate(${heading}deg)`;
      }
    }
    return marker;
  };

  const setOverlayMarker = (
    key: string,
    lng: number,
    lat: number,
    heading: number,
    iconUrl: string,
    carId: string,
    onClick: (carId: string) => void,
  ) => {
    const existing = overlayMarkersRef.current[key];
    if (existing) {
      existing.setLngLat([lng, lat]);
      const el = existing.getElement();
      if (el) el.style.transform = `rotate(${heading}deg)`;
      return;
    }

    if (!mapRef.current) return;

    const el = document.createElement("div");
    el.style.width = `${MARKER_CONFIG.OVERLAY_SIZE}px`;
    el.style.height = `${MARKER_CONFIG.OVERLAY_SIZE}px`;
    el.style.backgroundImage = `url(${iconUrl})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center";
    el.style.transformOrigin = "center center";
    el.style.transform = `rotate(${heading}deg)`;
    el.style.cursor = "pointer";

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    el.addEventListener("click", () => onClick(carId));
    overlayMarkersRef.current[key] = marker;
  };

  const removeOverlayMarker = (key: string) => {
    const marker = overlayMarkersRef.current[key];
    if (marker) {
      marker.remove();
      delete overlayMarkersRef.current[key];
    }
  };

  const updateCarMarker = (
    carId: string,
    lng: number,
    lat: number,
    heading: number,
    status: VehicleStatus,
    onMarkerClick: (carId: string) => void,
  ): mapboxgl.Marker | undefined => {
    const marker = ensureMainMarker(carId, lng, lat, heading, onMarkerClick);

    if (status === "stopped") {
      setOverlayMarker(
        `${carId}-stopped`,
        lng,
        lat,
        heading,
        StoppedIcon,
        carId,
        onMarkerClick,
      );
      return marker;
    }

    if (status === "idle") {
      setOverlayMarker(
        `${carId}-idle`,
        lng,
        lat,
        heading,
        IdleIcon,
        carId,
        onMarkerClick,
      );
    }

    return marker;
  };

  const getMarker = (carId: string): mapboxgl.Marker | undefined => {
    return markersRef.current[carId];
  };

  return {
    ensureMainMarker,
    setOverlayMarker,
    removeOverlayMarker,
    updateCarMarker,
    getMarker,
  };
}
