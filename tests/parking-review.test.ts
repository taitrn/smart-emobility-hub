import test from "node:test";
import assert from "node:assert/strict";
import { reserveParkingSchema } from "../src/features/reservations/parking.ts";
import {
  parkingWindowError,
  parkingInputToUtc,
  validParkingOffset,
} from "../src/features/reservations/parking-rules.ts";
const base = {
  requestId: "99000000-0000-4000-8000-000000000001",
  privateVehicleId: "99000000-0000-4000-8000-000000000002",
  slotId: "99000000-0000-4000-8000-000000000003",
  start: new Date(Date.now() + 3600000).toISOString(),
  end: new Date(Date.now() + 7200000).toISOString(),
};
test("parking limits length and horizon without allowing invalid timezone offsets", () => {
  assert.equal(reserveParkingSchema.safeParse(base).success, true);
  for (const patch of [
    { end: new Date(Date.parse(base.start) + 25 * 3600000).toISOString() },
    { start: "9999-01-01T10:00:00Z", end: "9999-01-01T11:00:00Z" },
    { start: "2026-12-01T10:00:00+23:59" },
    { start: "2026-12-01T10:00:00+14:01" },
  ])
    assert.equal(
      reserveParkingSchema.safeParse({ ...base, ...patch }).success,
      false,
    );
  assert.equal(validParkingOffset("2026-01-01T10:00:00-14:00"), true);
  assert.match(parkingWindowError(base.end, base.start) ?? "", /kết thúc/);
});
test("parking input is interpreted as UTC+7 irrespective of machine timezone", () => {
  assert.equal(
    parkingInputToUtc("2026-11-14T10:00"),
    "2026-11-14T03:00:00.000Z",
  );
});
