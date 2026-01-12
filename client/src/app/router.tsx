import { createBrowserRouter } from "react-router";
import Home from "@/components/Home";
import { ChatPage } from "@/app/routes/chat-page";
import { LoginPage } from "@/app/routes/login-page";
import { SignUpPage } from "@/app/routes/signup-page";
import { AppPage, appLoader } from "@/app/routes/app-page";
import { GooberPage } from "@/app/routes/goober-page";

export const router = createBrowserRouter([
  {
    path: "/",
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
    path: "/goober",
    Component: GooberPage,
  },
  {
    path: "/app",
    Component: AppPage,
    loader: appLoader,
    children: [
      {
        path: "chat/:chatId",
        Component: ChatPage,
      },
    ],
  },
]);
