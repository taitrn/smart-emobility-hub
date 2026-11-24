// Smoke against a local app, never a production/reset script.
// No cookies or credentials are sent. Unauthenticated mutations must be rejected.
import assert from "node:assert/strict";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
if (!(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))) {
  throw new Error("Smoke chỉ chạy với server local.");
}
const id = "00000000-0000-4000-8000-000000000001";
const body = { requestId: crypto.randomUUID() };
const protectedStatus = process.env.AUTH_CONFIGURED === "1" ? 401 : 503;
const cases = [
  ["GET", "/api/health", undefined, 200],
  ["GET", "/api/hubs?minBattery=75", undefined, process.env.AUTH_CONFIGURED === "1" ? 200 : 503],
  ["GET", "/api/operator/overview", undefined, "protected"],
  ["POST", "/api/charging-requests", { ...body, vehicleId: id, vehicleKind: "PRIVATE", hubId: id }, "protected"],
  ["GET", "/api/hubs?minBattery=101", undefined, 400],
  ["GET", "/api/me/reservations", undefined, "protected"],
  ["POST", "/api/vehicle-reservations", { ...body, vehicleId: id }, "protected"],
  ["POST", `/api/vehicle-reservations/${id}/cancel`, body, "protected"],
  ["POST", "/api/vehicle-reservations/not-a-uuid/cancel", body, "protected"],
  ["POST", `/api/vehicle-reservations/${id}/pickup`, { ...body, pickupCode: "ABCDEFGH2345" }, "protected"],
  ["POST", `/api/trips/${id}/return`, { ...body, hubId: id, slotId: id }, "protected"],
  ["POST", "/api/parking-reservations", { ...body, privateVehicleId: id, slotId: id,
    start: "2099-01-01T10:00:00Z", end: "2099-01-01T10:30:00Z" }, "protected"],
  ["POST", "/api/operator/simulations", { ...body, hubIds: [id], demandMultiplier: 2,
    failedChargingPoints: 0, horizonMinutes: 30 }, "protected"],
  ["POST", "/api/vehicle-reservations", { ...body, vehicleId: id, role: "ADMIN" }, "protected"],
];

for (const [method, path, input, expected] of cases) {
  const expectedStatus = expected === "protected"
    ? protectedStatus
    : expected;
  const response = await fetch(new URL(path, base), {
    method, redirect: "error", signal: AbortSignal.timeout(10_000),
    ...(input ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) } : {}),
  });
  const json = await response.json();
  assert.equal(response.status, expectedStatus, `${method} ${path}`);
  assert.equal(json.ok, expectedStatus === 200);
  assert.match(json.requestId, /^[0-9a-f-]{36}$/i);
  assert.match(response.headers.get("cache-control") ?? "", /(?:^|,\s*)no-store(?:,|$)/);
  if (expectedStatus === 401) assert.equal(json.error.code, "UNAUTHENTICATED");
  if (expectedStatus === 503) assert.equal(json.error.code, "DATABASE_UNAVAILABLE");
  if (expected === 400) assert.equal(json.error.code, "INVALID_INPUT");
  console.log(`PASS ${response.status} ${method} ${path}`);
}
const malformed = await fetch(new URL("/api/vehicle-reservations", base), {
  method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
  headers: { "Content-Type": "application/json" }, body: "{",
});
assert.equal(malformed.status, protectedStatus);
assert.equal((await malformed.json()).error.code, protectedStatus === 401 ? "UNAUTHENTICATED" : "DATABASE_UNAVAILABLE");
console.log(`PASS ${protectedStatus} malformed JSON without a session`);
console.log("API smoke passed. Protected requests without a session were rejected.");
