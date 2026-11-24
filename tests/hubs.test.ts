import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeHubs,
  type HubResources,
} from "../src/features/hubs/summary.ts";
test("Hub counts separate filtered available vehicles, FLEET spaces and available ports", () => {
  const d: HubResources = {
    hubs: [
      {
        id: "h",
        code: "H01",
        name: "Metro",
        latitude: 1,
        longitude: 2,
        status: "ACTIVE",
      },
    ],
    vehicles: [
      {
        id: "v",
        hub_id: "h",
        code: "V1",
        vehicle_type: "E_BIKE",
        battery_percent: 75,
        status: "AVAILABLE",
      },
      {
        id: "v2",
        hub_id: "h",
        code: "V2",
        vehicle_type: "E_BIKE",
        battery_percent: 90,
        status: "OUT_OF_SERVICE",
      },
    ],
    spaces: [
      {
        id: "s",
        hub_id: "h",
        code: "S",
        space_kind: "PRIVATE",
        occupancy_status: "FREE",
      },
    ],
    points: [],
  };
  assert.equal(
    summarizeHubs(d, { minBattery: 75 }).hubs[0].availableVehicleCount,
    1,
  );
  assert.equal(summarizeHubs(d, {}).hubs[0].freeFleetSpaces, 0);
  assert.equal(summarizeHubs(d, { minBattery: 76 }).hubs.length, 0);
  assert.equal(summarizeHubs(d, { q: "metro" }).hubs.length, 1);
  d.hubs[0].status = "MAINTENANCE";
  assert.equal(summarizeHubs(d, {}).hubs[0].availableVehicleCount, 0);
});
