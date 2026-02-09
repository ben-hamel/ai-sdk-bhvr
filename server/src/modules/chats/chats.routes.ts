import { Hono } from "hono";
import type { UIMessage } from "ai";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as chatService from "./chats.service";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  HYPERDRIVE: Hyperdrive;
};

const app = new Hono<{ Bindings: Bindings }>();

// Get all chats
app.get("/", async (c) => {
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });
  await client.connect();
  const db = drizzle(client);

  try {
    const allChats = await chatService.getAllChats(db);
    return c.json(allChats);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch chats" }, { status: 500 });
  } finally {
    await client.end();
  }
});

// Create new chat
app.post("/", async (c) => {
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });
  await client.connect();
  const db = drizzle(client);

  try {
    const chat = await chatService.createChat(db);
    return c.json(chat);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create chat" }, { status: 500 });
  } finally {
    await client.end();
  }
});

// Get chat history by chat ID
app.get("/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });
  await client.connect();
  const db = drizzle(client);

  try {
    const messages = await chatService.getChatMessages(db, chatId);
    return c.json(messages);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch messages" }, { status: 500 });
  } finally {
    await client.end();
  }
});

// Chat streaming endpoint
app.post("/:chatId/messages", async (c) => {
  const chatId = c.req.param("chatId");
  const { messages }: { messages: UIMessage[] } = await c.req.json();
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });
  await client.connect();
  const db = drizzle(client);

  try {
    return await chatService.streamChatMessages(
      db,
      chatId,
      messages,
      c.env.GOOGLE_GENERATIVE_AI_API_KEY,
      () => client.end(),
    );
  } catch (error) {
    console.error(error);
    await client.end();
    return c.json({ error: "Failed to stream messages" }, { status: 500 });
  }
});

export default app;
