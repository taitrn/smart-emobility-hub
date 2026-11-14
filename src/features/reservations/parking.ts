import { z } from "zod";
import { SHARED_CONFIG } from "../../config/shared.ts";
import {
  mutationSchema,
  timestampSchema,
  uuidSchema,
} from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { ParkingReservationView } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";

export const reserveParkingSchema = mutationSchema
  .extend({
    privateVehicleId: uuidSchema,
    slotId: uuidSchema,
    start: timestampSchema,
    end: timestampSchema,
  })
  .strict()
  .refine(
    ({ start, end }) =>
      Date.parse(end) - Date.parse(start) >=
      SHARED_CONFIG.reservation.minimumParkingMinutes * 60_000,
    { path: ["end"], message: "Khoảng đặt phải dài ít nhất 30 phút." },
  );
export type ReserveParkingInput = z.infer<typeof reserveParkingSchema>;

export const parkingEventSchema = mutationSchema
  .extend({ reservationId: uuidSchema, event: z.enum(["ARRIVED", "DEPARTED"]) })
  .strict();
export async function parkingCommand(action: string, input: object) {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc("parking_command", {
    p_action: action,
    p_payload: input,
  });
  if (error) {
    const errors: Record<string, [number, string]> = {
      INVALID_INPUT: [400, "Giờ đặt không hợp lệ hoặc đã ở quá khứ."],
      UNAUTHENTICATED: [401, "Vui lòng đăng nhập."],
      FORBIDDEN: [403, "Không có quyền thực hiện."],
      OWNERSHIP_REQUIRED: [403, "Xe hoặc lượt đặt không thuộc tài khoản này."],
      NOT_FOUND: [404, "Không tìm thấy xe, chỗ hoặc lượt đặt."],
      PARKING_OVERLAP: [
        409,
        "Khoảng giờ trùng lịch trên cùng chỗ hoặc cùng xe.",
      ],
      SLOT_BUSY: [409, "Chỗ đỗ hoặc xe chưa sẵn sàng."],
      INVALID_STATE: [
        409,
        "Trạng thái hoặc thời gian không cho phép thao tác.",
      ],
      HUB_MAINTENANCE: [409, "Hub đang bảo trì."],
    };
    const entry = errors[error.message];
    if (entry)
      throw new AppError(
        error.message as import("../../lib/http/errors.ts").ErrorCode,
        entry[1],
        entry[0],
      );
    throw new AppError(
      "DATABASE_UNAVAILABLE",
      "Không thể xử lý parking. Kiểm tra migration 002 và thử lại.",
      503,
      true,
    );
  }
  return data as ParkingReservationView;
}
export async function reserveParking(
  _actor: Actor,
  input: ReserveParkingInput,
): Promise<ParkingReservationView> {
  return parkingCommand("RESERVE", input);
}
export async function parkingData() {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const [reservations, vehicles, slots] = await Promise.all([
    db
      .from("parking_reservations")
      .select("id,private_vehicle_id,slot_id,starts_at,ends_at,status")
      .order("starts_at"),
    db.from("private_vehicles").select("id,plate_number"),
    db
      .from("parking_spaces")
      .select("id,code,hub_id,occupancy_status")
      .eq("space_kind", "PRIVATE")
      .eq("enabled", true)
      .order("code"),
  ]);
  if ([reservations, vehicles, slots].some((r) => r.error))
    throw new AppError(
      "DATABASE_UNAVAILABLE",
      "Chưa đọc được parking. Cần áp migration 002 cho môi trường đang thử.",
      503,
    );
  return {
    reservations: reservations.data ?? [],
    vehicles: vehicles.data ?? [],
    slots: slots.data ?? [],
  };
}
