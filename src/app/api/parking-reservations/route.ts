import {
  parkingData,
  reserveParking,
  reserveParkingSchema,
} from "@/features/reservations/parking";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

// DB transaction verifies session ownership, time and overlap.
export function POST(request: Request) {
  return handleApi(async (context) => {
    const input = await readJson(request, reserveParkingSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["STUDENT"]);
    return success(await reserveParking(actor, input), context.requestId, 201);
  });
}

export function GET() {
  return handleApi(async (ctx) => {
    await requireActor(["STUDENT", "OPERATOR"]);
    return success(await parkingData(), ctx.requestId);
  });
}
