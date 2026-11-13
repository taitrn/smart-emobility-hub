import { hubQuerySchema, listHubs } from "@/features/hubs/service";
import { handleApi } from "@/lib/http/handler";
import { success } from "@/lib/http/response";

// TODO [Tài — UC01]: keep public read separate from private reservation data.
export function GET(request: Request) {
  return handleApi(async context => {
    const query = hubQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return success(await listHubs(query), context.requestId);
  });
}
