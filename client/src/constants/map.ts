export const MAP_CONFIG = {
  DEFAULT_CENTER: [55.2708, 25.2048] as [number, number], // Dubai coords
  DEFAULT_ZOOM: 13,
  STYLE: "mapbox://styles/mapbox/dark-v11",
  PATH_COLOR: "rgb(48,133,82)",
  PATH_WIDTH: 4,
  /** Leading segment (moving part of the line) */
  PATH_ACTIVE_COLOR: "rgb(134, 239, 172)",
  PATH_ACTIVE_WIDTH: 6,
} as const;

export const MARKER_CONFIG = {
  MAIN_SIZE: 60,
  OVERLAY_SIZE: 20,
} as const;
