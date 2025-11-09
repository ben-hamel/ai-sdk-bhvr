import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Chat sessions table
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table (AI SDK compatible)
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["user", "assistant", "system", "tool"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      chatIdIdx: index("idx_messages_chat_id").on(table.chatId),
      createdAtIdx: index("idx_messages_created_at").on(table.createdAt),
      chatIdCreatedAtIdx: index("idx_messages_chat_id_created_at").on(
        table.chatId,
        table.createdAt
      ),
    };
  }
);
