import test from "node:test";
import assert from "node:assert/strict";
import { runSimulationEngine } from "../src/features/simulation/engine.ts";
import type { SimulationInput } from "../src/features/simulation/service.ts";

const h1 = "00000000-0000-4000-8000-000000000001";
const h2 = "00000000-0000-4000-8000-000000000002";

test("simulation is deterministic and identifies arrival overflow and full capacity", () => {
  const input: SimulationInput = {
    requestId: h1,
    hubIds: [h1, h2],
    demandMultiplier: 2,
    failedChargingPoints: 1,
    projectedArrivals: 4,
    arrivalHubId: h1,
    horizonMinutes: 30,
    seed: 42,
  };
  const snapshot = {
    asOf: "2026-11-21T10:00:00Z",
    hubs: [
      {
        id: h1,
        parkedVehicleCount: 2,
        availableVehicleCount: 2,
        freeFleetSpaces: 2,
        availableChargingPointCount: 2,
        totalChargingPointCount: 3,
      },
      {
        id: h2,
        parkedVehicleCount: 4,
        availableVehicleCount: 4,
        freeFleetSpaces: 0,
        availableChargingPointCount: 1,
        totalChargingPointCount: 2,
      },
    ],
  };

  const first = runSimulationEngine(input, snapshot);
  const second = runSimulationEngine(input, snapshot);
  assert.deepEqual(first, second);

  const h1Metric = first.hubMetrics.find((metric) => metric.hubId === h1);
  assert.equal(h1Metric?.isFleetFull, true);
  assert.equal(h1Metric?.parkedVehicleCount, 4);
  assert.equal(h1Metric?.overflowCount, 2);
  assert.equal(h1Metric?.unmetDemand, 2);

  const h2Metric = first.hubMetrics.find((metric) => metric.hubId === h2);
  assert.equal(h2Metric?.isFleetFull, true);
  assert.equal(h2Metric?.parkedVehicleCount, 4);
  assert.equal(h2Metric?.hasMostParkedVehicles, true);
  assert.ok(first.recommendations.some((item) => item.kind === "REDIRECT"));
  assert.ok(first.recommendations.some((item) => item.kind === "CHARGING"));
});

test("simulation marks every selected Hub tied for the most parked vehicles", () => {
  const input: SimulationInput = {
    requestId: h1,
    hubIds: [h1, h2],
    demandMultiplier: 1,
    failedChargingPoints: 0,
    projectedArrivals: 0,
    horizonMinutes: 5,
    seed: 42,
  };
  const result = runSimulationEngine(input, {
    asOf: "2026-11-21T10:00:00Z",
    hubs: [
      {
        id: h1,
        parkedVehicleCount: 3,
        availableVehicleCount: 3,
        freeFleetSpaces: 3,
        availableChargingPointCount: 2,
        totalChargingPointCount: 2,
      },
      {
        id: h2,
        parkedVehicleCount: 3,
        availableVehicleCount: 3,
        freeFleetSpaces: 3,
        availableChargingPointCount: 2,
        totalChargingPointCount: 2,
      },
    ],
  });
  assert.equal(result.hubMetrics.every((metric) => metric.hasMostParkedVehicles), true);
});

test("failed charging count cannot exceed selected charging capacity", () => {
  assert.throws(
    () =>
      runSimulationEngine(
        {
          requestId: h1,
          hubIds: [h1],
          demandMultiplier: 1,
          failedChargingPoints: 3,
          projectedArrivals: 0,
          horizonMinutes: 5,
          seed: 42,
        },
        {
          asOf: "2026-11-21T10:00:00Z",
          hubs: [
            {
              id: h1,
              parkedVehicleCount: 2,
              availableVehicleCount: 2,
              freeFleetSpaces: 2,
              availableChargingPointCount: 2,
              totalChargingPointCount: 2,
            },
          ],
        },
      ),
    /tổng cổng/,
  );
});
