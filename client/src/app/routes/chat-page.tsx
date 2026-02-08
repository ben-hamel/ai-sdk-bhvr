import {
  Context,
  ContextContent,
  ContextContentHeader,
  ContextTrigger,
} from "@/components/ai-elements/context";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { SERVER_URL } from "@/constants";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import type { CustomMessage } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/auth-roles";

export async function chatLoader() {
  const { data: session } = await authClient.getSession();
  if (!session || !isAdminRole(session.user?.role)) {
    throw new globalThis.Response("Not Found", { status: 404 });
  }

  return { session };
}

const ChatAttachments = () => {
  const { files, remove } = usePromptInputAttachments();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 px-2 pt-2">
      {files.map((attachment) => (
        <div
          key={attachment.id}
          className="inline-flex max-w-56 items-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs"
        >
          <span className="truncate">{attachment.filename}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => remove(attachment.id)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};

export const ChatPage = () => {
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { chatId } = useParams<{ chatId: string }>();

  const { messages, status, sendMessage, setMessages } = useChat<CustomMessage>(
    {
      transport: new DefaultChatTransport({
        api: `${SERVER_URL}/api/v1/chats/${chatId}/messages`,
      }),
    },
  );

  // Load chat history when chatId is present using TanStack Query
  const { data: chatHistory } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const res = await fetch(`${SERVER_URL}/api/v1/chats/${chatId}/messages`);
      if (!res.ok) {
        throw new Error("Failed to load chat history");
      }
      return res.json() as Promise<CustomMessage[]>;
    },
    enabled: !!chatId,
  });

  // Set messages when chat history is loaded
  useEffect(() => {
    if (chatHistory) {
      console.log("Loaded chat history:", chatHistory);
      setMessages(chatHistory);
    }
  }, [chatHistory, setMessages]);

  const tokenUsage = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        return {
          inputTokens: acc.inputTokens + (message.metadata?.inputTokens || 0),
          outputTokens:
            acc.outputTokens + (message.metadata?.outputTokens || 0),
          totalTokens: acc.totalTokens + (message.metadata?.totalTokens || 0),
        };
      },
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    );
  }, [messages]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          chatId,
          webSearch: false,
        },
      },
    );
    setText("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          globalDrop
          multiple
        >
          <PromptInputBody>
            <ChatAttachments />
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              ref={textareaRef}
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <Context
                maxTokens={1_114_112}
                usage={{
                  inputTokens: tokenUsage.inputTokens,
                  inputTokenDetails: {
                    noCacheTokens: tokenUsage.inputTokens,
                    cacheReadTokens: 0,
                    cacheWriteTokens: 0,
                  },
                  outputTokens: tokenUsage.outputTokens,
                  outputTokenDetails: {
                    textTokens: tokenUsage.outputTokens,
                    reasoningTokens: 0,
                  },
                  totalTokens: tokenUsage.totalTokens,
                  cachedInputTokens: 0,
                  reasoningTokens: 0,
                }}
                usedTokens={tokenUsage.totalTokens}
              >
                <ContextTrigger />
                <ContextContent>
                  <ContextContentHeader />
                </ContextContent>
              </Context>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
