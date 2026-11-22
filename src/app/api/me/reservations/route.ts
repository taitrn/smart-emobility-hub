import { listMyVehicleReservations } from "@/features/reservations/vehicle";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function GET() {
  return handleApi(async context => {
    await requireActor(["STUDENT"]);
    return success({ reservations: await listMyVehicleReservations() }, context.requestId);
  });
}
