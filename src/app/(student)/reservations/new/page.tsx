import { VehicleBooking } from "@/features/reservations/vehicle-booking";
import { uuidSchema } from "@/lib/domain/schemas";

export default async function NewReservationPage({ searchParams }: PageProps<"/reservations/new">) {
  const hub = uuidSchema.safeParse((await searchParams).hubId);
  return <VehicleBooking key={hub.data ?? "hubs"} hubId={hub.data} />;
}
