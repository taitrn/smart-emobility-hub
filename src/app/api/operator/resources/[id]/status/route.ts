import { resourceStatusSchema, setResourceStatus } from "@/features/operations/service";
import { requireActor } from "@/lib/auth/require-actor";
import { uuidSchema } from "@/lib/domain/schemas";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST(request: Request, route: RouteContext<"/api/operator/resources/[id]/status">) {
  return handleApi(async context => {
    const actor = await requireActor(["OPERATOR"]);
    const id = uuidSchema.parse((await route.params).id);
    const input = await readJson(request, resourceStatusSchema, context);
    return success(await setResourceStatus(actor, id, input), context.requestId);
  });
}