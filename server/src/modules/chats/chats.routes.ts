import { Hono } from "hono";
import type { UIMessage } from "ai";
import * as chatService from "./chats.service";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DATABASE_URL: string;
};

const chats = new Hono<{ Bindings: Bindings }>();

// Get all chats
chats.get("/", async (c) => {
  try {
    const allChats = await chatService.getAllChats(c.env.DATABASE_URL);
    return c.json(allChats);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
});

// Create new chat
chats.post("/", async (c) => {
  try {
    const chat = await chatService.createChat(c.env.DATABASE_URL);
    return c.json(chat);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create chat" }, { status: 500 });
  }
});

// Get chat history by chat ID
chats.get("/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");

  try {
    const messages = await chatService.getChatMessages(chatId, c.env.DATABASE_URL);
    return c.json(messages);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
});

// Chat streaming endpoint
chats.post("/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");
  const { messages }: { messages: UIMessage[] } = await c.req.json();

  try {
    return await chatService.streamChatMessages(
      chatId,
      messages,
      c.env.DATABASE_URL,
      c.env.GOOGLE_GENERATIVE_AI_API_KEY,
    );
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to stream messages" }, { status: 500 });
  }
});

export default chats;
