import { SERVER_URL } from "@/constants";
import { queryOptions } from "@tanstack/react-query";

export type ChatSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export const chatsQueryOptions = (isAdmin: boolean) =>
  queryOptions({
    queryKey: ["chats"],
    queryFn: async (): Promise<ChatSummary[]> => {
      const response = await fetch(`${SERVER_URL}/api/v1/chats`);
      if (!response.ok) {
        throw new Error("Failed to load chats");
      }
      return response.json();
    },
    enabled: isAdmin,
  });
