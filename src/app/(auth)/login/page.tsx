import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { requireActor } from "@/lib/auth/require-actor";
import { AppError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let destination: string | undefined;
  try {
    const actor = await requireActor(["STUDENT", "OPERATOR"]);
    destination = actor.role === "OPERATOR" ? "/operator" : "/hubs";
  } catch (error) {
    // Keep login available for missing/invalid sessions and explain profile/setup errors.
    if (!(error instanceof AppError)) throw error;
    if (error.status === 403) redirect("/access-denied");
    if (error.status !== 401 && error.status !== 503) throw error;
  }
  if (destination) redirect(destination);
  return <LoginForm />;
}
