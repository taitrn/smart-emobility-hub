import { z } from "zod";
import { mutationSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { RentalCommandResult } from "../../lib/domain/views.ts";
import { notImplemented } from "../../lib/http/errors.ts";

export const pickupSchema = mutationSchema.extend({
  pickupCode: z.string().trim().toUpperCase().regex(/^[A-Z2-7]{12,64}$/),
}).strict();
export type PickupInput = z.infer<typeof pickupSchema>;

export async function pickupVehicle(_actor: Actor, _reservationId: string, _input: PickupInput): Promise<RentalCommandResult> {
  // TODO [Toàn — UC03]: verify owner/code/deadline, simulate immediate success/failure.
  // Create one Trip only on success; no persistent command or pending ACK needed.
  throw notImplemented("UC03 — Nhận xe");
}
