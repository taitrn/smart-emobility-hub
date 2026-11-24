"use client";

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
        <h1 className="text-3xl font-bold">What-if Simulation</h1>
        <p>
          Chạy kịch bản trên snapshot; kết quả không thay đổi dữ liệu vận hành live.
        </p>
      </div>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {!hubs && !error && <p role="status">Đang tải danh sách Hub…</p>}

      {hubs && (
        <form onSubmit={run} className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2">
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
                {hub.code} · {hub.name}
              </label>
            ))}
          </fieldset>

          <label>
            Hệ số nhu cầu
            <input required name="demandMultiplier" type="number" min="0" max="5" step="0.1" defaultValue="1" className="block border p-2" />
          </label>
          <label>
            Số cổng hỏng mô phỏng
            <input required name="failedChargingPoints" type="number" min="0" step="1" defaultValue="0" className="block border p-2" />
          </label>
          <label>
            Xe dự kiến đến
            <input required name="projectedArrivals" type="number" min="0" step="1" defaultValue="0" className="block border p-2" />
          </label>
          <label>
            Hub đích
            <select name="arrivalHubId" className="block border p-2" defaultValue="">
              <option value="">Chọn khi có xe đến</option>
              {hubs.hubs
                .filter((hub) => selected.includes(hub.id))
                .map((hub) => (
                  <option key={hub.id} value={hub.id}>{hub.code} · {hub.name}</option>
                ))}
            </select>
          </label>
          <label>
            Khoảng mô phỏng (phút)
            <select name="horizonMinutes" className="block border p-2" defaultValue="30">
              {[5, 10, 15, 30, 60, 120].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Seed
            <input required name="seed" type="number" min="0" max="4294967295" step="1" defaultValue="42" className="block border p-2" />
          </label>

          <button disabled={busy || selected.length === 0} className="rounded bg-teal-700 px-4 py-2 text-white md:col-span-2">
            {busy ? "Đang mô phỏng…" : "Chạy What-if"}
          </button>
        </form>
      )}

      {result && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold">Kết quả kịch bản</h2>
          <p className="text-sm text-slate-600">
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
                <article key={metric.hubId} className="space-y-1 rounded border bg-white p-4">
                  <h3 className="font-bold">{hub?.code} · {hub?.name}</h3>
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
              <article key={recommendation.key} className="rounded border-l-4 border-amber-500 bg-white p-3">
                <p className="font-bold">{recommendation.kind}</p>
                <p>{recommendation.reason}</p>
                {recommendation.destinationHubId && (
                  <p>
                    {recommendation.sourceHubId && `${hubs?.hubs.find(hub => hub.id === recommendation.sourceHubId)?.code ?? ""} → `}
                    {hubs?.hubs.find(hub => hub.id === recommendation.destinationHubId)?.code}
                    {recommendation.vehicleCount !== undefined && ` · ${recommendation.vehicleCount} xe`}
                  </p>
                )}
                <ul className="list-disc pl-5 text-sm text-slate-600">
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
