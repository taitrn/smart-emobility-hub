import { reserveVehicle, reserveVehicleSchema } from "@/features/reservations/vehicle";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

// TODO [Tiến — UC02]: implement reservation transaction using the authenticated actor.
export function POST(request: Request) {
  return handleApi(async context => {
    const input = await readJson(request, reserveVehicleSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["STUDENT"]);
    return success(await reserveVehicle(actor, input), context.requestId, 201);
  });
}
