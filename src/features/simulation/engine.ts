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
  charging: SimulationRunView["charging"];
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

  const baselineDemand = Math.ceil(4 * input.horizonMinutes / 60);
  const demandBefore = selected.length * Math.ceil(input.horizonMinutes / 60);
  const charging = {
    before: baselineAvailablePoints,
    after: scenarioAvailablePoints,
    demandBefore,
    demandAfter: Math.ceil(demandBefore * input.demandMultiplier),
  };

  const metrics = selected.map((hub) => {
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
      parkedBefore: hub.parkedVehicleCount,
      spacesBefore: hub.freeFleetSpaces,
      spacesAfter: Math.max(0, hub.freeFleetSpaces - projectedArrivals),
      demandBefore: baselineDemand,
      demandAfter: scenarioDemand,
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

  const surplus = new Map(selected.map(hub => [
    hub.id, Math.max(0, hub.availableVehicleCount - Math.ceil(baselineDemand * input.demandMultiplier)),
  ]));
  const remainingSpace = new Map(metrics.map(metric => [metric.hubId, metric.spacesAfter]));

  for (const metric of metrics) {
    if (metric.unmetDemand > 0) {
      const source = [...surplus.entries()]
        .filter(([id, count]) => id !== metric.hubId && count > 0)
        .sort((a, b) => b[1] - a[1])[0];
      const free = remainingSpace.get(metric.hubId) ?? 0;
      const count = source ? Math.min(source[1], metric.unmetDemand, free) : 0;
      if (source && count > 0) {
        surplus.set(source[0], source[1] - count);
        remainingSpace.set(metric.hubId, free - count);
        recommendations.push({
          key: `rebalance-${metric.hubId}`,
          kind: "REBALANCE",
          sourceHubId: source[0],
          destinationHubId: metric.hubId,
          vehicleCount: count,
          reason: "Hub nguồn có xe dư và Hub đích còn chỗ nhận.",
          assumptions: ["Dùng nhu cầu mẫu; không điều chuyển xe thật."],
        });
      } else {
        recommendations.push({
          key: `vehicle-shortage-${metric.hubId}`,
          kind: "REDIRECT",
          destinationHubId: source?.[0],
          reason: source
            ? "Hub thiếu xe không còn chỗ nhận thêm; hướng người dùng đến Hub có xe dư."
            : "Không có Hub nào dư xe; cân nhắc dời thời điểm sử dụng.",
          assumptions: ["Chỉ xét xe khả dụng còn dư sau khi tính nhu cầu tại Hub nguồn."],
        });
      }
    }

    if (metric.overflowCount > 0 || metric.isFleetFull) {
      const alternative = metrics
        .filter(
          (candidate) =>
            candidate.hubId !== metric.hubId &&
            (remainingSpace.get(candidate.hubId) ?? 0) > 0,
        )
        .sort(
          (a, b) =>
            b.parkedVehicleCount -
            a.parkedVehicleCount,
        )[0];
      const redirected = alternative
        ? Math.min(metric.overflowCount, remainingSpace.get(alternative.hubId) ?? 0)
        : 0;
      if (alternative && redirected) {
        remainingSpace.set(alternative.hubId, (remainingSpace.get(alternative.hubId) ?? 0) - redirected);
      }
      recommendations.push({
        key: `redirect-${metric.hubId}`,
        kind: "REDIRECT",
        destinationHubId: alternative?.hubId,
        vehicleCount: redirected || undefined,
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

  if (input.failedChargingPoints > 0 || charging.demandAfter > charging.after) {
    recommendations.push({
      key: "charging-priority",
      kind: "CHARGING",
      reason:
        "Ưu tiên pin thấp và xe sắp rời khi sức chứa sạc giảm hoặc nhu cầu tăng.",
      assumptions: [
        "Ưu tiên pin <=20% hoặc rời trong 0-60 phút.",
        "FIFO trong cùng nhóm.",
        "Không gợi ý cổng đang hỏng.",
      ],
    });
  }

  return { hubMetrics: metrics, charging, recommendations };
}
