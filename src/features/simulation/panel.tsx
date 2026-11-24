"use client";
import { PageHeading } from "@/components/ui/workspace";

import { useEffect, useState, type FormEvent } from "react";
import type { HubListView, SimulationRunView } from "@/lib/domain/views";

export function SimulationPanel() {
  const [hubs, setHubs] = useState<HubListView | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<SimulationRunView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hubs", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw Error(json.error?.message);
        setHubs(json.data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, []);

  async function run(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);

    const form = new FormData(e.currentTarget);
    const projectedArrivals = Number(form.get("projectedArrivals") || 0);
    const arrivalHubId = String(form.get("arrivalHubId") || "");
    const body = {
      requestId: crypto.randomUUID(),
      hubIds: selected,
      demandMultiplier: Number(form.get("demandMultiplier")),
      failedChargingPoints: Number(form.get("failedChargingPoints")),
      projectedArrivals,
      ...(projectedArrivals > 0 ? { arrivalHubId } : {}),
      horizonMinutes: Number(form.get("horizonMinutes")),
      seed: Number(form.get("seed")),
    };

    try {
      const response = await fetch("/api/operator/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) throw Error(json.error?.message);
      setResult(json.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể chạy mô phỏng.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <PageHeading title="Cấu hình mô phỏng What-if" />
        <p>
          Chạy kịch bản trên snapshot; kết quả không thay đổi dữ liệu vận hành live.
        </p>
      </div>

      {error && <p role="alert" className="app-error">{error}</p>}
      {!hubs && !error && <p role="status">Đang tải danh sách Hub…</p>}

      {hubs && (
        <form onSubmit={run} className="app-surface grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="font-bold">Hub được chọn</legend>
            {hubs.hubs.map((hub) => (
              <label key={hub.id} className="mr-4 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(hub.id)}
                  onChange={(event) => {
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, hub.id]
                        : current.filter((id) => id !== hub.id),
                    );
                  }}
                />
                {hub.code} - {hub.name}
              </label>
            ))}
          </fieldset>

          <label className="app-field">
            Hệ số nhu cầu
            <input required name="demandMultiplier" type="number" min="0" max="5" step="0.1" defaultValue="1" className="app-control" />
          </label>
          <label className="app-field">
            Số cổng hỏng mô phỏng
            <input required name="failedChargingPoints" type="number" min="0" step="1" defaultValue="0" className="app-control" />
          </label>
          <label className="app-field">
            Xe dự kiến đến
            <input required name="projectedArrivals" type="number" min="0" step="1" defaultValue="0" className="app-control" />
          </label>
          <label className="app-field">
            Hub đích
            <select name="arrivalHubId" className="app-control" defaultValue="">
              <option value="">Chọn khi có xe đến</option>
              {hubs.hubs
                .filter((hub) => selected.includes(hub.id))
                .map((hub) => (
                  <option key={hub.id} value={hub.id}>{hub.code} - {hub.name}</option>
                ))}
            </select>
          </label>
          <label className="app-field">
            Khoảng mô phỏng (phút)
            <select name="horizonMinutes" className="app-control" defaultValue="30">
              {[5, 10, 15, 30, 60, 120].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="app-field">
            Seed
            <input required name="seed" type="number" min="0" max="4294967295" step="1" defaultValue="42" className="app-control" />
          </label>

          <button disabled={busy || selected.length === 0} className="app-action md:col-span-2">
            {busy ? "Đang mô phỏng…" : "Chạy What-if"}
          </button>
        </form>
      )}

      {result && (
        <div className="app-surface space-y-4">
          <h2 className="text-xl font-bold">Kết quả kịch bản</h2>
          <p className="app-muted">
            Baseline: {new Date(result.baselineAsOf).toLocaleString("vi-VN")}
          </p>
          <p className="text-sm">Nhu cầu mẫu: 4 lượt xe và 1 lượt sạc mỗi Hub mỗi giờ.</p>
          <p>
            Cổng sạc khả dụng: {result.charging.before} → {result.charging.after}.
            Nhu cầu sạc: {result.charging.demandBefore} → {result.charging.demandAfter}.
            Thiếu sau mô phỏng: {Math.max(0, result.charging.demandAfter - result.charging.after)}.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {result.hubMetrics.map((metric) => {
              const hub = hubs?.hubs.find((item) => item.id === metric.hubId);
              return (
                <article key={metric.hubId} className="app-surface space-y-1 text-sm">
                  <h3 className="font-bold">{hub?.code} - {hub?.name}</h3>
                  <p>Hub đầy: {metric.isFleetFull ? "Có" : "Không"}</p>
                  <p>Xe hiện diện: {metric.parkedBefore} → {metric.parkedVehicleCount}</p>
                  <p>Chỗ FLEET trống: {metric.spacesBefore} → {metric.spacesAfter}</p>
                  <p>Nhu cầu xe: {metric.demandBefore} → {metric.demandAfter}</p>
                  <p>Hub có nhiều xe nhất: {metric.hasMostParkedVehicles ? "Có" : "Không"}</p>
                  <p>Xe thiếu: {metric.unmetDemand}</p>
                  <p>Xe vượt sức chứa: {metric.overflowCount}</p>
                  <p>Thời gian quá tải: {metric.overloadMinutes} phút</p>
                  {metric.estimatedWaitMinutes !== null && (
                    <p>Chờ ước tính: {metric.estimatedWaitMinutes} phút</p>
                  )}
                </article>
              );
            })}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold">Khuyến nghị</h3>
            {result.recommendations.length === 0 && <p>Không phát hiện thiếu xe, chỗ hoặc cổng trong kịch bản.</p>}
            {result.recommendations.map((recommendation) => (
              <article key={recommendation.key} className="app-surface border-l-4 border-l-[#147a59] space-y-2">
                <p className="font-bold">{recommendation.kind}</p>
                <p>{recommendation.reason}</p>
                {recommendation.destinationHubId && (
                  <p>
                    {recommendation.sourceHubId && `${hubs?.hubs.find(hub => hub.id === recommendation.sourceHubId)?.code ?? ""} → `}
                    {hubs?.hubs.find(hub => hub.id === recommendation.destinationHubId)?.code}
                    {recommendation.vehicleCount !== undefined && ` - ${recommendation.vehicleCount} xe`}
                  </p>
                )}
                <ul className="list-disc pl-5 app-muted">
                  {recommendation.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
