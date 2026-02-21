import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { SERVER_URL } from "@/constants";

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  plugins: [adminClient(), organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
});
