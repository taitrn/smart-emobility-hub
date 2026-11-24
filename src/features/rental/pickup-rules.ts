import type {
  VehicleReservationStatus,
  VehicleStatus,
} from "../../lib/domain/types.ts";

export type PickupReservation = {
  ownerId: string;
  status: VehicleReservationStatus;
  expiresAt: string;
  pickupCode: string;
};

export type PickupVehicleState = {
  status: VehicleStatus;
  enabled: boolean;
};

export type PickupCheckInput = {
  actorId: string;
  pickupCode: string;
  reservation: PickupReservation;
  vehicle: PickupVehicleState;
  now: Date;
};

export type PickupCheckResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "OWNERSHIP_REQUIRED"
        | "INVALID_STATE"
        | "RESERVATION_EXPIRED"
        | "RESERVATION_BLOCKED"
        | "VEHICLE_UNAVAILABLE";
    };

export function checkPickup(
  input: PickupCheckInput,
): PickupCheckResult {
  const {
    actorId,
    pickupCode,
    reservation,
    vehicle,
    now,
  } = input;

  if (reservation.ownerId !== actorId) {
    return {
      ok: false,
      code: "OWNERSHIP_REQUIRED",
    };
  }

  if (reservation.status !== "ACTIVE_HOLD") {
    return {
      ok: false,
      code: "INVALID_STATE",
    };
  }

  if (
    !Number.isFinite(Date.parse(reservation.expiresAt))
  ) {
    return {
      ok: false,
      code: "INVALID_STATE",
    };
  }

  if (
    Date.parse(reservation.expiresAt) <= now.getTime()
  ) {
    return {
      ok: false,
      code: "RESERVATION_EXPIRED",
    };
  }

  if (
    reservation.pickupCode !== pickupCode
  ) {
    return {
      ok: false,
      code: "RESERVATION_BLOCKED",
    };
  }

  if (
    !vehicle.enabled ||
    vehicle.status !== "RESERVED"
  ) {
    return {
      ok: false,
      code: "VEHICLE_UNAVAILABLE",
    };
  }

  return { ok: true };
}
