"use client";

import { useEffect, useState } from "react";
import type { ApiFailure, ApiSuccess } from "@/lib/http/response";

export class ReservationApiError extends Error {
  constructor(message: string, readonly code?: ApiFailure["error"]["code"]) {
    super(message);
  }
}

export function createReservationRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  // randomUUID is unavailable on plain HTTP LAN origins.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
    hex.slice(16, 20), hex.slice(20),
  ].join("-");
}

export async function reservationRequest<T>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    ...options,
  });
  const result: ApiSuccess<T> | ApiFailure = await response.json();
  if (!result.ok) throw new ReservationApiError(result.error.message, result.error.code);
  if (!response.ok) throw new ReservationApiError("Không thể xử lý yêu cầu.");
  return result.data;
}

export function submitReservationRequest<T>(url: string, input: Record<string, string>) {
  return reservationRequest<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function reservationErrorMessage(error: unknown, fallback: string) {
  return error instanceof ReservationApiError ? error.message : fallback;
}

export function useReservationResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
    void reservationRequest<T>(url, { signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) {
          setError(reservationErrorMessage(failure, "Không tải được dữ liệu. Vui lòng thử lại."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt, url]);

  function reload() {
    setLoading(true);
    setError("");
    setAttempt((value) => value + 1);
  }

  return { data, setData, error, loading, reload };
}
