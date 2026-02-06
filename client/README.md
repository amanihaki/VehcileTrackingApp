# Vehicle Tracking Map — Client

React + TypeScript + Vite frontend for real-time vehicle tracking on a Mapbox map.

---

## Setup and Run

### Prerequisites

- **Node.js** (v18+)
- **Mapbox token** — [Create one](https://account.mapbox.com/access-tokens/)
- Backend WebSocket server running (default: `http://localhost:3000`)

### Install

```bash
npm install
```

### Environment

Create `.env` in the client root:

```env
# Required for the map
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token

# Optional (default: http://localhost:3000)
VITE_SOCKET_SERVER_URL=http://localhost:3000
```

### Commands

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build
npm run preview    # Serve production build
npm run lint       # ESLint
```

---

## Architecture and Components

### Entry and app

- **`main.tsx`** — React root + Redux `Provider` + global styles.
- **`App.tsx`** — Renders the single page: `CarTrackingMap`.

### Pages

- **`pages/CarTrackingMap.tsx`** — Main screen:
  - Inits Mapbox map and path layer.
  - Connects to backend via Socket.IO, subscribes to default vehicle plate.
  - Keeps markers: main car (moving), begin-start (trip start), stopped/idle overlays.
  - Draws path line; animates between socket updates.
  - Detects trip restart (timestamp goes backwards) and clears path + markers for that plate.
  - Shows `VehicleModal` when a marker is clicked (selection in Redux).

### Components

- **`components/VehicleModal/`** — Modal with plate, average speed, trip mileage, status; close clears selection. Uses Redux and its own SCSS module.

### State and data

- **`store/vehicleSlice.ts`** — Redux: `vehicleDataByPlate` (positions, speeds, status per plate), `selectedPlate`. Actions: `appendVehicleDataPoint`, `resetVehicleData`, `setSelectedPlate`. Selector `selectVehicleModalData` computes avg speed and trip mileage for the selected vehicle.
- **`store/index.ts`** — Configures the store.

### Types, constants, utils

- **`types/`** — `vehicle`, `redux`, `playback` (e.g. `VehicleData`, `VehicleModalState`, `RootState`, `Position`).
- **`constants/`** — Map (center, zoom, path color, marker sizes), animation duration, socket URL, default plate.
- **`utils/calculations.ts`** — Haversine distance, average speed, trip mileage from positions.
- **`utils/animation.ts`** — Easing and angle interpolation for smooth movement.

### Styling

- **SASS modules** — `CarTrackingMap.module.scss`, `VehicleModal.module.scss`; base styles in `index.css`.

---

## Testing

**Vitest** + **React Testing Library** + **jsdom**.

```bash
npm run test:run       # Single run
npm run test           # Watch mode
npm run test:coverage  # Coverage (install @vitest/coverage-v8 if needed)
```

**Test files**

- `src/utils/calculations.test.ts` — distance, average speed, trip mileage.
- `src/utils/animation.test.ts` — easing, angle interpolation.
- `src/store/vehicleSlice.test.ts` — reducers and selectors.
- `src/components/VehicleModal/VehicleModal.test.tsx` — modal render and close.
- `src/App.test.tsx` — app renders map page (mocked).

Setup: `src/test/setup.ts` (e.g. `@testing-library/jest-dom` for Vitest).

---

## Assumptions

- **Single vehicle in UI**: Subscribes to one default plate (`DXB-CX-36357`). State supports multiple plates but the page does not expose plate switching.
- **Restart on client**: No backend “restart” event; restart is inferred when `vehicleData.timestamp` is less than the previous one for that plate.
- **Mapbox**: Public token in env; map uses Mapbox GL JS and dark style.
- **Coordinates**: Backend sends `lat`/`lng`; Mapbox uses `[lng, lat]`; conversion is done in the client.
- **Trip stats**: Average speed = mean of all received speeds for the current trip; trip mileage = sum of segment distances (Haversine). Both reset when a restart is detected.
