import { z } from "zod";
import { completeCharging } from "@/features/charging/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { mutationSchema } from "@/lib/domain/schemas";
import { success } from "@/lib/http/response";

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async apiContext => {
    const actor = await requireActor(["OPERATOR"]);
    const input = await readJson(request, mutationSchema);
    apiContext.requestId = input.requestId;
    const { id } = await context.params;
    z.uuid().parse(id);
    return success(await completeCharging(actor, id, input.requestId), apiContext.requestId);
  });
}
