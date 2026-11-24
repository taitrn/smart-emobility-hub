import { MyVehicleReservations } from "@/features/reservations/my-vehicle-reservations";
import { uuidSchema } from "@/lib/domain/schemas";

export default async function ReservationsPage({ searchParams }: PageProps<"/reservations">) {
  const placed = uuidSchema.safeParse((await searchParams).placed);
  return <MyVehicleReservations placedId={placed.data} />;
}
