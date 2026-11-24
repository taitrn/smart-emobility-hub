"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PickupResponse = {
  ok: boolean;
  data?: {
    command?: { state: "SUCCESS" | "FAILURE" };
    trip?: { id: string; status: string; vehicleId: string };
  };
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
      const response = await fetch(
        `/api/vehicle-reservations/${encodeURIComponent(params.id)}/pickup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupCode: pickupCode.trim().toUpperCase(),
            requestId: crypto.randomUUID(),
          }),
        },
      );

      const result: PickupResponse = await response.json();

      if (!response.ok || !result.ok) {
        setMessage(result.error?.message ?? "Không thể nhận xe. Vui lòng thử lại.");
        return;
      }

      if (result.data?.command?.state === "FAILURE") {
        setMessage("Thiết bị mở khóa mô phỏng thất bại. Xe chưa được nhận, vui lòng thử lại.");
        return;
      }

      if (result.data?.command?.state !== "SUCCESS" || !result.data.trip) {
        setMessage("Không thể xác nhận kết quả nhận xe. Vui lòng kiểm tra lại.");
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
    <section className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-[26px] leading-8 font-bold text-[#153f34]">
          Nhận xe bằng mã đặt
        </h1>
        <p className="app-muted mt-2">
          Nhập mã nhận xe của lượt đặt còn hiệu lực.
        </p>
      </div>

      <form
        onSubmit={handlePickup}
        className="app-surface space-y-4"
      >
        <label
          className="app-field"
          htmlFor="pickup-code"
        >
          Mã nhận xe
        </label>

        <Input
          id="pickup-code"
          value={pickupCode}
          onChange={(event) => setPickupCode(event.target.value.toUpperCase())}
          minLength={6}
          maxLength={6}
          pattern="[A-HJ-NP-Z2-9]{6}"
          autoComplete="off"
          required
          disabled={loading || tripId !== null}
          placeholder="Nhập mã nhận xe"
          className="uppercase"
        />

        <Button
          type="submit"
          disabled={
            loading ||
            tripId !== null ||
            !/^[A-HJ-NP-Z2-9]{6}$/.test(pickupCode.trim())
          }
        >
          {loading
            ? "Đang xác nhận..."
            : tripId
              ? "Đã nhận xe"
              : "Xác nhận nhận xe"}
        </Button>

        {message && (
          <p role="status" aria-live="polite" className="text-sm text-slate-700">
            {message}
          </p>
        )}

        {tripId && (
          <p className="app-muted">
            <Link href="/trips" className="app-secondary">Mở chuyến đi của tôi</Link>
          </p>
        )}
      </form>
    </section>
  );
}
