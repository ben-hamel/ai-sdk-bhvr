import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/hello", async (c) => {
  const data: ApiResponse = {
    message: "Hello from Me 4",
    success: true,
  };

  return c.json(data, { status: 200 });
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
