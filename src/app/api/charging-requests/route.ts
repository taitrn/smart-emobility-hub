import { chargingRequestSchema, requestCharging } from "@/features/charging/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST(request: Request) {
  return handleApi(async context => {
    const input = await readJson(request, chargingRequestSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["STUDENT"]);
    return success(await requestCharging(actor, input), context.requestId, 201);
  });
}
