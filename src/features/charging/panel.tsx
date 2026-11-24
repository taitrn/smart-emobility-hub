"use client";
import { PageHeading, StatusBadge } from "@/components/ui/workspace";

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
      <PageHeading title="Đăng ký phiên sạc" description="Chọn Hub, xe và giờ rời dự kiến để gửi yêu cầu vào hàng đợi." />
      {notice && <p role="status" className="app-notice">{notice}</p>}
      {error && <p role="alert" className="app-error">{error}</p>}

      {hubs && (
        <form onSubmit={submit} className="app-surface grid gap-4 sm:grid-cols-2">
          <label className="app-field">
            Hub
            <select required value={hubId} onChange={(event) => {
              setHubId(event.target.value);
              setVehicles([]);
            }} className="app-control">
              <option value="">Chọn Hub</option>
              {hubs.hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} - {hub.name}</option>)}
            </select>
          </label>
          <label className="app-field">
            Xe dùng chung
            <select required name="vehicleId" className="app-control" disabled={!vehicles.length}>
              <option value="">Chọn xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.code} - pin {vehicle.batteryPercent}%</option>
              ))}
            </select>
          </label>
          <label className="app-field">
            Giờ rời dự kiến (UTC+7, tùy chọn)
            <input name="departure" type="datetime-local" className="app-control" />
          </label>
          <button disabled={busy || !hubId || !vehicles.length} className="app-action self-end">
            {busy ? "Đang gửi…" : "Gửi yêu cầu sạc"}
          </button>
        </form>
      )}

      <h2 className="app-subtitle">Phiên sạc của tôi</h2>
      {sessions.length === 0 && <p>Chưa có phiên sạc.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {sessions.map((session) => (
          <article key={session.id} className="app-surface space-y-2">
            <p className="font-bold">{session.vehicleCode} - {session.hubCode}</p>
            <p><StatusBadge status={session.status} /></p>
            <p><StatusBadge status={session.priority} /></p>
            <p>Pin: {session.batteryPercent}%</p>
            {session.chargingPointCode && <p>Cổng: {session.chargingPointCode}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
