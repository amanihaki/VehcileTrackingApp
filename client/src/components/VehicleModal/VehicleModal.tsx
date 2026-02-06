import { useDispatch } from "react-redux";
import LocationIcon from "../../assets/location-icon.svg";
import SpeedIcon from "../../assets/speed-icon.svg";
import { setSelectedPlate } from "../../store/vehicleSlice";
import styles from "./VehicleModal.module.scss";

import { VehicleModalState, VehicleStatusEnum } from "../../types";

interface VehicleModalProps {
  vehicle: VehicleModalState;
}

export default function VehicleModal({ vehicle }: VehicleModalProps) {
  const dispatch = useDispatch();

  const statusClass =
    vehicle.status === VehicleStatusEnum.MOVING
      ? styles.moving
      : vehicle.status === VehicleStatusEnum.STOPPED
        ? styles.stopped
        : styles.idle;

  return (
    <div className={styles.vehicleModal}>
      <div className={styles.vehicleModalHeader}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => dispatch(setSelectedPlate(null))}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className={styles.vehicleModalLocation}>
        Plate number: {vehicle.plate}
      </div>

      <div className={styles.vehicleModalMetrics}>
        <div className={styles.metricItem}>
          <img
            src={SpeedIcon}
            alt=""
            width={18}
            height={18}
            className={`${styles.metricIcon} ${styles.invert}`}
          />
          <span className={styles.metricValue}>
            {vehicle.avgSpeed.toFixed(1)} km/h
          </span>
        </div>
        <div className={styles.metricItem}>
          <img
            src={LocationIcon}
            alt=""
            width={24}
            height={24}
            className={styles.metricIcon}
          />
          <span className={styles.metricValue}>
            {vehicle.tripMileage.toFixed(2)} km
          </span>
        </div>
        <div className={styles.metricItem}>
          <span
            className={`${styles.statusDot} ${statusClass}`}
            title={vehicle.status}
          />
          <span className={styles.metricValue}>{vehicle.status}</span>
        </div>
      </div>
    </div>
  );
}
