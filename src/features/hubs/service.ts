import { z } from "zod";
import type { HubListView } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";

export const hubQuerySchema = z
  .object({
    status: z.enum(["ACTIVE", "MAINTENANCE"]).optional(),
    q: z.string().trim().max(100).optional(),
    vehicleType: z.string().trim().min(1).max(40).optional(),
    minBattery: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .optional(),
  })
  .strict();
export type HubQuery = z.infer<typeof hubQuerySchema>;

async function resources(hubId?: string) {
  const { isSupabaseConfigured } = await import("../../lib/supabase/config");
  if (!isSupabaseConfigured())
    throw new AppError("DATABASE_UNAVAILABLE", "Chưa cấu hình Supabase.", 503);
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const scope = (column: string) => (hubId ? { [column]: hubId } : {});
  const [hubs, vehicles, spaces, points] = await Promise.all([
    db
      .from("mobility_hubs")
      .select("id,code,name,latitude,longitude,status")
      .match(scope("id"))
      .order("code"),
    db
      .from("shared_vehicles")
      .select("id,hub_id,code,vehicle_type,battery_percent,status")
      .match(scope("hub_id"))
      .eq("enabled", true)
      .order("code"),
    db
      .from("parking_spaces")
      .select("id,hub_id,code,space_kind,occupancy_status")
      .match(scope("hub_id"))
      .eq("enabled", true)
      .order("code"),
    db
      .from("charging_points")
      .select("id,hub_id,code,status")
      .match(scope("hub_id"))
      .eq("enabled", true)
      .order("code"),
  ]);
  if ([hubs, vehicles, spaces, points].some((r) => r.error))
    throw new AppError(
      "DATABASE_UNAVAILABLE",
      "Không thể đọc tài nguyên Hub. Vui lòng thử lại.",
      503,
      true,
    );
  return {
    hubs: hubs.data ?? [],
    vehicles: vehicles.data ?? [],
    spaces: spaces.data ?? [],
    points: points.data ?? [],
  };
}

export async function listHubs(query: HubQuery): Promise<HubListView> {
  const { summarizeHubs } = await import("./summary.ts");
  return summarizeHubs(await resources(), query);
}

export async function getHub(id: string) {
  const data = await resources(id);
  const hub = data.hubs.find((h) => h.id === id);
  if (!hub) throw new AppError("NOT_FOUND", "Không tìm thấy Hub.", 404);
  return {
    hub,
    vehicles: data.vehicles,
    spaces: data.spaces,
    chargingPoints: data.points,
    asOf: new Date().toISOString(),
  };
}
