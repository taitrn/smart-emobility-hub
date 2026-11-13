import "server-only";
import { redirect } from "next/navigation";
import { requireActor } from "./require-actor";
import type { Role } from "../domain/types.ts";
import { AppError } from "../http/errors.ts";
export async function requirePageRole(role: Role) {
  try { await requireActor([role]); }
  catch (error) {
    if (error instanceof AppError && error.status === 401) redirect("/login");
    if (error instanceof AppError && error.status === 403) redirect("/access-denied");
    if (error instanceof AppError && error.status === 503) redirect("/setup-required");
    throw error;
  }
}
