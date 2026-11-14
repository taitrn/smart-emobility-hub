"use client";
import { useState, useEffect, useRef, type FormEvent } from "react";
import {
  parkingInputToUtc,
  parkingDisplay,
  parkingWindowError,
} from "./parking-rules";

type Data = {
  total: number;
  vehicles: { id: string; plate_number: string }[];
  slots: { id: string; code: string; occupancy_status: string }[];
  reservations: {
    id: string;
    plate_number: string;
    owner_name: string;
    hub_name: string;
    private_vehicle_id: string;
    slot_id: string;
    starts_at: string;
    ends_at: string;
    status: string;
  }[];
};
export function ParkingPanel({ operator = false }: { operator?: boolean }) {
  const pending = useRef<{ key: string; id: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [notice, setNotice] = useState("");
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    fetch(
      `/api/parking-reservations?page=${page}${status ? `&status=${status}` : ""}`,
      { signal: c.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error?.message);
        setData(j.data);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [tick, page, status]);
  async function mutate(url: string, body: object) {
    setBusy(true);
    setError("");
    setNotice("");
    const key = JSON.stringify([url, body]);
    if (pending.current?.key !== key)
      pending.current = { key, id: crypto.randomUUID() };
    try {
      const r = await fetch(url, {
        method: "POST",
        signal:AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, requestId: pending.current!.id }),
      });
      const j = await r.json();
      if (!r.ok) {
        pending.current = null;
        throw Error(j.error?.message);
      }
      pending.current = null;
      setNotice("Thao tác thành công.");
      setTick((v) => v + 1);
    } catch (e) {
      setError(pending.current ? "Chưa xác nhận được kết quả. Bấm lại cùng nội dung để thử lại an toàn." : e instanceof Error ? e.message : "Không thể xử lý.");
    } finally {
      setBusy(false);
    }
  }
  function reserve(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const required: Record<string, string> = { vehicle: "Vui lòng chọn xe.", slot: "Vui lòng chọn chỗ đỗ.", start: "Vui lòng chọn giờ bắt đầu.", end: "Vui lòng chọn giờ kết thúc." };
    const missing = Object.fromEntries(Object.entries(required).filter(([key]) => !f.get(key)));
    setFieldErrors(missing);
    if (Object.keys(missing).length) return;
    const startText = String(f.get("start") ?? ""),
      endText = String(f.get("end") ?? "");
    if (!startText || !endText) {
      setError("Nhập đủ giờ bắt đầu và kết thúc.");
      return;
    }
    const start = new Date(parkingInputToUtc(startText)),
      end = new Date(parkingInputToUtc(endText));
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start.getTime() <= Date.now()
    ) {
      setError("Chọn giờ bắt đầu từ phút kế tiếp trở đi (UTC+7).");
      return;
    }
    const windowError = parkingWindowError(
      start.toISOString(),
      end.toISOString(),
    );
    if (windowError) {
      setError(windowError);
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
      {notice && (
        <p role="status" className="sticky top-2 z-10 rounded bg-teal-50 p-2 text-teal-800">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="sticky top-2 z-10 rounded bg-red-50 p-2 text-red-700">
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
          <form noValidate onSubmit={reserve} onChange={(e) => { const target = e.target; if ((target instanceof HTMLInputElement || target instanceof HTMLSelectElement) && target.name && target.value) setFieldErrors((errors) => ({ ...errors, [target.name]: "" })); }} className="grid gap-3 rounded border p-4">
            <label>
              Xe cá nhân
              <select required name="vehicle" className="block border p-2">
                <option value="">Chọn xe</option>
                {data.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number}
                  </option>
                ))}
              </select>
              {fieldErrors.vehicle && <span role="alert" className="text-red-700">{fieldErrors.vehicle}</span>}
            </label>
            <label>
              Chỗ PRIVATE
              <select required name="slot" className="block border p-2">
                <option value="">Chọn chỗ đỗ</option>
                {data.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.occupancy_status}
                  </option>
                ))}
              </select>
              {fieldErrors.slot && <span role="alert" className="text-red-700">{fieldErrors.slot}</span>}
            </label>
            <label>
              Bắt đầu
              <input
                required
                type="datetime-local"
                name="start"
                className="block border p-2"
              />
              {fieldErrors.start && <span role="alert" className="text-red-700">{fieldErrors.start}</span>}
            </label>
            <label>
              Kết thúc
              <input
                required
                type="datetime-local"
                name="end"
                className="block border p-2"
              />
              {fieldErrors.end && <span role="alert" className="text-red-700">{fieldErrors.end}</span>}
            </label>
            <p>
              Chọn bắt đầu từ phút kế tiếp, thời lượng ít nhất 30 phút. Giờ nhập
              theo UTC+7 (Việt Nam); lịch tương lai không giữ occupancy hiện
              tại.
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
          {
            <>
              <label>
                Lọc trạng thái
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                    setError("");
                  }}
                  className="border p-2"
                >
                  <option value="">Tất cả</option>
                  {["CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </label>
              <p>
                Tổng: {data.total} lượt · Trang {page}
              </p>
              <button
                disabled={page === 1 || busy}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </button>{" "}
              ·{" "}
              <button
                disabled={page * 10 >= data.total || busy}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </button>
            </>
          }
          {data.reservations.map((r) => (
            <article key={r.id} className="border rounded p-4 space-y-2">
              <p>
                {r.plate_number} · {r.hub_name}
                {operator ? ` · ${r.owner_name}` : ""}
              </p>
              <p>
                {data.slots.find((s) => s.id === r.slot_id)?.code ?? r.slot_id}{" "}
                · {r.status}
              </p>
              <p>
                {parkingDisplay(r.starts_at)} → {parkingDisplay(r.ends_at)}
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
