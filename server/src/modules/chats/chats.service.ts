import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  type UIMessage,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { desc } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { chats } from "../../db/schema/chats";
import { loadChat, saveChat } from "./chats.repository";

export async function getAllChats(db: NeonHttpDatabase) {
  return await db
    .select({
      id: chats.id,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .orderBy(desc(chats.updatedAt));
}

export async function createChat(db: NeonHttpDatabase) {
  const [chat] = await db.insert(chats).values({}).returning({ id: chats.id });
  return chat;
}

export async function getChatMessages(db: NeonHttpDatabase, chatId: string) {
  const messages = await loadChat(db, { chatId });
  return messages;
}

export async function streamChatMessages(
  db: NeonHttpDatabase,
  chatId: string,
  messages: UIMessage[],
  googleApiKey: string,
) {
  const google = createGoogleGenerativeAI({
    apiKey: googleApiKey,
  });

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: await convertToModelMessages(messages),
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
      await saveChat(db, {
        chatId,
        messages: allMessages,
      });
    },
  });
}
