import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import vehicleReducer from "../../store/vehicleSlice";
import VehicleModal from "./VehicleModal";

vi.mock("../../assets/location-icon.svg", () => ({ default: "/location.svg" }));
vi.mock("../../assets/speed-icon.svg", () => ({ default: "/speed.svg" }));

function renderWithStore(vehicle: {
  plate: string;
  avgSpeed: number;
  tripMileage: number;
  status: string;
}) {
  const store = configureStore({
    reducer: { vehicle: vehicleReducer },
    preloadedState: {
      vehicle: {
        vehicleDataByPlate: {},
        selectedPlate: vehicle.plate,
      },
    },
  });
  return {
    ...render(
      <Provider store={store}>
        <VehicleModal vehicle={vehicle} />
      </Provider>
    ),
    store,
  };
}

describe("VehicleModal", () => {
  it("renders header and plate number", () => {
    renderWithStore({
      plate: "DXB-456",
      avgSpeed: 45,
      tripMileage: 12.5,
      status: "moving",
    });
    expect(screen.getByText("Last location")).toBeInTheDocument();
    expect(screen.getByText(/Plate number: DXB-456/)).toBeInTheDocument();
  });

  it("renders speed, trip mileage and status", () => {
    renderWithStore({
      plate: "DXB-123",
      avgSpeed: 33.5,
      tripMileage: 8.72,
      status: "stopped",
    });
    expect(screen.getByText("33.5 km/h")).toBeInTheDocument();
    expect(screen.getByText("8.72 km")).toBeInTheDocument();
    expect(screen.getByText("stopped")).toBeInTheDocument();
  });

  it("close button dispatches setSelectedPlate(null)", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore({
      plate: "DXB-1",
      avgSpeed: 0,
      tripMileage: 0,
      status: "idle",
    });
    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);
    expect(store.getState().vehicle.selectedPlate).toBeNull();
  });
});
