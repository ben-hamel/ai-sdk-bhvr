import { createBrowserRouter } from "react-router";
import Home from "@/components/Home";
import { ChatPage } from "@/app/routes/chat-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/chat/:chatId",
    Component: ChatPage,
  },
]);
