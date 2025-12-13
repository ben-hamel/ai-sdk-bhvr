import type { BetterAuthOptions } from "better-auth";

export const betterAuthOptions: BetterAuthOptions = {
  appName: "ai-sdk-bhvr",
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
};
