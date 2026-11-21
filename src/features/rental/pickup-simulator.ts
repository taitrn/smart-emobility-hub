export type PickupSimulationResult =
  | { success: true }
  | { success: false; reason: "DEVICE_FAILURE" };

export function simulatePickup(
  deviceAvailable: boolean,
): PickupSimulationResult {
  if (!deviceAvailable) {
    return {
      success: false,
      reason: "DEVICE_FAILURE",
    };
  }

  return { success: true };
}
