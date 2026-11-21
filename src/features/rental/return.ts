import { z } from "zod";
import { mutationSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { RentalCommandResult, TripView } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";

export const returnSchema = mutationSchema.extend({ hubId: uuidSchema, slotId: uuidSchema }).strict();
export type ReturnInput = z.infer<typeof returnSchema>;

type TripRow = {
  id: string;
  vehicle_id: string;
  reservation_id: string;
  status: TripView["status"];
  started_at: string;
  ended_at: string | null;
  return_hub_id: string | null;
  return_slot_id: string | null;
};

function tripView(row: TripRow): TripView {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    reservationId: row.reservation_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    returnHubId: row.return_hub_id ?? undefined,
    returnSlotId: row.return_slot_id ?? undefined,
  };
}

export async function returnVehicle(actor: Actor, tripId: string, input: ReturnInput): Promise<RentalCommandResult> {
  if (actor.role !== "STUDENT") throw new AppError("FORBIDDEN", "Chỉ Student được trả xe.", 403);
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc("return_fleet_vehicle", {
    p_trip_id: tripId,
    p_hub_id: input.hubId,
    p_slot_id: input.slotId,
  }).single<TripRow>();

  if (error) {
    switch (error.code) {
      case "PT403":
        throw new AppError("FORBIDDEN", "Chỉ Student được trả xe.", 403);
      case "PT404":
        throw new AppError("NOT_FOUND", "Không tìm thấy chuyến đi của bạn.", 404);
      case "PT409":
        if (error.message === "SLOT_BUSY")
          throw new AppError("SLOT_BUSY", "Chỗ đỗ đã hết trống hoặc đang ngừng sử dụng. Hãy chọn lại.", 409);
        throw new AppError("INVALID_STATE", "Chuyến hoặc xe không còn ở trạng thái có thể trả.", 409);
      case "PT400":
        throw new AppError("INVALID_INPUT", "Hãy chọn chỗ FLEET thuộc Hub đã chọn.", 400);
      case "PT503":
        return {
          command: { id: input.requestId, kind: "RETURN", state: "FAILURE", updatedAt: new Date().toISOString() },
        };
    }
  }
  if (error || !data)
    throw new AppError("DATABASE_UNAVAILABLE", "Không thể xác nhận kết quả trả xe. Hãy tải lại trang để kiểm tra chuyến.", 503, true);

  return {
    command: { id: input.requestId, kind: "RETURN", state: "SUCCESS", updatedAt: data.ended_at! },
    trip: tripView(data),
  };
}

export type ReturnHub = {
  id: string;
  code: string;
  name: string;
  slots: { id: string; code: string }[];
};

export async function loadTrips(actor: Actor) {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const [trips, hubs, slots, vehicles] = await Promise.all([
    db.from("trips").select("id,vehicle_id,reservation_id,status,started_at,ended_at,return_hub_id,return_slot_id")
      .eq("owner_id", actor.id).order("status").order("started_at", { ascending: false }).limit(30),
    db.from("mobility_hubs").select("id,code,name").order("code"),
    db.from("parking_spaces").select("id,hub_id,code").eq("enabled", true)
      .eq("space_kind", "FLEET").eq("occupancy_status", "FREE").order("code"),
    db.from("shared_vehicles").select("id,code,slot_id"),
  ]);
  if (trips.error || hubs.error || slots.error || vehicles.error)
    throw new AppError("DATABASE_UNAVAILABLE", "Không đọc được dữ liệu chuyến đi. Hãy kiểm tra schema UC04 trên database thử nghiệm.", 503);
  const occupied = new Set(vehicles.data.map(vehicle => vehicle.slot_id));
  const returnHubs: ReturnHub[] = hubs.data.map(hub => ({
    ...hub,
    slots: slots.data.filter(slot => slot.hub_id === hub.id && !occupied.has(slot.id)),
  }));
  return {
    trips: trips.data.map(tripView),
    hubs: returnHubs,
    vehicleCodes: Object.fromEntries(vehicles.data.map(vehicle => [vehicle.id, vehicle.code])),
  };
}
