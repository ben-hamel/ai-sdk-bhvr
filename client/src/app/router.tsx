import { createBrowserRouter } from "react-router";
import Home from "@/components/Home";

const Test = () => {
  return <div>Test</div>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/chat",
    Component: Test,
  },
]);
