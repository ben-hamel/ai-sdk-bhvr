import { createBrowserRouter } from "react-router";
import Home from "@/components/Home";
import { ChatPage } from "@/app/routes/chat-page";
import { UsersPage } from "@/app/routes/users-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/chat/:chatId",
    Component: ChatPage,
  },
  {
    path: "/users",
    Component: UsersPage,
  },
]);
