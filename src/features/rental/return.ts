import { z } from "zod";
import { mutationSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { RentalCommandResult } from "../../lib/domain/views.ts";
import { notImplemented } from "../../lib/http/errors.ts";

export const returnSchema = mutationSchema.extend({ hubId: uuidSchema, slotId: uuidSchema }).strict();
export type ReturnInput = z.infer<typeof returnSchema>;

export async function returnVehicle(_actor: Actor, _tripId: string, _input: ReturnInput): Promise<RentalCommandResult> {
  // TODO [Ân — UC04]: own ACTIVE trip + free FLEET slot; immediate simulated lock.
  // Complete and update resources together only on success.
  throw notImplemented("UC04 — Trả xe");
}
