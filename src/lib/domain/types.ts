// Business vocabulary from docs/implementation/01_SCOPE_AND_RULES.md.
// These types are contracts, not a database schema or implemented workflows.
export type Role = "STUDENT" | "OPERATOR" | "ADMIN";
export type HubStatus = "ACTIVE" | "MAINTENANCE";
export type VehicleStatus = "AVAILABLE" | "RESERVED" | "IN_USE" | "WAITING_CHARGE" | "CHARGING" | "OUT_OF_SERVICE";
export type VehicleReservationStatus = "ACTIVE_HOLD" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type TripStatus = "ACTIVE" | "COMPLETED";
export type ParkingReservationStatus = "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type SpaceKind = "FLEET" | "PRIVATE";
export type OccupancyStatus = "FREE" | "OCCUPIED";
export type ChargingPointStatus = "AVAILABLE" | "IN_USE" | "OUT_OF_SERVICE";
export type ChargingSessionStatus = "WAITING" | "CHARGING" | "PAUSED" | "COMPLETED" | "CANCELLED" | "FAILED";
export type ChargingPriority = "HIGH" | "NORMAL";
export type CommandState = "PENDING" | "SUCCESS" | "FAILURE" | "PENDING_CONFIRMATION";
export type SimulationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type DraftStatus = "DRAFT" | "APPROVED" | "REJECTED";
export type IncidentStatus = "OPEN" | "RESOLVED";

export type Actor = { id: string; role: Role; hubIds: string[] };

export type HubSummary = {
  id: string;
  code: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  status: HubStatus;
  availableVehicleCount: number;
  freeFleetSpaces: number;
  availableChargingPointCount: number;
  asOf: string;
};
