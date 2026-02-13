import {
  index,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const aisdk = pgSchema("aisdk");

// Chat sessions table
export const chats = aisdk.table("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table (AI SDK compatible)
export const messages = aisdk.table(
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
        table.createdAt,
      ),
    };
  },
);
