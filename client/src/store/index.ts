import { configureStore } from "@reduxjs/toolkit";
import vehicleReducer from "./vehicleSlice";

export const store = configureStore({
  reducer: {
    vehicle: vehicleReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
