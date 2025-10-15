import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  type UIMessage,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Pool } from "pg";
import { saveChat, loadChat } from "./chat-store";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/hello", async (c) => {
  const data: ApiResponse = {
    message: "Hello BHVR!",
    success: true,
  };

  return c.json(data, { status: 200 });
});

app.get("/db", async (c) => {
  const pool = new Pool({ connectionString: c.env.DATABASE_URL });
  try {
    const { rows } = await pool.query("SELECT * FROM users");
    return c.json(rows);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch users" }, { status: 500 });
  } finally {
    pool.end();
  }
});

// Get all chats
app.get("/chats", async (c) => {
  const pool = new Pool({ connectionString: c.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(
      "SELECT id, created_at, updated_at FROM chats ORDER BY updated_at DESC",
    );
    return c.json(rows);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch chats" }, { status: 500 });
  } finally {
    pool.end();
  }
});

// Create new chat
app.post("/chats", async (c) => {
  const pool = new Pool({ connectionString: c.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(
      "INSERT INTO chats DEFAULT VALUES RETURNING id",
    );
    return c.json({ id: rows[0].id });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create chat" }, { status: 500 });
  } finally {
    pool.end();
  }
});

// Get chat history by chat ID
app.get("/chats/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");

  try {
    const messages = await loadChat({
      chatId,
      databaseUrl: c.env.DATABASE_URL,
    });
    return c.json(messages);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
});

app.post("/chat", async (c) => {
  const { chatId, messages }: { chatId: string; messages: UIMessage[] } = await c.req.json();

  const pool = new Pool({ connectionString: c.env.DATABASE_URL });

  try {
    const google = createGoogleGenerativeAI({
      apiKey: c.env.GOOGLE_GENERATIVE_AI_API_KEY,
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
          databaseUrl: c.env.DATABASE_URL,
        });
      },
    });
  } finally {
    await pool.end();
  }
});

export default app;
