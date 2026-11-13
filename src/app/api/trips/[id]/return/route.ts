import { returnSchema, returnVehicle } from "@/features/rental/return";
import { rentalResponse } from "@/features/rental/response";
import { requireActor } from "@/lib/auth/require-actor";
import { uuidSchema } from "@/lib/domain/schemas";
import { handleApi, readJson } from "@/lib/http/handler";

// TODO [Ân — UC04]: active/reservation-block exception belongs in Auth/data policy.
export function POST(request: Request, route: RouteContext<"/api/trips/[id]/return">) {
  return handleApi(async context => {
    const id = uuidSchema.parse((await route.params).id);
    const input = await readJson(request, returnSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["STUDENT"]);
    return rentalResponse(await returnVehicle(actor, id, input), context.requestId);
  });
}
