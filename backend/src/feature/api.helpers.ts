import type { Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function isJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isRecord(value) && Object.values(value).every(isJsonValue);
}

export function isJsonObject(value: unknown): value is Prisma.InputJsonObject {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

export function sendDatabaseError(
  res: Response,
  error: unknown,
  message: string,
) {
  console.error(message, error);
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;

  if (code === "P2002") {
    return res.status(409).json({ success: false, error: "resource already exists" });
  }
  if (code === "P2003") {
    return res.status(409).json({
      success: false,
      error: "operation conflicts with related resources",
    });
  }
  if (code === "P2025") {
    return res.status(404).json({ success: false, error: "resource not found" });
  }
  return res.status(500).json({ success: false, error: message });
}
