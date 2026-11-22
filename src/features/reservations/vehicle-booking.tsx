"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SHARED_CONFIG } from "@/config/shared";
import type { HubDetailView, HubListView, VehicleReservationView } from "@/lib/domain/views";
import {
  createReservationRequestId,
  ReservationApiError,
  reservationErrorMessage,
  submitReservationRequest,
  useReservationResource,
} from "./reservation-api";
import {
  primaryAction,
  ReservationCard,
  ReservationError,
  ReservationHeading,
  ReservationIcon,
  reservationGrid,
  secondaryAction,
  SummaryRow,
} from "./reservation-ui";

type Vehicle = HubDetailView["vehicles"][number];
const holdMinutes = SHARED_CONFIG.reservation.vehicleHoldMinutes;
const vehicleTypes: Record<string, string> = { E_BIKE: "Xe đạp điện", E_SCOOTER: "Xe máy điện" };
const unavailableStatuses: Record<string, string> = {
  RESERVED: "Đã được đặt",
  IN_USE: "Đang sử dụng",
  WAITING_CHARGE: "Chờ sạc",
  CHARGING: "Đang sạc",
  OUT_OF_SERVICE: "Tạm ngừng",
};

function HubChooser() {
  const { data, error, loading, reload } = useReservationResource<HubListView>("/api/hubs");

  return (
    <section className="max-w-[784px] space-y-5">
      <ReservationHeading title="Chọn Hub để đặt xe" description="Xem số xe sẵn sàng tại từng Hub." />
      {loading && <p role="status" className="text-sm text-[#546a60]">Đang tải danh sách Hub…</p>}
      {error && <ReservationError message={error} onRetry={reload} />}
      {data?.hubs.length === 0 && <ReservationCard>Chưa có Hub.</ReservationCard>}
      {data && (
        <ul className="grid gap-3">
          {data.hubs.map((hub) => {
            const available = hub.status === "ACTIVE" && hub.availableVehicleCount > 0;
            return (
              <li key={hub.id}>
                <ReservationCard className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e6f2ec]"><ReservationIcon name="pin" /></span>
                    <div>
                      <h2 className="font-bold text-[#153f34]">{hub.name}</h2>
                      <p className="text-sm text-[#546a60]">
                        {hub.code} · {hub.status === "MAINTENANCE" ? "Đang bảo trì" : `${hub.availableVehicleCount} xe sẵn sàng`}
                      </p>
                    </div>
                  </div>
                  {available && <Link href={`/reservations/new?hubId=${hub.id}`} className={secondaryAction}>Chọn Hub</Link>}
                </ReservationCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function VehicleSummary({ vehicle, hubName, selected = false }: { vehicle: Vehicle; hubName: string; selected?: boolean }) {
  return (
    <dl>
      <SummaryRow label={selected ? "Mã xe" : "Mã phương tiện"}>{vehicle.code}</SummaryRow>
      <SummaryRow label="Loại xe">{vehicleTypes[vehicle.vehicleType] ?? vehicle.vehicleType}</SummaryRow>
      <SummaryRow label="Mức pin">{vehicle.batteryPercent}%</SummaryRow>
      <SummaryRow label="Hub">{hubName}</SummaryRow>
      {!selected && <SummaryRow label="Thời gian giữ xe">{holdMinutes} phút</SummaryRow>}
    </dl>
  );
}

function VehiclePicker({ hubId }: { hubId: string }) {
  const router = useRouter();
  const { data, error, loading, reload } = useReservationResource<HubDetailView>(`/api/hubs/${hubId}`);
  const [vehicleId, setVehicleId] = useState("");
  const [filter, setFilter] = useState("all");
  const [minimumBattery, setMinimumBattery] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState("");
  const [showExistingHold, setShowExistingHold] = useState(false);
  const attempt = useRef<{ vehicleId: string; requestId: string } | null>(null);

  const cars = data?.vehicles ?? [];
  const filtered = cars.filter((vehicle) =>
    (filter === "all" || vehicle.vehicleType === filter) && (!minimumBattery || vehicle.batteryPercent >= 50),
  );
  const selected = filtered.find((vehicle) => vehicle.id === vehicleId && vehicle.isBookable)
    ?? filtered.find((vehicle) => vehicle.isBookable);

  function chooseVehicle(id: string) {
    setVehicleId(id);
    setProblem("");
    setShowExistingHold(false);
  }

  async function book(vehicle: Vehicle) {
    if (submitting) return;
    setSubmitting(true);
    setProblem("");
    setShowExistingHold(false);
    try {
      const prior = attempt.current;
      const requestId = prior?.vehicleId === vehicle.id ? prior.requestId : createReservationRequestId();
      attempt.current = { vehicleId: vehicle.id, requestId };
      const reservation = await submitReservationRequest<VehicleReservationView>("/api/vehicle-reservations", {
        requestId,
        vehicleId: vehicle.id,
      });
      router.push(`/reservations?placed=${reservation.id}`);
    } catch (failure) {
      const code = failure instanceof ReservationApiError ? failure.code : undefined;
      setProblem(reservationErrorMessage(failure, "Chưa xác nhận được kết quả đặt xe. Vui lòng thử lại."));
      setShowExistingHold(code === "ACTIVE_HOLD_EXISTS");
      if (code === "VEHICLE_UNAVAILABLE" || code === "HUB_MAINTENANCE") {
        setConfirming(false);
        reload();
      }
      setSubmitting(false);
    }
  }

  if (!data) return (
    <section className="space-y-5">
      <ReservationHeading title="Chọn xe đặt" />
      {loading && <p role="status" className="text-sm text-[#546a60]">Đang tải xe tại Hub…</p>}
      {error && <ReservationError message={error} onRetry={reload} />}
      <Link href="/reservations/new" className={secondaryAction}>Đổi Hub</Link>
    </section>
  );

  if (confirming && selected) {
    return (
      <section className="space-y-5">
        <ReservationHeading title={`Xác nhận đặt xe ${selected.code}`} description={`Kiểm tra thông tin trước khi giữ xe trong ${holdMinutes} phút.`} />
        <div className={reservationGrid}>
          <ReservationCard><VehicleSummary vehicle={selected} hubName={data.hub.name} /></ReservationCard>
          <ReservationCard className="space-y-3.5">
            <h2 className="text-base font-bold text-[#153f34]">Tóm tắt lượt đặt</h2>
            <p className="text-[13px]/5 text-[#546a60]">Xe sẽ được giải phóng nếu bạn không nhận đúng hạn.</p>
            {problem && <ReservationError message={problem} />}
            {showExistingHold ? (
              <Link href="/reservations" className={`${primaryAction} w-full`}>Xem lượt đang giữ</Link>
            ) : (
              <button type="button" className={`${primaryAction} w-full`} disabled={submitting}
                onClick={() => void book(selected)}>{submitting ? "Đang xác nhận…" : "Xác nhận đặt xe"}</button>
            )}
            <button type="button" className={`${secondaryAction} w-full`} disabled={submitting}
              onClick={() => { setConfirming(false); setProblem(""); setShowExistingHold(false); }}>Chọn xe khác</button>
          </ReservationCard>
        </div>
      </section>
    );
  }

  const stats = [
    { icon: "bike", count: cars.filter((vehicle) => vehicle.isBookable).length, label: "xe sẵn sàng" },
    { icon: "parking", count: data.spaces.filter((slot) => slot.spaceKind === "FLEET" && slot.occupancyStatus === "FREE").length, label: "chỗ đỗ trống" },
    { icon: "charge", count: data.chargingPoints.filter((point) => point.status === "AVAILABLE").length, label: "cổng sạc trống" },
  ] as const;
  const chip = "rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[#546a60] aria-pressed:bg-[#e1efe7] aria-pressed:text-[#117052] hover:bg-[#e1efe7]";

  return (
    <section className={reservationGrid}>
      <div className="min-w-0 space-y-5">
        <ReservationHeading title="Chọn xe đặt" description="Chọn một xe sẵn sàng tại Hub rồi kiểm tra thông tin trước khi xác nhận." />
        {(problem || error) && <ReservationError message={problem || error} onRetry={error ? reload : undefined} />}
        <ReservationCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#153f34]">{data.hub.name}</h2>
              <p className="text-[13px]/5 text-[#546a60]">{data.hub.code} · {data.hub.status === "ACTIVE" ? "Đang hoạt động" : "Đang bảo trì"}</p>
            </div>
            <Link href="/reservations/new" className={secondaryAction}>Đổi Hub</Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]/5 text-[#546a60]">
            {stats.map(({ icon, count, label }) => (
              <li key={icon} className="flex items-center gap-1.5">
                <ReservationIcon name={icon} /><b className="text-[#153f34]">{count}</b> {label}
              </li>
            ))}
          </ul>
        </ReservationCard>
        <ReservationCard className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#153f34]">Danh sách xe</h2>
            <p className="text-[13px] text-[#546a60]">{loading ? "Đang cập nhật…" : `${filtered.length} / ${cars.length} xe`}</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Lọc xe">
            <button type="button" className={chip} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Tất cả</button>
            {Object.entries(vehicleTypes).filter(([type]) => cars.some((vehicle) => vehicle.vehicleType === type)).map(([type, label]) => (
              <button type="button" className={chip} key={type} aria-pressed={filter === type} onClick={() => setFilter(type)}>{label}</button>
            ))}
            <button type="button" className={chip} aria-pressed={minimumBattery} onClick={() => setMinimumBattery((value) => !value)}>Pin ≥ 50%</button>
          </div>
          {filtered.length === 0 ? (
            <p className="py-4 text-sm text-[#546a60]">Không có xe phù hợp với bộ lọc.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] border-separate border-spacing-0 text-left text-sm">
                <thead className="text-xs font-semibold tracking-wide text-[#546a60] uppercase">
                  <tr><th scope="col" className="px-3 py-3 font-semibold">Mã xe</th><th scope="col" className="px-3 py-3 font-semibold">Loại xe</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Pin</th><th scope="col" className="px-3 py-3 font-semibold">Trạng thái</th></tr>
                </thead>
                <tbody>
                  {filtered.map((vehicle) => {
                    const isSelected = selected?.id === vehicle.id;
                    const cell = isSelected ? "border-y border-[#147a59] bg-[#f4faf7]" : "border-b border-[#dce7df]";
                    return (
                      <tr key={vehicle.id}>
                        <td className={`px-3 py-3 ${cell} ${isSelected ? "rounded-l-lg border-l" : ""}`}>
                          {vehicle.isBookable ? <button type="button" className="font-semibold underline-offset-4 hover:underline"
                            aria-label={`Chọn xe ${vehicle.code}`} aria-pressed={isSelected}
                            onClick={() => chooseVehicle(vehicle.id)}>{vehicle.code}</button> : <span className="font-semibold">{vehicle.code}</span>}
                        </td>
                        <td className={`px-3 py-3 ${cell}`}>{vehicleTypes[vehicle.vehicleType] ?? vehicle.vehicleType}</td>
                        <td className={`px-3 py-3 font-semibold tabular-nums ${cell}`}>{vehicle.batteryPercent}%</td>
                        <td className={`px-3 py-3 ${cell} ${isSelected ? "rounded-r-lg border-r" : ""}`}>
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${vehicle.isBookable ? "bg-[#e6f2ec] text-[#117052]" : vehicle.status === "RESERVED" ? "bg-[#fbeaea] text-[#a12d2d]" : "bg-[#eef3ef] text-[#546a60]"}`}>
                            {vehicle.isBookable ? "Sẵn sàng" : unavailableStatuses[vehicle.status] ?? "Chưa khả dụng"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ReservationCard>
      </div>
      <ReservationCard className="space-y-3.5">
        <h2 className="text-xs font-semibold tracking-wide text-[#546a60] uppercase">Xe đã chọn</h2>
        {selected ? (
          <>
            <VehicleSummary vehicle={selected} hubName={data.hub.name} selected />
            <p className="text-[13px]/5 text-[#546a60]">Sau khi xác nhận, xe được giữ trong {holdMinutes} phút.</p>
          </>
        ) : <p className="text-sm text-[#546a60]">Không có xe sẵn sàng trong danh sách này.</p>}
        <button type="button" disabled={!selected || loading || Boolean(error)} className={`${primaryAction} w-full`}
          onClick={() => { setProblem(""); setConfirming(true); }}>Tiếp tục đặt xe</button>
      </ReservationCard>
    </section>
  );
}

export function VehicleBooking({ hubId }: { hubId?: string }) {
  return hubId ? <VehiclePicker key={hubId} hubId={hubId} /> : <HubChooser />;
}
