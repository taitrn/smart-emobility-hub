import { reserveParking, reserveParkingSchema } from "@/features/reservations/parking";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

// TODO [Tài — UC05 tổng hợp]: time/overlap/ownership must be checked in RPC.
export function POST(request: Request) {
  return handleApi(async context => {
    const input = await readJson(request, reserveParkingSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["STUDENT"]);
    return success(await reserveParking(actor, input), context.requestId, 201);
  });
}
