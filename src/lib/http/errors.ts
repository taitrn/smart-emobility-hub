export type ErrorCode =
  | "INVALID_INPUT" | "UNAUTHENTICATED" | "FORBIDDEN" | "OWNERSHIP_REQUIRED" | "HUB_SCOPE_REQUIRED"
  | "NOT_FOUND" | "VEHICLE_UNAVAILABLE" | "ACTIVE_HOLD_EXISTS" | "ACTIVE_TRIP_EXISTS"
  | "PARKING_OVERLAP" | "SLOT_BUSY" | "REQUEST_ID_REUSED" | "INVALID_STATE"
  | "RESERVATION_EXPIRED" | "RESERVATION_BLOCKED" | "HUB_MAINTENANCE" | "VEHICLE_INELIGIBLE"
  | "DEVICE_FAILURE" | "DATABASE_UNAVAILABLE" | "SIMULATION_FAILED" | "INTERNAL_ERROR"
  | "NOT_IMPLEMENTED";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, status: number, retryable = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function notImplemented(feature: string): AppError {
  return new AppError("NOT_IMPLEMENTED", `${feature} chưa được triển khai trong scaffold.`, 501);
}
