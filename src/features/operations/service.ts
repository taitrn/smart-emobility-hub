import { z } from "zod";
import type { Actor } from "../../lib/domain/types.ts";
import { mutationSchema } from "../../lib/domain/schemas";
import { AppError } from "../../lib/http/errors";
import { createClient } from "../../lib/supabase/server";
import { getHub, listHubs } from "../hubs/service";

export const resourceStatusSchema = mutationSchema.extend({
  resourceKind: z.enum(["VEHICLE", "CHARGING_POINT"]),
  status: z.enum(["AVAILABLE", "OUT_OF_SERVICE"]),
}).strict();

function requireOperator(actor: Actor) {
  if (actor.role !== "OPERATOR") {
    throw new AppError("FORBIDDEN", "Chỉ Operator được thao tác vận hành.", 403);
  }
}

// TODO [Ân, Toàn hỗ trợ — đề xuất]: summarize Hubs/assets and add simulated fault controls.
export async function getOperatorOverview(actor: Actor) {
  requireOperator(actor);
  const overview = await listHubs({});
  const hubs = await Promise.all(overview.hubs.map(async hub => {
    const details = await getHub(hub.id);
    return {
      ...hub,
      vehicles: details.vehicles,
      spaces: details.spaces,
      chargingPoints: details.chargingPoints,
    };
  }));

  return { hubs, asOf: overview.asOf };
}

export async function setResourceStatus(
  actor: Actor,
  id: string,
  input: z.infer<typeof resourceStatusSchema>,
) {
  requireOperator(actor);
  const db = await createClient();
  const table = input.resourceKind === "VEHICLE" ? "shared_vehicles" : "charging_points";
  const previousStatus = input.status === "AVAILABLE" ? "OUT_OF_SERVICE" : "AVAILABLE";

  const { data, error } = await db.from(table)
    .update({ status: input.status })
    .eq("id", id)
    .eq("enabled", true)
    .eq("status", previousStatus)
    .select("id,status")
    .maybeSingle();

  if (error) {
    throw new AppError("DATABASE_UNAVAILABLE", "Không thể cập nhật trạng thái thiết bị.", 503);
  }
  if (data) return { ...data, resourceKind: input.resourceKind };

  const existing = await db.from(table).select("id").eq("id", id).maybeSingle();
  if (existing.error) {
    throw new AppError("DATABASE_UNAVAILABLE", "Không thể đọc trạng thái thiết bị.", 503);
  }
  if (!existing.data) {
    throw new AppError("NOT_FOUND", "Không tìm thấy thiết bị.", 404);
  }
  throw new AppError("INVALID_STATE", "Trạng thái thiết bị không cho phép thao tác này.", 409);
}