-- Database Performance Optimization Migration
-- Adds indexes for foreign keys and frequently queried columns
-- Created: 2026-03-30
-- Author: Intelli-Task-Hub Team

-- =============================================================================
-- Index on messages.conversation_id (Foreign Key)
-- =============================================================================
-- Critical for JOIN performance when fetching messages for a conversation
-- Supports the frequent queries: WHERE conversation_id = ?
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" 
  ON "messages" ("conversation_id");

-- =============================================================================
-- Index on messages.created_at (Timestamp)
-- =============================================================================
-- Optimizes date-based queries and ORDER BY created_at operations
-- Supports pagination queries with time-based sorting
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" 
  ON "messages" ("created_at");

-- =============================================================================
-- Composite Index for Message Listing with Ordering
-- =============================================================================
-- Optimizes the common pattern: SELECT * FROM messages 
--   WHERE conversation_id = ? ORDER BY created_at
-- This composite index covers both filtering and sorting in one index scan
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_created" 
  ON "messages" ("conversation_id", "created_at");

-- =============================================================================
-- Index on conversations.created_at (Timestamp)
-- =============================================================================
-- Optimizes listing conversations ordered by creation time
-- Supports: SELECT * FROM conversations ORDER BY created_at DESC LIMIT ?
CREATE INDEX IF NOT EXISTS "idx_conversations_created_at" 
  ON "conversations" ("created_at");

-- =============================================================================
-- Performance Notes
-- =============================================================================
-- These indexes improve query performance for:
-- 1. Fetching messages by conversation_id (N+1 query prevention)
-- 2. Paginated message listing with date-based sorting
-- 3. Conversation listing ordered by creation time
-- 4. Time-based filtering and range queries
--
-- Index Overhead:
-- - Write operations (INSERT/UPDATE/DELETE) will be slightly slower
-- - Additional disk space required (~10-20MB for 1M messages)
-- - Trade-off is acceptable for read-heavy chat application workload
