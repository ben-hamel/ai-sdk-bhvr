-- Enhanced schema with parts-based message storage
-- Based on Vercel AI SDK persistence best practices
-- https://github.com/vercel-labs/ai-sdk-persistence-db

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (dependencies first)
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;

-- Chat sessions table with UUID
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table with TEXT id (for AI SDK compatibility)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parts table - stores individual message parts with type preservation
-- Uses prefix-based columns for different part types
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Text part columns
  text_content TEXT,

  -- Reasoning part columns (for models like o1)
  reasoning_content TEXT,

  -- Image part columns
  image_url TEXT,
  image_mime_type TEXT,

  -- File part columns
  file_url TEXT,
  file_name TEXT,
  file_mime_type TEXT,

  -- Tool call part columns
  tool_call_id TEXT,
  tool_call_name TEXT,
  tool_call_args JSONB,

  -- Tool result part columns
  tool_result_id TEXT,
  tool_result_name TEXT,
  tool_result_result JSONB,
  tool_result_is_error BOOLEAN,

  -- Provider metadata (usage, finish reason, etc.)
  provider_metadata JSONB,

  -- Constraints to ensure complete part definitions
  CONSTRAINT valid_text_part CHECK (
    type != 'text' OR text_content IS NOT NULL
  ),
  CONSTRAINT valid_reasoning_part CHECK (
    type != 'reasoning' OR reasoning_content IS NOT NULL
  ),
  CONSTRAINT valid_image_part CHECK (
    type != 'image' OR image_url IS NOT NULL
  ),
  CONSTRAINT valid_file_part CHECK (
    type != 'file' OR (file_url IS NOT NULL AND file_name IS NOT NULL)
  ),
  CONSTRAINT valid_tool_call_part CHECK (
    type != 'tool-call' OR (tool_call_id IS NOT NULL AND tool_call_name IS NOT NULL AND tool_call_args IS NOT NULL)
  ),
  CONSTRAINT valid_tool_result_part CHECK (
    type != 'tool-result' OR (tool_result_id IS NOT NULL AND tool_result_result IS NOT NULL)
  )
);

-- Indexes for faster queries
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_chat_id_created_at ON messages(chat_id, created_at);

CREATE INDEX idx_parts_message_id ON parts(message_id);
CREATE INDEX idx_parts_message_id_order ON parts(message_id, "order");

-- Example queries for common operations:
--
-- Get all messages for a chat with their parts:
-- SELECT m.*, json_agg(p.* ORDER BY p."order") as parts
-- FROM messages m
-- LEFT JOIN parts p ON p.message_id = m.id
-- WHERE m.chat_id = $1
-- GROUP BY m.id
-- ORDER BY m.created_at ASC;
--
-- Get just text content (for simple display):
-- SELECT m.role, p.text_content
-- FROM messages m
-- JOIN parts p ON p.message_id = m.id
-- WHERE m.chat_id = $1 AND p.type = 'text'
-- ORDER BY m.created_at ASC, p."order" ASC;
