import "server-only";
import type { Actor, Role } from "../domain/types.ts";
import { notImplemented } from "../http/errors.ts";

// TODO [Tài — Auth/data]: verify Supabase identity and trusted app_users role.
// Operator demo covers the network; no operator_hubs table needed for MVP.
// Never trust a role from the request or return a hardcoded actor.
// Until implemented, protected handlers fail closed.
export async function requireActor(allowedRoles: readonly Role[]): Promise<Actor> {
  throw notImplemented(`Auth/data (${allowedRoles.join("/")})`);
}
