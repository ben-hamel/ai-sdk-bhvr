import { createBrowserRouter } from "react-router";
import Home from "@/components/Home";
import { ChatPage } from "@/app/routes/chat-page";
import { LoginPage } from "@/app/routes/login-page";
import { SignUpPage } from "@/app/routes/signup-page";
import { AppPage } from "@/app/routes/app-page";

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
    path: "/app",
    Component: AppPage,
    children: [
      {
        path: "chat/:chatId",
        Component: ChatPage,
      },
    ],
  },
]);
