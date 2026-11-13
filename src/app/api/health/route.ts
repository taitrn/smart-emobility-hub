import { success } from "@/lib/http/response";

// App liveness only. Does not contact Supabase or claim DB readiness.
export function GET() {
  return success({ service: "smart-emobility-hub", status: "ok", scope: "app-only" });
}
