// Shared MVP defaults from docs/implementation, not values supplied by clients.
// Owner: Tài (integration). Feature owners discuss changes to these rules first.
// The future DB/RPC implementation must enforce the same policy with DB time.
export const SHARED_CONFIG = {
  reservation: {
    vehicleHoldMinutes: 15,
    minimumParkingMinutes: 30,
  },
  charging: { priorityBatteryPercent: 20, priorityDepartureMinutes: 60 },
  simulation: {
    defaultSeed: 42,
    stepMinutes: 5,
    minimumHorizonMinutes: 5,
    maximumHorizonMinutes: 120,
    maximumDemandMultiplier: 5,
  },
  ui: { timeZone: "Asia/Ho_Chi_Minh", pollingIntervalMs: 5_000 },
} as const;
