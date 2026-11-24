import assert from "node:assert/strict";
import test from "node:test";
import {
  checkPickup,
  type PickupCheckInput,
} from "../src/features/rental/pickup-rules.ts";
import { simulatePickup } from "../src/features/rental/pickup-simulator.ts";

function validInput(): PickupCheckInput {
  return {
    actorId: "student-1",
    pickupCode: "ABCD23",
    reservation: {
      ownerId: "student-1",
      status: "ACTIVE_HOLD",
      expiresAt: "2026-11-22T12:00:00Z",
      pickupCode: "ABCD23",
    },
    vehicle: {
      status: "RESERVED",
      enabled: true,
    },
    now: new Date("2026-11-21T12:00:00Z"),
  };
}

test("UC03: nhan xe hop le", () => {
  assert.deepEqual(checkPickup(validInput()), {
    ok: true,
  });
});

test("UC03: sai chu luot dat", () => {
  const input = validInput();
  input.actorId = "student-2";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "OWNERSHIP_REQUIRED",
  });
});

test("UC03: luot dat da huy", () => {
  const input = validInput();
  input.reservation.status = "CANCELLED";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "INVALID_STATE",
  });
});

test("UC03: luot dat da nhan", () => {
  const input = validInput();
  input.reservation.status = "FULFILLED";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "INVALID_STATE",
  });
});

test("UC03: het han giu xe", () => {
  const input = validInput();
  input.reservation.expiresAt = "2026-11-20T12:00:00Z";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "RESERVATION_EXPIRED",
  });
});

test("UC03: ma nhan xe sai", () => {
  const input = validInput();
  input.pickupCode = "WRONGCODE234";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "RESERVATION_BLOCKED",
  });
});

test("UC03: xe khong kha dung", () => {
  const input = validInput();
  input.vehicle.status = "IN_USE";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "VEHICLE_UNAVAILABLE",
  });
});

test("UC03: xe bi vo hieu hoa", () => {
  const input = validInput();
  input.vehicle.enabled = false;

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "VEHICLE_UNAVAILABLE",
  });
});

test("UC03: ma thoi gian khong hop le", () => {
  const input = validInput();
  input.reservation.expiresAt = "invalid-date";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "INVALID_STATE",
  });
});

test("UC03: simulator mo khoa thanh cong", () => {
  assert.deepEqual(simulatePickup(true), {
    success: true,
  });
});

test("UC03: simulator bao loi thiet bi", () => {
  assert.deepEqual(simulatePickup(false), {
    success: false,
    reason: "DEVICE_FAILURE",
  });
});

test("UC03: khong cho nhan xe lan hai", () => {
  const input = validInput();

  assert.deepEqual(checkPickup(input), {
    ok: true,
  });

  input.reservation.status = "FULFILLED";
  input.vehicle.status = "IN_USE";

  assert.deepEqual(checkPickup(input), {
    ok: false,
    code: "INVALID_STATE",
  });
});
