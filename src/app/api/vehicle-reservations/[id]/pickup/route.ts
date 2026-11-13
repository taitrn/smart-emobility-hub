import { pickupSchema, pickupVehicle } from "@/features/rental/pickup";
import { rentalResponse } from "@/features/rental/response";
import { requireActor } from "@/lib/auth/require-actor";
import { uuidSchema } from "@/lib/domain/schemas";
import { handleApi, readJson } from "@/lib/http/handler";

// TODO [Toàn — UC03]: simulate immediate success/failure; no pending ACK workflow required.
export function POST(request: Request, route: RouteContext<"/api/vehicle-reservations/[id]/pickup">) {
  return handleApi(async context => {
    const id = uuidSchema.parse((await route.params).id);
    const input = await readJson(request, pickupSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["STUDENT"]);
    return rentalResponse(await pickupVehicle(actor, id, input), context.requestId);
  });
}
