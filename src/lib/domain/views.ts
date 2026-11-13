import type {
  CommandState, HubSummary, ParkingReservationStatus, SimulationStatus,
  TripStatus, VehicleReservationStatus,
} from "./types.ts";

// Shared API DTOs. These interfaces do not imply a database table exists.
export type HubListView = { hubs: HubSummary[]; asOf: string; stale: boolean };

export type VehicleReservationView = {
  id: string;
  vehicleId: string;
  hubId: string;
  status: VehicleReservationStatus;
  confirmedAt: string;
  expiresAt: string;
  pickupCode?: string; // Owner only, while the hold is valid. Never log this.
  deviceCommandId?: string;
  tripId?: string;
};

export type TripView = {
  id: string;
  vehicleId: string;
  reservationId: string;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  returnHubId?: string;
  returnSlotId?: string;
};

export type DeviceCommandView = {
  id: string;
  kind: "PICKUP" | "RETURN";
  state: CommandState;
  resultId?: string;
  reason?: string;
  updatedAt: string;
};

// MVP uses immediate SUCCESS/FAILURE. Pending variants are legacy compatibility,
// not a requirement to implement a persistent device workflow.
export type RentalCommandResult =
  | { command: DeviceCommandView & { state: "SUCCESS" }; trip: TripView }
  | { command: DeviceCommandView & { state: "PENDING" | "PENDING_CONFIRMATION" | "FAILURE" }; trip?: never };

export type ParkingReservationView = {
  id: string;
  status: ParkingReservationStatus;
  start: string;
  end: string;
  checkinDeadlineAt: string;
};

export type SimulationRunView = {
  id: string;
  status: SimulationStatus;
  params: {
    hubIds: string[];
    demandMultiplier: number;
    failedChargingPoints: number;
    projectedArrivals: number;
    arrivalHubId?: string;
    horizonMinutes: number;
    seed: number;
  };
  baselineAsOf: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  failure?: string;
  hubMetrics: {
    hubId: string;
    isFleetFull: boolean;
    parkedVehicleCount: number;
    hasMostParkedVehicles: boolean;
    unmetDemand: number;
    overflowCount: number;
    overloadMinutes: number;
    estimatedWaitMinutes: number | null;
  }[];
  recommendations: {
    key: string;
    kind: "REBALANCE" | "CHARGING" | "REDIRECT";
    sourceHubId?: string;
    destinationHubId?: string;
    vehicleCount?: number;
    reason: string;
    assumptions: string[];
  }[];
};
