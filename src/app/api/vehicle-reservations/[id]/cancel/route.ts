import { cancelVehicle, cancelVehicleSchema } from "@/features/reservations/vehicle";
import { requireActor } from "@/lib/auth/require-actor";
import { uuidSchema } from "@/lib/domain/schemas";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST(
  request: Request,
  route: RouteContext<"/api/vehicle-reservations/[id]/cancel">,
) {
  return handleApi(async context => {
    await requireActor(["STUDENT"]);
    const id = uuidSchema.parse((await route.params).id);
    await readJson(request, cancelVehicleSchema, context);
    return success(await cancelVehicle(id), context.requestId);
  });
}
