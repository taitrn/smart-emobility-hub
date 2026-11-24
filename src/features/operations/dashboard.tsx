"use client";

import { useEffect, useState } from "react";
import { Metric, StatusBadge } from "@/components/ui/workspace";
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
            className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dce7df] py-2"
          >
            <span>
              <b>{resource.code}</b>
              {resource.batteryPercent !== undefined && ` - Pin ${resource.batteryPercent}%`} <StatusBadge status={resource.status} />
            </span>
            {(resource.status === "AVAILABLE" || resource.status === "OUT_OF_SERVICE") && (
              <button className="app-secondary" type="button" disabled={busy} onClick={() => void changeStatus(resource, kind)}>
                {resource.status === "AVAILABLE" ? "Giả lập lỗi" : "Khôi phục"}
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="app-subtitle">Tài nguyên theo Hub</h2>
        <button className="app-secondary" type="button" disabled={loading || busy} onClick={async () => {
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
        </button>
      </div>
      {loading && <p role="status">Đang tải dữ liệu…</p>}
      {error && <p role="alert" className="app-error">{error}</p>}
      {notice && <p role="status" className="app-notice">{notice}</p>}
      {overview?.hubs.length === 0 && <p>Chưa có Hub.</p>}

      {overview && (
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Hub hoạt động">{overview.hubs.filter(hub => hub.status === "ACTIVE").length} / {overview.hubs.length}</Metric>
          <Metric label="Xe khả dụng">{overview.hubs.reduce((sum, hub) => sum + hub.availableVehicleCount, 0)}</Metric>
          <Metric label="Chỗ FLEET trống">{overview.hubs.reduce((sum, hub) => sum + hub.freeFleetSpaces, 0)}</Metric>
          <Metric label="Cổng sạc khả dụng">{overview.hubs.reduce((sum, hub) => sum + hub.availableChargingPointCount, 0)}</Metric>
        </dl>
      )}
      {overview?.hubs.map(hub => (
        <section key={hub.id} className="app-surface space-y-4">
          <h3 className="app-subtitle flex flex-wrap items-center gap-2">{hub.code} - {hub.name} <StatusBadge status={hub.status} /></h3>
          <p className="app-muted">
            Xe khả dụng {hub.availableVehicleCount}/{hub.vehicles.length}
            {" - "}FLEET trống {hub.freeFleetSpaces}
            {" - "}Cổng khả dụng {hub.availableChargingPointCount}/{hub.chargingPoints.length}
          </p>
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="space-y-2">
              <h4 className="app-subtitle">Xe dùng chung</h4>
              {renderResources(hub.vehicles, "VEHICLE")}
            </section>
            <section className="space-y-2">
              <h4 className="app-subtitle">Chỗ đỗ</h4>
              <ul className="space-y-2 text-sm">
                {hub.spaces.map(space => (
                  <li key={space.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dce7df] py-2">
                    <span>{space.code} - {space.spaceKind}</span><StatusBadge status={space.occupancyStatus} />
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-2">
              <h4 className="app-subtitle">Cổng sạc</h4>
              {renderResources(hub.chargingPoints, "CHARGING_POINT")}
            </section>
          </div>
        </section>
      ))}
    </section>
  );
}