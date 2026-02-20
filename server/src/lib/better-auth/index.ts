import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../db/schema/auth";
import { betterAuthOptions } from "./options";
export const auth = () => {
  return betterAuth({
    ...betterAuthOptions,
    database: drizzleAdapter(drizzle(env.HYPERDRIVE.connectionString), {
      provider: "pg",
      schema,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CORS_ORIGIN || ""],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    advanced: {
      cookies: {
        state: {
          attributes: {
            sameSite: "none",
            secure: true,
          },
        },
      },
    },
  });
};
