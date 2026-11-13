import { runSimulation, simulationSchema } from "@/features/simulation/service";
import { requireActor } from "@/lib/auth/require-actor";
import { handleApi, readJson } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

// TODO [Việt Anh — UC11]: verify all snapshot Hubs, not just the target Hubs.
export function POST(request: Request) {
  return handleApi(async context => {
    const input = await readJson(request, simulationSchema);
    context.requestId = input.requestId;
    const actor = await requireActor(["OPERATOR"]);
    return success(await runSimulation(actor, input), context.requestId, 201);
  });
}
