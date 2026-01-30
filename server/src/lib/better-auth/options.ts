import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions = {
  appName: "ai-sdk-bhvr",
  /**
   * Base path for Better Auth.
   * @default "/api/auth"
   */
  // basePath: "/api",
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin()],
} satisfies BetterAuthOptions;
