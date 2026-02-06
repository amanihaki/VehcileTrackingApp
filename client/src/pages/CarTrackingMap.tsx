import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import BeginStartIcon from "../assets/begin-start.svg";
import IdleIcon from "../assets/idle-icon.svg";
import MarkerIcon from "../assets/navigation-final-cropped.svg";
import StoppedIcon from "../assets/stop-icon.svg";
import VehicleModal from "../components/VehicleModal";
import { ANIMATION_CONFIG } from "../constants/animation";
import { MAP_CONFIG, MARKER_CONFIG } from "../constants/map";
import { DEFAULT_PLATE, SOCKET_SERVER_URL } from "../constants/socket";
import {
  appendVehicleDataPoint,
  resetVehicleData,
  selectVehicleModalData,
  setSelectedPlate,
} from "../store/vehicleSlice";
import { easeInOutQuad, interpolateAngle } from "../utils/animation";

import styles from "./CarTrackingMap.module.scss";

import type {
  LastVehicleState,
  PlaybackMeta,
  VehicleDataMessage,
  VehicleStatus,
} from "../types";
import { VehicleStatusEnum } from "../types";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function CarTrackingMap() {
  const dispatch = useDispatch();
  const vehicleModal = useSelector(selectVehicleModalData);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const overlayMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const startMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const pathRef = useRef<[number, number][]>([]);
  const hasCenteredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastVehicleStateRef = useRef<Record<string, LastVehicleState>>({});
  const playbackMetaRef = useRef<Record<string, PlaybackMeta>>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // ——— Map init ———
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.STYLE,
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
    });

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      mapRef.current.addSource("carPath", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: pathRef.current },
        },
      });
      mapRef.current.addLayer({
        id: "carPathLayer",
        type: "line",
        source: "carPath",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": MAP_CONFIG.PATH_COLOR,
          "line-width": MAP_CONFIG.PATH_WIDTH,
        },
      });
    });

    // ——— Socket ———
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.on("connect", () => {
      socketRef.current?.emit("subscribeToVehicle", { plate: DEFAULT_PLATE });
    });
    socketRef.current.on("subscribed", (data: { plate: string }) => {
      console.log("Subscribed to vehicle:", data.plate);
    });

    // ——— Helpers ———
    const showVehicleModal = (carId: string) => {
      dispatch(setSelectedPlate(carId));
    };

    const removeOverlayMarker = (key: string) => {
      const m = overlayMarkersRef.current[key];
      if (m) {
        m.remove();
        delete overlayMarkersRef.current[key];
      }
    };

    const removeMainMarker = (carId: string) => {
      const m = markersRef.current[carId];
      if (m) {
        m.remove();
        delete markersRef.current[carId];
      }
    };

    const removeStartMarker = (plate: string) => {
      const m = startMarkersRef.current[plate];
      if (m) {
        m.remove();
        delete startMarkersRef.current[plate];
      }
    };

    const removeAllMarkersForPlate = (plate: string) => {
      removeOverlayMarker(`${plate}-stopped`);
      removeOverlayMarker(`${plate}-idle`);
      removeMainMarker(plate);
      removeStartMarker(plate);
    };

    const setStartMarker = (plate: string, lng: number, lat: number) => {
      if (startMarkersRef.current[plate] || !mapRef.current) return;
      const el = document.createElement("div");
      el.style.width = `80px`;
      el.style.height = `80px`;
      el.style.backgroundImage = `url(${BeginStartIcon})`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";
      el.style.pointerEvents = "none";
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      startMarkersRef.current[plate] = marker;
    };

    const ensureMainMarker = (
      carId: string,
      lng: number,
      lat: number,
      heading: number,
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
        el.addEventListener("click", () => showVehicleModal(carId));
        markersRef.current[carId] = marker;
        return marker;
      }
      if (marker) {
        marker.setLngLat([lng, lat]);
        const inner = marker
          .getElement()
          .querySelector(".marker-inner") as HTMLDivElement;
        if (inner) inner.style.transform = `rotate(${heading}deg)`;
      }
      return marker!;
    };

    const setOverlayMarker = (
      key: string,
      lng: number,
      lat: number,
      heading: number,
      iconUrl: string,
      carId: string,
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
      el.addEventListener("click", () => showVehicleModal(carId));
      overlayMarkersRef.current[key] = marker;
    };

    const updateCarMarker = (
      carId: string,
      lng: number,
      lat: number,
      heading: number,
      status: VehicleStatus,
    ) => {
      ensureMainMarker(carId, lng, lat, heading);

      if (status === VehicleStatusEnum.STOPPED) {
        setOverlayMarker(
          `${carId}-stopped`,
          lng,
          lat,
          heading,
          StoppedIcon,
          carId,
        );
        return;
      }
      if (status === VehicleStatusEnum.IDLE) {
        setOverlayMarker(`${carId}-idle`, lng, lat, heading, IdleIcon, carId);
      }
    };

    const renderPath = (inFlight?: [number, number]) => {
      const coords = inFlight
        ? [...pathRef.current, inFlight]
        : pathRef.current;
      const pathSource = mapRef.current?.getSource(
        "carPath",
      ) as mapboxgl.GeoJSONSource;
      if (pathSource) {
        pathSource.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    };

    const addPathPoint = (lng: number, lat: number) => {
      pathRef.current.push([lng, lat]);
    };

    const clearPath = () => {
      pathRef.current = [];
      renderPath();
    };

    const centerMap = (lng: number, lat: number) => {
      mapRef.current?.setCenter([lng, lat]);
    };

    const animateTo = (
      fromLng: number,
      fromLat: number,
      fromAngle: number,
      toLng: number,
      toLat: number,
      toAngle: number,
      status: VehicleStatus,
      plate: string,
    ) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      const start = performance.now();
      const durationMs = ANIMATION_CONFIG.DURATION_MS;

      const step = (now: number) => {
        const rawT = Math.min(1, (now - start) / durationMs);
        const t = easeInOutQuad(rawT);
        const lng = fromLng + (toLng - fromLng) * t;
        const lat = fromLat + (toLat - fromLat) * t;
        const angle = interpolateAngle(fromAngle, toAngle, t);
        updateCarMarker(plate, lng, lat, angle, status);
        renderPath([lng, lat]);
        if (rawT < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          pathRef.current.push([toLng, toLat]);
          renderPath();
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(step);
    };

    // ——— vehicleData handler ———
    socketRef.current.on("vehicleData", (msg: VehicleDataMessage) => {
      const { plate, data } = msg;
      const { lng, lat, angle, status, speed, timestamp } = data;

      const meta =
        playbackMetaRef.current[plate] ?? (playbackMetaRef.current[plate] = {});
      if (!meta.firstTimestamp) meta.firstTimestamp = timestamp;
      const isRestart = meta.lastTimestamp && timestamp < meta.lastTimestamp;
      meta.lastTimestamp = timestamp;

      if (isRestart) {
        dispatch(resetVehicleData(plate));
        removeAllMarkersForPlate(plate);
        clearPath();
        delete lastVehicleStateRef.current[plate];
      }

      if (!hasCenteredRef.current && mapRef.current) {
        centerMap(lng, lat);
        hasCenteredRef.current = true;
      }

      dispatch(
        appendVehicleDataPoint({
          plate,
          speed,
          lat,
          lng,
          status,
        }),
      );

      const last = lastVehicleStateRef.current[plate];
      if (!last) {
        setStartMarker(plate, lng, lat);
        updateCarMarker(plate, lng, lat, angle, status);
        addPathPoint(lng, lat);
        renderPath();
        lastVehicleStateRef.current[plate] = { lng, lat, angle, status };
      } else {
        const mainMarker = markersRef.current[plate];
        const from = mainMarker?.getLngLat() ?? {
          lng: last.lng,
          lat: last.lat,
        };
        const samePoint =
          Math.abs(from.lng - lng) < ANIMATION_CONFIG.EPSILON &&
          Math.abs(from.lat - lat) < ANIMATION_CONFIG.EPSILON;

        if (samePoint) {
          updateCarMarker(plate, lng, lat, angle, status);
          renderPath([lng, lat]);
          const prev = pathRef.current[pathRef.current.length - 1];
          if (!prev || prev[0] !== lng || prev[1] !== lat) {
            addPathPoint(lng, lat);
            renderPath();
          }
        } else {
          animateTo(
            from.lng,
            from.lat,
            last.angle,
            lng,
            lat,
            angle,
            status,
            plate,
          );
        }
        lastVehicleStateRef.current[plate] = { lng, lat, angle, status };
      }
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      socketRef.current?.disconnect();
      mapRef.current?.remove();
    };
  }, [dispatch]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainerRef} className={styles.mapContainer} />
      {vehicleModal && <VehicleModal vehicle={vehicleModal} />}
    </div>
  );
}
