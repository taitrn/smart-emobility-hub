"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiFailure, ApiSuccess } from "@/lib/http/response";
import type { getOperatorOverview } from "./service";

type OperatorOverview = Awaited<ReturnType<typeof getOperatorOverview>>;
type ResourceKind = "VEHICLE" | "CHARGING_POINT";
type Resource = {
  id: string;
  code: string;
  status: string;
  batteryPercent?: number;
};

async function loadOverview(signal?: AbortSignal) {
  const response = await fetch("/api/operator/overview", {
    cache: "no-store",
    signal,
  });
  const result: ApiSuccess<OperatorOverview> | ApiFailure = await response.json();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export function OperatorDashboard() {
  const [overview, setOverview] = useState<OperatorOverview>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadOverview(controller.signal)
      .then(setOverview)
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function refresh() {
    setOverview(await loadOverview());
  }

  async function changeStatus(resource: Resource, resourceKind: ResourceKind) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const status = resource.status === "AVAILABLE"
        ? "OUT_OF_SERVICE"
        : "AVAILABLE";
      const response = await fetch(`/api/operator/resources/${resource.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceKind, status, requestId: crypto.randomUUID() }),
      });
      const result: ApiSuccess<unknown> | ApiFailure = await response.json();

      if (!result.ok) {
        setError(result.error.message);
        if (response.status === 409) await refresh();
        return;
      }

      setNotice(`${resource.code}: ${status === "AVAILABLE" ? "đã khôi phục" : "đã giả lập lỗi"}.`);
      await refresh();
    } catch {
      setError("Không tải được trạng thái mới. Hãy tải lại để kiểm tra.");
    } finally {
      setBusy(false);
    }
  }

  function renderResources(resources: Resource[], kind: ResourceKind) {
    return (
      <ul className="space-y-2">
        {resources.map(resource => (
          <li
            key={resource.id}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-2"
          >
            <span>
              {resource.code} · {resource.status}
              {resource.batteryPercent !== undefined && ` · Pin ${resource.batteryPercent}%`}
            </span>
            {(resource.status === "AVAILABLE" || resource.status === "OUT_OF_SERVICE") && (
              <Button type="button" disabled={busy} onClick={() => void changeStatus(resource, kind)}>
                {resource.status === "AVAILABLE" ? "Giả lập lỗi" : "Khôi phục"}
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Tài nguyên theo Hub</h2>
        <Button type="button" disabled={loading || busy} onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await refresh();
          } catch {
            setError("Không tải được dữ liệu vận hành. Vui lòng thử lại.");
          } finally {
            setBusy(false);
          }
        }}>
          Tải lại
        </Button>
      </div>
      {loading && <p role="status">Đang tải dữ liệu…</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {overview?.hubs.length === 0 && <p>Chưa có Hub.</p>}

      {overview?.hubs.map(hub => (
        <section key={hub.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold">{hub.code} · {hub.name} · {hub.status}</h3>
          <p className="text-sm">
            Xe khả dụng {hub.availableVehicleCount}/{hub.vehicles.length}
            {" · "}FLEET trống {hub.freeFleetSpaces}
            {" · "}Cổng khả dụng {hub.availableChargingPointCount}/{hub.chargingPoints.length}
          </p>
          <h4 className="font-medium">Xe dùng chung</h4>
          {renderResources(hub.vehicles, "VEHICLE")}
          <h4 className="font-medium">Chỗ đỗ</h4>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {hub.spaces.map(space => (
              <li key={space.id}>{space.code} · {space.spaceKind} · {space.occupancyStatus}</li>
            ))}
          </ul>
          <h4 className="font-medium">Cổng sạc</h4>
          {renderResources(hub.chargingPoints, "CHARGING_POINT")}
        </section>
      ))}
    </section>
  );
}