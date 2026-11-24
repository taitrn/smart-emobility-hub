"use client";
import { StatusBadge } from "@/components/ui/workspace";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ReturnHub } from "./return";
import type { RentalCommandResult } from "@/lib/domain/views";
import type { ApiFailure, ApiSuccess } from "@/lib/http/response";

export function ReturnForm({ tripId, hubs }: { tripId: string; hubs: ReturnHub[] }) {
  const router = useRouter();
  const [hubId, setHubId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const slots = hubs.find(hub => hub.id === hubId)?.slots ?? [];
  const selectedSlot = slots.find(slot => slot.id === slotId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || completed || !selectedSlot) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/trips/${tripId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubId, slotId: selectedSlot.id, requestId: crypto.randomUUID() }),
      });
      const result: ApiFailure | ApiSuccess<RentalCommandResult> = await response.json();
      if (!result.ok) {
        setError(result.error.code === "DEVICE_FAILURE"
          ? "Khóa mô phỏng thất bại. Chuyến vẫn đang hoạt động."
          : result.error.message);
        if (response.status === 409) router.refresh();
        return;
      }
      setCompleted(true);
      router.refresh();
    } catch {
      setError("Không nhận được kết quả. Hãy tải lại trang để kiểm tra chuyến.");
    } finally {
      setBusy(false);
    }
  }

  if (completed) return <p role="status">Đã khóa xe và kết thúc chuyến.</p>;

  return <form onSubmit={submit} className="space-y-3">
    <StatusBadge status="IN_USE" />
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="app-field">
        Hub trả xe
        <select disabled={busy} value={hubId} onChange={event => {
          setHubId(event.target.value);
          setSlotId("");
          setError("");
        }} className="app-control">
          <option value="">Chọn Hub</option>
          {hubs.filter(hub => hub.status === "ACTIVE").map(hub => <option key={hub.id} value={hub.id}>
            {hub.code} - {hub.name} ({hub.slots.length ? `${hub.slots.length} chỗ trống` : "đầy"})
          </option>)}
        </select>
      </label>
      <label className="app-field">
        Chỗ FLEET
        <select disabled={busy || slots.length === 0} value={selectedSlot?.id ?? ""}
          onChange={event => setSlotId(event.target.value)}
          className="app-control">
          <option value="">Chọn chỗ đỗ</option>
          {slots.map(slot => <option key={slot.id} value={slot.id}>{slot.code}</option>)}
        </select>
      </label>
    </div>
    {hubId && slots.length === 0 && <p role="status" className="text-sm">Hub đã hết chỗ FLEET. Hãy chọn Hub khác.</p>}
    {error && <p role="alert" className="app-error">{error}</p>}
    <Button disabled={busy || !selectedSlot}>{busy ? "Đang khóa xe…" : "Xác nhận trả xe"}</Button>
  </form>;
}
