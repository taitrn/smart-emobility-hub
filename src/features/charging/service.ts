import { z } from "zod";
import { mutationSchema, timestampSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import { notImplemented } from "../../lib/http/errors.ts";

export const chargingRequestSchema = mutationSchema.extend({
  vehicleId: uuidSchema,
  vehicleKind: z.enum(["SHARED", "PRIVATE"]),
  hubId: uuidSchema,
  desiredDepartureAt: timestampSchema.optional(),
}).strict();
export type ChargingRequestInput = z.infer<typeof chargingRequestSchema>;

// TODO [Việt Anh, Tài hỗ trợ — đề xuất]: verify owner, queue by battery/departure, FIFO.
export async function requestCharging(_actor: Actor, _input: ChargingRequestInput): Promise<{ id: string; status: "WAITING" | "CHARGING" }> {
  throw notImplemented("UC06 — Yêu cầu sạc");
}
