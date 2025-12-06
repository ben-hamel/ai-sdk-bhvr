import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export const SignUpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md p-6 text-center">
        <h1 className="mb-4 text-3xl font-bold">Coming Soon</h1>
        <p className="mb-6 text-muted-foreground">
          Sign up is not available yet. We're working hard to bring you the best
          experience.
        </p>
        <Button onClick={() => navigate("/login")} variant="outline">
          Back to Login
        </Button>
      </div>
    </div>
  );
};
