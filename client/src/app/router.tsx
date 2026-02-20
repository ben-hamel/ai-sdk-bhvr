import { createBrowserRouter, redirect } from "react-router";
import { AdminPage, adminLoader } from "@/app/routes/admin-page";
import { AiSdkIndexPage, AiSdkPage } from "@/app/routes/ai-sdk-page";
import { AppIndexPage } from "@/app/routes/app-index-page";
import { AppLayout, appLoader } from "@/app/routes/app-layout";
import { ChatPage } from "@/app/routes/chat-page";
import { LoginPage } from "@/app/routes/login-page";
import { MastraPage } from "@/app/routes/mastra-page";
import { NotFoundPage } from "@/app/routes/not-found";
import { SignUpPage } from "@/app/routes/signup-page";
import Home from "@/components/Home";
import { authClient } from "@/lib/auth-client";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: async () => {
      const { data: session } = await authClient.getSession();
      if (session) {
        return redirect("/app");
      }
      return null;
    },
    Component: Home,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignUpPage,
  },
  {
    path: "/app",
    id: "app",
    Component: AppLayout,
    loader: appLoader,
    shouldRevalidate: () => false,
    children: [
      {
        index: true,
        Component: AppIndexPage,
      },
      {
        path: "ai-sdk",
        Component: AiSdkPage,
        children: [
          {
            index: true,
            Component: AiSdkIndexPage,
          },
          {
            path: "chat/:chatId",
            Component: ChatPage,
            errorElement: <NotFoundPage />,
          },
        ],
      },
      {
        path: "mastra",
        Component: MastraPage,
      },
    ],
  },
  {
    path: "/admin",
    Component: AdminPage,
    loader: adminLoader,
    errorElement: <NotFoundPage />,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
