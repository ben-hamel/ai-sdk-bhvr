import { authClient } from "@/lib/auth-client";
import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";

export const AppPage = () => {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (!session && !isPending) {
  //     navigate("/login");
  //   }
  // }, [session, isPending, navigate]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/");
        },
      },
    });
  };

  if (isPending) {
    return <Loader />;
  }

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
