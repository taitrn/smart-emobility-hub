import { requireActor } from "@/lib/auth/require-actor";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";
export function GET() {
  return handleApi(async context => success(await requireActor(["STUDENT", "OPERATOR"]), context.requestId));
}
