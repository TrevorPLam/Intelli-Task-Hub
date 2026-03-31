/**
 * Database Schema: Messages
 *
 * Defines the structure for chat messages in conversations with optimized
 * indexing for foreign keys and timestamp-based queries.
 *
 * @fileoverview Message table with performance-optimized indexes for chat workloads
 * @version 2.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

import { conversations } from "./conversations";

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Role constraint check
    roleCheck: check(
      "role_check",
      sql`${table.role} IN ('user', 'assistant', 'system')`
    ),
    // Index for efficient JOIN queries on conversation_id (N+1 prevention)
    conversationIdIdx: index("idx_messages_conversation_id").on(
      table.conversationId
    ),
    // Index for efficient date-based queries and sorting
    createdAtIdx: index("idx_messages_created_at").on(table.createdAt),
    // Composite index for listing messages in a conversation sorted by time
    // Covers the common pattern: WHERE conversation_id = ? ORDER BY created_at
    conversationCreatedIdx: index("idx_messages_conversation_created").on(
      table.conversationId,
      table.createdAt
    ),
  })
);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
