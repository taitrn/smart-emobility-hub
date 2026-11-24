import { pickupSchema, pickupVehicle } from "@/features/rental/pickup";
import { rentalResponse } from "@/features/rental/response";
import { requireActor } from "@/lib/auth/require-actor";
import { uuidSchema } from "@/lib/domain/schemas";
import { handleApi, readJson } from "@/lib/http/handler";

export function POST(request: Request, route: RouteContext<"/api/vehicle-reservations/[id]/pickup">) {
  return handleApi(async context => {
    const actor = await requireActor(["STUDENT"]);
    const id = uuidSchema.parse((await route.params).id);
    const input = await readJson(request, pickupSchema, context);
    context.requestId = input.requestId;
    return rentalResponse(await pickupVehicle(actor, id, input), context.requestId);
  });
}
