import { z } from "zod";
import { mutationSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { RentalCommandResult } from "../../lib/domain/views.ts";
import { AppError, type ErrorCode } from "../../lib/http/errors.ts";

export const pickupSchema = mutationSchema.extend({
  pickupCode: z.string().trim().toUpperCase().regex(/^[A-Z2-7]{12,64}$/),
}).strict();
export type PickupInput = z.infer<typeof pickupSchema>;

const pickupErrors: Partial<Record<ErrorCode, [number, string]>> = {
  INVALID_INPUT: [400, "Mã nhận xe hoặc yêu cầu không hợp lệ."],
  UNAUTHENTICATED: [401, "Vui lòng đăng nhập."],
  FORBIDDEN: [403, "Bạn không có quyền nhận xe."],
  OWNERSHIP_REQUIRED: [403, "Lượt đặt không thuộc tài khoản này."],
  NOT_FOUND: [404, "Không tìm thấy lượt đặt xe."],
  INVALID_STATE: [409, "Lượt đặt không còn ở trạng thái có thể nhận xe."],
  RESERVATION_EXPIRED: [409, "Lượt giữ xe đã hết hạn."],
  RESERVATION_BLOCKED: [409, "Mã nhận xe không đúng."],
  VEHICLE_UNAVAILABLE: [409, "Xe không còn sẵn sàng để nhận."],
  HUB_MAINTENANCE: [409, "Hub đang bảo trì."],
  DEVICE_FAILURE: [503, "Thiết bị mở khóa mô phỏng thất bại."],
};

export async function pickupVehicle(
  actor: Actor,
  reservationId: string,
  input: PickupInput,
): Promise<RentalCommandResult> {
  if (actor.role !== "STUDENT") {
    throw new AppError("FORBIDDEN", "Bạn không có quyền nhận xe.", 403);
  }

  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc("pickup_command", {
    p_reservation_id: reservationId,
    p_pickup_code: input.pickupCode,
  });

  if (error) {
    const mapped = pickupErrors[error.message as ErrorCode];
    if (mapped) {
      throw new AppError(error.message as ErrorCode, mapped[1], mapped[0], error.message === "DEVICE_FAILURE");
    }
    if (error.code === "22P02") {
      throw new AppError("INVALID_INPUT", "ID hoặc mã nhận xe không hợp lệ.", 400);
    }
    if (["PGRST202", "PGRST205", "08000", "08006", "57014"].includes(error.code ?? "") ||
        error.message === "TypeError: fetch failed") {
      throw new AppError("DATABASE_UNAVAILABLE", "Chưa kết nối được chức năng nhận xe. Kiểm tra migration và Supabase.", 503, true);
    }
    throw new AppError("INTERNAL_ERROR", "Không thể nhận xe. Vui lòng báo mã yêu cầu cho nhóm.", 500);
  }

  if (!data || typeof data !== "object" || Array.isArray(data) ||
      !data.command || data.command.state !== "SUCCESS" || !data.trip) {
    throw new AppError("INTERNAL_ERROR", "Kết quả nhận xe từ database không hợp lệ.", 500);
  }

  return data as RentalCommandResult;
}
