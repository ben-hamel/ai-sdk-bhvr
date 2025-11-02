import type { UIMessage } from "ai";
import { Pool } from "pg";

/**
 * Save chat messages to the database using parts-based storage
 * @param chatId - The UUID of the chat session
 * @param messages - Array of UI messages to save
 * @param databaseUrl - PostgreSQL connection string
 */
export async function saveChat({
  chatId,
  messages,
  databaseUrl,
}: {
  chatId: string;
  messages: UIMessage[];
  databaseUrl: string;
}): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("saveChat: Saving messages to database...");
    console.log(`saveChat: Chat ID: ${chatId}`);
    console.log(`saveChat: Total messages to save: ${messages.length}`);

    // Begin transaction
    await pool.query("BEGIN");

    // Save all messages with their parts
    for (const message of messages) {
      console.log(`saveChat: Saving message ${message.id} (${message.role})`);

      // Insert or update message
      await pool.query(
        "INSERT INTO messages (id, chat_id, role, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (id) DO NOTHING",
        [message.id, chatId, message.role],
      );

      // Delete existing parts for this message to handle updates
      await pool.query("DELETE FROM parts WHERE message_id = $1", [message.id]);

      // Insert all parts for this message
      for (let i = 0; i < message.parts.length; i++) {
        const part = message.parts[i];
        if (!part) continue;

        // Base values for all parts
        const values: unknown[] = [
          message.id, // message_id
          part.type, // type
          i, // order
        ];

        // Build dynamic column list and values based on part type
        let columns = 'message_id, type, "order"';
        let placeholders = "$1, $2, $3";
        let paramIndex = 4;

        // Text part
        if (part.type === "text" && "text" in part) {
          columns += ", text_content";
          placeholders += `, $${paramIndex++}`;
          values.push(part.text);
        }

        // Reasoning part
        else if (part.type === "reasoning" && "reasoning" in part) {
          columns += ", reasoning_content";
          placeholders += `, $${paramIndex++}`;
          values.push(part.reasoning);
        }

        // File part
        else if (part.type === "file" && "data" in part) {
          columns += ", file_url, file_name";
          placeholders += `, $${paramIndex++}, $${paramIndex++}`;
          const dataStr =
            typeof part.data === "string"
              ? part.data
              : part.data instanceof URL
                ? part.data.toString()
                : String(part.data);
          values.push(dataStr, "name" in part ? part.name : "file");

          if ("mimeType" in part && part.mimeType) {
            columns += ", file_mime_type";
            placeholders += `, $${paramIndex++}`;
            values.push(part.mimeType);
          }
        }

        // Dynamic tool parts (tool calls and results)
        else if (part.type === "dynamic-tool") {
          if ("output" in part && part.output !== undefined) {
            // This is a tool result
            columns += ", tool_result_id, tool_result_name, tool_result_result";
            placeholders += `, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}`;
            values.push(
              part.toolCallId,
              part.toolName,
              JSON.stringify(part.output),
            );

            if ("errorText" in part && part.errorText) {
              columns += ", tool_result_is_error";
              placeholders += `, $${paramIndex++}`;
              values.push(true);
            }
          } else {
            // This is a tool call
            columns += ", tool_call_id, tool_call_name, tool_call_args";
            placeholders += `, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}`;
            values.push(
              part.toolCallId,
              part.toolName,
              JSON.stringify(part.input || {}),
            );
          }
        }

        // Provider metadata (if present)
        if ("providerMetadata" in part && part.providerMetadata) {
          columns += ", provider_metadata";
          placeholders += `, $${paramIndex++}`;
          values.push(JSON.stringify(part.providerMetadata));
        }

        await pool.query(
          `INSERT INTO parts (${columns}) VALUES (${placeholders})`,
          values,
        );
      }
    }

    // Update chat's updated_at timestamp
    await pool.query("UPDATE chats SET updated_at = NOW() WHERE id = $1", [
      chatId,
    ]);

    // Commit transaction
    await pool.query("COMMIT");
    console.log("saveChat: Messages saved successfully!");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("saveChat: Failed to save messages:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Load chat messages from the database with parts reconstruction
 * @param chatId - The UUID of the chat session
 * @param databaseUrl - PostgreSQL connection string
 * @returns Array of UI messages
 */
export async function loadChat({
  chatId,
  databaseUrl,
}: {
  chatId: string;
  databaseUrl: string;
}): Promise<UIMessage[]> {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Fetch messages with their parts in one query
    const { rows } = await pool.query(
      `SELECT
        m.id as message_id,
        m.role,
        m.created_at,
        p.type as part_type,
        p."order" as part_order,
        p.text_content,
        p.reasoning_content,
        p.image_url,
        p.image_mime_type,
        p.file_url,
        p.file_name,
        p.file_mime_type,
        p.tool_call_id,
        p.tool_call_name,
        p.tool_call_args,
        p.tool_result_id,
        p.tool_result_name,
        p.tool_result_result,
        p.tool_result_is_error,
        p.provider_metadata
      FROM messages m
      LEFT JOIN parts p ON p.message_id = m.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC, p."order" ASC`,
      [chatId],
    );

    // Group parts by message
    const messagesMap = new Map<string, UIMessage>();

    for (const row of rows) {
      // Initialize message if not exists
      if (!messagesMap.has(row.message_id)) {
        messagesMap.set(row.message_id, {
          id: row.message_id,
          role: row.role,
          parts: [],
        });
      }

      const message = messagesMap.get(row.message_id);
      if (!message) continue;

      // Skip if this row has no part (shouldn't happen, but be safe)
      if (!row.part_type) continue;

      // Reconstruct part based on type
      // For now, we primarily support text parts
      // The schema is extensible for future tool calls, files, etc.
      if (row.part_type === "text" && row.text_content) {
        message.parts.push({
          type: "text",
          text: row.text_content,
        });
      }
      // Future: Add support for other part types as needed
      // - reasoning parts
      // - file attachments
      // - tool calls and results
      // The database schema already supports these types
    }

    return Array.from(messagesMap.values());
  } catch (error) {
    console.error("loadChat: Failed to load messages:", error);
    throw error;
  } finally {
    await pool.end();
  }
}
