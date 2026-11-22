import { reserveVehicle, reserveVehicleSchema } from "@/features/reservations/vehicle";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST(request: Request) {
  return handleApi(async context => {
    const input = await readJson(request, reserveVehicleSchema, context);
    await requireActor(["STUDENT"]);
    const { reservation, created } = await reserveVehicle(input);
    return success(reservation, context.requestId, created ? 201 : 200);
  });
}
