import type { HubListView } from "../../lib/domain/views.ts";
import type { HubStatus } from "../../lib/domain/types.ts";
export type HubResources = {
  hubs: {
    id: string;
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
  }[];
  vehicles: {
    id: string;
    hub_id: string;
    code: string;
    vehicle_type: string;
    battery_percent: number;
    status: string;
  }[];
  spaces: {
    id: string;
    hub_id: string;
    code: string;
    space_kind: string;
    occupancy_status: string;
  }[];
  points: { id: string; hub_id: string; code: string; status: string }[];
};
export function summarizeHubs(
  data: HubResources,
  query: {
    status?: string;
    q?: string;
    vehicleType?: string;
    minBattery?: number;
  },
  asOf = new Date().toISOString(),
): HubListView {
  const hubs = data.hubs
    .filter((h) => !query.status || h.status === query.status)
    .filter(
      (h) =>
        !query.q ||
        `${h.code} ${h.name}`
          .toLocaleLowerCase("vi")
          .includes(query.q.toLocaleLowerCase("vi")),
    )
    .map((h) => ({
      id: h.id,
      code: h.code,
      name: h.name,
      coordinates: { latitude: h.latitude, longitude: h.longitude },
      status: h.status as HubStatus,
      availableVehicleCount:
        h.status === "ACTIVE"
          ? data.vehicles.filter(
              (v) =>
                v.hub_id === h.id &&
                v.status === "AVAILABLE" &&
                (!query.vehicleType || v.vehicle_type === query.vehicleType) &&
                v.battery_percent >= (query.minBattery ?? 0),
            ).length
          : 0,
      freeFleetSpaces: data.spaces.filter(
        (s) =>
          s.hub_id === h.id &&
          s.space_kind === "FLEET" &&
          s.occupancy_status === "FREE",
      ).length,
      availableChargingPointCount: data.points.filter(
        (p) => p.hub_id === h.id && p.status === "AVAILABLE",
      ).length,
      asOf,
    }))
    .filter((h) =>
      query.vehicleType || query.minBattery !== undefined
        ? h.availableVehicleCount > 0
        : true,
    );
  return { hubs, asOf, stale: false };
}
