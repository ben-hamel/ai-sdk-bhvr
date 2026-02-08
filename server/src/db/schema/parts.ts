import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { aisdk, messages } from "./chats";

// Parts table - stores individual message parts with type preservation
export const parts = aisdk.table(
  "parts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Text part columns
    textContent: text("text_content"),

    // Reasoning part columns (for models like o1)
    reasoningContent: text("reasoning_content"),

    // Image part columns
    imageUrl: text("image_url"),
    imageMimeType: text("image_mime_type"),

    // File part columns
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    fileMimeType: text("file_mime_type"),

    // Tool call part columns
    toolCallId: text("tool_call_id"),
    toolCallName: text("tool_call_name"),
    toolCallArgs: jsonb("tool_call_args"),

    // Tool result part columns
    toolResultId: text("tool_result_id"),
    toolResultName: text("tool_result_name"),
    toolResultResult: jsonb("tool_result_result"),
    toolResultIsError: boolean("tool_result_is_error"),

    // Provider metadata (usage, finish reason, etc.)
    providerMetadata: jsonb("provider_metadata"),
  },
  (table) => {
    return {
      messageIdIdx: index("idx_parts_message_id").on(table.messageId),
      messageIdOrderIdx: index("idx_parts_message_id_order").on(
        table.messageId,
        table.order,
      ),
      // Constraints to ensure complete part definitions
      validTextPart: check(
        "valid_text_part",
        sql`${table.type} != 'text' OR ${table.textContent} IS NOT NULL`,
      ),
      validReasoningPart: check(
        "valid_reasoning_part",
        sql`${table.type} != 'reasoning' OR ${table.reasoningContent} IS NOT NULL`,
      ),
      validImagePart: check(
        "valid_image_part",
        sql`${table.type} != 'image' OR ${table.imageUrl} IS NOT NULL`,
      ),
      validFilePart: check(
        "valid_file_part",
        sql`${table.type} != 'file' OR (${table.fileUrl} IS NOT NULL AND ${table.fileName} IS NOT NULL)`,
      ),
      validToolCallPart: check(
        "valid_tool_call_part",
        sql`${table.type} != 'tool-call' OR (${table.toolCallId} IS NOT NULL AND ${table.toolCallName} IS NOT NULL AND ${table.toolCallArgs} IS NOT NULL)`,
      ),
      validToolResultPart: check(
        "valid_tool_result_part",
        sql`${table.type} != 'tool-result' OR (${table.toolResultId} IS NOT NULL AND ${table.toolResultResult} IS NOT NULL)`,
      ),
    };
  },
);
