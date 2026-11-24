import { getHub } from "@/features/hubs/service";
import { uuidSchema } from "@/lib/domain/schemas";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";
export function GET(_request: Request, route: RouteContext<"/api/hubs/[id]">) {
  return handleApi(async (ctx) =>
    success(
      await getHub(uuidSchema.parse((await route.params).id)),
      ctx.requestId,
    ),
  );
}
