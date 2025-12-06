import type { BetterAuthOptions } from "better-auth";

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions: BetterAuthOptions = {
  appName: "ai-sdk-bhvr",
  /**
   * Base path for Better Auth.
   * @default "/api/auth"
   */
  // basePath: "/api",
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
};
