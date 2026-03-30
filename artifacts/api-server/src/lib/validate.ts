/**
 * @fileoverview Validation utilities for Express route params and body.
 *
 * Provides type-safe parsing helpers that return structured error results
 * instead of throwing exceptions. All validation occurs before database
 * queries or external API calls.
 *
 * @module @workspace/api-server/lib/validate
 * @version 1.0.0
 * @since 2026-03-30
 */

import { type ZodError, type ZodType, type ZodIssue, type TypeOf } from "zod";

/**
 * HTTP error structure returned when validation fails.
 */
export interface HttpError {
  status: number;
  code: string;
  message: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Result type discriminating between success and error.
 */
export type Result<T, E = HttpError> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: E };

/**
 * Creates a standardized HTTP error response (RFC 7807 Problem Details style).
 *
 * @param status - HTTP status code
 * @param code - Machine-readable error code
 * @param message - Human-readable error description
 * @param details - Optional field-level error details
 * @returns HttpError structured object
 */
export function createError(
  status: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>,
): HttpError {
  return {
    status,
    code,
    message,
    details: details ?? [],
  };
}

/**
 * Maps ZodError issues to a stable error DTO without leaking internal schema details.
 */
function mapZodError(error: ZodError): HttpError {
  return {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details: error.issues.map((issue: ZodIssue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}

/**
 * Validates request parameters against a Zod schema.
 *
 * @param schema - Zod schema to validate against (typically uses .coerce for params)
 * @param params - Raw request parameters (req.params)
 * @returns Result with parsed data or structured HttpError
 *
 * @example
 * const idSchema = z.object({ id: z.coerce.number().int().positive() });
 * const result = parseParams(idSchema, req.params);
 * if (!result.success) return res.status(400).json(result.error);
 * const { id } = result.data;
 */
export function parseParams<T extends ZodType>(
  schema: T,
  params: Record<string, unknown>,
): Result<TypeOf<T>> {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: mapZodError(parsed.error) };
  }
  return { success: true, data: parsed.data };
}

/**
 * Validates request body against a Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param body - Raw request body (req.body)
 * @returns Result with parsed data or structured HttpError
 *
 * @example
 * const result = parseBody(CreateOpenaiConversationBody, req.body);
 * if (!result.success) return res.status(400).json(result.error);
 * const { title } = result.data;
 */
export function parseBody<T extends ZodType>(
  schema: T,
  body: unknown,
): Result<TypeOf<T>> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: mapZodError(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
