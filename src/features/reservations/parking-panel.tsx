"use client";
import { useState, useEffect, type FormEvent } from "react";
type Data = {
  vehicles: { id: string; plate_number: string }[];
  slots: { id: string; code: string; occupancy_status: string }[];
  reservations: {
    id: string;
    private_vehicle_id: string;
    slot_id: string;
    starts_at: string;
    ends_at: string;
    status: string;
  }[];
};
export function ParkingPanel({ operator = false }: { operator?: boolean }) {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/parking-reservations", { signal: c.signal, cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error?.message);
        setData(j.data);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [tick]);
  async function mutate(url: string, body: object) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, requestId: crypto.randomUUID() }),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error?.message);
      setTick((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xử lý.");
    } finally {
      setBusy(false);
    }
  }
  function reserve(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const start = new Date(String(f.get("start")));
    const end = new Date(String(f.get("end")));
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start.getTime() <= Date.now()
    ) {
      setError(
        "Chọn giờ bắt đầu từ phút kế tiếp trở đi; giờ đã qua không thể đặt.",
      );
      return;
    }
    if (end.getTime() - start.getTime() < 30 * 60_000) {
      setError("Khoảng đặt phải dài ít nhất 30 phút.");
      return;
    }
    void mutate("/api/parking-reservations", {
      privateVehicleId: f.get("vehicle"),
      slotId: f.get("slot"),
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-bold">
        {operator ? "Mô phỏng đến/rời chỗ đỗ" : "Đặt chỗ đỗ cá nhân"}
      </h1>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Đang tải…</p>}
      <button
        disabled={busy}
        className="underline"
        onClick={() => {
          setError("");
          setTick((v) => v + 1);
        }}
      >
        Làm mới
      </button>
      {data &&
        !operator &&
        (data.vehicles.length ? (
          <form onSubmit={reserve} className="grid gap-3 rounded border p-4">
            <label>
              Xe cá nhân
              <select required name="vehicle" className="block border p-2">
                {data.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chỗ PRIVATE
              <select required name="slot" className="block border p-2">
                {data.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.occupancy_status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bắt đầu
              <input
                required
                type="datetime-local"
                name="start"
                className="block border p-2"
              />
            </label>
            <label>
              Kết thúc
              <input
                required
                type="datetime-local"
                name="end"
                className="block border p-2"
              />
            </label>
            <p>
              Chọn bắt đầu từ phút kế tiếp, thời lượng ít nhất 30 phút. Giờ nhập
              theo múi giờ máy; lịch tương lai không giữ occupancy hiện tại.
            </p>
            <button
              disabled={busy || !data.slots.length}
              className="bg-teal-700 p-2 text-white rounded"
            >
              Đặt chỗ
            </button>
          </form>
        ) : (
          <p>
            Chưa có xe cá nhân cho tài khoản này. Liên hệ người quản trị để cấp
            xe demo.
          </p>
        ))}
      {data && (
        <>

          <h2 className="text-xl font-bold">
            {operator ? "Các lượt đặt" : "Lượt đặt của tôi"}
          </h2>
          {data.reservations.length === 0 && <p>Chưa có lượt đặt.</p>}
          {data.reservations.map((r) => (
            <article key={r.id} className="border rounded p-4 space-y-2">
              <p>
                {data.slots.find((s) => s.id === r.slot_id)?.code ?? r.slot_id}{" "}
                · {r.status}
              </p>
              <p>
                {new Date(r.starts_at).toLocaleString("vi-VN")} →{" "}
                {new Date(r.ends_at).toLocaleString("vi-VN")}
              </p>
              {!operator && r.status === "CONFIRMED" && (
                <button
                  disabled={busy}
                  className="underline"
                  onClick={() =>
                    void mutate(`/api/parking-reservations/${r.id}/cancel`, {})
                  }
                >
                  Hủy lượt đặt
                </button>
              )}
              {operator && r.status === "CONFIRMED" && (
                <button
                  disabled={busy}
                  className="underline"
                  onClick={() =>
                    void mutate("/api/operator/parking-events", {
                      reservationId: r.id,
                      event: "ARRIVED",
                    })
                  }
                >
                  Mô phỏng đến
                </button>
              )}
              {operator && r.status === "CHECKED_IN" && (
                <button
                  disabled={busy}
                  className="underline"
                  onClick={() =>
                    void mutate("/api/operator/parking-events", {
                      reservationId: r.id,
                      event: "DEPARTED",
                    })
                  }
                >
                  Mô phỏng rời
                </button>
              )}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
