import { z } from "zod";
import { SHARED_CONFIG } from "../../config/shared.ts";
import { mutationSchema, uuidSchema } from "../../lib/domain/schemas.ts";
import type { Actor } from "../../lib/domain/types.ts";
import type { SimulationRunView } from "../../lib/domain/views.ts";
import { AppError } from "../../lib/http/errors.ts";
import { runSimulationEngine, type SimulationSnapshot } from "./engine.ts";

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
  const { isSupabaseConfigured } = await import("../../lib/supabase/config");
  if (!isSupabaseConfigured())
    throw new AppError("DATABASE_UNAVAILABLE", "Chưa cấu hình Supabase.", 503);

  const { createClient } = await import("../../lib/supabase/server");
  const db = await createClient();
  const { data, error } = await db.rpc("simulation_snapshot", {
    p_hub_ids: _input.hubIds,
  });
  if (error) {
    if (error.message === "UNAUTHENTICATED")
      throw new AppError("UNAUTHENTICATED", "Vui lòng đăng nhập.", 401);
    if (error.message === "FORBIDDEN")
      throw new AppError("FORBIDDEN", "Chỉ Operator mới được chạy mô phỏng.", 403);
    if (error.message === "NOT_FOUND")
      throw new AppError("NOT_FOUND", "Không tìm thấy một hoặc nhiều Hub.", 404);
    if (error.message === "INVALID_INPUT")
      throw new AppError("INVALID_INPUT", "Danh sách Hub mô phỏng không hợp lệ.", 400);
    throw new AppError("DATABASE_UNAVAILABLE", "Không thể đọc snapshot vận hành nhất quán.", 503, true);
  }
  if (!data)
    throw new AppError("DATABASE_UNAVAILABLE", "Không thể đọc snapshot vận hành nhất quán.", 503, true);

  const snapshot = data as SimulationSnapshot;

  const startedAt = new Date();
  let result;
  try {
    result = runSimulationEngine(_input, snapshot);
  } catch (error) {
    throw new AppError("INVALID_INPUT", error instanceof Error ? error.message : "Snapshot mô phỏng không hợp lệ.", 400);
  }

  const finishedAt = new Date();
  return {
    id: crypto.randomUUID(),
    status: "COMPLETED",
    params: {
      hubIds: _input.hubIds,
      demandMultiplier: _input.demandMultiplier,
      failedChargingPoints: _input.failedChargingPoints,
      projectedArrivals: _input.projectedArrivals,
      arrivalHubId: _input.arrivalHubId,
      horizonMinutes: _input.horizonMinutes,
      seed: _input.seed,
    },
    baselineAsOf: snapshot.asOf,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    hubMetrics: result.hubMetrics,
    recommendations: result.recommendations,
  };
}
