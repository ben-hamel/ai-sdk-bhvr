import type { UIMessage } from "ai";
import { z } from "zod";

export type ApiResponse = {
  message: string;
  success: true;
};

export const messageMetadataSchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type CustomMessage = UIMessage<MessageMetadata>;
