/**
 * @fileoverview Response standardization middleware for consistent API responses.
 *
 * Implements optional response envelope for metadata (pagination, counts) while
 * preserving envelope-free responses for standard cases per 2026 REST best practices.
 * Supports RFC 9457 Problem Details for error responses.
 *
 * @module @workspace/api-server/middlewares/response
 * @version 1.0.0
 * @since 2026-03-30
 */

import { type Request, type Response, type NextFunction } from "express";

// Extend Express Response type for our middleware
declare global {
  namespace Express {
    interface Response {
      setPagination(meta: PaginationMeta): void;
      problem(
        statusCode: number,
        title: string,
        detail: string,
        extensions?: Record<string, unknown>
      ): void;
    }
  }
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Response envelope structure for optional metadata.
 */
export interface ResponseEnvelope<T = unknown> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    count?: number;
    [key: string]: unknown;
  };
}

/**
 * RFC 9457 Problem Details error structure.
 */
export interface ProblemDetails {
  type?: string;
  title: string;
  detail: string;
  instance?: string;
  status: number;
  errorId?: string;
  errors?: Array<{
    pointer?: string;
    detail: string;
  }>;
  [key: string]: unknown;
}

/**
 * Determines if envelope should be applied based on request.
 */
function shouldUseEnvelope(req: Request): boolean {
  // Envelope for JSONP requests
  if (req.query.callback || req.query.jsonp) {
    return true;
  }

  // Envelope for explicit envelope parameter
  if (req.query.envelope === "true") {
    return true;
  }

  // Envelope for paginated responses (metadata needed)
  if ((req as any)._paginationMeta) {
    return true;
  }

  return false;
}

/**
 * Creates a standardized success response with optional envelope.
 */
export function createSuccessResponse<T>(
  req: Request,
  data: T,
  statusCode: number = 200
): { data: T; statusCode: number; headers?: Record<string, string> } {
  const response: {
    data: T;
    statusCode: number;
    headers?: Record<string, string>;
  } = { data, statusCode };

  // Add pagination headers if available
  const paginationMeta = (req as any)._paginationMeta as
    | PaginationMeta
    | undefined;
  if (paginationMeta) {
    response.headers = {
      "X-Total-Count": paginationMeta.total.toString(),
      "X-Limit": paginationMeta.limit.toString(),
      "X-Offset": paginationMeta.offset.toString(),
    };

    // Add Link header for pagination navigation (RFC 8288)
    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    const linkParts: string[] = [];

    if (paginationMeta.hasNext) {
      const nextOffset = paginationMeta.offset + paginationMeta.limit;
      linkParts.push(
        `<${baseUrl}?limit=${paginationMeta.limit}&offset=${nextOffset}>; rel="next"`
      );
    }

    if (paginationMeta.hasPrev) {
      const prevOffset = Math.max(
        0,
        paginationMeta.offset - paginationMeta.limit
      );
      linkParts.push(
        `<${baseUrl}?limit=${paginationMeta.limit}&offset=${prevOffset}>; rel="prev"`
      );
    }

    if (linkParts.length > 0) {
      response.headers["Link"] = linkParts.join(", ");
    }
  }

  return response;
}

/**
 * Creates a standardized error response following RFC 9457 Problem Details.
 */
export function createErrorResponse(
  req: Request,
  statusCode: number,
  title: string,
  detail: string,
  extensions?: Record<string, unknown>
): ProblemDetails {
  const problem: ProblemDetails = {
    status: statusCode,
    title,
    detail,
    ...extensions,
  };

  // Add correlation ID if available from logger
  const errorId = (req as any).id;
  if (errorId) {
    problem.errorId = errorId;
  }

  // Add instance URL for the specific request
  problem.instance = `${req.protocol}://${req.get("host")}${req.path}`;

  return problem;
}

/**
 * Middleware to handle response formatting.
 */
export function responseFormatter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Store original res.json method
  const originalJson = res.json.bind(res);

  // Override res.json to apply envelope if needed
  res.json = function (body: unknown) {
    const useEnvelope = shouldUseEnvelope(req);

    if (useEnvelope) {
      const paginationMeta = (req as any)._paginationMeta as
        | PaginationMeta
        | undefined;
      const envelope: ResponseEnvelope = { data: body };

      if (paginationMeta) {
        envelope.meta = { pagination: paginationMeta };
      }

      return originalJson(envelope);
    }

    return originalJson(body);
  } as typeof res.json;

  // Helper method to set pagination metadata
  res.setPagination = function (meta: PaginationMeta) {
    (req as any)._paginationMeta = meta;
  } as typeof res.setPagination;

  // Helper method for standardized error responses
  res.problem = function (
    statusCode: number,
    title: string,
    detail: string,
    extensions?: Record<string, unknown>
  ) {
    const problem = createErrorResponse(
      req,
      statusCode,
      title,
      detail,
      extensions
    );

    // Set proper content type for problem details
    res.setHeader("Content-Type", "application/problem+json");
    res.status(statusCode).json(problem);
  } as typeof res.problem;

  next();
}

/**
 * Middleware factory for response formatting.
 */
export function responseFormatterMiddleware() {
  return responseFormatter;
}
