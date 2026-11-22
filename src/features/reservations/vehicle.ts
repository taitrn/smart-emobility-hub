import { z } from "zod";
import { mutationSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { VehicleReservationView } from "../../lib/domain/views.ts";
import { AppError, type ErrorCode } from "../../lib/http/errors.ts";

export const reserveVehicleSchema = mutationSchema.extend({ vehicleId: uuidSchema }).strict();
export const cancelVehicleSchema = mutationSchema.strict();
export type ReserveVehicleInput = z.infer<typeof reserveVehicleSchema>;

const reservationErrors: Partial<Record<ErrorCode, [number, string]>> = {
  INVALID_INPUT: [400, "Dữ liệu đặt xe không hợp lệ."],
  UNAUTHENTICATED: [401, "Vui lòng đăng nhập."],
  FORBIDDEN: [403, "Chỉ sinh viên có thể đặt hoặc hủy xe."],
  NOT_FOUND: [404, "Không tìm thấy xe hoặc lượt đặt."],
  VEHICLE_UNAVAILABLE: [409, "Xe không còn khả dụng. Vui lòng chọn xe khác."],
  ACTIVE_HOLD_EXISTS: [409, "Bạn đang có một lượt giữ xe. Hãy nhận hoặc hủy lượt đó trước."],
  ACTIVE_TRIP_EXISTS: [409, "Bạn đang có một chuyến đi. Hãy trả xe trước khi đặt lượt mới."],
  HUB_MAINTENANCE: [409, "Hub đang bảo trì."],
  REQUEST_ID_REUSED: [409, "Mã yêu cầu đã được dùng để đặt xe khác."],
  RESERVATION_EXPIRED: [409, "Lượt đặt đã hết hạn."],
  INVALID_STATE: [409, "Xe đã được nhận nên lượt đặt không thể hủy."],
};

type ReservationRpc = "reserve_vehicle" | "cancel_vehicle_reservation" | "list_my_vehicle_reservations";
type ReservationResult = { reservation: VehicleReservationView; created?: boolean };

function throwReservationError(code: string): never {
  const knownCode = code as ErrorCode;
  if (Object.hasOwn(reservationErrors, knownCode)) {
    const [status, message] = reservationErrors[knownCode]!;
    throw new AppError(knownCode, message, status);
  }
  throw new AppError("INTERNAL_ERROR", "Không thể xử lý lượt đặt xe.", 500);
}

async function reservationRpc<T>(name: ReservationRpc, args?: Record<string, string>): Promise<T> {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc(name, args);

  if (error) {
    if (error.code === "PGRST202" || error.code === "PGRST205") {
      throw new AppError("DATABASE_UNAVAILABLE", "Supabase chưa có dịch vụ lượt đặt xe. Kiểm tra migration 005.", 503);
    }
    if (["40001", "40P01", "57014"].includes(error.code)
      || error.code.startsWith("08") || error.code === "") {
      throw new AppError("DATABASE_UNAVAILABLE", "Chưa truy cập được dịch vụ lượt đặt xe. Vui lòng thử lại.", 503, true);
    }
    throwReservationError(error.message);
  }
  if (data?.error) throwReservationError(data.error);
  if (data == null) throwReservationError("INTERNAL_ERROR");
  return data as T;
}

export function reserveVehicle(input: ReserveVehicleInput) {
  return reservationRpc<ReservationResult & { created: boolean }>("reserve_vehicle", {
    p_vehicle_id: input.vehicleId,
    p_request_id: input.requestId,
  });
}

export async function cancelVehicle(id: string) {
  const { reservation } = await reservationRpc<ReservationResult>(
    "cancel_vehicle_reservation", { p_reservation_id: id },
  );
  return reservation;
}

export function listMyVehicleReservations() {
  return reservationRpc<VehicleReservationView[]>("list_my_vehicle_reservations");
}
