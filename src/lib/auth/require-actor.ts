import "server-only";
import type { Actor, Role } from "../domain/types.ts";
import { AppError } from "../http/errors.ts";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { verifyRole } from "./policy";

export async function requireActor(allowedRoles: readonly Role[]): Promise<Actor> {
  if (!isSupabaseConfigured()) throw new AppError("DATABASE_UNAVAILABLE", "Chưa cấu hình Supabase.", 503);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new AppError("UNAUTHENTICATED", "Vui lòng đăng nhập.", 401);
  const { data: profile, error } = await supabase.from("app_users").select("role").eq("id", user.id).maybeSingle();
  if (error) throw new AppError("DATABASE_UNAVAILABLE", "Không thể đọc hồ sơ tài khoản. Kiểm tra migration và quyền dữ liệu.", 503);
  const role = verifyRole(profile?.role, allowedRoles);
  // MVP Operator manages all demo Hubs; hubIds is not an authorization mechanism.
  return { id: user.id, role, hubIds: [] };
}
