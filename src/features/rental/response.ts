import type { RentalCommandResult } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";
import { success } from "../../lib/http/response";

// Shared by pickup/return. A device FAILURE must not become ok:true.
export function rentalResponse(result: RentalCommandResult, requestId: string) {
  if (result.command.state === "FAILURE") {
    throw new AppError("DEVICE_FAILURE", "Thiết bị chưa xác nhận thao tác thành công.", 503);
  }
  return success(result, requestId, result.command.state === "SUCCESS" ? 200 : 202);
}
