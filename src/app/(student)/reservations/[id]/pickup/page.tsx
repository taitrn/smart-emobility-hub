"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PickupResponse = {
  ok: boolean;
  data?: { trip?: { id: string; status: string; vehicleId: string } };
  error?: { code?: string; message?: string };
};

export default function PickupPage() {
  const params = useParams<{ id: string }>();
  const [pickupCode, setPickupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tripId, setTripId] = useState<string | null>(null);

  async function handlePickup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || tripId) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/vehicle-reservations/${encodeURIComponent(params.id)}/pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCode: pickupCode.trim().toUpperCase(), requestId: crypto.randomUUID() }),
      });
      const result: PickupResponse = await response.json();
      if (!response.ok || !result.ok || !result.data?.trip) {
        setMessage(result.error?.message ?? "Không thể nhận xe. Vui lòng thử lại.");
        return;
      }
      setTripId(result.data.trip.id);
      setMessage("Nhận xe thành công! Chuyến đi đã bắt đầu.");
    } catch {
      setMessage("Không kết nối được máy chủ. Vui lòng kiểm tra mạng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nhận xe bằng mã đặt</h1>
        <p className="mt-2 text-sm text-slate-600">Nhập mã nhận xe của lượt đặt còn hiệu lực.</p>
      </div>
      <form onSubmit={handlePickup} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700" htmlFor="pickup-code">Mã nhận xe</label>
        <Input
          id="pickup-code"
          value={pickupCode}
          onChange={(event) => setPickupCode(event.target.value.toUpperCase())}
          minLength={12}
          maxLength={64}
          pattern="[A-Z2-7]{12,64}"
          autoComplete="off"
          required
          disabled={loading || tripId !== null}
          placeholder="Nhập mã nhận xe"
          className="uppercase"
        />
        <Button type="submit" disabled={loading || tripId !== null || !/^[A-Z2-7]{12,64}$/.test(pickupCode.trim())}>
          {loading ? "Đang xác nhận..." : tripId ? "Đã nhận xe" : "Xác nhận nhận xe"}
        </Button>
        {message && <p role="status" aria-live="polite" className="text-sm text-slate-700">{message}</p>}
        {tripId && <p className="break-all text-sm text-slate-600">Mã chuyến đi: {tripId}</p>}
      </form>
    </main>
  );
}
