import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Pool } from "pg";

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

app.post("/chat", async (c) => {
  const { messages }: { messages: UIMessage[] } = await c.req.json();

  const google = createGoogleGenerativeAI({
    apiKey: c.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    // onFinish: (result) => {
    //   console.log("Result finished with usage:", result.usage);
    // },
  });

  return result.toUIMessageStreamResponse({
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
  });
});

export default app;
