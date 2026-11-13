import { NextResponse } from "next/server";
import type { ErrorCode } from "./errors.ts";

export type { ErrorCode } from "./errors.ts";

export type ApiSuccess<T> = { ok: true; data: T; requestId: string };
export type ApiFailure = {
  ok: false;
  error: { code: ErrorCode; message: string; field?: string; retryable: boolean };
  requestId: string;
};

export function success<T>(data: T, requestId = crypto.randomUUID(), status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data, requestId }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}

export function failure(
  error: ApiFailure["error"],
  status: number,
  requestId = crypto.randomUUID(),
) {
  return NextResponse.json<ApiFailure>({ ok: false, error, requestId }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}
