import { z } from "zod";
import type { HubListView } from "../../lib/domain/views.ts";
import { notImplemented } from "../../lib/http/errors.ts";

export const hubQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  vehicleType: z.string().trim().min(1).max(40).optional(),
  minBattery: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).pipe(z.number().min(0).max(100)).optional(),
}).strict();
export type HubQuery = z.infer<typeof hubQuerySchema>;

export async function listHubs(_query: HubQuery): Promise<HubListView> {
  // TODO [Tài — UC01]: read public-safe views, filters, availability and source
  // timestamp. No reservation IDs, pickup codes or other users' private data.
  throw notImplemented("UC01 — Tra cứu Hub");
}
