import type { UIMessage } from "ai";
import { asc, eq, sql } from "drizzle-orm";
import type { AppDb } from "../../db";
import { chats, messages } from "../../db/schema/chats";
import { parts } from "../../db/schema/parts";

/**
 * Save chat messages to the database using parts-based storage
 * @param db - Database connection instance
 * @param chatId - The UUID of the chat session
 * @param messages - Array of UI messages to save
 */
export async function saveChat(
  db: AppDb,
  {
    chatId,
    messages: uiMessages,
  }: {
    chatId: string;
    messages: UIMessage[];
  },
): Promise<void> {
  try {
    console.log("saveChat: Saving messages to database...");
    console.log(`saveChat: Chat ID: ${chatId}`);
    console.log(`saveChat: Total messages to save: ${uiMessages.length}`);

    // Begin transaction
    await db.transaction(async (tx) => {
      // Save all messages with their parts
      for (const message of uiMessages) {
        console.log(`saveChat: Saving message ${message.id} (${message.role})`);

        // Insert or update message
        await tx
          .insert(messages)
          .values({
            id: message.id,
            chatId,
            role: message.role as "user" | "assistant" | "system" | "tool",
          })
          .onConflictDoNothing();

        // Delete existing parts for this message to handle updates
        await tx.delete(parts).where(eq(parts.messageId, message.id));

        // Insert all parts for this message
        for (let i = 0; i < message.parts.length; i++) {
          const part = message.parts[i];
          if (!part) continue;

          // Build the part values based on type
          const partValues: {
            messageId: string;
            type: string;
            order: number;
            textContent?: string;
            reasoningContent?: string;
            fileUrl?: string;
            fileName?: string;
            fileMimeType?: string;
            toolCallId?: string;
            toolCallName?: string;
            toolCallArgs?: unknown;
            toolResultId?: string;
            toolResultName?: string;
            toolResultResult?: unknown;
            toolResultIsError?: boolean;
            providerMetadata?: unknown;
          } = {
            messageId: message.id,
            type: part.type,
            order: i,
          };

          // Text part
          if (part.type === "text" && "text" in part) {
            partValues.textContent = part.text;
          }

          // Reasoning part
          else if (part.type === "reasoning" && "reasoning" in part) {
            partValues.reasoningContent = String(part.reasoning);
          }

          // File part
          else if (part.type === "file" && "data" in part) {
            const dataStr =
              typeof part.data === "string"
                ? part.data
                : part.data instanceof URL
                  ? part.data.toString()
                  : String(part.data);
            partValues.fileUrl = dataStr;
            partValues.fileName = "name" in part ? String(part.name) : "file";

            if ("mimeType" in part && part.mimeType) {
              partValues.fileMimeType = String(part.mimeType);
            }
          }

          // Dynamic tool parts (tool calls and results)
          else if (part.type === "dynamic-tool") {
            if ("output" in part && part.output !== undefined) {
              // This is a tool result
              partValues.toolResultId = String(part.toolCallId);
              partValues.toolResultName = String(part.toolName);
              partValues.toolResultResult = part.output;

              if ("errorText" in part && part.errorText) {
                partValues.toolResultIsError = true;
              }
            } else {
              // This is a tool call
              partValues.toolCallId = String(part.toolCallId);
              partValues.toolCallName = String(part.toolName);
              partValues.toolCallArgs = part.input || {};
            }
          }

          // Provider metadata (if present)
          if ("providerMetadata" in part && part.providerMetadata) {
            partValues.providerMetadata = part.providerMetadata;
          }

          await tx.insert(parts).values(partValues);
        }
      }

      // Update chat's updated_at timestamp
      await tx
        .update(chats)
        .set({ updatedAt: sql`NOW()` })
        .where(eq(chats.id, chatId));
    });

    console.log("saveChat: Messages saved successfully!");
  } catch (error) {
    console.error("saveChat: Failed to save messages:", error);
    throw error;
  }
}

/**
 * Load chat messages from the database with parts reconstruction
 * @param db - Database connection instance
 * @param chatId - The UUID of the chat session
 * @returns Array of UI messages
 */
export async function loadChat(
  db: AppDb,
  {
    chatId,
  }: {
    chatId: string;
  },
): Promise<UIMessage[]> {
  try {
    // Fetch messages with their parts using Drizzle
    const rows = await db
      .select({
        messageId: messages.id,
        role: messages.role,
        createdAt: messages.createdAt,
        partType: parts.type,
        partOrder: parts.order,
        textContent: parts.textContent,
        reasoningContent: parts.reasoningContent,
        imageUrl: parts.imageUrl,
        imageMimeType: parts.imageMimeType,
        fileUrl: parts.fileUrl,
        fileName: parts.fileName,
        fileMimeType: parts.fileMimeType,
        toolCallId: parts.toolCallId,
        toolCallName: parts.toolCallName,
        toolCallArgs: parts.toolCallArgs,
        toolResultId: parts.toolResultId,
        toolResultName: parts.toolResultName,
        toolResultResult: parts.toolResultResult,
        toolResultIsError: parts.toolResultIsError,
        providerMetadata: parts.providerMetadata,
      })
      .from(messages)
      .leftJoin(parts, eq(parts.messageId, messages.id))
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt), asc(parts.order));

    // Group parts by message
    const messagesMap = new Map<string, UIMessage>();

    for (const row of rows) {
      // Initialize message if not exists
      if (!messagesMap.has(row.messageId)) {
        messagesMap.set(row.messageId, {
          id: row.messageId,
          role: row.role as "user" | "assistant" | "system",
          parts: [],
        });
      }

      const message = messagesMap.get(row.messageId);
      if (!message) continue;

      // Skip if this row has no part (shouldn't happen, but be safe)
      if (!row.partType) continue;

      // Reconstruct part based on type
      // For now, we primarily support text parts
      // The schema is extensible for future tool calls, files, etc.
      if (row.partType === "text" && row.textContent) {
        message.parts.push({
          type: "text",
          text: row.textContent,
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
  }
}
