import { isAdminRole } from "@/lib/auth-roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SERVER_URL } from "@/constants";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useRouteLoaderData,
} from "react-router";

type ChatSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export const AiSdkPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const appLoaderData = useRouteLoaderData("app") as
    | { session?: { user?: { role?: string | null } } }
    | undefined;
  const isAdmin = isAdminRole(appLoaderData?.session?.user?.role);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);

  const { data: chats, isLoading: isLoadingChats } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await fetch(`${SERVER_URL}/api/v1/chats`);
      if (!response.ok) {
        throw new Error("Failed to load chats");
      }
      return (await response.json()) as ChatSummary[];
    },
    enabled: isAdmin,
  });

  const handleDeleteChat = async (chatId: string) => {
    if (!isAdmin || deletingChatId || renamingChatId) {
      return;
    }

    try {
      setDeletingChatId(chatId);
      const response = await fetch(`${SERVER_URL}/api/v1/chats/${chatId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.removeQueries({ queryKey: ["chat", chatId] });
      if (location.pathname === `/app/ai-sdk/chat/${chatId}`) {
        navigate("/app/ai-sdk");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleRenameChat = async (chat: ChatSummary) => {
    if (!isAdmin || deletingChatId || renamingChatId) {
      return;
    }

    const currentTitle = chat.title ?? "";
    const nextTitle = window.prompt("Rename chat", currentTitle);
    if (nextTitle === null) {
      return;
    }

    const normalizedTitle = nextTitle.trim();
    const optimisticTitle = normalizedTitle.length ? normalizedTitle : null;
    const normalizedCurrentTitle = currentTitle.trim();
    const currentComparableTitle = normalizedCurrentTitle.length
      ? normalizedCurrentTitle
      : null;

    if (optimisticTitle === currentComparableTitle) {
      return;
    }

    const previousChats = queryClient.getQueryData<ChatSummary[]>(["chats"]);

    try {
      setRenamingChatId(chat.id);
      queryClient.setQueryData<ChatSummary[]>(["chats"], (existingChats) => {
        if (!existingChats) {
          return existingChats;
        }

        return existingChats.map((existingChat) =>
          existingChat.id === chat.id
            ? {
                ...existingChat,
                title: optimisticTitle,
                updatedAt: new Date().toISOString(),
              }
            : existingChat,
        );
      });

      const response = await fetch(`${SERVER_URL}/api/v1/chats/${chat.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: nextTitle }),
      });
      if (!response.ok) {
        throw new Error("Failed to rename chat");
      }

      void queryClient.invalidateQueries({ queryKey: ["chats"] });
    } catch (error) {
      console.error(error);
      queryClient.setQueryData(["chats"], previousChats);
    } finally {
      setRenamingChatId(null);
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-80 shrink-0 border-r bg-muted/30">
        <div className="flex h-full flex-col gap-4 p-4">
          {isAdmin ? (
            <Button
              onClick={() => navigate("/app/ai-sdk")}
              className="mb-2 w-full"
              variant="default"
            >
              New Chat
            </Button>
          ) : null}

          <div className="min-h-0 flex-1 space-y-2 border-t pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recent chats
            </p>
            <div className="h-full overflow-y-auto pr-1">
              {isLoadingChats ? (
                <p className="px-2 py-1 text-sm text-muted-foreground">
                  Loading chats...
                </p>
              ) : chats?.length ? (
                <div className="space-y-1">
                  {chats.map((chat) => {
                    const displayTitle = chat.title?.trim() || "New Chat";
                    return (
                      <div
                      key={chat.id}
                      className={cn(
                        "flex items-start gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-background/70 hover:text-foreground",
                        location.pathname === `/app/ai-sdk/chat/${chat.id}` &&
                          "bg-background font-medium text-foreground",
                      )}
                    >
                      <Link
                        to={`/app/ai-sdk/chat/${chat.id}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate">
                          {displayTitle}
                        </p>
                      </Link>
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="shrink-0"
                              disabled={Boolean(deletingChatId || renamingChatId)}
                              aria-label={`Open actions for chat ${chat.id.slice(0, 8)}`}
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={Boolean(deletingChatId || renamingChatId)}
                              onSelect={() => {
                                void handleRenameChat(chat);
                              }}
                            >
                              {renamingChatId === chat.id ? "Renaming..." : "Rename"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={Boolean(deletingChatId || renamingChatId)}
                              onSelect={() => {
                                void handleDeleteChat(chat.id);
                              }}
                            >
                              {deletingChatId === chat.id ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-2 py-1 text-sm text-muted-foreground">
                  No chats yet
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
};

export const AiSdkIndexPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const appLoaderData = useRouteLoaderData("app") as
    | { session?: { user?: { role?: string | null } } }
    | undefined;
  const [text, setText] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const isAdmin = isAdminRole(appLoaderData?.session?.user?.role);

  const handleSubmit = async (message: PromptInputMessage) => {
    const initialMessageText = message.text?.trim() ?? "";
    if (!isAdmin || !initialMessageText || isStartingChat) {
      return;
    }

    try {
      setIsStartingChat(true);
      const response = await fetch(`${SERVER_URL}/api/v1/chats`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = (await response.json()) as { id?: string };
      if (!data.id) {
        throw new Error("Chat id not returned");
      }
      const chatId = data.id;

      const nowIso = new Date().toISOString();
      queryClient.setQueryData<ChatSummary[]>(["chats"], (existingChats) => {
        const nextChat: ChatSummary = {
          id: chatId,
          title: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        if (!existingChats?.length) {
          return [nextChat];
        }

        if (existingChats.some((chat) => chat.id === chatId)) {
          return existingChats;
        }

        return [nextChat, ...existingChats];
      });

      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate(`/app/ai-sdk/chat/${chatId}`, {
        state: { initialMessageText },
      });
      setText("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-semibold">AI SDK Chat</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have access to this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-semibold">AI SDK Chat</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your chat will be created when you send your first message.
            </p>
          </div>
        </div>
        <PromptInput onSubmit={handleSubmit} className="mt-3">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit
              disabled={!text.trim() || isStartingChat}
              status={isStartingChat ? "submitted" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
