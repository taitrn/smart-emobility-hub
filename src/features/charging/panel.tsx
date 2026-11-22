"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ChargingSessionView, HubListView } from "@/lib/domain/views";

type Vehicle = { id: string; code: string; batteryPercent: number };

export function ChargingPanel() {
  const [hubs, setHubs] = useState<HubListView | null>(null);
  const [hubId, setHubId] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<ChargingSessionView[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/hubs", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw Error(json.error?.message);
        setHubs(json.data);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được Hub."));
  }, []);

  useEffect(() => {
    fetch("/api/charging-requests", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw Error(json.error?.message);
        setSessions(json.data);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được phiên sạc."));
  }, [tick]);

  useEffect(() => {
    if (!hubId) {
      return;
    }
    fetch(`/api/hubs/${hubId}`, { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw Error(json.error?.message);
        setVehicles(json.data.vehicles
          .filter((vehicle: { status: string }) => vehicle.status === "AVAILABLE")
          .map((vehicle: { id: string; code: string; batteryPercent: number }) => ({
            id: vehicle.id,
            code: vehicle.code,
            batteryPercent: vehicle.batteryPercent,
          })));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được xe."));
  }, [hubId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const vehicleId = String(form.get("vehicleId") || "");
    const departure = String(form.get("departure") || "");
    try {
      const response = await fetch("/api/charging-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          vehicleId,
          vehicleKind: "SHARED",
          hubId,
          ...(departure ? { desiredDepartureAt: new Date(departure + "+07:00").toISOString() } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw Error(json.error?.message);
      setNotice("Đã gửi yêu cầu sạc.");
      setTick((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi yêu cầu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-bold">Yêu cầu sạc xe</h1>
      {notice && <p role="status" className="rounded bg-teal-50 p-3 text-teal-800">{notice}</p>}
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {hubs && (
        <form onSubmit={submit} className="grid gap-3 rounded border bg-white p-4 md:grid-cols-2">
          <label>
            Hub
            <select required value={hubId} onChange={(event) => {
              setHubId(event.target.value);
              setVehicles([]);
            }} className="block border p-2">
              <option value="">Chọn Hub</option>
              {hubs.hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} · {hub.name}</option>)}
            </select>
          </label>
          <label>
            Xe dùng chung
            <select required name="vehicleId" className="block border p-2" disabled={!vehicles.length}>
              <option value="">Chọn xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.code} · pin {vehicle.batteryPercent}%</option>
              ))}
            </select>
          </label>
          <label>
            Giờ rời dự kiến (UTC+7, tùy chọn)
            <input name="departure" type="datetime-local" className="block border p-2" />
          </label>
          <button disabled={busy || !hubId || !vehicles.length} className="rounded bg-teal-700 px-4 py-2 text-white md:self-end">
            {busy ? "Đang gửi…" : "Gửi yêu cầu sạc"}
          </button>
        </form>
      )}

      <h2 className="text-xl font-bold">Phiên sạc của tôi</h2>
      {sessions.length === 0 && <p>Chưa có phiên sạc.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {sessions.map((session) => (
          <article key={session.id} className="rounded border bg-white p-4">
            <p className="font-bold">{session.vehicleCode} · {session.hubCode}</p>
            <p>Trạng thái: {session.status}</p>
            <p>Nhóm ưu tiên: {session.priority}</p>
            <p>Pin: {session.batteryPercent}%</p>
            {session.chargingPointCode && <p>Cổng: {session.chargingPointCode}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
