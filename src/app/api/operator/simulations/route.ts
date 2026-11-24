import { runSimulation, simulationSchema } from "@/features/simulation/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

export function POST(request: Request) {
  return handleApi(async context => {
    const actor = await requireActor(["OPERATOR"]);
    const input = await readJson(request, simulationSchema);
    context.requestId = input.requestId;
    return success(await runSimulation(actor, input), context.requestId, 201);
  });
}
