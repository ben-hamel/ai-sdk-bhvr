import { useChat } from "@ai-sdk/react";
import type { CustomMessage } from "@shared/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useRouteLoaderData,
} from "react-router";
import { NotFoundPage } from "@/app/routes/not-found";
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
import { Spinner } from "@/components/ui/spinner";
import { SERVER_URL } from "@/constants";
import { isAdminRole } from "@/lib/auth-roles";

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
  const appLoaderData = useRouteLoaderData("app") as
    | { session?: { user?: { role?: string | null } } }
    | undefined;
  const isAdmin = isAdminRole(appLoaderData?.session?.user?.role);

  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasSentInitialMessage = useRef(false);
  const initialMessageText =
    (location.state as { initialMessageText?: string } | null)
      ?.initialMessageText ?? null;

  const { messages, status, sendMessage, setMessages } = useChat<CustomMessage>(
    {
      transport: new DefaultChatTransport({
        api: `${SERVER_URL}/api/v1/chats/${chatId}/messages`,
      }),
      onFinish: () => {
        void queryClient.invalidateQueries({ queryKey: ["chats"] });
      },
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
    enabled: isAdmin && !!chatId,
  });

  // Set messages when chat history is loaded
  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory);
    }
  }, [chatHistory, setMessages]);

  useEffect(() => {
    if (
      !isAdmin ||
      !chatId ||
      !chatHistory ||
      !initialMessageText ||
      hasSentInitialMessage.current
    ) {
      return;
    }

    hasSentInitialMessage.current = true;
    if (chatHistory.length === 0) {
      sendMessage(
        {
          text: initialMessageText,
        },
        {
          body: {
            chatId,
            webSearch: false,
          },
        },
      );
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [
    chatHistory,
    chatId,
    initialMessageText,
    isAdmin,
    location.pathname,
    navigate,
    sendMessage,
  ]);

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

  const isResponding = status === "submitted" || status === "streaming";
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;
  const lastAssistantHasText =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some(
      (part: CustomMessage["parts"][number]) =>
        part.type === "text" && part.text.trim().length > 0,
    );
  const showStreamingIndicator = isResponding && !lastAssistantHasText;

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (chatId) {
      const nowIso = new Date().toISOString();
      queryClient.setQueryData<
        Array<{
          id: string;
          title: string | null;
          createdAt: string;
          updatedAt: string;
        }>
      >(["chats"], (existingChats) => {
        if (!existingChats?.length) {
          return existingChats;
        }

        const target = existingChats.find((chat) => chat.id === chatId);
        if (!target) {
          return existingChats;
        }

        const movedChat = {
          ...target,
          updatedAt: nowIso,
        };

        return [
          movedChat,
          ...existingChats.filter((chat) => chat.id !== chatId),
        ];
      });
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

  if (!isAdmin) {
    return <NotFoundPage />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
        <Conversation className="min-h-0">
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
            {showStreamingIndicator ? (
              <Message from="assistant">
                <MessageContent>
                  <div
                    className="inline-flex items-center text-muted-foreground"
                    aria-live="polite"
                  >
                    <Spinner className="size-4" />
                  </div>
                </MessageContent>
              </Message>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={handleSubmit}
          className="mt-3"
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
            <PromptInputSubmit
              disabled={
                !text.trim() || status === "submitted" || status === "streaming"
              }
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
