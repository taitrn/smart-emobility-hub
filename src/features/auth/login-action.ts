"use server";

import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/require-actor";
import { AppError } from "@/lib/http/errors";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function loginDestination(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return "/login?error=credentials";
  }
  if (!isSupabaseConfigured()) return "/login?error=setup";

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.status === 429) return "/login?error=rate-limit";
      return error.status && error.status < 500 ? "/login?error=credentials" : "/login?error=connection";
    }

    try {
      const actor = await requireActor(["STUDENT", "OPERATOR"]);
      return actor.role === "OPERATOR" ? "/operator" : "/hubs";
    } catch (profileError) {
      await supabase.auth.signOut({ scope: "local" });
      if (profileError instanceof AppError && profileError.status === 403) return "/access-denied";
      return "/login?error=profile";
    }
  } catch {
    return "/login?error=connection";
  }
}

export async function loginAction(formData: FormData) {
  redirect(await loginDestination(formData));
}
