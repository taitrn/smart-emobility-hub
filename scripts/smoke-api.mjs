// Smoke against this branch's scaffold, never a production/reset script.
// No cookies or credentials are sent. Unauthenticated mutations must be rejected.
import assert from "node:assert/strict";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
if (!(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))) {
  throw new Error("Smoke chỉ chạy với server local.");
}
const id = "00000000-0000-4000-8000-000000000001";
const body = { requestId: crypto.randomUUID() };
const authConfigured = process.env.AUTH_CONFIGURED === "1";
const protectedStatus = authConfigured ? 401 : 503;
const cases = [
  ["GET", "/api/health", undefined, 200],
  ["GET", "/api/hubs?minBattery=75", undefined, authConfigured ? 200 : 503],
  ["GET", "/api/operator/overview", undefined, protectedStatus],
  ["POST", "/api/charging-requests", { ...body, vehicleId: id, vehicleKind: "PRIVATE", hubId: id }, protectedStatus],
  ["GET", "/api/hubs?minBattery=101", undefined, 400],
  ["POST", "/api/vehicle-reservations", { ...body, vehicleId: id }, protectedStatus],
  ["POST", `/api/vehicle-reservations/${id}/pickup`, { ...body, pickupCode: "ABCDEFGH2345" }, protectedStatus],
  ["POST", `/api/trips/${id}/return`, { ...body, hubId: id, slotId: id }, protectedStatus],
  ["POST", "/api/trips/not-a-uuid/return", { ...body, hubId: id, slotId: id }, 400],
  ["POST", "/api/parking-reservations", { ...body, privateVehicleId: id, slotId: id,
    start: "2099-01-01T10:00:00Z", end: "2099-01-01T10:30:00Z" }, protectedStatus],
  ["POST", "/api/operator/simulations", { ...body, hubIds: [id], demandMultiplier: 2,
    failedChargingPoints: 0, horizonMinutes: 30 }, protectedStatus],
  ["POST", "/api/operator/charging/process", undefined, protectedStatus],
  ["POST", `/api/operator/charging/${id}/complete`, { ...body }, protectedStatus],
  ["POST", "/api/vehicle-reservations", { ...body, vehicleId: id, role: "ADMIN" }, 400],
];

for (const [method, path, input, expected] of cases) {
  const expectedStatus = expected;
  const response = await fetch(new URL(path, base), {
    method, redirect: "error", signal: AbortSignal.timeout(10_000),
    ...(input ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) } : {}),
  });
  const json = await response.json();
  assert.equal(response.status, expectedStatus, `${method} ${path}`);
  assert.equal(json.ok, expectedStatus === 200);
  assert.match(json.requestId, /^[0-9a-f-]{36}$/i);
  assert.match(response.headers.get("cache-control") ?? "", /(?:^|,\s*)no-store(?:,|$)/);
  if (expectedStatus === 501) assert.equal(json.error.code, "NOT_IMPLEMENTED");
  if (expectedStatus === 401) assert.equal(json.error.code, "UNAUTHENTICATED");
  if (expectedStatus === 503) assert.equal(json.error.code, "DATABASE_UNAVAILABLE");
  if (expected === 400) assert.equal(json.error.code, "INVALID_INPUT");
  console.log(`PASS ${response.status} ${method} ${path}`);
}
const malformed = await fetch(new URL("/api/vehicle-reservations", base), {
  method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
  headers: { "Content-Type": "application/json" }, body: "{",
});
assert.equal(malformed.status, 400);
assert.equal((await malformed.json()).error.code, "INVALID_INPUT");
console.log("PASS 400 malformed JSON");
console.log("Scaffold smoke passed. Protected requests were rejected correctly.");
