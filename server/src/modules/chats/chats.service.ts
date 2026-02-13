import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  type UIMessage,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { desc } from "drizzle-orm";
import type { AppDb } from "../../db";
import { chats } from "../../db/schema/chats";
import {
  deleteChatById,
  loadChat,
  renameChatById,
  saveChat,
  setChatTitleIfMissing,
} from "./chats.repository";

export async function getAllChats(db: AppDb) {
  return await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .orderBy(desc(chats.updatedAt));
}

export async function createChat(db: AppDb) {
  const [chat] = await db.insert(chats).values({}).returning({ id: chats.id });
  return chat;
}

export async function deleteChat(db: AppDb, chatId: string) {
  return await deleteChatById(db, { chatId });
}

export async function renameChat(db: AppDb, chatId: string, title: string | null) {
  return await renameChatById(db, { chatId, title });
}

export async function getChatMessages(
  db: AppDb,
  chatId: string,
) {
  const messages = await loadChat(db, { chatId });
  return messages;
}

export async function streamChatMessages(
  db: AppDb,
  chatId: string,
  messages: UIMessage[],
  googleApiKey: string,
  onPersistComplete?: () => Promise<void> | void,
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
      try {
        await saveChat(db, {
          chatId,
          messages: allMessages,
        });

        const autoTitle = generateRuleBasedTitle(allMessages);
        if (autoTitle) {
          try {
            await setChatTitleIfMissing(db, { chatId, title: autoTitle });
          } catch (error) {
            console.error("streamChatMessages: Failed to auto-title chat:", error);
          }
        }
      } finally {
        await onPersistComplete?.();
      }
    },
  });
}

function generateRuleBasedTitle(messages: UIMessage[]): string | null {
  const firstUserText = extractFirstUserText(messages);
  if (!firstUserText) {
    return null;
  }

  const firstAssistantText = extractFirstAssistantText(messages);
  const sourceText = firstAssistantText
    ? `${firstUserText} ${firstAssistantText}`
    : firstUserText;

  const sanitized = sourceText
    .replace(/[`"'()[\]{}<>_*~]/g, " ")
    .replace(/[.,!?;:/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    return null;
  }

  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "please",
    "the",
    "this",
    "to",
    "with",
    "you",
    "your",
  ]);

  const rawWords = sanitized.split(" ").filter(Boolean);
  const keywords = rawWords.filter((word) => !stopWords.has(word.toLowerCase()));
  const sourceWords = keywords.length >= 2 ? keywords : rawWords;
  const maxWords = 6;
  const truncatedWords = sourceWords.slice(0, maxWords);
  const title = toTitleCase(truncatedWords.join(" "));

  return title.length > 120 ? title.slice(0, 120).trim() : title;
}

function extractFirstUserText(messages: UIMessage[]): string | null {
  for (const message of messages) {
    if (message.role !== "user") {
      continue;
    }

    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim();

    if (text) {
      return text;
    }
  }

  return null;
}

function extractFirstAssistantText(messages: UIMessage[]): string | null {
  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }

    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim();

    if (!text) {
      continue;
    }

    const cleanedText = text
      .replace(/^(sure|okay|ok|great|absolutely|certainly)[,!.\s]+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    return cleanedText.slice(0, 120);
  }

  return null;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
