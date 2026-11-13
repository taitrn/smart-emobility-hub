import { z } from "zod";

// Shared wire-format validation only. Ownership, deadlines, availability,
// concurrency and idempotency must still be checked inside the DB transaction.
export const uuidSchema = z.uuid();
export const mutationSchema = z.object({ requestId: uuidSchema });
export const timestampSchema = z.iso.datetime({ offset: true });
