import { z } from "zod";
import { parkingWindowError, validParkingOffset } from "./parking-rules.ts";
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
    start: timestampSchema.refine(validParkingOffset, "Múi giờ tối đa ±14:00."),
    end: timestampSchema.refine(validParkingOffset, "Múi giờ tối đa ±14:00."),
  })
  .strict()
  .superRefine(({ start, end }, ctx) => {
    const message = parkingWindowError(start, end);
    if (message) ctx.addIssue({ code: "custom", path: ["end"], message });
  });
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
    if (error.code?.startsWith("22"))
      throw new AppError(
        "INVALID_INPUT",
        "Ngày giờ hoặc ID không hợp lệ.",
        400,
      );
    if (
      ["PGRST202", "PGRST205", "08000", "08006", "57014"].includes(
        error.code,
      ) ||
      error.message === "TypeError: fetch failed"
    )
      throw new AppError(
        "DATABASE_UNAVAILABLE",
        "Chưa kết nối được dịch vụ parking. Kiểm tra cấu hình/migration.",
        503,
        true,
      );
    errors.REQUEST_ID_REUSED = [
      409,
      "Mã yêu cầu đã được dùng với nội dung khác.",
    ];
    const detailMessages: Record<string, string> = {
      ARRIVAL_TOO_EARLY: "Chưa tới giờ bắt đầu lượt đặt.",
      ARRIVAL_TOO_LATE: "Đã quá giờ kết thúc lượt đặt.",
      SLOT_OVERLAP: "Chỗ đỗ đã có lịch trong khoảng giờ này.",
      VEHICLE_OVERLAP: "Xe đã có lịch đỗ trong khoảng giờ này.",
    };
    const entry = errors[error.message];
    if (entry && detailMessages[error.details])
      throw new AppError(
        error.message as import("../../lib/http/errors.ts").ErrorCode,
        detailMessages[error.details],
        entry[0],
      );
    if (entry)
      throw new AppError(
        error.message as import("../../lib/http/errors.ts").ErrorCode,
        entry[1],
        entry[0],
      );
    throw new AppError(
      "INTERNAL_ERROR",
      "Không thể xử lý parking. Vui lòng báo mã yêu cầu cho nhóm.",
      500,
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
export async function parkingData(page = 1, status?: string) {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const [reservations, vehicles, slots] = await Promise.all([
    db.rpc("parking_list", {
      p_limit: 10,
      p_offset: (page - 1) * 10,
      p_status: status ?? null,
    }),
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
      "Chưa đọc được parking. Cần áp migration parking mới nhất cho môi trường đang thử.",
      503,
    );
  return {
    reservations: reservations.data?.reservations ?? [],
    total: reservations.data?.total ?? 0,
    vehicles: vehicles.data ?? [],
    slots: slots.data ?? [],
  };
}
