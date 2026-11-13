import type { Actor, HubSummary } from "../../lib/domain/types.ts";
import { notImplemented } from "../../lib/http/errors.ts";

// TODO [Ân, Toàn hỗ trợ — đề xuất]: summarize Hubs/assets and add simulated fault controls.
export async function getOperatorOverview(_actor: Actor): Promise<{ hubs: HubSummary[] }> {
  throw notImplemented("UC08 — Dashboard vận hành");
}
