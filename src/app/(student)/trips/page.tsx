import { loadTrips } from "@/features/rental/return";
import { ReturnForm } from "@/features/rental/return-form";
import { requirePageRole } from "@/lib/auth/page-access";
import { AppError } from "@/lib/http/errors";

const formatTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});

export default async function TripsPage() {
  const actor = await requirePageRole("STUDENT");
  let data: Awaited<ReturnType<typeof loadTrips>>;
  try {
    data = await loadTrips(actor);
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return <div className="space-y-3">
      <h1 className="text-2xl font-bold">Chuyến đi của tôi</h1>
      <p role="alert">{error.message}</p>
    </div>;
  }

  return <div className="mx-auto max-w-3xl space-y-5">
    <h1 className="text-2xl font-bold">Chuyến đi của tôi</h1>
    {data.trips.length === 0 && <p>Bạn chưa có chuyến đi. Chuyến sẽ xuất hiện sau khi nhận xe.</p>}
    {data.trips.map(trip => {
      const hub = data.hubs.find(item => item.id === trip.returnHubId);
      return <section key={trip.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Xe {data.vehicleCodes[trip.vehicleId] ?? trip.vehicleId}</h2>
        <p className="text-sm">Nhận xe lúc {formatTime.format(new Date(trip.startedAt))}</p>
        {trip.status === "ACTIVE"
          ? <ReturnForm tripId={trip.id} hubs={data.hubs} />
          : <p className="text-sm">Đã trả xe{hub && ` tại ${hub.name}`}
              {trip.endedAt && ` lúc ${formatTime.format(new Date(trip.endedAt))}`}.</p>}
      </section>;
    })}
  </div>;
}
