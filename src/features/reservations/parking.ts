import { z } from "zod";
import { SHARED_CONFIG } from "../../config/shared.ts";
import { mutationSchema, timestampSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { ParkingReservationView } from "../../lib/domain/views.ts";
import { notImplemented } from "../../lib/http/errors.ts";

export const reserveParkingSchema = mutationSchema.extend({
  privateVehicleId: uuidSchema, slotId: uuidSchema,
  start: timestampSchema, end: timestampSchema,
}).strict().refine(
  ({ start, end }) => Date.parse(end) - Date.parse(start) >= SHARED_CONFIG.reservation.minimumParkingMinutes * 60_000,
  { path: ["end"], message: "Khoảng đặt phải dài ít nhất 30 phút." },
);
export type ReserveParkingInput = z.infer<typeof reserveParkingSchema>;

export async function reserveParking(_actor: Actor, _input: ReserveParkingInput): Promise<ParkingReservationView> {
  // TODO [Tài — UC05 tổng hợp]: owner + PRIVATE + future time + overlap on
  // both slot and vehicle, in one RPC. Future reservations do not change occupancy.
  throw notImplemented("UC05 — Đặt chỗ đỗ");
}
