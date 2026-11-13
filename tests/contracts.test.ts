import assert from "node:assert/strict";
import test from "node:test";
import { chargingRequestSchema } from "../src/features/charging/service.ts";
import { hubQuerySchema } from "../src/features/hubs/service.ts";
import { reserveVehicleSchema } from "../src/features/reservations/vehicle.ts";
import { reserveParkingSchema } from "../src/features/reservations/parking.ts";
import { simulationSchema } from "../src/features/simulation/service.ts";

const id = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";

test("public Hub filters parse numeric strings and reject invalid battery limits", () => {
  assert.deepEqual(hubQuerySchema.parse({ minBattery: "75" }), { minBattery: 75 });
  for (const value of ["", "-1", "101", "abc"]) {
    assert.equal(hubQuerySchema.safeParse({ minBattery: value }).success, false);
  }
});

test("mutations require UUID request IDs and reject client-supplied identity or state", () => {
  const valid = { requestId: id, vehicleId: otherId };
  assert.equal(reserveVehicleSchema.safeParse(valid).success, true);
  assert.equal(reserveVehicleSchema.safeParse({ ...valid, requestId: "retry-1" }).success, false);
  for (const extra of [{ actorId: id }, { role: "ADMIN" }, { now: "2026-11-12" }, { status: "FULFILLED" }]) {
    assert.equal(reserveVehicleSchema.safeParse({ ...valid, ...extra }).success, false);
  }
});

test("parking accepts 30 minutes, rejects 29 minutes and reversed intervals", () => {
  const valid = { requestId: id, privateVehicleId: id, slotId: otherId,
    start: "2026-11-12T10:00:00Z", end: "2026-11-12T10:30:00Z" };
  assert.equal(reserveParkingSchema.safeParse(valid).success, true);
  assert.equal(reserveParkingSchema.safeParse({ ...valid, end: "2026-11-12T10:29:00Z" }).success, false);
  assert.equal(reserveParkingSchema.safeParse({ ...valid, end: "2026-11-12T09:30:00Z" }).success, false);
  assert.equal(reserveParkingSchema.safeParse({ ...valid, end: "2026-11-12T17:30:00+07:00" }).success, true);
});

const scenario = { requestId: id, hubIds: [id], demandMultiplier: 2,
  failedChargingPoints: 0, horizonMinutes: 30 };

test("simulation accepts uint32 seeds and rejects out-of-range or non-step horizons", () => {
  assert.equal(simulationSchema.parse(scenario).seed, 42);
  assert.equal(simulationSchema.parse(scenario).projectedArrivals, 0);
  assert.equal(simulationSchema.safeParse({ ...scenario, projectedArrivals: -1 }).success, false);
  assert.equal(simulationSchema.safeParse({ ...scenario, projectedArrivals: 4 }).success, false);
  assert.equal(simulationSchema.safeParse({ ...scenario, projectedArrivals: 4, arrivalHubId: otherId }).success, false);
  assert.equal(simulationSchema.safeParse({ ...scenario, projectedArrivals: 4, arrivalHubId: id }).success, true);
  assert.equal(simulationSchema.safeParse({ ...scenario, seed: 0xffff_ffff }).success, true);
  for (const horizonMinutes of [0, 7, 121]) {
    assert.equal(simulationSchema.safeParse({ ...scenario, horizonMinutes }).success, false);
  }
  for (const seed of [-1, 1.5, 0x1_0000_0000]) {
    assert.equal(simulationSchema.safeParse({ ...scenario, seed }).success, false);
  }
});

test("simulation rejects duplicate targets, arbitrary baseline and invalid demand/port counts", () => {
  for (const extra of [{ hubIds: [] }, { hubIds: [id, id] }, { baseline: {} },
    { demandMultiplier: 5.1 }, { failedChargingPoints: -1 }, { failedChargingPoints: 1.5 }]) {
    assert.equal(simulationSchema.safeParse({ ...scenario, ...extra }).success, false);
  }
});


test("charging request validates its vehicle type and rejects a client role", () => {
  const input = { requestId: id, vehicleId: id, vehicleKind: "PRIVATE", hubId: otherId };
  assert.equal(chargingRequestSchema.safeParse(input).success, true);
  assert.equal(chargingRequestSchema.safeParse({ ...input, vehicleKind: "OTHER" }).success, false);
  assert.equal(chargingRequestSchema.safeParse({ ...input, role: "OPERATOR" }).success, false);
});
