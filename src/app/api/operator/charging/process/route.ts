import { processChargingQueue } from "@/features/charging/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST() {
  return handleApi(async context => {
    const actor = await requireActor(["OPERATOR"]);
    return success(await processChargingQueue(actor), context.requestId);
  });
}
