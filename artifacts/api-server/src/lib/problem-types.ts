/**
 * @fileoverview Problem Type Registry for RFC 7807/9457 Problem Details.
 *
 * Defines standardized problem type URIs and metadata for consistent
 * error classification across the API. Each problem type has a unique
 * URI that can be dereferenced for documentation.
 *
 * @module @workspace/api-server/lib/problem-types
 * @version 1.0.0
 * @since 2026-03-30
 */

import { type ErrorSeverity } from "./error-aggregator";

/**
 * Base URI for API problem types.
 * Should be configured via environment variable in production.
 */
const BASE_PROBLEM_URI =
  process.env.API_PROBLEM_BASE_URI ?? "https://api.example.com/problems";

/**
 * Problem type definition with metadata.
 */
export interface ProblemType {
  /** Unique URI identifying the problem type */
  uri: string;
  /** Short, human-readable title */
  title: string;
  /** Detailed description of the problem */
  description: string;
  /** HTTP status code typically associated */
  status: number;
  /** Severity level for monitoring */
  severity: ErrorSeverity;
  /** How to resolve the problem */
  resolution: string;
}

/**
 * Registry of standard problem types.
 *
 * Follows RFC 7807/9457 best practices:
 * - URIs are namespaced under /problems/
 * - Titles are stable (clients may display them)
 * - Status codes match the HTTP response
 */
export const ProblemTypes: Record<string, ProblemType> = {
  // 4xx Client Errors
  BAD_REQUEST: {
    uri: `${BASE_PROBLEM_URI}/bad-request`,
    title: "Bad Request",
    description: "The request is malformed or contains invalid data.",
    status: 400,
    severity: "low",
    resolution: "Check the request format and ensure all required fields are present.",
  },

  VALIDATION_ERROR: {
    uri: `${BASE_PROBLEM_URI}/validation-error`,
    title: "Validation Error",
    description: "The request data failed validation checks.",
    status: 400,
    severity: "low",
    resolution: "Review the validation errors and correct the data.",
  },

  UNAUTHORIZED: {
    uri: `${BASE_PROBLEM_URI}/unauthorized`,
    title: "Unauthorized",
    description: "Authentication is required but was not provided or is invalid.",
    status: 401,
    severity: "medium",
    resolution: "Provide valid authentication credentials.",
  },

  FORBIDDEN: {
    uri: `${BASE_PROBLEM_URI}/forbidden`,
    title: "Forbidden",
    description: "The authenticated user lacks permission for this operation.",
    status: 403,
    severity: "medium",
    resolution: "Contact your administrator to request appropriate permissions.",
  },

  NOT_FOUND: {
    uri: `${BASE_PROBLEM_URI}/not-found`,
    title: "Resource Not Found",
    description: "The requested resource does not exist or has been deleted.",
    status: 404,
    severity: "low",
    resolution: "Verify the resource identifier and try again.",
  },

  METHOD_NOT_ALLOWED: {
    uri: `${BASE_PROBLEM_URI}/method-not-allowed`,
    title: "Method Not Allowed",
    description: "The HTTP method is not supported for this resource.",
    status: 405,
    severity: "low",
    resolution: "Use one of the allowed HTTP methods listed in the Allow header.",
  },

  CONFLICT: {
    uri: `${BASE_PROBLEM_URI}/conflict`,
    title: "Conflict",
    description: "The request conflicts with the current state of the resource.",
    status: 409,
    severity: "medium",
    resolution: "Resolve the conflict and retry the request.",
  },

  RATE_LIMITED: {
    uri: `${BASE_PROBLEM_URI}/rate-limited`,
    title: "Rate Limit Exceeded",
    description: "Too many requests have been sent in a given time window.",
    status: 429,
    severity: "medium",
    resolution: "Wait for the rate limit to reset before retrying.",
  },

  // 5xx Server Errors
  INTERNAL_ERROR: {
    uri: `${BASE_PROBLEM_URI}/internal-error`,
    title: "Internal Server Error",
    description: "An unexpected error occurred while processing the request.",
    status: 500,
    severity: "high",
    resolution: "Retry the request after a brief delay. If the problem persists, contact support with the error ID.",
  },

  DATABASE_ERROR: {
    uri: `${BASE_PROBLEM_URI}/database-error`,
    title: "Database Error",
    description: "An error occurred while accessing the database.",
    status: 500,
    severity: "high",
    resolution: "Retry the request. If the problem persists, contact support.",
  },

  EXTERNAL_SERVICE_ERROR: {
    uri: `${BASE_PROBLEM_URI}/external-service-error`,
    title: "External Service Error",
    description: "An error occurred while communicating with an external service.",
    status: 502,
    severity: "high",
    resolution: "The external service may be unavailable. Retry after a brief delay.",
  },

  SERVICE_UNAVAILABLE: {
    uri: `${BASE_PROBLEM_URI}/service-unavailable`,
    title: "Service Unavailable",
    description: "The service is temporarily unavailable due to maintenance or overload.",
    status: 503,
    severity: "high",
    resolution: "Retry the request after the Retry-After period has elapsed.",
  },

  OPENAI_ERROR: {
    uri: `${BASE_PROBLEM_URI}/openai-error`,
    title: "AI Service Error",
    description: "An error occurred while communicating with the AI service.",
    status: 502,
    severity: "high",
    resolution: "The AI service may be experiencing issues. Retry after a brief delay.",
  },

  TIMEOUT_ERROR: {
    uri: `${BASE_PROBLEM_URI}/timeout-error`,
    title: "Request Timeout",
    description: "The request could not be completed within the time limit.",
    status: 504,
    severity: "medium",
    resolution: "Retry the request. Consider breaking down large operations into smaller requests.",
  },
} as const;

/**
 * Get a problem type by its identifier.
 *
 * @param type - Problem type key from ProblemTypes
 * @returns ProblemType definition or undefined if not found
 */
export function getProblemType(type: keyof typeof ProblemTypes): ProblemType {
  return ProblemTypes[type];
}

/**
 * Get a problem type by HTTP status code.
 *
 * @param status - HTTP status code
 * @returns Matching ProblemType or INTERNAL_ERROR as fallback
 */
export function getProblemTypeByStatus(status: number): ProblemType {
  const match = Object.values(ProblemTypes).find((p) => p.status === status);
  return match ?? ProblemTypes.INTERNAL_ERROR;
}

/**
 * Create a complete Problem Details response object.
 *
 * @param type - Problem type key
 * @param detail - Specific detail about this occurrence
 * @param errorId - Unique correlation ID for this error
 * @param instance - URL of the request that caused the problem
 * @param extensions - Additional custom fields
 * @returns Complete Problem Details object per RFC 7807/9457
 */
export function createProblemDetails(
  type: keyof typeof ProblemTypes,
  detail: string,
  errorId: string,
  instance: string,
  extensions?: Record<string, unknown>
): {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errorId: string;
  [key: string]: unknown;
} {
  const problemType = getProblemType(type);

  return {
    type: problemType.uri,
    title: problemType.title,
    status: problemType.status,
    detail,
    instance,
    errorId,
    resolution: problemType.resolution,
    severity: problemType.severity,
    ...extensions,
  };
}
