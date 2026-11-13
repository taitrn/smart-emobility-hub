import { z } from "zod";
import { SHARED_CONFIG } from "../../config/shared.ts";
import { mutationSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { SimulationRunView } from "../../lib/domain/views.ts";
import { notImplemented } from "../../lib/http/errors.ts";

const policy = SHARED_CONFIG.simulation;
export const simulationSchema = mutationSchema.extend({
  hubIds: z.array(uuidSchema).min(1).refine(ids => new Set(ids).size === ids.length, "Hub bị lặp."),
  demandMultiplier: z.number().min(0).max(policy.maximumDemandMultiplier),
  failedChargingPoints: z.number().int().nonnegative(),
  projectedArrivals: z.number().int().nonnegative().default(0),
  arrivalHubId: uuidSchema.optional(),
  horizonMinutes: z.number().int().min(policy.minimumHorizonMinutes).max(policy.maximumHorizonMinutes).multipleOf(policy.stepMinutes),
  seed: z.number().int().min(0).max(0xffff_ffff).default(policy.defaultSeed),
}).strict().superRefine((input, ctx) => {
  if (input.projectedArrivals > 0 && !input.arrivalHubId) {
    ctx.addIssue({ code: "custom", path: ["arrivalHubId"], message: "Chọn Hub dự kiến nhận xe." });
  }
  if (input.arrivalHubId && !input.hubIds.includes(input.arrivalHubId)) {
    ctx.addIssue({ code: "custom", path: ["arrivalHubId"], message: "Hub nhận xe phải nằm trong danh sách được chọn." });
  }
});
export type SimulationInput = z.infer<typeof simulationSchema>;

export async function runSimulation(_actor: Actor, _input: SimulationInput): Promise<SimulationRunView> {
  // TODO [Việt Anh — UC11]: authorized network snapshot, deterministic engine,
  // report full Hubs and most parked vehicles separately; estimate arrival overflow.
  // Validate failed charging points against capacity.
  // No live vehicle movement or queue edits. Put pure engine in engine.ts.
  throw notImplemented("UC11 — What-if Simulation");
}
