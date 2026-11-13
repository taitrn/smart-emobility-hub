import type { Role } from "../domain/types.ts";
import { AppError } from "../http/errors.ts";

export function verifyRole(role: unknown, allowed: readonly Role[]): Role {
  if (role !== "STUDENT" && role !== "OPERATOR") {
    throw new AppError("FORBIDDEN", "Tài khoản chưa được cấp vai trò hợp lệ.", 403);
  }
  if (!allowed.includes(role)) throw new AppError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.", 403);
  return role;
}
