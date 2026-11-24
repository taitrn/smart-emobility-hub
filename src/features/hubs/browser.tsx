"use client";
import Link from "next/link";
import { PageHeading, StatusBadge } from "@/components/ui/workspace";
import { ReservationIcon } from "@/features/reservations/reservation-ui";
import { useEffect, useState, type FormEvent } from "react";
import type { HubDetailView, HubListView } from "@/lib/domain/views";
export function HubBrowser({ initialHubId = "" }: { initialHubId?: string }) {
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState(""),
    [data, setData] = useState<HubListView | null>(null),
    [error, setError] = useState(""),
    [detailError, setDetailError] = useState(""),
    [loading, setLoading] = useState(true),
    [detail, setDetail] = useState<HubDetailView | null>(null);
  useEffect(() => {
    if (initialHubId) return;
    const c = new AbortController();
    fetch(`/api/hubs?${query}`, { signal: c.signal, cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error?.message);
        setData(j.data);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [query, refresh, initialHubId]);
  useEffect(() => {
    if (!initialHubId) return;
    const c = new AbortController();
    fetch(`/api/hubs/${initialHubId}`, { signal: c.signal, cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error?.message);
        setDetail(j.data);
      })
      .catch((e) => {
        if (!c.signal.aborted) setDetailError(e.message);
      });
    return () => c.abort();
  }, [initialHubId]);
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setError("Pin phải nằm trong khoảng 0–100%.");
      return;
    }
    const f = new FormData(e.currentTarget),
      q = new URLSearchParams();
    for (const [k, v] of f) if (String(v).trim()) q.set(k, String(v).trim());
    setLoading(true);
    setError("");
    setRefresh((v) => v + 1);
    setQuery(q.toString());
  }
  return (
    <section className="space-y-6">
      <PageHeading title={initialHubId ? "Chi tiết Mobility Hub" : "Tra cứu Hub & xe"} description="Xem xe khả dụng, mức pin, chỗ đỗ và cổng sạc." />
      {initialHubId ? (
        <Link href="/hubs" className="app-secondary">Quay lại danh sách Hub</Link>
      ) : (
        <>
          <form
            onSubmit={search}
            onInvalid={() =>
              setError("Kiểm tra bộ lọc: pin phải nằm trong khoảng 0–100%.")
            }
            className="app-surface grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
          >
            <label className="app-field">
              Tên hoặc mã Hub
              <input
                name="q"
                maxLength={100}
                className="app-control"
              />
            </label>
            <label className="app-field">
              Trạng thái Hub
              <select name="status" className="app-control">
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="MAINTENANCE">Bảo trì</option>
              </select>
            </label>
            <label className="app-field">
              Loại xe
              <select name="vehicleType" className="app-control">
                <option value="">Tất cả</option>
                <option>E_BIKE</option>
                <option>E_SCOOTER</option>
              </select>
            </label>
            <label className="app-field">
              Pin tối thiểu (%)
              <input
                name="minBattery"
                type="number"
                min="0"
                max="100"
                className="app-control"
              />
            </label>
            <button className="app-action">Tìm kiếm</button>
          </form>
          {loading && <p role="status">Đang tải Hub…</p>}
          {error && (
            <p role="alert" className="app-error">
              {error}
            </p>
          )}
          {!loading && !error && data?.hubs.length === 0 && (
            <p>Không có Hub phù hợp.</p>
          )}
          {!loading && !error && (
            <div className="grid max-w-5xl gap-3">
              {data?.hubs.map((h) => (
                <article key={h.id} className="app-surface flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e6f2ec]"><ReservationIcon name="pin" /></span>
                    <div>
                      <h2 className="app-subtitle">{h.name}</h2>
                      <p className="app-muted">{h.code}</p>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                  <ul className="app-muted flex flex-wrap gap-x-4">
                    <li><b>{h.availableVehicleCount}</b> xe sẵn sàng</li>
                    <li><b>{h.freeFleetSpaces}</b> chỗ FLEET trống</li>
                    <li><b>{h.availableChargingPointCount}</b> cổng sạc khả dụng</li>
                  </ul>
                  <Link href={`/hubs/${h.id}`} className="app-secondary">Xem chi tiết</Link>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {detailError && (
        <p role="alert" className="app-error">
          Không tải được chi tiết: {detailError}
        </p>
      )}
      {initialHubId && !detail && !detailError && (
        <p role="status">Đang tải chi tiết…</p>
      )}
      {detail && (
        <article className="space-y-4">
          <div className="app-surface flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{detail.hub.name}</h2>
            {detail.vehicles.some((vehicle) => vehicle.isBookable) && (
              <Link href={`/reservations/new?hubId=${detail.hub.id}`}
                className="app-action">
                Đặt xe dùng chung
              </Link>
            )}
          </div>
          <p className="app-muted">Tọa độ minh họa: {detail.hub.latitude}, {detail.hub.longitude}</p>
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="app-surface space-y-3">
              <h3 className="app-subtitle">Xe tại Hub</h3>
              {detail.vehicles.length ? (
                detail.vehicles.map((v) => (
                  <p key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{v.code} - {v.vehicleType} - pin {v.batteryPercent}%</span> <StatusBadge status={v.status} />
                  </p>
                ))
              ) : (
                <p>Chưa có xe.</p>
              )}
            </section>
            <section className="app-surface space-y-3">
              <h3 className="app-subtitle">Chỗ đỗ</h3>
              {detail.spaces.map((s) => (
                <p key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{s.code} - {s.spaceKind}</span> <StatusBadge status={s.occupancyStatus} />
                </p>
              ))}
              <p className="app-muted">
                PRIVATE trống hiện tại không đồng nghĩa lịch tương lai còn trống.
              </p>
            </section>
            <section className="app-surface space-y-3">
              <h3 className="app-subtitle">Cổng sạc</h3>
              {detail.chargingPoints.map((p) => (
                <p key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  {p.code} <StatusBadge status={p.status} />
                </p>
              ))}
            </section>
          </div>
        </article>
      )}
      {data && (
        <p className="app-muted">
          Đọc dữ liệu lúc {new Date(data.asOf).toLocaleString("vi-VN")}. Làm mới
          trang để cập nhật.
        </p>
      )}
    </section>
  );
}
