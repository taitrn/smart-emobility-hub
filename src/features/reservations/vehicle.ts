import { z } from "zod";
import { mutationSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { VehicleReservationView } from "../../lib/domain/views.ts";
import { notImplemented } from "../../lib/http/errors.ts";

export const reserveVehicleSchema = mutationSchema.extend({ vehicleId: uuidSchema }).strict();
export type ReserveVehicleInput = z.infer<typeof reserveVehicleSchema>;

export async function reserveVehicle(_actor: Actor, _input: ReserveVehicleInput): Promise<VehicleReservationView> {
  // TODO [Tiến — UC02]: owner, availability, one active hold and server deadline.
  // Use constraints/transaction to prevent duplicate reservations. Add cancel here.
  throw notImplemented("UC02 — Giữ xe");
}
