"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { PageHeading } from "@/components/ui/workspace";
import { SHARED_CONFIG } from "@/config/shared";
import type { VehicleReservationView } from "@/lib/domain/views";
import {
  createReservationRequestId,
  ReservationApiError,
  reservationErrorMessage,
  submitReservationRequest,
  useReservationResource,
} from "./reservation-api";
import {
  dangerAction,
  primaryAction,
  ReservationCard,
  ReservationError,
  reservationGrid,
  secondaryAction,
  SummaryRow,
} from "./reservation-ui";

type MyReservations = { reservations: VehicleReservationView[] };

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: SHARED_CONFIG.ui.timeZone,
});

function secondsRemaining(reservation: VehicleReservationView, now: number) {
  return Math.max(0, Math.ceil((Date.parse(reservation.expiresAt) - now) / 1_000));
}

function displayStatus(reservation: VehicleReservationView) {
  switch (reservation.status) {
    case "ACTIVE_HOLD": return "Đang giữ xe";
    case "CANCELLED": return "Đã hủy";
    case "EXPIRED": return "Hết hạn";
    case "FULFILLED": return reservation.tripStatus === "COMPLETED" ? "Đã hoàn tất" : "Đã nhận xe";
  }
}

function HoldDetails({ reservation, remaining, justPlaced, onCancel }: {
  reservation: VehicleReservationView;
  remaining: number;
  justPlaced: boolean;
  onCancel: () => void;
}) {
  const countdown = [Math.floor(remaining / 60), remaining % 60]
    .map((part) => String(part).padStart(2, "0")).join(":");
  const codeInput = useRef<HTMLInputElement>(null);
  const [copyMessage, setCopyMessage] = useState("");

  async function copyCode(button: HTMLButtonElement) {
    const input = codeInput.current;
    if (!input) return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(input.value);
        setCopyMessage("Đã sao chép mã nhận.");
        return;
      } catch {
        // Fall back to copying the selected text if clipboard access was denied.
      }
    }

    input.focus({ preventScroll: true });
    input.select();
    try {
      if (document.execCommand?.("copy")) {
        button.focus({ preventScroll: true });
        setCopyMessage("Đã sao chép mã nhận.");
        return;
      }
    } catch {
      // Leave the code selected if the browser blocks the legacy copy command.
    }
    setCopyMessage("Đã chọn mã nhận. Dùng lệnh Sao chép của trình duyệt.");
  }

  return (
    <div className={reservationGrid}>
      <div className="space-y-5">
        <PageHeading title={justPlaced ? "Đặt xe thành công" : "Lượt đặt của tôi"}
          description="Đến đúng Hub và ô đỗ trước khi hết thời gian giữ xe." />
        <ReservationCard className="space-y-1">
          <h2 className="text-xs font-semibold tracking-wide text-[#546a60] uppercase" id="hold-clock-label">Thời gian giữ xe còn lại</h2>
          <p role="timer" aria-labelledby="hold-clock-label" className="text-5xl leading-none font-bold text-[#153f34] tabular-nums">{countdown}</p>
        </ReservationCard>
        <ReservationCard>
          <dl>
            <SummaryRow label="Mã đặt xe"><span title={reservation.id}>{reservation.id.slice(0, 8).toUpperCase()}</span></SummaryRow>
            <SummaryRow label="Xe">{reservation.vehicleCode} - Ô đỗ {reservation.pickupSlotCode}</SummaryRow>
            <SummaryRow label="Hub">{reservation.hubName}</SummaryRow>
            <SummaryRow label="Giữ đến">{dateTime.format(new Date(reservation.expiresAt))}</SummaryRow>
          </dl>
        </ReservationCard>
      </div>
      <div className="space-y-5">
        <ReservationCard className="space-y-4">
          {reservation.pickupCode && (
            <>
              <div className="grid min-h-60 justify-items-center gap-2 rounded-xl border border-[#dce7df] bg-[#f4faf7] p-4 text-center">
                <QRCodeSVG value={reservation.pickupCode} size={140} marginSize={4} title="Mã QR nhận xe" />
                <div>
                  <label htmlFor="pickup-code" className="block text-xs text-[#546a60]">Mã nhận xe</label>
                  <input id="pickup-code" ref={codeInput} readOnly value={reservation.pickupCode}
                    className="w-44 rounded-sm bg-transparent text-center font-mono text-lg font-semibold tracking-[0.11em] text-[#153f34]" />
                </div>
                <button type="button" className="text-sm font-semibold text-[#117052] underline-offset-4 hover:underline"
                  onClick={(event) => void copyCode(event.currentTarget)}>Sao chép mã</button>
              </div>
              {copyMessage && <p role="status" className="text-[13px] text-[#546a60]">{copyMessage}</p>}
            </>
          )}
          <button type="button" className={`${secondaryAction} w-full`} onClick={onCancel}>Hủy đặt xe</button>
        </ReservationCard>
        {reservation.pickupCode && (
          <Link href={`/reservations/${reservation.id}/pickup`} className={`${primaryAction} w-full`}>
            Nhận xe
          </Link>
        )}
        <Link href={`/hubs/${reservation.hubId}`} className={`${secondaryAction} w-full`}>Xem Hub nhận xe</Link>
      </div>
    </div>
  );
}

export function MyVehicleReservations({ placedId }: { placedId?: string }) {
  const { data, setData, error, loading, reload } = useReservationResource<MyReservations>("/api/me/reservations");
  const [now, setNow] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<VehicleReservationView | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelProblem, setCancelProblem] = useState("");
  const [notice, setNotice] = useState("");
  const cancelDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    function tick() { setNow(Date.now()); }
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const reservations = data?.reservations.map((reservation): VehicleReservationView => {
    if (now !== null && reservation.status === "ACTIVE_HOLD" && secondsRemaining(reservation, now) === 0) {
      return { ...reservation, status: "EXPIRED", pickupCode: undefined };
    }
    return reservation;
  }) ?? [];
  const active = now !== null ? reservations.find((reservation) => reservation.status === "ACTIVE_HOLD") : undefined;
  const previous = reservations.filter((reservation) => reservation.status !== "ACTIVE_HOLD");
  const remaining = active && now !== null ? secondsRemaining(active, now) : 0;

  function openCancel(reservation: VehicleReservationView) {
    setCancelTarget(reservation);
    setCancelProblem("");
    cancelDialog.current?.showModal();
  }

  async function cancelReservation() {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    setCancelProblem("");
    try {
      const updated = await submitReservationRequest<VehicleReservationView>(
        `/api/vehicle-reservations/${cancelTarget.id}/cancel`, { requestId: createReservationRequestId() },
      );
      setData((current) => current && {
        reservations: current.reservations.map((reservation) => reservation.id === updated.id ? updated : reservation),
      });
      setNotice(`Đã hủy lượt đặt xe ${updated.vehicleCode}.`);
      cancelDialog.current?.close();
    } catch (failure) {
      const message = reservationErrorMessage(failure, "Chưa xác nhận được kết quả hủy. Vui lòng thử lại.");
      if (failure instanceof ReservationApiError
        && (failure.code === "RESERVATION_EXPIRED" || failure.code === "INVALID_STATE" || failure.code === "NOT_FOUND")) {
        setNotice(message);
        cancelDialog.current?.close();
        reload();
      } else {
        setCancelProblem(message);
      }
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="space-y-5">
      {!active && <PageHeading title="Lượt đặt của tôi" description="Theo dõi các lượt đặt xe dùng chung của bạn." />}
      {loading && <p role="status" className="text-sm text-[#546a60]">Đang tải lượt đặt…</p>}
      {error && <ReservationError message={error} onRetry={reload} />}
      {notice && <p role="status" className="rounded-lg border border-[#dce7df] bg-[#f4faf7] px-4 py-3 text-sm text-[#153f34]">{notice}</p>}
      {active && (
        <HoldDetails key={active.id} reservation={active} remaining={remaining}
          justPlaced={active.id === placedId} onCancel={() => openCancel(active)} />
      )}
      {data && !active && now !== null && (
        <ReservationCard className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#546a60]">Bạn chưa có lượt giữ xe còn hiệu lực.</p>
          <Link href="/reservations/new" className={primaryAction}>Đặt xe dùng chung</Link>
        </ReservationCard>
      )}
      {previous.length > 0 && (
        <ReservationCard className="space-y-3">
          <h2 className="text-base font-bold text-[#153f34]">Các lượt đã kết thúc</h2>
          <ul className="divide-y divide-[#dce7df]">
            {previous.map((reservation) => (
              <li key={reservation.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#153f34]">{reservation.vehicleCode} - {reservation.hubName}</p>
                  <p className="mt-1 text-[13px] text-[#546a60]">{dateTime.format(new Date(reservation.confirmedAt))}</p>
                </div>
                <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[#546a60]">{displayStatus(reservation)}</span>
              </li>
            ))}
          </ul>
        </ReservationCard>
      )}
      <dialog ref={cancelDialog} aria-labelledby="cancel-title" aria-describedby="cancel-description"
        className="fixed inset-0 m-auto w-[min(440px,calc(100%_-_2rem))] rounded-2xl bg-white p-7 text-[#172d25] shadow-[0_16px_40px_#153f3440] backdrop:bg-[#153f34]/42"
        onClose={() => { setCancelTarget(null); setCancelProblem(""); }}
        onCancel={(event) => { if (cancelling) event.preventDefault(); }}>
        <div className="space-y-3.5">
          <h2 id="cancel-title" className="text-xl font-bold text-[#153f34]">Hủy đặt xe này?</h2>
          <p id="cancel-description" className="text-sm/6 text-[#546a60]">Xe {cancelTarget?.vehicleCode} sẽ được giải phóng để người khác có thể đặt.</p>
          {cancelProblem && <ReservationError message={cancelProblem} />}
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className={secondaryAction} disabled={cancelling} autoFocus onClick={() => cancelDialog.current?.close()}>Giữ lại</button>
            <button type="button" className={dangerAction} disabled={cancelling}
              onClick={() => void cancelReservation()}>{cancelling ? "Đang hủy…" : "Hủy đặt xe"}</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
