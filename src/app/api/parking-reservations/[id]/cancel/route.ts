import { parkingCommand } from "@/features/reservations/parking";
import { requireActor } from "@/lib/auth/require-actor";
import { mutationSchema, uuidSchema } from "@/lib/domain/schemas";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";
export function POST(
  request: Request,
  route: RouteContext<"/api/parking-reservations/[id]/cancel">,
) {
  return handleApi(async (context) => {
    await requireActor(["STUDENT"]);
    const input = await readJson(request, mutationSchema.strict(), context);
    const id = uuidSchema.parse((await route.params).id);
    return success(
      await parkingCommand("CANCEL", { reservationId: id }),
      input.requestId,
    );
  });
}
