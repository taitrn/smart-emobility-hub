import {
  parkingCommand,
  parkingEventSchema,
} from "@/features/reservations/parking";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";
export function POST(request: Request) {
  return handleApi(async (context) => {
    await requireActor(["OPERATOR"]);
    const input = await readJson(request, parkingEventSchema, context);
    return success(await parkingCommand(input.event, input), input.requestId);
  });
}
