import { getOperatorOverview } from "@/features/operations/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function GET() {
  return handleApi(async context => {
    const actor = await requireActor(["OPERATOR"]);
    return success(await getOperatorOverview(actor), context.requestId);
  });
}
