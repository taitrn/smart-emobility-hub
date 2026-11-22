import type { SimulationRunView } from "../../lib/domain/views.ts";
import type { SimulationInput } from "./service.ts";

export type SimulationHubSnapshot = {
  id: string;
  parkedVehicleCount: number;
  availableVehicleCount: number;
  freeFleetSpaces: number;
  availableChargingPointCount: number;
  totalChargingPointCount: number;
};

export type SimulationSnapshot = {
  hubs: SimulationHubSnapshot[];
  asOf: string;
};

export type SimulationEngineResult = {
  hubMetrics: SimulationRunView["hubMetrics"];
  recommendations: SimulationRunView["recommendations"];
};

export function runSimulationEngine(
  input: SimulationInput,
  snapshot: SimulationSnapshot,
): SimulationEngineResult {
  const selected = input.hubIds
    .map((hubId) => snapshot.hubs.find((hub) => hub.id === hubId))
    .filter((hub): hub is SimulationHubSnapshot => Boolean(hub));

  if (selected.length !== input.hubIds.length) {
    throw new Error("Một hoặc nhiều Hub không tồn tại.");
  }

  const totalChargingPoints = selected.reduce(
    (sum, hub) => sum + hub.totalChargingPointCount,
    0,
  );
  if (input.failedChargingPoints > totalChargingPoints) {
    throw new Error("Số cổng hỏng vượt quá tổng cổng tại các Hub được chọn.");
  }

  const baselineAvailablePoints = selected.reduce(
    (sum, hub) => sum + hub.availableChargingPointCount,
    0,
  );
  const scenarioAvailablePoints = Math.max(
    0,
    baselineAvailablePoints - input.failedChargingPoints,
  );

  const metrics = selected.map((hub) => {
    const baselineDemand = hub.availableVehicleCount;
    const scenarioDemand = Math.ceil(
      baselineDemand * input.demandMultiplier,
    );
    const unmetDemand = Math.max(0, scenarioDemand - hub.availableVehicleCount);
    const projectedArrivals =
      input.arrivalHubId === hub.id ? input.projectedArrivals : 0;
    const parkedVehicleCount = Math.min(
      hub.parkedVehicleCount +
        projectedArrivals,
      hub.parkedVehicleCount + hub.freeFleetSpaces,
    );
    const overflowCount =
      projectedArrivals > 0
        ? Math.max(
            0,
            projectedArrivals -
              Math.max(0, hub.freeFleetSpaces),
          )
        : 0;
    const isFleetFull =
      hub.freeFleetSpaces === 0 ||
      (projectedArrivals > 0 &&
        projectedArrivals >= hub.freeFleetSpaces);

    return {
      hubId: hub.id,
      isFleetFull,
      parkedVehicleCount,
      hasMostParkedVehicles: false,
      unmetDemand,
      overflowCount,
      overloadMinutes: unmetDemand > 0 || overflowCount > 0
        ? input.horizonMinutes
        : 0,
      estimatedWaitMinutes:
        unmetDemand > 0 ? Math.ceil(input.horizonMinutes / 4) : null,
    };
  });

  const maxParked = Math.max(
    0,
    ...metrics.map((metric) => metric.parkedVehicleCount),
  );
  if (maxParked > 0) {
    metrics.forEach((metric) => {
      metric.hasMostParkedVehicles =
        metric.parkedVehicleCount === maxParked;
    });
  }

  const recommendations: SimulationRunView["recommendations"] = [];

  for (const metric of metrics) {
    if (metric.unmetDemand > 0) {
      const surplus = [...metrics]
        .filter((candidate) => candidate.parkedVehicleCount > 0)
        .sort(
          (a, b) =>
            b.parkedVehicleCount -
            a.parkedVehicleCount,
        )[0];
      recommendations.push({
        key: `rebalance-${metric.hubId}`,
        kind: "REBALANCE",
        sourceHubId:
          surplus && surplus.hubId !== metric.hubId
            ? surplus.hubId
            : undefined,
        destinationHubId: metric.hubId,
        vehicleCount: metric.unmetDemand,
        reason: "Nhu cầu mô phỏng vượt xe khả dụng tại Hub.",
        assumptions: [
          "Ước lượng theo nhu cầu mẫu nhân hệ số.",
          "Không tự điều chuyển xe live.",
        ],
      });
    }

    if (metric.overflowCount > 0 || metric.isFleetFull) {
      const alternative = metrics
        .filter(
          (candidate) =>
            candidate.hubId !== metric.hubId &&
            !candidate.isFleetFull,
        )
        .sort(
          (a, b) =>
            b.parkedVehicleCount -
            a.parkedVehicleCount,
        )[0];
      recommendations.push({
        key: `redirect-${metric.hubId}`,
        kind: "REDIRECT",
        destinationHubId: alternative?.hubId,
        vehicleCount: metric.overflowCount || undefined,
        reason: alternative
          ? "Xe dự kiến đến có thể vượt sức chứa; chuyển hướng sang Hub còn chỗ."
          : "Hub không còn chỗ FLEET phù hợp trong danh sách đã chọn.",
        assumptions: [
          "Chỉ so sánh chỗ FLEET trống.",
          "Xe dự kiến đến không tự trừ xe ở Hub khác.",
        ],
      });
    }
  }

  if (input.failedChargingPoints > 0 || scenarioAvailablePoints < baselineAvailablePoints) {
    recommendations.push({
      key: "charging-priority",
      kind: "CHARGING",
      reason:
        "Cổng hỏng làm giảm sức chứa sạc; ưu tiên pin thấp và xe sắp rời.",
      assumptions: [
        "Ưu tiên pin <=20% hoặc rời trong 0-60 phút.",
        "FIFO trong cùng nhóm.",
        "Không gợi ý cổng đang hỏng.",
      ],
    });
  }

  return { hubMetrics: metrics, recommendations };
}
