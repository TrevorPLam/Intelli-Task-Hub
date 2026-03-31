import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq, asc, sql } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { parseParams, parseBody } from "../../lib/validate";
import { getDefaultChatCompletionParams } from "../../../../../src/config/ai";
import { trackError } from "../../lib/error-aggregator";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  // Parse pagination parameters with defaults
  const limit = Math.min(Number(req.query.limit) || 20, 100); // Max 100 items
  const offset = Math.max(Number(req.query.offset) || 0, 0); // Min 0

  // Get total count for pagination metadata
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(conversations);

  // Get paginated results
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt))
    .limit(limit)
    .offset(offset);

  // Set pagination metadata
  res.setPagination({
    limit,
    offset,
    total: count,
    hasNext: offset + limit < count,
    hasPrev: offset > 0,
  });

  res.json(rows);
});

router.post("/", async (req, res) => {
  const bodyResult = parseBody(CreateOpenaiConversationBody, req.body);
  if (!bodyResult.success) {
    res.status(400).json(bodyResult.error);
    return;
  }
  const { title } = bodyResult.data;
  const [conversation] = await db
    .insert(conversations)
    .values({ title })
    .returning();
  res.status(201).json(conversation);
});

router.get("/:id", async (req, res) => {
  const paramsResult = parseParams(GetOpenaiConversationParams, req.params);
  if (!paramsResult.success) {
    res.problem(400, "VALIDATION_ERROR", "Request validation failed", {
      errors: paramsResult.error.details,
    });
    return;
  }
  const { id } = paramsResult.data;
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conversation) {
    res.problem(404, "Resource Not Found", "Conversation not found", {
      resource: "conversation",
      id,
    });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conversation, messages: msgs });
});

router.delete("/:id", async (req, res) => {
  const paramsResult = parseParams(DeleteOpenaiConversationParams, req.params);
  if (!paramsResult.success) {
    res.problem(400, "VALIDATION_ERROR", "Request validation failed", {
      errors: paramsResult.error.details,
    });
    return;
  }
  const { id } = paramsResult.data;
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conversation) {
    res.problem(404, "Resource Not Found", "Conversation not found", {
      resource: "conversation",
      id,
    });
    return;
  }
  // Cascade delete handled by Drizzle FK constraint (onDelete: cascade)
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).send();
});

router.get("/:id/messages", async (req, res) => {
  const paramsResult = parseParams(ListOpenaiMessagesParams, req.params);
  if (!paramsResult.success) {
    res.problem(400, "VALIDATION_ERROR", "Request validation failed", {
      errors: paramsResult.error.details,
    });
    return;
  }
  const { id } = paramsResult.data;

  // Parse pagination parameters with defaults
  const limit = Math.min(Number(req.query.limit) || 50, 100); // Max 100 items
  const offset = Math.max(Number(req.query.offset) || 0, 0); // Min 0

  // Get total count for pagination metadata
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(messages)
    .where(eq(messages.conversationId, id));

  // Get paginated results
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .limit(limit)
    .offset(offset);

  // Set pagination metadata
  res.setPagination({
    limit,
    offset,
    total: count,
    hasNext: offset + limit < count,
    hasPrev: offset > 0,
  });

  res.json(msgs);
});

router.post("/:id/messages", async (req, res) => {
  // Pre-flight validation before setting SSE headers
  const paramsResult = parseParams(SendOpenaiMessageParams, req.params);
  if (!paramsResult.success) {
    res.problem(400, "VALIDATION_ERROR", "Request validation failed", {
      errors: paramsResult.error.details,
    });
    return;
  }
  const { id } = paramsResult.data;

  const bodyResult = parseBody(SendOpenaiMessageBody, req.body);
  if (!bodyResult.success) {
    res.problem(400, "VALIDATION_ERROR", "Request validation failed", {
      errors: bodyResult.error.details,
    });
    return;
  }
  const { content } = bodyResult.data;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conversation) {
    res.problem(404, "Resource Not Found", "Conversation not found", {
      resource: "conversation",
      id,
    });
    return;
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "user",
    content,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  const chatMessages = history.map((m: (typeof history)[0]) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const defaultParams = getDefaultChatCompletionParams();
    const stream = await openai.chat.completions.create({
      ...defaultParams,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are an intelligent personal AI assistant. You help users manage their tasks, calendar, email, and answer any questions. Be concise, helpful, and proactive.",
        },
        ...chatMessages,
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    // Track error in aggregator for monitoring
    trackError({
      severity: "high",
      type: "OPENAI_STREAMING_ERROR",
      message: error.message,
      stack: error.stack,
      context: {
        correlationId: (req as any).id || crypto.randomUUID(),
        method: req.method,
        path: req.path,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        metadata: { conversationId: id },
      },
    });

    req.log.error({ err }, "Error streaming OpenAI response");
    res.write(
      `data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`
    );
    res.end();
  }
});

export default router;
