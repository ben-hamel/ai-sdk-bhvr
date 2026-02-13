import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, Outlet, redirect, useLocation, useNavigate } from "react-router";

export async function appLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    return redirect("/login");
  }
  return { session };
}

export const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAiSdkSection = location.pathname.startsWith("/app/ai-sdk");
  const isMastraSection = location.pathname.startsWith("/app/mastra");

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login");
        },
      },
    });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/app" className="text-base font-semibold tracking-tight">
              App
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                to="/app/ai-sdk"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isAiSdkSection && "bg-muted text-foreground",
                )}
              >
                AI SDK Chat
              </Link>
              <Link
                to="/app/mastra"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isMastraSection && "bg-muted text-foreground",
                )}
              >
                Mastra
              </Link>
            </nav>
          </div>
          <Button onClick={handleSignOut} size="sm" variant="outline">
            Sign Out
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
};
