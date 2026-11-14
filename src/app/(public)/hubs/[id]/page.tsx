import { HubBrowser } from "@/features/hubs/browser";
import { uuidSchema } from "@/lib/domain/schemas";
import { notFound } from "next/navigation";
export default async function HubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  return <HubBrowser initialHubId={id} />;
}
