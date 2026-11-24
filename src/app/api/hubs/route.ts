import { hubQuerySchema, listHubs } from "@/features/hubs/service";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

// Public resource data only; private reservations are never selected.
export function GET(request: Request) {
  return handleApi(async (context) => {
    const query = hubQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return success(await listHubs(query), context.requestId);
  });
}
