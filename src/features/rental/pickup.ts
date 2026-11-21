
import { z } from "zod";
import { mutationSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { RentalCommandResult } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";

export const pickupSchema = mutationSchema.extend({
  pickupCode: z.string().trim().toUpperCase().regex(/^[A-Z2-7]{12,64}$/),
}).strict();

export type PickupInput = z.infer<typeof pickupSchema>;

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
    switch (error.code) {
      case "PT400":
      case "22P02":
        throw new AppError(
          "INVALID_INPUT",
          "ID hoặc mã nhận xe không hợp lệ.",
          400,
        );

      case "PT401":
        throw new AppError(
          "UNAUTHENTICATED",
          "Vui lòng đăng nhập.",
          401,
        );

      case "PT403":
        throw new AppError(
          error.message === "OWNERSHIP_REQUIRED"
            ? "OWNERSHIP_REQUIRED"
            : "FORBIDDEN",
          error.message === "OWNERSHIP_REQUIRED"
            ? "Lượt đặt không thuộc tài khoản này."
            : "Bạn không có quyền nhận xe.",
          403,
        );

      case "PT404":
        throw new AppError(
          "NOT_FOUND",
          "Không tìm thấy lượt đặt xe.",
          404,
        );

      case "PT409":
        if (error.message === "RESERVATION_EXPIRED") {
          throw new AppError(
            "RESERVATION_EXPIRED",
            "Lượt giữ xe đã hết hạn.",
            409,
          );
        }

        if (error.message === "RESERVATION_BLOCKED") {
          throw new AppError(
            "RESERVATION_BLOCKED",
            "Mã nhận xe không đúng.",
            409,
          );
        }

        if (error.message === "VEHICLE_UNAVAILABLE") {
          throw new AppError(
            "VEHICLE_UNAVAILABLE",
            "Xe không còn sẵn sàng để nhận.",
            409,
          );
        }

        if (error.message === "HUB_MAINTENANCE") {
          throw new AppError(
            "HUB_MAINTENANCE",
            "Hub đang bảo trì.",
            409,
          );
        }

        throw new AppError(
          "INVALID_STATE",
          "Lượt đặt không còn ở trạng thái có thể nhận xe.",
          409,
        );

      case "PT503":
        if (error.message === "DEVICE_FAILURE") {
          return {
            command: {
              id: input.requestId,
              kind: "PICKUP",
              state: "FAILURE",
              updatedAt: new Date().toISOString(),
            },
          };
        }
        break;
    }

    if (
      ["PGRST202", "PGRST205", "08000", "08006", "57014"].includes(
        error.code ?? "",
      ) ||
      error.message === "TypeError: fetch failed"
    ) {
      throw new AppError(
        "DATABASE_UNAVAILABLE",
        "Chưa kết nối được chức năng nhận xe. Kiểm tra migration và Supabase.",
        503,
        true,
      );
    }

    throw new AppError(
      "INTERNAL_ERROR",
      "Không thể nhận xe. Vui lòng báo mã yêu cầu cho nhóm.",
      500,
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !data.command ||
    data.command.state !== "SUCCESS" ||
    !data.trip
  ) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Kết quả nhận xe từ database không hợp lệ.",
      500,
    );
  }

  return data as RentalCommandResult;
}
