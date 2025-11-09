import { Pool } from "pg";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  type UIMessage,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { loadChat, saveChat } from "./chats.repository";

export async function getAllChats(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query(
      "SELECT id, created_at, updated_at FROM chats ORDER BY updated_at DESC",
    );
    return rows;
  } finally {
    await pool.end();
  }
}

export async function createChat(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query(
      "INSERT INTO chats DEFAULT VALUES RETURNING id",
    );
    return { id: rows[0].id };
  } finally {
    await pool.end();
  }
}

export async function getChatMessages(chatId: string, databaseUrl: string) {
  const messages = await loadChat({
    chatId,
    databaseUrl,
  });
  return messages;
}

export async function streamChatMessages(
  chatId: string,
  messages: UIMessage[],
  databaseUrl: string,
  googleApiKey: string,
) {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const google = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      // Pass original messages so onFinish receives full message history
      originalMessages: messages,
      // Generate consistent server-side IDs for persistence
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            createdAt: Date.now(),
          };
        }

        if (part.type === "finish") {
          return {
            totalTokens: part.totalUsage.totalTokens,
            inputTokens: part.totalUsage.inputTokens,
            outputTokens: part.totalUsage.outputTokens,
            reasoningTokens: part.totalUsage.reasoningTokens,
            cachedInputTokens: part.totalUsage.cachedInputTokens,
          };
        }
      },
      async onFinish({ messages: allMessages }) {
        await saveChat({
          chatId,
          messages: allMessages,
          databaseUrl,
        });
      },
    });
  } finally {
    await pool.end();
  }
}
