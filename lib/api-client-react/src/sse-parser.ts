/**
 * @file SSE Parser Utility
 * @module @workspace/api-client-react/sse-parser
 *
 * Server-Sent Events (SSE) parsing utility for handling streaming responses.
 * Correctly handles chunk-boundary splits where multi-chunk events never produce parse errors.
 *
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html
 *
 * @example
 * ```typescript
 * const decoder = new TextDecoder();
 * let buffer = "";
 *
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *
 *   buffer += decoder.decode(value, { stream: true });
 *
 *   const { events, remaining } = parseSseChunk(buffer);
 *   buffer = remaining;
 *
 *   for (const event of events) {
 *     const data = readSseData(event);
 *     if (data) {
 *       const parsed = JSON.parse(data);
 *       // Handle parsed event
 *     }
 *   }
 * }
 *
 * // Process final buffer
 * const { events } = parseSseChunk(buffer + decoder.decode());
 * ```
 */

/**
 * SSE event delimiter regex per spec (RFC 8895).
 * Matches: \r\n\r\n (Windows), \n\n (Unix), \r\r (old Mac)
 */
export const SSE_EVENT_DELIMITER = /\r\n\r\n|\n\n|\r\r/g;

/**
 * Extract complete SSE events from a buffer, returning parsed events and remaining buffer.
 *
 * @param buffer - Current buffer content (may contain incomplete event at end)
 * @returns Object with complete events and remaining buffer for next chunk
 *
 * @example
 * ```typescript
 * const buffer = "data: hello\n\ndata: world\n\nincomplete: ...";
 * const { events, remaining } = parseSseChunk(buffer);
 * // events = ["data: hello\n", "data: world\n"]
 * // remaining = "incomplete: ..."
 * ```
 */
export function parseSseChunk(buffer: string): {
  events: string[];
  remaining: string;
} {
  const events: string[] = [];
  let lastIndex = 0;

  SSE_EVENT_DELIMITER.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SSE_EVENT_DELIMITER.exec(buffer)) !== null) {
    events.push(buffer.slice(lastIndex, match.index));
    lastIndex = match.index + match[0].length;
  }

  return {
    events,
    remaining: buffer.slice(lastIndex),
  };
}

/**
 * Extract data payload from an SSE event block.
 *
 * Per SSE spec, lines starting with "data:" contain the event payload.
 * Multiple data lines are joined with newlines.
 *
 * @param block - SSE event block (content between delimiters)
 * @returns Concatenated data payload or null if no data lines found
 *
 * @example
 * ```typescript
 * const block = "event: message\ndata: hello\ndata: world";
 * const data = readSseData(block);
 * // data = "hello\nworld"
 * ```
 */
export function readSseData(block: string): string | null {
  // Normalize line endings to \n for consistent parsing
  const normalizedBlock = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const dataLines: string[] = [];

  for (const line of normalizedBlock.split("\n")) {
    if (!line.startsWith("data:")) {
      continue;
    }

    // SSE allows one optional leading space after the colon
    dataLines.push(line.slice(5).replace(/^ /, ""));
  }

  if (dataLines.length === 0) {
    return null;
  }

  return dataLines.join("\n");
}

/**
 * Parse a streaming SSE response body.
 *
 * This is a higher-level helper that handles the full streaming lifecycle:
 * - Reading chunks from the response body
 * - Buffering incomplete events across chunks
 * - Parsing complete events
 * - Handling the final flush
 *
 * @param response - Fetch Response with SSE stream
 * @param onEvent - Callback for each parsed SSE data payload
 * @param onComplete - Optional callback when stream ends
 * @param onError - Optional callback for parsing errors
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/stream');
 * await parseSseStream(response, {
 *   onEvent: (data) => {
 *     const parsed = JSON.parse(data);
 *     console.log('Received:', parsed);
 *   },
 *   onComplete: () => console.log('Stream complete'),
 *   onError: (err) => console.error('Parse error:', err),
 * });
 * ```
 */
export async function parseSseStream(
  response: Response,
  options: {
    onEvent: (data: string) => void | Promise<void>;
    onComplete?: () => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
  }
): Promise<void> {
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const { events, remaining } = parseSseChunk(buffer);
      buffer = remaining;

      for (const event of events) {
        const data = readSseData(event);
        if (data !== null) {
          try {
            await options.onEvent(data);
          } catch (error) {
            if (options.onError) {
              await options.onError(error instanceof Error ? error : new Error(String(error)));
            }
          }
        }
      }
    }

    // Flush any remaining bytes
    buffer += decoder.decode();

    // Process final complete events
    const { events, remaining } = parseSseChunk(buffer);

    for (const event of events) {
      const data = readSseData(event);
      if (data !== null) {
        try {
          await options.onEvent(data);
        } catch (error) {
          if (options.onError) {
            await options.onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    }

    // Handle final unterminated event (server closed without trailing delimiter)
    if (remaining.trim()) {
      const data = readSseData(remaining);
      if (data !== null) {
        try {
          await options.onEvent(data);
        } catch (error) {
          if (options.onError) {
            await options.onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    }

    await options.onComplete?.();
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Ignore cleanup errors
    }
    reader.releaseLock();
  }
}
