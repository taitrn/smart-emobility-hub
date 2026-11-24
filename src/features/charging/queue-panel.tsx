"use client";

import { useEffect, useState } from "react";
import type { ChargingSessionView } from "@/lib/domain/views";

export function ChargingQueuePanel() {
  const [sessions, setSessions] = useState<ChargingSessionView[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/charging-requests", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw Error(json.error?.message);
        setSessions(json.data);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được hàng đợi."));
  }, [tick]);

  async function process() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/operator/charging/process", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
      });
      const json = await response.json();
      if (!response.ok) throw Error(json.error?.message);
      setNotice(`Đã cấp cổng cho ${json.data.processed} phiên.`);
      setTick((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xử lý hàng đợi.");
    } finally {
      setBusy(false);
    }
  }

  async function complete(sessionId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/operator/charging/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ requestId: crypto.randomUUID() }),
      });
      const json = await response.json();
      if (!response.ok) throw Error(json.error?.message);
      setNotice("Đã hoàn tất phiên sạc và giải phóng cổng.");
      setTick((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể hoàn tất phiên sạc.");
    } finally {
      setBusy(false);
    }
  }

  const waiting = sessions.filter((session) => session.status === "WAITING");
  const charging = sessions.filter((session) => session.status === "CHARGING");

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-bold">Hàng đợi sạc</h1>
      {notice && <p role="status" className="rounded bg-teal-50 p-3 text-teal-800">{notice}</p>}
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      <button onClick={() => void process()} disabled={busy} className="rounded bg-teal-700 px-4 py-2 text-white">
        Xử lý hàng đợi
      </button>

      <h2 className="text-xl font-bold">Đang chờ</h2>
      {waiting.length === 0 && <p>Không có yêu cầu chờ.</p>}
      {waiting.map((session) => (
        <article key={session.id} className="rounded border bg-white p-3">
          <p className="font-bold">{session.priority} · {session.vehicleCode} · {session.hubCode}</p>
          <p>Pin {session.batteryPercent}% · tạo lúc {new Date(session.createdAt).toLocaleString("vi-VN")}</p>
        </article>
      ))}

      <h2 className="text-xl font-bold">Đang sạc</h2>
      {charging.length === 0 && <p>Không có phiên đang sạc.</p>}
      {charging.map((session) => (
        <article key={session.id} className="flex items-center justify-between rounded border bg-white p-3">
          <div>
            <p className="font-bold">{session.vehicleCode} · {session.chargingPointCode}</p>
            <p>Pin {session.batteryPercent}% · {session.hubName}</p>
          </div>
          <button disabled={busy} onClick={() => void complete(session.id)} className="rounded bg-teal-700 px-3 py-2 text-white">
            Hoàn tất
          </button>
        </article>
      ))}
    </section>
  );
}
