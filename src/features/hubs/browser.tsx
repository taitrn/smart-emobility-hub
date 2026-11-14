"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { HubListView } from "@/lib/domain/views";
import type { HubResources } from "./summary";
type Detail = {
  hub: HubResources["hubs"][number];
  vehicles: HubResources["vehicles"];
  spaces: HubResources["spaces"];
  chargingPoints: HubResources["points"];
  asOf: string;
};
export function HubBrowser() {
  const [refresh, setRefresh] = useState(0),
    [detailRefresh, setDetailRefresh] = useState(0);
  const [query, setQuery] = useState(""),
    [data, setData] = useState<HubListView | null>(null),
    [error, setError] = useState(""),
    [detailError, setDetailError] = useState(""),
    [loading, setLoading] = useState(true),
    [detail, setDetail] = useState<Detail | null>(null),
    [selected, setSelected] = useState("");
  useEffect(() => {
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
  }, [query, refresh]);
  useEffect(() => {
    if (!selected) return;
    const c = new AbortController();
    fetch(`/api/hubs/${selected}`, { signal: c.signal, cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error?.message);
        setDetail(j.data);
      })
      .catch((e) => {
        if (!c.signal.aborted) setDetailError(e.message);
      });
    return () => c.abort();
  }, [selected, detailRefresh]);
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      q = new URLSearchParams();
    for (const [k, v] of f) if (String(v).trim()) q.set(k, String(v).trim());
    setLoading(true);
    setError("");
    setDetailError("");
    setDetail(null);
    setSelected("");
    setRefresh((v) => v + 1);
    setQuery(q.toString());
  }
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Mobility Hub</h1>
      <p>Tra cứu xe, pin, chỗ đỗ và cổng sạc tại Hub.</p>
      <form onSubmit={search} className="flex flex-wrap items-end gap-4">
        <label>
          Tên hoặc mã Hub
          <input
            name="q"
            maxLength={100}
            className="block border rounded p-2"
          />
        </label>
        <label>
          Trạng thái Hub
          <select name="status" className="block border rounded p-2">
            <option value="">Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>
        </label>
        <label>
          Loại xe
          <select name="vehicleType" className="block border rounded p-2">
            <option value="">Tất cả</option>
            <option>E_BIKE</option>
            <option>E_SCOOTER</option>
          </select>
        </label>
        <label>
          Pin tối thiểu (%)
          <input
            name="minBattery"
            type="number"
            min="0"
            max="100"
            className="block border rounded p-2"
          />
        </label>
        <button className="rounded bg-teal-700 text-white p-2">Tìm kiếm</button>
      </form>
      {loading && <p role="status">Đang tải Hub…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!loading && !error && data?.hubs.length === 0 && (
        <p>Không có Hub phù hợp.</p>
      )}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-3">
          {data?.hubs.map((h) => (
            <article
              key={h.id}
              className="rounded border bg-white p-4 space-y-2"
            >
              <h2 className="font-bold">
                {h.code} · {h.name}
              </h2>
              <p>{h.status === "ACTIVE" ? "Đang hoạt động" : "Bảo trì"}</p>
              <p>Xe sẵn sàng phù hợp: {h.availableVehicleCount}</p>
              <p>Chỗ FLEET trống: {h.freeFleetSpaces}</p>
              <p>Cổng sạc khả dụng: {h.availableChargingPointCount}</p>
              <button
                className="text-teal-800 underline"
                onClick={() => {
                  setDetailError("");
                  setDetail(null);
                  setSelected(h.id);
                  setDetailRefresh((v) => v + 1);
                }}
              >
                Xem chi tiết
              </button>
            </article>
          ))}
        </div>
      )}
      {detailError && (
        <p role="alert" className="text-red-700">
          Không tải được chi tiết: {detailError}
        </p>
      )}
      {selected && !detail && !detailError && (
        <p role="status">Đang tải chi tiết…</p>
      )}
      {detail && (
        <article className="rounded border p-4 space-y-3">
          <h2 className="text-xl font-bold">{detail.hub.name}</h2>
          <p>
            Tọa độ minh họa: {detail.hub.latitude}, {detail.hub.longitude}
          </p>
          <h3 className="font-bold">Xe tại Hub</h3>
          {detail.vehicles.length ? (
            detail.vehicles.map((v) => (
              <p key={v.id}>
                {v.code} · {v.vehicle_type} · pin {v.battery_percent}% ·{" "}
                {v.status}
              </p>
            ))
          ) : (
            <p>Chưa có xe.</p>
          )}
          <h3 className="font-bold">Chỗ đỗ</h3>
          {detail.spaces.map((s) => (
            <p key={s.id}>
              {s.code} · {s.space_kind} · {s.occupancy_status}
            </p>
          ))}
          <p>
            PRIVATE trống hiện tại không đồng nghĩa lịch tương lai còn trống.
          </p>
          <h3 className="font-bold">Cổng sạc</h3>
          {detail.chargingPoints.map((p) => (
            <p key={p.id}>
              {p.code} · {p.status}
            </p>
          ))}
        </article>
      )}
      {data && (
        <p className="text-sm text-slate-500">
          Đọc dữ liệu lúc {new Date(data.asOf).toLocaleString("vi-VN")}. Làm mới
          trang để cập nhật.
        </p>
      )}
    </section>
  );
}
