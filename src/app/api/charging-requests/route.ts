import { z } from "zod";
import {
  chargingRequestSchema,
  listChargingSessions,
  requestCharging,
} from "@/features/charging/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST(request: Request) {
  return handleApi(async context => {
    const actor = await requireActor(["STUDENT"]);
    const input = await readJson(request, chargingRequestSchema);
    context.requestId = input.requestId;
    return success(await requestCharging(actor, input), context.requestId, 201);
  });
}

export function GET(request: Request) {
  return handleApi(async context => {
    const actor = await requireActor(["STUDENT", "OPERATOR"]);
    const status = z.enum(["WAITING","CHARGING","COMPLETED","FAILED","CANCELLED"])
      .optional()
      .parse(new URL(request.url).searchParams.get("status") ?? undefined);
    return success(await listChargingSessions(actor, status), context.requestId);
  });
}
