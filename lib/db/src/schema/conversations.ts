/**
 * Database Schema: Conversations
 *
 * Defines the structure for chat conversations with optimized indexing
 * for performance on frequently queried columns.
 *
 * @fileoverview Conversation table with performance-optimized indexes
 * @version 2.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Index for efficient ordering by creation time (supports pagination queries)
    createdAtIdx: index("idx_conversations_created_at").on(table.createdAt),
  })
);

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
