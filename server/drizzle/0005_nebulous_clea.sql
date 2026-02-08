CREATE SCHEMA IF NOT EXISTS "aisdk";
--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "valid_text_part";--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "valid_reasoning_part";--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "valid_image_part";--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "valid_file_part";--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "valid_tool_call_part";--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "valid_tool_result_part";--> statement-breakpoint
ALTER TABLE "aisdk"."messages" DROP CONSTRAINT "messages_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "aisdk"."parts" DROP CONSTRAINT "parts_message_id_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "aisdk"."messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "aisdk"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "parts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "aisdk"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "valid_text_part" CHECK ("aisdk"."parts"."type" != 'text' OR "aisdk"."parts"."text_content" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "valid_reasoning_part" CHECK ("aisdk"."parts"."type" != 'reasoning' OR "aisdk"."parts"."reasoning_content" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "valid_image_part" CHECK ("aisdk"."parts"."type" != 'image' OR "aisdk"."parts"."image_url" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "valid_file_part" CHECK ("aisdk"."parts"."type" != 'file' OR ("aisdk"."parts"."file_url" IS NOT NULL AND "aisdk"."parts"."file_name" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "valid_tool_call_part" CHECK ("aisdk"."parts"."type" != 'tool-call' OR ("aisdk"."parts"."tool_call_id" IS NOT NULL AND "aisdk"."parts"."tool_call_name" IS NOT NULL AND "aisdk"."parts"."tool_call_args" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "aisdk"."parts" ADD CONSTRAINT "valid_tool_result_part" CHECK ("aisdk"."parts"."type" != 'tool-result' OR ("aisdk"."parts"."tool_result_id" IS NOT NULL AND "aisdk"."parts"."tool_result_result" IS NOT NULL));
