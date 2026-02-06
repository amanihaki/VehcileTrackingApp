import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { MAP_CONFIG } from "../constants/map";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export function useMapManager(containerRef: React.RefObject<HTMLDivElement>) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pathRef = useRef<[number, number][]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
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
          geometry: {
            type: "LineString",
            coordinates: pathRef.current,
          },
        },
      });

      mapRef.current.addLayer({
        id: "carPathLayer",
        type: "line",
        source: "carPath",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": MAP_CONFIG.PATH_COLOR,
          "line-width": MAP_CONFIG.PATH_WIDTH,
        },
      });

      // Leading segment: animated "head" of the path (last committed → current position)
      mapRef.current.addSource("carPathActive", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      mapRef.current.addLayer({
        id: "carPathActiveLayer",
        type: "line",
        source: "carPathActive",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": MAP_CONFIG.PATH_ACTIVE_COLOR,
          "line-width": MAP_CONFIG.PATH_ACTIVE_WIDTH,
        },
      });
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [containerRef]);

  const renderPath = (inFlight?: [number, number]) => {
    const coordinates = inFlight
      ? [...pathRef.current, inFlight]
      : pathRef.current;
    const pathSource = mapRef.current?.getSource(
      "carPath"
    ) as mapboxgl.GeoJSONSource;
    if (pathSource) {
      pathSource.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      });
    }

    // Animate the leading segment (moving part of the line)
    const activeSource = mapRef.current?.getSource(
      "carPathActive"
    ) as mapboxgl.GeoJSONSource;
    if (activeSource) {
      const path = pathRef.current;
      if (inFlight && path.length > 0) {
        const lastCommitted = path[path.length - 1];
        activeSource.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [lastCommitted, inFlight],
          },
        });
      } else {
        activeSource.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        });
      }
    }
  };

  const addPathPoint = (lng: number, lat: number) => {
    pathRef.current.push([lng, lat]);
  };

  const clearPath = () => {
    pathRef.current = [];
    renderPath();
    // Clear leading segment
    const activeSource = mapRef.current?.getSource(
      "carPathActive"
    ) as mapboxgl.GeoJSONSource;
    if (activeSource) {
      activeSource.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      });
    }
  };

  const centerMap = (lng: number, lat: number) => {
    mapRef.current?.setCenter([lng, lat]);
  };

  return {
    mapRef,
    pathRef,
    renderPath,
    addPathPoint,
    clearPath,
    centerMap,
  };
}
