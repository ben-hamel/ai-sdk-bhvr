import { authClient } from "@/lib/auth-client";
import { Outlet, redirect, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { SERVER_URL } from "@/constants";
import { isAdminRole } from "@/lib/auth-roles";
import { useState } from "react";

export async function appLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    return redirect("/login");
  }
  return { session };
}

export const AppPage = () => {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const isAdmin = isAdminRole(session?.user?.role);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login");
        },
      },
    });
  };

  const handleNewChat = async () => {
    if (!isAdmin || isCreatingChat) {
      return;
    }

    try {
      setIsCreatingChat(true);
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

      navigate(`/app/chat/${data.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">App</h1>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button onClick={handleNewChat} variant="default">
                {isCreatingChat ? "Creating..." : "New Chat"}
              </Button>
            ) : null}
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
