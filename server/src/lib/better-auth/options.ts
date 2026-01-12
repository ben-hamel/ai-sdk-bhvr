import type { BetterAuthOptions } from "better-auth";
import { oAuthProxy } from "better-auth/plugins";

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions: BetterAuthOptions = {
  appName: "ai-sdk-bhvr",
  plugins: [oAuthProxy()],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  /**
   * Base path for Better Auth.
   * @default "/api/auth"
   */
  // basePath: "/api",
  emailAndPassword: {
    enabled: true,
  },
};