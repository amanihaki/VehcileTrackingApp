import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { io, Socket } from "socket.io-client";
import { DEFAULT_PLATE, SOCKET_SERVER_URL } from "../constants/socket";
import {
  appendVehicleDataPoint,
  resetVehicleData,
} from "../store/vehicleSlice";
import type { PlaybackMeta, VehicleDataMessage } from "../types";

export function useSocketConnection() {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);
  const playbackMetaRef = useRef<Record<string, PlaybackMeta>>({});
  const hasCenteredRef = useRef<boolean>(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to Socket.IO server!");
      socketRef.current?.emit("subscribeToVehicle", { plate: DEFAULT_PLATE });
    });

    socketRef.current.on("subscribed", (data: { plate: string }) => {
      console.log("Subscribed to vehicle:", data.plate);
    });

    socketRef.current.on("vehicleData", (msg: VehicleDataMessage) => {
      const { plate, data } = msg;
      console.log("DATA", data);
      const { lng, lat, angle, status, speed, timestamp } = data;

      // Detect restart (timestamp jumps backwards)
      const meta =
        playbackMetaRef.current[plate] ?? (playbackMetaRef.current[plate] = {});

      if (!meta.firstTimestamp) {
        meta.firstTimestamp = timestamp;
      }

      const isRestart = meta.lastTimestamp && timestamp < meta.lastTimestamp;
      meta.lastTimestamp = timestamp;

      if (isRestart) {
        dispatch(resetVehicleData(plate));
      }

      // Update Redux state
      dispatch(
        appendVehicleDataPoint({
          plate,
          speed,
          lat,
          lng,
          status,
        })
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [dispatch]);

  return {
    socketRef,
    hasCenteredRef,
    playbackMetaRef,
  };
}
