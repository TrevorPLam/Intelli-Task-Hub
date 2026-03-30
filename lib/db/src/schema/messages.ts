/**
 * Database Schema: Messages
 *
 * Defines the structure for chat messages in conversations.
 * Each message belongs to a conversation and has a role (user/assistant/system).
 *
 * @fileoverview Message table with role constraint and foreign key relationships
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import {
  check,
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
    roleCheck: check(
      "role_check",
      sql`${table.role} IN ('user', 'assistant', 'system')`
    ),
  })
);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
