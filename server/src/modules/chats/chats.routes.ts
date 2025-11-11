import { Hono } from "hono";
import type { UIMessage } from "ai";
import { createDb } from "../../db";
import * as chatService from "./chats.service";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Get all chats
app.get("/", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const allChats = await chatService.getAllChats(db);
    return c.json(allChats);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
});

// Create new chat
app.post("/", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const chat = await chatService.createChat(db);
    return c.json(chat);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create chat" }, { status: 500 });
  }
});

// Get chat history by chat ID
app.get("/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");

  try {
    const db = createDb(c.env.DATABASE_URL);
    const messages = await chatService.getChatMessages(db, chatId);
    return c.json(messages);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
});

// Chat streaming endpoint
app.post("/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");
  const { messages }: { messages: UIMessage[] } = await c.req.json();

  try {
    const db = createDb(c.env.DATABASE_URL);
    return await chatService.streamChatMessages(
      db,
      chatId,
      messages,
      c.env.GOOGLE_GENERATIVE_AI_API_KEY,
    );
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to stream messages" }, { status: 500 });
  }
});

export default app;
