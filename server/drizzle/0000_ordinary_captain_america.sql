CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" text NOT NULL,
	"type" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"text_content" text,
	"reasoning_content" text,
	"image_url" text,
	"image_mime_type" text,
	"file_url" text,
	"file_name" text,
	"file_mime_type" text,
	"tool_call_id" text,
	"tool_call_name" text,
	"tool_call_args" jsonb,
	"tool_result_id" text,
	"tool_result_name" text,
	"tool_result_result" jsonb,
	"tool_result_is_error" boolean,
	"provider_metadata" jsonb,
	CONSTRAINT "valid_text_part" CHECK ("parts"."type" != 'text' OR "parts"."text_content" IS NOT NULL),
	CONSTRAINT "valid_reasoning_part" CHECK ("parts"."type" != 'reasoning' OR "parts"."reasoning_content" IS NOT NULL),
	CONSTRAINT "valid_image_part" CHECK ("parts"."type" != 'image' OR "parts"."image_url" IS NOT NULL),
	CONSTRAINT "valid_file_part" CHECK ("parts"."type" != 'file' OR ("parts"."file_url" IS NOT NULL AND "parts"."file_name" IS NOT NULL)),
	CONSTRAINT "valid_tool_call_part" CHECK ("parts"."type" != 'tool-call' OR ("parts"."tool_call_id" IS NOT NULL AND "parts"."tool_call_name" IS NOT NULL AND "parts"."tool_call_args" IS NOT NULL)),
	CONSTRAINT "valid_tool_result_part" CHECK ("parts"."type" != 'tool-result' OR ("parts"."tool_result_id" IS NOT NULL AND "parts"."tool_result_result" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_chat_id" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_chat_id_created_at" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_parts_message_id" ON "parts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_parts_message_id_order" ON "parts" USING btree ("message_id","order");