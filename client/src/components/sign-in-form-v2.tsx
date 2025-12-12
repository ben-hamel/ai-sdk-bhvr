import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useNavigate } from "react-router";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInFormV2({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate();
  const { isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await authClient.signIn.email(
      {
        email,
        password,
        // callbackURL: "/app", // dont use this, it cause full page reload
        rememberMe: false,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          navigate("/app");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Failed to sign in");
          setIsLoading(false);
        },
      }
    );

    if (signInError) {
      setError(signInError.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
            autoComplete="current-password"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !email || !password}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="text-indigo-600 hover:text-indigo-800"
          disabled={isLoading}
        >
          Need an account? Sign Up
        </Button>
      </div>
    </div>
  );
}
