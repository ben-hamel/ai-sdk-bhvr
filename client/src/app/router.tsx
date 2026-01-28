import { createBrowserRouter } from "react-router";
import Home from "@/components/Home";
import { ChatPage } from "@/app/routes/chat-page";
import { LoginPage } from "@/app/routes/login-page";
import { SignUpPage } from "@/app/routes/signup-page";
import { AppPage, appLoader } from "@/app/routes/app-page";
import { NotFoundPage } from "@/app/routes/not-found";

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
    loader: appLoader,
    children: [
      {
        path: "chat/:chatId",
        Component: ChatPage,
      },
    ],
  },
  {
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
