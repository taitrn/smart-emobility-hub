import { z } from "zod";
import { SHARED_CONFIG } from "../../config/shared.ts";
import { mutationSchema, timestampSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { ChargingSessionView } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";

export const chargingRequestSchema = mutationSchema.extend({
  vehicleId: uuidSchema,
  vehicleKind: z.enum(["SHARED", "PRIVATE"]),
  hubId: uuidSchema,
  desiredDepartureAt: timestampSchema.optional(),
}).strict();
export type ChargingRequestInput = z.infer<typeof chargingRequestSchema>;

export function chargingPriority(
  batteryPercent: number,
  desiredDepartureAt?: string,
  now = Date.now(),
): "HIGH" | "NORMAL" {
  if (batteryPercent <= SHARED_CONFIG.charging.priorityBatteryPercent) return "HIGH";
  if (desiredDepartureAt) {
    const departure = Date.parse(desiredDepartureAt);
    if (Number.isFinite(departure)) {
      const minutes = (departure - now) / 60000;
      if (minutes >= 0 && minutes <= SHARED_CONFIG.charging.priorityDepartureMinutes)
        return "HIGH";
    }
  }
  return "NORMAL";
}

function chargingError(error: { code?: string; message?: string }): never {
  const messages: Record<string, [number, string]> = {
    UNAUTHENTICATED: [401, "Vui lòng đăng nhập."],
    FORBIDDEN: [403, "Không có quyền thực hiện."],
    OWNERSHIP_REQUIRED: [403, "Xe không thuộc tài khoản này hoặc không ở Hub đã chọn."],
    NOT_FOUND: [404, "Không tìm thấy xe, Hub hoặc phiên sạc."],
    VEHICLE_INELIGIBLE: [409, "Xe không sẵn sàng để sạc."],
    HUB_MAINTENANCE: [409, "Hub đang bảo trì."],
    RESERVATION_BLOCKED: [409, "Giờ rời dự kiến không được ở quá khứ."],
    INVALID_STATE: [409, "Phiên sạc không ở trạng thái có thể hoàn tất."],
    REQUEST_ID_REUSED: [409, "Mã yêu cầu đã được dùng với nội dung khác."],
  };
  const entry = messages[error.message ?? ""];
  if (entry) throw new AppError(error.message as import("../../lib/http/errors.ts").ErrorCode, entry[1], entry[0]);
  throw new AppError("DATABASE_UNAVAILABLE", "Không thể xử lý phiên sạc. Kiểm tra migration 005.", 503, true);
}

async function chargeRpc(action: string, payload: object) {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc("charging_command", {
    p_action: action,
    p_payload: payload,
  });
  if (error) chargingError(error);
  return data as unknown;
}

export async function requestCharging(
  _actor: Actor,
  input: ChargingRequestInput,
): Promise<{ id: string; status: "WAITING" | "CHARGING" }> {
  const data = await chargeRpc("REQUEST", input) as { id: string; status: "WAITING" | "CHARGING" };
  return data;
}

export async function processChargingQueue(_actor: Actor): Promise<{ processed: number }> {
  const data = await chargeRpc("PROCESS", {}) as { processed: number };
  return data;
}

export async function completeCharging(
  _actor: Actor,
  sessionId: string,
  requestId: string,
): Promise<{ id: string; status: "COMPLETED"; chargingPointId?: string }> {
  const data = await chargeRpc("COMPLETE", { sessionId, requestId }) as {
    id: string;
    status: "COMPLETED";
    chargingPointId?: string;
  };
  return data;
}

export async function listChargingSessions(
  _actor: Actor,
  status?: "WAITING" | "CHARGING" | "COMPLETED" | "FAILED" | "CANCELLED",
): Promise<ChargingSessionView[]> {
  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc("charging_list", { p_status: status ?? null });
  if (error) chargingError(error);
  const rows = (data ?? []) as {
    id: string;
    requester_id: string;
    vehicle_kind: "SHARED" | "PRIVATE";
    shared_vehicle_id: string | null;
    private_vehicle_id: string | null;
    hub_id: string;
    hub_code: string;
    hub_name: string;
    charging_point_id: string | null;
    charging_point_code: string | null;
    battery_percent: number;
    desired_departure_at: string | null;
    priority: "HIGH" | "NORMAL";
    status: "WAITING" | "CHARGING" | "COMPLETED" | "FAILED" | "CANCELLED";
    created_at: string;
    updated_at: string;
    vehicle_code: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    requesterId: row.requester_id,
    vehicleKind: row.vehicle_kind,
    vehicleId: row.shared_vehicle_id ?? row.private_vehicle_id ?? "",
    vehicleCode: row.vehicle_code,
    hubId: row.hub_id,
    hubCode: row.hub_code,
    hubName: row.hub_name,
    chargingPointId: row.charging_point_id ?? undefined,
    chargingPointCode: row.charging_point_code ?? undefined,
    batteryPercent: row.battery_percent,
    desiredDepartureAt: row.desired_departure_at ?? undefined,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
