import { z } from "zod";
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
    const actor = await requireActor(["STUDENT"]);
    const input = await readJson(request, reserveParkingSchema, context);
    context.requestId = input.requestId;
    return success(await reserveParking(actor, input), context.requestId, 201);
  });
}

export function GET(request: Request) {
  return handleApi(async (ctx) => {
    await requireActor(["STUDENT", "OPERATOR"]);
    const q = z
      .object({
        page: z.coerce.number().int().min(1).max(100000).default(1),
        status: z
          .enum(["CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"])
          .optional(),
      })
      .strict()
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    return success(await parkingData(q.page, q.status), ctx.requestId);
  });
}
