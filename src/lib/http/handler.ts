import { z } from "zod";
import { AppError } from "./errors.ts";
import { failure } from "./response";

type RequestContext = { requestId: string };

// One JSON/error format for every feature. No SQL, tokens or request body in logs.
export async function handleApi(
  action: (context: RequestContext) => Promise<Response>,
) {
  const context = { requestId: crypto.randomUUID() as string };
  try {
    return await action(context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(
        {
          code: "INVALID_INPUT",
          message:
            error.issues[0]?.code === "custom"
              ? error.issues[0].message
              : "Dữ liệu đầu vào không hợp lệ.",
          field: error.issues[0]?.path.join(".") || "body",
          retryable: false,
        },
        400,
        context.requestId,
      );
    }
    if (error instanceof AppError) {
      return failure(
        {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
        },
        error.status,
        context.requestId,
      );
    }
    console.error("Unhandled API error", { requestId: context.requestId });
    return failure(
      {
        code: "INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu.",
        retryable: false,
      },
      500,
      context.requestId,
    );
  }
}

export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
  context?: RequestContext,
): Promise<z.output<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("INVALID_INPUT", "Request phải chứa JSON hợp lệ.", 400);
  }
  if (context && body && typeof body === "object" && "requestId" in body) {
    const id = z.uuid().safeParse(body.requestId);
    if (id.success) context.requestId = id.data;
  }
  return schema.parse(body);
}
