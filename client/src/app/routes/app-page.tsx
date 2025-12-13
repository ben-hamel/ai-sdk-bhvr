import { authClient } from "@/lib/auth-client";
import { Outlet, redirect, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export async function appLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    return redirect("/login");
  }
  return { session };
}

export const AppPage = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">App</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
