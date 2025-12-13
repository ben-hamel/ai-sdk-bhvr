import { createAuthClient } from "better-auth/react";
import { SERVER_URL } from "@/constants";

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  fetchOptions: {
    credentials: "include",
  },
});
